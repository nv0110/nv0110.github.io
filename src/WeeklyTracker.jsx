import React, { useState, useEffect, useRef, useMemo } from 'react';
import { STORAGE_KEYS } from './constants';
import WeekNavigator from './components/WeekNavigator';
import CharacterSidebar from './components/CharacterSidebar';
import SidebarToggle from './components/SidebarToggle';
import BossTable from './components/BossTable';
import HistoricalWeekCards from './components/HistoricalWeekCards';
import { logger } from './utils/logger';
import { getPitchedKey } from './utils/stringUtils';
import { convertDateToWeekKey, convertWeekKeyToDate } from './utils/weekUtils';
import './styles/weekly-tracker.css';

// Consolidated modals
import { WeeklyTrackerModals } from './features/weekly-tracker/WeeklyTrackerModals';

// Business logic hooks
import { useWeekNavigation } from './hooks/useWeekNavigation';
import { usePitchedItems } from './hooks/usePitchedItems';
import { useBossActions } from './hooks/useBossActions';
import { useStatsManagement } from './hooks/useStatsManagement';
import { useAppData } from './hooks/AppDataContext.jsx';
import { useUserWeeklyData } from '../hooks/useUserWeeklyData.js';

function WeeklyTracker({ characterBossSelections, bossData, checked, setChecked, userCode, appWeekKey, showOnboardingIndicators }) {
  const { lastWeeklyResetTimestamp } = useAppData();
  const { refreshWeeklyData } = useUserWeeklyData(userCode);

  // Helper function to get boss price
  function getBossPrice(bossName, difficulty) {
    const boss = bossData.find(b => b.name === bossName);
    if (!boss) return 0;
    const d = boss.difficulties.find(d => d.difficulty === difficulty);
    return d ? d.price : 0;
  }

  // Basic UI state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const [error, setError] = useState(null);
  const [showNoCharactersMessage, setShowNoCharactersMessage] = useState(false);

  // Track when boss unchecking is in progress to prevent auto-check interference
  const bossUncheckingInProgressRef = useRef(false);

  // Hide completed characters toggle
  const [hideCompleted, setHideCompleted] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_HIDE_COMPLETED);
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_HIDE_COMPLETED, JSON.stringify(hideCompleted));
  }, [hideCompleted]);

  // Handle fade-in animation for "No characters found" message
  useEffect(() => {
    if (!characterBossSelections.length) {
      setShowNoCharactersMessage(false);
      const timer = setTimeout(() => {
        setShowNoCharactersMessage(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowNoCharactersMessage(false);
    }
  }, [characterBossSelections.length]);

  // Custom hooks for complex logic
  const weekNavigation = useWeekNavigation(userCode, appWeekKey, characterBossSelections[selectedCharIdx]?.name);
  const {
    pitchedChecked,
    setPitchedChecked,
    cloudPitchedItems,
    refreshPitchedItems,
    userInteractionRef,
    addNewPitchedItem,
    removePitchedItemByDetails
  } = usePitchedItems(userCode || null, weekNavigation.selectedWeekKey);
  
  const bossActions = useBossActions({
    userId: userCode,
    characterBossSelections,
    selectedCharIdx,
    checked,
    setChecked,
    setError,
    onDataChange: () => {
      refreshWeeklyData();
      refreshPitchedItems();
    },
    isHistoricalWeek: weekNavigation.isHistoricalWeek,
    onBossUncheckStart: () => {
      bossUncheckingInProgressRef.current = true;
    },
    onBossUncheckEnd: () => {
      // Small delay to ensure auto-check doesn't interfere
      setTimeout(() => {
        bossUncheckingInProgressRef.current = false;
      }, 500);
    }
  });

  const statsManagement = useStatsManagement(userCode, refreshPitchedItems);

  // Effect to refresh data on mount and user changes
  useEffect(() => {
    // Enhanced guard: Only run if user is properly logged in
    if (userCode) {
      // Additional check to ensure we're not in a logout transition
      const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
      if (!currentStoredCode || currentStoredCode !== userCode) {
        logger.debug('WeeklyTracker: Skipping data refresh - logout in progress');
        return;
      }
      
      logger.debug('WeeklyTracker: Refreshing data on mount/user change');
      refreshPitchedItems();
      refreshWeeklyData();
    }
  }, [userCode, refreshPitchedItems, refreshWeeklyData]);

  // Effect to refresh pitched items when a weekly reset occurs
  useEffect(() => {
    // Enhanced guard: Only run if user is properly logged in and we have valid timestamp
    if (lastWeeklyResetTimestamp > 0 && userCode) {
      // Additional check to ensure we're not in a logout transition
      const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
      if (!currentStoredCode || currentStoredCode !== userCode) {
        logger.debug('WeeklyTracker: Skipping weekly reset refresh - logout in progress');
        return;
      }
      
      logger.debug('WeeklyTracker: Detected weekly reset, refreshing pitched items.');
      const timeoutId = setTimeout(() => {
        // Final check before executing async operation
        if (userCode && localStorage.getItem(STORAGE_KEYS.USER_CODE) === userCode) {
          refreshPitchedItems();
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [lastWeeklyResetTimestamp, userCode, refreshPitchedItems]);

  // Enhanced week change handler
  const handleWeekChange = (newWeekKey) => {
    logger.debug('WeeklyTracker: Week changed', { 
      from: weekNavigation.selectedWeekKey, 
      to: newWeekKey,
      isHistorical: weekNavigation.isHistoricalWeek 
    });
    
    weekNavigation.handleWeekChange(newWeekKey);
    // Refresh historical analysis when week changes
    if (weekNavigation.refreshHistoricalAnalysis) {
      weekNavigation.refreshHistoricalAnalysis();
    }
    // Refresh pitched items for the new week
    refreshPitchedItems();
  };

  // Reset selectedCharIdx if out of bounds
  useEffect(() => {
    if (selectedCharIdx >= characterBossSelections.length) {
      setSelectedCharIdx(Math.max(0, characterBossSelections.length - 1));
    }
  }, [characterBossSelections.length, selectedCharIdx]);

  // Calculate totals and character data
  const char = characterBossSelections[selectedCharIdx];
  const charKey = `${char?.name || ''}-${selectedCharIdx}`;
  const charBosses = char?.bosses || [];

  // Sort bosses by price (highest to lowest)
  const sortedBosses = [...charBosses].sort((a, b) => {
    try {
      const priceA = getBossPrice(a.name, a.difficulty) / (a.partySize || 1);
      const priceB = getBossPrice(b.name, b.difficulty) / (b.partySize || 1);
      return priceB - priceA;
    } catch (error) {
      logger.error('WeeklyTracker: Error sorting bosses', error);
      setError(`Error sorting bosses: ${error.message}`);
      return 0;
    }
  });

  const totalMeso = characterBossSelections.reduce((sum, char, charIndex) => {
    const charKey = `${char?.name || ''}-${charIndex}`;
    return sum + (char.bosses || []).reduce((s, b) =>
      checked[charKey]?.[b.name + '-' + b.difficulty] ? s + (getBossPrice(b.name, b.difficulty) / (b.partySize || 1)) : s, 0
    );
  }, 0);

  const obtainableMeso = characterBossSelections.reduce((sum, char) =>
    sum + (char.bosses || []).reduce((s, b) => s + (getBossPrice(b.name, b.difficulty) / (b.partySize || 1)), 0)
  , 0);

  const charSummaries = characterBossSelections.map((char, idx) => {
    const charKey = `${char?.name || ''}-${idx}`;
    const bosses = char?.bosses || [];
    const cleared = bosses.filter(b => checked[charKey]?.[b.name + '-' + b.difficulty]).length;
    const total = bosses.length;
    const totalMeso = bosses.reduce((sum, b) => 
      checked[charKey]?.[b.name + '-' + b.difficulty] ? sum + Math.ceil(getBossPrice(b.name, b.difficulty) / (b.partySize || 1)) : sum, 0
    );
    return {
      name: char.name,
      cleared,
      total,
      allCleared: total > 0 && cleared === total,
      left: total - cleared,
      idx,
      totalMeso
    };
  });

  const visibleCharSummaries = hideCompleted ? charSummaries.filter(cs => !cs.allCleared) : charSummaries;
  const showCharacterDetails = charBosses.length > 0;

  // Enhanced pitched item click handler
  const handlePitchedItemClick = async (pitchedData) => {
    if (!userCode) {
      logger.error('WeeklyTracker: No userCode available for pitched item interaction');
      return;
    }

    if (!characterBossSelections.length) {
      logger.error('WeeklyTracker: No characters available');
      return;
    }

    logger.debug('WeeklyTracker: Pitched item clicked', pitchedData);

    try {
      const { bossName, itemName, characterName, weekKey, isChecked, isHistorical, itemImage } = pitchedData;
      
      if (!characterName) {
        logger.error('WeeklyTracker: No character name provided');
        return;
      }

      // Verify character exists
      const characterExists = characterBossSelections.some(char => char.name === characterName);
      if (!characterExists) {
        logger.error('WeeklyTracker: Character not found in character list', { characterName });
        return;
      }

      if (isChecked) {
        // Remove the item
        await removePitchedItemByDetails(characterName, bossName, itemName, isHistorical ? convertWeekKeyToDate(weekKey) : null);
        logger.info('WeeklyTracker: Pitched item removed', { characterName, bossName, itemName });
      } else {
        if (isHistorical) {
          // For historical items that aren't checked, open the historical modal
          const getBossPitchedItems = (await import('../services/bossRegistryService.js')).getBossPitchedItems;
          const bossItems = getBossPitchedItems(bossName) || [];
          const item = bossItems.find(i => i.name === itemName);
          
          if (item) {
            const historicalData = {
              bossName: bossName,
              itemName: itemName,
              itemImage: itemImage || item.image,
              weekKey: weekKey,
              character: characterName
            };
            
            statsManagement.setHistoricalPitchedData(historicalData);
            statsManagement.setShowHistoricalPitchedModal(true);
          }
          return;
        }
        
        // Add the item (current week)
        await addNewPitchedItem(characterName, bossName, itemName, isHistorical ? convertWeekKeyToDate(weekKey) : null);
        logger.info('WeeklyTracker: Pitched item added', { characterName, bossName, itemName });
        
        // 🎯 AUTOMATIC BOSS CHECKING: If you got a drop, you must have cleared the boss!
        if (!isHistorical) {
          // Skip auto-check if boss unchecking is currently in progress
          if (bossUncheckingInProgressRef.current) {
            logger.info('WeeklyTracker: Skipping auto-check because boss unchecking is in progress');
            return;
          }
          
          try {
            logger.info('WeeklyTracker: Starting automatic boss check process', {
              characterName,
              bossName,
              totalCharacters: characterBossSelections.length,
              characterNames: characterBossSelections.map(char => char.name)
            });
            
            // Find the character and boss to mark as cleared
            const targetCharacterIndex = characterBossSelections.findIndex(char => char.name === characterName);
            const targetCharacter = characterBossSelections[targetCharacterIndex];
            
            if (targetCharacter && targetCharacterIndex !== -1) {
              const targetBoss = targetCharacter.bosses.find(boss => boss.name === bossName);
              
              if (targetBoss) {
                const charKey = `${targetCharacter.name}-${targetCharacterIndex}`;
                const bossKey = `${targetBoss.name}-${targetBoss.difficulty}`;
                
                // Check if boss is not already marked as cleared
                const isAlreadyCleared = checked[charKey]?.[bossKey];
                
                logger.info('WeeklyTracker: Boss check status verification', {
                  charKey,
                  bossKey,
                  isAlreadyCleared,
                  shouldAutoCheck: !isAlreadyCleared
                });
                
                if (!isAlreadyCleared) {
                  logger.info('WeeklyTracker: Auto-checking boss since pitched item was obtained', {
                    characterName,
                    characterIndex: targetCharacterIndex,
                    bossName: targetBoss.name,
                    difficulty: targetBoss.difficulty
                  });
                  
                  // Use database service directly to avoid UI conflicts
                  const { getBossRegistryId } = await import('./utils/bossCodeMapping.js');
                  const { toggleBossClearStatus } = await import('../services/userWeeklyDataService.js');
                  const { getCurrentMapleWeekStartDate } = await import('../utils/mapleWeekUtils.js');
                  
                  const bossRegistryId = await getBossRegistryId(targetBoss.name, targetBoss.difficulty);
                  const currentWeekStart = getCurrentMapleWeekStartDate();
                  
                  const result = await toggleBossClearStatus(
                    userCode,
                    currentWeekStart,
                    targetCharacter.index.toString(),
                    bossRegistryId,
                    true
                  );
                  
                  if (result.success) {
                    // Update local checked state
                    setChecked(prevChecked => {
                      const newChecked = { ...prevChecked };
                      if (!newChecked[charKey]) {
                        newChecked[charKey] = {};
                      }
                      newChecked[charKey] = { ...newChecked[charKey] };
                      newChecked[charKey][bossKey] = true;
                      return newChecked;
                    });
                    
                    logger.info('WeeklyTracker: Auto-check boss completed successfully', {
                      bossName: targetBoss.name,
                      difficulty: targetBoss.difficulty
                    });
                  } else {
                    logger.error('WeeklyTracker: Auto-check boss failed', {
                      error: result.error,
                      bossName: targetBoss.name
                    });
                  }
                } else {
                  logger.info('WeeklyTracker: Boss already cleared, skipping auto-check', {
                    characterName,
                    bossName: targetBoss.name
                  });
                }
              } else {
                logger.warn('WeeklyTracker: Boss not found in character configuration', {
                  characterName,
                  bossName,
                  characterBosses: targetCharacter.bosses?.map(b => b.name) || []
                });
              }
            } else {
              logger.warn('WeeklyTracker: Character not found in character selections', {
                characterName,
                availableCharacters: characterBossSelections.map(char => char.name)
              });
            }
          } catch (autoCheckError) {
            logger.error('WeeklyTracker: Failed to auto-check boss after pitched item', {
              error: autoCheckError.message,
              characterName,
              bossName
            });
            // Don't fail the pitched item operation if auto-check fails
          }
        }
      }
    } catch (error) {
      logger.error('WeeklyTracker: Error handling pitched item click', error);
    }
  };

  if (error) {
    return (
      <div className="weekly-tracker-error">
        <div className="weekly-tracker-error-message">{error}</div>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  if (!characterBossSelections.length) {
    return (
      <div className="weekly-tracker-no-characters">
        <div className={`weekly-tracker-no-characters-message ${showNoCharactersMessage ? 'visible' : ''}`}>
          No characters found. Go back and add a character first.
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-tracker">
      <div className="weekly-tracker-container">
        {/* Sidebar - DO NOT MODIFY */}
        <CharacterSidebar
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
          isHistoricalWeek={weekNavigation.isHistoricalWeek}
          totalMeso={totalMeso}
          obtainableMeso={obtainableMeso}
          selectedWeekKey={weekNavigation.selectedWeekKey}
          hideCompleted={hideCompleted}
          setHideCompleted={setHideCompleted}
          visibleCharSummaries={visibleCharSummaries}
          selectedCharIdx={selectedCharIdx}
          setSelectedCharIdx={setSelectedCharIdx}
          setPurgeTargetCharacter={statsManagement.setPurgeTargetCharacter}
          setShowCharacterPurgeConfirm={statsManagement.setShowCharacterPurgeConfirm}
          setShowCharacterPitchedModal={statsManagement.setShowCharacterPitchedModal}
          onShowTreasureAnalytics={() => statsManagement.setShowStats(true)}
          characterBossSelections={characterBossSelections}
          showOnboardingIndicators={showOnboardingIndicators}
        />

        <SidebarToggle 
          sidebarVisible={sidebarVisible} 
          setSidebarVisible={setSidebarVisible} 
        />

        {/* Main Content */}
        <div className="weekly-tracker-main fade-in">
          <div className="weekly-tracker-content">
            <div className="weekly-tracker-header">
              <h2 className="weekly-tracker-title">
                {weekNavigation.isHistoricalWeek ? 'Historical Week View' : 'Weekly Boss Tracker'}
              </h2>
            </div>

            {/* WeekNavigator - DO NOT MODIFY */}
            <div className="weekly-tracker-navigator-wrapper">
              <WeekNavigator
                appWeekKey={appWeekKey}
                selectedWeekKey={weekNavigation.selectedWeekKey}
                onWeekChange={handleWeekChange}
                isHistoricalWeek={weekNavigation.isHistoricalWeek}
                historicalAnalysis={weekNavigation.historicalAnalysis}
              />
            </div>

            {/* Conditional rendering: Historical Cards vs Boss Table */}
            {showCharacterDetails && (
              <>
                {weekNavigation.isHistoricalWeek ? (
                  <HistoricalWeekCards
                    bossData={bossData}
                    characterKey={charKey}
                    selectedWeekKey={weekNavigation.selectedWeekKey}
                    selectedCharIdx={selectedCharIdx}
                    pitchedChecked={pitchedChecked}
                    onPitchedItemClick={handlePitchedItemClick}
                    userCode={userCode}
                    cloudPitchedItems={cloudPitchedItems}
                    characterBossSelections={characterBossSelections}
                  />
                ) : (
              <BossTable
                bosses={sortedBosses}
                bossData={bossData}
                checked={checked}
                characterKey={charKey}
                onBossCheck={bossActions.handleCheck}
                getBossPrice={getBossPrice}
                    showTickAll={true}
                onTickAll={bossActions.handleTickAll}
                allTicked={charBosses.every(b => checked[charKey]?.[b.name + '-' + b.difficulty]) && charBosses.length > 0}
                    // Pitched items props
                    pitchedChecked={pitchedChecked}
                    onPitchedItemClick={handlePitchedItemClick}
                    isHistoricalWeek={false}
                    userCode={userCode}
                    selectedWeekKey={weekNavigation.selectedWeekKey}
                    selectedCharIdx={selectedCharIdx}
                    userInteractionRef={userInteractionRef}
                    cloudPitchedItems={cloudPitchedItems}
                    characterBossSelections={characterBossSelections}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* All modals consolidated for better organization */}
        <WeeklyTrackerModals
          statsManagement={statsManagement}
          weekNavigation={weekNavigation}
          pitchedChecked={pitchedChecked}
          setPitchedChecked={setPitchedChecked}
          userInteractionRef={userInteractionRef}
          setError={setError}
          characterBossSelections={characterBossSelections}
          selectedCharIdx={selectedCharIdx}
          cloudPitchedItems={cloudPitchedItems}
        />
      </div>
    </div>
  );
}

export default WeeklyTracker;