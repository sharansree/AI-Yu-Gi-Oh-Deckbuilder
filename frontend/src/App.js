import React, { useState } from "react";
import "./App.css";

function App() {
  const [criteria, setCriteria] = useState("");
  const [cards, setCards] = useState([]);
  const [theme, setTheme] = useState("");
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
      } else {
        setTheme("No cards found.");
        setCards([]);
      }
    } catch (error) {
      console.error("Error generating deck:", error);
      setTheme("Error connecting to backend.");
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
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", textAlign: "left" }}>
            {theme.replace(/\*\*/g, "")}
          </p>
        </div>
      )}

      <div className="card-grid">
        {cards.map((card, idx) => (
          <div className="card" key={idx}>
            <img src={card.image} alt={card.name} />
            <h3>
              {card.name} {card.count && Number(card.count) > 1 ? `x${card.count}` : ""}
            </h3>

            <p><strong>Type:</strong> {card.type}</p>
            {card.attribute && <p><strong>Attribute:</strong> {card.attribute}</p>}
            {card.atk !== null && card.def !== null && (
              <p><strong>ATK/DEF:</strong> {card.atk} / {card.def}</p>
            )}
            <p className="desc">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
