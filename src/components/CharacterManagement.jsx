import { Tooltip } from './Tooltip';
import EditCharacterName from './EditCharacterName';
import { LIMITS } from '../constants';
import './CharacterManagement.css';

function CharacterManagement({
  characters,
  newCharName,
  setNewCharName,
  selectedCharIdx,
  cloneError,
  onCharacterChange,
  onAddCharacter,
  onUpdateCharacterName,
  onCloneCharacter,
  onRemoveCharacter
}) {
  return (
    <>
      {/* Character Creation Section */}
      <div className="character-creation-container">
        <input
          type="text"
          value={newCharName}
          onChange={e => setNewCharName(e.target.value)}
          placeholder="Character name"
          className="character-name-input"
          onKeyDown={e => e.key === 'Enter' && onAddCharacter()}
        />
        <button
          onClick={onAddCharacter}
          disabled={!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP}
          className="add-character-button"
        >
          Add Character
        </button>
      </div>

      {characters.length > 0 && (
        <>
          {/* Character Management Section */}
          <div className="character-management-row">
            {cloneError && (
              <div className="clone-error-message">
                {cloneError}
              </div>
            )}
            
            {selectedCharIdx !== null && characters[selectedCharIdx] && (
              <EditCharacterName
                name={characters[selectedCharIdx].name}
                onSave={newName => onUpdateCharacterName(selectedCharIdx, newName)}
              />
            )}
            
            <select
              value={selectedCharIdx ?? ''}
              onChange={onCharacterChange}
              className="character-select-dropdown"
            >
              <option value="">Select a Character</option>
              {characters.map((char, idx) => (
                <option key={idx} value={idx}>{char.name}</option>
              ))}
            </select>
            
            {selectedCharIdx !== null && (
              <>
                <Tooltip text="Clone this character (max 180 crystals)">
                  <button 
                    className="boton-elegante clone" 
                    onClick={() => onCloneCharacter(selectedCharIdx)}
                  >
                    Clone
                  </button>
                </Tooltip>
                
                <Tooltip text="Delete this character">
                  <button 
                    className="boton-elegante delete" 
                    onClick={() => onRemoveCharacter(selectedCharIdx)}
                  >
                    Delete
                  </button>
                </Tooltip>
              </>
            )}
          </div>

          {/* Total Crystals Counter */}
          {selectedCharIdx !== null && characters[selectedCharIdx] && (
            <div className="crystals-counter-container">
              <div className="crystals-counter-main">
                <span className="crystals-counter-number">
                  {characters.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0)}
                </span>
                <span className="crystals-counter-total"> / 180</span>
              </div>
              <div className="crystals-counter-label">
                Total Crystals
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default CharacterManagement; 