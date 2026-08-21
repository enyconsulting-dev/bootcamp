from fastapi import FastAPI

app = FastAPI(title="Consulting Offer Bootcamp API", version="0.1.0")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "phase": "1"}