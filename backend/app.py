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
    game = data.get("game", "yugioh").lower()

    try:
        # Game-specific prompt
        if game == "yugioh":
            prompt = (
                f"Build a Yu-Gi-Oh TCG-legal deck based on this request: {criteria}.\n"
                "Requirements:\n"
                "1. First, write a short 2–4 line description of the deck's strategy.\n"
                "2. Then, under a heading 'Main Deck:', list **exactly 40 cards**.\n"
                "   - Format: 'Card Name x3'.\n"
                "   - The total number of cards must equal 40.\n"
                "   - Do not include Extra Deck or Side Deck.\n"
                "3. Do not include any commentary after the list.\n"
            )
        else:
            prompt = (
                f"Build a Pokémon TCG deck based on this request: {criteria}.\n"
                "Requirements:\n"
                "1. First, write a short 2–4 line description of the deck's strategy.\n"
                "2. Then, under a heading 'Main Deck:', list **exactly 60 cards**.\n"
                "   - Format: 'Card Name x4'.\n"
                "   - The total number of cards must equal 60.\n"
                "3. Do not include any commentary after the list.\n"
            )

        gemini_response = model.generate_content(prompt)
        response_text = gemini_response.text.strip()
        print("🧠 Gemini says:\n", response_text)

        # Parse strategy and card list
        theme_lines, main_deck_lines = [], []
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

        # Parse card names and counts
        deck_cards = []
        for line in main_deck_lines:
            match = re.match(r"(.*?)(?:\s+x(\d+))?$", line)
            if match:
                name = match.group(1).strip(" .-*\"")
                count = int(match.group(2)) if match.group(2) else 1
                if name:
                    deck_cards.append((name, count))

        print("🧾 Parsed deck cards:", deck_cards)

        selected_cards = []
        decklist_text_lines = []

        for name, count in deck_cards:
            try:
                if game == "yugioh":
                    res = requests.get(f"https://db.ygoprodeck.com/api/v7/cardinfo.php?name={name}")
                    data = res.json()
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
                        decklist_text_lines.append(f"{card.get('name')} x{count}")
                    else:
                        print(f"❌ YGO card not found: {name}")

                elif game == "pokemon":
                    original_name = name
                    clean_name = re.sub(r"\(.*?\)", "", name).strip()

                    headers = {
                        "X-Api-Key": os.getenv("POKEMON_API_KEY")
                    }

                    url = f'https://api.pokemontcg.io/v2/cards?q=name:"{clean_name}"'
                    res = requests.get(url, headers=headers)

                    if res.status_code != 200 or not res.json().get("data"):
                        fallback_url = f'https://api.pokemontcg.io/v2/cards?q={clean_name}'
                        print(f"🔁 Retrying with fallback URL: {fallback_url}")
                        res = requests.get(fallback_url, headers=headers)

                    if res.status_code == 200:
                        data = res.json()
                        if "data" in data and len(data["data"]) > 0:
                            card = data["data"][0]
                            selected_cards.append({
                                "name": card.get("name"),
                                "type": ", ".join(card.get("subtypes", [])),
                                "desc": card.get("rules", [""])[0] if "rules" in card else "",
                                "attribute": card.get("supertype"),
                                "atk": None,
                                "def": None,
                                "image": card.get("images", {}).get("small", ""),
                                "count": count
                            })
                            decklist_text_lines.append(f"{original_name} x{count}")
                        else:
                            print(f"❌ Pokémon card not found: {original_name}")
                    else:
                        print(f"❌ Pokémon API error for {original_name}: Status {res.status_code}")

            except Exception as fetch_error:
                print(f"⚠️ Failed to fetch {name}: {fetch_error}")

        return jsonify({
            "theme": theme,
            "cards": selected_cards,
            "decklist": "\n".join(decklist_text_lines)
        })

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": "Failed to generate deck", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
