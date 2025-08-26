import React, { useState } from "react";
import "./App.css";

function App() {
  const [criteria, setCriteria] = useState("");
  const [cards, setCards] = useState([]);
  const [theme, setTheme] = useState("");
  const [decklist, setDecklist] = useState("");
  const [loading, setLoading] = useState(false);
  const [game, setGame] = useState("yugioh");
  const [copied, setCopied] = useState(false); // ⬅️ NEW

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria, game }),
      });

      const data = await response.json();

      if (data.cards) {
        setTheme(data.theme);
        setDecklist(data.decklist);
        setCards(data.cards);
      } else {
        setTheme("No cards found.");
        setDecklist("");
        setCards([]);
      }
    } catch (error) {
      console.error("Error generating deck:", error);
      setTheme("Error connecting to backend.");
      setDecklist("");
    } finally {
      setLoading(false);
    }
  };

  // ⬅️ NEW: Copy to clipboard function
  const handleCopyDecklist = () => {
    navigator.clipboard.writeText(decklist);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // reset after 2s
  };

  return (
    <div className="app">
      <h1>AI-Powered TCG Deck Builder</h1>

      <div className="controls">
        <select value={game} onChange={(e) => setGame(e.target.value)}>
          <option value="yugioh">Yu-Gi-Oh</option>
          <option value="pokemon">Pokémon</option>
        </select>

        <input
          type="text"
          placeholder="e.g., dragon deck with traps"
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
        />

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate Deck"}
        </button>
      </div>

      {theme && (
        <div className="theme-box">
          <h2>Deck Theme</h2>
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

      {decklist && (
        <div className="decklist-box">
          <h2>📋 Copyable Decklist</h2>
          <textarea
            readOnly
            value={decklist}
            style={{ width: "100%", height: "200px", fontFamily: "monospace" }}
          />
          <button
            onClick={handleCopyDecklist}
            className="copy-btn"
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {copied ? "✅ Copied!" : "Copy Decklist"}
          </button>
        </div>
      )}

      <div className="card-grid">
        {cards.map((card, idx) => (
          <div className="card" key={idx}>
            <img src={card.image} alt={card.name} />
            <h3>
              {card.name} {card.count > 1 && `x${card.count}`}
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
  );
}

export default App;
