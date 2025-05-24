import { useState, Suspense, lazy } from 'react';import { useNavigate } from 'react-router-dom';import { useAuth } from '../hooks/useAuth';import { useAppData } from '../hooks/useAppData';import { bossData, getBossPrice } from '../data/bossData';import { LIMITS } from '../constants';import { Tooltip } from '../components/Tooltip';import Navbar from '../components/Navbar';

// Lazy load DataBackup component
const DataBackup = lazy(() => import('../components/DataBackup'));

// Import the EditCharacterName component (we'll need to extract this or recreate it)
function EditCharacterName({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isFocused, setIsFocused] = useState(false);
  
  if (!editing) {
    return (
      <button
        className="character-name-edit-btn"
        title="Edit character name"
        onClick={() => setEditing(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#a259f7',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: 4
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path fill="currentColor" d="M20.548 3.452a1.542 1.542 0 0 1 0 2.182l-7.636 7.636-3.273 1.091 1.091-3.273 7.636-7.636a1.542 1.542 0 0 1 2.182 0zM4 21h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-2 0v7H5V6h7a1 1 0 0 0 0-2H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1z"/>
        </svg>
      </button>
    );
  }
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 0, marginRight: 4 }}>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{
          fontSize: '0.95em',
          borderRadius: 8,
          border: isFocused ? '1px solid #a259f7' : '1px solid #4a4370',
          padding: '4px 8px',
          marginRight: 4,
          minWidth: 80,
          maxWidth: 120,
          background: '#3a335a',
          color: '#e6e0ff',
          boxShadow: isFocused ? '0 0 0 2px rgba(162, 89, 247, 0.3), 0 0 10px rgba(255, 255, 255, 0.15)' : 'none',
          transition: 'all 0.25s ease',
          outline: 'none'
        }}
        autoFocus
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(value); setEditing(false); }
          if (e.key === 'Escape') { setEditing(false); setValue(name); }
        }}
      />
      <button
        style={{ 
          background: '#a259f7', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 8, 
          padding: '4px 8px', 
          marginRight: 4, 
          cursor: 'pointer', 
          fontSize: '0.95em',
          boxShadow: '0 2px 6px rgba(162, 89, 247, 0.3)',
          transition: 'all 0.2s ease'
        }}
        onClick={() => { onSave(value); setEditing(false); }}
        title="Save"
        onMouseOver={e => { e.currentTarget.style.background = '#b47aff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#a259f7'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        ✔
      </button>
      <button
        style={{ 
          background: 'transparent', 
          color: '#a259f7', 
          border: '1px solid #a259f7', 
          borderRadius: 8, 
          padding: '4px 8px', 
          cursor: 'pointer', 
          fontSize: '0.95em',
          transition: 'all 0.2s ease'
        }}
        onClick={() => { setEditing(false); setValue(name); }}
        title="Cancel"
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(162, 89, 247, 0.1)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        ✖
      </button>
    </span>
  );
}

