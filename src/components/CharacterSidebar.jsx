import React, { useState, useMemo } from 'react';

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
  isReadOnlyMode,
  setPurgeTargetCharacter,
  setShowCharacterPurgeConfirm
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const charactersPerPage = 5;

  // Calculate pagination
  const paginationInfo = useMemo(() => {
    const totalCharacters = visibleCharSummaries.length;
    const totalPages = Math.ceil(totalCharacters / charactersPerPage);
    const startIndex = currentPage * charactersPerPage;
    const endIndex = Math.min(startIndex + charactersPerPage, totalCharacters);
    const currentPageCharacters = visibleCharSummaries.slice(startIndex, endIndex);
    
    return {
      totalPages,
      currentPageCharacters,
      startIndex,
      endIndex,
      totalCharacters
    };
  }, [visibleCharSummaries, currentPage, charactersPerPage]);

  // Reset to first page when characters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [visibleCharSummaries.length, hideCompleted]);

  // Infinite navigation functions
  const goToPreviousPage = () => {
    if (paginationInfo.totalPages > 1) {
      setCurrentPage(prev => prev === 0 ? paginationInfo.totalPages - 1 : prev - 1);
    }
  };

  const goToNextPage = () => {
    if (paginationInfo.totalPages > 1) {
      setCurrentPage(prev => prev === paginationInfo.totalPages - 1 ? 0 : prev + 1);
    }
  };

  return (
    <>
      <div
        className={`sidebar-scroll fade-in-no-slide ${sidebarVisible ? 'visible' : 'hidden'}`}
      >
        {sidebarVisible && (
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
                  <span>{totalMeso.toLocaleString()}</span>
                  <span>{obtainableMeso.toLocaleString()}</span>
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

            {/* Pagination Navigation */}
            {paginationInfo.totalPages > 1 && (
              <div className="sidebar-pagination">
                {/* Previous page arrow */}
                <svg
                  className="sidebar-pagination-arrow previous"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={goToPreviousPage}
                  title="Previous Page"
                >
                  <path
                    d="M20.3284 11.0001V13.0001L7.50011 13.0001L10.7426 16.2426L9.32842 17.6568L3.67157 12L9.32842 6.34314L10.7426 7.75735L7.49988 11.0001L20.3284 11.0001Z"
                    fill="#ffffff"
                  />
                </svg>

                {/* Page indicator */}
                <div className="sidebar-pagination-indicator">
                  {paginationInfo.totalCharacters > 0 ? (
                    <>Page {currentPage + 1} of {paginationInfo.totalPages}</>
                  ) : (
                    'No characters'
                  )}
                </div>

                {/* Next page arrow */}
                <svg
                  className="sidebar-pagination-arrow next"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={goToNextPage}
                  title="Next Page"
                >
                  <path
                    d="M15.0378 6.34317L13.6269 7.76069L16.8972 11.0157L3.29211 11.0293L3.29413 13.0293L16.8619 13.0157L13.6467 16.2459L15.0643 17.6568L20.7079 11.9868L15.0378 6.34317Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
            )}

            {/* Character Cards - Current Page Only */}
            <div className="sidebar-character-list">
              {paginationInfo.currentPageCharacters.length === 0 ? (
                <div 
                  className="sidebar-empty-state"
                  style={{ 
                    opacity: visibleCharSummaries.length === 0 ? 0 : 1
                  }}
                >
                  {hideCompleted ? 'No characters with bosses left to clear.' : 'No characters found.'}
                </div>
              ) : (
                paginationInfo.currentPageCharacters.map(cs => (
                  <div
                    key={cs.name + '-' + cs.idx}
                    onClick={() => setSelectedCharIdx(cs.idx)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!isReadOnlyMode) {
                        setPurgeTargetCharacter({ name: cs.name, idx: cs.idx });
                        setShowCharacterPurgeConfirm(true);
                      }
                    }}
                    className={`sidebar-character-card ${
                      selectedCharIdx === cs.idx 
                        ? `selected ${isHistoricalWeek ? 'historical-week' : 'current-week'}` 
                        : 'default'
                    }`}
                  >
                    {/* Historical week indicator */}
                    {isHistoricalWeek && selectedCharIdx === cs.idx && (
                      <div className={`sidebar-character-status-indicator ${isReadOnlyMode ? 'readonly' : 'editable'}`}>
                        {isReadOnlyMode ? '🔒' : '✏️'}
                      </div>
                    )}

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
                            {cs.totalMeso.toLocaleString()} meso
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default CharacterSidebar; 