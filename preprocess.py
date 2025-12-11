# preprocess.py
import re
from langdetect import detect
from utils import log

SENT_BOUNDARY_REGEX = re.compile(r'(?<=[\.\?\!…])\s+')

class TextPreprocessor:
    def __init__(self):
        pass

    def clean_text(self, text):
        # удалить многократные пробелы, номера страниц и колонтитулы простым способом
        t = re.sub(r'\s+', ' ', text)
        t = re.sub(r'\n{2,}', '\n', t)
        # убрать номера страниц вида "1 / 10" или просто строки с числами (осторожно)
        t = re.sub(r'\bPage\s*\d+\b', '', t, flags=re.I)
        return t.strip()

    def sent_tokenize_and_clean(self, text):
        text = self.clean_text(text)
        # простая сегментация предложений
        parts = SENT_BOUNDARY_REGEX.split(text)
        sents = [p.strip() for p in parts if len(p.strip()) > 5]
        return sents
