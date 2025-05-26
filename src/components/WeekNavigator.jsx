import { useState, useEffect, useMemo } from 'react';
import { 
  getCurrentWeekKey, 
  getWeekKeyOffset, 
  getWeekLabel, 
  getWeekOffset,
  parseWeekKey,
  getWeekDateRange
} from '../utils/weekUtils';

function WeekNavigator({
  selectedWeekKey,
  onWeekChange,
  availableWeeks = [],
  isReadOnlyMode = false,
  isHistoricalWeek = false
}) {
  const currentWeekKey = getCurrentWeekKey();

  // Calculate navigation boundaries
  const navigationLimits = useMemo(() => {
    const currentOffset = 0;
    const maxFutureOffset = 4; // Up to 4 weeks ahead
    
    // Find oldest available week offset
    let minPastOffset = -52; // Default to 1 year back
    if (availableWeeks.length > 0) {
      const oldestWeek = availableWeeks[0];
      const oldestOffset = getWeekOffset(oldestWeek);
      minPastOffset = Math.min(oldestOffset, minPastOffset);
    }

    return {
      min: minPastOffset,
      max: maxFutureOffset,
      current: currentOffset
    };
  }, [availableWeeks]);

  // Current selected week offset from current week
  const selectedOffset = getWeekOffset(selectedWeekKey);
  
  // Navigation functions
  const goToWeek = (weekKey) => {
    if (weekKey === selectedWeekKey) return;
    onWeekChange(weekKey);
  };

  const goToPreviousWeek = () => {
    const newOffset = selectedOffset - 1;
    if (newOffset >= navigationLimits.min) {
      const newWeekKey = getWeekKeyOffset(newOffset);
      goToWeek(newWeekKey);
    }
  };

  const goToNextWeek = () => {
    const newOffset = selectedOffset + 1;
    if (newOffset <= navigationLimits.max) {
      const newWeekKey = getWeekKeyOffset(newOffset);
      goToWeek(newWeekKey);
    }
  };

  const goToCurrentWeek = () => {
    goToWeek(currentWeekKey);
  };

  const goToOldestWeek = () => {
    if (availableWeeks.length > 0) {
      goToWeek(availableWeeks[0]);
    }
  };

  // Check if navigation is possible
  const canGoPrevious = selectedOffset > navigationLimits.min;
  const canGoNext = selectedOffset < navigationLimits.max;
  const isCurrentWeek = selectedWeekKey === currentWeekKey;
  const hasOlderData = availableWeeks.length > 0 && availableWeeks[0] !== currentWeekKey;

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

  return (
    <div className="week-navigator-container" style={{
      background: 'linear-gradient(135deg, #3a2a5d, #28204a)',
      borderRadius: 12,
      padding: '1.5rem',
      margin: '0 auto 1.5rem auto',
      maxWidth: 700,
      boxShadow: '0 4px 16px rgba(40, 20, 60, 0.25)',
      border: '2px solid #805ad5',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Week display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: isCurrentWeek ? '#a259f7' : '#e6e0ff',
          marginBottom: '0.5rem',
          textShadow: isCurrentWeek ? '0 0 10px rgba(162, 89, 247, 0.5)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          {weekInfo.label.replace(/\s*\(Current\)/i, '')}
        </div>
        
        {/* Current week indicator */}
        {isCurrentWeek && (
          <div style={{
            fontSize: '0.9rem',
            color: '#a259f7',
            fontWeight: 600,
            marginBottom: '0.5rem',
            textShadow: '0 0 8px rgba(162, 89, 247, 0.4)',
            opacity: 0.9
          }}>
            (Current)
          </div>
        )}
        
        {/* Date range for non-current weeks only */}
        {weekInfo.dateRange && !isCurrentWeek && (
          <div style={{
            fontSize: '0.95rem',
            color: '#b39ddb',
            marginBottom: '0.5rem'
          }}>
            {weekInfo.dateRange.start.toLocaleDateString()} - {weekInfo.dateRange.end.toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Previous week SVG icon */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minWidth: 60
        }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={canGoPrevious ? goToPreviousWeek : undefined}
            className="nav-arrow-icon nav-arrow-left"
            style={{
              cursor: canGoPrevious ? 'pointer' : 'not-allowed',
              opacity: canGoPrevious ? 1 : 0.3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: canGoPrevious ? '#a259f7' : '#64748b',
              filter: canGoPrevious ? 'drop-shadow(0 2px 4px rgba(162, 89, 247, 0.3))' : 'none'
            }}
            title={canGoPrevious ? 'Previous Week' : 'Cannot go further back'}
            onMouseOver={e => {
              if (canGoPrevious) {
                e.currentTarget.style.transform = 'scale(1.2) translateX(-3px)';
                e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(162, 89, 247, 0.8))';
                e.currentTarget.style.color = '#c084fc';
              }
            }}
            onMouseOut={e => {
              if (canGoPrevious) {
                e.currentTarget.style.transform = 'scale(1) translateX(0)';
                e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(162, 89, 247, 0.3))';
                e.currentTarget.style.color = '#a259f7';
              }
            }}
          >
            <path
              d="M20.3284 11.0001V13.0001L7.50011 13.0001L10.7426 16.2426L9.32842 17.6568L3.67157 12L9.32842 6.34314L10.7426 7.75735L7.49988 11.0001L20.3284 11.0001Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Center content: date range for current week, buttons for others */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {isCurrentWeek && weekInfo.dateRange ? (
            // Date range for current week
            <div style={{
              fontSize: '0.9rem',
              color: '#b39ddb',
              fontWeight: 600,
              textAlign: 'center',
              opacity: 0.9
            }}>
              {weekInfo.dateRange.start.toLocaleDateString()} - {weekInfo.dateRange.end.toLocaleDateString()}
            </div>
          ) : (
            // Navigation buttons for other weeks
            <>
              {!isCurrentWeek && (
                <button
                  onClick={goToCurrentWeek}
                  style={{
                    background: 'linear-gradient(135deg, #a259f7, #805ad5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.5rem 1rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    boxShadow: '0 2px 8px rgba(162, 89, 247, 0.3)'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  title="Jump to current week"
                >
                  Current Week
                </button>
              )}

              {hasOlderData && (
                <button
                  onClick={goToOldestWeek}
                  style={{
                    background: '#3a335a',
                    color: '#e6e0ff',
                    border: '1px solid #805ad5',
                    borderRadius: 6,
                    padding: '0.5rem 1rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#4a4570';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#3a335a';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Jump to oldest data"
                >
                  Oldest Data
                </button>
              )}
            </>
          )}
        </div>

        {/* Next week SVG icon */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minWidth: 60
        }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={canGoNext ? goToNextWeek : undefined}
            className="nav-arrow-icon nav-arrow-right"
            style={{
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              opacity: canGoNext ? 1 : 0.3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: canGoNext ? '#a259f7' : '#64748b',
              filter: canGoNext ? 'drop-shadow(0 2px 4px rgba(162, 89, 247, 0.3))' : 'none'
            }}
            title={canGoNext ? 'Next Week' : 'Cannot go further forward (max +4 weeks)'}
            onMouseOver={e => {
              if (canGoNext) {
                e.currentTarget.style.transform = 'scale(1.2) translateX(3px)';
                e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(162, 89, 247, 0.8))';
                e.currentTarget.style.color = '#c084fc';
              }
            }}
            onMouseOut={e => {
              if (canGoNext) {
                e.currentTarget.style.transform = 'scale(1) translateX(0)';
                e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(162, 89, 247, 0.3))';
                e.currentTarget.style.color = '#a259f7';
              }
            }}
          >
            <path
              d="M15.0378 6.34317L13.6269 7.76069L16.8972 11.0157L3.29211 11.0293L3.29413 13.0293L16.8619 13.0157L13.6467 16.2459L15.0643 17.6568L20.7079 11.9868L15.0378 6.34317Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Week offset indicator */}
      {selectedOffset !== 0 && (
        <div style={{
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: '0.85rem',
          color: '#b39ddb',
          background: 'rgba(162, 89, 247, 0.1)',
          borderRadius: 6,
          padding: '0.4rem 0.8rem',
          display: 'block',
          width: '50%',
          margin: '1rem auto 0 auto'
        }}>
          {selectedOffset > 0 
            ? `${selectedOffset} week${selectedOffset === 1 ? '' : 's'} ahead`
            : `${Math.abs(selectedOffset)} week${Math.abs(selectedOffset) === 1 ? '' : 's'} ago`
          }
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        .week-navigator-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, 
            rgba(162, 89, 247, 0.08) 0%,
            rgba(128, 90, 213, 0.05) 25%,
            rgba(162, 89, 247, 0.03) 50%,
            rgba(128, 90, 213, 0.08) 100%
          );
          border-radius: 12px;
          opacity: 0.5;
          animation: smoothBreathe 6s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
        
        .week-navigator-container > * {
          position: relative;
          z-index: 2;
        }
        
        @keyframes smoothBreathe {
          0%, 100% {
            opacity: 0.3;
            background-position: 0% 0%;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            background-position: 100% 100%;
            transform: scale(1.02);
          }
        }
        
        .nav-arrow-icon {
          user-select: none;
          -webkit-user-select: none;
        }
        
        .nav-arrow-icon:active {
          transform: scale(0.95) !important;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 2px 4px rgba(162, 89, 247, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(162, 89, 247, 0.9));
          }
        }
        
        .nav-arrow-icon:focus {
          outline: none;
          animation: pulse-glow 1.5s infinite;
        }
      `}</style>
    </div>
  );
}

export default WeekNavigator; 