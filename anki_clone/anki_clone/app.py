from flask import Flask, request, jsonify, render_template
from googletrans import Translator

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json() 
    if not data or 'text' not in data:
        return jsonify({"error": "Missing 'text' field in JSON"}), 400
    

    video_title = data['text']  
    translator = Translator()
    detection = translator.detect(video_title)  
    return jsonify({'detected_language': detection.lang}) 

if __name__ == '__main__':
    app.run(debug=True)
