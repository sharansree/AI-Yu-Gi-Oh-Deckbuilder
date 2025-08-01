from flask import Flask, request, jsonify
import os
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# List available models and pick one that supports `generate_content`
try:
    available_models = genai.list_models()
    for m in available_models:
        if 'generateContent' in m.supported_generation_methods:
            print("✅ Using model:", m.name)
            selected_model_name = m.name
            break
except Exception as e:
    print("❌ Could not list models:", e)
    selected_model_name = "models/gemini-pro"  # Fallback

model = genai.GenerativeModel(selected_model_name)

@app.route('/generate-deck', methods=['POST'])
def generate_deck():
    data = request.json
    criteria = data.get('criteria')

    prompt = f"""
    You're an expert Yu-Gi-Oh deck builder. Based on the following user input, build a 40-card main deck list (no duplicates unless allowed by game rules). Only return the card names, one per line.

    User criteria: "{criteria}"
    """

    try:
        response = model.generate_content(prompt)
        deck_list = response.text.strip().split('\n')
        return jsonify({'deck': deck_list})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
