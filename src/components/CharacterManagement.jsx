import { Tooltip } from './Tooltip';
import EditCharacterName from './EditCharacterName';
import { LIMITS } from '../constants';
import './CharacterManagement.css';

function CharacterManagement({
  characterBossSelections,
  newCharName,
  setNewCharName,
  selectedCharIdx,
  cloneError,
  onCharacterChange,
  onAddCharacter,
  onUpdateCharacterName,
  onCloneCharacter,
  onRemoveCharacter,
  showCrystalCapError
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
          disabled={!newCharName.trim() || characterBossSelections.length >= LIMITS.CHARACTER_CAP}
          className="add-character-button"
        >
          Add Character
        </button>
      </div>

      {characterBossSelections.length > 0 && (
        <>
          {/* Character Management Section */}
          <div className="character-management-row">
            {cloneError && (
              <div className="clone-error-message">
                {cloneError}
              </div>
            )}
            
            {selectedCharIdx !== null && characterBossSelections[selectedCharIdx] && (
              <EditCharacterName
                name={characterBossSelections[selectedCharIdx].name}
                onSave={newName => onUpdateCharacterName(selectedCharIdx, newName)}
              />
            )}
            
            <select
              value={selectedCharIdx ?? ''}
              onChange={onCharacterChange}
              className="character-select-dropdown"
            >
              <option value="">Select a Character</option>
              {characterBossSelections.map((char, idx) => (
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
          {selectedCharIdx !== null && characterBossSelections[selectedCharIdx] && (
            <div className="crystals-counter-container">
              {showCrystalCapError ? (
                <div className="crystals-cap-error-text">Cannot exceed 180 crystal limit</div>
              ) : (() => {
                const totalCrystals = characterBossSelections.reduce(
                  (sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0
                );
                
                if (totalCrystals === 180) {
                  return (
                    <>
                      <div className="crystals-counter-main crystals-counter-max">
                        <span className="crystals-counter-number-max">180</span>
                      </div>
                      <div className="crystals-counter-label">
                        Total Crystals
                      </div>
                    </>
                  );
                } else {
                  return (
                    <>
                      <div className="crystals-counter-main">
                        <span className="crystals-counter-number">
                          {totalCrystals}
                        </span>
                        <span className="crystals-counter-total"> / 180</span>
                      </div>
                      <div className="crystals-counter-label">
                        Total Crystals
                      </div>
                    </>
                  );
                }
              })()}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default CharacterManagement; 