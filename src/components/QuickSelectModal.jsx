import { useState } from 'react';
import { getBossPrice } from '../../services/bossRegistryService';
import '../styles/components/quick-select-modal.css';

function QuickSelectModal({
  show,
  onClose,
  quickSelectBosses,
  quickSelectError,
  getSortedBossesByPrice,
  getBossDifficulties,
  formatPrice,
  handleQuickSelectBoss,
  updateQuickSelectPartySize,
  applyQuickSelection,
  resetQuickSelection,
  reuseLastQuickSelect,
  lastQuickSelectBosses,
  selectedCharIdx,
  characterBossSelections
}) {
  const [partySizeModal, setPartySizeModal] = useState({ show: false, boss: null, difficulty: null });

  if (!show) return null;

  const selectedCount = Object.keys(quickSelectBosses).length;
  const showInstantApply = selectedCount === 14;

  const handleInstantApply = () => {
    applyQuickSelection();
  };

  const handleContinueSelecting = () => {
    // Just close the instant apply popup, user can continue selecting
  };

  const handleDifficultySelect = (bossName, difficulty) => {
    handleQuickSelectBoss(bossName, difficulty);
  };

  const handlePartySizeIndicatorClick = (boss, difficulty) => {
    setPartySizeModal({ show: true, boss, difficulty });
  };

  const handlePartySizeSelect = (partySize) => {
    const { boss } = partySizeModal;
    updateQuickSelectPartySize(boss.name, partySize);
  };

  const handlePartySizeConfirm = () => {
    setPartySizeModal({ show: false, boss: null, difficulty: null });
  };

  const handlePartySizeCancel = () => {
    setPartySizeModal({ show: false, boss: null, difficulty: null });
  };

  const getAvailablePartySizes = (boss) => {
    // This would come from the boss data - for now return common party sizes
    return [1, 2, 3, 4, 5, 6];
  };

  const getBossPartySize = (bossName) => {
    return quickSelectBosses[bossName]?.partySize || 1;
  };

  const getSelectedDifficulty = (bossName) => {
    return quickSelectBosses[bossName]?.difficulty;
  };

  return (
    <>
      <div className="quick-select-overlay" onClick={onClose}>
        <div className="quick-select-modal" onClick={e => e.stopPropagation()}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="quick-select-close-btn"
            title="Close"
          >
            ×
          </button>

          {/* Header */}
          <div className="quick-select-header">
            <h1 className="quick-select-title">
              Quick Boss Selection
            </h1>

            <p className="quick-select-subtitle">
              Select up to 14 bosses • Click party size indicator to adjust
            </p>
          </div>

          {/* Selection Progress */}
          <div
            className="quick-select-progress"
            style={{ '--progress-width': `${(selectedCount / 14) * 100}%` }}
          >
            <div className="quick-select-progress-bar"></div>
            <div className="quick-select-progress-content">
              <div className={`quick-select-count ${selectedCount === 14 ? 'complete' : 'partial'}`}>
                {selectedCount}
              </div>
              <div className="quick-select-total">
                / 14
              </div>
            </div>
            <div className="quick-select-label">
              Bosses Selected
            </div>
          </div>

          {quickSelectError && (
            <div className="quick-select-error">
              {quickSelectError}
            </div>
          )}

          {/* Static Boss Cards */}
          <div className="quick-select-grid">
            {getSortedBossesByPrice().map((boss, index) => {
              const isSelected = !!quickSelectBosses[boss.name];
              const selectedDifficulty = getSelectedDifficulty(boss.name);
              const difficulties = getBossDifficulties(boss);
              const partySize = getBossPartySize(boss.name);
              
              // Sort difficulties by price (highest first)
              const sortedDifficulties = difficulties.sort((a, b) => {
                const priceA = getBossPrice(boss, a);
                const priceB = getBossPrice(boss, b);
                return priceB - priceA;
              });

              return (
                <div 
                  key={boss.name} 
                  className={`quick-select-boss-card ${isSelected ? 'selected' : 'unselected'}`}
                >
                  {/* Party Size Indicator - Replaces Rank Badge */}
                  {isSelected && (
                    <div 
                      className="quick-select-party-indicator"
                      onClick={() => handlePartySizeIndicatorClick(boss, selectedDifficulty)}
                      title={`Party Size: ${partySize}`}
                    >
                      {partySize}
                    </div>
                  )}

                  {/* Boss Info */}
                  <div className="quick-select-boss-info">
                    {boss.image && (
                      <div className="quick-select-boss-image">
                        <img
                          src={boss.image}
                          alt={boss.name}
                        />
                      </div>
                    )}
                    <div className="quick-select-boss-details">
                      <div className="quick-select-boss-name">
                        {boss.name}
                      </div>
                      <div className="quick-select-boss-price">
                        Max: {formatPrice(boss.maxPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Difficulty Selection */}
                  <div className="quick-select-difficulties">
                    <div className="quick-select-difficulty-label">
                      Choose Difficulty
                    </div>
                    <div className="quick-select-difficulty-inline">
                      {sortedDifficulties.map((difficulty, diffIndex) => {
                        const isThisDifficultySelected = selectedDifficulty === difficulty;
                        const price = getBossPrice(boss, difficulty);
                        const isMostExpensive = diffIndex === 0; // First item is most expensive

                        return (
                          <button
                            key={difficulty}
                            onClick={() => handleDifficultySelect(boss.name, difficulty)}
                            className={`quick-select-difficulty-option ${
                              isThisDifficultySelected ? 'selected' : ''
                            } ${isMostExpensive ? 'most-expensive' : ''}`}
                          >
                            <span className="difficulty-text">{difficulty}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="quick-select-actions">
            <button
              onClick={resetQuickSelection}
              className="quick-select-action-btn quick-select-clear-btn"
            >
              Clear All
            </button>
            <button
              onClick={reuseLastQuickSelect}
              disabled={Object.keys(lastQuickSelectBosses).length === 0}
              className={`quick-select-action-btn quick-select-reuse-btn ${
                Object.keys(lastQuickSelectBosses).length === 0 ? 'disabled' : 'enabled'
              }`}
              title="Reuse last quick select settings"
            >
              <svg 
                className="quick-select-reuse-icon" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                <path d="M15 4.5l.5-.5L16 3h-4v4l1-1"/>
                <path d="M12 8v4l3 3"/>
              </svg>
              Reuse Last
            </button>
            <button
              onClick={applyQuickSelection}
              disabled={selectedCount === 0 || selectedCharIdx === null}
              className={`quick-select-action-btn quick-select-apply-btn ${
                selectedCount === 0 || selectedCharIdx === null ? 'disabled' : 'enabled'
              }`}
            >
              Apply to {selectedCharIdx !== null && characterBossSelections[selectedCharIdx] ? characterBossSelections[selectedCharIdx].name : 'Character'}
            </button>
          </div>

          {selectedCharIdx === null && (
            <div className="quick-select-helper">
              Please select a character first to apply the boss selection
            </div>
          )}

          {/* Instant Apply Popup */}
          {showInstantApply && selectedCharIdx !== null && (
            <div className={`quick-select-instant-apply ${showInstantApply ? 'show' : ''}`}>
              <div className="quick-select-instant-apply-icon">
                🎉
              </div>
              <div className="quick-select-instant-apply-title">
                Perfect Selection!
              </div>
              <div className="quick-select-instant-apply-subtitle">
                You've selected 14 bosses - ready to apply?
              </div>
              <div className="quick-select-instant-apply-actions">
                <button 
                  onClick={handleInstantApply}
                  className="quick-select-instant-apply-btn primary"
                >
                  Apply Now
                </button>
                <button 
                  onClick={handleContinueSelecting}
                  className="quick-select-instant-apply-btn secondary"
                >
                  Keep Selecting
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Party Size Modal */}
      {partySizeModal.show && (
        <div className="party-size-modal-overlay" onClick={handlePartySizeCancel}>
          <div className="party-size-modal" onClick={e => e.stopPropagation()}>
            <div className="party-size-modal-title">
              Party Size
            </div>
            <div className="party-size-modal-subtitle">
              Select party size for {partySizeModal.boss?.name}
            </div>
            
            <div className="party-size-options">
              {getAvailablePartySizes(partySizeModal.boss).map((size) => (
                <button
                  key={size}
                  onClick={() => handlePartySizeSelect(size)}
                  className={`party-size-option ${
                    getBossPartySize(partySizeModal.boss?.name) === size ? 'selected' : ''
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="party-size-modal-actions">
              <button 
                onClick={handlePartySizeConfirm}
                className="party-size-modal-btn primary"
              >
                Confirm
              </button>
              <button 
                onClick={handlePartySizeCancel}
                className="party-size-modal-btn secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickSelectModal;