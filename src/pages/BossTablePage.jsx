import { useState, useEffect } from 'react';
import { useAuthentication } from '../hooks/useAuthentication';
import { useViewTransition } from '../hooks/useViewTransition';
import Navbar from '../components/Navbar';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';
import { HelpModal, DeleteAccountModal, BossTableHelpContent } from '../features/common/PageModals';
import '../styles/boss-price-table.css';
import { logger } from '../utils/logger';

function BossTablePage() {
  const { navigate } = useViewTransition();
  const { isLoggedIn, handleDeleteAccount } = useAuthentication();

  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);
  
  // Boss data from database
  const [bossData, setBossData] = useState([]);
  const [isLoadingBossData, setIsLoadingBossData] = useState(true);

  // Load boss data from database
  useEffect(() => {
    // Enhanced guard: Only load data if user is logged in
    if (!isLoggedIn) {
      logger.debug('BossTablePage: Skipping boss data load - user not logged in');
      setIsLoadingBossData(false);
      setBossData([]);
      return;
    }
    
    let isMounted = true;
    let abortController = new AbortController();
    
    const loadBossData = async () => {
      // Additional auth check before starting async operation
      if (!isLoggedIn || abortController.signal.aborted) {
        logger.debug('BossTablePage: Aborting boss data load - auth state invalid');
        return;
      }
      
      try {
        setIsLoadingBossData(true);
        
        // Check auth state before importing service
        if (!isLoggedIn || abortController.signal.aborted) {
          logger.debug('BossTablePage: Aborting before service import');
          return;
        }
        
        const { getBossDataForFrontend } = await import('../services/bossRegistryService.js');
        
        // Final auth check before API call
        if (!isLoggedIn || abortController.signal.aborted || !isMounted) {
          logger.debug('BossTablePage: Aborting before API call');
          return;
        }
        
        const result = await getBossDataForFrontend();
        
        // Check auth state before processing result
        if (!isLoggedIn || abortController.signal.aborted || !isMounted) {
          logger.debug('BossTablePage: Aborting before processing result');
          return;
        }
        
        if (result.success) {
          setBossData(result.data);
        } else {
          console.error('Failed to load boss data:', result.error);
          setBossData([]);
        }
      } catch (error) {
        if (!abortController.signal.aborted && isLoggedIn && isMounted) {
          console.error('Error loading boss data:', error);
          setBossData([]);
        }
      } finally {
        if (isMounted && isLoggedIn && !abortController.signal.aborted) {
          setIsLoadingBossData(false);
        }
      }
    };
    
    loadBossData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [isLoggedIn]); // Add isLoggedIn dependency to react to auth changes

  // Redirect if not logged in - handled by ProtectedRoute in App.jsx
  // Don't call navigate directly here to prevent navigation throttling
  if (!isLoggedIn) {
    return null; // Let ProtectedRoute component handle the redirect
  }

  // Handle delete account
  const handleDeleteAccountWrapper = async () => {
    setShowDeleteLoading(true);
    setDeleteError('');
    try {
      const result = await handleDeleteAccount();
      if (result.success) {
        setShowDeleteConfirm(false);
        // Navigation is now handled by the authentication hook
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

  // Prepare boss data for display
  const allBossDiffs = bossData.flatMap(boss =>
    boss.difficulties.map(diff => ({
      boss,
      difficulty: diff.difficulty,
      price: diff.price
    }))
  ).sort((a, b) => b.price - a.price);

  return (
    <div className="boss-price-page">
      <Navbar
        currentPage="bosstable"
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      
      <ViewTransitionWrapper>
        <div className="boss-price-main fade-in">
          <div className="boss-price-header">
            <h2 className="boss-price-title">Boss Crystal Price Table</h2>
          </div>
          
          <div className="boss-price-container">
            <div className="boss-price-grid">
              {/* Header */}
              <div className="boss-price-header-row">
                <div className="boss-price-header-cell boss-col">Boss</div>
                <div className="boss-price-header-cell difficulty-col">Difficulty</div>
                <div className="boss-price-header-cell price-col">Mesos</div>
              </div>
              
              {/* Body */}
              {isLoadingBossData ? (
                <div className="boss-price-loading">Loading boss data...</div>
              ) : (
                allBossDiffs.map((item, index) => (
                  <div 
                    key={`${item.boss.name}-${item.difficulty}`}
                    className={`boss-price-row ${index % 2 === 0 ? 'even' : 'odd'}`}
                  >
                    <div className="boss-price-cell boss-col">
                      <div className="boss-price-info">
                        {item.boss.image && (
                          <img 
                            src={item.boss.image} 
                            alt={item.boss.name}
                            className="boss-price-image"
                          />
                        )}
                        <span className="boss-price-name">{item.boss.name}</span>
                      </div>
                    </div>
                    <div className="boss-price-cell difficulty-col">
                      <span className="boss-price-difficulty">{item.difficulty}</span>
                    </div>
                    <div className="boss-price-cell price-col">
                      <span className="boss-price-mesos">{item.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ViewTransitionWrapper>

      <HelpModal
        showHelp={showHelp}
        onClose={() => setShowHelp(false)}
      >
        <BossTableHelpContent />
      </HelpModal>
      
      <DeleteAccountModal
        showDeleteConfirm={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccountWrapper}
        showDeleteLoading={showDeleteLoading}
        deleteError={deleteError}
      />
    </div>
  );
}

export default BossTablePage; 