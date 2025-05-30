import React from 'react';
import '../styles/confirmation-dialogs.css';

function StatsModal({
  showStats,
  setShowStats,
  allYears,
  selectedYear,
  setSelectedYear,
  groupedYearlyPitchedItems,
  isLoadingCloudStats,
  setShowStatsResetConfirm,
  handleItemDetailClick
}) {
  if (!showStats) return null;

  const totalItems = groupedYearlyPitchedItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="modal-backdrop stats-modal-backdrop" onClick={() => setShowStats(false)}>
      <div className="modern-stats-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modern-stats-header">
          <div className="modern-stats-title-section">
            <h2 className="modern-stats-title">Pitched Items Statistics</h2>
            <div className="modern-stats-subtitle">{selectedYear}</div>
          </div>
          <button 
            onClick={() => setShowStats(false)} 
            className="modern-stats-close"
            title="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Year Selector */}
        <div className="modern-stats-controls">
          <div className="modern-year-selector">
            <label className="modern-year-label">Year:</label>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)} 
              className="modern-year-select"
            >
              {allYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          {/* Summary Stats */}
          <div className="modern-stats-summary">
            <div className="modern-stat-card">
              <div className="modern-stat-number">{groupedYearlyPitchedItems.length}</div>
              <div className="modern-stat-label">Unique Items</div>
            </div>
            <div className="modern-stat-card">
              <div className="modern-stat-number">{totalItems}</div>
              <div className="modern-stat-label">Total Obtained</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="modern-stats-content">
          {isLoadingCloudStats ? (
            <div className="modern-stats-loading">
              <div className="modern-loading-spinner"></div>
              <span>Loading statistics...</span>
            </div>
          ) : groupedYearlyPitchedItems.length === 0 ? (
            <div className="modern-stats-empty">
              <div className="modern-empty-icon">📊</div>
              <div className="modern-empty-title">No Data Yet</div>
              <div className="modern-empty-text">
                Start clearing bosses to see your pitched item statistics!
              </div>
            </div>
          ) : (
            <div className="modern-items-grid">
              {groupedYearlyPitchedItems.map((itemGroup, index) => (
                <div
                  key={`${itemGroup.itemName}-${index}`}
                  className="modern-item-card"
                  onClick={() => handleItemDetailClick(itemGroup)}
                >
                  <div className="modern-item-image-container">
                    <img 
                      src={itemGroup.itemImage} 
                      alt={itemGroup.itemName} 
                      className="modern-item-image" 
                    />
                    <div className="modern-item-count-badge">
                      {itemGroup.count}
                    </div>
                  </div>
                  
                  <div className="modern-item-info">
                    <div className="modern-item-name">{itemGroup.itemName}</div>
                    <div className="modern-item-meta">
                      {itemGroup.count === 1 ? '1 time' : `${itemGroup.count} times`}
                    </div>
                  </div>
                  
                  <div className="modern-item-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modern-stats-footer">
          <button
            className="modern-reset-button"
            onClick={() => setShowStatsResetConfirm(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2"/>
            </svg>
            Reset All Statistics
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatsModal; 