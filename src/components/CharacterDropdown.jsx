import React, { useState, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';
import '../styles/components/character-dropdown.css';

function CharacterDropdown({
  characterBossSelections,
  selectedCharIdx,
  onCharacterChange,
  onRemoveCharacter
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowDeleteConfirm(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowDeleteConfirm(null);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleCharacterSelect = (idx) => {
    onCharacterChange({ target: { value: idx } });
    setIsOpen(false);
    setShowDeleteConfirm(null);
  };

  const handleDeleteClick = (e, idx) => {
    e.stopPropagation();
    setShowDeleteConfirm(idx);
  };

  const handleDeleteConfirm = (e, idx) => {
    e.stopPropagation();
    logger.info('Deleting character:', characterBossSelections[idx]?.name);
    onRemoveCharacter(idx);
    setShowDeleteConfirm(null);
    setIsOpen(false);
  };

  const handleDeleteCancel = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(null);
  };

  const selectedCharacter = characterBossSelections[selectedCharIdx];
  const displayText = selectedCharacter ? selectedCharacter.name : 'Select Character...';

  return (
    <div className="character-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className="character-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="character-dropdown-text">{displayText}</span>
        <svg 
          className={`character-dropdown-arrow ${isOpen ? 'open' : ''}`}
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

      {isOpen && (
        <div className="character-dropdown-menu" role="listbox">
          <div
            className="character-dropdown-option placeholder"
            onClick={() => handleCharacterSelect('')}
            role="option"
            aria-selected={selectedCharIdx === ''}
          >
            Select Character...
          </div>
          {characterBossSelections.map((char, idx) => (
            <div
              key={char.name + idx}
              className={`character-dropdown-option ${selectedCharIdx === idx ? 'selected' : ''}`}
              onClick={() => handleCharacterSelect(idx)}
              role="option"
              aria-selected={selectedCharIdx === idx}
            >
              <span className="character-dropdown-name">{char.name}</span>
              
              {showDeleteConfirm === idx ? (
                <div className="character-dropdown-delete-confirm">
                  <button
                    type="button"
                    className="character-dropdown-delete-btn confirm"
                    onClick={(e) => handleDeleteConfirm(e, idx)}
                    title="Confirm delete"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="character-dropdown-delete-btn cancel"
                    onClick={handleDeleteCancel}
                    title="Cancel delete"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="character-dropdown-delete-btn delete"
                  onClick={(e) => handleDeleteClick(e, idx)}
                  title={`Delete ${char.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CharacterDropdown; 