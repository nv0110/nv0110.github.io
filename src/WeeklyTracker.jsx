import { useState, useEffect, useMemo } from 'react';
import { savePitchedItem, removeManyPitchedItems } from './pitched-data-service';
import { getCurrentWeekKey } from './utils/weekUtils';
import { STORAGE_KEYS } from './constants';
import WeekNavigator from './components/WeekNavigator';
import HistoricalPitchedModal from './components/HistoricalPitchedModal';
import CrystalAnimation from './components/CrystalAnimation';
import CharacterSidebar from './components/CharacterSidebar';
import SidebarToggle from './components/SidebarToggle';
import ReadOnlyModeIndicator from './components/ReadOnlyModeIndicator';
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

function WeeklyTracker({ characters, bossData, checked, setChecked, userCode }) {
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
  const [progressData, setProgressData] = useState({
    weeklyTotal: 0,
    lastReset: new Date().toISOString(),
    history: []
  });

  // Hide completed characters toggle
  const [hideCompleted, setHideCompleted] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_HIDE_COMPLETED);
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_HIDE_COMPLETED, JSON.stringify(hideCompleted));
  }, [hideCompleted]);

  // Custom hooks for complex logic
  const weekNavigation = useWeekNavigation(userCode);
  const pitchedItems = usePitchedItems(
    userCode, 
    characters, 
    checked, 
    setChecked, 
    weekNavigation.selectedWeekKey
  );
  
  const bossActions = useBossActions({
    characters,
    selectedCharIdx,
    checked,
    setChecked,
    bossData,
    pitchedChecked: pitchedItems.pitchedChecked,
    setPitchedChecked: pitchedItems.setPitchedChecked,
    weekKey: weekNavigation.selectedWeekKey,
    selectedWeekKey: weekNavigation.selectedWeekKey,
    isHistoricalWeek: weekNavigation.isHistoricalWeek,
    readOnlyOverride: weekNavigation.readOnlyOverride,
    userCode,
    userInteractionRef: pitchedItems.userInteractionRef,
    setCrystalAnimation,
    setError,
    startStatsTrackingIfNeeded: () => {}
  });

  const statsManagement = useStatsManagement(userCode, pitchedItems.refreshPitchedItems);

  // Enhanced week change handler that passes current data for caching
  const handleWeekChangeWithData = (newWeekKey) => {
    weekNavigation.handleWeekChange(
      newWeekKey, 
      checked, 
      pitchedItems.cloudPitchedItems, 
      pitchedItems.pitchedChecked
    );
  };

  // Reset selectedCharIdx if out of bounds
  useEffect(() => {
    if (selectedCharIdx >= characters.length) {
      setSelectedCharIdx(Math.max(0, characters.length - 1));
    }
  }, [characters.length, selectedCharIdx]);

  // Calculate totals
  const char = characters[selectedCharIdx];
  const charKey = `${char?.name || ''}-${selectedCharIdx}`;
  const charBosses = char?.bosses || [];

  const sortedBosses = [...charBosses].sort((a, b) => {
    try {
      const priceA = getBossPrice(a.name, a.difficulty) / (a.partySize || 1);
      const priceB = getBossPrice(b.name, b.difficulty) / (b.partySize || 1);
      return priceB - priceA;
    } catch (err) {
      return 0;
    }
  });

  const totalMeso = characters.reduce((sum, char, charIndex) => {
    const charKey = `${char?.name || ''}-${charIndex}`;
    return sum + (char.bosses || []).reduce((s, b) =>
      checked[charKey]?.[b.name + '-' + b.difficulty] ? s + (getBossPrice(b.name, b.difficulty) / (b.partySize || 1)) : s, 0
    );
  }, 0);

  const obtainableMeso = characters.reduce((sum, char) =>
    sum + (char.bosses || []).reduce((s, b) => s + (getBossPrice(b.name, b.difficulty) / (b.partySize || 1)), 0)
  , 0);

  const charSummaries = characters.map((char, idx) => {
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
      <div className="App dark" style={{ padding: '2rem', color: '#e6e0ff', fontSize: '1.2rem', textAlign: 'center' }}>
        <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>
        <button onClick={() => setError(null)} style={{ marginRight: '1rem' }}>Try Again</button>
      </div>
    );
  }

  if (!characters.length) {
    return (
      <div className="App dark" style={{ padding: '2rem', color: '#e6e0ff', fontSize: '1.2rem', textAlign: 'center' }}>
        No characters found. Go back and add a character first.
      </div>
    );
  }

  return (
    <div className="App dark" style={{ 

    }}>
      {crystalAnimation && (
        <CrystalAnimation
          startPosition={crystalAnimation.startPosition}
          endPosition={crystalAnimation.endPosition}
          onComplete={() => setCrystalAnimation(null)}
        />
      )}

      <div style={{
        display: 'flex',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
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
          isReadOnlyMode={weekNavigation.isReadOnlyMode}
          setPurgeTargetCharacter={statsManagement.setPurgeTargetCharacter}
          setShowCharacterPurgeConfirm={statsManagement.setShowCharacterPurgeConfirm}
        />

        <SidebarToggle 
          sidebarVisible={sidebarVisible} 
          setSidebarVisible={setSidebarVisible} 
        />

        {/* Main Content */}
        <div className="weekly-tracker-main" style={{
          margin: '0 auto'
        }}>
          <div style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '2rem',
            width: '100%',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: '0.5rem' }}>
                Weekly Boss Tracker
              </h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <WeekNavigator
                selectedWeekKey={weekNavigation.selectedWeekKey}
                onWeekChange={handleWeekChangeWithData}
                availableWeeks={weekNavigation.availableWeeks}
                isReadOnlyMode={weekNavigation.isReadOnlyMode}
                isHistoricalWeek={weekNavigation.isHistoricalWeek}
              />
            </div>

            <ReadOnlyModeIndicator
              isHistoricalWeek={weekNavigation.isHistoricalWeek}
              isReadOnlyMode={weekNavigation.isReadOnlyMode}
              readOnlyOverride={weekNavigation.readOnlyOverride}
              setReadOnlyOverride={weekNavigation.setReadOnlyOverride}
            />

            {showCharacterDetails && (
              <div>
                {!weekNavigation.isHistoricalWeek && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 12, 
                    marginBottom: 24 
                  }}>
                    <button 
                      onClick={bossActions.handleTickAll} 
                      disabled={weekNavigation.isReadOnlyMode}
                      style={{ 
                        padding: '0.5rem 1.2rem', 
                        borderRadius: 6, 
                        background: weekNavigation.isReadOnlyMode ? '#4a4a4a' : '#805ad5', 
                        color: '#fff', 
                        fontWeight: 600, 
                        cursor: weekNavigation.isReadOnlyMode ? 'not-allowed' : 'pointer',
                        opacity: weekNavigation.isReadOnlyMode ? 0.5 : 1,
                        border: '1px solid #9f7aea'
                      }}
                    >
                      {charBosses.every(b => checked[charKey]?.[b.name + '-' + b.difficulty]) && charBosses.length > 0 ? 'Untick All' : 'Tick All'}
                    </button>
                  </div>
                )}

                <BossTable
                  isHistoricalWeek={weekNavigation.isHistoricalWeek}
                  characters={characters}
                  selectedCharIdx={selectedCharIdx}
                  charBosses={charBosses}
                  sortedBosses={sortedBosses}
                  bossData={bossData}
                  checked={checked}
                  charKey={charKey}
                  getBossPrice={getBossPrice}
                  isReadOnlyMode={weekNavigation.isReadOnlyMode}
                  pitchedChecked={pitchedItems.pitchedChecked}
                  weekKey={weekNavigation.selectedWeekKey}
                  handleCheck={bossActions.handleCheck}
                  userInteractionRef={pitchedItems.userInteractionRef}
                  userCode={userCode}
                  savePitchedItem={savePitchedItem}
                  removeManyPitchedItems={removeManyPitchedItems}
                  setPitchedChecked={pitchedItems.setPitchedChecked}
                  setError={setError}
                  startStatsTrackingIfNeeded={statsManagement.startStatsTrackingIfNeeded}
                  setHistoricalPitchedData={statsManagement.setHistoricalPitchedData}
                  setShowHistoricalPitchedModal={statsManagement.setShowHistoricalPitchedModal}
                  readOnlyOverride={weekNavigation.readOnlyOverride}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, marginTop: '2rem' }}>
              <button
                style={{
                  background: 'linear-gradient(135deg, #805ad5, #9f7aea)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '0.8rem 2.5rem',
                  fontWeight: 700,
                  fontSize: '1.1em',
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: 320,
                  boxShadow: '0 4px 12px rgba(128, 90, 213, 0.4)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onClick={() => statsManagement.setShowStats(true)}
              >
                View Stats
              </button>
            </div>
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
          pitchedItems.pitchedChecked,
          pitchedItems.setPitchedChecked,
          weekNavigation.selectedWeekKey,
          pitchedItems.userInteractionRef,
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

      {statsManagement.showHistoricalPitchedModal && statsManagement.historicalPitchedData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(40,32,74,0.96)',
          zIndex: 6000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
          onClick={() => statsManagement.setShowHistoricalPitchedModal(false)}
        >
          <HistoricalPitchedModal
            data={statsManagement.historicalPitchedData}
            characters={characters}
            onClose={() => statsManagement.setShowHistoricalPitchedModal(false)}
            onConfirm={async (dateStr, selectedCharacter) => {
              // Historical pitched item save logic here
              statsManagement.setShowHistoricalPitchedModal(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default WeeklyTracker;