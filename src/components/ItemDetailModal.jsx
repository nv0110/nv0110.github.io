import React from 'react';
import '../styles/confirmation-dialogs.css';

function ItemDetailModal({
  showItemDetailModal,
  setShowItemDetailModal,
  selectedItemDetail
}) {
  if (!showItemDetailModal || !selectedItemDetail) return null;

  const { itemName, itemImage, count, instances } = selectedItemDetail;

  // Group instances by character
  const instancesByCharacter = instances.reduce((acc, instance) => {
    if (!acc[instance.charId]) {
      acc[instance.charId] = [];
    }
    acc[instance.charId].push(instance);
    return acc;
  }, {});

  const characterNames = Object.keys(instancesByCharacter).sort();

  return (
    <div className="modal-backdrop item-detail-backdrop" onClick={() => setShowItemDetailModal(false)}>
      <div className="modern-item-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modern-item-detail-header">
          <div className="modern-item-detail-title-section">
            <div className="modern-item-detail-icon">
              <img 
                src={itemImage} 
                alt={itemName} 
                className="modern-item-detail-image" 
              />
            </div>
            <div>
              <h3 className="modern-item-detail-title">{itemName}</h3>
              <div className="modern-item-detail-subtitle">
                Obtained {count} time{count !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowItemDetailModal(false)} 
            className="modern-item-detail-close"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="modern-item-detail-content">
          {characterNames.map(character => (
            <div key={character} className="modern-character-section">
              <div className="modern-character-header">
                <div className="modern-character-name">{character}</div>
                <div className="modern-character-count">
                  {instancesByCharacter[character].length} time{instancesByCharacter[character].length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="modern-dates-grid">
                {instancesByCharacter[character].map((instance, index) => (
                  <div key={`${character}-${instance.fullDate}-${index}`} className="modern-date-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="modern-date-icon">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {instance.displayDate}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="modern-item-detail-footer">
          <div className="modern-detail-stats">
            <div className="modern-detail-stat">
              <span className="modern-detail-stat-number">{characterNames.length}</span>
              <span className="modern-detail-stat-label">
                Character{characterNames.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="modern-detail-stat">
              <span className="modern-detail-stat-number">{count}</span>
              <span className="modern-detail-stat-label">
                Total Drop{count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailModal; 