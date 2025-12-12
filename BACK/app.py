import os
import sqlite3
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pipeline import main as pipeline_main
from storage import Storage
from fastapi import Query

app = FastAPI(title="Knowledge Extraction System API")

DB_PATH = "out.sqlite"


# ---------------------------------------------------
# Helpers
# ---------------------------------------------------
def db():
    return sqlite3.connect(DB_PATH)


storage = Storage(DB_PATH)
storage.init_db()


# ---------------------------------------------------
# API: Upload + Extraction
# ---------------------------------------------------
@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    os.makedirs("input_docs", exist_ok=True)

    save_path = f"input_docs/{file.filename}"
    with open(save_path, "wb") as f:
        f.write(await file.read())

    # run pipeline
    os.system(f"python3 pipeline.py --input input_docs --output {DB_PATH}")

    return {"status": "ok", "filename": file.filename}


# ---------------------------------------------------
# API: List of documents
# ---------------------------------------------------
@app.get("/documents")
def api_get_documents():
    conn = db()
    c = conn.cursor()

    # IMPORTANT: your DB must have these fields; we added them earlier
    try:
        c.execute("""
        SELECT id, filename, uploaded_at, status, entities_count, sentences_count 
        FROM documents ORDER BY id DESC
        """)
    except:
        raise HTTPException(500, "Table 'documents' does not match expected schema")

    rows = c.fetchall()

    return [
        {
            "id": r[0],
            "name": r[1],
            "uploadedAt": r[2],
            "status": r[3],
            "entities": r[4],
            "sentences": r[5]
        }
        for r in rows
    ]


# ---------------------------------------------------
# API: Graph for a document
# ---------------------------------------------------
@app.get("/graph/{doc_id}")
def api_graph(doc_id: int):
    conn = db()
    c = conn.cursor()

    # Check doc exists
    c.execute("SELECT filename FROM documents WHERE id=?", (doc_id,))
    doc = c.fetchone()
    if not doc:
        return {"nodes": [], "links": []}

    filename = doc[0]

    nodes = []
    links = []

    # DOCUMENT node
    nodes.append({
        "id": f"doc_{doc_id}",
        "label": filename,
        "type": "document"
    })

    # SENTENCES
    c.execute("SELECT id, text FROM sentences WHERE document_id=?", (doc_id,))
    for sid, text in c.fetchall():
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

    # ENTITIES
    c.execute("SELECT id, text, label, sentence_id FROM entities WHERE document_id=?", (doc_id,))
    for eid, text, label, sid in c.fetchall():
        nodes.append({
            "id": f"ent_{eid}",
            "label": text,
            "type": label.lower() if label else "other"
        })

        links.append({
            "id": f"ent_link_{eid}",
            "source": f"sent_{sid}",
            "target": f"ent_{eid}",
            "label": "mentions"
        })

    # RELATIONS
    c.execute("""
        SELECT id, sentence_id, subj, pred, obj 
        FROM relations WHERE document_id=?
    """, (doc_id,))

    for rid, sid, subj, pred, obj in c.fetchall():

        # Relation as node
        nodes.append({
            "id": f"rel_{rid}",
            "label": pred,
            "type": "relation"
        })

        # Relation belongs to sentence
        links.append({
            "id": f"rel_sent_{rid}",
            "source": f"sent_{sid}",
            "target": f"rel_{rid}",
            "label": "context"
        })

        # Subj
        c.execute(
            "SELECT id FROM entities WHERE document_id=? AND text=? COLLATE NOCASE LIMIT 1",
            (doc_id, subj),
        )
        row_sub = c.fetchone()
        if row_sub:
            links.append({
                "id": f"rel_subj_{rid}",
                "source": f"ent_{row_sub[0]}",
                "target": f"rel_{rid}",
                "label": "subj"
            })

        # Obj
        c.execute(
            "SELECT id FROM entities WHERE document_id=? AND text=? COLLATE NOCASE LIMIT 1",
            (doc_id, obj),
        )
        row_obj = c.fetchone()
        if row_obj:
            links.append({
                "id": f"rel_obj_{rid}",
                "source": f"rel_{rid}",
                "target": f"ent_{row_obj[0]}",
                "label": "obj"
            })

    return {"nodes": nodes, "links": links}


