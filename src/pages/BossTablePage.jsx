import { useState, useEffect } from 'react';
import { useAuthentication } from '../../hooks/useAuthentication';
import { useViewTransition } from '../hooks/useViewTransition';
import Navbar from '../components/Navbar';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';
import { HelpModal, DeleteAccountModal, BossTableHelpContent } from '../features/common/PageModals';
import '../styles/boss-price-table.css';

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
    const loadBossData = async () => {
      try {
        const { getBossDataForFrontend } = await import('../../services/bossRegistryService.js');
        const result = await getBossDataForFrontend();
        
        if (result.success) {
          setBossData(result.data);
        } else {
          console.error('Failed to load boss data:', result.error);
          setBossData([]);
        }
      } catch (error) {
        console.error('Error loading boss data:', error);
        setBossData([]);
      } finally {
        setIsLoadingBossData(false);
      }
    };
    
    loadBossData();
  }, []);

  // Redirect if not logged in
  if (!isLoggedIn) {
    navigate('/login', { replace: true });
    return null;
  }

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