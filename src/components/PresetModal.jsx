import { getBossPrice } from '../data/bossData';

function PresetModal({
  show,
  onClose,
  presets,
  newPresetName,
  setNewPresetName,
  presetError,
  presetCreationMode,
  setPresetCreationMode,
  presetBosses,
  getSortedBossesByPrice,
  getBossDifficulties,
  formatPrice,
  handlePresetBossSelect,
  createPreset,
  applyPreset,
  deletePreset,
  selectedCharIdx,
  characters
}) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(40,32,74,0.95)',
      zIndex: 4000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(8px)'
    }}
    onClick={onClose}
    >
      <div className="modal-fade" style={{
        background: 'linear-gradient(145deg, #1a1730, #2d2540)',
        borderRadius: 16,
        padding: '2.5rem',
        maxWidth: 700,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#e6e0ff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 8px 32px rgba(162, 89, 247, 0.15)',
        position: 'relative',
        border: '1px solid rgba(162, 89, 247, 0.2)'
      }}
      onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            color: '#fff',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            outline: 'none',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            borderRadius: 8
          }}
          title="Close"
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#ff6b6b';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#fff';
          }}
        >
          ×
        </button>

        <div style={{ 
          width: 80, 
          height: 80, 
          background: 'linear-gradient(135deg, #a259f7, #805ad5)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(162, 89, 247, 0.4)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 8, fontSize: '1.8rem', textAlign: 'center' }}>
          Boss Presets
        </h2>

        <p style={{ textAlign: 'center', marginBottom: 32, color: '#b39ddb', fontSize: '1rem' }}>
          Create and manage your boss configuration presets
        </p>

        {/* Create New Preset */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(162, 89, 247, 0.15), rgba(128, 90, 213, 0.1))', 
          border: '2px solid rgba(162, 89, 247, 0.3)',
          borderRadius: 16, 
          padding: '24px', 
          marginBottom: 32 
        }}>
          <h3 style={{ color: '#d6b4ff', marginBottom: 20, fontSize: '1.3rem', fontWeight: 700, textAlign: 'center' }}>Create New Preset</h3>
          
          {/* Creation Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginBottom: 20,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))',
            borderRadius: 12,
            padding: 6,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setPresetCreationMode(false)}
              style={{
                flex: 1,
                background: !presetCreationMode 
                  ? 'linear-gradient(135deg, #a259f7, #805ad5)' 
                  : 'transparent',
                color: !presetCreationMode ? '#fff' : '#d6b4ff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 16px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: !presetCreationMode ? '0 4px 16px rgba(162, 89, 247, 0.3)' : 'none'
              }}
              onMouseOver={e => {
                if (presetCreationMode) {
                  e.currentTarget.style.background = 'rgba(162, 89, 247, 0.1)';
                }
              }}
              onMouseOut={e => {
                if (presetCreationMode) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              From Current Character
            </button>
            <button
              onClick={() => setPresetCreationMode(true)}
              style={{
                flex: 1,
                background: presetCreationMode 
                  ? 'linear-gradient(135deg, #a259f7, #805ad5)' 
                  : 'transparent',
                color: presetCreationMode ? '#fff' : '#d6b4ff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 16px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: presetCreationMode ? '0 4px 16px rgba(162, 89, 247, 0.3)' : 'none'
              }}
              onMouseOver={e => {
                if (!presetCreationMode) {
                  e.currentTarget.style.background = 'rgba(162, 89, 247, 0.1)';
                }
              }}
              onMouseOut={e => {
                if (!presetCreationMode) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              Manual Selection
            </button>
          </div>

          {/* Manual Boss Selection Mode */}
          {presetCreationMode && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                marginBottom: 16,
                textAlign: 'center',
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(162, 89, 247, 0.1), rgba(128, 90, 213, 0.05))',
                borderRadius: 8,
                border: '1px solid rgba(162, 89, 247, 0.2)'
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a259f7', marginBottom: 4 }}>
                  {Object.keys(presetBosses).length} bosses selected
                </div>
                <div style={{ fontSize: '0.85rem', color: '#c4b5d4' }}>
                  Click on boss difficulties to add them to your preset
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: 12, 
                maxHeight: '250px', 
                overflowY: 'auto',
                padding: '8px'
              }}>
                {getSortedBossesByPrice().map((boss) => {
                  const isSelected = !!presetBosses[boss.name];
                  const selectedDifficulty = presetBosses[boss.name];
                  const difficulties = getBossDifficulties(boss);
                  
                  return (
                    <div key={boss.name} style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(162, 89, 247, 0.2), rgba(128, 90, 213, 0.15))' 
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                      borderRadius: 10,
                      padding: '12px',
                      border: isSelected 
                        ? '2px solid rgba(162, 89, 247, 0.5)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected 
                        ? '0 4px 16px rgba(162, 89, 247, 0.2)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      {/* Boss Header */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 8,
                        marginBottom: 12
                      }}>
                        {boss.image && (
                          <img 
                            src={boss.image} 
                            alt={boss.name} 
                            style={{ 
                              width: 32, 
                              height: 32, 
                              objectFit: 'contain', 
                              borderRadius: 4,
                              background: '#fff1'
                            }}
                          />
                        )}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: '1rem', color: '#e6e0ff' }}>
                            {boss.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#b39ddb' }}>
                            Max: {formatPrice(boss.maxPrice)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Difficulty Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        gap: 6, 
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                      }}>
                        {difficulties.map(difficulty => {
                          const isThisDifficultySelected = selectedDifficulty === difficulty;
                          const price = getBossPrice(boss, difficulty);
                          
                          return (
                            <button
                              key={difficulty}
                              onClick={() => handlePresetBossSelect(boss.name, difficulty)}
                              style={{
                                background: isThisDifficultySelected 
                                  ? 'linear-gradient(135deg, #a259f7, #805ad5)' 
                                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))',
                                color: isThisDifficultySelected ? '#fff' : '#e6e0ff',
                                border: isThisDifficultySelected 
                                  ? '2px solid #a259f7' 
                                  : '2px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: 6,
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                minWidth: '80px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                boxShadow: isThisDifficultySelected 
                                  ? '0 4px 16px rgba(162, 89, 247, 0.3)' 
                                  : '0 2px 8px rgba(0, 0, 0, 0.1)'
                              }}
                              onMouseOver={e => {
                                if (!isThisDifficultySelected) {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(162, 89, 247, 0.15), rgba(128, 90, 213, 0.1))';
                                  e.currentTarget.style.borderColor = 'rgba(162, 89, 247, 0.4)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.2)';
                                }
                              }}
                              onMouseOut={e => {
                                if (!isThisDifficultySelected) {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))';
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                }
                              }}
                            >
                              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{difficulty}</div>
                              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                {formatPrice(price)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preset Name Input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              color: '#d6b4ff', 
              fontWeight: 600,
              fontSize: '1rem'
            }}>
              Preset Name
            </label>
            <input
              type="text"
              value={newPresetName}
              onChange={e => setNewPresetName(e.target.value)}
              placeholder="Enter preset name..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))',
                border: '2px solid rgba(162, 89, 247, 0.3)',
                borderRadius: 8,
                color: '#e6e0ff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.25s ease',
                boxSizing: 'border-box'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#a259f7';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(162, 89, 247, 0.15), 0 0 20px rgba(162, 89, 247, 0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(162, 89, 247, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error Display */}
          {presetError && (
            <div style={{ 
              color: '#ff6b6b', 
              fontSize: '0.9rem',
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: 6,
              padding: '8px 12px',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {presetError}
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={createPreset}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #a259f7, #805ad5)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 20px',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(162, 89, 247, 0.3)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #b470ff, #9f7aea)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(162, 89, 247, 0.4)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #a259f7, #805ad5)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.3)';
            }}
          >
            <svg width="20" height="20" style={{ marginRight: 8, verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none">
              <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Create Preset
          </button>
        </div>

        {/* Existing Presets */}
        <div>
          <h3 style={{ color: '#d6b4ff', marginBottom: 20, fontSize: '1.3rem', fontWeight: 700, textAlign: 'center' }}>
            Saved Presets ({presets.length})
          </h3>
          
          {presets.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#9d8bbc', 
              fontSize: '1rem', 
              padding: '40px 20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              No presets saved yet. Create your first preset above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {presets.map(preset => (
                <div key={preset.id} style={{
                  background: 'linear-gradient(135deg, rgba(162, 89, 247, 0.1), rgba(128, 90, 213, 0.05))',
                  borderRadius: 12,
                  padding: '18px',
                  border: '1px solid rgba(162, 89, 247, 0.2)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(162, 89, 247, 0.1)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(162, 89, 247, 0.15), rgba(128, 90, 213, 0.08))';
                  e.currentTarget.style.borderColor = 'rgba(162, 89, 247, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(162, 89, 247, 0.15)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(162, 89, 247, 0.1), rgba(128, 90, 213, 0.05))';
                  e.currentTarget.style.borderColor = 'rgba(162, 89, 247, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.1)';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, color: '#e6e0ff', fontSize: '1.2rem', fontWeight: 700 }}>
                      {preset.name}
                    </h4>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      style={{
                        background: 'linear-gradient(135deg, #ff6b6b, #ff5252)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        width: 32,
                        height: 32,
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
                      }}
                      title="Delete preset"
                      onMouseOver={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ff8a80, #ff6b6b)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #ff5252)';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)';
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <div style={{ color: '#b39ddb', fontSize: '0.9rem' }}>
                      {preset.bosses.length} bosses • Created {new Date(preset.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => applyPreset(preset)}
                    disabled={selectedCharIdx === null}
                    style={{
                      width: '100%',
                      background: selectedCharIdx === null 
                        ? 'linear-gradient(135deg, #555, #444)' 
                        : 'linear-gradient(135deg, #805ad5, #6b46c1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      cursor: selectedCharIdx === null ? 'not-allowed' : 'pointer',
                      opacity: selectedCharIdx === null ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: selectedCharIdx !== null ? '0 4px 16px rgba(128, 90, 213, 0.3)' : 'none'
                    }}
                    onMouseOver={e => {
                      if (selectedCharIdx !== null) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #9f7aea, #805ad5)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(128, 90, 213, 0.4)';
                      }
                    }}
                    onMouseOut={e => {
                      if (selectedCharIdx !== null) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #805ad5, #6b46c1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(128, 90, 213, 0.3)';
                      }
                    }}
                  >
                    Apply to {selectedCharIdx !== null && characters[selectedCharIdx] ? characters[selectedCharIdx].name : 'Character'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PresetModal; 