# ---------------------------------------------------
# API: Export GraphML / JSON-LD
# ---------------------------------------------------
@app.get("/export/graphml")
def export_graphml():
    path = "graph.out.graphml"
    if not os.path.exists(path):
        raise HTTPException(404, "GraphML has not been generated yet")
    return FileResponse(path, filename="graph.graphml")


@app.get("/export/jsonld")
def export_jsonld():
    path = "graph.out.jsonld"
    if not os.path.exists(path):
        raise HTTPException(404, "JSON-LD has not been generated yet")
    return FileResponse(path, filename="graph.jsonld")

@app.get("/entities")
def get_entities(
    q: str | None = Query(None),
    type: str | None = Query(None),
    document_id: int | None = Query(None)
):
    conn = sqlite3.connect("out.sqlite")
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    base = """
    SELECT 
        e.id,
        e.text,
        e.label,
        s.document_id,
        e.sentence_id
    FROM entities e
    JOIN sentences s ON s.id = e.sentence_id
    WHERE 1=1
    """

    params = []

    if q:
        base += " AND e.text LIKE ?"
        params.append(f"%{q}%")

    if type:
        base += " AND e.label = ?"
        params.append(type)

    if document_id:
        base += " AND s.document_id = ?"
        params.append(document_id)

    base += " ORDER BY e.id DESC"

    rows = c.execute(base, params).fetchall()

    entities = []
    for r in rows:
        entities.append({
            "id": r["id"],
            "text": r["text"],
            "type": r["label"],
            "documentId": r["document_id"],
            "sentenceId": r["sentence_id"]
        })

    return entities


# app.py - добавляем этот эндпоинт после импортов
@app.get("/stats")
def api_get_stats():
    conn = db()
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Общая статистика документов
    c.execute("""
        SELECT 
            COUNT(*) as total_documents,
            SUM(entities_count) as total_entities,
            SUM(sentences_count) as total_sentences,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM documents
    """)

    doc_stats = c.fetchone()

    # Статистика по связям
    c.execute("SELECT COUNT(*) as total_relations FROM relations")
    relations_stats = c.fetchone()

    # Статистика по типам сущностей
    c.execute("""
        SELECT 
            label,
            COUNT(*) as count
        FROM entities 
        GROUP BY label 
        ORDER BY count DESC
    """)

    entities_by_type = {}
    total_entities = 0
    for row in c.fetchall():
        label = row['label'] or 'OTHER'
        count = row['count']
        entities_by_type[label] = count
        total_entities += count

    # Время обработки (примерное - можно улучшить)
    c.execute("""
        SELECT 
            AVG(entities_count / (sentences_count + 1.0)) as avg_entities_per_sentence,
            COUNT(*) as total_processed
        FROM documents 
        WHERE status = 'completed' AND sentences_count > 0
    """)

    processing_stats = c.fetchone()

    # Распределение по времени (последние 7 дней)
    c.execute("""
        SELECT 
            DATE(uploaded_at) as date,
            COUNT(*) as count
        FROM documents
        WHERE uploaded_at >= date('now', '-7 days')
        GROUP BY DATE(uploaded_at)
        ORDER BY date
    """)

    daily_stats = c.fetchall()

    conn.close()

    return {
        "overview": {
            "totalDocuments": doc_stats["total_documents"] or 0,
            "totalEntities": doc_stats["total_entities"] or 0,
            "totalSentences": doc_stats["total_sentences"] or 0,
            "totalRelations": relations_stats["total_relations"] or 0,
        },
        "processing": {
            "completed": doc_stats["completed"] or 0,
            "processing": doc_stats["processing"] or 0,
            "failed": doc_stats["failed"] or 0,
            "totalProcessed": processing_stats["total_processed"] or 0,
            "avgEntitiesPerSentence": round(processing_stats["avg_entities_per_sentence"] or 0, 2)
        },
        "entities": entities_by_type,
        "dailyActivity": [
            {"date": row["date"], "count": row["count"]}
            for row in daily_stats
        ]
    }

# ---------------------------------------------------
# FRONTEND (UI)
# ---------------------------------------------------
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "ui", "dist")
app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")


# ---------------------------------------------------
# RUN SERVER
# ---------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
