import { useMemo, useCallback } from 'react';
import { 
  getWeekKeyOffset, 
  getWeekLabel, 
  getWeekOffset,
  parseWeekKey,
  getWeekDateRange
} from '../utils/weekUtils';
import '../styles/week-navigator.css';
import { formatMesoBillions } from '../utils/formatUtils';

function WeekNavigator({
  appWeekKey,
  selectedWeekKey,
  onWeekChange,
  historicalAnalysis = {
    hasHistoricalData: false,
    oldestHistoricalWeek: null,
    userType: 'new',
    adaptiveWeekLimit: 8,
    historicalWeeks: []
  },
  characterBossSelections = [],
  checked = {},
  selectedCharIdx = 0,
}) {
  const navigationLimits = useMemo(() => {
    const currentOffsetBasedOnAppWeek = 0;
    const adaptiveLimit = historicalAnalysis?.adaptiveWeekLimit || 8;
    
    const minPastOffset = -adaptiveLimit;

    return {
      min: minPastOffset,
      max: currentOffsetBasedOnAppWeek,
      current: currentOffsetBasedOnAppWeek,
      adaptiveLimit
    };
  }, [historicalAnalysis, appWeekKey]);

  const selectedOffset = useMemo(() => getWeekOffset(selectedWeekKey, appWeekKey), [selectedWeekKey, appWeekKey]);
  
  const goToWeek = useCallback((weekKey) => {
    if (weekKey === selectedWeekKey) return;
    onWeekChange(weekKey);
  }, [selectedWeekKey, onWeekChange]);

  const goToPreviousWeek = () => {
    const newViewedWeekOffsetFromApp = selectedOffset - 1;
    if (newViewedWeekOffsetFromApp >= navigationLimits.min) {
      const newWeekKeyToView = getWeekKeyOffset(newViewedWeekOffsetFromApp, appWeekKey);
      goToWeek(newWeekKeyToView);
    }
  };

  const goToNextWeek = () => {
    const newViewedWeekOffsetFromApp = selectedOffset + 1;
    if (newViewedWeekOffsetFromApp <= navigationLimits.max) {
      const newWeekKeyToView = getWeekKeyOffset(newViewedWeekOffsetFromApp, appWeekKey);
      goToWeek(newWeekKeyToView);
    }
  };

  const goToOldestOrFallback = useCallback(() => {
    if (historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek) {
      goToWeek(historicalAnalysis.oldestHistoricalWeek);
    } else {
      const fallbackWeekKey = getWeekKeyOffset(-navigationLimits.adaptiveLimit, appWeekKey);
      goToWeek(fallbackWeekKey);
    }
  }, [historicalAnalysis, navigationLimits.adaptiveLimit, appWeekKey, goToWeek]);

  const goToCurrentAppWeek = () => {
    goToWeek(appWeekKey);
  };

  const canGoPrevious = selectedOffset > navigationLimits.min;
  const canGoNext = selectedOffset < navigationLimits.max; 
  const canGoToOldest = historicalAnalysis?.hasHistoricalData || selectedOffset > -navigationLimits.adaptiveLimit;
  
  const isSelectedWeekTheCurrentAppWeek = selectedWeekKey === appWeekKey;

  const weekInfo = useMemo(() => {
    const parsed = parseWeekKey(selectedWeekKey);
    const dateRange = getWeekDateRange(selectedWeekKey);
    return {
      label: getWeekLabel(selectedWeekKey, appWeekKey),
      parsed,
      dateRange,
      isSelectedWeekTheCurrentAppWeek,
      offset: selectedOffset
    };
  }, [selectedWeekKey, appWeekKey, isSelectedWeekTheCurrentAppWeek, selectedOffset]);

  const currentChar = characterBossSelections[selectedCharIdx];
  const currentCharBosses = currentChar?.bosses || [];
  const charCheckedKey = `${currentChar?.name || 'char'}-${currentChar?.index !== undefined ? currentChar.index : selectedCharIdx}`;

  let obtainableMesoForCurrentChar = 0;
  if (currentChar) {
    obtainableMesoForCurrentChar = currentCharBosses.reduce((sum, b) => {
      const price = b.price || 0;
      const partySize = b.partySize || 1;
      return sum + Math.ceil(price / partySize);
    }, 0);
  }
  
  let checkedMeso = 0;
  if (currentChar && checked[charCheckedKey]) {
    checkedMeso = currentCharBosses.reduce((sum, b) => {
      const bossKey = `${b.name}-${b.difficulty}`;
      if (checked[charCheckedKey]?.[bossKey]) {
        const price = b.price || 0;
        const partySize = b.partySize || 1;
        return sum + Math.ceil(price / partySize);
      }
      return sum;
    }, 0);
  }

  const formatMeso = (value) => {
    if (!value) return '0';
    return value.toLocaleString();
  };

  return (
    <div key={selectedWeekKey} className="week-navigator-container">
      <div className="week-navigator-header">
        <div className={`week-navigator-title ${isSelectedWeekTheCurrentAppWeek ? 'current-week' : 'historical-week'}`}>
          <span className="week-title-text">{weekInfo.label.replace(/\s*\(Current\)/i, '')}</span>
          {isSelectedWeekTheCurrentAppWeek && (
            <span className="week-navigator-current-dot">
              <span className="week-navigator-current-dot-inner"></span>
            </span>
          )}
        </div>
      </div>

      <div className="week-navigator-navigation">
        <div className="week-navigator-arrow-container">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={canGoPrevious ? goToPreviousWeek : undefined}
            className={`week-navigator-arrow arrow-left ${canGoPrevious ? 'enabled' : 'disabled'}`}
            title={canGoPrevious ? 'Previous Week' : `Already at oldest allowed week (${navigationLimits.adaptiveLimit} weeks back from current)`}
          >
            <path
              d="M20.3284 11.0001V13.0001L7.50011 13.0001L10.7426 16.2426L9.32842 17.6568L3.67157 12L9.32842 6.34314L10.7426 7.75735L7.49988 11.0001L20.3284 11.0001Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {weekInfo.dateRange && (
          <div className="week-navigator-date-range">
            {weekInfo.dateRange.start.toLocaleDateString()} - {weekInfo.dateRange.end.toLocaleDateString()}
          </div>
        )}

        <div className="week-navigator-arrow-container">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={isSelectedWeekTheCurrentAppWeek ? (canGoToOldest ? goToOldestOrFallback : undefined) : (canGoNext ? goToNextWeek : undefined)}
            className={`week-navigator-arrow arrow-right ${isSelectedWeekTheCurrentAppWeek ? (canGoToOldest ? 'enabled' : 'disabled') : (canGoNext ? 'enabled' : 'disabled')}`}
            title={isSelectedWeekTheCurrentAppWeek 
              ? (canGoToOldest 
                  ? (historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek 
                      ? `Jump to oldest data (${getWeekLabel(historicalAnalysis.oldestHistoricalWeek, appWeekKey)})` 
                      : `Jump to ${navigationLimits.adaptiveLimit} weeks back`)
                  : 'No older data available to jump to')
              : (canGoNext ? 'Next Week' : 'Already at current application week')
            }
          >
            <path
              d="M15.0378 6.34317L13.6269 7.76069L16.8972 11.0157L3.29211 11.0293L3.29413 13.0293L16.8619 13.0157L13.6467 16.2459L15.0643 17.6568L20.7079 11.9868L15.0378 6.34317Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      <div className="week-navigator-content">
        {isSelectedWeekTheCurrentAppWeek && currentChar && (
          <div className="week-navigator-progress">
            <div className="week-navigator-progress-meso">
              <div className="sidebar-progress-track week-navigator-progress-bar-container">
                <div 
                  className="sidebar-progress-fill week-navigator-progress-bar"
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

      <div className="week-navigator-buttons">
        {!isSelectedWeekTheCurrentAppWeek ? (
          <>
            <button
              onClick={goToCurrentAppWeek}
              className="week-navigator-button current-week-btn"
              title="Jump to current application week"
            >
              Current Week
            </button>

            {historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek && selectedWeekKey !== historicalAnalysis.oldestHistoricalWeek && (
              <button
                onClick={goToOldestOrFallback}
                className="week-navigator-button oldest-data-btn"
                title={`Jump to oldest recorded data (${getWeekLabel(historicalAnalysis.oldestHistoricalWeek, appWeekKey)})`}
              >
                Oldest Data
              </button>
            )}
          </>
        ) : (
          <div className="week-navigator-spacer" />
        )}
      </div>
    </div>
  );
}

export default WeekNavigator; 