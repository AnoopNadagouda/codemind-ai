import base64
import os
import re
from pathlib import Path
from typing import Dict, List, Tuple
from uuid import uuid4

import chromadb
from github import Github
from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"
COLLECTION_NAME = "codemind"
CHROMA_DIR = str((Path(__file__).resolve().parent / ".codemind_chroma").resolve())

_model = None
_collection = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = client.get_or_create_collection(name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"})
    return _collection


def detect_language(filename: str, language: str = "") -> str:
    if language and language.strip():
        return language.strip()

    extension = Path(filename).suffix.lower()
    return {
        ".py": "Python",
        ".js": "JavaScript",
        ".ts": "TypeScript",
        ".java": "Java",
        ".cpp": "C++",
        ".cc": "C++",
        ".cxx": "C++",
        ".go": "Go",
    }.get(extension, "Text")


def index_code(code: str, filename: str, language: str = "") -> Dict[str, object]:
    if not code.strip():
        raise ValueError("Code cannot be empty")

    normalized_language = detect_language(filename, language)
    chunks = chunk_code(code, normalized_language)
    model = get_model()
    collection = get_collection()

    chunk_texts = [chunk["code"] for chunk in chunks]
    vectors = model.encode(chunk_texts).tolist()

    ids = []
    metadatas = []
    for chunk in chunks:
        ids.append(f"{filename}:{chunk['start_line']}:{uuid4().hex[:8]}")
        metadatas.append(
            {
                "filename": filename,
                "language": normalized_language,
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
            }
        )

    collection.upsert(
        ids=ids,
        documents=chunk_texts,
        embeddings=vectors,
        metadatas=metadatas,
    )

    return {"chunks_indexed": len(chunks), "status": "success"}


def index_github_repo(github_url: str) -> Dict[str, object]:
    full_name = parse_repo_full_name(github_url)
    github_token = os.environ.get("GITHUB_TOKEN")
    github = Github(github_token) if github_token else Github()
    repo = github.get_repo(full_name)

    files_processed = 0
    chunks_indexed = 0
    queue = list(repo.get_contents(""))

    while queue:
        item = queue.pop(0)

        if item.type == "dir":
            queue.extend(repo.get_contents(item.path))
            continue

        if not is_supported_code_file(item.path):
            continue

        decoded = decode_file_content(item.content)
        if not decoded.strip():
            continue

        language = detect_language(item.path)
        result = index_code(decoded, item.path, language)
        files_processed += 1
        chunks_indexed += int(result["chunks_indexed"])

    return {
        "chunks_indexed": chunks_indexed,
        "files_processed": files_processed,
        "status": "success",
    }


def parse_repo_full_name(github_url: str) -> str:
    cleaned = github_url.strip().rstrip("/")
    if cleaned.endswith(".git"):
        cleaned = cleaned[:-4]

    match = re.search(r"github\.com[:/]([^/]+/[^/]+)$", cleaned)
    if not match:
        raise ValueError("Invalid GitHub URL. Use format: https://github.com/owner/repo")

    return match.group(1)


def is_supported_code_file(path: str) -> bool:
    extension = Path(path).suffix.lower()
    return extension in {".py", ".js", ".ts", ".java", ".cpp", ".cc", ".cxx"}


def decode_file_content(encoded_content: str) -> str:
    if not encoded_content:
        return ""
    return base64.b64decode(encoded_content).decode("utf-8", errors="ignore")


def chunk_code(code: str, language: str, fallback_size: int = 30) -> List[Dict[str, object]]:
    lines = code.splitlines()
    if not lines:
        return [{"code": code, "start_line": 1, "end_line": 1}]

    block_chunks = extract_language_blocks(lines, language)
    if block_chunks:
        return block_chunks

    return fallback_chunks(lines, fallback_size)


def extract_language_blocks(lines: List[str], language: str) -> List[Dict[str, object]]:
    starts = find_block_starts(lines, language)
    if not starts:
        return []

    blocks: List[Dict[str, object]] = []
    starts = sorted(set(starts))

    for index, start in enumerate(starts):
        end = starts[index + 1] if index + 1 < len(starts) else len(lines)
        chunk_lines = lines[start - 1 : end - 1 if index + 1 < len(starts) else end]
        text = "\n".join(chunk_lines).strip("\n")
        if text.strip():
            blocks.append({"code": text, "start_line": start, "end_line": max(start, end - 1)})

    return blocks


def find_block_starts(lines: List[str], language: str) -> List[int]:
    patterns = {
        "Python": [r"^\s*def\s+\w+", r"^\s*class\s+\w+"],
        "JavaScript": [r"^\s*function\s+\w+", r"^\s*(const|let|var)\s+\w+\s*=\s*\("],
        "TypeScript": [r"^\s*function\s+\w+", r"^\s*(export\s+)?(class|interface)\s+\w+"],
        "Java": [r"^\s*(public|private|protected)?\s*(static\s+)?\w[\w<>\[\]]*\s+\w+\s*\("],
        "C++": [r"^\s*\w[\w:\s*&<>]*\s+\w+\s*\("],
        "Go": [r"^\s*func\s+\w+", r"^\s*type\s+\w+\s+struct"],
    }

    start_patterns = patterns.get(language, [])
    if not start_patterns:
        return []

    starts: List[int] = []
    compiled = [re.compile(pattern) for pattern in start_patterns]
    for line_index, line in enumerate(lines, start=1):
        if any(regex.search(line) for regex in compiled):
            starts.append(line_index)

    return starts


def fallback_chunks(lines: List[str], size: int) -> List[Dict[str, object]]:
    chunks: List[Dict[str, object]] = []
    for start in range(0, len(lines), size):
        end = min(start + size, len(lines))
        text = "\n".join(lines[start:end]).strip("\n")
        if text.strip():
            chunks.append({"code": text, "start_line": start + 1, "end_line": end})
    return chunks