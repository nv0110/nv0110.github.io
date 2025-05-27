import { useState, Suspense, lazy } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useViewTransition } from '../hooks/useViewTransition';
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
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';

// Lazy load DataBackup component
const DataBackup = lazy(() => import('../components/DataBackup'));

function InputPage() {
  const { navigate } = useViewTransition();
  const { userCode, isLoggedIn, handleDeleteAccount } = useAuth();
  const {
    characterBossSelections,
    setCharacterBossSelections,
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
  const cloneCharacter = async (idx) => {
    // console.log('🔄 CLONE: Starting character clone process for index:', idx);
    
    if (characterBossSelections.length >= LIMITS.CHARACTER_CAP) {
      setCloneError('Cannot clone: Maximum character limit reached');
      setTimeout(() => setCloneError(''), 3000);
      return;
    }

    const charToClone = characterBossSelections[idx];
    if (!charToClone) {
      console.error('🔄 CLONE: Character to clone not found at index:', idx);
      return;
    }

    // console.log('🔄 CLONE: Character to clone:', charToClone);

    const totalCrystals = characterBossSelections.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0);
    const cloneCrystals = charToClone.bosses ? charToClone.bosses.length : 0;

    if (totalCrystals + cloneCrystals > 180) {
      setCloneError('Cannot clone: Would exceed 180 crystal limit');
      setTimeout(() => setCloneError(''), 3000);
      return;
    }

    // Create new character with proper index
    const newIndex = characterBossSelections.length > 0 ? Math.max(...characterBossSelections.map(c => c.index || 0)) + 1 : 0;
    const clonedChar = {
      ...charToClone,
      name: `${charToClone.name} (Copy)`,
      index: newIndex, // Assign new unique index
      bosses: [...(charToClone.bosses || [])]
    };

    // console.log('🔄 CLONE: Cloned character created:', clonedChar);

    const newCharacterBossSelections = [...characterBossSelections, clonedChar];
    setCharacterBossSelections(newCharacterBossSelections);

    // console.log('🔄 CLONE: Updated characters array:', newCharacterBossSelections.map(c => ({ name: c.name, index: c.index, bosses: c.bosses?.length || 0 })));

    // Save to database - this is the missing piece!
    try {
      // console.log('🔄 CLONE: Saving to database...');
      const { supabase } = await import('../supabaseClient');
      
      // Get current data to preserve existing fields
      const { data: currentData, error: fetchError } = await supabase
        .from('user_data')
        .select('data')
        .eq('id', userCode)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // Merge with existing data to preserve boss_runs and other fields
      const existingData = currentData?.data || {};
      const updatedData = {
        ...existingData,
        characterBossSelections: newCharacterBossSelections,
        lastUpdated: new Date().toISOString()
      };
      
      // console.log('🔄 CLONE: Saving updated data to database:', { 
      //   charactersCount: newCharacterBossSelections.length,
      //   newCharacter: { name: clonedChar.name, index: clonedChar.index }
      // });
      
      const { error: updateError } = await supabase
        .from('user_data')
        .update({ data: updatedData })
        .eq('id', userCode);
        
      if (updateError) {
        throw updateError;
      }
      
      console.log('✅ CLONE: Character successfully cloned and saved to database');
    } catch (error) {
      console.error('❌ CLONE: Error saving cloned character to database:', error);
      setCloneError('Failed to save cloned character to database');
      setTimeout(() => setCloneError(''), 3000);
      
      // Revert local state on database error
      setCharacterBossSelections(characterBossSelections);
    }
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
    <div className="page-container">
      <Navbar 
        currentPage="calculator" 
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      
      <div className="page-header-container fade-in">
        <div className="crystal-images-container">
          <img src="/bosses/crystal.png" alt="Crystal" />
          <img src="/bosses/bluecrystal.png" alt="Blue Crystal" />
          <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" />
        </div>
        
        <h1 className="page-title-main">
          Character & Boss Configuration
        </h1>
        
        <p className="page-description">
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
      </div>

      {/* Success/Error Messages */}
      {importError && (
        <div className="error-message-container">
          {importError}
        </div>
      )}
      
      {importSuccess && (
        <div className="success-message-container">
          Data backup operation successful!
        </div>
      )}

      {/* Main Content */}
      <ViewTransitionWrapper>
        <div className="table-container premium-content-container input-page-container fade-in">
          {error && <div className="character-error-message">{error}</div>}
          
          {/* Character Management */}
          <CharacterManagement
            characterBossSelections={characterBossSelections}
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

          {characterBossSelections.length === 0 ? (
            <div className="empty-state-message">
              <span role="img" aria-label="sparkles">✨</span> Welcome! Add your first character to get started.
            </div>
          ) : (
            /* Boss Selection Table */
            <BossSelectionTable
              selectedCharIdx={selectedCharIdx}
              characterBossSelections={characterBossSelections}
              sortedBossData={sortedBossData}
              getBossDifficulties={getBossDifficulties}
              getAvailablePartySizes={getAvailablePartySizes}
              onToggleBoss={toggleBoss}
              onUpdatePartySize={updatePartySize}
            />
          )}
        </div>
      </ViewTransitionWrapper>

      {/* Undo Snackbar */}
      {showUndo && undoData && (
        <div className="undo-snackbar">
          Character deleted.
          <button
            onClick={handleUndo}
            className="undo-btn"
          >
            Undo
          </button>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="modal-backdrop"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="modal-fade modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              className="modal-close-btn"
              title="Close"
            >
              ×
            </button>
            <h2 className="modal-title">Help & FAQ</h2>
            
            <div className="modal-section-content" style={{ marginBottom: 24 }}>
              <h3 className="modal-section-title">Getting Started</h3>
              <p>1. Create an account or log in with your existing code</p>
              <p>2. Add characters using the input field at the top</p>
              <p>3. Select a character and choose their bosses & difficulties</p>
              <p>4. Head to Weekly Tracker to mark completions and track pitched items!</p>
            </div>

            <div className="modal-section-content" style={{ marginBottom: 24 }}>
              <h3 className="modal-section-title">Boss Selection</h3>
              <p>• <strong>Smart presets:</strong> Use Quick Select or save custom presets for easy setup</p>
              <p>• <strong>Party sizes:</strong> Adjust party size for each boss to calculate split mesos</p>
              <p>• <strong>Clone characters:</strong> Copy a character's entire boss setup instantly</p>
              <p>• <strong>Difficulty matters:</strong> Higher difficulties = more mesos and pitched items</p>
            </div>

            <div className="modal-section-content" style={{ marginBottom: 24 }}>
              <h3 className="modal-section-title">Data Management</h3>
              <p>• <strong>Auto-save:</strong> All changes are automatically saved to the cloud</p>
              <p>• <strong>Export/Import:</strong> Backup your data or transfer between devices</p>
              <p>• <strong>Smart cleanup:</strong> Changing boss selections automatically cleans up old tracking data</p>
            </div>

            <div className="modal-section-content">
              <h3 className="modal-section-title">Quick Tips</h3>
              <p>• Click anywhere on a boss row to toggle selection</p>
              <p>• Use presets to quickly set up multiple characters with similar boss lists</p>
              <p>• Your account code is your login - keep it safe!</p>
              <p>• Check out the Boss Table page to see which bosses give the most mesos</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop modal-backdrop-critical"
        onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="modal-fade modal-content-critical"
          onClick={e => e.stopPropagation()}
          >
            <div className="critical-modal-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="critical-modal-title">Delete Account</h2>
            <div className="critical-modal-warning">
              <p>
                <strong>This will permanently delete your account and all associated data.</strong>
                <br />
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-button-container">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={showDeleteLoading}
                className="modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountWrapper}
                disabled={showDeleteLoading}
                className="modal-btn-critical"
              >
                {showDeleteLoading && (
                  <div className="loading-spinner" />
                )}
                {showDeleteLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
            {deleteError && (
              <div className="modal-error-message">
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
        createPreset={() => presetHook.createPreset(selectedCharIdx, characterBossSelections, batchSetBosses)}
        applyPreset={(preset) => {
          presetHook.applyPreset(preset, selectedCharIdx, characterBossSelections, batchSetBosses);
          setShowPresetModal(false);
        }}
        deletePreset={presetHook.deletePreset}
        selectedCharIdx={selectedCharIdx}
        characterBossSelections={characterBossSelections}
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
          quickSelectHook.applyQuickSelection(selectedCharIdx, characterBossSelections, batchSetBosses);
          setShowQuickSelectModal(false);
        }}
        resetQuickSelection={quickSelectHook.resetQuickSelection}
        selectedCharIdx={selectedCharIdx}
        characterBossSelections={characterBossSelections}
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