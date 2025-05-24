import React from 'react';
import { getPitchedKey } from '../utils/stringUtils';
import CustomCheckbox from './CustomCheckbox';

function BossTable({
  isHistoricalWeek,
  characters,
  selectedCharIdx,
  charBosses,
  sortedBosses,
  bossData,
  checked,
  charKey,
  getBossPrice,
  isReadOnlyMode,
  pitchedChecked,
  weekKey,
  handleCheck,
  userInteractionRef,
  userCode,
  savePitchedItem,
  removeManyPitchedItems,
  setPitchedChecked,
  setError,
  startStatsTrackingIfNeeded,
  setHistoricalPitchedData,
  setShowHistoricalPitchedModal,
  readOnlyOverride
}) {
  return (
    <div className="table-scroll" style={{ 
      display: 'flex', 
      justifyContent: 'center',
      width: '100%'
    }}>
      <table style={{ 
        borderCollapse: 'collapse', 
        minWidth: 700,
        maxWidth: 800,
        width: '100%',
        border: '1px solid #e0e0ef', 
        borderRadius: 12, 
        overflow: 'hidden' 
      }}>
        <thead>
          <tr style={{ background: '#3a2a5d', color: '#e6e0ff' }}>
            <th style={{ padding: '6px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 180 }}>Boss</th>
            {!isHistoricalWeek && (
              <>
                <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 110 }}>Difficulty</th>
                <th style={{ padding: '6px 24px', textAlign: 'right', fontWeight: 600, fontSize: '0.9em', minWidth: 110 }}>Mesos</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 90 }}>Cleared</th>
              </>
            )}
            {isHistoricalWeek && (
              <th style={{ padding: '6px 14px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 200 }}>Pitched Items</th>
            )}
          </tr>
        </thead>
        <tbody>
          {isHistoricalWeek ? (
            // Historical week view - show unique bosses with pitched items only
            (() => {
              // Get all unique bosses across all characters
              const allBosses = new Map();
              characters.forEach(char => {
                char.bosses?.forEach(boss => {
                  const bossObj = bossData.find(bd => bd.name === boss.name);
                  if (bossObj && bossObj.pitchedItems && bossObj.pitchedItems.length > 0) {
                    allBosses.set(boss.name, bossObj);
                  }
                });
              });

              return Array.from(allBosses.values()).map((bossObj, idx) => (
                <tr
                  key={bossObj.name}
                  style={{
                    background: idx % 2 === 0 ? '#23203a' : '#201c32',
                    border: '1px solid #3a335a',
                    color: '#e6e0ff',
                    opacity: 0.9
                  }}
                >
                  {/* Boss Column */}
                  <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {bossObj.image && (
                      <img
                        src={bossObj.image}
                        alt={bossObj.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: 'contain',
                          borderRadius: 6,
                          background: '#fff2',
                          marginRight: 8
                        }}
                      />
                    )}
                    <span style={{ fontWeight: 600 }}>{bossObj.name}</span>
                  </td>

                  {/* Pitched Items Column */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {(bossObj.pitchedItems || []).map(item => {
                        // Check if any character has this pitched item for this boss in this week
                        let hasPitchedItem = false;
                        let characterWithItem = null;

                        // Check across all characters
                        characters.forEach((char, charIdx) => {
                          const key = getPitchedKey(char.name, charIdx, bossObj.name, item.name, weekKey);
                          if (pitchedChecked[key]) {
                            hasPitchedItem = true;
                            characterWithItem = char.name;
                          }
                        });

                        return (
                          <div
                            key={item.name}
                            className="pitched-item-icon"
                            style={{
                              position: 'relative',
                              display: 'inline-block',
                              borderRadius: 6,
                              boxShadow: hasPitchedItem ? '0 0 8px #a259f7' : 'none',
                              border: hasPitchedItem ? '2px solid #a259f7' : '2px solid #3a335a',
                              background: hasPitchedItem ? '#3a335a' : '#23203a',
                              transition: 'box-shadow 0.2s, border 0.2s, background 0.2s',
                              width: 36,
                              height: 36,
                              cursor: isReadOnlyMode ? 'default' : 'pointer',
                              opacity: isReadOnlyMode ? 0.6 : 1
                            }}
                            title={isReadOnlyMode 
                              ? (hasPitchedItem ? `${item.name} (obtained by ${characterWithItem})` : item.name)
                              : `Click to track: ${item.name}${hasPitchedItem ? ` (obtained by ${characterWithItem})` : ''}`
                            }
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              // For historical weeks in read-only mode, block interaction
                              if (isReadOnlyMode) {
                                console.log('Historical pitched item click blocked - read-only mode');
                                return;
                              }

                              // For historical weeks in edit mode, show historical logging modal
                              if (isHistoricalWeek && readOnlyOverride) {
                                console.log('Opening historical pitched item modal for:', item.name);
                                setHistoricalPitchedData({
                                  character: '', // Will be selected in modal
                                  characterIdx: -1,
                                  bossName: bossObj.name,
                                  itemName: item.name,
                                  itemImage: item.image,
                                  weekKey: weekKey
                                });
                                setShowHistoricalPitchedModal(true);
                                return;
                              }
                            }}
                            onMouseOver={e => {
                              if (!isReadOnlyMode) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = hasPitchedItem ? '0 0 12px #a259f7' : '0 0 8px rgba(162, 89, 247, 0.5)';
                              }
                            }}
                            onMouseOut={e => {
                              if (!isReadOnlyMode) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = hasPitchedItem ? '0 0 8px #a259f7' : 'none';
                              }
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: 'contain',
                                borderRadius: 4,
                                opacity: hasPitchedItem ? 1 : 0.4,
                                filter: hasPitchedItem ? 'drop-shadow(0 0 6px #a259f7)' : 'none'
                              }}
                            />
                            {hasPitchedItem && (
                              <span style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                background: '#a259f7',
                                color: '#fff',
                                borderRadius: '50%',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 700,
                                boxShadow: '0 1px 4px #0004'
                              }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ));
            })()
          ) : (
            // Current week view - show detailed boss information
            sortedBosses.map((b, idx) => {
              const bossObj = bossData.find(bd => bd.name === b.name);
              const isChecked = !!checked[charKey]?.[b.name + '-' + b.difficulty];
              const pitched = bossObj?.pitchedItems || [];
              return (
                <tr
                  key={b.name + '-' + b.difficulty}
                  style={{
                    background: idx % 2 === 0 ? '#23203a' : '#201c32',
                    border: '1px solid #3a335a',
                    transition: 'background-color 0.2s ease, transform 0.2s ease',
                    cursor: isReadOnlyMode ? 'default' : 'pointer',
                    color: '#e6e0ff',
                    ...(isReadOnlyMode && { opacity: 0.8 })
                  }}
                  onMouseOver={e => !isReadOnlyMode && (e.currentTarget.style.background = '#2a2540')}
                  onMouseOut={e => !isReadOnlyMode && (e.currentTarget.style.background = idx % 2 === 0 ? '#23203a' : '#201c32')}
                  onClick={(e) => {
                    // Only trigger if the click wasn't on the checkbox or pitched item
                    // Also check if it's read-only mode
                    if (!isReadOnlyMode && !e.target.closest('.checkbox-wrapper') && !e.target.closest('.pitched-item-icon')) {
                      handleCheck(b, !isChecked, e);
                    }
                  }}
                >
                  <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {bossObj?.image && (
                      <img
                        src={bossObj.image}
                        alt={b.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: 'contain',
                          borderRadius: 6,
                          background: '#fff2',
                          marginRight: 8,
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    )}
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                    {pitched.length > 0 && (
                      (b.name === 'Lotus' && (b.difficulty === 'Hard' || b.difficulty === 'Extreme')) ||
                      (b.name !== 'Lotus' && ['Hard', 'Chaos', 'Extreme', 'Hell'].includes(b.difficulty))
                    ) && (
                      <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                        {pitched.map(item => {
                          // For Lotus, TC only on Extreme, others on Hard/Extreme
                          if (b.name === 'Lotus') {
                            if (item.name === 'Total Control' && b.difficulty !== 'Extreme') return null;
                            if ((item.name === 'Berserked' || item.name === 'Black Heart') && !['Hard', 'Extreme'].includes(b.difficulty)) return null;
                          }
                          const key = getPitchedKey(characters[selectedCharIdx].name, selectedCharIdx, b.name, item.name, weekKey);
                          const got = !!pitchedChecked[key];
                          return (
                            <span
                              key={item.name}
                              className="pitched-item-icon"
                              title={`Track: ${item.name}`}
                              style={{
                                position: 'relative',
                                display: 'inline-block',
                                cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
                                borderRadius: 6,
                                boxShadow: got ? '0 0 8px #a259f7' : 'none',
                                border: got ? '2px solid #a259f7' : '2px solid #3a335a',
                                background: got ? '#3a335a' : '#23203a',
                                transition: 'box-shadow 0.2s, border 0.2s, background 0.2s',
                                width: 32,
                                height: 32,
                                marginLeft: 2,
                                opacity: isReadOnlyMode ? 0.6 : 1
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                
                                // For historical weeks in read-only mode, block interaction
                                if (isReadOnlyMode) {
                                  console.log('Historical pitched item click blocked - read-only mode');
                                  return;
                                }

                                // For historical weeks in edit mode, show historical logging modal
                                if (isHistoricalWeek && readOnlyOverride) {
                                  console.log('Opening historical pitched item modal for:', item.name);
                                  setHistoricalPitchedData({
                                    character: '', // Will be selected in modal
                                    characterIdx: -1,
                                    bossName: bossObj.name,
                                    itemName: item.name,
                                    itemImage: item.image,
                                    weekKey: weekKey
                                  });
                                  setShowHistoricalPitchedModal(true);
                                  return;
                                }

                                // For current week operations
                                const charKey = `${characters[selectedCharIdx].name}-${selectedCharIdx}`;
                                const key = getPitchedKey(characters[selectedCharIdx].name, selectedCharIdx, bossObj.name, item.name, weekKey);
                                const got = !!pitchedChecked[key];
                                
                                // Check across all characters for this item
                                let itemOwnedByOtherChar = false;
                                let ownerCharName = '';
                                characters.forEach((char, charIdx) => {
                                  if (charIdx !== selectedCharIdx) {
                                    const otherKey = getPitchedKey(char.name, charIdx, bossObj.name, item.name, weekKey);
                                    if (pitchedChecked[otherKey]) {
                                      itemOwnedByOtherChar = true;
                                      ownerCharName = char.name;
                                    }
                                  }
                                });

                                if (itemOwnedByOtherChar && !got) {
                                  alert(`${item.name} is already obtained by ${ownerCharName}. Only one character can have each item per week.`);
                                  return;
                                }

                                try {
                                  // Set user interaction flag to prevent sync conflicts
                                  userInteractionRef.current = true;
                                  console.log('🖱️ USER: Pitched item clicked:', { item, boss: bossObj.name, character: characters[selectedCharIdx].name, currentState: got });
                                  
                                  // If boss is not cleared, check it too
                                  const bossCleared = !!checked[charKey]?.[bossObj.name + '-' + bossObj.difficulty];
                                  if (!bossCleared) {
                                    console.log('🖱️ USER: Auto-checking boss since it was not cleared');
                                    handleCheck(bossObj, true, e);
                                  }
                                  
                                  // Optimistically update UI immediately
                                  setPitchedChecked(prev => {
                                    const updated = { ...prev };
                                    if (got) {
                                      delete updated[key];
                                    } else {
                                      updated[key] = true;
                                    }
                                    return updated;
                                  });
                                  
                                  // Save to database
                                  const pitchedData = {
                                    character: characters[selectedCharIdx].name,
                                    characterIdx: selectedCharIdx,
                                    bossName: bossObj.name,
                                    itemName: item.name,
                                    itemImage: item.image,
                                    date: new Date().toISOString()
                                  };
                                  
                                  await savePitchedItem(userCode, pitchedData, got, weekKey);
                                  console.log('🖱️ USER: Successfully saved pitched item state');
                                  
                                } catch (error) {
                                  console.error('🖱️ USER: Error in pitched item click handler:', error);
                                  setError('Failed to save pitched item. Please try again.');
                                  // Revert optimistic update
                                  setPitchedChecked(prev => {
                                    const revertState = { ...prev };
                                    if (got) {
                                      revertState[key] = true; // restore original state
                                    } else {
                                      delete revertState[key]; // restore original state
                                    }
                                    return revertState;
                                  });
                                } finally {
                                  // Clear user interaction flag after a delay to allow UI to settle
                                  setTimeout(() => {
                                    userInteractionRef.current = false;
                                    console.log('🖱️ USER: Interaction flag cleared, sync can resume');
                                  }, 1000);
                                }
                                
                                startStatsTrackingIfNeeded();
                              }}
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 28,
                                  height: 28,
                                  objectFit: 'contain',
                                  borderRadius: 4,
                                  opacity: got ? 1 : 0.7,
                                  filter: got ? 'drop-shadow(0 0 6px #a259f7)' : 'none',
                                  transition: 'opacity 0.2s, filter 0.2s'
                                }}
                              />
                              {got && (
                                <span style={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  background: '#a259f7',
                                  color: '#fff',
                                  borderRadius: '50%',
                                  width: 14,
                                  height: 14,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  boxShadow: '0 1px 4px #0004'
                                }}>✓</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'left' }}>
                    <span>{b.difficulty}</span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                    <span>{Math.floor(getBossPrice(b.name, b.difficulty) / (b.partySize || 1)).toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span onClick={e => e.stopPropagation()}>
                      <CustomCheckbox
                        checked={isChecked}
                        onChange={e => !isReadOnlyMode && handleCheck(b, e.target.checked, e)}
                        disabled={isReadOnlyMode}
                      />
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BossTable; 