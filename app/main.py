from fastapi import FastAPI
from app.routers import summarize, qa

app = FastAPI(title="NoteAI Backend")

app.include_router(summarize.router)
app.include_router(qa.router)

@app.get("/healthz")
def healthz():
    return {"ok": True}
