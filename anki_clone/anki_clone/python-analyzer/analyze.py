from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import re

app = Flask(__name__)
CORS(app)

# Load both models at once
nlp_es = spacy.load("es_core_news_md")
nlp_ru = spacy.load("ru_core_news_md")

MODELS = {
    "es": nlp_es,
    "ru": nlp_ru,
}

def pick_lang(text: str) -> str:
    code = text[0]
    print("Currently debugging...")

    if 0x0400 <= hex(ord(code)) <= 0x04FF:
        return "ru"

    return "es"

@app.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.get_json()
    text = data.get("text", "")
    forced_lang = (data.get("lang") or "").lower()

    if not text.strip():
        return jsonify({"error": "No text provided."}), 400

    lang = pick_lang(text)
    print("language detected: ", lang)
    nlp = MODELS[lang]

    doc = nlp(text)

    result = []
    for token in doc:
        result.append({
            "word": token.text,
            "lemma": token.lemma_,
            "POS": token.pos_
        })

    return jsonify(result)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
