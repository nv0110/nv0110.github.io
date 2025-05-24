import React from 'react';

function CharacterSidebar({
  sidebarVisible,
  isHistoricalWeek,
  totalMeso,
  obtainableMeso,
  selectedWeekKey,
  hideCompleted,
  setHideCompleted,
  visibleCharSummaries,
  selectedCharIdx,
  setSelectedCharIdx,
  isReadOnlyMode,
  setPurgeTargetCharacter,
  setShowCharacterPurgeConfirm
}) {
  return (
    <div style={{ 
      width: sidebarVisible ? 280 : 0,
      minWidth: sidebarVisible ? 280 : 0,
      background: 'linear-gradient(180deg, rgba(40, 32, 74, 0.95), rgba(35, 32, 58, 0.9))',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRight: sidebarVisible ? '1px solid rgba(162, 89, 247, 0.15)' : 'none',
      position: 'fixed',
      left: 0,
      top: 0, // Touch the navbar
      bottom: 0,
      overflowY: 'auto',
      zIndex: 99, // Below navbar but above content
      padding: sidebarVisible ? '1rem' : '0', 
      paddingTop: sidebarVisible ? '100px' : '0', // Account for navbar height
      boxShadow: sidebarVisible ? '2px 0 24px rgba(162, 89, 247, 0.08), 2px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      {sidebarVisible && (
        <>
          {/* Sidebar Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(162, 89, 247, 0.15)'
          }}>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: 700,
              margin: 0, 
              color: '#e6e0ff',
              marginBottom: '0.5rem'
            }}>
              Characters
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 20, height: 20 }} />
              <img src="/bosses/bluecrystal.png" alt="Blue Crystal" style={{ width: 20, height: 20 }} />
              <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" style={{ width: 20, height: 20 }} />
            </div>
          </div>

          {/* Progress Bar - only for current week */}
          {!isHistoricalWeek && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              backdropFilter: 'blur(8px)',
              borderRadius: 12, 
              padding: '1rem', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              marginBottom: '1rem' 
            }}>
              <div style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                marginBottom: '0.5rem', 
                color: '#d6b4ff',
                textAlign: 'center' 
              }}>
                Weekly Progress
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.1)', height: 6, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                <div style={{ 
                  background: 'linear-gradient(90deg, #a259f7, #b47aff)', 
                  height: '100%', 
                  width: `${obtainableMeso > 0 ? Math.min((totalMeso / obtainableMeso) * 100, 100) : 0}%`, 
                  borderRadius: 3, 
                  transition: 'width 0.3s ease' 
                }} />
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '0.4rem', 
                color: '#c4b5d4', 
                fontSize: '0.8rem' 
              }}>
                <span>{totalMeso.toLocaleString()}</span>
                <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 16, height: 16 }} />
                <span>{obtainableMeso.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Historical week indicator */}
          {isHistoricalWeek && (
            <div style={{ 
              background: 'rgba(162, 89, 247, 0.1)', 
              backdropFilter: 'blur(8px)',
              borderRadius: 12, 
              padding: '1rem', 
              border: '1px solid rgba(162, 89, 247, 0.2)',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#d6b4ff', fontSize: '0.9rem', fontWeight: 600 }}>
                Week {selectedWeekKey}
              </div>
              <div style={{ color: '#b39ddb', fontSize: '0.8rem' }}>
                Historical Data
              </div>
            </div>
          )}

          {/* Hide completed checkbox */}
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <label style={{ 
              fontSize: '0.85rem', 
              color: '#c4b5d4', 
              cursor: 'pointer', 
              userSelect: 'none', 
              display: 'inline-flex', 
              alignItems: 'center',
              gap: '6px'
            }}>
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={e => setHideCompleted(e.target.checked)}
                style={{ accentColor: '#a259f7' }}
              />
              Hide completed
            </label>
          </div>

          {/* Character Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleCharSummaries.length === 0 ? (
              <div style={{ 
                color: '#9f9fb8', 
                fontSize: '0.9rem', 
                textAlign: 'center', 
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {hideCompleted ? 'No characters with bosses left to clear.' : 'No characters found.'}
              </div>
            ) : (
              visibleCharSummaries.map(cs => (
                <div
                  key={cs.name + '-' + cs.idx}
                  onClick={() => setSelectedCharIdx(cs.idx)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!isReadOnlyMode) {
                      setPurgeTargetCharacter({ name: cs.name, idx: cs.idx });
                      setShowCharacterPurgeConfirm(true);
                    }
                  }}
                  style={{
                    background: selectedCharIdx === cs.idx 
                      ? 'linear-gradient(135deg, rgba(162, 89, 247, 0.25), rgba(128, 90, 213, 0.2))' 
                      : 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 12,
                    padding: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedCharIdx === cs.idx 
                      ? (isHistoricalWeek ? '1px solid rgba(159, 122, 234, 0.5)' : '1px solid rgba(162, 89, 247, 0.5)')
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    transform: selectedCharIdx === cs.idx ? 'translateX(3px)' : 'translateX(0)',
                    boxShadow: selectedCharIdx === cs.idx 
                      ? '0 8px 32px rgba(162, 89, 247, 0.15)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={e => {
                    if (selectedCharIdx !== cs.idx) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.1)';
                    }
                  }}
                  onMouseOut={e => {
                    if (selectedCharIdx !== cs.idx) {
                      e.currentTarget.style.background = '#23203a';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  {/* Historical week indicator */}
                  {isHistoricalWeek && selectedCharIdx === cs.idx && (
                    <div style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: isReadOnlyMode ? '#ff6b6b' : '#38a169',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      fontSize: '0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      zIndex: 5
                    }}>
                      {isReadOnlyMode ? '🔒' : '✏️'}
                    </div>
                  )}

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.4rem'
                  }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '1rem',
                      color: selectedCharIdx === cs.idx ? '#e6e0ff' : '#d0c5ff'
                    }}>
                      {cs.name}
                    </span>
                    {cs.allCleared && (
                      <svg width="16" height="16" viewBox="0 0 22 22">
                        <circle cx="11" cy="11" r="11" fill="#38a169"/>
                        <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {cs.total === 0 ? (
                    <div style={{ color: '#888', fontWeight: 500, fontSize: '0.85rem' }}>
                      No bosses configured
                    </div>
                  ) : (
                    <>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#b39ddb',
                        marginBottom: '0.3rem'
                      }}>
                        {cs.cleared} / {cs.total} bosses cleared
                      </div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 600,
                        color: '#a259f7'
                      }}>
                        {cs.totalMeso.toLocaleString()} meso
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CharacterSidebar; 