import { Tooltip } from './Tooltip';
import EditCharacterName from './EditCharacterName';
import { LIMITS } from '../constants';

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
      <div style={{ 
        margin: '2rem 0', 
        display: 'flex', 
        gap: '1rem', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <input
          type="text"
          value={newCharName}
          onChange={e => setNewCharName(e.target.value)}
          placeholder="Character name"
          style={{ 
            padding: '0.5rem', 
            borderRadius: '6px', 
            border: '1px solid #3a335a', 
            minWidth: '180px', 
            fontSize: '1rem', 
            background: '#3a335a', 
            color: '#e6e0ff',
            outline: 'none',
            boxShadow: 'none',
          }}
          onKeyDown={e => e.key === 'Enter' && onAddCharacter()}
        />
        <button
          onClick={onAddCharacter}
          disabled={!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP}
          style={{ 
            background: (!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP) ? '#555' : '#a259f7', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '0.5rem 1rem', 
            cursor: (!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP) ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold', 
            fontSize: '1rem',
            opacity: (!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP) ? 0.6 : 1
          }}
        >
          Add Character
        </button>
      </div>

      {characters.length > 0 && (
        <>
          {/* Character Management Section */}
          <div className="char-header-row" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 16, 
            justifyContent: 'center', 
            position: 'relative' 
          }}>
            {cloneError && (
              <div style={{ 
                color: '#ffbaba', 
                background: '#3a335a', 
                borderRadius: 6, 
                padding: '6px 16px', 
                fontSize: '1em', 
                fontWeight: 500, 
                marginBottom: 4, 
                boxShadow: '0 2px 8px #ffbaba22', 
                transition: 'opacity 0.3s', 
                position: 'absolute', 
                top: -36, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 20 
              }}>
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
              style={{
                background: '#3a335a',
                color: '#e6e0ff',
                border: '1px solid #3a335a',
                borderRadius: 10,
                fontSize: '1.1em',
                minWidth: 140,
                height: 36,
                boxShadow: 'none',
                textAlign: 'center',
                textAlignLast: 'center',
                paddingRight: 20,
                outline: 'none',
              }}
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
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 16,
              background: '#352d58',
              borderRadius: 12,
              padding: '10px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              maxWidth: '200px',
              margin: '0 auto 16px auto',
              textAlign: 'center'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1.2em', color: '#d4c1ff' }}>
                <span style={{ color: '#a259f7' }}>
                  {characters.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0)}
                </span>
                <span style={{ opacity: 0.8 }}> / 180</span>
              </div>
              <div style={{ fontSize: '0.8em', color: '#9d8bbc', marginTop: 4 }}>
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