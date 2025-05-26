import React from 'react';

function ModeIndicator({ isHistoricalWeek, isReadOnlyMode, readOnlyOverride, setReadOnlyOverride }) {
  if (!isHistoricalWeek) {
    return null;
  }

  return (
    <div className={`mode-indicator-container ${isReadOnlyMode ? 'read-only' : 'edit-mode'}`}>
      <div className="mode-indicator-content">
        <span className="mode-indicator-icon">
          {isReadOnlyMode ? '🔒' : '✏️'}
        </span>
        <div className="mode-indicator-text">
          <div className="mode-indicator-title">
            {isReadOnlyMode ? 'Read-Only Mode' : 'Edit Mode'}
          </div>
          <div className="mode-indicator-description">
            {isReadOnlyMode 
              ? 'Historical week data is protected from changes'
              : 'Editing enabled for historical week data'
            }
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        className={`mode-toggle-button ${isReadOnlyMode ? 'read-only' : 'edit-mode'}`}
        onClick={() => setReadOnlyOverride(!readOnlyOverride)}
        title={isReadOnlyMode 
          ? 'Enable editing for this historical week' 
          : 'Disable editing to protect historical data'
        }
      >
        <span className="mode-toggle-icon">
          {isReadOnlyMode ? '🔓' : '🔒'}
        </span>
        <span className="mode-toggle-text">
          {isReadOnlyMode ? 'Enable Edit' : 'Lock Data'}
        </span>
      </button>
    </div>
  );
}

export default ModeIndicator; 