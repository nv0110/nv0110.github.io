import { useState, useEffect, Suspense, lazy } from 'react';
import { useAuthentication } from '../../hooks/useAuthentication';
import { useViewTransition } from '../hooks/useViewTransition';
import { useAppData } from '../hooks/AppDataContext.jsx';
import { useQuickSelect } from '../hooks/useQuickSelect';
import { LIMITS } from '../constants';
import Navbar from '../components/Navbar';
import ActionButtons from '../components/ActionButtons';
import QuickSelectModal from '../components/QuickSelectModal';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';
import PageLoader from '../components/PageLoader';
import { logger } from '../utils/logger';
import '../styles/components/page-loader.css';
import CharacterManagementContainer from '../components/CharacterManagementContainer';

// Lazy load DataBackup component
const DataBackup = lazy(() => import('../components/DataBackup'));

function InputPage() {
  const { navigate } = useViewTransition();
  const { userCode, isLoggedIn, handleDeleteAccount } = useAuthentication();
  const {
    characterBossSelections,
    setCharacterBossSelections,
    newCharName,
    setNewCharName,
    selectedCharIdx,
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
    showCrystalCapError,
    isLoading,
    copyCharacter,
  } = useAppData();

  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);
  const [showQuickSelectModal, setShowQuickSelectModal] = useState(false);

  // Custom hooks
  const quickSelectHook = useQuickSelect();

  // Redirect if not logged in - using useEffect to prevent navigation during render
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Handle export (simplified version)
  const handleExport = async () => {
    try {
      const { exportUserData } = await import('../../services/utilityService.js');
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
      logger.error('Export error:', error);
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
        
        const { importUserData } = await import('../../services/utilityService.js');
        const result = await importUserData(userCode, importedJson);
        
        if (!result.success) throw new Error(result.error);
        
        setImportSuccess(true);
        setTimeout(() => {
          setImportSuccess(false);
          window.location.reload();
        }, 2000);
      } catch (error) {
        logger.error('Import error:', error);
        setImportError(error.message || 'Invalid data file. Please check the format and try again.');
        setTimeout(() => setImportError(''), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Clone character function - UPDATED to use new service
  const cloneCharacter = async (idx) => {
    if (characterBossSelections.length >= LIMITS.CHARACTER_CAP) {
      setCloneError('Cannot clone: Maximum character limit reached');
      setTimeout(() => setCloneError(''), 3000);
      return;
    }

    const charToClone = characterBossSelections[idx];
    if (!charToClone) {
      logger.error('🔄 CLONE: Character to clone not found at index:', idx);
      return;
    }

    const totalCrystals = characterBossSelections.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0);
    const cloneCrystals = charToClone.bosses ? charToClone.bosses.length : 0;

    if (totalCrystals + cloneCrystals > LIMITS.CRYSTAL_CAP) {
      setCloneError(`Cannot clone: Would exceed ${LIMITS.CRYSTAL_CAP} crystal limit`);
      setTimeout(() => setCloneError(''), 3000);
      return;
    }

    try {
      // Import necessary services
      const { addCharacterToWeeklySetup, updateCharacterBossConfigInWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const clonedName = `${charToClone.name} (Copy)`;
      
      // 1. Add the character to user_boss_data
      const addResult = await addCharacterToWeeklySetup(userCode, currentWeekStart, clonedName);
      
      if (!addResult.success) {
        setCloneError(addResult.error || 'Failed to clone character');
        setTimeout(() => setCloneError(''), 3000);
        return;
      }

      // 2. If the original character has bosses, clone their boss configuration
      if (charToClone.bosses && charToClone.bosses.length > 0) {
        try {
          // Convert bosses array to boss config string format using new mapping utility
          const { convertBossesToConfigString } = await import('../utils/bossCodeMapping.js');
          const bossConfigString = await convertBossesToConfigString(charToClone.bosses);

          const configResult = await updateCharacterBossConfigInWeeklySetup(
            userCode,
            currentWeekStart,
            addResult.characterIndex,
            bossConfigString
          );

          if (!configResult.success) {
            logger.warn('Failed to clone boss configuration:', configResult.error);
            // Don't fail the whole operation, just log warning
          }
        } catch (error) {
          logger.error('Error converting boss configuration for clone:', error);
          // Don't fail the whole operation, just log error
        }
      }

      // 3. Update local state
      const clonedChar = {
        ...charToClone,
        name: clonedName,
        index: addResult.characterIndex,
        bosses: [...(charToClone.bosses || [])]
      };

      const newCharacterBossSelections = [...characterBossSelections, clonedChar];
      setCharacterBossSelections(newCharacterBossSelections);
      
      logger.info('✅ CLONE: Character successfully cloned using new service');
      
    } catch (error) {
      logger.error('❌ CLONE: Error cloning character:', error);
      setCloneError('Failed to clone character');
      setTimeout(() => setCloneError(''), 3000);
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
      logger.error('Delete error:', error);
    } finally {
      setShowDeleteLoading(false);
    }
  };

  // Get all bosses sorted by highest price (using database-driven boss data)
  const getSortedBossesByPrice = () => {
    // Use sortedBossData from useAppData which comes from database
    return sortedBossData || [];
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

  const handleCloseQuickSelectModal = () => {
    setShowQuickSelectModal(false);
    quickSelectHook.setQuickSelectBosses({});
    quickSelectHook.setQuickSelectError('');
  };

  return (
    <div className="page-container">
      <Navbar
        currentPage="calculator"
        onExport={handleExport}
        onImport={handleImport}
        fileInputRef={fileInputRef}
      />
      
      <div className="page-header-container fade-in">
        <h1 className="page-title-main">
          Character and Boss Configuration
        </h1>
        {selectedCharIdx !== '' && characterBossSelections[selectedCharIdx] && (
          <div className="boss-config-description">
            <p>Configure bosses, difficulties, and party sizes for <strong>{characterBossSelections[selectedCharIdx].name}</strong></p>
          </div>
        )}
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
          {isLoading ? (
            <PageLoader />
          ) : (
          <CharacterManagementContainer
            // Character data
                characterBossSelections={characterBossSelections}
            selectedCharIdx={selectedCharIdx}
                newCharName={newCharName}
            
            // Character operations
            handleCharacterChange={handleCharacterChange}
            addCharacter={addCharacter}
            removeCharacter={removeCharacter}
                setNewCharName={setNewCharName}
            
            // Boss data and operations
                  sortedBossData={sortedBossData}
            toggleBoss={toggleBoss}
            updatePartySize={updatePartySize}
            
            // Quick select
            onQuickSelectClick={() => setShowQuickSelectModal(true)}
            
            // Utilities
                  getBossDifficulties={getBossDifficulties}
                  getAvailablePartySizes={getAvailablePartySizes}
            formatPrice={formatPrice}
            
            // Crystal tracking
            totalBossCount={characterBossSelections.reduce((sum, char) => sum + (char.bosses?.length || 0), 0)}
            
            // Validation and errors
            cloneError={cloneError}
            showCrystalCapError={showCrystalCapError}
            
            // Character copy functionality
            onCopyCharacter={copyCharacter}
                />
              )}
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
              <p>• <strong>Quick Select:</strong> Use Quick Select for easy boss setup</p>
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
              <p>• Use Quick Select to efficiently set up your boss lists</p>
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
        updateQuickSelectPartySize={quickSelectHook.updateQuickSelectPartySize}
        applyQuickSelection={() => {
          quickSelectHook.applyQuickSelection(selectedCharIdx, characterBossSelections, batchSetBosses);
          setShowQuickSelectModal(false);
        }}
        resetQuickSelection={quickSelectHook.resetQuickSelection}
        reuseLastQuickSelect={quickSelectHook.reuseLastQuickSelect}
        lastQuickSelectBosses={quickSelectHook.lastQuickSelectBosses}
        selectedCharIdx={selectedCharIdx}
        characterBossSelections={characterBossSelections}
      />

      {/* CSS Animations */}
      <style>{`
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

        .crystal-cap-error-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          pointer-events: none;
          padding: 1rem;
          box-sizing: border-box;
        }
        
        .crystal-cap-error-message {
          background: rgba(40, 32, 74, 0.97);
          color: #fff;
          font-size: 1.25rem;
          font-weight: 600;
          border-radius: 16px;
          box-shadow: 0 4px 32px rgba(128,90,213,0.18);
          padding: 1.5rem 2.5rem;
          border: 1.5px solid #a259f7;
          text-align: center;
          animation: modalFadeIn 0.3s cubic-bezier(.4,2,.6,1);
          letter-spacing: 0.5px;
          max-width: 90vw;
          width: auto;
          min-width: 300px;
        }

        /* Responsive design for crystal cap error */
        @media (min-width: 2560px) {
          .crystal-cap-error-message {
            font-size: 1.5rem;
            padding: 2rem 3rem;
            border-radius: 20px;
            min-width: 400px;
          }
        }

        @media (min-width: 1920px) and (max-width: 2559px) {
          .crystal-cap-error-message {
            font-size: 1.35rem;
            padding: 1.75rem 2.75rem;
            border-radius: 18px;
            min-width: 350px;
          }
        }

        @media (max-width: 1365px) and (min-width: 769px) {
          .crystal-cap-error-message {
            font-size: 1.1rem;
            padding: 1.25rem 2rem;
            min-width: 280px;
          }
        }

        @media (max-width: 768px) {
          .crystal-cap-error-overlay {
            padding: 0.5rem;
          }
          
          .crystal-cap-error-message {
            font-size: 1rem;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            min-width: 260px;
            max-width: 95vw;
            line-height: 1.4;
          }
        }

        @media (max-width: 480px) {
          .crystal-cap-error-overlay {
            padding: 0.25rem;
          }
          
          .crystal-cap-error-message {
            font-size: 0.9rem;
            padding: 0.75rem 1.25rem;
            border-radius: 10px;
            min-width: 240px;
            max-width: 98vw;
            line-height: 1.3;
          }
        }
      `}</style>
    </div>
  );
}

export default InputPage; 