import React from 'react';
import CustomCheckbox from './CustomCheckbox';
import { getBossPitchedItems } from '../../services/bossRegistryService.js';
import { getPitchedKey } from '../utils/stringUtils.js';
import { logger } from '../utils/logger.js';

function BossTable({
  isHistoricalWeek,
  characterBossSelections,
  selectedCharIdx,
  sortedBosses,
  bossData,
  checked,
  charKey,
  getBossPrice,
  handleCheck,
  context = 'weekly', // Added context prop to distinguish usage
  
  // Pitched items props
  pitchedChecked,
  setPitchedChecked,
  weekKey,
  refreshCheckedStateFromDatabase,
  userInteractionRef,
  userCode,
  setError,
  startStatsTrackingIfNeeded,
  setHistoricalPitchedData,
  setShowHistoricalPitchedModal,
  handleHistoricalPitchedRemove,
  loadingPitchedItems,
  setLoadingPitchedItems,
  refreshPitchedItems,
  refreshHistoricalAnalysis,
  addNewPitchedItem,
  removePitchedItemByDetails
}) {
  // Historical week card layout - Now with working pitched items functionality
  if (isHistoricalWeek) {
    // Get all unique bosses across all characters
    const allBosses = new Map();
    characterBossSelections.forEach(char => {
      char.bosses?.forEach(boss => {
        const bossObj = bossData.find(bd => bd.name === boss.name);
        const pitchedItems = getBossPitchedItems(boss.name);
        if (bossObj && pitchedItems && pitchedItems.length > 0) {
          const bossWithPitched = { ...bossObj, pitchedItems };
          allBosses.set(boss.name, bossWithPitched);
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
                    // Check if this item was obtained in the historical week
                    const character = characterBossSelections[selectedCharIdx];
                    const characterName = character?.name || '';
                    const pitchedKey = getPitchedKey(characterName, 0, bossObj.name, item.name, weekKey);
                    const hasPitchedItem = !!pitchedChecked[pitchedKey];

                    return (
                      <div
                        key={item.name}
                        className={`historical-pitched-item ${hasPitchedItem ? 'obtained' : ''}`}
                        title={`${item.name}${hasPitchedItem ? ' (obtained)' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setHistoricalPitchedData && setShowHistoricalPitchedModal) {
                            // Check if item is already logged
                            if (hasPitchedItem) {
                              // Item is already logged - remove it immediately
                              handleHistoricalPitchedRemove(characterName, bossObj.name, item.name, weekKey);
                            } else {
                              // Item is not logged - show modal to add it
                              const data = {
                                itemName: item.name,
                                itemImage: item.image,
                                bossName: bossObj.name,
                                character: characterName,
                                weekKey: weekKey
                              };
                              setHistoricalPitchedData(data);
                              setShowHistoricalPitchedModal(true);
                            }
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

  // Apply context-specific classes to isolate styling
  const contextClasses = {
    wrapper: context === 'weekly' ? 'boss-table-wrapper-weekly' : 'boss-table-wrapper-price',
    headerContainer: context === 'weekly' ? 'boss-table-header-container-weekly' : 'boss-table-header-container-price',
    bodyContainer: context === 'weekly' ? 'boss-table-body-container-weekly' : 'boss-table-body-container-price',
    table: context === 'weekly' ? 'boss-table-weekly' : 'boss-table-price'
  };

  return (
    <div className={contextClasses.wrapper}>
      {/* Fixed Header Table */}
      <div className={contextClasses.headerContainer}>
        <table className={`${contextClasses.table} boss-table-header ${isHistoricalWeek ? 'historical-week' : ''}`}>
          <thead>
            <tr className="boss-table-header-row">
              <th className="boss-table-header-cell">Boss</th>
              <th className="boss-table-header-cell-difficulty">Difficulty</th>
              <th className="boss-table-header-cell-mesos">Mesos</th>
              <th className="boss-table-header-cell-cleared">Cleared</th>
            </tr>
          </thead>
        </table>
      </div>
      
      {/* Scrollable Body Table */}
      <div className={contextClasses.bodyContainer}>
        <table className={`${contextClasses.table} boss-table-body ${isHistoricalWeek ? 'historical-week' : ''}`}>
          <tbody>
          {sortedBosses.map((b, idx) => {
            const bossObj = bossData.find(bd => bd.name === b.name);
            const isChecked = !!checked[charKey]?.[b.name + '-' + b.difficulty];
            const pitched = getBossPitchedItems(b.name);
            const character = characterBossSelections[selectedCharIdx];
            const characterName = character?.name || '';
            
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
                          const pitchedKey = getPitchedKey(characterName, 0, b.name, item.name, weekKey);
                          const got = !!pitchedChecked[pitchedKey];
                          const isLoading = loadingPitchedItems[pitchedKey];
                          
                          return (
                            <span
                              key={item.name}
                              className={`pitched-item-icon inline ${got ? 'obtained' : ''} ${isLoading ? 'loading' : ''}`}
                              title={`${item.name}${got ? ' (obtained)' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePitchedItemClick(b, item, characterName, got, pitchedKey);
                              }}
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className={`pitched-item-image inline ${got ? 'obtained' : 'not-obtained'}`}
                              />
                              {got && (
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
                        // For Limbo, Whisper of the Source only on Hard
                        if (b.name === 'Limbo' && item.name === 'Whisper of the Source' && b.difficulty !== 'Hard') return null;
                        // For Seren, Gravity Module only on Extreme
                        if (b.name === 'Chosen Seren' && item.name === 'Gravity Module' && b.difficulty !== 'Extreme') return null;
                        // For Kalos, Mark of Destruction only on Extreme
                        if (b.name === 'Watcher Kalos' && item.name === 'Mark of Destruction' && b.difficulty !== 'Extreme') return null;
                        // For Kaling, Helmet of Loyalty only on Extreme
                        if (b.name === 'Kaling' && item.name === 'Helmet of Loyalty' && b.difficulty !== 'Extreme') return null;
                        // For all other bosses, only show on Hard or higher
                        if (b.name !== 'Lotus' && b.name !== 'Watcher Kalos' && b.name !== 'Kaling' && b.name !== 'Limbo' &&
                            !['Hard', 'Chaos', 'Extreme', 'Hell'].includes(b.difficulty)) return null;

                        const pitchedKey = getPitchedKey(characterName, 0, b.name, item.name, weekKey);
                        const got = !!pitchedChecked[pitchedKey];
                        const isLoading = loadingPitchedItems[pitchedKey];
                        
                        return (
                          <span
                            key={item.name}
                            className={`pitched-item-icon inline ${got ? 'obtained' : ''} ${isLoading ? 'loading' : ''}`}
                            title={`${item.name}${got ? ' (obtained)' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePitchedItemClick(b, item, characterName, got, pitchedKey);
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className={`pitched-item-image inline ${got ? 'obtained' : 'not-obtained'}`}
                            />
                            {got && (
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
    </div>
  );

  /**
   * Handle pitched item click - toggle or show historical modal
   */
  async function handlePitchedItemClick(boss, item, characterName, currentlyGot, pitchedKey) {
    try {
      if (!characterName) {
        setError?.('No character selected');
        return;
      }

      userInteractionRef.current = true;

      if (isHistoricalWeek) {
        // For historical weeks, show modal to log pitched item
        if (setHistoricalPitchedData && setShowHistoricalPitchedModal) {
          const data = {
            itemName: item.name,
            itemImage: item.image,
            bossName: boss.name,
            character: characterName,
            weekKey: weekKey
          };
          setHistoricalPitchedData(data);
          setShowHistoricalPitchedModal(true);
        }
      } else {
        // For current week, toggle pitched item using hook methods
        setLoadingPitchedItems?.(prev => ({ ...prev, [pitchedKey]: true }));

        try {
          let result;
          
          if (currentlyGot) {
            // Remove pitched item using the hook method - now includes boss name
            logger.info(`Removing pitched item: ${item.name} from ${boss.name} by ${characterName}`);
            result = await removePitchedItemByDetails(characterName, boss.name, item.name);
          } else {
            // Add pitched item using the hook method - now includes boss name
            logger.info(`Adding pitched item: ${item.name} from ${boss.name} by ${characterName}`);
            result = await addNewPitchedItem(characterName, boss.name, item.name);
          }
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to update pitched item');
          }

        } catch (serviceError) {
          logger.error('Error with pitched item service:', serviceError);
          setError?.(`Failed to update pitched item: ${serviceError.message}`);
        }

        // Track stats if needed
        if (startStatsTrackingIfNeeded) {
          const statsKey = `${boss.name}-${item.name}`;
          startStatsTrackingIfNeeded(characterName, userCode, statsKey, item.name);
        }

        // Only refresh checked state from database, not historical analysis
        if (refreshCheckedStateFromDatabase) {
          await refreshCheckedStateFromDatabase();
        }

        setLoadingPitchedItems?.(prev => ({ ...prev, [pitchedKey]: false }));
      }
    } catch (error) {
      logger.error('Error handling pitched item click:', error);
      setError?.(`Failed to update pitched item: ${error.message}`);
      setLoadingPitchedItems?.(prev => ({ ...prev, [pitchedKey]: false }));
    }
  }
}

export default BossTable;
