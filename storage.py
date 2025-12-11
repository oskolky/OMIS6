# storage.py
import sqlite3
import os
import networkx as nx
from datetime import datetime
from utils import log

class Storage:
    def __init__(self, db_path="out_db.sqlite"):
        self.db_path = db_path
        self.conn = None

    def init_db(self):
        if os.path.exists(self.db_path):
            log(f"БД {self.db_path} уже существует, данные будут дописаны.")
        self.conn = sqlite3.connect(self.db_path)
        c = self.conn.cursor()
        # документы
        c.execute("""
        CREATE TABLE IF NOT EXISTS documents(
            id INTEGER PRIMARY KEY,
            path TEXT UNIQUE,
            text TEXT,
            created_at TEXT
        )""")
        c.execute("""
        CREATE TABLE IF NOT EXISTS sentences(
            id INTEGER PRIMARY KEY,
            document_id INTEGER,
            text TEXT,
            FOREIGN KEY(document_id) REFERENCES documents(id)
        )""")
        c.execute("""
        CREATE TABLE IF NOT EXISTS entities(
            id INTEGER PRIMARY KEY,
            sentence_id INTEGER,
            text TEXT,
            label TEXT,
            start_char INTEGER,
            end_char INTEGER,
            FOREIGN KEY(sentence_id) REFERENCES sentences(id)
        )""")
        c.execute("""
        CREATE TABLE IF NOT EXISTS relations(
            id INTEGER PRIMARY KEY,
            sentence_id INTEGER,
            subj TEXT,
            pred TEXT,
            obj TEXT,
            FOREIGN KEY(sentence_id) REFERENCES sentences(id)
        )""")
        self.conn.commit()

    def add_document(self, path, text):
        c = self.conn.cursor()
        now = datetime.utcnow().isoformat()
        c.execute("INSERT OR IGNORE INTO documents(path, text, created_at) VALUES (?, ?, ?)",
                  (path, text, now))
        self.conn.commit()
        c.execute("SELECT id FROM documents WHERE path=?", (path,))
        return c.fetchone()[0]

    def add_sentence(self, doc_id, text):
        c = self.conn.cursor()
        c.execute("INSERT INTO sentences(document_id, text) VALUES (?, ?)", (doc_id, text))
        self.conn.commit()
        return c.lastrowid

    def add_entity(self, sentence_id, text, label, start_char=None, end_char=None):
        c = self.conn.cursor()
        c.execute("INSERT INTO entities(sentence_id, text, label, start_char, end_char) VALUES (?, ?, ?, ?, ?)",
                  (sentence_id, text, label, start_char, end_char))
        self.conn.commit()
        return c.lastrowid

    def add_relation(self, sentence_id, subj, pred, obj):
        c = self.conn.cursor()
        c.execute("INSERT INTO relations(sentence_id, subj, pred, obj) VALUES (?, ?, ?, ?)",
                  (sentence_id, subj, pred, obj))
        self.conn.commit()
        return c.lastrowid

    def export_graphml(self, out_path="graph.out.graphml"):
        G = nx.DiGraph()
        c = self.conn.cursor()
        # добавим сущности как узлы
        c.execute("SELECT id, text, label FROM entities")
        for eid, text, label in c.fetchall():
            G.add_node(f"ent_{eid}", text=text, label=label, type='entity')
        # добавить документы/предложения как отдельные узлы
        c.execute("SELECT id, text, document_id FROM sentences")
        for sid, text, docid in c.fetchall():
            G.add_node(f"sent_{sid}", text=text, type='sentence', docid=docid)
        # связи: relation -> connect subj entity node -> obj entity node
        c.execute("SELECT id, subj, pred, obj, sentence_id FROM relations")
        for rid, subj, pred, obj, sid in c.fetchall():
            # найти подходящие entity ids по тексту (упрощение)
            ent_ids = []
            c2 = self.conn.cursor()
            c2.execute("SELECT id FROM entities WHERE text=? COLLATE NOCASE", (subj,))
            rows = c2.fetchall()
            if rows:
                sid_sub = rows[0][0]
            else:
                sid_sub = None
            c2.execute("SELECT id FROM entities WHERE text=? COLLATE NOCASE", (obj,))
            rows = c2.fetchall()
            if rows:
                sid_obj = rows[0][0]
            else:
                sid_obj = None

            # если сущности найдены, связать
            if sid_sub:
                G.add_edge(f"ent_{sid_sub}", f"rel_{rid}", predicate=pred, sentence=f"sent_{sid}")
                G.add_node(f"rel_{rid}", predicate=pred, type='relation')
            if sid_obj:
                G.add_edge(f"rel_{rid}", f"ent_{sid_obj}", predicate=pred, sentence=f"sent_{sid}")

        nx.write_graphml(G, out_path)
        log(f"Экспортирован GraphML: {out_path}")

    def export_jsonld(self, out_path="graph.out.jsonld"):
        # простой экспорт отношений в JSON-LD вида { "@graph": [ ... ] }
        c = self.conn.cursor()
        nodes = []
        c.execute("SELECT id, text, label FROM entities")
        for eid, text, label in c.fetchall():
            nodes.append({"@id": f"entity/{eid}", "type":"Entity", "name": text, "label": label})
        c.execute("SELECT id, subj, pred, obj FROM relations")
        for rid, subj, pred, obj in c.fetchall():
            nodes.append({"@id": f"relation/{rid}", "type":"Relation", "subj": subj, "pred": pred, "obj": obj})
        import json
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump({"@context":{}, "@graph": nodes}, f, ensure_ascii=False, indent=2)
        log(f"Экспортирован JSON-LD: {out_path}")
