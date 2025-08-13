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

    print("The character in the string is", code)

    if 0x0400 <= ord(code) <= 0x04FF:
        return "ru"

    return "es"

@app.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.get_json()
    text = data.get("text", "")
    language = (data.get("language"))

    if not text.strip():
        return jsonify({"error": "No text provided."}), 400

    print("language detected: ", language)

    if (language == 'Latin'):
        language = 'es'
    if (language == 'Cyrillic'):
        language = 'ru'

    nlp = MODELS[language]

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
