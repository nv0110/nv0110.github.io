import { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { usePresets } from '../hooks/usePresets';
import { useQuickSelect } from '../hooks/useQuickSelect';
import { bossData, getBossPrice } from '../data/bossData';
import { LIMITS } from '../constants';
import Navbar from '../components/Navbar';
import ActionButtons from '../components/ActionButtons';
import CharacterManagement from '../components/CharacterManagement';
import BossSelectionTable from '../components/BossSelectionTable';
import PresetModal from '../components/PresetModal';
import QuickSelectModal from '../components/QuickSelectModal';

// Lazy load DataBackup component
const DataBackup = lazy(() => import('../components/DataBackup'));

function InputPage() {
  const navigate = useNavigate();
  const { userCode, isLoggedIn, handleDeleteAccount } = useAuth();
  const {
    characters,
    setCharacters,
    newCharName,
    setNewCharName,
    selectedCharIdx,
    setSelectedCharIdx,
    error,
    setError,
    isLoading,
    cloneError,
    setCloneError,
    showUndo,
    undoData,
    fileInputRef,
    importError,
    setImportError,
    importSuccess,
    setImportSuccess,
    sortedBossData,
    getAvailablePartySizes,
    getBossDifficulties,
    handleCharacterChange,
    addCharacter,
    removeCharacter,
    handleUndo,
    toggleBoss,
    updateCharacterName,
    updatePartySize,
    batchSetBosses,
  } = useAppData();

  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showQuickSelectModal, setShowQuickSelectModal] = useState(false);

  // Custom hooks
  const presetHook = usePresets();
  const quickSelectHook = useQuickSelect();

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

  // Get all bosses sorted by highest price
  const getSortedBossesByPrice = () => {
    const bossesWithMaxPrice = bossData.map(boss => {
      const maxPrice = Math.max(...boss.difficulties.map(d => d.price));
      return { ...boss, maxPrice };
    });
    return bossesWithMaxPrice.sort((a, b) => b.maxPrice - a.maxPrice);
  };

  // Utility function to format prices in abbreviated form
  const formatPrice = (price) => {
    if (price >= 1000000000) {
      const billions = price / 1000000000;
      return billions >= 10 ? `${Math.round(billions)}B` : `${billions.toFixed(1)}B`;
    } else if (price >= 1000000) {
      const millions = price / 1000000;
      return millions >= 10 ? `${Math.round(millions)}M` : `${millions.toFixed(1)}M`;
    } else if (price >= 1000) {
      const thousands = price / 1000;
      return thousands >= 10 ? `${Math.round(thousands)}K` : `${thousands.toFixed(1)}K`;
    } else {
      return price.toString();
    }
  };

  // Close handlers for modals
  const handleClosePresetModal = () => {
    setShowPresetModal(false);
    presetHook.setNewPresetName('');
    presetHook.setPresetError('');
    presetHook.setPresetCreationMode(false);
    presetHook.setPresetBosses({});
  };

  const handleCloseQuickSelectModal = () => {
    setShowQuickSelectModal(false);
    quickSelectHook.setQuickSelectBosses({});
    quickSelectHook.setQuickSelectError('');
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
      <ActionButtons
        onExport={handleExport}
        onImport={handleImport}
        onShowPresets={() => setShowPresetModal(true)}
        onShowQuickSelect={() => setShowQuickSelectModal(true)}
        fileInputRef={fileInputRef}
      />

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
        
        {/* Character Management */}
        <CharacterManagement
          characters={characters}
          newCharName={newCharName}
          setNewCharName={setNewCharName}
          selectedCharIdx={selectedCharIdx}
          cloneError={cloneError}
          onCharacterChange={handleCharacterChange}
          onAddCharacter={addCharacter}
          onUpdateCharacterName={updateCharacterName}
          onCloneCharacter={cloneCharacter}
          onRemoveCharacter={removeCharacter}
        />

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
          /* Boss Selection Table */
          <BossSelectionTable
            selectedCharIdx={selectedCharIdx}
            characters={characters}
            sortedBossData={sortedBossData}
            getBossDifficulties={getBossDifficulties}
            getAvailablePartySizes={getAvailablePartySizes}
            onToggleBoss={toggleBoss}
            onUpdatePartySize={updatePartySize}
          />
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
        }}
        onClick={() => setShowDeleteConfirm(false)}
        >
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
          }}
          onClick={e => e.stopPropagation()}
          >
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

      {/* Preset Modal */}
      <PresetModal
        show={showPresetModal}
        onClose={handleClosePresetModal}
        presets={presetHook.presets}
        newPresetName={presetHook.newPresetName}
        setNewPresetName={presetHook.setNewPresetName}
        presetError={presetHook.presetError}
        presetCreationMode={presetHook.presetCreationMode}
        setPresetCreationMode={presetHook.setPresetCreationMode}
        presetBosses={presetHook.presetBosses}
        getSortedBossesByPrice={getSortedBossesByPrice}
        getBossDifficulties={getBossDifficulties}
        formatPrice={formatPrice}
        handlePresetBossSelect={presetHook.handlePresetBossSelect}
        createPreset={() => presetHook.createPreset(selectedCharIdx, characters, batchSetBosses)}
        applyPreset={(preset) => {
          presetHook.applyPreset(preset, selectedCharIdx, characters, batchSetBosses);
          setShowPresetModal(false);
        }}
        deletePreset={presetHook.deletePreset}
        selectedCharIdx={selectedCharIdx}
        characters={characters}
      />

      {/* Quick Select Modal */}
      <QuickSelectModal
        show={showQuickSelectModal}
        onClose={handleCloseQuickSelectModal}
        quickSelectBosses={quickSelectHook.quickSelectBosses}
        quickSelectError={quickSelectHook.quickSelectError}
        getSortedBossesByPrice={getSortedBossesByPrice}
        getBossDifficulties={getBossDifficulties}
        formatPrice={formatPrice}
        handleQuickSelectBoss={quickSelectHook.handleQuickSelectBoss}
        applyQuickSelection={() => {
          quickSelectHook.applyQuickSelection(selectedCharIdx, characters, batchSetBosses);
          setShowQuickSelectModal(false);
        }}
        resetQuickSelection={quickSelectHook.resetQuickSelection}
        selectedCharIdx={selectedCharIdx}
        characters={characters}
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default InputPage; 