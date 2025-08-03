from flask import Flask, request, jsonify
import os
import google.generativeai as genai
import requests
from dotenv import load_dotenv
from flask_cors import CORS
import re

load_dotenv()

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    available_models = genai.list_models()
    for m in available_models:
        if 'generateContent' in m.supported_generation_methods:
            print("✅ Using model:", m.name)
            selected_model_name = m.name
            break
except Exception as e:
    print("❌ Could not list models:", e)
    selected_model_name = "models/gemini-pro"

model = genai.GenerativeModel(selected_model_name)

@app.route("/generate-deck", methods=["POST"])
def generate_deck():
    data = request.get_json()
    criteria = data.get("criteria", "build me a starter deck")

    try:
        prompt = (
            f"Build a complete Yu-Gi-Oh deck based on this request: {criteria}.\n"
            "Respond with:\n"
            "1. A brief deck theme or strategy description (2–4 lines).\n"
            "2. Then, a section titled 'Main Deck:' followed by a list of cards of the exact total amount equal to the specified amount of cards in the request, or 40 cards if no amount specified, in the format 'Card Name x3', excluding anything that was requested to exclude, and including anything that was requested to specifially include.\n"
        )
        gemini_response = model.generate_content(prompt)
        response_text = gemini_response.text.strip()

        print("🧠 Gemini says:\n", response_text)

        theme_lines = []
        main_deck_lines = []
        in_deck_section = False

        for line in response_text.splitlines():
            if "main deck" in line.lower():
                in_deck_section = True
                continue
            if not in_deck_section:
                theme_lines.append(line.strip())
            else:
                main_deck_lines.append(line.strip())

        theme = "\n".join(theme_lines).strip()

        deck_cards = []
        for line in main_deck_lines:
            match = re.match(r"(.*?)(?:\s+x(\d+))?$", line)
            if match:
                name = match.group(1).strip(" .-*")
                count = int(match.group(2)) if match.group(2) else 1
                if name:
                    deck_cards.append((name, count))

        print("🧾 Parsed deck cards:", deck_cards)

        selected_cards = []
        for name, count in deck_cards:
            try:
                response = requests.get(f"https://db.ygoprodeck.com/api/v7/cardinfo.php?name={name}")
                data = response.json()
                if "data" in data:
                    card = data["data"][0]
                    selected_cards.append({
                        "name": card.get("name"),
                        "type": card.get("type"),
                        "desc": card.get("desc"),
                        "attribute": card.get("attribute"),
                        "atk": card.get("atk"),
                        "def": card.get("def"),
                        "image": card["card_images"][0]["image_url"],
                        "count": count
                    })
            except Exception as fetch_error:
                print(f"⚠️ Failed to fetch: {name} — {fetch_error}")

        return jsonify({
            "theme": theme,
            "cards": selected_cards
        })

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": "Failed to generate deck", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
