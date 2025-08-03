from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy

app = Flask(__name__)
CORS(app)
nlp = spacy.load("es_core_news_md")

@app.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.get_json()
    text = data.get("text", "")
    doc = nlp(text)

    result = []
    for token in doc:
        result.append({
            "word": token.text,
            "lemma": token.lemma_,
            "POS:": token.pos_
        })

    return jsonify(result)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)