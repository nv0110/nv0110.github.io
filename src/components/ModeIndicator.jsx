import React from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';

function ModeIndicator({ selectedWeekKey, showTickAll, onTickAll, allTicked }) {
  const currentWeekKey = getCurrentWeekKey();
  const isCurrentWeek = selectedWeekKey === currentWeekKey;

  return (
    <div className="mode-indicator-container purple">
      <div className="mode-indicator-content">
        <div className="mode-indicator-text">
          <div className="mode-indicator-title">
            {isCurrentWeek ? 'Active Week Tracking' : 'Historical Week Review'}
          </div>
          <div className="mode-indicator-description">
            {isCurrentWeek
              ? 'Track your boss clears and pitched item  for the current week'
              : 'Track you pitched items you have collected this week'
            }
          </div>
        </div>
      </div>
      {showTickAll && isCurrentWeek && (
        <button
          onClick={onTickAll}
          className="mode-indicator-tick-all-button"
          title={allTicked ? "Clear all boss completions" : "Mark all bosses as completed"}
        >
          {allTicked ? 'Clear All' : 'Complete All'}
        </button>
      )}
    </div>
  );
}

export default ModeIndicator; 