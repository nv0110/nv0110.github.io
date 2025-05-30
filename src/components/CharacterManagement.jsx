import React from 'react';
import CharacterTopBar from './CharacterTopBar';
import '../styles/characters.css'; // For error messages if any retained here

// This component is now a wrapper, mainly for CharacterTopBar and potential global errors
function CharacterManagement({
  characterBossSelections,
  newCharName,
  setNewCharName,
  selectedCharIdx,
  cloneError,
  onCharacterChange,
  onAddCharacter,
  onUpdateCharacterName, // This will be triggered from BossSelectionTable header via InputPage
  onCloneCharacter,      // This will be triggered from BossSelectionTable header via InputPage
  onRemoveCharacter,     // This will be triggered from BossSelectionTable header via InputPage
  showCrystalCapError
}) {
  return (
    <>
      <CharacterTopBar 
        characterBossSelections={characterBossSelections}
        newCharName={newCharName}
        setNewCharName={setNewCharName}
        selectedCharIdx={selectedCharIdx}
        onCharacterChange={onCharacterChange}
        onAddCharacter={onAddCharacter}
        onRemoveCharacter={onRemoveCharacter}
      />
      {/* Display clone and crystal cap errors below the bar */}
      {cloneError && (
        <div className="character-inline-error-message">
          {cloneError}
        </div>
      )}
      {showCrystalCapError && selectedCharIdx !== null && (
        <div className="character-inline-error-message">
          Crystal cap exceeded! Cannot add more bosses for this character.
        </div>
      )}
    </>
  );
}

export default CharacterManagement; 