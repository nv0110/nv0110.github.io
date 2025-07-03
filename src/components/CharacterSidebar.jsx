import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatMesoBillions } from '../utils/formatUtils';
import { useScrollIndicator } from '../hooks/useScrollIndicator';
import ScrollIndicator from './ScrollIndicator';
import { logger } from '../utils/logger';

const CharacterSidebar = React.memo(function CharacterSidebar({
  sidebarVisible,
  setSidebarVisible,
  isHistoricalWeek,
  totalMeso,
  obtainableMeso,
  selectedWeekKey,
  hideCompleted,
  setHideCompleted,
  visibleCharSummaries,
  selectedCharIdx,
  setSelectedCharIdx,
  setPurgeTargetCharacter,
  setShowCharacterPurgeConfirm,
  setShowCharacterPitchedModal,
  onShowTreasureAnalytics,
  characterBossSelections,
  showOnboardingIndicators,
  onReorderCharacters
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmall, setIsVerySmall] = useState(false);
  const [showCharacterProgress, setShowCharacterProgress] = useState(false);
  const [showAccountCrystals, setShowAccountCrystals] = useState(true);
  
  // Drag and drop state
  const [draggedCharacter, setDraggedCharacter] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Scroll indicator hook
  const { showIndicator, elementRef } = useScrollIndicator([visibleCharSummaries, sidebarVisible]);

  // Detect mobile and very small screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsVerySmall(width <= 480);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar when clicking outside (simplified to prevent transition interference)
  useEffect(() => {
    if (!sidebarVisible) return;

    const handleClickOutside = (event) => {
      // Don't close sidebar if we're in the middle of a drag operation
      if (isDragging || draggedCharacter) {
        console.log('CharacterSidebar: Click outside blocked - drag in progress', { 
          isDragging, 
          draggedCharacter: draggedCharacter?.name,
          eventType: event.type 
        });
        return;
      }

      // Check if click is on functional UI areas that should not close sidebar
      const isProtectedArea = 
        event.target.closest('.sidebar-scroll') ||
        event.target.closest('.sidebar-toggle') || 
        event.target.closest('.sidebar-mobile-fab') ||
        event.target.closest('.modal-overlay') ||
        event.target.closest('.dropdown-menu') ||
        event.target.closest('.navbar') ||
        event.target.closest('button') ||
        event.target.closest('select') ||
        event.target.closest('input') ||
        event.target.closest('a') ||
        event.target.closest('[role="button"]') ||
        event.target.closest('.clickable') ||
        // Boss table and functional areas
        event.target.closest('.boss-table-container') ||
        event.target.closest('.boss-table-grid') ||
        event.target.closest('.boss-table-row') ||
        event.target.closest('.boss-config-table-grid') ||
        event.target.closest('.boss-config-row') ||
        event.target.closest('.week-navigator') ||
        event.target.closest('.week-card') ||
        event.target.closest('.crystal-tracker') ||
        event.target.closest('.character-dropdown') ||
        event.target.closest('.mode-indicator') ||
        // Draggable elements
        event.target.closest('.sidebar-character-card[draggable="true"]') ||
        // Any element with click handlers
        event.target.onclick ||
        event.target.getAttribute('onClick');
      
      if (!isProtectedArea) {
        console.log('CharacterSidebar: Closing sidebar due to outside click');
        setSidebarVisible && setSidebarVisible(false);
      }
    };

    // TEMPORARILY DISABLE click outside during drag operations
    if (isDragging || draggedCharacter) {
      console.log('CharacterSidebar: Skipping click outside listener - drag in progress');
      return;
    }

    // Add listener immediately without timing delays
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarVisible, setSidebarVisible, isDragging, draggedCharacter]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, character) => {
    console.log('=== DRAG START ===', { 
      character: character.name,
      eventTarget: e.target.className,
      eventType: e.type,
      isMobile,
      isVerySmall,
      isHistoricalWeek
    });

    // Prevent dragging on mobile or very small screens
    if (isMobile || isVerySmall) {
      console.log('CharacterSidebar: Drag prevented - mobile or small screen');
      e.preventDefault();
      return false;
    }

    if (isHistoricalWeek) {
      console.log('CharacterSidebar: Drag prevented - historical week');
      e.preventDefault();
      return false;
    }

    console.log('CharacterSidebar: Drag start processing...', { 
      character: character.name, 
      target: e.target.className,
      currentTarget: e.currentTarget.className,
      dataTransfer: e.dataTransfer
    });
    
    try {
      // Set drag data first - this must be done synchronously in dragstart
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', character.name);
      
      // Find the character card and add visual feedback immediately
      const characterCard = e.target.closest('.sidebar-character-card');
      if (characterCard) {
        characterCard.style.opacity = '0.5';
        console.log('CharacterSidebar: Visual feedback applied to card');
      }
      
      // Delay state updates to avoid interfering with drag
      setTimeout(() => {
        setDraggedCharacter(character);
        setIsDragging(true);
        console.log('CharacterSidebar: State updated after drag start');
      }, 0);
      
      console.log('CharacterSidebar: Drag start completed successfully');
      return true;
    } catch (error) {
      console.error('CharacterSidebar: Error in drag start:', error);
      return false;
    }
  }, [isMobile, isVerySmall, isHistoricalWeek]);

  const handleDragEnd = useCallback((e) => {
    console.log('=== DRAG END ===', {
      eventType: e.type,
      target: e.target.className,
      currentTarget: e.currentTarget.className,
      draggedCharacter: draggedCharacter?.name,
      isDragging,
      timeStamp: e.timeStamp
    });
    
    // Reset opacity for the dragged element
    const characterCard = e.target.closest('.sidebar-character-card');
    if (characterCard) {
      characterCard.style.opacity = '1';
      console.log('CharacterSidebar: Opacity reset for card');
    }
    
    setDraggedCharacter(null);
    setDragOverIndex(null);
    setIsDragging(false);
    
    console.log('CharacterSidebar: Drag end cleanup completed');
  }, [draggedCharacter, isDragging]);

  const handleDragOver = useCallback((e, targetCharacter, targetIndex) => {
    if (!draggedCharacter || draggedCharacter.idx === targetCharacter.idx) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(targetIndex);
  }, [draggedCharacter]);

  const handleDragLeave = useCallback((e) => {
    // Only clear drag over if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback(async (e, targetCharacter, targetIndex) => {
    console.log('CharacterSidebar: Drop event triggered');
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedCharacter || !onReorderCharacters || draggedCharacter.idx === targetCharacter.idx) {
      console.log('CharacterSidebar: Drop cancelled', { 
        draggedCharacter: draggedCharacter?.name, 
        onReorderCharacters: !!onReorderCharacters,
        sameCharacter: draggedCharacter?.idx === targetCharacter.idx 
      });
      setDragOverIndex(null);
      return;
    }

    console.log('CharacterSidebar: Processing drop', { 
      draggedCharacter: draggedCharacter.name, 
      targetCharacter: targetCharacter.name,
      targetIndex 
    });

    logger.debug('CharacterSidebar: Drop', { 
      draggedCharacter: draggedCharacter.name, 
      targetCharacter: targetCharacter.name,
      targetIndex 
    });

    try {
      // Create new character order based on the drop
      const currentOrder = visibleCharSummaries.map(cs => cs.name);
      const newOrder = [...currentOrder];
      
      // Remove dragged character from current position
      const draggedIndex = newOrder.findIndex(name => name === draggedCharacter.name);
      if (draggedIndex !== -1) {
        newOrder.splice(draggedIndex, 1);
      }
      
      // Insert at new position
      const insertIndex = newOrder.findIndex(name => name === targetCharacter.name);
      if (insertIndex !== -1) {
        newOrder.splice(insertIndex, 0, draggedCharacter.name);
      } else {
        // If target not found, append at end
        newOrder.push(draggedCharacter.name);
      }

      // Call the reorder function
      const result = await onReorderCharacters(newOrder);
      
      if (result.success) {
        logger.info('CharacterSidebar: Characters reordered successfully');
      } else {
        logger.error('CharacterSidebar: Failed to reorder characters', { error: result.error });
      }
    } catch (error) {
      logger.error('CharacterSidebar: Error during character reordering', { error });
    }
    
    setDragOverIndex(null);
  }, [draggedCharacter, onReorderCharacters, visibleCharSummaries]);

  const handlePitchedClick = useCallback((e, character) => {
    e.stopPropagation();
    setSelectedCharIdx(character.idx);
    if (setShowCharacterPitchedModal) {
      setShowCharacterPitchedModal(true);
    }
  }, [setSelectedCharIdx, setShowCharacterPitchedModal]);

  const handleCharacterSelect = useCallback((idx) => {
    // Don't select character if we're in a drag operation
    if (isDragging || draggedCharacter) {
      return;
    }
    
    setSelectedCharIdx(idx);
    // Auto-close sidebar on very small screens after selection
    if (isVerySmall && sidebarVisible && setSidebarVisible) {
      setTimeout(() => setSidebarVisible(false), 300);
    }
  }, [setSelectedCharIdx, isVerySmall, sidebarVisible, setSidebarVisible, isDragging, draggedCharacter]);

  const handleContextMenu = useCallback((e, character) => {
    e.preventDefault();
    e.stopPropagation();
    setPurgeTargetCharacter({ name: character.name, idx: character.idx });
    setShowCharacterPurgeConfirm(true);
  }, [setPurgeTargetCharacter, setShowCharacterPurgeConfirm]);

  // Toggle between weekly and character progress
  const handleProgressToggle = useCallback((e) => {
    e.stopPropagation();
    setShowCharacterProgress(prev => !prev);
  }, []);

  // Toggle between character and account-wide crystal count
  const handleCrystalToggle = useCallback((e) => {
    e.stopPropagation();
    setShowAccountCrystals(prev => !prev);
  }, []);

  // Calculate account-wide crystal totals
  const getAccountCrystalTotals = useCallback(() => {
    const totalPossible = visibleCharSummaries.reduce((sum, char) => sum + char.total, 0);
    const totalCleared = visibleCharSummaries.reduce((sum, char) => sum + char.cleared, 0);
    return { totalPossible, totalCleared };
  }, [visibleCharSummaries]);

  // Debug render state (disabled for performance)
  // useEffect(() => {
  //   console.log('CharacterSidebar: Render state', {
  //     isMobile,
  //     isVerySmall, 
  //     isHistoricalWeek,
  //     sidebarVisible,
  //     charactersCount: visibleCharSummaries.length,
  //     dragState: { isDragging, draggedCharacter: draggedCharacter?.name }
  //   });
  // }, [isMobile, isVerySmall, isHistoricalWeek, sidebarVisible, visibleCharSummaries.length, isDragging, draggedCharacter]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarVisible && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={() => setSidebarVisible && setSidebarVisible(false)}
        />
      )}

      {/* Mobile FAB (Floating Action Button) for very small screens */}
      {isVerySmall && !sidebarVisible && (
        <button
          className="sidebar-mobile-fab"
          onClick={() => setSidebarVisible && setSidebarVisible(true)}
          title="Open character sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7.75735 13.2574L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
          <span className="sidebar-mobile-fab-badge">{visibleCharSummaries.length}</span>
        </button>
      )}
      
      <div
        className={`sidebar-scroll fade-in-no-slide ${sidebarVisible ? 'visible' : 'hidden'} ${isMobile ? 'mobile' : 'desktop'} ${isVerySmall ? 'very-small' : ''}`}
      >
        <div className="sidebar-content">
          {/* Mobile close button */}
          {isMobile && (
            <button 
              className="sidebar-mobile-close"
              onClick={() => setSidebarVisible && setSidebarVisible(false)}
              title="Close sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* Sidebar Header */}
          <div className="sidebar-header">
            <h3 
              className={`sidebar-title ${showOnboardingIndicators ? 'onboarding-highlight' : ''}`}
              onClick={onShowTreasureAnalytics}
              title="View logged item analytics across all characters"
            >
              Characters
            </h3>
          </div>

          {/* Progress Bar - only for current week with click toggle */}
          {!isHistoricalWeek && (
            <div 
              className={`sidebar-progress-section premium-progress ${showOnboardingIndicators ? 'onboarding-highlight' : ''}`} 
              onClick={handleProgressToggle}
            >
              {!showCharacterProgress ? (
                /* Weekly Progress (default state) */
                <div className="sidebar-progress-container sidebar-progress-weekly">
              <div className="sidebar-progress-title">Weekly Progress</div>
              <div className="sidebar-progress-track week-navigator-progress-bar-container">
                <div
                  className="sidebar-progress-fill week-navigator-progress-bar"
                  style={{
                    width: `${obtainableMeso > 0 ? Math.min((totalMeso / obtainableMeso) * 100, 100) : 0}%`
                  }}
                >
                  {obtainableMeso > 0 && totalMeso > 0 && (
                    <div className="week-navigator-progress-shimmer" />
                  )}
                </div>
              </div>
              <div className="sidebar-progress-numbers">
                <span>{formatMesoBillions(totalMeso)}</span>
                <span>{formatMesoBillions(obtainableMeso)}</span>
              </div>
                </div>
              ) : (
                /* Character Progress (toggled state) */
                visibleCharSummaries[selectedCharIdx] && (
                  <div className="sidebar-progress-container sidebar-progress-character">
                    <div className="sidebar-progress-title">
                      {visibleCharSummaries[selectedCharIdx].name}'s Weekly
                    </div>
                    <div className="sidebar-progress-track week-navigator-progress-bar-container">
                      <div
                        className="sidebar-progress-fill week-navigator-progress-bar"
                        style={{
                          width: `${(() => {
                            const char = visibleCharSummaries[selectedCharIdx];
                            if (!char) return 0;
                            const charKey = `${char.name}-${char.idx}`;
                            const charData = characterBossSelections[char.idx];
                            if (!charData) return 0;
                            const totalCharMeso = charData.bosses.reduce((s, b) => s + Math.ceil((b.price || 0) / (b.partySize || 1)), 0);
                            return totalCharMeso > 0 ? Math.min((char.totalMeso / totalCharMeso) * 100, 100) : 0;
                          })()}%`
                        }}
                      >
                        {visibleCharSummaries[selectedCharIdx].totalMeso > 0 && (
                          <div className="week-navigator-progress-shimmer" />
                        )}
                      </div>
                    </div>
                    <div className="sidebar-progress-numbers">
                      <span>{formatMesoBillions(visibleCharSummaries[selectedCharIdx].totalMeso)}</span>
                      <span>{formatMesoBillions((() => {
                        const char = visibleCharSummaries[selectedCharIdx];
                        if (!char) return 0;
                        const charData = characterBossSelections[char.idx];
                        if (!charData) return 0;
                        return charData.bosses.reduce((s, b) => s + Math.ceil((b.price || 0) / (b.partySize || 1)), 0);
                      })())}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Crystal Count Display - for selected character */}
          {visibleCharSummaries[selectedCharIdx] && (
            <div 
              className="sidebar-crystal-count premium-progress"
              onClick={handleCrystalToggle}
            >
              {showAccountCrystals ? (
                /* Account-wide Crystal Count (default state) */
                (() => {
                  const { totalPossible, totalCleared } = getAccountCrystalTotals();
                  const remainingCrystals = totalPossible - totalCleared;
                  const allAccountCleared = totalPossible > 0 && totalCleared === totalPossible;
                  return (
                    <div className="sidebar-crystal-count-container sidebar-crystal-count-account">
                      <div className="crystal-account-header">
                        <span className="crystal-account-title">Account Overview</span>
                      </div>
                      <div className="crystal-account-stats">
                        <div className="crystal-stat-item crystal-stat-sold">
                          <span className="crystal-stat-number">{totalCleared}</span>
                          <span className="crystal-stat-label">Sold</span>
                        </div>
                        <div className="crystal-stat-divider">•</div>
                        <div className="crystal-stat-item crystal-stat-remaining">
                          <span className="crystal-stat-number">{remainingCrystals}</span>
                          <span className="crystal-stat-label">Remaining</span>
                        </div>
                      </div>
                      {allAccountCleared && (
                        <div className="crystal-count-status">
                          <svg className="crystal-complete-icon" width="14" height="14" viewBox="0 0 22 22">
                            <circle cx="11" cy="11" r="11" fill="#38a169" />
                            <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="crystal-complete-text">All Complete!</span>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* Character Crystal Count (toggled state) */
                <div className="sidebar-crystal-count-container sidebar-crystal-count-character">
                  <div className="sidebar-crystal-count-header">
                    <span className="crystal-count-character">
                      {visibleCharSummaries[selectedCharIdx].name}
                    </span>
                    <span className={`crystal-count-display ${visibleCharSummaries[selectedCharIdx].allCleared ? 'all-cleared' : ''}`}>
                      {visibleCharSummaries[selectedCharIdx].cleared}/{visibleCharSummaries[selectedCharIdx].total} crystals
                    </span>
                  </div>
                  {visibleCharSummaries[selectedCharIdx].allCleared && (
                    <div className="crystal-count-status">
                      <svg className="crystal-complete-icon" width="14" height="14" viewBox="0 0 22 22">
                        <circle cx="11" cy="11" r="11" fill="#38a169" />
                        <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="crystal-complete-text">Week Complete!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Historical week indicator */}
          {isHistoricalWeek && (
            <div className="sidebar-historical-section">
              <div className="sidebar-historical-title">
                Week {selectedWeekKey.split('-').slice(1).join('-')}
              </div>
              <div className="sidebar-historical-subtitle">Historical Data</div>
            </div>
          )}

          {/* Character Cards - Scrollable Container */}
          <div className="sidebar-character-list-container">
            <div className="sidebar-character-list" ref={elementRef}>
              {visibleCharSummaries.length === 0 ? (
                <div className="sidebar-empty-state">
                  {hideCompleted ? 'No characters with bosses left to clear.' : 'No characters found.'}
                </div>
              ) : (
                visibleCharSummaries.map((cs, index) => (
                  <div
                    key={cs.name + '-' + cs.idx}
                    draggable={!isMobile && !isVerySmall && !isHistoricalWeek}
                    onClick={() => handleCharacterSelect(cs.idx)}
                    onContextMenu={e => handleContextMenu(e, cs)}
                    onDragStart={(e) => handleDragStart(e, cs)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, cs, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, cs, index)}
                    className={`sidebar-character-card ${
                      selectedCharIdx === cs.idx
                        ? `selected ${isHistoricalWeek ? 'historical-week' : 'current-week'}`
                        : 'default'
                    } ${draggedCharacter?.idx === cs.idx ? 'dragging' : ''} ${
                      dragOverIndex === index && draggedCharacter?.idx !== cs.idx ? 'drag-over' : ''
                    } ${!isMobile && !isVerySmall && !isHistoricalWeek ? 'draggable' : ''}`}
                  >
                    <div className="sidebar-character-header">
                      <span className={`sidebar-character-name ${selectedCharIdx === cs.idx ? 'selected' : 'default'}`}>{cs.name}</span>
                      <div className="sidebar-character-actions">
                        {cs.allCleared && (
                          <svg className="sidebar-character-checkmark" width="16" height="16" viewBox="0 0 22 22">
                            <circle cx="11" cy="11" r="11" fill="#38a169" />
                            <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <button
                          className="sidebar-character-pitched-btn"
                          onClick={e => handlePitchedClick(e, cs)}
                          title="View pitched items"
                        >
                          <div className="pitched-btn-content">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7.75735 13.2574L2 9.27L8.91 8.26L12 2Z"
                                fill="url(#starGradient)"
                                stroke="url(#starStrokeGradient)"
                                strokeWidth="1.5"
                              />
                              <defs>
                                <linearGradient id="starGradient" x1="0" y1="0" x2="24" y2="24">
                                  <stop stopColor="#a259f7" />
                                  <stop offset="1" stopColor="#805ad5" />
                                </linearGradient>
                                <linearGradient id="starStrokeGradient" x1="0" y1="0" x2="24" y2="24">
                                  <stop stopColor="#d6b4ff" />
                                  <stop offset="1" stopColor="#a259f7" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <span className="pitched-btn-glow"></span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="sidebar-character-stats">
                      {cs.total === 0 ? (
                        <div className="sidebar-character-no-bosses">No bosses configured</div>
                      ) : (
                        <>
                          <div className="sidebar-character-completion">{cs.cleared} / {cs.total} bosses cleared</div>
                          <div className="sidebar-character-meso">{formatMesoBillions(cs.totalMeso)} meso</div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <ScrollIndicator show={showIndicator} />
          </div>
        </div>
      </div>
    </>
  );
});

export default CharacterSidebar; 