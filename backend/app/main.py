from fastapi import FastAPI

app = FastAPI(title="PolySelect API")


@app.get("/health")
def health():
    return {"status": "ok"}
