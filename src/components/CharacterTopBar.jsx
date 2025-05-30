import React from 'react';
import { Tooltip } from './Tooltip';
import { LIMITS } from '../constants';
import CharacterDropdown from './CharacterDropdown';
import '../styles/characters.css'; // Assuming styles are here or imported globally

function CharacterTopBar({
  characterBossSelections,
  newCharName,
  setNewCharName,
  selectedCharIdx,
  onCharacterChange,
  onAddCharacter,
  onRemoveCharacter,
  // No clone/delete here, they move to BossSelectionTable header
  showCrystalCapError, // This might be displayed differently or below the bar
  cloneError // This might also be displayed differently or below the bar
}) {
  const totalCrystals = characterBossSelections.reduce(
    (sum, char) => sum + (char.bosses ? char.bosses.length : 0),
    0
  );

  return (
    <div className="character-top-bar">
      <div className="character-top-bar-left">
        <form className="add-character-form-inline" onSubmit={(e) => { e.preventDefault(); onAddCharacter(); }}>
          <input
            type="text"
            value={newCharName}
            onChange={e => setNewCharName(e.target.value)}
            placeholder="New character name..."
            className="character-name-input-slim"
          />
          <button
            type="submit" // Use submit for form
            disabled={!newCharName.trim() || characterBossSelections.length >= LIMITS.CHARACTER_CAP}
            className="character-action-button-slim"
          >
            Add
          </button>
        </form>

        {characterBossSelections.length > 0 && (
          <CharacterDropdown
            characterBossSelections={characterBossSelections}
            selectedCharIdx={selectedCharIdx}
            onCharacterChange={onCharacterChange}
            onRemoveCharacter={onRemoveCharacter}
          />
        )}
      </div>

      <div className="character-top-bar-right">
        <div className="crystal-counter-bar">
          <span className="number">{totalCrystals}</span>
          <span className="total">/ 180</span>
          <span className="label">Crystals</span>
        </div>
      </div>
    </div>
  );
}

export default CharacterTopBar; 