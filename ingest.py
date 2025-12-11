# ingest.py
import os
import pdfplumber
from docx import Document
from PIL import Image
import pytesseract
from utils import log

SUPPORTED = ('.pdf', '.docx', '.png', '.jpg', '.jpeg', '.tiff')

class DocumentIngestor:
    def __init__(self, ocr_lang='rus+eng'):
        self.ocr_lang = ocr_lang

    def ingest_folder(self, folder):
        results = []
        for root, _, files in os.walk(folder):
            for fname in files:
                if fname.lower().endswith(SUPPORTED):
                    path = os.path.join(root, fname)
                    try:
                        text = self.read_file(path)
                        results.append({'path': path, 'text': text})
                        log(f"Прочитан: {path}")
                    except Exception as e:
                        log(f"Ошибка при чтении {path}: {e}")
        return results

    def read_file(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext == '.pdf':
            return self._read_pdf(path)
        elif ext == '.docx':
            return self._read_docx(path)
        elif ext in ('.png', '.jpg', '.jpeg', '.tiff'):
            return self._read_image(path)
        else:
            raise ValueError("Unsupported format")

    def _read_pdf(self, path):
        text_parts = []
        try:
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    ptext = page.extract_text()
                    if ptext:
                        text_parts.append(ptext)
                    else:
                        # если текст пуст — пробуем raster -> OCR
                        im = page.to_image(resolution=150).original
                        ocr_text = pytesseract.image_to_string(im, lang=self.ocr_lang)
                        text_parts.append(ocr_text)
        except Exception as e:
            log(f"pdfplumber failed, fallback to full OCR for {path}: {e}")
            return self._read_image(path)
        return "\n".join(text_parts)

    def _read_docx(self, path):
        doc = Document(path)
        full = []
        for p in doc.paragraphs:
            full.append(p.text)
        return "\n".join(full)

    def _read_image(self, path):
        img = Image.open(path)
        text = pytesseract.image_to_string(img, lang=self.ocr_lang)
        return text
