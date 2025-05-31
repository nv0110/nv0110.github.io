import React from 'react';
import { LIMITS } from '../constants';
import './CharacterCreator.css';

function CharacterCreator({
  newCharName,
  setNewCharName,
  onAddCharacter,
  characterBossSelections,
  showCrystalCapError,
  cloneError
}) {
  const isAtLimit = characterBossSelections.length >= LIMITS.CHARACTER_CAP;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newCharName.trim() && !isAtLimit) {
      onAddCharacter();
    }
  };

  return (
    <div className="character-creator">
      <form className="character-creator-form" onSubmit={handleSubmit}>
        <div className="character-creator-input-group">
          <input
            type="text"
            value={newCharName}
            onChange={e => setNewCharName(e.target.value)}
            placeholder="New character name..."
            className="character-creator-input"
            disabled={isAtLimit}
          />
          <button
            type="submit"
            disabled={!newCharName.trim() || isAtLimit}
            className="character-creator-button"
          >
            Add Character
          </button>
        </div>
        
        {isAtLimit && (
          <div className="character-creator-warning">
            Maximum {LIMITS.CHARACTER_CAP} characters allowed
          </div>
        )}
        
        {cloneError && (
          <div className="character-creator-error">
            {cloneError}
          </div>
        )}
        
        {showCrystalCapError && (
          <div className="character-creator-error">
            Crystal cap exceeded! Cannot add more bosses.
          </div>
        )}
      </form>
    </div>
  );
}

export default CharacterCreator; 