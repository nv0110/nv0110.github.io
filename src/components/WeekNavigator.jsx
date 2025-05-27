import { useMemo, useCallback } from 'react';
import { 
  getCurrentWeekKey, 
  getWeekKeyOffset, 
  getWeekLabel, 
  getWeekOffset,
  parseWeekKey,
  getWeekDateRange
} from '../utils/weekUtils';
import '../styles/week-navigator.css';
import { formatMesoBillions } from '../utils/formatUtils';

function WeekNavigator({
  selectedWeekKey,
  onWeekChange,
  // Progress data for current week
  characterBossSelections = [],
  checked = {},
  selectedCharIdx = 0,
  totalMeso = 0,
  obtainableMeso = 0,
  // Add historicalAnalysis with default values
  historicalAnalysis = {
    hasHistoricalData: false,
    oldestHistoricalWeek: null,
    userType: 'new',
    adaptiveWeekLimit: 8
  },
  charSummaries
}) {
  const currentWeekKey = getCurrentWeekKey();
  
  // Calculate navigation boundaries using adaptive limits
  const navigationLimits = useMemo(() => {
    const currentOffset = 0;
    const adaptiveLimit = historicalAnalysis?.adaptiveWeekLimit || 8;
    
    // Always allow navigation to the full adaptive limit range
    // This ensures users can navigate to weeks 6, 7, 8 even if they only have data from week 5
    const minPastOffset = -adaptiveLimit;

    return {
      min: minPastOffset,
      max: currentOffset,
      current: currentOffset,
      adaptiveLimit
    };
  }, [historicalAnalysis]);

  // Current selected week offset from current week
  const selectedOffset = getWeekOffset(selectedWeekKey);
  
  // Navigation functions
  const goToWeek = useCallback((weekKey) => {
    if (weekKey === selectedWeekKey) return;
    onWeekChange(weekKey);
  }, [selectedWeekKey, onWeekChange]);

  const goToPreviousWeek = () => {
    const newOffset = selectedOffset - 1;
    if (newOffset >= navigationLimits.min) {
      const newWeekKey = getWeekKeyOffset(newOffset);
      goToWeek(newWeekKey);
    }
    // Don't wrap around - just stop at the limit
  };

  const goToNextWeek = () => {
    const newOffset = selectedOffset + 1;
    if (newOffset <= navigationLimits.max) {
      const newWeekKey = getWeekKeyOffset(newOffset);
      goToWeek(newWeekKey);
    }
  };

  const goToOldestOrFallback = useCallback(() => {
    // Debug logging
    console.log('🔍 goToOldestOrFallback called with analysis:', {
      hasHistoricalData: historicalAnalysis?.hasHistoricalData,
      oldestHistoricalWeek: historicalAnalysis?.oldestHistoricalWeek,
      userType: historicalAnalysis?.userType,
      adaptiveLimit: navigationLimits.adaptiveLimit
    });
    
    // Use sophisticated historical analysis for navigation
    if (historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek) {
      // Jump to the oldest registered historical data
      console.log(`🎯 Jumping to oldest historical data: ${historicalAnalysis.oldestHistoricalWeek} (${historicalAnalysis.userType} user)`);
      goToWeek(historicalAnalysis.oldestHistoricalWeek);
    } else {
      // Jump to adaptive limit weeks back if no historical data
      const fallbackWeekKey = getWeekKeyOffset(-navigationLimits.adaptiveLimit);
      console.log(`🎯 No historical data found, jumping to ${navigationLimits.adaptiveLimit} weeks back: ${fallbackWeekKey}`);
      goToWeek(fallbackWeekKey);
    }
  }, [historicalAnalysis, navigationLimits.adaptiveLimit, goToWeek]);

  const goToCurrentWeek = () => {
    goToWeek(currentWeekKey);
  };

  const goToOldestWeek = () => {
    if (historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek) {
      goToWeek(historicalAnalysis.oldestHistoricalWeek);
    }
  };

  // Check if navigation is possible using sophisticated analysis
  const canGoPrevious = selectedOffset > navigationLimits.min; // Can go to previous week within limits
  const canGoNext = selectedOffset < navigationLimits.max; // Can go to next week (towards current)
  const canGoToOldest = historicalAnalysis?.hasHistoricalData || selectedOffset > -navigationLimits.adaptiveLimit;
  const isCurrentWeek = selectedWeekKey === currentWeekKey;
  const hasOlderData = historicalAnalysis?.hasHistoricalData;

  // Get week display info
  const weekInfo = useMemo(() => {
    const parsed = parseWeekKey(selectedWeekKey);
    const dateRange = getWeekDateRange(selectedWeekKey);
    
    return {
      label: getWeekLabel(selectedWeekKey),
      parsed,
      dateRange,
      isCurrentWeek,
      offset: selectedOffset
    };
  }, [selectedWeekKey, isCurrentWeek, selectedOffset]);

  // Calculate progress data for current week
  const currentChar = characterBossSelections[selectedCharIdx];
  const currentCharBosses = currentChar?.bosses || [];
  const currentCharKey = `${currentChar?.name || ''}-${selectedCharIdx}`;
  
  // Count completed bosses for this character
  const completedBosses = currentCharBosses.filter(b => {
    return checked[currentCharKey]?.[`${b.name}-${b.difficulty}`];
  }).length;
  
  const totalBosses = currentCharBosses.length;
  const progressPercentage = totalBosses > 0 ? (completedBosses / totalBosses) * 100 : 0;

  // Calculate character's total obtainable meso - using the same logic as the sidebar
  let obtainableMesoForCurrentChar = 0;
  if (currentChar) {
    obtainableMesoForCurrentChar = currentCharBosses.reduce((sum, b) => {
      const price = b.price || 0;
      const partySize = b.partySize || 1;
      return sum + Math.ceil(price / partySize);
    }, 0);
  }
  
  // Calculate how much meso this character has earned - using the same logic as the sidebar
  let checkedMeso = 0;
  if (currentChar) {
    checkedMeso = currentCharBosses.reduce((sum, b) => {
      const bossKey = `${b.name}-${b.difficulty}`;
      if (checked[currentCharKey]?.[bossKey]) {
        const price = b.price || 0;
        const partySize = b.partySize || 1;
        return sum + Math.ceil(price / partySize);
      }
      return sum;
    }, 0);
  }

  // Format meso values
  const formatMeso = (value) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  return (
    <div key={selectedWeekKey} className="week-navigator-container">
      {/* Header section - fixed height */}
      <div className="week-navigator-header">
        <div className={`week-navigator-title ${isCurrentWeek ? 'current-week' : 'historical-week'}`}>
          {weekInfo.label.replace(/\s*\(Current\)/i, '')}
          {/* Subtle current week indicator */}
          {isCurrentWeek && (
            <span className="week-navigator-current-dot">
              <span className="week-navigator-current-dot-inner"></span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation controls - FIXED POSITION */}
      <div className="week-navigator-navigation">
        {/* Previous week SVG icon */}
        <div className="week-navigator-arrow-container">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={canGoPrevious ? goToPreviousWeek : undefined}
            className={`week-navigator-arrow arrow-left ${canGoPrevious ? 'enabled' : 'disabled'}`}
            title={canGoPrevious ? 'Previous Week' : `Already at oldest week (${navigationLimits.adaptiveLimit} weeks back)`}
          >
            <path
              d="M20.3284 11.0001V13.0001L7.50011 13.0001L10.7426 16.2426L9.32842 17.6568L3.67157 12L9.32842 6.34314L10.7426 7.75735L7.49988 11.0001L20.3284 11.0001Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Date range - always shown */}
        {weekInfo.dateRange && (
          <div className="week-navigator-date-range">
            {weekInfo.dateRange.start.toLocaleDateString()} - {weekInfo.dateRange.end.toLocaleDateString()}
          </div>
        )}

        {/* Next week SVG icon */}
        <div className="week-navigator-arrow-container">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={isCurrentWeek ? (canGoToOldest ? goToOldestOrFallback : undefined) : (canGoNext ? goToNextWeek : undefined)}
            className={`week-navigator-arrow arrow-right ${(isCurrentWeek ? canGoToOldest : canGoNext) ? 'enabled' : 'disabled'}`}
            title={isCurrentWeek 
              ? (canGoToOldest 
                  ? (historicalAnalysis?.hasHistoricalData 
                      ? `Jump to oldest data (${historicalAnalysis?.oldestHistoricalWeek})` 
                      : `Jump to ${navigationLimits.adaptiveLimit} weeks back`)
                  : 'No historical data available')
              : (canGoNext ? 'Next Week' : 'Already at current week')
            }
          >
            <path
              d="M15.0378 6.34317L13.6269 7.76069L16.8972 11.0157L3.29211 11.0293L3.29413 13.0293L16.8619 13.0157L13.6467 16.2459L15.0643 17.6568L20.7079 11.9868L15.0378 6.34317Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Content area - flexible height */}
      <div className="week-navigator-content">
        {/* Current week progress section */}
        {isCurrentWeek && (
          <div className="week-navigator-progress">
            {/* Meso progress - always show in current week */}
            <div className="week-navigator-progress-meso">
              <div className="sidebar-progress-track week-navigator-progress-bar-container">
                <div 
                  className="sidebar-progress-fill"
                  style={{ 
                    width: `${obtainableMesoForCurrentChar > 0 ? Math.min((checkedMeso / obtainableMesoForCurrentChar) * 100, 100) : 0}%`
                  }} 
                >
                  {obtainableMesoForCurrentChar > 0 && checkedMeso > 0 && (
                    <div className="week-navigator-progress-shimmer" />
                  )}
                </div>
              </div>
              <div className="sidebar-progress-numbers">
                <span>{formatMesoBillions(checkedMeso)}</span>
                <span>{formatMesoBillions(obtainableMesoForCurrentChar)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons section - for historical weeks, spacer for current week */}
      <div className="week-navigator-buttons">
        {!isCurrentWeek ? (
          <>
            <button
              onClick={goToCurrentWeek}
              className="week-navigator-button current-week-btn"
              title="Jump to current week"
            >
              Current Week
            </button>

            {hasOlderData && (
              <button
                onClick={goToOldestWeek}
                className="week-navigator-button oldest-data-btn"
                title={`Jump to oldest data (${historicalAnalysis.oldestHistoricalWeek})`}
              >
                Oldest Data
              </button>
            )}
          </>
        ) : (
          // Empty spacer for current week to maintain consistent layout
          <div className="week-navigator-spacer" />
        )}
      </div>


    </div>
  );
}

export default WeekNavigator; 