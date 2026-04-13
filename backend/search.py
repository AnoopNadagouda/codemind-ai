from typing import Dict

from indexer import get_collection, get_model


def search_code(query: str, top_k: int = 5) -> Dict[str, object]:
    if not query.strip():
        raise ValueError("Query cannot be empty")

    model = get_model()
    collection = get_collection()

    query_embedding = model.encode([query])[0].tolist()
    raw = collection.query(
        query_embeddings=[query_embedding],
        n_results=max(1, top_k),
        include=["documents", "metadatas", "distances"],
    )

    documents = raw.get("documents", [[]])[0]
    metadatas = raw.get("metadatas", [[]])[0]
    distances = raw.get("distances", [[]])[0]

    results = []
    for document, metadata, distance in zip(documents, metadatas, distances):
        similarity = 1.0 - float(distance)
        similarity = max(0.0, min(1.0, similarity))
        item_meta = metadata or {}
        results.append(
            {
                "code": document,
                "filename": item_meta.get("filename", "unknown"),
                "language": item_meta.get("language", "Text"),
                "start_line": item_meta.get("start_line", 1),
                "end_line": item_meta.get("end_line", 1),
                "similarity": round(similarity, 4),
            }
        )

    return {"results": results, "total": len(results)}