function InputPage() {  const navigate = useNavigate();  const { userCode, isLoggedIn, handleDeleteAccount } = useAuth();  const {    characters,    setCharacters,    newCharName,    setNewCharName,    selectedCharIdx,    setSelectedCharIdx,    error,    setError,    isLoading,    cloneError,    setCloneError,    showUndo,    undoData,    fileInputRef,    importError,    setImportError,    importSuccess,    setImportSuccess,    sortedBossData,    getAvailablePartySizes,    getBossDifficulties,    handleCharacterChange,    addCharacter,    removeCharacter,    handleUndo,    toggleBoss,    updateCharacterName,    updatePartySize,  } = useAppData();

  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);

  // Redirect if not logged in
  if (!isLoggedIn) {
    navigate('/login', { replace: true });
    return null;
  }

  // Handle export (simplified version)
  const handleExport = async () => {
    try {
      const { exportUserData } = await import('../pitched-data-service');
      const result = await exportUserData(userCode);
      
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `maplestory-boss-calc-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      setImportError('Failed to export data. Please try again.');
      setTimeout(() => setImportError(''), 5000);
    }
  };

  // Handle import (simplified version)
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedJson = JSON.parse(e.target.result);
        
        const { importUserData } = await import('../pitched-data-service');
        const result = await importUserData(userCode, importedJson);
        
        if (!result.success) throw new Error(result.error);
        
        setImportSuccess(true);
        setTimeout(() => {
          setImportSuccess(false);
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Import error:', error);
        setImportError(error.message || 'Invalid data file. Please check the format and try again.');
        setTimeout(() => setImportError(''), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Clone character function
  const cloneCharacter = (idx) => {
    if (characters.length >= LIMITS.CHARACTER_CAP) {
      setCloneError('Cannot clone: Maximum character limit reached');
      setTimeout(() => setCloneError(''), 3000);
      return;
    }

    const charToClone = characters[idx];
    if (!charToClone) return;

    const totalCrystals = characters.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0);
    const cloneCrystals = charToClone.bosses ? charToClone.bosses.length : 0;

    if (totalCrystals + cloneCrystals > 180) {
      setCloneError('Cannot clone: Would exceed 180 crystal limit');
      setTimeout(() => setCloneError(''), 3000);
      return;
    }

    const clonedChar = {
      ...charToClone,
      name: `${charToClone.name} (Copy)`,
      bosses: [...(charToClone.bosses || [])]
    };

    setCharacters([...characters, clonedChar]);
  };

  // Handle delete account
  const handleDeleteAccountWrapper = async () => {
    setShowDeleteLoading(true);
    setDeleteError('');
    try {
      const result = await handleDeleteAccount();
      if (result.success) {
        setShowDeleteConfirm(false);
        navigate('/login', { replace: true });
      } else {
        setDeleteError(result.error);
      }
    } catch (error) {
      setDeleteError('Failed to delete account. Try again.');
      console.error('Delete error:', error);
    } finally {
      setShowDeleteLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem 0',
      width: '100%',
      paddingTop: '5rem' // Add space for the navbar
    }}>
      <Navbar 
        currentPage="calculator" 
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/bluecrystal.png" alt="Blue Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" style={{ width: 32, height: 32 }} />
      </div>
      
      <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2.2rem', marginBottom: '0.5rem' }}>
        Character & Boss Configuration
      </h1>
      
      <p style={{ color: '#6a11cb', textAlign: 'center', marginBottom: '1rem', fontSize: '1.1rem' }}>
        Create characters, configure boss difficulties and party sizes for your weekly runs!
      </p>
      
      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Tooltip text="Export all character data as a backup file">
          <button 
            onClick={handleExport} 
            style={{ 
              background: '#805ad5', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              padding: '0.5rem 1.2rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Backup Data
          </button>
        </Tooltip>
        
        <Tooltip text="Import character data from a backup file">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            style={{ 
              background: '#a259f7', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              padding: '0.5rem 1.2rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Restore Backup
          </button>
        </Tooltip>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          style={{ display: 'none' }}
        />
      </div>

      {/* Success/Error Messages */}
      {importError && (
        <div style={{ 
          color: '#ff8383', 
          marginBottom: '1rem', 
          textAlign: 'center', 
          padding: '10px', 
          background: '#3a335a', 
          borderRadius: '6px', 
          maxWidth: '600px', 
          margin: '0 auto 20px auto' 
        }}>
          {importError}
        </div>
      )}
      
      {importSuccess && (
        <div style={{ 
          color: '#83ff9b', 
          marginBottom: '1rem', 
          textAlign: 'center', 
          padding: '10px', 
          background: '#3a335a', 
          borderRadius: '6px', 
          maxWidth: '600px', 
          margin: '0 auto 20px auto' 
        }}>
          Data backup operation successful!
        </div>
      )}

      {/* Main Content */}
      <div className="table-container" style={{ 
        background: '#2d2540', 
        borderRadius: 8, 
        boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)', 
        padding: '1rem', 
        border: '1.5px solid #2d2540', 
        maxWidth: 800, 
        margin: '0 auto' 
      }}>
        {error && <div style={{ color: 'red', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}
        
        {/* Character Creation Section */}
        <div style={{ 
          margin: '2rem 0', 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <input
            type="text"
            value={newCharName}
            onChange={e => setNewCharName(e.target.value)}
            placeholder="Character name"
            style={{ 
              padding: '0.5rem', 
              borderRadius: '6px', 
              border: '1px solid #3a335a', 
              minWidth: '180px', 
              fontSize: '1rem', 
              background: '#3a335a', 
              color: '#e6e0ff',
              outline: 'none',
              boxShadow: 'none',
            }}
            onKeyDown={e => e.key === 'Enter' && addCharacter()}
          />
          <button
            onClick={addCharacter}
            disabled={!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP}
            style={{ 
              background: (!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP) ? '#555' : '#a259f7', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              padding: '0.5rem 1rem', 
              cursor: (!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP) ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold', 
              fontSize: '1rem',
              opacity: (!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP) ? 0.6 : 1
            }}
          >
            Add Character
          </button>
        </div>

        {characters.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            color: '#888', 
            fontSize: '1.2rem', 
            textAlign: 'center', 
            background: '#23203a', 
            borderRadius: '8px', 
            margin: '1rem 0' 
          }}>
            <span role="img" aria-label="sparkles">✨</span> Welcome! Add your first character to get started.
          </div>
        ) : (
          <>
            {/* Character Management Section */}
            <div className="char-header-row" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginBottom: 16, 
              justifyContent: 'center', 
              position: 'relative' 
            }}>
              {cloneError && (
                <div style={{ 
                  color: '#ffbaba', 
                  background: '#3a335a', 
                  borderRadius: 6, 
                  padding: '6px 16px', 
                  fontSize: '1em', 
                  fontWeight: 500, 
                  marginBottom: 4, 
                  boxShadow: '0 2px 8px #ffbaba22', 
                  transition: 'opacity 0.3s', 
                  position: 'absolute', 
                  top: -36, 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  zIndex: 20 
                }}>
                  {cloneError}
                </div>
              )}
              
              {selectedCharIdx !== null && characters[selectedCharIdx] && (
                <EditCharacterName
                  name={characters[selectedCharIdx].name}
                  onSave={newName => updateCharacterName(selectedCharIdx, newName)}
                />
              )}
              
              <select
                value={selectedCharIdx ?? ''}
                onChange={handleCharacterChange}
                style={{
                  background: '#3a335a',
                  color: '#e6e0ff',
                  border: '1px solid #3a335a',
                  borderRadius: 10,
                  fontSize: '1.1em',
                  minWidth: 140,
                  height: 36,
                  boxShadow: 'none',
                  textAlign: 'center',
                  textAlignLast: 'center',
                  paddingRight: 20,
                  outline: 'none',
                }}
              >
                <option value="">Select a Character</option>
                {characters.map((char, idx) => (
                  <option key={idx} value={idx}>{char.name}</option>
                ))}
              </select>
              
              {selectedCharIdx !== null && (
                <>
                  <Tooltip text="Clone this character (max 180 crystals)">
                    <button 
                      className="boton-elegante clone" 
                      onClick={() => cloneCharacter(selectedCharIdx)}
                    >
                      Clone
                    </button>
                  </Tooltip>
                  
                  <Tooltip text="Delete this character">
                    <button 
                      className="boton-elegante delete" 
                      onClick={() => removeCharacter(selectedCharIdx)}
                    >
                      Delete
                    </button>
                  </Tooltip>
                </>
              )}
            </div>

            {/* Total Crystals Counter */}
            {selectedCharIdx !== null && characters[selectedCharIdx] && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: 16,
                background: '#352d58',
                borderRadius: 12,
                padding: '10px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                maxWidth: '200px',
                margin: '0 auto 16px auto',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 700, fontSize: '1.2em', color: '#d4c1ff' }}>
                  <span style={{ color: '#a259f7' }}>
                    {characters.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0)}
                  </span>
                  <span style={{ opacity: 0.8 }}> / 180</span>
                </div>
                <div style={{ fontSize: '0.8em', color: '#9d8bbc', marginTop: 4 }}>
                  Total Crystals
                </div>
              </div>
            )}

            {/* Boss Selection Table */}
            {selectedCharIdx !== null && characters[selectedCharIdx] ? (
              <div style={{ marginTop: '1rem' }}>
                <div className="table-scroll">
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    minWidth: 700, 
                    border: '1px solid #2d2540', 
                    borderRadius: 12, 
                    overflow: 'hidden' 
                  }}>
                    <thead>
                      <tr style={{ background: '#3a2a5d', color: '#e6e0ff' }}>
                        <th style={{ 
                          padding: '6px 12px', 
                          textAlign: 'left', 
                          fontWeight: 600, 
                          fontSize: '0.9em', 
                          minWidth: 70 
                        }}>
                          Boss
                        </th>
                        <th style={{ 
                          padding: '6px 0px', 
                          textAlign: 'left', 
                          fontWeight: 600, 
                          fontSize: '0.9em', 
                          minWidth: 90 
                        }}>
                          Difficulty
                        </th>
                        <th className="boss-table-price" style={{ 
                          padding: '6px 12px', 
                          textAlign: 'center', 
                          fontWeight: 600, 
                          fontSize: '0.9em', 
                          minWidth: 70 
                        }}>
                          Mesos
                        </th>
                        <th className="boss-table-controls" style={{ 
                          padding: '6px 2px', 
                          textAlign: 'center', 
                          fontWeight: 600, 
                          fontSize: '0.9em', 
                          minWidth: 160 
                        }}>
                          {selectedCharIdx !== null ? characters[selectedCharIdx]?.name : 'Selected Character'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBossData.map((boss, bidx) => {
                        const difficulties = getBossDifficulties(boss);
                        const selected = selectedCharIdx !== null ? characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name) : null;
                        
                        return (
                          <tr 
                            key={bidx} 
                            style={{ 
                              background: bidx % 2 === 0 ? '#23203a' : '#201c32', 
                              border: '1px solid #3a335a',
                              color: '#e6e0ff',
                              transition: 'background-color 0.2s ease, transform 0.2s ease',
                              cursor: 'pointer'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#2a2540'}
                            onMouseOut={e => e.currentTarget.style.background = bidx % 2 === 0 ? '#23203a' : '#201c32'}
                            onClick={(e) => {
                              // Only trigger if the click wasn't on a form control
                              if (!e.target.closest('select') && !e.target.closest('.checkbox-wrapper') && !e.target.closest('input')) {
                                if (selected) {
                                  toggleBoss(selectedCharIdx, boss.name, '');
                                } else {
                                  toggleBoss(selectedCharIdx, boss.name, difficulties[0]);
                                }
                              }
                            }}
                          >
                            <td style={{ 
                              padding: '8px 2px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 8, 
                              minWidth: 70 
                            }}>
                              {boss.image && (
                                <img 
                                  src={boss.image} 
                                  alt={boss.name} 
                                  loading="lazy"
                                  style={{ 
                                    width: 40, 
                                    height: 40, 
                                    objectFit: 'contain', 
                                    borderRadius: 6, 
                                    background: '#fff1', 
                                    marginRight: 8,
                                    transition: 'transform 0.2s ease'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                              )}
                              <span className="boss-name" style={{ 
                                fontWeight: 600, 
                                fontSize: '1.05em' 
                              }}>
                                {boss.name}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '8px 2px', 
                              textAlign: 'left', 
                              minWidth: 90 
                            }}>
                              <span style={{ 
                                color: undefined, 
                                fontWeight: 500 
                              }}>
                                {selected ? selected.difficulty : '—'}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '8px 12px', 
                              textAlign: 'center', 
                              minWidth: 70 
                            }}>
                              <span style={{ 
                                color: '#6a11cb', 
                                fontWeight: 600 
                              }}>
                                {selected 
                                  ? Math.floor(getBossPrice(boss, selected.difficulty) / (selected.partySize || 1)).toLocaleString()
                                  : '-'
                                }
                              </span>
                            </td>
                            <td className="boss-table-controls" style={{ 
                              padding: '8px 2px', 
                              textAlign: 'center', 
                              minWidth: 160, 
                              background: 'inherit', 
                              verticalAlign: 'middle' 
                            }}>
                              {selectedCharIdx !== null && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6 }}>
                                  <div className="checkbox-wrapper" style={{ marginRight: 4, transform: 'scale(0.8)' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!selected}
                                      onClick={e => e.stopPropagation()}
                                      onChange={() => {
                                        if (selected) {
                                          toggleBoss(selectedCharIdx, boss.name, '');
                                        } else {
                                          toggleBoss(selectedCharIdx, boss.name, difficulties[0]);
                                        }
                                      }}
                                    />
                                    <svg viewBox="0 0 35.6 35.6">
                                      <circle className="background" cx="17.8" cy="17.8" r="17.8"></circle>
                                      <circle className="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
                                      <polyline className="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
                                    </svg>
                                  </div>
                                  {selected && (
                                    <>
                                      <select
                                        className="boss-table-difficulty"
                                        value={selected.difficulty}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                          toggleBoss(selectedCharIdx, boss.name, e.target.value);
                                        }}
                                        style={{ 
                                          marginLeft: 0, 
                                          height: 32, 
                                          borderRadius: 6, 
                                          border: '1px solid #3a335a', 
                                          background: '#3a335a', 
                                          color: '#e6e0ff', 
                                          fontWeight: 600,
                                          paddingRight: 18,
                                          cursor: 'pointer',
                                          minWidth: 90,
                                          maxWidth: 120,
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          boxSizing: 'border-box',
                                          fontSize: '1rem',
                                        }}
                                      >
                                        {difficulties.map(diff => (
                                          <option key={diff} value={diff}>{diff}</option>
                                        ))}
                                      </select>
                                      <select
                                        className="party-size-dropdown boss-table-party-size"
                                        value={selected.partySize || 1}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                          updatePartySize(selectedCharIdx, boss.name, selected.difficulty, parseInt(e.target.value));
                                        }}
                                        style={{ 
                                          marginLeft: 4, 
                                          height: 32, 
                                          borderRadius: 6, 
                                          border: '1px solid #3a335a', 
                                          background: '#3a335a', 
                                          color: '#e6e0ff', 
                                          fontWeight: 600, 
                                          textAlign: 'center',
                                          fontSize: '1rem',
                                          boxSizing: 'border-box',
                                          appearance: 'none',
                                          WebkitAppearance: 'none',
                                          width: 44,
                                          minWidth: 44,
                                          padding: '0 10px 0 6px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {getAvailablePartySizes(boss.name, selected.difficulty).map(size => (
                                          <option key={size} value={size}>{size}</option>
                                        ))}
                                      </select>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '2rem', 
                color: '#888', 
                fontSize: '1.1rem', 
                textAlign: 'center' 
              }}>
                Select a character to manage their bosses.
              </div>
            )}
          </>
        )}
      </div>

      {/* Undo Snackbar */}
      {showUndo && undoData && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#23203a',
          color: '#fff',
          borderRadius: 8,
          padding: '1rem 2rem',
          fontWeight: 700,
          fontSize: '1.1rem',
          boxShadow: '0 4px 24px #0006',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          gap: 18
        }}>
          Character deleted.
          <button
            onClick={handleUndo}
            style={{
              background: '#a259f7',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.5rem 1.2rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: 'pointer',
              marginLeft: 12
            }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(40,32,74,0.92)',
            zIndex: 4000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="modal-fade"
            style={{
              background: '#2d2540',
              borderRadius: 12,
              padding: '2.5rem 2rem',
              maxWidth: 600,
              color: '#e6e0ff',
              boxShadow: '0 4px 24px #0006',
              position: 'relative',
              minWidth: 320,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                outline: 'none',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'text-shadow 0.2s ease, color 0.2s ease'
              }}
              title="Close"
            >
              ×
            </button>
            <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 24 }}>Help & FAQ</h2>
            
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Getting Started</h3>
              <p style={{ marginBottom: 8 }}>1. Create an account or log in with your existing code</p>
              <p style={{ marginBottom: 8 }}>2. Add characters using the input field at the top</p>
              <p style={{ marginBottom: 8 }}>3. Select a character and choose their bosses</p>
              <p style={{ marginBottom: 8 }}>4. Adjust party sizes for each boss as needed</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Weekly Tracker</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Progress bar:</strong> Shows current mesos earned vs. maximum possible mesos</p>
              <p style={{ marginBottom: 8 }}>• <strong>Hide completed:</strong> Toggle to hide characters with all bosses cleared</p>
              <p style={{ marginBottom: 8 }}>• <strong>Character summary:</strong> Shows each character's completion status</p>
              <p style={{ marginBottom: 8 }}>• <strong>Tick All button:</strong> Quickly mark all bosses as completed for a character</p>
              <p style={{ marginBottom: 8 }}>• <strong>Reset timer:</strong> Shows time until the weekly reset (Thursday 00:00 UTC)</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Export / Import</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Export:</strong> Creates a JSON file with all your character data and presets</p>
              <p style={{ marginBottom: 8 }}>• <strong>Import:</strong> Loads character data and presets from a previously exported file</p>
              <p style={{ marginBottom: 8 }}>• <strong>Backup regularly:</strong> Export your data periodically as a backup</p>
              <p style={{ marginBottom: 8 }}>• <strong>Transfer between devices:</strong> Export from one device and import on another</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Other Features</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Cloud saving:</strong> Data is automatically saved to the cloud with your account</p>
              <p style={{ marginBottom: 8 }}>• <strong>Page memory:</strong> The app remembers which page you were on last</p>
              <p style={{ marginBottom: 8 }}>• <strong>Character editing:</strong> Click the pencil icon to edit a character's name</p>
              <p style={{ marginBottom: 8 }}>• <strong>Cloning:</strong> Create an exact copy of a character with the Clone button</p>
              <p style={{ marginBottom: 8 }}>• <strong>Party size:</strong> Adjust the party size for each boss to calculate split mesos</p>
            </div>

            <div>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Quick Tips</h3>
              <p style={{ marginBottom: 8 }}>• Hover over buttons and elements for helpful tooltips</p>
              <p style={{ marginBottom: 8 }}>• Click on a boss row to toggle selection (not just the checkbox)</p>
              <p style={{ marginBottom: 8 }}>• Use the Price Table to see all boss values sorted by price</p>
              <p style={{ marginBottom: 8 }}>• Save your account code somewhere safe - you'll need it to log in!</p>
              <p style={{ marginBottom: 8 }}>• Weekly reset happens every Thursday at 00:00 UTC</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(40,32,74,0.96)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-fade" style={{
            background: '#2d2540',
            borderRadius: 16,
            padding: '3rem 2.5rem',
            maxWidth: 480,
            color: '#e6e0ff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            position: 'relative',
            minWidth: 360,
            textAlign: 'center',
            border: '2px solid #ff6b6b'
          }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ color: '#ff6b6b', fontWeight: 700, marginBottom: 20, fontSize: '1.5rem' }}>Delete Account</h2>
            <div style={{ 
              background: 'rgba(255, 107, 107, 0.1)', 
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: 12, 
              padding: '20px', 
              marginBottom: 28 
            }}>
              <p style={{ marginBottom: 0, fontSize: '1.1rem', lineHeight: '1.5', color: '#ffbaba' }}>
                <strong>This will permanently delete your account and all associated data.</strong>
                <br />
                This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={showDeleteLoading}
                style={{
                  background: showDeleteLoading ? '#2a2540' : '#3a335a',
                  color: showDeleteLoading ? '#888' : '#e6e0ff',
                  border: showDeleteLoading ? '1px solid #2a2540' : '2px solid #4a4370',
                  borderRadius: 12,
                  padding: '0.8rem 2rem',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  cursor: showDeleteLoading ? 'not-allowed' : 'pointer',
                  minWidth: 140,
                  transition: 'all 0.2s ease',
                  opacity: showDeleteLoading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountWrapper}
                disabled={showDeleteLoading}
                style={{
                  background: showDeleteLoading ? '#cc5555' : 'linear-gradient(135deg, #ff6b6b, #ff4757)',
                  color: '#fff',
                  border: '2px solid #ff6b6b',
                  borderRadius: 12,
                  padding: '0.8rem 2rem',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  cursor: showDeleteLoading ? 'not-allowed' : 'pointer',
                  opacity: showDeleteLoading ? 0.7 : 1,
                  minWidth: 140,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: showDeleteLoading ? 'none' : '0 4px 16px rgba(255, 107, 107, 0.3)'
                }}
              >
                {showDeleteLoading && (
                  <div style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {showDeleteLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
            {deleteError && (
              <div style={{ 
                color: '#ff6b6b', 
                marginTop: 20, 
                fontWeight: 600,
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: 8,
                padding: '12px 16px'
              }}>
                {deleteError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InputPage; 