import React from 'react';

/**
 * Common page-level modals used across different pages
 * Consolidated for better code organization and reusability
 */

export function HelpModal({ showHelp, onClose, children }) {
  if (!showHelp) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-fade modal-content"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="modal-close-btn"
          title="Close"
        >
          ×
        </button>
        <h2 className="modal-title">Help & FAQ</h2>
        {children}
      </div>
    </div>
  );
}

// Default Weekly Tracker help content
export function WeeklyTrackerHelpContent() {
  return (
    <>
      <div className="modal-section-content" style={{ marginBottom: 24 }}>
        <h3 className="modal-section-title">Weekly Tracking</h3>
        <p>Track your boss completions and see your weekly mesos progress</p>
        <p>Check off bosses as you complete them throughout the week</p>
        <p>Click on pitched item icons to track rare drops from bosses</p>
      </div>

      <div className="modal-section-content" style={{ marginBottom: 24 }}>
        <h3 className="modal-section-title">Pitched Items & Stats</h3>
        <p>• <strong>Pitched tracking:</strong> Click item icons to track rare boss drops</p>
        <p>• <strong>Historical data:</strong> Navigate between weeks to view past progress</p>
        <p>• <strong>Stats overview:</strong> View detailed statistics of all your pitched items</p>
        <p>• <strong>Character management:</strong> Purge data for specific characters if needed</p>
      </div>

      <div className="modal-section-content" style={{ marginBottom: 24 }}>
        <h3 className="modal-section-title">Week Navigation</h3>
        <p>• <strong>Current week:</strong> Full editing capabilities for this week's progress</p>
        <p>• <strong>Historical weeks:</strong> View-only mode for past weeks (toggle edit mode if needed)</p>
        <p>• <strong>Smart navigation:</strong> Only shows weeks where you have data</p>
      </div>

      <div className="modal-section-content">
        <h3 className="modal-section-title">Quick Tips</h3>
        <p>• Use "Tick All" to quickly mark all bosses completed for a character</p>
        <p>• Hide completed characters to focus on remaining work</p>
        <p>• Weekly reset happens every Thursday at 00:00 UTC</p>
        <p>• Pitched items are automatically linked to boss completions</p>
      </div>
    </>
  );
}

// Boss Table help content
export function BossTableHelpContent() {
  return (
    <>
      <div className="modal-section-content" style={{ marginBottom: 24 }}>
        <h3 className="modal-section-title">Boss Crystal Values</h3>
        <p>All bosses and difficulties sorted by crystal value (highest to lowest)</p>
        <p>Use this reference to plan your weekly boss priorities</p>
        <p>Values shown are for solo runs - adjust for your party size</p>
      </div>

      <div className="modal-section-content" style={{ marginBottom: 24 }}>
        <h3 className="modal-section-title">Planning Your Week</h3>
        <p>• <strong>Prioritize high-value bosses:</strong> Focus on the top of the list for maximum mesos</p>
        <p>• <strong>Consider time investment:</strong> Some bosses take longer but give more mesos</p>
        <p>• <strong>Difficulty scaling:</strong> Higher difficulties = more mesos + pitched items</p>
      </div>

      <div className="modal-section-content">
        <h3 className="modal-section-title">Quick Tips</h3>
        <p>• Use this table when setting up characters in the Calculator</p>
        <p>• Remember that party size divides the mesos shown</p>
        <p>• Higher difficulties also unlock pitched item tracking</p>
        <p>• Weekly reset happens every Thursday at 00:00 UTC</p>
      </div>
    </>
  );
}

export function DeleteAccountModal({ 
  showDeleteConfirm, 
  onClose, 
  onConfirm, 
  showDeleteLoading, 
  deleteError 
}) {
  if (!showDeleteConfirm) return null;

  return (
    <div className="modal-backdrop modal-backdrop-critical" onClick={onClose}>
      <div className="modal-fade modal-content-critical" onClick={e => e.stopPropagation()}>
        <div className="critical-modal-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="critical-modal-title">Delete Account</h2>
        <div className="critical-modal-warning">
          <p>
            <strong>This will permanently delete your account and all associated data.</strong>
            <br />
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-button-container">
          <button
            onClick={onClose}
            disabled={showDeleteLoading}
            className="modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={showDeleteLoading}
            className="modal-btn-critical"
          >
            {showDeleteLoading && (
              <div className="loading-spinner" />
            )}
            {showDeleteLoading ? 'Deleting...' : 'Delete Forever'}
          </button>
        </div>
        {deleteError && (
          <div className="modal-error-message">
            {deleteError}
          </div>
        )}
      </div>
    </div>
  );
}