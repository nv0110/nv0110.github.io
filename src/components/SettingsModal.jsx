import React from 'react';
import '../styles/components/settings-modal.css';

function SettingsModal({
  show,
  onClose,
  onExport,
  onImport,
  onShowDeleteConfirm,
  fileInputRef
}) {
  if (!show) return null;

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal-content" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Account Settings</h2>
          <button className="settings-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="settings-modal-section">
          <h3>Data Management</h3>
          <div className="settings-button-group">
            <button className="settings-button backup" onClick={onExport}>
              <svg className="settings-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="currentColor"/>
              </svg>
              <div className="settings-button-text">
                <span className="primary">Backup Data</span>
                <span className="secondary">Export your character data</span>
              </div>
            </button>

            <button className="settings-button restore" onClick={() => fileInputRef.current?.click()}>
              <svg className="settings-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 20H19V18H5V20ZM19 9H15V3H9V9H5L12 16L19 9Z" fill="currentColor"/>
              </svg>
              <div className="settings-button-text">
                <span className="primary">Restore Data</span>
                <span className="secondary">Import from backup file</span>
              </div>
            </button>
          </div>
        </div>

        <div className="settings-modal-section danger">
          <h3>Danger Zone</h3>
          <button className="settings-button delete" onClick={onShowDeleteConfirm}>
            <svg className="settings-button-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="settings-button-text">
              <span className="primary">Delete Account</span>
              <span className="secondary">Permanently remove all data</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal; 