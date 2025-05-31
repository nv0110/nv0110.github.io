import React, { useState, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';
import './CharacterDropdown.css';

function CharacterDropdown({
  characterBossSelections,
  selectedCharIdx,
  onCharacterChange,
  onRemoveCharacter,
  onCopyCharacter
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isModalOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isModalOpen]);

  const handleCharacterSelect = (idx) => {
    onCharacterChange({ target: { value: idx } });
    setIsModalOpen(false);
  };

  const handleDeleteClick = (e, idx) => {
    e.stopPropagation();
    logger.info('Deleting character:', characterBossSelections[idx]?.name);
    onRemoveCharacter(idx);
  };

  const handleCopyCharacter = async () => {
    if (isCopying || !characterBossSelections[selectedCharIdx]) return;
    
    setIsCopying(true);
    
    try {
      const originalName = characterBossSelections[selectedCharIdx].name;
      
      // Find the next available number for naming
      const existingNames = characterBossSelections.map(char => char.name);
      let copyNumber = 1;
      let newName = `${originalName}-${copyNumber}`;
      
      while (existingNames.includes(newName)) {
        copyNumber++;
        newName = `${originalName}-${copyNumber}`;
      }
      
      // Call the copy function passed from parent
      const result = await onCopyCharacter(selectedCharIdx, newName);
      
      if (!result.success) {
        logger.error('Failed to copy character:', result.error);
      }
      
    } catch (error) {
      logger.error('Error copying character:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const selectedCharacter = characterBossSelections[selectedCharIdx];
  const displayText = selectedCharacter ? selectedCharacter.name : 'Select Character...';
  const canCopy = selectedCharacter && !isCopying;

  return (
    <div className="character-dropdown-with-copy">
      <div className="character-dropdown-container">
        <button
          type="button"
          className="character-dropdown-trigger"
          onClick={() => setIsModalOpen(true)}
          aria-expanded={isModalOpen}
          aria-haspopup="dialog"
        >
          <span className="character-dropdown-text">{displayText}</span>
          <svg 
            className="character-dropdown-arrow"
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

      {/* Character Selection Modal */}
      {isModalOpen && (
        <div className="character-modal-backdrop">
          <div className="character-modal-content" ref={modalRef}>
            <div className="character-modal-header">
              <h3>Select Character</h3>
              <button
                type="button"
                className="character-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="character-modal-body">
              <div
                className="character-modal-option placeholder"
                onClick={() => handleCharacterSelect('')}
              >
                <span className="character-modal-name">Select Character...</span>
              </div>
              
              {characterBossSelections.map((char, idx) => (
                <div
                  key={char.name + idx}
                  className={`character-modal-option ${selectedCharIdx === idx ? 'selected' : ''}`}
                  onClick={() => handleCharacterSelect(idx)}
                >
                  <div className="character-modal-info">
                    <span className="character-modal-name">{char.name}</span>
                    <span className="character-modal-bosses">
                      {char.bosses?.length || 0} bosses configured
                    </span>
                  </div>
                  
                  <div className="character-modal-actions">
                    <button
                      type="button"
                      className="character-modal-btn delete"
                      onClick={(e) => handleDeleteClick(e, idx)}
                      title="Delete character"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              
              {characterBossSelections.length === 0 && (
                <div className="character-modal-empty">
                  <p>No characters created yet.</p>
                  <p>Use the character creator to add your first character!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copy Character Button */}
      <button
        type="button"
        className={`character-copy-btn ${canCopy ? 'enabled' : 'disabled'}`}
        onClick={handleCopyCharacter}
        disabled={!canCopy}
        title={canCopy ? `Copy ${selectedCharacter.name}` : 'Select a character to copy'}
      >
        {isCopying ? (
          <div className="character-copy-spinner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeDasharray="40" 
                strokeDashoffset="20"
                className="copy-spinner-circle"
              />
            </svg>
          </div>
        ) : (
          <svg 
            className="character-copy-icon" 
            width="16" 
            height="16" 
            viewBox="0 0 352.804 352.804" 
            fill="currentColor"
          >
            <path d="M318.54,57.282h-47.652V15c0-8.284-6.716-15-15-15H34.264c-8.284,0-15,6.716-15,15v265.522c0,8.284,6.716,15,15,15h47.651
            v42.281c0,8.284,6.716,15,15,15H318.54c8.284,0,15-6.716,15-15V72.282C333.54,63.998,326.824,57.282,318.54,57.282z
             M49.264,265.522V30h191.623v27.282H96.916c-8.284,0-15,6.716-15,15v193.24H49.264z M303.54,322.804H111.916V87.282H303.54V322.804
            z"/>
          </svg>
        )}
      </button>
    </div>
  );
}

export default CharacterDropdown; 