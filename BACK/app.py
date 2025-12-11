import os
import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles

from pipeline import main as pipeline_main

app = FastAPI(title="Knowledge Extraction System")


# -----------------------------
# API
# -----------------------------
@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    os.makedirs("input_docs", exist_ok=True)
    save_path = f"input_docs/{file.filename}"
    with open(save_path, "wb") as f:
        f.write(await file.read())

    os.system(f"python pipeline.py --input input_docs --output out.sqlite")

    return {"status": "ok", "message": "Processed", "db": "out.sqlite"}


# -----------------------------
# FRONTEND
# -----------------------------
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "ui", "dist")

# Раздаём UI прямо с корня
app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")


# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
