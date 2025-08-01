import React, { useState } from 'react';
import axios from 'axios';
import DeckDisplay from './DeckDisplay';
import './styles.css';

function App() {
  const [criteria, setCriteria] = useState('');
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/generate-deck', { criteria });
      setDeck(res.data.deck);
    } catch (err) {
      console.error(err);
      alert('Error generating deck. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>🃏 Yu-Gi-Oh AI Deck Builder</h1>
      <textarea
        rows="4"
        placeholder="Enter deck criteria (e.g., budget Blue-Eyes deck under $50)..."
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
      />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Deck'}
      </button>
      {deck.length > 0 && <DeckDisplay deck={deck} />}
    </div>
  );
}

export default App;
