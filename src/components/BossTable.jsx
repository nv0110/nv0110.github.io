import React from 'react';
import { getPitchedKey } from '../utils/stringUtils';
import CustomCheckbox from './CustomCheckbox';

function BossTable({
  isHistoricalWeek,
  characterBossSelections,
  selectedCharIdx,
  sortedBosses,
  bossData,
  checked,
  charKey,
  getBossPrice,
  pitchedChecked,
  weekKey,
  handleCheck,
  userInteractionRef,
  userCode,
  savePitchedItem,
  setPitchedChecked,
  setError,
  startStatsTrackingIfNeeded,
  setHistoricalPitchedData,
  setShowHistoricalPitchedModal,
  loadingPitchedItems,
  setLoadingPitchedItems,
  refreshPitchedItems,
  refreshHistoricalAnalysis
}) {
  // Historical week card layout
  if (isHistoricalWeek) {
              // Get all unique bosses across all characters
              const allBosses = new Map();
              characterBossSelections.forEach(char => {
                char.bosses?.forEach(boss => {
                  const bossObj = bossData.find(bd => bd.name === boss.name);
                  if (bossObj && bossObj.pitchedItems && bossObj.pitchedItems.length > 0) {
                    allBosses.set(boss.name, bossObj);
                  }
                });
              });

    return (
      <div className="historical-week-cards-container">
        {Array.from(allBosses.values()).map((bossObj) => (
          <div key={bossObj.name} className="historical-boss-card">
            <div className="historical-boss-header">
                      <img
                        src={bossObj.image}
                        alt={bossObj.name}
                className="historical-boss-image"
              />
              <div className="historical-boss-info">
                <div className="historical-boss-name">{bossObj.name}</div>
                <div className="historical-boss-difficulty">
                  {/* Show all difficulties this boss appears in */}
                  {(() => {
                    const difficulties = new Set();
                    characterBossSelections.forEach(char => {
                      char.bosses?.forEach(boss => {
                        if (boss.name === bossObj.name) {
                          difficulties.add(boss.difficulty);
                        }
                      });
                    });
                    return Array.from(difficulties).join(', ');
                  })()}
                </div>
              </div>
            </div>

            <div className="historical-pitched-section">
              <div className="historical-pitched-label">Pitched Items</div>
              {(bossObj.pitchedItems || []).length > 0 ? (
                <div className="historical-pitched-grid">
                      {(bossObj.pitchedItems || []).map(item => {
                        // Check if the currently selected character has this pitched item for this boss in this week
                        const key = getPitchedKey(characterBossSelections[selectedCharIdx].name, selectedCharIdx, bossObj.name, item.name, weekKey);
                        const hasPitchedItem = !!pitchedChecked[key];
                        const characterWithItem = hasPitchedItem ? characterBossSelections[selectedCharIdx].name : null;

                        return (
                          <div
                            key={item.name}
                        className={`historical-pitched-item ${hasPitchedItem ? 'obtained' : ''}`}
                            title={hasPitchedItem 
                              ? `Click to remove: ${item.name} (obtained by ${characterWithItem})`
                              : `Click to track: ${item.name}`
                            }
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              // For historical weeks, always allow interaction
                              if (isHistoricalWeek) {
                                if (hasPitchedItem) {
                                  // Remove the historical pitched item
                                  console.log('Removing historical pitched item:', item.name);
                                  try {
                                    const result = await savePitchedItem(userCode, {
                                      character: characterWithItem,
                                      characterIdx: characterBossSelections.findIndex(c => c.name === characterWithItem),
                                      bossName: bossObj.name,
                                      bossDifficulty: 'Unknown', // Historical items may not have difficulty info
                                      itemName: item.name,
                                      itemImage: item.image,
                                      date: new Date().toISOString()
                                    }, true, weekKey); // true = remove
                                    
                                    if (result.success) {
                                      console.log('✅ Historical pitched item removed successfully');
                                      // Refresh pitched items to sync with database
                                      await refreshPitchedItems(userCode);
                                      // Refresh historical analysis to update navigation
                                      if (refreshHistoricalAnalysis) {
                                        await refreshHistoricalAnalysis();
                                      }
                                    } else {
                                      console.error('❌ Failed to remove historical pitched item:', result.error);
                                      setError('Failed to remove historical pitched item: ' + (result.error || 'Unknown error'));
                                    }
                                  } catch (error) {
                                    console.error('❌ Error removing historical pitched item:', error);
                                    setError('Error removing historical pitched item: ' + error.message);
                                  }
                                } else {
                                  // Show historical logging modal for adding
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
                                }
                                return;
                              }
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                          className={`historical-pitched-item-image ${hasPitchedItem ? 'obtained' : 'not-obtained'}`}
                            />
                            {hasPitchedItem && (
                          <span className="historical-pitched-checkmark">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
              ) : (
                <div className="historical-no-pitched">
                  No pitched items available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="boss-table-scroll">
      <table className={`boss-table ${isHistoricalWeek ? 'historical-week' : ''}`}>
        <thead>
          <tr className="boss-table-header-row">
            <th className="boss-table-header-cell">Boss</th>
            <th className="boss-table-header-cell-difficulty">Difficulty</th>
            <th className="boss-table-header-cell-mesos">Mesos</th>
            <th className="boss-table-header-cell-cleared">Cleared</th>
          </tr>
        </thead>
        <tbody>
          {/* Current week view - show detailed boss information */}
          {sortedBosses.map((b, idx) => {
              const bossObj = bossData.find(bd => bd.name === b.name);
              const isChecked = !!checked[charKey]?.[b.name + '-' + b.difficulty];
              const pitched = bossObj?.pitchedItems || [];
              return (
                <tr
                  key={b.name + '-' + b.difficulty}
                  className={`boss-table-row ${idx % 2 === 0 ? 'even' : 'odd'}`}
                                      onClick={(e) => {
                      // Only trigger if the click wasn't on the checkbox or pitched item
                      if (!e.target.closest('.checkbox-wrapper') && !e.target.closest('.pitched-item-icon')) {
                        handleCheck(b, !isChecked, e);
                      }
                    }}
                >
                  <td className="boss-table-cell-boss">
                    {bossObj?.image && (
                      <img
                        src={bossObj.image}
                        alt={b.name}
                        className="boss-table-boss-image"
                      />
                    )}
                    <span className="boss-table-boss-name">{b.name}</span>
                    {pitched.length > 0 && (
                      (b.name === 'Lotus' && (b.difficulty === 'Hard' || b.difficulty === 'Extreme')) ||
                      (b.name !== 'Lotus' && ['Hard', 'Chaos', 'Extreme', 'Hell'].includes(b.difficulty))
                    ) && (
                      <div className="boss-table-pitched-container inline">
                        {pitched.map(item => {
                          // For Lotus, TC only on Extreme, others on Hard/Extreme
                          if (b.name === 'Lotus') {
                            if (item.name === 'Total Control' && b.difficulty !== 'Extreme') return null;
                            if ((item.name === 'Berserked' || item.name === 'Black Heart') && !['Hard', 'Extreme'].includes(b.difficulty)) return null;
                          }
                          const key = getPitchedKey(characterBossSelections[selectedCharIdx].name, selectedCharIdx, b.name, item.name, weekKey);
                          const got = !!pitchedChecked[key];
                          
                          // Debug logging for pitched item state - ENHANCED
                          // console.log(`🎯 BOSS TABLE: Checking pitched item ${item.name} for ${characterBossSelections[selectedCharIdx].name}(${selectedCharIdx}):`, {
                          //   key,
                          //   got,
                          //   bossName: b.name,
                          //   difficulty: b.difficulty,
                          //   weekKey,
                          //   allPitchedKeys: Object.keys(pitchedChecked),
                          //   pitchedCheckedState: pitchedChecked
                          // });
                          return (
                            <span
                              key={item.name}
                              className={`pitched-item-icon inline ${got ? 'obtained' : ''}`}
                              title={got ? `Click to remove: ${item.name}` : `Click to track: ${item.name}`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                
                                // For historical weeks, show historical logging modal
                                if (isHistoricalWeek) {
                                  console.log('Opening historical pitched item modal for:', item.name);
                                  setHistoricalPitchedData({
                                    character: '', // Will be selected in modal
                                    characterIdx: -1,
                                    bossName: b.name,
                                    itemName: item.name,
                                    itemImage: item.image,
                                    weekKey: weekKey
                                  });
                                  setShowHistoricalPitchedModal(true);
                                  return;
                                }

                                // For current week operations
                                const charKey = `${characterBossSelections[selectedCharIdx].name}-${selectedCharIdx}`;
                                const key = getPitchedKey(characterBossSelections[selectedCharIdx].name, selectedCharIdx, b.name, item.name, weekKey);
                                const got = !!pitchedChecked[key];
                                
                                // Check across all characters for this item
                                let itemOwnedByOtherChar = false;
                                let ownerCharName = '';
                                characterBossSelections.forEach((char, charIdx) => {
                                  if (charIdx !== selectedCharIdx) {
                                    const otherKey = getPitchedKey(char.name, charIdx, b.name, item.name, weekKey);
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

                                // Set user interaction flag to prevent sync conflicts
                                userInteractionRef.current = true;
                                console.log('🖱️ USER: Pitched item clicked:', { item: item.name, boss: b.name, character: characterBossSelections[selectedCharIdx].name, currentState: got });
                                
                                // If boss is not cleared, check it too (only for current week)
                                if (!isHistoricalWeek) {
                                  const bossCleared = !!checked[charKey]?.[b.name + '-' + b.difficulty];
                                  if (!bossCleared) {
                                    console.log('🖱️ USER: Auto-checking boss since it was not cleared');
                                    handleCheck(b, true, e);
                                  }
                                }
                                
                                // Set loading state
                                setLoadingPitchedItems(prev => ({ ...prev, [key]: true }));
                                
                                try {
                                  if (!userCode) {
                                    setError('Please log in to save pitched items to cloud.');
                                    return;
                                  }

                                  // Determine the new state (toggle current state)
                                  const newGotState = !got;
                                  console.log(`🖱️ USER: Toggling pitched item from ${got} to ${newGotState}`);
                                  
                                  // 1. Update local state optimistically
                                  setPitchedChecked(prev => {
                                    const newState = { ...prev };
                                    if (newGotState) {
                                      newState[key] = true;
                                    } else {
                                      delete newState[key];
                                    }
                                    console.log('🖱️ USER: Updated local pitched state:', newGotState ? 'added' : 'removed');
                                    return newState;
                                  });
                                  
                                  // 2. Save to cloud
                                  console.log('🖱️ USER: Saving to cloud...');
                                  const result = await savePitchedItem(userCode, {
                                    character: characterBossSelections[selectedCharIdx].name,
                                    characterIdx: selectedCharIdx,
                                    bossName: b.name,
                                    bossDifficulty: b.difficulty, // Include difficulty for proper cleanup
                                    itemName: item.name,
                                    itemImage: item.image,
                                    date: new Date().toISOString()
                                  }, got, weekKey); // got=true means remove, got=false means add, pass current weekKey
                                  
                                  if (!result.success) {
                                    console.error('🖱️ USER: Cloud save failed:', result.error);
                                    setError('Failed to save to cloud. Reverting changes.');
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
                                  } else {
                                    console.log('🖱️ USER: Cloud save successful');
                                    // Note: We removed refreshPitchedItems to prevent sync conflicts!
                                    // The periodic background sync will handle consistency
                                    
                                    // Refresh historical analysis to update navigation
                                    if (refreshHistoricalAnalysis) {
                                      refreshHistoricalAnalysis().catch(err => {
                                        console.error('Error refreshing historical analysis:', err);
                                      });
                                    }
                                  }
                                } catch (error) {
                                  console.error('❌ Error in pitched item click handler:', error);
                                  setError('Failed to update pitched item. Please try again.');
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
                                  // Clear loading state
                                  setLoadingPitchedItems(prev => {
                                    const newState = { ...prev };
                                    delete newState[key];
                                    return newState;
                                  });
                                  
                                  // Clear user interaction flag after a delay to allow UI to settle
                                  setTimeout(() => {
                                    userInteractionRef.current = false;
                                    console.log('🖱️ USER: Interaction flag cleared, sync can resume');
                                  }, 1000);
                                }
                                
                                startStatsTrackingIfNeeded();
                              }}
                            >
                              {loadingPitchedItems[key] ? (
                                <div className="pitched-item-loading inline">
                                  <div className="pitched-item-spinner inline" />
                                </div>
                              ) : (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className={`pitched-item-image inline ${got ? 'obtained' : 'not-obtained'}`}
                                />
                              )}
                              {got && !loadingPitchedItems[key] && (
                                <span className="pitched-item-checkmark inline">✓</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="boss-table-cell-difficulty">
                    <span>{b.difficulty}</span>
                  </td>
                  <td className="boss-table-cell-mesos">
                    <span>{Math.floor(getBossPrice(b.name, b.difficulty) / (b.partySize || 1)).toLocaleString()}</span>
                  </td>
                  <td className="boss-table-cell-cleared">
                    <span onClick={e => e.stopPropagation()}>
                      <CustomCheckbox
                        checked={isChecked}
                        onChange={e => handleCheck(b, e.target.checked, e)}
                      />
                    </span>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default BossTable; 