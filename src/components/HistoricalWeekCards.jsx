import React, { useMemo } from 'react';
import { getBossPitchedItems } from '../../services/bossRegistryService';
import { getPitchedKey } from '../utils/stringUtils';
import { logger } from '../utils/logger';
import { convertDateToWeekKey } from '../utils/weekUtils';
import { getBestBossConfigForItems } from '../utils/bossItemDifficulty';
import '../styles/historical-week-cards.css';

function HistoricalWeekCards({
  bosses = [],
  bossData = [],
  characterKey = '',
  selectedWeekKey = '',
  selectedCharIdx = 0,
  pitchedChecked = {},
  onPitchedItemClick = () => {},
  userCode = '',
  cloudPitchedItems = [] // NEW: passed from WeeklyTracker to access ALL pitched items
}) {
  // Helper to get boss info from bossData
  const getBossInfo = (bossName) => {
    return bossData.find(boss => boss.name === bossName) || {};
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

  // Check if pitched item is checked/obtained
  const isPitchedItemChecked = (characterName, bossName, itemName, weekKey) => {
    const key = getPitchedKey(characterName, selectedCharIdx, bossName, itemName, weekKey);
    return !!pitchedChecked[key];
  };

  // Create enhanced bosses list that includes bosses from historical pitched items
  const enhancedBosses = useMemo(() => {
    logger.info('HistoricalWeekCards: Processing enhanced bosses', {
      bossesCount: bosses.length,
      cloudPitchedItemsCount: cloudPitchedItems.length,
      selectedWeekKey: selectedWeekKey,
      characterName: characterName
    });

    const existingBossesMap = new Map();
    
    // Add current configured bosses
    bosses.forEach(boss => {
      const key = `${boss.name}-${boss.difficulty}`;
      existingBossesMap.set(key, boss);
    });

    logger.info('HistoricalWeekCards: Starting enhanced bosses logic', {
      characterName,
      weekKey: selectedWeekKey,
      configuredBosses: bosses.length,
      totalCloudPitchedItems: cloudPitchedItems.length
    });

    // Find historical pitched items for this character and week
    const historicalPitchedItems = cloudPitchedItems.filter(item => {
      if (item.charId !== characterName) return false;
      const itemWeekKey = convertDateToWeekKey(item.date);
      return itemWeekKey === selectedWeekKey;
    });

    logger.info('HistoricalWeekCards: Filtered historical pitched items', {
      characterName,
      weekKey: selectedWeekKey,
      filteredItems: historicalPitchedItems.length,
      items: historicalPitchedItems.map(item => `${item.bossName}:${item.item}`)
    });

    // Group pitched items by boss to intelligently determine configurations
    const bossPitchedItemsMap = new Map();
    historicalPitchedItems.forEach(item => {
      const bossName = item.bossName;
      if (!bossPitchedItemsMap.has(bossName)) {
        bossPitchedItemsMap.set(bossName, []);
      }
      bossPitchedItemsMap.get(bossName).push(item.item);
    });

    // Add boss configurations based on historical pitched items
    bossPitchedItemsMap.forEach((itemNames, bossName) => {
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
            logger.info('HistoricalWeekCards: Using existing compatible boss config', {
              bossName: existingBoss.name,
              difficulty: existingBoss.difficulty,
              items: itemNames
            });
            break;
          }
        }
      }
      
      // If no compatible existing config found, create a new one
      if (!compatibleExistingConfig) {
        const bestConfig = getBestBossConfigForItems(bossName, itemNames);
        const key = `${bestConfig.name}-${bestConfig.difficulty}`;
        
        if (!existingBossesMap.has(key)) {
          existingBossesMap.set(key, bestConfig);
          logger.info('HistoricalWeekCards: Added historical boss config', {
            bossName: bestConfig.name,
            difficulty: bestConfig.difficulty,
            items: itemNames
          });
        }
      } else {
        logger.info('HistoricalWeekCards: Using existing compatible boss config', {
          bossName: compatibleExistingConfig.name,
          difficulty: compatibleExistingConfig.difficulty,
          items: itemNames
        });
      }
    });

    const finalBosses = Array.from(existingBossesMap.values());
    logger.info('HistoricalWeekCards: Enhanced bosses result', {
      originalCount: bosses.length,
      finalCount: finalBosses.length,
      bosses: finalBosses.map(b => `${b.name}-${b.difficulty}`)
    });

    return finalBosses;
  }, [bosses, cloudPitchedItems, selectedWeekKey, characterName]);

  // Handle pitched item click
  const handlePitchedItemClick = async (e, boss, item) => {
    e.stopPropagation();
    
    const isCurrentlyChecked = isPitchedItemChecked(characterName, boss.name, item.name, selectedWeekKey);
    
    logger.info('HistoricalWeekCards: Pitched item clicked', {
      bossName: boss.name,
      itemName: item.name,
      character: characterName,
      weekKey: selectedWeekKey,
      isChecked: isCurrentlyChecked
    });

    // Call the pitched item handler for historical week
    await onPitchedItemClick({
      bossName: boss.name,
      itemName: item.name,
      characterName: characterName,
      weekKey: selectedWeekKey,
      isChecked: isCurrentlyChecked,
      isHistorical: true,
      itemImage: item.image
    });
  };

  // Filter bosses to only show those with droppable pitched items
  const bossesWithPitchedItems = enhancedBosses.filter(boss => {
    const bossItems = getBossItems(boss.name, boss.difficulty);
    return bossItems.length > 0;
  });

  logger.info('HistoricalWeekCards: Enhanced bosses filtering', {
    originalCount: bosses.length,
    enhancedCount: enhancedBosses.length,
    filteredCount: bossesWithPitchedItems.length,
    weekKey: selectedWeekKey,
    characterName: characterName
  });

  if (!enhancedBosses.length) {
    return (
      <div className="historical-cards-empty">
        <div className="historical-cards-empty-icon">📅</div>
        <h3>No Historical Data</h3>
        <p>No boss data found for this week.</p>
      </div>
    );
  }

  if (!bossesWithPitchedItems.length) {
    return (
      <div className="historical-cards-empty">
        <div className="historical-cards-empty-icon">🎁</div>
        <h3>No Droppable Items</h3>
        <p>None of the bosses for this character have droppable pitched items.</p>
      </div>
    );
  }

  return (
    <div className="historical-week-cards">
      <div className="historical-cards-header">
        <h3>Historical Week Overview</h3>
        <p>Click on pitched items to add/remove historical drops</p>
      </div>
      
      <div className="historical-cards-grid">
        {bossesWithPitchedItems.map((boss, index) => {
          const bossInfo = getBossInfo(boss.name);
          const bossKey = `${boss.name}-${boss.difficulty}`;
          const bossItems = getBossItems(boss.name, boss.difficulty);

          return (
            <div key={bossKey} className="historical-boss-card">
              {/* Boss Header */}
              <div className="historical-boss-header">
                {bossInfo.image && (
                  <img 
                    src={bossInfo.image} 
                    alt={boss.name}
                    className="historical-boss-image"
                  />
                )}
                <div className="historical-boss-details">
                  <h4 className="historical-boss-name">{boss.name}</h4>
                  <span className="historical-boss-difficulty">{boss.difficulty}</span>
                  {boss.partySize && boss.partySize > 1 && (
                    <span className="historical-boss-party">Party: {boss.partySize}</span>
                  )}
                </div>
              </div>

              {/* Pitched Items Section */}
              <div className="historical-pitched-section">
                <div className="historical-pitched-header">
                  <span>Dropped Items</span>
                  <span className="historical-pitched-count">
                    {bossItems.filter(item => 
                      isPitchedItemChecked(characterName, boss.name, item.name, selectedWeekKey)
                    ).length} / {bossItems.length}
                  </span>
                </div>
                <div className="historical-pitched-grid">
                  {bossItems.map((item, itemIndex) => {
                    const isItemChecked = isPitchedItemChecked(characterName, boss.name, item.name, selectedWeekKey);
                    
                    return (
                      <div
                        key={`${item.name}-${itemIndex}`}
                        className={`historical-pitched-item ${isItemChecked ? 'checked' : 'unchecked'}`}
                        onClick={(e) => handlePitchedItemClick(e, boss, item)}
                        title={`${item.name} ${isItemChecked ? '(Obtained - Click to remove)' : '(Click to add historical drop)'}`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="historical-pitched-image"
                        />
                        <span className="historical-pitched-name">{item.name}</span>
                        {isItemChecked && (
                          <div className="historical-pitched-checkmark">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HistoricalWeekCards; 