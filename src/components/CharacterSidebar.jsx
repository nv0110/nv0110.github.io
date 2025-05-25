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
        className="sidebar-scroll"
        style={{ 
          width: sidebarVisible ? 280 : 0,
          minWidth: sidebarVisible ? 280 : 0,
          background: 'linear-gradient(180deg, rgba(40, 32, 74, 0.95), rgba(35, 32, 58, 0.9))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRight: sidebarVisible ? '1px solid rgba(162, 89, 247, 0.15)' : 'none',
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          zIndex: 99,
          padding: sidebarVisible ? '1rem' : '0', 
          paddingTop: sidebarVisible ? '1rem' : '0', // Normal padding, not extra for navbar
          paddingRight: sidebarVisible ? '0.5rem' : '0',
          boxShadow: sidebarVisible ? '2px 0 24px rgba(162, 89, 247, 0.08), 2px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
          transition: 'all 0.3s ease',
          willChange: 'transform, opacity', // Optimize for animations
        }}>
        {sidebarVisible && (
          <div style={{ paddingRight: '0.5rem' }}>
            {/* Sidebar Header */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(162, 89, 247, 0.15)'
            }}>
              <h3 style={{ 
                fontSize: '1.3rem', 
                fontWeight: 700,
                margin: 0, 
                color: '#e6e0ff',
                marginBottom: '0.5rem'
              }}>
                Characters
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 20, height: 20 }} />
                <img src="/bosses/bluecrystal.png" alt="Blue Crystal" style={{ width: 20, height: 20 }} />
                <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" style={{ width: 20, height: 20 }} />
              </div>
            </div>

            {/* Progress Bar - only for current week */}
            {!isHistoricalWeek && (
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                backdropFilter: 'blur(8px)',
                borderRadius: 12, 
                padding: '1rem', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                marginBottom: '1rem' 
              }}>
                <div style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem', 
                  color: '#d6b4ff',
                  textAlign: 'center' 
                }}>
                  Weekly Progress
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', height: 6, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ 
                    background: 'linear-gradient(90deg, #a259f7, #b47aff)', 
                    height: '100%', 
                    width: `${obtainableMeso > 0 ? Math.min((totalMeso / obtainableMeso) * 100, 100) : 0}%`, 
                    borderRadius: 3, 
                    transition: 'width 0.3s ease' 
                  }} />
                </div>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginTop: '0.4rem', 
                  color: '#c4b5d4', 
                  fontSize: '0.8rem' 
                }}>
                  <span>{totalMeso.toLocaleString()}</span>
                  <span>{obtainableMeso.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Historical week indicator */}
            {isHistoricalWeek && (
              <div style={{ 
                background: 'rgba(162, 89, 247, 0.1)', 
                backdropFilter: 'blur(8px)',
                borderRadius: 12, 
                padding: '1rem', 
                border: '1px solid rgba(162, 89, 247, 0.2)',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ color: '#d6b4ff', fontSize: '0.9rem', fontWeight: 600 }}>
                  Week {selectedWeekKey}
                </div>
                <div style={{ color: '#b39ddb', fontSize: '0.8rem' }}>
                  Historical Data
                </div>
              </div>
            )}

            {/* Hide completed checkbox */}
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <label style={{ 
                fontSize: '0.85rem', 
                color: '#c4b5d4', 
                cursor: 'pointer', 
                userSelect: 'none', 
                display: 'inline-flex', 
                alignItems: 'center',
                gap: '6px'
              }}>
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={e => setHideCompleted(e.target.checked)}
                  style={{ accentColor: '#a259f7' }}
                />
                Hide completed
              </label>
            </div>

            {/* Pagination Navigation */}
            {paginationInfo.totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid rgba(162, 89, 247, 0.15)'
              }}>
                {/* Previous page arrow */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={goToPreviousPage}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))'
                  }}
                  title="Previous Page"
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.15) translateX(-2px)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1) translateX(0)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))';
                  }}
                >
                  <path
                    d="M20.3284 11.0001V13.0001L7.50011 13.0001L10.7426 16.2426L9.32842 17.6568L3.67157 12L9.32842 6.34314L10.7426 7.75735L7.49988 11.0001L20.3284 11.0001Z"
                    fill="#ffffff"
                  />
                </svg>

                {/* Page indicator */}
                <div style={{
                  fontSize: '0.85rem',
                  color: '#b39ddb',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  {paginationInfo.totalCharacters > 0 ? (
                    <>Page {currentPage + 1} of {paginationInfo.totalPages}</>
                  ) : (
                    'No characters'
                  )}
                </div>

                {/* Next page arrow */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={goToNextPage}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))'
                  }}
                  title="Next Page"
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.15) translateX(2px)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1) translateX(0)';
                    e.currentTarget.style.filter = 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))';
                  }}
                >
                  <path
                    d="M15.0378 6.34317L13.6269 7.76069L16.8972 11.0157L3.29211 11.0293L3.29413 13.0293L16.8619 13.0157L13.6467 16.2459L15.0643 17.6568L20.7079 11.9868L15.0378 6.34317Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
            )}

            {/* Character Cards - Current Page Only */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 320 }}>
              {paginationInfo.currentPageCharacters.length === 0 ? (
                <div style={{ 
                  color: '#9f9fb8', 
                  fontSize: '0.9rem', 
                  textAlign: 'center', 
                  padding: '2rem 1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 12,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  opacity: visibleCharSummaries.length === 0 ? 0 : 1
                }}>
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
                    style={{
                      background: selectedCharIdx === cs.idx 
                        ? 'linear-gradient(135deg, rgba(162, 89, 247, 0.25), rgba(128, 90, 213, 0.2))' 
                        : 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      borderRadius: 12,
                      padding: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: selectedCharIdx === cs.idx 
                        ? (isHistoricalWeek ? '1px solid rgba(159, 122, 234, 0.5)' : '1px solid rgba(162, 89, 247, 0.5)')
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      position: 'relative',
                      transform: selectedCharIdx === cs.idx ? 'translateX(3px)' : 'translateX(0)',
                      boxShadow: selectedCharIdx === cs.idx 
                        ? '0 8px 32px rgba(162, 89, 247, 0.15)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseOver={e => {
                      if (selectedCharIdx !== cs.idx) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.1)';
                      }
                    }}
                    onMouseOut={e => {
                      if (selectedCharIdx !== cs.idx) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {/* Historical week indicator */}
                    {isHistoricalWeek && selectedCharIdx === cs.idx && (
                      <div style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: isReadOnlyMode ? '#ff6b6b' : '#38a169',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        fontSize: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        zIndex: 5
                      }}>
                        {isReadOnlyMode ? '🔒' : '✏️'}
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.4rem'
                    }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '1rem',
                        color: selectedCharIdx === cs.idx ? '#e6e0ff' : '#d0c5ff'
                      }}>
                        {cs.name}
                      </span>
                      {cs.allCleared && (
                        <svg width="16" height="16" viewBox="0 0 22 22">
                          <circle cx="11" cy="11" r="11" fill="#38a169"/>
                          <polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    {cs.total === 0 ? (
                      <div style={{ color: '#888', fontWeight: 500, fontSize: '0.85rem' }}>
                        No bosses configured
                      </div>
                    ) : (
                      <>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#b39ddb',
                          marginBottom: '0.3rem'
                        }}>
                          {cs.cleared} / {cs.total} bosses cleared
                        </div>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: 600,
                          color: '#a259f7'
                        }}>
                          {cs.totalMeso.toLocaleString()} meso
                        </div>
                      </>
                    )}
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