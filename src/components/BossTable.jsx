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
              </div>
            </div>

            <div className="historical-pitched-section">
              <div className="historical-pitched-label">Pitched Items</div>
              {(bossObj.pitchedItems || []).length > 0 ? (
                <div className="historical-pitched-grid">
                  {(bossObj.pitchedItems || []).map(item => {
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
                          if (hasPitchedItem) {
                            try {
                              const result = await savePitchedItem(userCode, {
                                character: characterWithItem,
                                characterIdx: characterBossSelections.findIndex(c => c.name === characterWithItem),
                                bossName: bossObj.name,
                                bossDifficulty: 'Unknown',
                                itemName: item.name,
                                itemImage: item.image,
                                date: new Date().toISOString()
                              }, true, weekKey);
                              
                              if (result.success) {
                                await refreshPitchedItems(userCode);
                                if (refreshHistoricalAnalysis) {
                                  await refreshHistoricalAnalysis();
                                }
                              } else {
                                setError('Failed to remove historical pitched item: ' + (result.error || 'Unknown error'));
                              }
                            } catch (error) {
                              setError('Error removing historical pitched item: ' + error.message);
                            }
                          } else {
                            setHistoricalPitchedData({
                              character: '',
                              characterIdx: -1,
                              bossName: bossObj.name,
                              itemName: item.name,
                              itemImage: item.image,
                              weekKey: weekKey
                            });
                            setShowHistoricalPitchedModal(true);
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
          {sortedBosses.map((b, idx) => {
            const bossObj = bossData.find(bd => bd.name === b.name);
            const isChecked = !!checked[charKey]?.[b.name + '-' + b.difficulty];
            const pitched = bossObj?.pitchedItems || [];
            return (
              <tr
                key={b.name + '-' + b.difficulty}
                className={`boss-table-row ${idx % 2 === 0 ? 'even' : 'odd'}`}
                onClick={(e) => {
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
                    <div className="boss-table-pitched-container inline">
                      {pitched.map(item => {
                        // Special case for Kalos and Kaling Grindstone - show on all difficulties
                        if ((b.name === 'Watcher Kalos' || b.name === 'Kaling') && item.name === 'Grindstone of Life') {
                          const key = getPitchedKey(characterBossSelections[selectedCharIdx].name, selectedCharIdx, b.name, item.name, weekKey);
                          const got = !!pitchedChecked[key];
                          return (
                            <span
                              key={item.name}
                              className={`pitched-item-icon inline ${got ? 'obtained' : ''}`}
                              title={got ? `Click to remove: ${item.name}` : `Click to track: ${item.name}`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (isHistoricalWeek) {
                                  setHistoricalPitchedData({
                                    character: '',
                                    characterIdx: -1,
                                    bossName: b.name,
                                    itemName: item.name,
                                    itemImage: item.image,
                                    weekKey: weekKey
                                  });
                                  setShowHistoricalPitchedModal(true);
                                  return;
                                }

                                const charKey = `${characterBossSelections[selectedCharIdx].name}-${selectedCharIdx}`;
                                const key = getPitchedKey(characterBossSelections[selectedCharIdx].name, selectedCharIdx, b.name, item.name, weekKey);
                                const got = !!pitchedChecked[key];
                                
                                userInteractionRef.current = true;
                                
                                if (!isHistoricalWeek) {
                                  const bossCleared = !!checked[charKey]?.[b.name + '-' + b.difficulty];
                                  if (!bossCleared) {
                                    handleCheck(b, true, e);
                                  }
                                }
                                
                                setLoadingPitchedItems(prev => ({ ...prev, [key]: true }));
                                
                                try {
                                  if (!userCode) {
                                    setError('Please log in to save pitched items to cloud.');
                                    return;
                                  }

                                  const newGotState = !got;
                                  
                                  setPitchedChecked(prev => {
                                    const newState = { ...prev };
                                    if (newGotState) {
                                      newState[key] = true;
                                    } else {
                                      delete newState[key];
                                    }
                                    return newState;
                                  });
                                  
                                  const result = await savePitchedItem(userCode, {
                                    character: characterBossSelections[selectedCharIdx].name,
                                    characterIdx: selectedCharIdx,
                                    bossName: b.name,
                                    bossDifficulty: b.difficulty,
                                    itemName: item.name,
                                    itemImage: item.image,
                                    date: new Date().toISOString()
                                  }, got, weekKey);
                                  
                                  if (!result.success) {
                                    setError('Failed to save to cloud. Reverting changes.');
                                    setPitchedChecked(prev => {
                                      const revertState = { ...prev };
                                      if (got) {
                                        revertState[key] = true;
                                      } else {
                                        delete revertState[key];
                                      }
                                      return revertState;
                                    });
                                  } else {
                                    if (refreshHistoricalAnalysis) {
                                      refreshHistoricalAnalysis().catch(err => {
                                        console.error('Error refreshing historical analysis:', err);
                                      });
                                    }
                                  }
                                } catch (error) {
                                  setError('Failed to update pitched item. Please try again.');
                                  setPitchedChecked(prev => {
                                    const revertState = { ...prev };
                                    if (got) {
                                      revertState[key] = true;
                                    } else {
                                      delete revertState[key];
                                    }
                                    return revertState;
                                  });
                                } finally {
                                  setLoadingPitchedItems(prev => {
                                    const newState = { ...prev };
                                    delete newState[key];
                                    return newState;
                                  });
                                  
                                  setTimeout(() => {
                                    userInteractionRef.current = false;
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
                        }

                        // For other items, check difficulty requirements
                        if (b.name === 'Lotus') {
                          if (item.name === 'Total Control' && b.difficulty !== 'Extreme') return null;
                          if ((item.name === 'Berserked' || item.name === 'Black Heart') && !['Hard', 'Extreme'].includes(b.difficulty)) return null;
                        }
                        // For Seren, Gravity Module only on Extreme
                        if (b.name === 'Chosen Seren' && item.name === 'Gravity Module' && b.difficulty !== 'Extreme') return null;
                        // For Kalos, Mark of Destruction only on Extreme
                        if (b.name === 'Watcher Kalos' && item.name === 'Mark of Destruction' && b.difficulty !== 'Extreme') return null;
                        // For Kaling, Helmet of Loyalty only on Extreme
                        if (b.name === 'Kaling' && item.name === 'Helmet of Loyalty' && b.difficulty !== 'Extreme') return null;
                        // For all other bosses, only show on Hard or higher
                        if (b.name !== 'Lotus' && b.name !== 'Watcher Kalos' && b.name !== 'Kaling' && 
                            !['Hard', 'Chaos', 'Extreme', 'Hell'].includes(b.difficulty)) return null;

                        const key = getPitchedKey(characterBossSelections[selectedCharIdx].name, selectedCharIdx, b.name, item.name, weekKey);
                        const got = !!pitchedChecked[key];
                        return (
                          <span
                            key={item.name}
                            className={`pitched-item-icon inline ${got ? 'obtained' : ''}`}
                            title={got ? `Click to remove: ${item.name}` : `Click to track: ${item.name}`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (isHistoricalWeek) {
                                setHistoricalPitchedData({
                                  character: '',
                                  characterIdx: -1,
                                  bossName: b.name,
                                  itemName: item.name,
                                  itemImage: item.image,
                                  weekKey: weekKey
                                });
                                setShowHistoricalPitchedModal(true);
                                return;
                              }

                              const charKey = `${characterBossSelections[selectedCharIdx].name}-${selectedCharIdx}`;
                              const key = getPitchedKey(characterBossSelections[selectedCharIdx].name, selectedCharIdx, b.name, item.name, weekKey);
                              const got = !!pitchedChecked[key];
                              
                              userInteractionRef.current = true;
                              
                              if (!isHistoricalWeek) {
                                const bossCleared = !!checked[charKey]?.[b.name + '-' + b.difficulty];
                                if (!bossCleared) {
                                  handleCheck(b, true, e);
                                }
                              }
                              
                              setLoadingPitchedItems(prev => ({ ...prev, [key]: true }));
                              
                              try {
                                if (!userCode) {
                                  setError('Please log in to save pitched items to cloud.');
                                  return;
                                }

                                const newGotState = !got;
                                
                                setPitchedChecked(prev => {
                                  const newState = { ...prev };
                                  if (newGotState) {
                                    newState[key] = true;
                                  } else {
                                    delete newState[key];
                                  }
                                  return newState;
                                });
                                
                                const result = await savePitchedItem(userCode, {
                                  character: characterBossSelections[selectedCharIdx].name,
                                  characterIdx: selectedCharIdx,
                                  bossName: b.name,
                                  bossDifficulty: b.difficulty,
                                  itemName: item.name,
                                  itemImage: item.image,
                                  date: new Date().toISOString()
                                }, got, weekKey);
                                
                                if (!result.success) {
                                  setError('Failed to save to cloud. Reverting changes.');
                                  setPitchedChecked(prev => {
                                    const revertState = { ...prev };
                                    if (got) {
                                      revertState[key] = true;
                                    } else {
                                      delete revertState[key];
                                    }
                                    return revertState;
                                  });
                                } else {
                                  if (refreshHistoricalAnalysis) {
                                    refreshHistoricalAnalysis().catch(err => {
                                      console.error('Error refreshing historical analysis:', err);
                                    });
                                  }
                                }
                              } catch (error) {
                                setError('Failed to update pitched item. Please try again.');
                                setPitchedChecked(prev => {
                                  const revertState = { ...prev };
                                  if (got) {
                                    revertState[key] = true;
                                  } else {
                                    delete revertState[key];
                                  }
                                  return revertState;
                                });
                              } finally {
                                setLoadingPitchedItems(prev => {
                                  const newState = { ...prev };
                                  delete newState[key];
                                  return newState;
                                });
                                
                                setTimeout(() => {
                                  userInteractionRef.current = false;
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