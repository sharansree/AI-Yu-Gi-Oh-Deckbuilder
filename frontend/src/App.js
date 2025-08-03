import React, { useState } from "react";
import "./App.css";

function App() {
  const [criteria, setCriteria] = useState("");
  const [cards, setCards] = useState([]);
  const [theme, setTheme] = useState("");
  const [deckText, setDeckText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });

      const data = await response.json();

      if (data.cards) {
        setTheme(data.theme);
        setCards(data.cards);
        const text = data.cards
          .map((card) => `${card.name} x${card.count}`)
          .join("\n");
        setDeckText(text);
      } else {
        setTheme("No cards found.");
        setCards([]);
        setDeckText("");
      }
    } catch (error) {
      console.error("Error generating deck:", error);
      setTheme("Error connecting to backend.");
      setDeckText("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>🃏 AI-Powered Yu-Gi-Oh Deck Builder</h1>

      <input
        type="text"
        placeholder="e.g., dragon deck with traps"
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Deck"}
      </button>

      {theme && (
        <div className="theme-box">
          <h2>🧠 Deck Theme</h2>
          <p
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: "1.6",
              textAlign: "left",
            }}
          >
            {theme.replace(/\*\*/g, "")}
          </p>
        </div>
      )}

      {deckText && (
        <div className="decklist-box">
          <h2>📜 Decklist</h2>
          <textarea
            value={deckText}
            readOnly
            rows={cards.length}
            style={{
              width: "100%",
              maxWidth: "800px",
              fontFamily: "monospace",
              fontSize: "14px",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              backgroundColor: "#fefefe",
              marginBottom: "10px",
              display: "block",
            }}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(deckText);
              alert("Decklist copied to clipboard!");
            }}
          >
            📋 Copy Decklist
          </button>
        </div>
      )}

      {["Monster", "Spell", "Trap"].map((type) => {
        const emoji = type === "Monster" ? "🧙" : type === "Spell" ? "📘" : "💥";
        const sectionCards = cards.filter((card) =>
          card.type.toLowerCase().includes(type.toLowerCase())
        );

        return sectionCards.length > 0 ? (
          <div key={type} className="card-section">
            <h2>
              {emoji} {type} Cards
            </h2>
            <div className="card-grid">
              {sectionCards.map((card, idx) => (
                <div className="card" key={idx}>
                  <img src={card.image} alt={card.name} />
                  <h3>
                    {card.name}{" "}
                    {card.count && Number(card.count) > 1
                      ? `x${card.count}`
                      : ""}
                  </h3>

                  <p>
                    <strong>Type:</strong> {card.type}
                  </p>
                  {card.attribute && (
                    <p>
                      <strong>Attribute:</strong> {card.attribute}
                    </p>
                  )}
                  {card.atk !== null && card.def !== null && (
                    <p>
                      <strong>ATK/DEF:</strong> {card.atk} / {card.def}
                    </p>
                  )}
                  <p className="desc">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
}

export default App;
