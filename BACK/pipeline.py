# pipeline.py
import argparse
import os
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

    # Инициализируем/создаем БД
    storage.init_db()

    # Загружаем документы
    docs = ingestor.ingest_folder(args.input)
    log(f"Найдено документов: {len(docs)}")

    for doc_meta in docs:
        filename = os.path.basename(doc_meta["path"])

        # 1. Добавляем запись о документе (status = 'processing')
        doc_id = storage.add_document(filename)
        log(f"Документ добавлен в БД: id={doc_id}, name={filename}")

        # 2. Разбиваем текст на предложения
        sents = preproc.sent_tokenize_and_clean(doc_meta["text"])

        sentence_count = 0
        entity_count = 0

        for sent in sents:
            # Добавляем предложение
            sentence_id = storage.add_sentence(doc_id, sent)
            sentence_count += 1

            # Пропускаем через NLP-модель
            ents, relations = nlp.process_sentence(sent)

            # Добавляем сущности
            for e in ents:
                storage.add_entity(
                    doc_id,
                    sentence_id,
                    e["text"],
                    e["label"],
                    e.get("start_char"),
                    e.get("end_char")
                )
                entity_count += 1

            # Добавляем отношения
            for r in relations:
                storage.add_relation(
                    doc_id,
                    sentence_id,
                    r["subj"],
                    r["pred"],
                    r["obj"]
                )

        # 3. Обновляем статистику документа
        storage.update_counts(doc_id, entity_count, sentence_count)

        # 4. Переводим документ в состояние "completed"
        storage.update_document_status(doc_id, "completed")

        log(
            f"Документ обработан: id={doc_id}, sentences={sentence_count}, entities={entity_count}"
        )

    # экспорт
    storage.export_graphml(args.graphml)
    storage.export_jsonld(args.jsonld)

    log("Готово. Графы экспортированы.")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Pipeline for Document Knowledge Extraction")
    p.add_argument("--input", required=True, help="Папка с документами")
    p.add_argument("--output", default="out.sqlite", help="SQLite файл вывода")
    p.add_argument("--graphml", default="graph.out.graphml", help="GraphML export path")
    p.add_argument("--jsonld", default="graph.out.jsonld", help="JSON-LD export path")
    p.add_argument("--lang", default="ru", choices=["ru", "en"], help="Язык для NER")

    args = p.parse_args()
    main(args)
