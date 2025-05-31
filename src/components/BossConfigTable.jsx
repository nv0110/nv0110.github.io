import React, { useState } from 'react';
import CustomCheckbox from './CustomCheckbox';
import QuickSelectButton from './QuickSelectButton';
import { logger } from '../utils/logger';
import '../styles/components/boss-config-table.css';

function BossConfigTable({
  // Core data
  characterBossSelections = [],
  selectedCharIdx = 0,
  sortedBossData = [],
  
  // Boss operations
  toggleBoss = () => {},
  updatePartySize = () => {},
  
  // Quick select
  onQuickSelectClick = () => {},
  
  // Utilities
  getBossDifficulties = () => [],
  getAvailablePartySizes = () => [1, 2, 3, 4, 5, 6],
  formatPrice = (price) => price.toLocaleString()
}) {
  const [expandedRows, setExpandedRows] = useState({});

  // Get current character data
  const selectedCharacter = characterBossSelections[selectedCharIdx];
  const characterBosses = selectedCharacter?.bosses || [];

  // Helper to check if boss is selected for current character
  const isBossSelected = (bossName) => {
    return characterBosses.some(b => b.name === bossName);
  };

  // Helper to get selected boss data for current character
  const getSelectedBoss = (bossName) => {
    return characterBosses.find(b => b.name === bossName);
  };

  // Handle boss selection toggle
  const handleBossToggle = async (bossName, checked) => {
    if (checked) {
      // If checking, we need to select a difficulty first
      const bossData = sortedBossData.find(b => b.name === bossName);
      if (bossData && bossData.difficulties.length > 0) {
        // Select highest price difficulty by default
        const sortedDifficulties = getBossDifficulties(bossData).sort((a, b) => {
          const diffA = bossData.difficulties.find(d => d.difficulty === a);
          const diffB = bossData.difficulties.find(d => d.difficulty === b);
          return (diffB?.price || 0) - (diffA?.price || 0);
        });
        const defaultDifficulty = sortedDifficulties[0];
        await toggleBoss(selectedCharIdx, bossName, defaultDifficulty);
      }
    } else {
      // If unchecking, remove the boss
      await toggleBoss(selectedCharIdx, bossName, null);
    }
  };

  // Handle difficulty change
  const handleDifficultyChange = async (bossName, difficulty) => {
    await toggleBoss(selectedCharIdx, bossName, difficulty);
  };

  // Handle party size change
  const handlePartySizeChange = async (bossName, partySize) => {
    const selectedBoss = getSelectedBoss(bossName);
    const difficulty = selectedBoss?.difficulty;
    if (difficulty) {
      await updatePartySize(selectedCharIdx, bossName, difficulty, parseInt(partySize));
    }
  };

  // Toggle row expansion for mobile
  const toggleRowExpansion = (bossName) => {
    setExpandedRows(prev => ({
      ...prev,
      [bossName]: !prev[bossName]
    }));
  };

  // Get boss price for selected difficulty
  const getBossPrice = (bossName, difficulty) => {
    const bossData = sortedBossData.find(b => b.name === bossName);
    if (!bossData) return 0;
    
    const difficultyData = bossData.difficulties.find(d => d.difficulty === difficulty);
    return difficultyData?.price || 0;
  };

  // Get formatted mesos considering party size
  const getFormattedMesos = (bossName, difficulty, partySize = 1) => {
    const basePrice = getBossPrice(bossName, difficulty);
    const adjustedPrice = Math.ceil(basePrice / partySize);
    return formatPrice(adjustedPrice);
  };

  if (!selectedCharacter) {
    return (
      <div className="boss-config-table-container">
        <div className="boss-config-empty">
          <p>Please select a character to configure bosses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="boss-config-table-container">
      <div className="boss-config-table-grid">
        {/* Table Header */}
        <div className="boss-config-header">
          <div className="header-boss">Boss</div>
          <div className="header-difficulty">Difficulty</div>
          <div className="header-mesos">Mesos</div>
          <div className="header-config">
            <QuickSelectButton 
              onClick={onQuickSelectClick}
              selectedCharacter={selectedCharacter}
            />
          </div>
        </div>

        {/* Boss Rows */}
        {sortedBossData.map((boss, index) => {
          const isSelected = isBossSelected(boss.name);
          const selectedBoss = getSelectedBoss(boss.name);
          const selectedDifficulty = selectedBoss?.difficulty || '';
          const selectedPartySize = selectedBoss?.partySize || 1;
          const isExpanded = expandedRows[boss.name];

          const difficulties = getBossDifficulties(boss);
          const availablePartySizes = getAvailablePartySizes(boss.name, selectedDifficulty);

          return (
            <div 
              key={boss.name} 
              className={`boss-config-row ${index % 2 === 0 ? 'even' : 'odd'} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleBossToggle(boss.name, !isSelected)}
              style={{ cursor: 'pointer' }}
            >
              {/* Boss Cell */}
              <div className="cell-boss">
                <div className="boss-info-section">
                  {boss.image && (
                    <img 
                      alt={boss.name} 
                      className="boss-image" 
                      src={boss.image}
                    />
                  )}
                  <div className="boss-details">
                    <span className="boss-name">{boss.name}</span>
                  </div>
                </div>
                
                {/* Mobile expand button */}
                <button 
                  className="boss-config-expand-btn mobile-only"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpansion(boss.name);
                  }}
                  aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                >
                  <svg 
                    className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <path 
                      d="M6 9l6 6 6-6" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Difficulty Cell */}
              <div className={`cell-difficulty ${isExpanded ? 'expanded' : ''}`}>
                {isSelected ? (
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => handleDifficultyChange(boss.name, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="difficulty-dropdown"
                    disabled={!isSelected}
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="difficulty-placeholder">-</span>
                )}
              </div>

              {/* Mesos Cell */}
              <div className={`cell-mesos ${isExpanded ? 'expanded' : ''}`}>
                {isSelected && selectedDifficulty ? (
                  <span className="mesos-amount">
                    {getFormattedMesos(boss.name, selectedDifficulty, selectedPartySize)}
                  </span>
                ) : (
                  <span className="mesos-placeholder">-</span>
                )}
              </div>

              {/* Config Cell */}
              <div className={`cell-config ${isExpanded ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="config-controls">
                  {/* Boss Selection Checkbox */}
                  <CustomCheckbox
                    checked={isSelected}
                    onChange={(e) => handleBossToggle(boss.name, e.target.checked)}
                  />

                  {/* Party Size Dropdown */}
                  {isSelected && (
                    <select
                      value={selectedPartySize}
                      onChange={(e) => handlePartySizeChange(boss.name, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="party-size-dropdown"
                      title={`Party Size: ${selectedPartySize}`}
                    >
                      {availablePartySizes.map(size => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BossConfigTable; 