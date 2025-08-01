import React from 'react';

function DeckDisplay({ deck }) {
  return (
    <div className="deck-display">
      <h2>Suggested Deck</h2>
      <ul>
        {deck.map((card, idx) => (
          <li key={idx}>{card}</li>
        ))}
      </ul>
    </div>
  );
}

export default DeckDisplay;
