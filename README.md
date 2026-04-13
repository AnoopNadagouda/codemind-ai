# CodeMind AI 🧠

> An Autonomous Code Intelligence Platform — not just another AI chatbot wrapper.

[![GitHub](https://img.shields.io/badge/GitHub-AnoopNadagouda-181717?style=for-the-badge&logo=github)](https://github.com/AnoopNadagouda/codemind-ai)

---

## What is CodeMind AI?

CodeMind AI is a full-stack AI-powered developer tool that combines two superpowers in one seamless platform:

1. **Multi-Agent Code Reviewer** — 4 specialized AI agents analyze your code in parallel and give you a detailed quality report
2. **Semantic Code Search Engine** — search your entire codebase using plain English, not just keywords

The key novelty: **Search finds code → one click sends it to the Reviewer → all 4 agents analyze it automatically.** No other tool does this.

---

## Why this is different from ChatGPT / GitHub Copilot

| Feature | CodeMind AI | ChatGPT | Copilot |
|---|---|---|---|
| Multi-agent parallel analysis | ✅ | ❌ Single model call | ❌ |
| Auto-fix + verify code runs | ✅ | ❌ Only suggests | ❌ |
| CVE-mapped security scanning | ✅ | ❌ Generic advice | ❌ |
| Big-O complexity with explanation | ✅ | ❌ Basic | ❌ |
| Semantic codebase search | ✅ | ❌ | ❌ |
| Search → Review in one flow | ✅ | ❌ | ❌ |

---

## Features

### 🐛 Bug Detector Agent
- Finds logic errors, null reference risks, off-by-one errors
- Pinpoints exact line numbers
- Suggests precise fixes

### 🔐 Security Scanner Agent
- Detects SQL injection, XSS, hardcoded secrets, insecure APIs
- Maps every issue to real **CVE/CWE categories** (e.g. CWE-89: SQL Injection)
- Professional-grade security audit in seconds

### ⚡ Optimizer Agent
- Identifies O(n²) loops that can be O(n)
- Finds redundant computations and memory leaks
- Rewrites code with idiomatic patterns for each language
- Returns complete fixed version of your code

### 📊 Complexity Analyzer Agent
- Calculates time and space complexity with Big-O notation
- Generates **whiteboard-style explanation** you can use in interviews
- Scores complexity from 1-10 with improvement suggestions

### 🔍 Semantic Code Search
- Type plain English: "function that validates email"
- Finds matching code even if variable names are completely different
- Powered by vector embeddings + ChromaDB
- Index your own snippets or entire GitHub repositories

---

## Tech Stack

### Frontend
- **React** + **Vite**
- Custom dark theme with syntax highlighting

### Backend
- **FastAPI** (Python)
- **Anthropic Claude API** (claude-sonnet-4-6) — powers all 4 agents
- **ChromaDB** — local vector database for semantic search
- **sentence-transformers** — free local embeddings
- **PyGithub** — fetch and index public GitHub repositories

### Deployment
- **Vercel** — frontend hosting
- **Render** — backend hosting

---

## Getting Started Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- Anthropic API key from https://console.anthropic.com

### 1. Clone the repo
```bash
git clone https://github.com/AnoopNadagouda/codemind-ai.git
cd codemind-ai
```

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY in .env
uvicorn main:app --reload
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open in browser
```
http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/review` | Analyze code with 4 agents |
| POST | `/search` | Semantic search across indexed code |
| POST | `/index` | Index a code snippet |
| POST | `/index/github` | Index an entire GitHub repo |
| GET | `/` | Health check |

---

## Project Structure

```
codemind-ai/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── CodeEditor.jsx
│   │       ├── ReviewReport.jsx
│   │       ├── ScoreBadge.jsx
│   │       ├── SearchTab.jsx
│   │       └── IndexerTab.jsx
└── backend/
    ├── main.py
    ├── requirements.txt
    └── agents/
        ├── bug_detector.py
        ├── security_scanner.py
        ├── optimizer.py
        └── complexity_analyzer.py
```

---

## Roadmap

- [ ] GitHub PR auto-review on push
- [ ] Docker sandbox to verify fixed code actually runs
- [ ] VS Code extension
- [ ] Support for 10+ languages

---

## Resume Description

> Built an autonomous code quality platform (CodeMind AI) using multi-agent AI (Claude API + FastAPI) that reviews, auto-fixes, and analyzes code across 6 languages. Features parallel agent execution, CVE-mapped security scanning, Big-O complexity analysis, and a semantic code search engine powered by vector embeddings + ChromaDB. Deployed on Vercel + Render.

---

## Author

**Anoop Nadagouda**
- GitHub: [@AnoopNadagouda](https://github.com/AnoopNadagouda)

---

## License

MIT License
