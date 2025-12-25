import os
import sqlite3
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from storage import Storage

app = FastAPI(title="Knowledge Extraction System API")

# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "out.sqlite")

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

storage = Storage(DB_PATH)
storage.init_db()

# ---------------------------------------------------
# UPLOAD + PIPELINE
# ---------------------------------------------------
@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    os.makedirs("input_docs", exist_ok=True)

    save_path = os.path.join(BASE_DIR, "input_docs", file.filename)
    with open(save_path, "wb") as f:
        f.write(await file.read())

    # запуск pipeline
    os.system(f"python pipeline.py --input input_docs --output \"{DB_PATH}\"")

    return {"status": "ok", "filename": file.filename}

# ---------------------------------------------------
# LIST DOCUMENTS
# ---------------------------------------------------
@app.get("/documents")
def list_documents():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    rows = c.execute("""
        SELECT 
            id,
            filename,
            uploaded_at,
            status,
            entities_count,
            sentences_count
        FROM documents
        ORDER BY id DESC
    """).fetchall()

    docs = []
    for r in rows:
        docs.append({
            "id": r["id"],
            "name": r["filename"],
            "uploadedAt": r["uploaded_at"],
            "status": r["status"],
            "entities": r["entities_count"],
            "sentences": r["sentences_count"],
        })

    return docs


