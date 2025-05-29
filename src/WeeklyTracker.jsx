import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from './constants';
import WeekNavigator from './components/WeekNavigator';
import CrystalAnimation from './components/CrystalAnimation';
import CharacterSidebar from './components/CharacterSidebar';
import SidebarToggle from './components/SidebarToggle';
import ModeIndicator from './components/ModeIndicator';
import BossTable from './components/BossTable';
import StatsModal from './components/StatsModal';
import {
  StatsResetConfirmDialog,
  CharacterPurgeDialog,
  SuccessDialog,
  PitchedItemDetailsModal
} from './components/ConfirmationDialogs';

// Custom hooks
import { useWeekNavigation } from './hooks/useWeekNavigation';
import { usePitchedItems } from './hooks/usePitchedItems';
import { useBossActions } from './hooks/useBossActions';
import { useStatsManagement } from './hooks/useStatsManagement';
import { useAppData } from './hooks/AppDataContext.jsx';
import { useAuthentication } from '../hooks/useAuthentication.js';
import { useUserWeeklyData } from '../hooks/useUserWeeklyData.js';

// Styles

function WeeklyTracker({ characterBossSelections, bossData, checked, setChecked, userCode, appWeekKey }) {
  const { lastWeeklyResetTimestamp } = useAppData();
  const { user } = useAuthentication();
  const {
    refreshWeeklyData
  } = useUserWeeklyData(user?.id);

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
    refreshPitchedItems,
    loadingPitchedItems,
    setLoadingPitchedItems,
    userInteractionRef
  } = usePitchedItems(user?.id);
  
  const bossActions = useBossActions({
    userId: user?.id,
    characterBossSelections,
    selectedCharIdx,
    checked,
    setChecked,
    setCrystalAnimation,
    setError,
    onDataChange: () => {
      refreshWeeklyData();
      refreshPitchedItems();
    }
  });

  const statsManagement = useStatsManagement(userCode, refreshPitchedItems);

  // Effect to refresh pitched items when a weekly reset occurs - NOT on week navigation
  useEffect(() => {
    if (lastWeeklyResetTimestamp > 0) {
      console.log('WeeklyTracker: Detected weekly reset, refreshing pitched items.');
      // Use a timeout to prevent immediate cascading effects
      const timeoutId = setTimeout(() => {
        refreshPitchedItems(userCode, weekNavigation.selectedWeekKey);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [lastWeeklyResetTimestamp, userCode]); // Removed refreshPitchedItems from deps to prevent circular updates

  // Enhanced week change handler - remove parameters causing re-renders
  const handleWeekChange = (newWeekKey) => {
    weekNavigation.handleWeekChange(newWeekKey);
  };

  // Reset selectedCharIdx if out of bounds
  useEffect(() => {
    if (selectedCharIdx >= characterBossSelections.length) {
      setSelectedCharIdx(Math.max(0, characterBossSelections.length - 1));
    }
  }, [characterBossSelections.length, selectedCharIdx]);

  // Calculate totals
  const char = characterBossSelections[selectedCharIdx];
  const charKey = `${char?.name || ''}-${selectedCharIdx}`;
  const charBosses = char?.bosses || [];

  const sortedBosses = [...charBosses].sort((a, b) => {
    try {
      const priceA = getBossPrice(a.name, a.difficulty) / (a.partySize || 1);
      const priceB = getBossPrice(b.name, b.difficulty) / (b.partySize || 1);
      return priceB - priceA;
    } catch (error) {
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
        {/* Sidebar */}
        <CharacterSidebar
          sidebarVisible={sidebarVisible}
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
                Weekly Boss Tracker
              </h2>
            </div>

            <div className="weekly-tracker-navigator-wrapper">
              <WeekNavigator
                appWeekKey={appWeekKey}
                selectedWeekKey={weekNavigation.selectedWeekKey}
                onWeekChange={handleWeekChange}
                isHistoricalWeek={weekNavigation.isHistoricalWeek}
                historicalAnalysis={weekNavigation.historicalAnalysis}
                characterBossSelections={characterBossSelections}
                checked={checked}
                selectedCharIdx={selectedCharIdx}
                totalMeso={totalMeso}
                obtainableMeso={obtainableMeso}
                charSummaries={charSummaries}
              />
            </div>

            <ModeIndicator
              selectedWeekKey={weekNavigation.selectedWeekKey}
              showTickAll={showCharacterDetails && !weekNavigation.isHistoricalWeek}
              onTickAll={bossActions.handleTickAll}
              allTicked={charBosses.every(b => checked[charKey]?.[b.name + '-' + b.difficulty]) && charBosses.length > 0}
            />

            {showCharacterDetails && (
              <div>
                <BossTable
                  key={`${weekNavigation.selectedWeekKey}-${selectedCharIdx}`}
                  isHistoricalWeek={weekNavigation.isHistoricalWeek}
                  characterBossSelections={characterBossSelections}
                  selectedCharIdx={selectedCharIdx}
                  charBosses={charBosses}
                  sortedBosses={sortedBosses}
                  bossData={bossData}
                  checked={checked}
                  setChecked={setChecked}
                  charKey={charKey}
                  getBossPrice={getBossPrice}

                  pitchedChecked={pitchedChecked}
                  setPitchedChecked={setPitchedChecked}
                  weekKey={weekNavigation.selectedWeekKey}
                  handleCheck={bossActions.handleCheck}
                  refreshCheckedStateFromDatabase={bossActions.refreshCheckedStateFromDatabase}
                  userInteractionRef={userInteractionRef}
                  userCode={userCode}
                  setError={setError}
                  startStatsTrackingIfNeeded={statsManagement.startStatsTrackingIfNeeded}
                  setHistoricalPitchedData={statsManagement.setHistoricalPitchedData}
                  setShowHistoricalPitchedModal={statsManagement.setShowHistoricalPitchedModal}

                  loadingPitchedItems={loadingPitchedItems}
                  setLoadingPitchedItems={setLoadingPitchedItems}
                  refreshPitchedItems={refreshPitchedItems}
                  refreshHistoricalAnalysis={weekNavigation.refreshHistoricalAnalysis}
                />
              </div>
            )}

            <div className="weekly-tracker-stats-button-container">
              <button
                className="weekly-tracker-stats-button"
                onClick={() => statsManagement.setShowStats(true)}
              >
                View Stats
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <StatsModal
          showStats={statsManagement.showStats}
          setShowStats={statsManagement.setShowStats}
          allYears={statsManagement.allYears}
          selectedYear={statsManagement.selectedYear}
          setSelectedYear={statsManagement.setSelectedYear}
          yearlyPitchedSummary={statsManagement.yearlyPitchedSummary}
          isLoadingCloudStats={statsManagement.isLoadingCloudStats}
          setPitchedModalItem={statsManagement.setPitchedModalItem}
          setShowPitchedModal={statsManagement.setShowPitchedModal}
          setShowStatsResetConfirm={statsManagement.setShowStatsResetConfirm}
        />

        <StatsResetConfirmDialog
          showStatsResetConfirm={statsManagement.showStatsResetConfirm}
          setShowStatsResetConfirm={statsManagement.setShowStatsResetConfirm}
          onConfirm={() => statsManagement.handleStatsReset(setError)}
        />

        <CharacterPurgeDialog
          showCharacterPurgeConfirm={statsManagement.showCharacterPurgeConfirm}
          setShowCharacterPurgeConfirm={statsManagement.setShowCharacterPurgeConfirm}
          purgeTargetCharacter={statsManagement.purgeTargetCharacter}
          purgeInProgress={statsManagement.purgeInProgress}
          onConfirm={() => statsManagement.handleCharacterPurge(
            pitchedChecked,
            setPitchedChecked,
            weekNavigation.selectedWeekKey,
            userInteractionRef,
            setError
          )}
        />

        <SuccessDialog
          resetSuccessVisible={statsManagement.resetSuccessVisible}
          closeResetSuccess={statsManagement.closeResetSuccess}
          purgeSuccess={statsManagement.purgeSuccess}
          setPurgeSuccess={statsManagement.setPurgeSuccess}
        />

        <PitchedItemDetailsModal
          showPitchedModal={statsManagement.showPitchedModal}
          setShowPitchedModal={statsManagement.setShowPitchedModal}
          pitchedModalItem={statsManagement.pitchedModalItem}
          pitchedModalDetails={statsManagement.pitchedModalDetails}
        />

        {/* Historical pitched modal functionality removed - pitched item tracking disabled */}
      </div>
    </div>
  );
}

export default WeeklyTracker;