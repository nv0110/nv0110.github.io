import React, { useMemo, useState } from 'react';
import CustomCheckbox from './CustomCheckbox';
import { getBossPitchedItems } from '../services/bossRegistryService';
import { getPitchedKey } from '../utils/stringUtils';
import '../styles/tables.css';
import { logger } from '../utils/logger';

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
  cloudPitchedItems = [],
  characterBossSelections = []
}) {
  // Loading state for individual pitched items
  const [loadingPitchedItems, setLoadingPitchedItems] = useState(new Set());

  // Prevent rendering if essential data is not loaded
  if (!bosses.length || !bossData.length) {
    return (
      <div className="boss-table-container">
        <div className="boss-table-loading">
          <div style={{ textAlign: 'center', padding: '2rem', color: '#e6e0ff' }}>
            Loading boss data...
          </div>
        </div>
      </div>
    );
  }

  // Helper to get boss info from bossData
  const getBossInfo = (bossName) => {
    return bossData.find(boss => boss.name === bossName) || {};
  };

  // Format mesos amount
  const formatMesos = (amount) => {
    return new Intl.NumberFormat().format(amount);
  };

  // Extract character name from characterKey  
  const characterName = useMemo(() => {
    const parts = characterKey.split('-');
    return parts.slice(0, -1).join('-'); // Remove the last part (index)
  }, [characterKey]);

  // Get pitched items for a boss/difficulty combination
  const getBossItems = (bossName, difficulty) => {
    // Use the updated getBossPitchedItems with difficulty filtering
    return getBossPitchedItems(bossName, difficulty);
  };

  // Check if pitched item is checked/obtained
  const isPitchedItemChecked = (bossName, itemName, weekKey) => {
    if (!characterName) return false;
    const key = getPitchedKey(characterName, bossName, itemName, weekKey);
    return !!pitchedChecked[key];
  };

  // Check if pitched item is loading
  const isPitchedItemLoading = (characterName, bossName, itemName, weekKey) => {
    // Use the actual character being displayed, not the selected character
    const actualCharacterName = characterBossSelections[selectedCharIdx]?.name || characterName;
    const key = getPitchedKey(actualCharacterName, bossName, itemName, weekKey);
    return loadingPitchedItems.has(key);
  };

  // Handle pitched item click with loading animation
  const handlePitchedItemClick = async (e, boss, item, characterName) => {
    e.stopPropagation();
    
    if (userInteractionRef) {
      userInteractionRef.current = true;
    }

    // Use the actual character being displayed, not the selected character
    const actualCharacterName = characterBossSelections[selectedCharIdx]?.name || characterName;
    const key = getPitchedKey(actualCharacterName, boss.name, item.name, selectedWeekKey);
    const isCurrentlyChecked = isPitchedItemChecked(boss.name, item.name, selectedWeekKey);
    
    // Don't allow clicks while loading
    if (loadingPitchedItems.has(key)) {
      return;
    }
    
    if (isHistoricalWeek) {
      // For historical weeks, only allow removal if checked
      if (isCurrentlyChecked) {
        // Set loading state
        setLoadingPitchedItems(prev => new Set([...prev, key]));
        
        try {
          await onPitchedItemClick({
            bossName: boss.name,
            itemName: item.name,
            characterName: actualCharacterName,
            weekKey: selectedWeekKey,
            isChecked: isCurrentlyChecked,
            isHistorical: true
          });
        } finally {
          // Clear loading state
          setLoadingPitchedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }
      }
      return;
    }
    
    // For current week: Show loading animation
    setLoadingPitchedItems(prev => new Set([...prev, key]));
    
    try {
      // Call the pitched item handler for current week
      await onPitchedItemClick({
        bossName: boss.name,
        itemName: item.name,
        characterName: actualCharacterName,
        weekKey: selectedWeekKey,
        isChecked: isCurrentlyChecked,
        isHistorical: false,
        itemImage: item.image
      });
    } finally {
      // Clear loading state
      setLoadingPitchedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // Handle boss row click (for check/uncheck)
  const handleBossRowClick = (boss, isChecked, event) => {
    if (event.target.closest('.boss-pitched-items')) {
      return; // Don't toggle boss if clicking on pitched items
    }
    onBossCheck(boss, !isChecked, event);
  };

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
            {!showTickAll && 'Cleared'}
          </div>
        </div>

        {/* Rows */}
        {bosses.map((boss, index) => {
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
                      const isItemChecked = isPitchedItemChecked(boss.name, item.name, selectedWeekKey);
                      const isItemLoading = isPitchedItemLoading(currentCharacterName, boss.name, item.name, selectedWeekKey);
                      
                      return (
                        <div
                          key={`${item.name}-${itemIndex}`}
                          className={`pitched-item-icon ${isItemChecked ? 'checked' : 'unchecked'} ${isHistoricalWeek ? 'historical' : ''} ${isItemLoading ? 'loading' : ''}`}
                          onClick={(e) => !isItemLoading && handlePitchedItemClick(e, boss, item, currentCharacterName)}
                          title={isItemLoading ? 'Processing...' : `${item.name} ${isItemChecked ? '(Obtained)' : '(Click to mark as obtained)'}`}
                          style={{ 
                            cursor: isItemLoading ? 'not-allowed' : 'pointer',
                            opacity: isItemLoading ? 0.7 : 1 
                          }}
                        >
                          {isItemLoading ? (
                            <div className="pitched-item-loading">
                              <div className="loading-spinner-small"></div>
                            </div>
                          ) : (
                            <>
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
                            </>
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
                {formatMesos(Math.ceil(mesosAmount))}
              </div>

              <div className="cell-cleared">
                <CustomCheckbox
                  checked={isChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    onBossCheck(boss, e.target.checked, e);
                  }}
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
