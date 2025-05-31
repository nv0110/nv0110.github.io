import React from 'react';
import './CrystalTracker.css';

function CrystalTracker({ characterBossSelections }) {
  // Calculate total crystals from all characters
  const totalCrystals = characterBossSelections?.reduce((total, char) => {
    return total + (char.bosses?.length || 0);
  }, 0) || 0;

  const maxCrystals = 180;
  const progressPercentage = Math.min((totalCrystals / maxCrystals) * 100, 100);

  return (
    <div className="crystal-tracker" style={{'--progress-width': `${progressPercentage}%`}}>
      <div className="crystal-tracker-content">
        <div className="crystal-tracker-numbers">
          <span className="crystal-current">{totalCrystals}</span>
          <span className="crystal-separator">/</span>
          <span className="crystal-max">{maxCrystals}</span>
        </div>
        <div className="crystal-tracker-label">Crystals</div>
        <div className="crystal-progress-indicator">
          <div 
            className="crystal-progress-fill" 
            style={{height: `${progressPercentage}%`}}
          />
        </div>
      </div>
    </div>
  );
}

export default CrystalTracker; 