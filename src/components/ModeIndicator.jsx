import React from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';

function ModeIndicator({ selectedWeekKey }) {
  // Helper function to determine color scheme based on week
  const getWeekColorScheme = (weekKey) => {
    if (!weekKey) return 'green';
    
    // Parse week key to get week number
    const parts = weekKey.split('-');
    let weekNumber = 0;
    
    if (parts.length === 3) {
      // Format: YYYY-MW-CW, use MapleStory week
      weekNumber = parseInt(parts[1]) || 0;
    } else if (parts.length === 2) {
      // Legacy format: YYYY-WW
      weekNumber = parseInt(parts[1]) || 0;
    }
    
    // Alternate colors based on week number (even = green, odd = red)
    return weekNumber % 2 === 0 ? 'green' : 'red';
  };

  const colorScheme = getWeekColorScheme(selectedWeekKey);
  const currentWeekKey = getCurrentWeekKey();
  const isCurrentWeek = selectedWeekKey === currentWeekKey;

  return (
    <div className={`mode-indicator-container ${colorScheme}`}>
      <div className="mode-indicator-content">
        <span className="mode-indicator-icon">
          {colorScheme === 'green' ? '🎯' : '🎯'}
        </span>
        <div className="mode-indicator-text">
          <div className="mode-indicator-title">
            {isCurrentWeek ? 'Track Your Pitched Items' : 'Past Week Review'}
          </div>
          <div className="mode-indicator-description">
            {isCurrentWeek 
              ? 'Click on item icons below to track rare boss drops as you get them'
              : 'Click items to mark what you pitched that week'
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModeIndicator; 