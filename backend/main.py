from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

from dotenv import load_dotenv

load_dotenv()

from agents.bug_detector import detect_bugs
from agents.security_scanner import scan_security
from agents.optimizer import optimize_code
from agents.complexity_analyzer import analyze_complexity
from indexer import index_code, index_github_repo
from search import search_code

app = FastAPI(title="AI Code Reviewer API")

# Allow React frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewRequest(BaseModel):
    code: str
    language: str = "Python"

class ReviewResponse(BaseModel):
    overall_score: int
    bugs: list
    security: list
    optimizations: list
    complexity: dict
    fixed_code: str = ""
    summary: str = ""


class IndexRequest(BaseModel):
    code: str
    filename: str
    language: str = ""


class GithubIndexRequest(BaseModel):
    github_url: str


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

@app.get("/")
def root():
    return {"status": "AI Code Reviewer is running"}


@app.post("/index")
def index_code_route(request: IndexRequest):
    try:
        return index_code(request.code, request.filename, request.language)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {error}") from error


@app.post("/index/github")
def index_github_route(request: GithubIndexRequest):
    try:
        return index_github_repo(request.github_url)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"GitHub indexing failed: {error}") from error


@app.post("/search")
def search_route(request: SearchRequest):
    try:
        return search_code(request.query, request.top_k)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Search failed: {error}") from error

@app.post("/review", response_model=ReviewResponse)
async def review_code(request: ReviewRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    if len(request.code) > 10000:
        raise HTTPException(status_code=400, detail="Code too long. Max 10,000 characters.")

    # Run all 4 agents in parallel
    bugs, security, optimizations, complexity = await asyncio.gather(
        detect_bugs(request.code, request.language),
        scan_security(request.code, request.language),
        optimize_code(request.code, request.language),
        analyze_complexity(request.code, request.language),
    )

    # Calculate overall score
    bug_penalty      = len(bugs) * 15
    security_penalty = len(security) * 20
    opt_penalty      = len(optimizations) * 5
    overall_score    = max(0, 100 - bug_penalty - security_penalty - opt_penalty)

    # Get fixed code from optimizer agent
    fixed_code = optimizations[0].get("fixed_code", "") if optimizations else ""

    summary = build_summary(bugs, security, optimizations, overall_score)

    return ReviewResponse(
        overall_score=overall_score,
        bugs=bugs,
        security=security,
        optimizations=optimizations,
        complexity=complexity,
        fixed_code=fixed_code,
        summary=summary,
    )

def build_summary(bugs, security, optimizations, score):
    parts = []
    if bugs:
        parts.append(f"{len(bugs)} bug(s) found")
    if security:
        parts.append(f"{len(security)} security issue(s)")
    if optimizations:
        parts.append(f"{len(optimizations)} optimization(s) suggested")
    if not parts:
        return "Code looks clean! No major issues found."
    return f"Score: {score}/100 — " + ", ".join(parts) + "."
