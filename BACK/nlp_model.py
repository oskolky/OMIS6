# nlp_model.py
import spacy
from utils import log

class NLPProcessor:
    def __init__(self, lang_preference='ru'):
        self.lang = lang_preference
        if self.lang == 'ru':
            try:
                self.nlp = spacy.load("ru_core_news_lg")
            except Exception as e:
                log("Не найден ru_core_news_lg: попробуйте 'python -m spacy download ru_core_news_lg'")
                raise
        else:
            self.nlp = spacy.load("en_core_web_trf")

    def process_sentence(self, sent_text):
        doc = self.nlp(sent_text)
        ents = []
        for ent in doc.ents:
            ents.append({
                'text': ent.text,
                'label': ent.label_,
                'start_char': ent.start_char,
                'end_char': ent.end_char
            })

        relations = self._extract_relations(doc)
        return ents, relations

    def _extract_relations(self, doc):
        """
        Простая правило-ориентированная извлечь отношений:
         - ищем глагол (ROOT или VERB) с субъектом (nsubj) и объектом (obj/obl)
         - возвращаем triples (subj_text, verb_lemma, obj_text)
        """
        rels = []
        for token in doc:
            if token.dep_ == "ROOT" and token.pos_ in ("VERB","AUX"):
                subj = None
                obj = None
                for child in token.children:
                    if child.dep_.endswith("subj"):
                        subj = child
                    if child.dep_.endswith("obj") or child.dep_ == "obl":
                        obj = child
                if subj and obj:
                    subj_span = self._span_for_token(subj)
                    obj_span = self._span_for_token(obj)
                    rels.append({
                        'subj': subj_span.text,
                        'pred': token.lemma_,
                        'obj': obj_span.text
                    })
        return rels

    def _span_for_token(self, token):
        # расширяем на noun chunks если есть
        left = token.left_edge.i
        right = token.right_edge.i
        return token.doc[left:right+1]