# ---------------------------------------------------
# GRAPH FOR A DOCUMENT
# ---------------------------------------------------
@app.get("/graph/{doc_id}")
def api_graph(doc_id: int):
    conn = db()
    c = conn.cursor()

    doc = c.execute("SELECT filename FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not doc:
        return {"nodes": [], "links": []}

    filename = doc["filename"]

    nodes = []
    links = []

    # document node
    nodes.append({
        "id": f"doc_{doc_id}",
        "label": filename,
        "type": "document"
    })

    # sentences
    for r in c.execute("SELECT id, text FROM sentences WHERE document_id=?", (doc_id,)):
        sid, text = r["id"], r["text"]
        nodes.append({
            "id": f"sent_{sid}",
            "label": text[:40] + "...",
            "type": "sentence"
        })
        links.append({
            "id": f"doc_sent_{sid}",
            "source": f"doc_{doc_id}",
            "target": f"sent_{sid}",
            "label": "contains"
        })

    # entities
    for r in c.execute("""
        SELECT id, text, label, sentence_id 
        FROM entities WHERE document_id=?
    """, (doc_id,)):
        eid, text, label, sid = r
        nodes.append({
            "id": f"ent_{eid}",
            "label": text,
            "type": (label or "other").lower()
        })
        links.append({
            "id": f"ent_link_{eid}",
            "source": f"sent_{sid}",
            "target": f"ent_{eid}",
            "label": "mentions"
        })

    # relations
    for r in c.execute("""
        SELECT id, sentence_id, subj, pred, obj
        FROM relations WHERE document_id=?
    """, (doc_id,)):
        rid, sid, subj, pred, obj = r

        nodes.append({
            "id": f"rel_{rid}",
            "label": pred,
            "type": "relation"
        })
        links.append({
            "id": f"rel_sent_{rid}",
            "source": f"sent_{sid}",
            "target": f"rel_{rid}",
            "label": "context"
        })

        # subj entity
        rs = c.execute("""
            SELECT id FROM entities 
            WHERE document_id=? AND text=? COLLATE NOCASE LIMIT 1
        """, (doc_id, subj)).fetchone()
        if rs:
            links.append({
                "id": f"rel_subj_{rid}",
                "source": f"ent_{rs['id']}",
                "target": f"rel_{rid}",
                "label": "subj"
            })

        # obj entity
        ro = c.execute("""
            SELECT id FROM entities 
            WHERE document_id=? AND text=? COLLATE NOCASE LIMIT 1
        """, (doc_id, obj)).fetchone()
        if ro:
            links.append({
                "id": f"rel_obj_{rid}",
                "source": f"rel_{rid}",
                "target": f"ent_{ro['id']}",
                "label": "obj"
            })

    return {"nodes": nodes, "links": links}

# ---------------------------------------------------
# EXPORT
# ---------------------------------------------------
@app.get("/export/graphml")
def export_graphml():
    path = os.path.join(BASE_DIR, "graph.out.graphml")
    if not os.path.exists(path):
        raise HTTPException(404, "GraphML not generated")
    return FileResponse(path)

@app.get("/export/jsonld")
def export_jsonld():
    path = os.path.join(BASE_DIR, "graph.out.jsonld")
    if not os.path.exists(path):
        raise HTTPException(404, "JSON-LD not generated")
    return FileResponse(path)

# ---------------------------------------------------
# ENTITIES SEARCH
# ---------------------------------------------------
@app.get("/entities")
def get_entities(q: str | None = Query(None)):
    conn = db()
    rows = conn.execute("""
        SELECT 
            e.id, e.text, e.label, s.document_id, e.sentence_id
        FROM entities e
        JOIN sentences s ON s.id = e.sentence_id
        WHERE e.text LIKE ?
        ORDER BY e.id DESC
    """, (f"%{q}%" if q else "%",)).fetchall()

    return [
        {
            "id": r["id"],
            "text": r["text"],
            "type": r["label"],
            "documentId": r["document_id"],
            "sentenceId": r["sentence_id"]
        }
        for r in rows
    ]

# ---------------------------------------------------
# STATS
# ---------------------------------------------------
@app.get("/stats")
def api_get_stats():
    conn = db()
    stats = conn.execute("""
        SELECT 
            COUNT(*) as total_documents,
            SUM(entities_count) as total_entities,
            SUM(sentences_count) as total_sentences
        FROM documents
    """).fetchone()

    relations = conn.execute("SELECT COUNT(*) as total_relations FROM relations").fetchone()

    return {
        "documents": stats["total_documents"] or 0,
        "entities": stats["total_entities"] or 0,
        "sentences": stats["total_sentences"] or 0,
        "relations": relations["total_relations"] or 0
    }


# ---------------------------------------------------
# DELETE DOCUMENT
# ---------------------------------------------------
@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int):
    conn = db()
    c = conn.cursor()

    # Получаем имя файла документа
    doc = c.execute("SELECT filename FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Удаляем файл из input_docs
    file_path = os.path.join(BASE_DIR, "input_docs", doc["filename"])
    if os.path.exists(file_path):
        os.remove(file_path)

    # Удаляем все связанные записи из БД
    c.execute("DELETE FROM relations WHERE document_id=?", (doc_id,))
    c.execute("DELETE FROM entities WHERE document_id=?", (doc_id,))
    c.execute("DELETE FROM sentences WHERE document_id=?", (doc_id,))
    c.execute("DELETE FROM documents WHERE id=?", (doc_id,))

    conn.commit()
    return {"status": "ok", "deletedId": doc_id}


# ---------------------------------------------------
# REPROCESS DOCUMENT
# ---------------------------------------------------
@app.post("/reprocess/{doc_id}")
def reprocess_document(doc_id: int):
    conn = db()
    c = conn.cursor()

    doc = c.execute("SELECT filename FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Удаляем старые данные
    c.execute("DELETE FROM relations WHERE document_id=?", (doc_id,))
    c.execute("DELETE FROM entities WHERE document_id=?", (doc_id,))
    c.execute("DELETE FROM sentences WHERE document_id=?", (doc_id,))
    c.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    conn.commit()

    # Запускаем пайплайн заново
    file_path = os.path.join(BASE_DIR, "input_docs", doc["filename"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Original file not found")

    os.system(f'python pipeline.py --input input_docs --output "{DB_PATH}"')

    return {"status": "ok", "reprocessed": doc_id}


# ---------------------------------------------------
# FRONTEND STATIC
# ---------------------------------------------------
FRONTEND_DIST = os.path.join(BASE_DIR, "ui", "dist")
app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")

# ---------------------------------------------------
# RUN SERVER
# ---------------------------------------------------
if __name__ == "__main__":
    print("Using DB:", DB_PATH)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)


 