import React, { useState, useEffect, useMemo } from 'react';
import CustomCheckbox from './CustomCheckbox';
import { getBossPitchedItems } from '../../services/bossRegistryService';
import { convertDateToWeekKey } from '../utils/weekUtils';
import { getBestBossConfigForItems } from '../utils/bossItemDifficulty';
import { getPitchedKey } from '../utils/stringUtils';
import '../styles/tables.css';

function BossTable({
  bosses = [],
  bossData = [],
  checked = {},
  characterKey = '',
  onBossCheck = () => {},
  getBossPrice = () => 0,
  showTickAll = false,
  onTickAll = () => {},
  allTicked = false,
  // Pitched items props
  pitchedChecked = {},
  onPitchedItemClick = () => {},
  isHistoricalWeek = false,
  userCode = '',
  selectedWeekKey = '',
  selectedCharIdx = 0,
  // Optional: for animations and user interactions
  userInteractionRef = null,
  cloudPitchedItems = [] // NEW: for showing historical pitched items
}) {
  const [enhancedBosses, setEnhancedBosses] = useState([]);

  // Helper to get boss info from bossData
  const getBossInfo = (bossName) => {
    return bossData.find(boss => boss.name === bossName) || {};
  };

  // Format mesos amount
  const formatMesos = (amount) => {
    return new Intl.NumberFormat().format(amount);
  };

  // Get character name from characterKey
  const getCharacterName = () => {
    const parts = characterKey.split('-');
    return parts.slice(0, -1).join('-'); // Remove the last part (index)
  };

  // Memoize character name to prevent unnecessary re-renders
  const characterName = useMemo(() => {
    const parts = characterKey.split('-');
    return parts.slice(0, -1).join('-'); // Remove the last part (index)
  }, [characterKey]);

  // Get pitched items for a boss
  const getBossItems = (bossName, difficulty) => {
    const items = getBossPitchedItems(bossName) || [];
    
    // Filter items by difficulty if specified
    return items.filter(item => {
      if (item.difficulty) {
        return item.difficulty === difficulty;
      }
      if (item.difficulties) {
        return item.difficulties.includes(difficulty);
      }
      // No difficulty restriction - show for all difficulties
      return true;
    });
  };

  // Create enhanced bosses list that includes bosses with historical pitched items
  useEffect(() => {
    const processEnhancedBosses = async () => {
      const existingBossesMap = new Map();
      
      // Add current configured bosses
      bosses.forEach(boss => {
        const key = `${boss.name}-${boss.difficulty}`;
        existingBossesMap.set(key, boss);
      });

      // For current week, also add bosses that have pitched items in database
      if (!isHistoricalWeek && cloudPitchedItems.length > 0) {
        const currentWeekPitchedItems = cloudPitchedItems.filter(item => {
          if (item.charId !== characterName) return false;
          const itemWeekKey = convertDateToWeekKey(item.date);
          return itemWeekKey === selectedWeekKey;
        });

        // Group pitched items by boss to intelligently determine configurations
        const bossPitchedItemsMap = new Map();
        currentWeekPitchedItems.forEach(item => {
          const bossName = item.bossName;
          if (!bossPitchedItemsMap.has(bossName)) {
            bossPitchedItemsMap.set(bossName, []);
          }
          bossPitchedItemsMap.get(bossName).push(item.item);
        });

        // Add boss configurations based on current week pitched items
        for (const [bossName, itemNames] of bossPitchedItemsMap.entries()) {
          // First, check if any existing boss configuration can accommodate these items
          let compatibleExistingConfig = null;
          
          for (const [existingKey, existingBoss] of existingBossesMap.entries()) {
            if (existingBoss.name === bossName) {
              // Check if all items are compatible with this existing difficulty
              const isCompatible = itemNames.every(itemName => {
                const items = getBossItems(existingBoss.name, existingBoss.difficulty);
                return items.some(item => item.name === itemName);
              });
              
              if (isCompatible) {
                compatibleExistingConfig = existingBoss;
                break;
              }
            }
          }
          
          // If no compatible existing config found, create a new one
          if (!compatibleExistingConfig) {
            try {
              const bestConfig = await getBestBossConfigForItems(bossName, itemNames);
              // Set price to 0 initially - it will be calculated when rendering
              bestConfig.price = 0;
              const key = `${bestConfig.name}-${bestConfig.difficulty}`;
              
              if (!existingBossesMap.has(key)) {
                existingBossesMap.set(key, bestConfig);
              }
            } catch (error) {
              console.error('BossTable: Error creating boss config for current week items', {
                bossName,
                items: itemNames,
                error: error.message
              });
            }
          }
        }
      }

      setEnhancedBosses(Array.from(existingBossesMap.values()));
    };

    processEnhancedBosses().catch(error => {
      console.error('BossTable: Error processing enhanced bosses', error);
      // Fallback to just configured bosses
      setEnhancedBosses(bosses);
    });
  }, [bosses, cloudPitchedItems, selectedWeekKey, isHistoricalWeek, characterName]); // Removed getBossPrice to prevent infinite loop

  // Check if pitched item is checked/obtained
  const isPitchedItemChecked = (characterName, bossName, itemName, weekKey) => {
    const key = getPitchedKey(characterName, selectedCharIdx, bossName, itemName, weekKey);
    return !!pitchedChecked[key];
  };

  // Handle pitched item click
  const handlePitchedItemClick = async (e, boss, item, characterName) => {
    e.stopPropagation();
    
    if (userInteractionRef) {
      userInteractionRef.current = true;
    }

    const isCurrentlyChecked = isPitchedItemChecked(characterName, boss.name, item.name, selectedWeekKey);
    
    if (isHistoricalWeek) {
      // For historical weeks, only allow removal if checked
      if (isCurrentlyChecked) {
        await onPitchedItemClick({
          bossName: boss.name,
          itemName: item.name,
          characterName: characterName,
          weekKey: selectedWeekKey,
          isChecked: isCurrentlyChecked,
          isHistorical: true
        });
      }
      return;
    }
    
    // Call the pitched item handler for current week
    await onPitchedItemClick({
      bossName: boss.name,
      itemName: item.name,
      characterName: characterName,
      weekKey: selectedWeekKey,
      isChecked: isCurrentlyChecked,
      isHistorical: false
    });
  };

  // Handle boss row click
  const handleBossRowClick = (boss, isChecked, e) => {
    // Call the boss check handler with the event for animation and persistence
    onBossCheck(boss, !isChecked, e);
  };

  // Use enhanced bosses for display
  const displayBosses = enhancedBosses;

  if (!displayBosses.length) {
    return (
      <div className="boss-table-empty">
        <p>No bosses found for this character.</p>
      </div>
    );
  }

  return (
    <div className="boss-table-container">
      <div className="boss-table-grid">
        {/* Header */}
        <div className="boss-table-header">
          <div className="header-boss">Boss</div>
          <div className="header-difficulty">Difficulty</div>
          <div className="header-mesos">Mesos</div>
          <div className="header-cleared">
            {showTickAll && (
              <button
                onClick={onTickAll}
                className="header-tick-all-button"
                title={allTicked ? "Clear all boss completions" : "Mark all bosses as completed"}
              >
                {allTicked ? 'Clear All' : 'Complete All'}
              </button>
            )}
          </div>
        </div>

        {/* Rows */}
        {displayBosses.map((boss, index) => {
          const bossInfo = getBossInfo(boss.name);
          const bossKey = `${boss.name}-${boss.difficulty}`;
          const isChecked = !!checked[characterKey]?.[bossKey];
          const mesosAmount = getBossPrice(boss.name, boss.difficulty) / (boss.partySize || 1);
          const bossItems = getBossItems(boss.name, boss.difficulty);
          // Use memoized characterName instead of function call
          const currentCharacterName = characterName;

          return (
            <div 
              key={bossKey} 
              className={`boss-table-row ${index % 2 === 0 ? 'even' : 'odd'}`}
              onClick={(e) => handleBossRowClick(boss, isChecked, e)}
            >
              <div className="cell-boss">
                <div className="boss-info-section">
                  {bossInfo.image && (
                    <img 
                      src={bossInfo.image} 
                      alt={boss.name}
                      className="boss-image"
                    />
                  )}
                  <div className="boss-details">
                    <span className="boss-name">{boss.name}</span>
                    {boss.partySize && boss.partySize > 1 && (
                      <span className="boss-party-size">Party: {boss.partySize}</span>
                    )}
                  </div>
                </div>
                
                {/* Pitched Items Icons */}
                {bossItems.length > 0 && (
                  <div className="boss-pitched-items" onClick={(e) => e.stopPropagation()}>
                    {bossItems.map((item, itemIndex) => {
                      const isItemChecked = isPitchedItemChecked(currentCharacterName, boss.name, item.name, selectedWeekKey);
                      
                      return (
                        <div
                          key={`${item.name}-${itemIndex}`}
                          className={`pitched-item-icon ${isItemChecked ? 'checked' : 'unchecked'} ${isHistoricalWeek ? 'historical' : ''}`}
                          onClick={(e) => handlePitchedItemClick(e, boss, item, currentCharacterName)}
                          title={`${item.name} ${isItemChecked ? '(Obtained)' : '(Click to mark as obtained)'}`}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="pitched-item-image"
                          />
                          {isItemChecked && (
                            <div className="pitched-item-checkmark">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M20 6L9 17L4 12"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="cell-difficulty">
                {boss.difficulty}
              </div>
              
              <div className="cell-mesos">
                {formatMesos(mesosAmount)}
              </div>
              
              <div className="cell-cleared" onClick={(e) => e.stopPropagation()}>
                <CustomCheckbox
                  checked={isChecked}
                  onChange={(e) => onBossCheck(boss, e.target.checked, e)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BossTable;
