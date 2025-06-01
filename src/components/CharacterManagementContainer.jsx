import React from 'react';
import CharacterDropdown from './CharacterDropdown';
import CharacterCreator from './CharacterCreator';
import CrystalTracker from './CrystalTracker';
import BossConfigTable from './BossConfigTable';
import { logger } from '../utils/logger';
import '../styles/components/character-management-container.css';

function CharacterManagementContainer({
  // Character data
  characterBossSelections = [],
  selectedCharIdx = 0,
  newCharName = '',
  
  // Character operations
  handleCharacterChange = () => {},
  addCharacter = () => {},
  removeCharacter = () => {},
  setNewCharName = () => {},
  updateCharacterName = () => {},
  
  // Boss data and operations
  sortedBossData = [],
  toggleBoss = () => {},
  updatePartySize = () => {},
  
  // Quick select
  onQuickSelectClick = () => {},
  
  // Utilities
  getBossDifficulties = () => [],
  getAvailablePartySizes = () => [1, 2, 3, 4, 5, 6],
  formatPrice = (price) => price.toLocaleString(),
  
  // Crystal tracking
  totalBossCount = 0,
  
  // Validation and errors
  cloneError = '',
  showCrystalCapError = false,
  
  // Character copy functionality
  onCopyCharacter = () => {}
}) {
  
  const selectedCharacter = characterBossSelections[selectedCharIdx];
  
  return (
    <div className="character-management-container">
      {/* Integrated Container - Header merged with Table */}
      <div className="integrated-boss-config-container">
        {/* Character Management Controls */}
        <div className="character-controls-header">
          <div className="character-controls-section">
            <div className="character-selector-group">
              <div className="character-dropdown-wrapper">
                <CharacterDropdown
                  characterBossSelections={characterBossSelections}
                  selectedCharIdx={selectedCharIdx}
                  onCharacterChange={handleCharacterChange}
                  onRemoveCharacter={removeCharacter}
                  onCopyCharacter={onCopyCharacter}
                  onEditCharacterName={updateCharacterName}
                />
              </div>
              
              <div className="character-creator-wrapper">
                <CharacterCreator
                  newCharName={newCharName}
                  setNewCharName={setNewCharName}
                  onAddCharacter={addCharacter}
                  characterBossSelections={characterBossSelections}
                />
              </div>
            </div>
            
            <div className="crystal-tracker-wrapper">
              <CrystalTracker
                characterBossSelections={characterBossSelections}
              />
            </div>
          </div>
          
          {/* Error Messages */}
          {cloneError && (
            <div className="character-management-error">
              {cloneError}
            </div>
          )}
        </div>

        {/* Boss Configuration Table */}
        {characterBossSelections.length === 0 ? (
          <div className="no-characters-message">
            <div className="no-characters-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" 
                  stroke="currentColor" 
                  strokeWidth="2"
                />
                <path 
                  d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" 
                  stroke="currentColor" 
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h3>No Characters Yet</h3>
            <p>Create your first character to start configuring bosses and tracking your weekly progress.</p>
          </div>
        ) : selectedCharIdx === '' || !selectedCharacter ? (
          <div className="select-character-message">
            <div className="select-character-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Select a Character</h3>
            <p>Choose a character from the dropdown above to configure their boss selection.</p>
          </div>
        ) : (
          <BossConfigTable
            characterBossSelections={characterBossSelections}
            selectedCharIdx={selectedCharIdx}
            sortedBossData={sortedBossData}
            toggleBoss={toggleBoss}
            updatePartySize={updatePartySize}
            onQuickSelectClick={onQuickSelectClick}
            getBossDifficulties={getBossDifficulties}
            getAvailablePartySizes={getAvailablePartySizes}
            formatPrice={formatPrice}
          />
        )}
      </div>
      
      {/* Crystal Cap Error Overlay */}
      {showCrystalCapError && (
        <div className="crystal-cap-error-overlay">
          <div className="crystal-cap-error-message">
            Crystal limit reached! Maximum 180 crystals allowed.
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterManagementContainer; 