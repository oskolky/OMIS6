# storage.py
import sqlite3
import os
from datetime import datetime
from utils import log
import networkx as nx
import json


class Storage:
    def __init__(self, db_path="out.sqlite"):
        self.db_path = db_path
        self.conn = None

    def init_db(self):
        self.conn = sqlite3.connect(self.db_path)
        c = self.conn.cursor()

        # Документы
        c.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            uploaded_at TEXT,
            status TEXT,
            entities_count INTEGER DEFAULT 0,
            sentences_count INTEGER DEFAULT 0
        )
        """)

        # Предложения
        c.execute("""
        CREATE TABLE IF NOT EXISTS sentences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER,
            text TEXT,
            FOREIGN KEY (document_id) REFERENCES documents(id)
        )
        """)

        # Сущности
        c.execute("""
        CREATE TABLE IF NOT EXISTS entities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER,
            sentence_id INTEGER,
            text TEXT,
            label TEXT,
            start_char INTEGER,
            end_char INTEGER,
            FOREIGN KEY (document_id) REFERENCES documents(id),
            FOREIGN KEY (sentence_id) REFERENCES sentences(id)
        )
        """)

        # Отношения
        c.execute("""
        CREATE TABLE IF NOT EXISTS relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER,
            sentence_id INTEGER,
            subj TEXT,
            pred TEXT,
            obj TEXT,
            FOREIGN KEY (document_id) REFERENCES documents(id),
            FOREIGN KEY (sentence_id) REFERENCES sentences(id)
        )
        """)

        self.conn.commit()
        log("БД инициализирована.")

    # -----------------------------
    # DOCUMENTS
    # -----------------------------
    def add_document(self, filename):
        c = self.conn.cursor()
        now = datetime.utcnow().isoformat()

        c.execute("""
            INSERT INTO documents(filename, uploaded_at, status)
            VALUES (?, ?, 'processing')
        """, (filename, now))

        self.conn.commit()
        return c.lastrowid

    def update_document_status(self, doc_id, status):
        c = self.conn.cursor()
        c.execute("UPDATE documents SET status=? WHERE id=?", (status, doc_id))
        self.conn.commit()

    def update_counts(self, doc_id, entities, sentences):
        c = self.conn.cursor()
        c.execute("""
            UPDATE documents
            SET entities_count=?, sentences_count=?
            WHERE id=?
        """, (entities, sentences, doc_id))
        self.conn.commit()

    def get_documents(self):
        c = self.conn.cursor()
        c.execute("""
            SELECT id, filename, uploaded_at, status, entities_count, sentences_count
            FROM documents ORDER BY id DESC
        """)
        return c.fetchall()

    def delete_document(self, doc_id):
        c = self.conn.cursor()
        c.execute("DELETE FROM entities WHERE document_id=?", (doc_id,))
        c.execute("DELETE FROM relations WHERE document_id=?", (doc_id,))
        c.execute("DELETE FROM sentences WHERE document_id=?", (doc_id,))
        c.execute("DELETE FROM documents WHERE id=?", (doc_id,))
        self.conn.commit()

    # -----------------------------
    # SENTENCES / ENTITIES / RELATIONS
    # -----------------------------
    def add_sentence(self, doc_id, text):
        c = self.conn.cursor()
        c.execute("INSERT INTO sentences(document_id, text) VALUES (?, ?)",
                  (doc_id, text))
        self.conn.commit()
        return c.lastrowid

    def add_entity(self, doc_id, sentence_id, text, label, start_char=None, end_char=None):
        c = self.conn.cursor()
        c.execute("""
            INSERT INTO entities(document_id, sentence_id, text, label, start_char, end_char)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (doc_id, sentence_id, text, label, start_char, end_char))

        self.conn.commit()

    def add_relation(self, doc_id, sentence_id, subj, pred, obj):
        c = self.conn.cursor()
        c.execute("""
            INSERT INTO relations(document_id, sentence_id, subj, pred, obj)
            VALUES (?, ?, ?, ?, ?)
        """, (doc_id, sentence_id, subj, pred, obj))
        self.conn.commit()

    def get_document_entities(self, doc_id):
        c = self.conn.cursor()
        c.execute("SELECT text, label FROM entities WHERE document_id=?", (doc_id,))
        return c.fetchall()

    def get_document_sentences(self, doc_id):
        c = self.conn.cursor()
        c.execute("SELECT text FROM sentences WHERE document_id=?", (doc_id,))
        return c.fetchall()

    def get_document_relations(self, doc_id):
        c = self.conn.cursor()
        c.execute("SELECT subj, pred, obj FROM relations WHERE document_id=?", (doc_id,))
        return c.fetchall()

    # -----------------------------
    # EXPORT GRAPHML
    # -----------------------------

    def export_graphml(self, out_path="graph.out.graphml", document_id=None):
        """
        Экспорт графа в GraphML. Если document_id=None — экспортирует весь граф.
        """
        G = nx.DiGraph()
        c = self.conn.cursor()

        if document_id:
            doc_filter = "WHERE document_id = ?"
            params = (document_id,)
        else:
            doc_filter = ""
            params = ()

        # Узлы: предложения
        c.execute(f"SELECT id, document_id, text FROM sentences {doc_filter}")
        for sid, docid, text in c.fetchall():
            G.add_node(
                f"sent_{sid}",
                type="sentence",
                text=text,
                document_id=docid
            )

        # Узлы: сущности
        c.execute(f"SELECT id, document_id, text, label FROM entities {doc_filter}")
        for eid, docid, text, label in c.fetchall():
            G.add_node(
                f"ent_{eid}",
                type="entity",
                label=label,
                text=text,
                document_id=docid
            )

        # Узлы: отношения
        c.execute(f"SELECT id, document_id, subj, pred, obj, sentence_id FROM relations {doc_filter}")
        for rid, docid, subj, pred, obj, sid in c.fetchall():
            G.add_node(
                f"rel_{rid}",
                type="relation",
                label=pred,
                document_id=docid
            )

            # ищем сущность subj
            c.execute("SELECT id FROM entities WHERE text=?", (subj,))
            row_sub = c.fetchone()
            if row_sub:
                G.add_edge(f"ent_{row_sub[0]}", f"rel_{rid}", edge_type="subj")

            # ищем сущность obj
            c.execute("SELECT id FROM entities WHERE text=?", (obj,))
            row_obj = c.fetchone()
            if row_obj:
                G.add_edge(f"rel_{rid}", f"ent_{row_obj[0]}", edge_type="obj")

            # предложение связи
            G.add_edge(f"sent_{sid}", f"rel_{rid}", edge_type="context")

        nx.write_graphml(G, out_path)
        log(f"GraphML экспортирован: {out_path}")

    # -----------------------------
    # EXPORT JSON-LD
    # -----------------------------
    def export_jsonld(self, out_path="graph.out.jsonld", document_id=None):
        c = self.conn.cursor()

        if document_id:
            doc_filter = "WHERE document_id = ?"
            params = (document_id,)
        else:
            doc_filter = ""
            params = ()

        graph = {"@context": {}, "@graph": []}

        # Сущности
        c.execute(f"SELECT id, text, label, document_id FROM entities {doc_filter}", params)
        for eid, text, label, docid in c.fetchall():
            graph["@graph"].append({
                "@id": f"entity/{eid}",
                "type": "Entity",
                "document": docid,
                "text": text,
                "label": label,
            })

        # Отношения
        c.execute(f"SELECT id, subj, pred, obj, document_id FROM relations {doc_filter}", params)
        for rid, subj, pred, obj, docid in c.fetchall():
            graph["@graph"].append({
                "@id": f"relation/{rid}",
                "type": "Relation",
                "document": docid,
                "subj": subj,
                "pred": pred,
                "obj": obj,
            })

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(graph, f, ensure_ascii=False, indent=2)

        log(f"JSON-LD экспортирован: {out_path}")
