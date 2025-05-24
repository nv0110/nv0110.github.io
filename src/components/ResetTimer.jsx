import React from 'react';

function ResetTimer({ timeUntilReset, selectedWeekKey, currentWeekKey }) {
  // Only show for current week
  if (selectedWeekKey !== currentWeekKey) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 120, // Moved down to account for navbar
      right: 20, 
      zIndex: 150,
      background: 'linear-gradient(135deg, #3a2a5d, #28204a)', 
      borderRadius: 10, 
      padding: '0.8rem 1rem', 
      boxShadow: '0 4px 16px rgba(40, 20, 60, 0.3)',
      textAlign: 'center',
      border: '1px solid #4a4570',
      minWidth: 180
    }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, marginBottom: 6, color: '#b39ddb' }}>
        Next Reset
      </div>
      <div style={{ 
        fontSize: '1.1rem', 
        fontFamily: 'monospace', 
        fontWeight: 600, 
        display: 'flex',
        justifyContent: 'center',
        gap: '0.3rem',
        color: '#e6e0ff'
      }}>
        <span>{timeUntilReset.days}d</span>
        <span>{timeUntilReset.hours}h</span>
        <span>{timeUntilReset.minutes}m</span>
      </div>
      <div style={{ fontSize: '0.7rem', marginTop: '0.3rem', color: '#9f7aea' }}>
        Thursday 00:00 UTC
      </div>
    </div>
  );
}

export default ResetTimer; 