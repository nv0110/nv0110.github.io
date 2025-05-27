import React, { useState, useEffect, useRef } from 'react';

// Format meso values in billions (e.g., 1.1B, 2.5B)
const formatMesoBillions = (meso) => {
  if (meso === 0) return '0';
  if (meso < 1000000000) {
    // Less than 1 billion, show in millions with 'M'
    const millions = meso / 1000000;
    if (millions < 1) {
      // Less than 1 million, show in thousands with 'K'
      const thousands = meso / 1000;
      return thousands < 1 ? meso.toString() : `${thousands.toFixed(1)}K`;
    }
    return `${millions.toFixed(1)}M`;
  }
  // 1 billion or more, show in billions with 'B'
  const billions = meso / 1000000000;
  return `${billions.toFixed(1)}B`;
};

function CharacterSidebar({
  sidebarVisible,
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
  setShowCharacterPurgeConfirm
}) {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const characterListRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Check if scroll indicator should be shown
  useEffect(() => {
    const checkScrollable = () => {
      const element = characterListRef.current;
      if (element) {
        const hasScrollableContent = element.scrollHeight > element.clientHeight;
        const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 5; // 5px tolerance
        const canScrollDown = hasScrollableContent && !isAtBottom;
        setShowScrollIndicator(canScrollDown && !isScrolling);
      }
    };

    const handleScroll = () => {
      setIsScrolling(true);
      setShowScrollIndicator(false);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to show indicator again after scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        checkScrollable();
      }, 1000); // Show indicator 1 second after scrolling stops
    };

    // Check initially and when characters change
    checkScrollable();
    
    // Add scroll listener
    const element = characterListRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => {
        element.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [visibleCharSummaries, isScrolling]);

  // Also check when sidebar visibility changes
  useEffect(() => {
    if (sidebarVisible) {
      setTimeout(() => {
        const element = characterListRef.current;
        if (element) {
          const hasScrollableContent = element.scrollHeight > element.clientHeight;
          const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 5;
          const canScrollDown = hasScrollableContent && !isAtBottom;
          setShowScrollIndicator(canScrollDown && !isScrolling);
        }
      }, 100); // Small delay to ensure sidebar is fully rendered
    }
  }, [sidebarVisible, isScrolling]);

  return (
    <>
      <div
        className={`sidebar-scroll fade-in-no-slide ${sidebarVisible ? 'visible' : 'hidden'}`}
      >
          <div className="sidebar-content">
            {/* Sidebar Header */}
            <div className="sidebar-header">
              <h3 className="sidebar-title">
                Characters
              </h3>
              <div className="sidebar-crystal-icons">
                <img src="/bosses/crystal.png" alt="Crystal" className="sidebar-crystal-icon" />
                <img src="/bosses/bluecrystal.png" alt="Blue Crystal" className="sidebar-crystal-icon" />
                <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" className="sidebar-crystal-icon" />
              </div>
            </div>

            {/* Progress Bar - only for current week */}
            {!isHistoricalWeek && (
              <div className="sidebar-progress-section">
                <div className="sidebar-progress-title">
                  Weekly Progress
                </div>
                <div className="sidebar-progress-track">
                  <div 
                    className="sidebar-progress-fill"
                    style={{ 
                      width: `${obtainableMeso > 0 ? Math.min((totalMeso / obtainableMeso) * 100, 100) : 0}%`
                    }} 
                  />
                </div>
                <div className="sidebar-progress-numbers">
                  <span>{formatMesoBillions(totalMeso)}</span>
                  <span>{formatMesoBillions(obtainableMeso)}</span>
                </div>
              </div>
            )}

            {/* Historical week indicator */}
            {isHistoricalWeek && (
              <div className="sidebar-historical-section">
                <div className="sidebar-historical-title">
                  Week {selectedWeekKey}
                </div>
                <div className="sidebar-historical-subtitle">
                  Historical Data
                </div>
              </div>
            )}

            {/* Hide completed checkbox */}
            <div className="sidebar-checkbox-section">
              <label className="sidebar-checkbox-label">
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={e => setHideCompleted(e.target.checked)}
                  className="sidebar-checkbox-input"
                />
                Hide completed
              </label>
            </div>

            {/* Character Cards - Scrollable Container */}
            <div className="sidebar-character-list-container">
              <div className="sidebar-character-list" ref={characterListRef}>
                {visibleCharSummaries.length === 0 ? (
                  <div className="sidebar-empty-state">
                    {hideCompleted ? 'No characters with bosses left to clear.' : 'No characters found.'}
                  </div>
                ) : (
                  visibleCharSummaries.map(cs => (
                  <div
                    key={cs.name + '-' + cs.idx}
                    onClick={() => {
                      // console.log(`🎯 SIDEBAR: Character selection changed from ${selectedCharIdx} to ${cs.idx} (${cs.name})`);
                      // console.log(`🎯 SIDEBAR: Character details:`, {
                      //   oldChar: visibleCharSummaries.find(c => c.idx === selectedCharIdx),
                      //   newChar: cs,
                      //   allCharacters: visibleCharSummaries.map(c => ({ name: c.name, idx: c.idx }))
                      // });
                      setSelectedCharIdx(cs.idx);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setPurgeTargetCharacter({ name: cs.name, idx: cs.idx });
                      setShowCharacterPurgeConfirm(true);
                    }}
                    className={`sidebar-character-card ${
                      selectedCharIdx === cs.idx 
                        ? `selected ${isHistoricalWeek ? 'historical-week' : 'current-week'}` 
                        : 'default'
                    }`}
                  >


                    <div className="sidebar-character-header">
                      <span className={`sidebar-character-name ${selectedCharIdx === cs.idx ? 'selected' : 'default'}`}>
                        {cs.name}
                      </span>
                      {cs.allCleared && (
                        <svg className="sidebar-character-checkmark" width="16" height="16" viewBox="0 0 22 22">
                          <circle cx="11" cy="11" r="11" fill="#38a169"/>
                          <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    <div className="sidebar-character-stats">
                      {cs.total === 0 ? (
                        <div className="sidebar-character-no-bosses">
                          No bosses configured
                        </div>
                      ) : (
                        <>
                          <div className="sidebar-character-completion">
                            {cs.cleared} / {cs.total} bosses cleared
                          </div>
                          <div className="sidebar-character-meso">
                            {formatMesoBillions(cs.totalMeso)} meso
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
                )}
              </div>
              
              {/* Scroll Indicator Arrow */}
              {showScrollIndicator && (
                <div className="sidebar-scroll-indicator">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.0001 3.67157L13.0001 3.67157L13.0001 16.4999L16.2426 13.2574L17.6568 14.6716L12 20.3284L6.34314 14.6716L7.75735 13.2574L11.0001 16.5001L11.0001 3.67157Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
      </div>
    </>
  );
}

export default CharacterSidebar; 