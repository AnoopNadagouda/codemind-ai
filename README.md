# CodeMind AI

> Autonomous code intelligence platform with multi-agent review + semantic code search, designed with a production-grade distributed architecture roadmap.

[![GitHub](https://img.shields.io/badge/GitHub-AnoopNadagouda-181717?style=for-the-badge&logo=github)](https://github.com/AnoopNadagouda/codemind-ai)

---

## What is CodeMind AI?

CodeMind AI combines two capabilities in one workflow:

1. Multi-agent code review (bugs, security, optimization, complexity)
2. Semantic code search across snippets and repositories

Core flow:

Search finds code -> one click sends it to reviewer -> all 4 agents analyze in parallel.

---

## Distributed Architecture

This project is being upgraded toward a production-grade architecture inspired by large-scale distributed systems patterns.

```
Frontend (React + Monaco)
    | WebSocket
    v
API Gateway (FastAPI)
   | Redis Pub/Sub      | gRPC
   v                    v
Room/Session Manager    AI Agent Microservices
    |
    v
PostgreSQL
```

### Current Scaffolded Pieces

- Prometheus metrics endpoint: `/metrics`
- Redis collaboration/session manager module: `backend/redis_manager.py`
- gRPC contract file: `proto/agents.proto`
- Dockerized local stack: `docker-compose.yml`

---

## Technology Upgrade Map

| Typical Approach | Distributed Systems Direction | Used in CodeMind |
|---|---|---|
| Basic WebSocket sync | Operational transforms / CRDT | Y.js + WebSocket (planned) |
| JSON-only contracts | Protocol Buffers | `proto/agents.proto` |
| Direct in-process service calls | gRPC service-to-service | gRPC contract scaffolded |
| In-memory room state | Redis Pub/Sub + session store | Redis manager scaffolded |
| Single-host deployment | Containerized distributed runtime | Docker + Compose added |
| No observability | Metrics-first operations | Prometheus endpoint added |

---

## Features

### Bug Detector Agent
- Finds logic errors and unsafe code paths
- Returns exact line-level findings

### Security Scanner Agent
- Detects SQL injection, XSS, and hardcoded secrets
- Maps issues to CWE/CVE-style categories

### Optimizer Agent
- Flags inefficient loops and data structures
- Suggests faster alternatives with fixed code output

### Complexity Analyzer Agent
- Calculates time and space complexity
- Generates interview-ready explanation text

### Semantic Code Search
- Natural language query to code retrieval
- Embeddings + ChromaDB pipeline

---

## Tech Stack

### Frontend
- React + Vite
- Monaco-based editing experience

### Backend
- FastAPI (Python)
- Anthropic Claude API (agent intelligence)
- ChromaDB + sentence-transformers (semantic search)
- PyGithub (repository indexing)
- Redis (session + pub/sub layer)
- Prometheus client (metrics)

### Deployment
- Vercel (frontend)
- Render (backend)
- Docker Compose for local distributed stack

---

## Getting Started Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- Anthropic API key from https://console.anthropic.com

### 1. Clone repository
```bash
git clone https://github.com/AnoopNadagouda/codemind-ai.git
cd codemind-ai
```

### 2. Start backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add ANTHROPIC_API_KEY in .env
uvicorn main:app --reload
```

### 3. Start frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open app
```text
http://localhost:5173
```

### 5. Run distributed stack with Docker Compose (optional)
```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Metrics: `http://localhost:8000/metrics`
- Redis: `localhost:6379`
- PostgreSQL: `localhost:5432`

### 6. Generate Python gRPC stubs (optional)
Run from `backend/`:
```bash
python -m grpc_tools.protoc -I ../proto --python_out=. --grpc_python_out=. ../proto/agents.proto
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Service status |
| GET | `/health` | Runtime health + Redis connectivity |
| GET | `/metrics` | Prometheus metrics |
| POST | `/review` | Multi-agent code analysis |
| POST | `/search` | Semantic code search |
| POST | `/index` | Index snippet |
| POST | `/index/github` | Index GitHub repository |

---

## Project Structure

```
codemind-ai/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── CodeEditor.jsx
│   │       ├── SearchTab.jsx
│   │       ├── IndexerTab.jsx
│   │       └── ReviewReport.jsx
│   └── Dockerfile
├── backend/
│   ├── main.py
│   ├── redis_manager.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── agents/
│       ├── bug_detector.py
│       ├── security_scanner.py
│       ├── optimizer.py
│       └── complexity_analyzer.py
├── proto/
│   └── agents.proto
└── docker-compose.yml
```

---

## Delivery Plan (Interview-Friendly)

1. Redis + WebSocket room sync (distributed session state)
2. CRDT-based collaborative editing with Y.js
3. gRPC microservices for independent agent scaling
4. Full Docker Compose runtime
5. Prometheus-first observability

---

## Resume Line

Built CodeMind AI, a distributed code intelligence platform with multi-agent analysis, semantic code search, Prometheus metrics, Redis-backed session sync, gRPC service contracts, and Dockerized local infrastructure. Designed for future CRDT-based collaborative editing and scalable microservice deployment.

---

## Author

**Anoop Nadagouda**
- GitHub: [@AnoopNadagouda](https://github.com/AnoopNadagouda)

---

## License

MIT License
