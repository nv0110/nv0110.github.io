import React from 'react';
import '../styles/confirmation-dialogs.css';

export function StatsResetConfirmDialog({ 
  showStatsResetConfirm, 
  setShowStatsResetConfirm, 
  onConfirm 
}) {
  if (!showStatsResetConfirm) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-container-small">
        <h3 className="stats-reset-title">Are you sure?</h3>
        <p className="stats-reset-message">This will permanently erase all stats. This cannot be undone.</p>
        <div className="stats-reset-buttons">
          <button
            onClick={() => setShowStatsResetConfirm(false)}
            className="stats-reset-button stats-reset-button-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="stats-reset-button stats-reset-button-confirm"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function CharacterPurgeDialog({ 
  showCharacterPurgeConfirm, 
  setShowCharacterPurgeConfirm, 
  purgeTargetCharacter, 
  purgeInProgress, 
  onConfirm 
}) {
  if (!showCharacterPurgeConfirm) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-container-medium character-purge-container">
        <div className="character-purge-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="character-purge-title">
          Purge Character Data
        </h2>
        <div className="character-purge-warning">
          <p className="character-purge-warning-title">
            <strong>This will permanently delete all pitched items and boss runs for:</strong>
          </p>
          <p className="character-purge-character-name">
            {purgeTargetCharacter?.name}
          </p>
          <p className="character-purge-warning-note">
            This action cannot be undone.
          </p>
        </div>
        <div className="character-purge-buttons">
          <button
            onClick={() => setShowCharacterPurgeConfirm(false)}
            disabled={purgeInProgress}
            className="character-purge-button character-purge-button-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={purgeInProgress}
            className="character-purge-button character-purge-button-confirm"
          >
            {purgeInProgress && (
              <div className="character-purge-spinner" />
            )}
            {purgeInProgress ? 'Purging...' : 'Purge Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SuccessDialog({ 
  resetSuccessVisible, 
  closeResetSuccess,
  purgeSuccess,
  setPurgeSuccess 
}) {
  if (!resetSuccessVisible && !purgeSuccess) return null;

  return (
    <div className="modal-backdrop modal-backdrop-high">
      <div 
        className="modal-container modal-container-small"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="success-title">
          {resetSuccessVisible ? 'Stats reset!' : 'Character purged!'}
        </h3>
        <p className="success-message">
          {resetSuccessVisible ? 'Your stats have been cleared.' : 'Character data has been purged.'}
        </p>
        <button
          onClick={resetSuccessVisible ? closeResetSuccess : () => setPurgeSuccess(false)}
          className="success-button"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function PitchedItemDetailsModal({
  showPitchedModal,
  setShowPitchedModal,
  pitchedModalItem,
  pitchedModalDetails
}) {
  if (!showPitchedModal || !pitchedModalItem) return null;

  return (
    <div className="pitched-details-modal-backdrop" onClick={() => setShowPitchedModal(false)} style={{ zIndex: 9999 }}>
      <div className="pitched-details-modal pitched-details-modal-visible" onClick={e => e.stopPropagation()}>
        <div className="pitched-details-modal-header">
          <button 
            className="pitched-details-modal-close"
            onClick={() => setShowPitchedModal(false)}
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z"
                fill="currentColor"
              />
            </svg>
          </button>
          
          <div className="pitched-details-modal-item-showcase">
            <img 
              src={pitchedModalItem.image} 
              alt={pitchedModalItem.name} 
              className="pitched-details-modal-item-img" 
            />
            <div className="pitched-details-modal-item-info">
              <h2 className="pitched-details-modal-title">{pitchedModalItem.name}</h2>
              <div className="pitched-details-modal-subtitle">
                <span className="pitched-details-modal-count">
                  {pitchedModalDetails.length}
                </span>
                <span className="pitched-details-modal-acquired">
                  {pitchedModalDetails.length === 1 ? 'time obtained' : 'times obtained'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pitched-details-modal-content">
          <div className="pitched-details-section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            <h3>Acquisition History</h3>
          </div>
          
          <div className="pitched-details-acquisition">
            {pitchedModalDetails.length === 0 ? (
              <div className="empty-state">
                None this year.
              </div>
            ) : (
              <div className="pitched-details-table-container">
                <table className="pitched-details-table">
                  <thead>
                    <tr>
                      <th>Character</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pitchedModalDetails.map((detail, i) => (
                      <tr key={i} className={`pitched-details-row ${i % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                        <td>{detail.char}</td>
                        <td>
                          <span className="date-value">{detail.date}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 