import React, { useState, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';
import './CharacterDropdown.css';

function CharacterDropdown({
  characterBossSelections,
  selectedCharIdx,
  onCharacterChange,
  onRemoveCharacter,
  onCopyCharacter,
  onEditCharacterName
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const modalRef = useRef(null);
  const editInputRef = useRef(null);

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

  const handleEditCharacter = () => {
    if (!characterBossSelections[selectedCharIdx]) return;
    
    setEditName(characterBossSelections[selectedCharIdx].name);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !characterBossSelections[selectedCharIdx]) {
      setIsEditing(false);
      return;
    }

    if (editName.trim() === characterBossSelections[selectedCharIdx].name) {
      setIsEditing(false);
      return;
    }

    try {
      const result = await onEditCharacterName(selectedCharIdx, editName.trim());
      
      if (result && !result.success) {
        logger.error('Failed to edit character name:', result.error);
      }
      
    } catch (error) {
      logger.error('Error editing character name:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Focus the edit input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const selectedCharacter = characterBossSelections[selectedCharIdx];
  const displayText = selectedCharacter ? selectedCharacter.name : 'Select Character...';
  const canCopy = selectedCharacter && !isCopying;
  const canEdit = selectedCharacter && !isEditing && onEditCharacterName;

  return (
    <div className="character-dropdown-with-copy">
      <div className="character-dropdown-container">
        {/* Edit Mode Input */}
        {isEditing ? (
          <div className="character-edit-input-container">
            <input
              ref={editInputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={handleSaveEdit}
              className="character-edit-input"
              placeholder="Character name..."
            />
          </div>
        ) : (
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
        )}
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

      {/* Action Buttons */}
      <div className="character-action-buttons">
        {/* Edit Character Button */}
        <button
          type="button"
          className={`character-edit-btn ${canEdit ? 'enabled' : 'disabled'}`}
          onClick={handleEditCharacter}
          disabled={!canEdit}
          title={canEdit ? `Edit ${selectedCharacter.name}` : 'Select a character to edit'}
        >
          <svg 
            className="character-edit-icon" 
            width="16" 
            height="16" 
            viewBox="0 0 494.936 494.936" 
            fill="currentColor"
          >
            <path d="M389.844,182.85c-6.743,0-12.21,5.467-12.21,12.21v222.968c0,23.562-19.174,42.735-42.736,42.735H67.157
              c-23.562,0-42.736-19.174-42.736-42.735V150.285c0-23.562,19.174-42.735,42.736-42.735h267.741c6.743,0,12.21-5.467,12.21-12.21
              s-5.467-12.21-12.21-12.21H67.157C30.126,83.13,0,113.255,0,150.285v267.743c0,37.029,30.126,67.155,67.157,67.155h267.741
              c37.03,0,67.156-30.126,67.156-67.155V195.061C402.054,188.318,396.587,182.85,389.844,182.85z"/>
            <path d="M483.876,20.791c-14.72-14.72-38.669-14.714-53.377,0L221.352,229.944c-0.28,0.28-3.434,3.559-4.251,5.396l-28.963,65.069
              c-2.057,4.619-1.056,10.027,2.521,13.6c2.337,2.336,5.461,3.576,8.639,3.576c1.675,0,3.362-0.346,4.96-1.057l65.07-28.963
              c1.83-0.815,5.114-3.97,5.396-4.25L483.876,74.169c7.131-7.131,11.06-16.61,11.06-26.692
              C494.936,37.396,491.007,27.915,483.876,20.791z M466.61,56.897L257.457,266.05c-0.035,0.036-0.055,0.078-0.089,0.107
              l-33.989,15.131L238.51,247.3c0.03-0.036,0.071-0.055,0.107-0.09L447.765,38.058c5.038-5.039,13.819-5.033,18.846,0.005
              c2.518,2.51,3.905,5.855,3.905,9.414C470.516,51.036,469.127,54.38,466.61,56.897z"/>
          </svg>
        </button>

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
    </div>
  );
}

export default CharacterDropdown; 