import React, { useMemo, useState, useEffect } from 'react';
import { getBossPitchedItems, getBossDifficulties } from '../services/bossRegistryService';
import { convertDateToWeekKey } from '../utils/weekUtils';
import { getPitchedKey } from '../utils/stringUtils';
import { logger } from '../utils/logger';
import '../styles/historical-week-cards.css';

function HistoricalWeekCards({
  bossData = [],
  characterKey = '',
  selectedWeekKey = '',
  selectedCharIdx = 0,
  pitchedChecked = {},
  onPitchedItemClick = () => {},
  userCode = '',
  cloudPitchedItems = [],
  characterBossSelections = []
}) {
  const [allBossesWithPitchedItems, setAllBossesWithPitchedItems] = useState([]);

  // Extract character name from characterKey
  const characterName = useMemo(() => {
    const parts = characterKey.split('-');
    return parts.slice(0, -1).join('-'); // Remove the last part (index)
  }, [characterKey]);

  // Helper to get boss info from bossData
  const getBossInfo = (bossName) => {
    return bossData.find(boss => boss.name === bossName) || {};
  };

  // Get all bosses that have pitched items (one entry per boss, not per difficulty)
  useEffect(() => {
    const loadAllBossesWithPitchedItems = async () => {
      logger.info('HistoricalWeekCards: Loading all bosses with pitched items from registry');
      
      const bossesWithItems = [];
      
      // Boss registry data with actual difficulty/drop mappings
      const bossRegistry = [
        // Lotus
        { boss_name: "Lotus", difficulty: "Hard", drops_pitched: ["Black Heart", "Berserked"] },
        { boss_name: "Lotus", difficulty: "Extreme", drops_pitched: ["Total Control", "Black Heart", "Berserked"] },
        // Damien
        { boss_name: "Damien", difficulty: "Hard", drops_pitched: ["Magic Eyepatch"] },
        // Lucid
        { boss_name: "Lucid", difficulty: "Hard", drops_pitched: ["Dreamy Belt"] },
        // Will
        { boss_name: "Will", difficulty: "Hard", drops_pitched: ["Cursed Spellbook"] },
        // Gloom
        { boss_name: "Gloom", difficulty: "Chaos", drops_pitched: ["Endless Terror"] },
        // Darknell
        { boss_name: "Darknell", difficulty: "Hard", drops_pitched: ["Commanding Force Earring"] },
        // Verus Hilla
        { boss_name: "Verus Hilla", difficulty: "Hard", drops_pitched: ["Source of Suffering"] },
        // Chosen Seren
        { boss_name: "Chosen Seren", difficulty: "Hard", drops_pitched: ["Mitra's Rage"] },
        { boss_name: "Chosen Seren", difficulty: "Extreme", drops_pitched: ["Mitra's Rage", "Gravity Module"] },
        // Watcher Kalos
        { boss_name: "Watcher Kalos", difficulty: "Easy", drops_pitched: ["Grindstone of Life"] },
        { boss_name: "Watcher Kalos", difficulty: "Normal", drops_pitched: ["Grindstone of Life"] },
        { boss_name: "Watcher Kalos", difficulty: "Chaos", drops_pitched: ["Grindstone of Life"] },
        { boss_name: "Watcher Kalos", difficulty: "Extreme", drops_pitched: ["Grindstone of Life", "Mark of Destruction"] },
        // Kaling
        { boss_name: "Kaling", difficulty: "Easy", drops_pitched: ["Grindstone of Life"] },
        { boss_name: "Kaling", difficulty: "Normal", drops_pitched: ["Grindstone of Life"] },
        { boss_name: "Kaling", difficulty: "Hard", drops_pitched: ["Grindstone of Life"] },
        { boss_name: "Kaling", difficulty: "Extreme", drops_pitched: ["Grindstone of Life", "Helmet of Loyalty"] },
        // Limbo
        { boss_name: "Limbo", difficulty: "Hard", drops_pitched: ["Whisper of the Source"] }
      ];

      // Group by boss name
      const bossGroups = {};
      
      for (const entry of bossRegistry) {
        if (entry.drops_pitched.length > 0) {
          if (!bossGroups[entry.boss_name]) {
            bossGroups[entry.boss_name] = {
              name: entry.boss_name,
              difficulties: [],
              itemMap: {}
            };
          }
          
          bossGroups[entry.boss_name].difficulties.push(entry.difficulty);
          
          // Track which difficulties each item drops from
          for (const item of entry.drops_pitched) {
            if (!bossGroups[entry.boss_name].itemMap[item]) {
              bossGroups[entry.boss_name].itemMap[item] = [];
            }
            bossGroups[entry.boss_name].itemMap[item].push(entry.difficulty);
          }
        }
      }

      // Convert to the format expected by the component
      for (const [bossName, bossData] of Object.entries(bossGroups)) {
        const uniqueDifficulties = [...new Set(bossData.difficulties)].sort();
        
        // Create items with their dropping difficulties
        const items = [];
        for (const [itemName, difficulties] of Object.entries(bossData.itemMap)) {
          // Get item image from the boss registry service (for images only)
          const allBossItems = getBossPitchedItems(bossName) || [];
          const itemInfo = allBossItems.find(item => item.name === itemName) || {};
          
          items.push({
            name: itemName,
            image: itemInfo.image || '/images/items/default.png', // fallback image
            droppingDifficulties: difficulties.sort()
          });
        }

        if (items.length > 0) {
          bossesWithItems.push({
            name: bossName,
            items: items,
            difficultiesThatDropItems: uniqueDifficulties
          });
          
          logger.info('HistoricalWeekCards: Added boss with registry items', {
            bossName,
            itemCount: items.length,
            difficultiesThatDropItems: uniqueDifficulties,
            items: items.map(item => `${item.name} (${item.droppingDifficulties.join(', ')})`)
          });
        }
      }
      
      setAllBossesWithPitchedItems(bossesWithItems);
      logger.info('HistoricalWeekCards: Total bosses with pitched items loaded from registry:', bossesWithItems.length);
    };
    
    loadAllBossesWithPitchedItems();
  }, []); // Run once on mount, independent of user config

  // Check if pitched item is checked/obtained
  const isPitchedItemChecked = (bossName, itemName, weekKey) => {
    if (!characterName) return false;
    const key = getPitchedKey(characterName, bossName, itemName, weekKey);
    return !!pitchedChecked[key];
  };

  // Handle pitched item click
  const handlePitchedItemClick = async (e, boss, item) => {
    e.stopPropagation();
    
    // Use the actual character being displayed, not the selected character
    const actualCharacterName = characterBossSelections[selectedCharIdx]?.name || characterName;
    const isCurrentlyChecked = isPitchedItemChecked(boss.name, item.name, selectedWeekKey);
    
    logger.debug('HistoricalWeekCards: Pitched item clicked', {
      bossName: boss.name,
      itemName: item.name,
      character: actualCharacterName,
      weekKey: selectedWeekKey,
      isChecked: isCurrentlyChecked
    });

    // Call the pitched item handler for historical week
    await onPitchedItemClick({
      bossName: boss.name,
      itemName: item.name,
      characterName: actualCharacterName,
      weekKey: selectedWeekKey,
      isChecked: isCurrentlyChecked,
      isHistorical: true,
      itemImage: item.image
    });
  };

  // Debug logging moved to useEffect to prevent infinite loop
  useEffect(() => {
    logger.info('HistoricalWeekCards: Rendering with data', {
      bossesWithItemsCount: allBossesWithPitchedItems.length,
      weekKey: selectedWeekKey,
      characterName: characterName
    });
  }, [allBossesWithPitchedItems.length, selectedWeekKey, characterName]);

  if (!allBossesWithPitchedItems.length) {
    return (
      <div className="historical-cards-empty">
        <div className="historical-cards-empty-icon">🎁</div>
        <h3>No Droppable Items</h3>
        <p>No bosses with droppable pitched items found.</p>
      </div>
    );
  }

  return (
    <div className="historical-week-cards">
      <div className="historical-cards-header">
        <h3>Historical Week Overview</h3>
        <p>All bosses with droppable items - click on pitched items to add/remove historical drops</p>
      </div>
      
      <div className="historical-cards-grid">
        {allBossesWithPitchedItems.map((boss, index) => {
          const bossInfo = getBossInfo(boss.name);
          const bossKey = boss.name;

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
                  <span className="historical-boss-difficulties">
                    Available in: {boss.difficultiesThatDropItems.join(', ')}
                  </span>
                </div>
              </div>

              {/* Pitched Items Section */}
              <div className="historical-pitched-section">
                <div className="historical-pitched-header">
                  <span>Dropped Items</span>
                  <span className="historical-pitched-count">
                    {boss.items.filter(item => {
                      return isPitchedItemChecked(boss.name, item.name, selectedWeekKey);
                    }).length} / {boss.items.length}
                  </span>
                </div>
                <div className="historical-pitched-grid">
                  {boss.items.map((item, itemIndex) => {
                    const isItemChecked = isPitchedItemChecked(boss.name, item.name, selectedWeekKey);
                    
                    return (
                      <div
                        key={`${item.name}-${itemIndex}`}
                        className={`historical-pitched-item ${isItemChecked ? 'checked' : 'unchecked'}`}
                        onClick={(e) => handlePitchedItemClick(e, boss, item)}
                        title={`${item.name} - Drops from: ${item.droppingDifficulties.join(', ')} ${isItemChecked ? '(Obtained)' : '(Click to mark as obtained)'}`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="historical-pitched-image"
                        />
                        <div className="historical-pitched-info">
                          <span className="historical-pitched-name">{item.name}</span>
                          <span className="historical-pitched-difficulties">
                            {item.droppingDifficulties.join(', ')}
                          </span>
                        </div>
                        {isItemChecked && (
                          <div className="historical-pitched-checkmark">✓</div>
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