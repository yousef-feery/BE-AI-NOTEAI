#  NoteAI – Backend (FastAPI + Ollama + Nomic-AI)

Backend service for **NoteAI**, a tool that reads user notes, summarizes them, extracts key points with citations, and answers questions based only on the note content.

---

##  Architecture Overview
```
Frontend (Web Portal)
│
▼
Backend (Python + FastAPI)
│
├── Ollama 8B API (LLM – summarization & Q/A)
├── Nomic-AI Service (embeddings)
└── PostgreSQL (data & embeddings storage)
```



## Features

- **Summarization**: Converts long notes into concise summaries.
- **Grounded Citations**: Every key point backed by quotes from the note.
- **Q&A Mode**: Answers user questions based only on the note content.
- **Embeddings**: Stores semantic representations for QA retrieval.
- **Telemetry**: Logs model latency, token counts, and grounding status.




##  Project Structure
```
note-workflow/
├─ app/
│ ├─ main.py               # FastAPI entrypoint
│ ├─ db.py                 # Database connection
│ ├─ config.py             # Environment variables
│ ├─ models.py             # SQLAlchemy models
│ ├─ schemas.py            # Pydantic models
│ ├─ routers/
│ │ ├─ notes.py            # Summarization route
│ │ └─ qa.py               # Question answering route
│ └─ services/
│ ├─ llm.py                # LLM (Ollama) integration
│ ├─ embed.py              # Nomic-AI embeddings
│ └─ qa_retrieval.py       # Retrieval utilities
├─ docker-compose.yml      # Postgres service
├─ requirements.txt
├─ .env.example
└─ README.md
```

