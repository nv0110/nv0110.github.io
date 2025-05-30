import React from 'react';
import { Tooltip } from './Tooltip';

function ActionButtons({ 
  onExport, 
  onImport, 
  onShowQuickSelect, 
  fileInputRef 
}) {
  return (
    <div className="action-buttons-container">
      {/* Primary Actions */}
      <button 
        className="action-button-primary"
        onClick={onShowQuickSelect}
      >
        <svg className="action-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
        </svg>
        Quick Select
      </button>

      {/* Secondary Actions */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          className="action-button-secondary"
          onClick={onExport}
        >
          <svg className="action-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="currentColor"/>
          </svg>
          Backup Data
        </button>

        <button 
          className="action-button-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg className="action-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 20H19V18H5V20ZM19 9H15V3H9V9H5L12 16L19 9Z" fill="currentColor"/>
          </svg>
          Restore Backup
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={onImport}
        accept=".json"
      />
    </div>
  );
}

export default ActionButtons; 