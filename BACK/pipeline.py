# pipeline.py
import argparse
from ingest import DocumentIngestor
from nlp_model import NLPProcessor
from storage import Storage
from preprocess import TextPreprocessor
from utils import setup_logging, log

def main(args):
    setup_logging()
    log("Запуск пайплайна извлечения знаний")

    ingestor = DocumentIngestor()
    preproc = TextPreprocessor()
    nlp = NLPProcessor(lang_preference=args.lang)
    storage = Storage(db_path=args.output)

    # инициализируем БД
    storage.init_db()

    docs = ingestor.ingest_folder(args.input)
    log(f"Найдено документов: {len(docs)}")

    for doc_meta in docs:
        doc_id = storage.add_document(doc_meta['path'], doc_meta['text'])
        # разбиваем на предложения и предобработываем
        sents = preproc.sent_tokenize_and_clean(doc_meta['text'])
        for sent in sents:
            sent_id = storage.add_sentence(doc_id, sent)
            ents, relations = nlp.process_sentence(sent)
            for e in ents:
                storage.add_entity(sent_id, e['text'], e['label'], e.get('start_char'), e.get('end_char'))
            for r in relations:
                storage.add_relation(sent_id, r['subj'], r['pred'], r['obj'])

    # экспорт
    storage.export_graphml(args.graphml)
    storage.export_jsonld(args.jsonld)
    log("Готово. Результаты в БД и экспортированы в GraphML/JSON-LD")

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Pipeline for Document Knowledge Extraction")
    p.add_argument("--input", required=True, help="Папка с документами (pdf, docx, jpg/png)")
    p.add_argument("--output", default="out_db.sqlite", help="Файл SQLite для вывода")
    p.add_argument("--graphml", default="graph.out.graphml", help="GraphML export")
    p.add_argument("--jsonld", default="graph.out.jsonld", help="JSON-LD export")
    p.add_argument("--lang", default="ru", choices=["ru","en"], help="Язык приоритета для NER")
    args = p.parse_args()
    main(args)
