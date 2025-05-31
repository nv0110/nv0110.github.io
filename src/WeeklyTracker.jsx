import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from './constants';
import WeekNavigator from './components/WeekNavigator';
import CrystalAnimation from './components/CrystalAnimation';
import CharacterSidebar from './components/CharacterSidebar';
import SidebarToggle from './components/SidebarToggle';
import BossTable from './components/BossTable';
import HistoricalWeekCards from './components/HistoricalWeekCards';
import { logger } from './utils/logger';

// Consolidated modals
import { WeeklyTrackerModals } from './features/weekly-tracker/WeeklyTrackerModals';

// Business logic hooks
import { useWeekNavigation } from './hooks/useWeekNavigation';
import { usePitchedItems } from './hooks/usePitchedItems';
import { useBossActions } from './hooks/useBossActions';
import { useStatsManagement } from './hooks/useStatsManagement';
import { useAppData } from './hooks/AppDataContext.jsx';
import { useUserWeeklyData } from '../hooks/useUserWeeklyData.js';

function WeeklyTracker({ characterBossSelections, bossData, checked, setChecked, userCode, appWeekKey }) {
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
  const [crystalAnimation, setCrystalAnimation] = useState(null);
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const [error, setError] = useState(null);
  const [showNoCharactersMessage, setShowNoCharactersMessage] = useState(false);

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
  const weekNavigation = useWeekNavigation(userCode, appWeekKey);
  const {
    pitchedChecked,
    setPitchedChecked,
    cloudPitchedItems,
    refreshPitchedItems,
    userInteractionRef
  } = usePitchedItems(userCode || null);
  
  const bossActions = useBossActions({
    userId: userCode,
    characterBossSelections,
    selectedCharIdx,
    checked,
    setChecked,
    setCrystalAnimation,
    setError,
    onDataChange: () => {
      refreshWeeklyData();
      refreshPitchedItems();
    },
    isHistoricalWeek: weekNavigation.isHistoricalWeek
  });

  const statsManagement = useStatsManagement(userCode, refreshPitchedItems);

  // Effect to refresh pitched items when a weekly reset occurs
  useEffect(() => {
    if (lastWeeklyResetTimestamp > 0 && userCode) {
      logger.info('WeeklyTracker: Detected weekly reset, refreshing pitched items.');
      const timeoutId = setTimeout(() => {
        refreshPitchedItems();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [lastWeeklyResetTimestamp]);

  // Enhanced week change handler
  const handleWeekChange = (newWeekKey) => {
    logger.info('WeeklyTracker: Week changed', { 
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

    logger.info('WeeklyTracker: Pitched item clicked', pitchedData);

    try {
      const { bossName, itemName, characterName, weekKey, isChecked, isHistorical, itemImage } = pitchedData;
      
      if (isHistorical && !isChecked) {
        logger.info('WeeklyTracker: Opening historical modal for item', { bossName, itemName, characterName, weekKey });
        
        // For historical weeks, open the historical pitched modal instead of direct action
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
          
          // Set the historical data and show modal via stats management
          statsManagement.setHistoricalPitchedData(historicalData);
          statsManagement.setShowHistoricalPitchedModal(true);
        }
        return;
      }
      
      if (isChecked) {
        logger.info('WeeklyTracker: Removing pitched item', { userCode, characterName, bossName, itemName });
        // Remove the pitched item
        const { removePitchedItem } = await import('../services/pitchedItemsService.js');
        const result = await removePitchedItem(userCode, characterName, bossName, itemName);
        logger.info('WeeklyTracker: Remove result', result);
        if (result.success) {
          logger.info('WeeklyTracker: Successfully removed pitched item');
          refreshPitchedItems();
        } else {
          logger.error('WeeklyTracker: Failed to remove pitched item', result.error);
          setError(`Failed to remove pitched item: ${result.error}`);
        }
      } else {
        if (isHistorical) {
          // For historical items that aren't checked, always open the modal
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
        } else {
          // For current week: Add the pitched item AND mark boss as cleared
          logger.info('WeeklyTracker: Adding pitched item and marking boss as cleared', { userCode, characterName, bossName, itemName });
          
          // Step 1: Add the pitched item
          const { addPitchedItem } = await import('../services/pitchedItemsService.js');
          const pitchedItemData = {
            charId: characterName,
            bossName: bossName,
            item: itemName,
            date: new Date().toISOString().split('T')[0]
          };
          
          const pitchedResult = await addPitchedItem(userCode, pitchedItemData);
          
          if (pitchedResult.success) {
            logger.info('WeeklyTracker: Successfully added pitched item');
            
            // Step 2: Mark the boss as cleared
            // Find the boss configuration to get difficulty and other details
            const char = characterBossSelections[selectedCharIdx];
            if (char) {
              const bossConfig = char.bosses.find(b => b.name === bossName);
              if (bossConfig) {
                logger.info('WeeklyTracker: Also marking boss as cleared', { bossName, difficulty: bossConfig.difficulty });
                
                // Use the existing boss check handler to mark as cleared
                await bossActions.handleCheck(bossConfig, true, null);
              } else {
                logger.warn('WeeklyTracker: Boss configuration not found, cannot auto-mark as cleared', { bossName, characterName });
              }
            }
            
            // Refresh data
            refreshPitchedItems();
          } else {
            logger.error('WeeklyTracker: Failed to add pitched item', pitchedResult.error);
            setError(`Failed to add pitched item: ${pitchedResult.error}`);
          }
        }
      }
    } catch (error) {
      logger.error('WeeklyTracker: Error handling pitched item click', error);
      setError(`Error: ${error.message}`);
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
      {crystalAnimation && (
        <CrystalAnimation
          startPosition={crystalAnimation.startPosition}
          endPosition={crystalAnimation.endPosition}
          onComplete={() => setCrystalAnimation(null)}
        />
      )}

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
                    bosses={sortedBosses}
                    bossData={bossData}
                    characterKey={charKey}
                    selectedWeekKey={weekNavigation.selectedWeekKey}
                    selectedCharIdx={selectedCharIdx}
                    pitchedChecked={pitchedChecked}
                    onPitchedItemClick={handlePitchedItemClick}
                    userCode={userCode}
                    cloudPitchedItems={cloudPitchedItems}
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