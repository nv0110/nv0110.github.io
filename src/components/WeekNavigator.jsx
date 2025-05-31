import { useMemo, useCallback, useState, useEffect } from 'react';
import { 
  getWeekKeyOffset, 
  getWeekLabel, 
  getWeekOffset,
  parseWeekKey,
  getWeekDateRange
} from '../utils/weekUtils';
import { logger } from '../utils/logger';
import '../styles/week-navigator.css';

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
  }
}) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Debug button visibility
  useEffect(() => {
    const currentBtnVisible = !isSelectedWeekTheCurrentAppWeek;
    const oldestBtnVisible = (historicalAnalysis?.hasHistoricalData && 
      historicalAnalysis?.oldestHistoricalWeek && 
      selectedWeekKey !== historicalAnalysis.oldestHistoricalWeek && 
      !isSelectedWeekTheCurrentAppWeek);
    
    logger.debug('WeekNavigator: Button visibility debug', {
      selectedWeekKey,
      appWeekKey,
      isSelectedWeekTheCurrentAppWeek,
      currentBtnVisible,
      oldestBtnVisible,
      historicalAnalysis: {
        hasHistoricalData: historicalAnalysis?.hasHistoricalData,
        oldestHistoricalWeek: historicalAnalysis?.oldestHistoricalWeek,
        userType: historicalAnalysis?.userType,
        adaptiveWeekLimit: historicalAnalysis?.adaptiveWeekLimit
      }
    });
  }, [selectedWeekKey, appWeekKey, isSelectedWeekTheCurrentAppWeek, historicalAnalysis]);

  return (
    <div className="week-navigator-wrapper">
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
          <div 
            className={`week-navigator-arrow-container ${canGoPrevious ? 'enabled arrow-left' : 'disabled'}`}
            onClick={canGoPrevious ? goToPreviousWeek : undefined}
            title={canGoPrevious ? 'Previous Week' : `Already at oldest allowed week (${navigationLimits.adaptiveLimit} weeks back from current)`}
          >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`week-navigator-arrow arrow-left ${canGoPrevious ? 'enabled' : 'disabled'}`}
          >
            <path
              d="M20.3284 11.0001V13.0001L7.50011 13.0001L10.7426 16.2426L9.32842 17.6568L3.67157 12L9.32842 6.34314L10.7426 7.75735L7.49988 11.0001L20.3284 11.0001Z"
              fill="currentColor"
            />
          </svg>
        </div>

          <div className="week-navigator-center-content">
        {weekInfo.dateRange && (
          <div className="week-navigator-date-range">
            {weekInfo.dateRange.start.toLocaleDateString()} - {weekInfo.dateRange.end.toLocaleDateString()}
          </div>
        )}

            {/* Integrated action buttons */}
            <div className="week-navigator-integrated-buttons">
              <button
                onClick={goToCurrentAppWeek}
                className={`week-navigator-integrated-btn current-week-btn ${isSelectedWeekTheCurrentAppWeek ? 'hidden' : 'visible'}`}
                title="Jump to current application week"
                disabled={isSelectedWeekTheCurrentAppWeek}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
                Current
              </button>

              <button
                onClick={goToOldestOrFallback}
                className={`week-navigator-integrated-btn oldest-data-btn ${
                  (historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek && selectedWeekKey !== historicalAnalysis.oldestHistoricalWeek && !isSelectedWeekTheCurrentAppWeek) 
                    ? 'visible' 
                    : 'hidden'
                }`}
                title={`Jump to oldest recorded data (${historicalAnalysis?.oldestHistoricalWeek ? getWeekLabel(historicalAnalysis.oldestHistoricalWeek, appWeekKey) : 'oldest data'})`}
                disabled={!(historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek && selectedWeekKey !== historicalAnalysis.oldestHistoricalWeek && !isSelectedWeekTheCurrentAppWeek)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Oldest
              </button>
            </div>
          </div>

          <div 
            className={`week-navigator-arrow-container ${
              isSelectedWeekTheCurrentAppWeek 
                ? (canGoToOldest ? 'enabled arrow-right' : 'disabled') 
                : (canGoNext ? 'enabled arrow-right' : 'disabled')
            }`}
            onClick={isSelectedWeekTheCurrentAppWeek 
              ? (canGoToOldest ? goToOldestOrFallback : undefined) 
              : (canGoNext ? goToNextWeek : undefined)
            }
            title={isSelectedWeekTheCurrentAppWeek 
              ? (canGoToOldest 
                  ? (historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek 
                      ? `Jump to oldest data (${getWeekLabel(historicalAnalysis.oldestHistoricalWeek, appWeekKey)})` 
                      : `Jump to ${navigationLimits.adaptiveLimit} weeks back`)
                  : 'No older data available to jump to')
              : (canGoNext ? 'Next Week' : 'Already at current application week')
            }
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`week-navigator-arrow arrow-right ${
                isSelectedWeekTheCurrentAppWeek 
                  ? (canGoToOldest ? 'enabled' : 'disabled') 
                  : (canGoNext ? 'enabled' : 'disabled')
              }`}
          >
            <path
              d="M15.0378 6.34317L13.6269 7.76069L16.8972 11.0157L3.29211 11.0293L3.29413 13.0293L16.8619 13.0157L13.6467 16.2459L15.0643 17.6568L20.7079 11.9868L15.0378 6.34317Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

        {/* Floating action buttons for smaller screens */}
        {!isSelectedWeekTheCurrentAppWeek && (
          <div className="week-navigator-floating-actions week-navigator-floating-left">
            <button
              onClick={goToCurrentAppWeek}
              className="week-navigator-floating-btn"
              title="Jump to current week"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        )}

            {historicalAnalysis?.hasHistoricalData && historicalAnalysis?.oldestHistoricalWeek && selectedWeekKey !== historicalAnalysis.oldestHistoricalWeek && (
          <div className="week-navigator-floating-actions week-navigator-floating-right">
              <button
                onClick={goToOldestOrFallback}
              className="week-navigator-floating-btn"
              title={`Jump to oldest data (${getWeekLabel(historicalAnalysis.oldestHistoricalWeek, appWeekKey)})`}
              >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeekNavigator; 