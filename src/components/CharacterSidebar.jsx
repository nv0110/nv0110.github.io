import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { formatMesoBillions } from '../utils/formatUtils';
import PitchedItemsModal from './PitchedItemsModal';
import { useAuth } from '../hooks/useAuth';
import { usePitchedItems } from '../hooks/usePitchedItems';

// Helper to create a stable hash for characterBossSelections
function hashCharacterSelections(chars) {
  return JSON.stringify(
    (chars || []).map(c => ({
      name: c.name,
      idx: c.idx ?? c.index ?? 0,
      bosses: (c.bosses || []).map(b => `${b.name}-${b.difficulty}`)
    }))
  );
}

const CharacterSidebar = React.memo(function CharacterSidebar({
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
  setShowCharacterPurgeConfirm,
  characterBossSelections = []
}) {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showPitchedModal, setShowPitchedModal] = useState(false);
  const [selectedCharacterPitched, setSelectedCharacterPitched] = useState(null);
  const characterListRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Get userCode from auth
  const { userCode } = useAuth();

  // Memoize character data with bosses to prevent unnecessary re-renders
  const charHash = useMemo(() => hashCharacterSelections(characterBossSelections), [characterBossSelections]);
  const charLength = characterBossSelections.length;
  const stableCharacterData = useMemo(() => {
    return characterBossSelections.map(char => ({
      ...char,
      bosses: char.bosses || []
    }));
  }, [charHash, charLength]);

  // Get all pitched items from the cloud - use stable character data
  const { cloudPitchedItems } = usePitchedItems(
    userCode,
    stableCharacterData,
    {},
    () => {},
    selectedWeekKey
  );

  // Filter pitched items for the selected character
  const selectedCharacterIdx = selectedCharacterPitched?.idx;
  const pitchedItemsForCharacter = useMemo(() => {
    if (selectedCharacterIdx === undefined || selectedCharacterIdx === null) {
      return [];
    }
    return cloudPitchedItems.filter(item => item.characterIdx === selectedCharacterIdx);
  }, [cloudPitchedItems, selectedCharacterIdx]);

  // Check if scroll indicator should be shown
  useEffect(() => {
    const checkScrollable = () => {
      const element = characterListRef.current;
      if (element) {
        const hasScrollableContent = element.scrollHeight > element.clientHeight;
        const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 5;
        const canScrollDown = hasScrollableContent && !isAtBottom;
        setShowScrollIndicator(canScrollDown && !isScrolling);
      }
    };

    const handleScroll = () => {
      setIsScrolling(true);
      setShowScrollIndicator(false);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        checkScrollable();
      }, 1000);
    };

    checkScrollable();
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
      }, 100);
    }
  }, [sidebarVisible, isScrolling]);

  const handlePitchedClick = useCallback((e, character) => {
    e.stopPropagation();
    setSelectedCharacterPitched(character);
    setShowPitchedModal(true);
  }, []);

  return (
    <>
      <div
        className={`sidebar-scroll fade-in-no-slide ${sidebarVisible ? 'visible' : 'hidden'}`}
      >
        <div className="sidebar-content">
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <h3 className="sidebar-title">Characters</h3>
          </div>

          {/* Progress Bar - only for current week */}
          {!isHistoricalWeek && (
            <div className="sidebar-progress-section">
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
            <div className="sidebar-character-list" ref={characterListRef}>
              {visibleCharSummaries.length === 0 ? (
                <div className="sidebar-empty-state">
                  {hideCompleted ? 'No characters with bosses left to clear.' : 'No characters found.'}
                </div>
              ) : (
                visibleCharSummaries.map(cs => (
                  <div
                    key={cs.name + '-' + cs.idx}
                    onClick={() => setSelectedCharIdx(cs.idx)}
                    onContextMenu={e => {
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
                                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
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
      <PitchedItemsModal
        isOpen={showPitchedModal}
        onClose={() => setShowPitchedModal(false)}
        characterName={selectedCharacterPitched?.name}
        pitchedItems={pitchedItemsForCharacter}
      />
    </>
  );
});

export default CharacterSidebar; 