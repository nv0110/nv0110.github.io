import { useState, useEffect } from 'react';
import { useAuthentication } from '../../hooks/useAuthentication';
import { useViewTransition } from '../hooks/useViewTransition';
import Navbar from '../components/Navbar';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';
import { HelpModal, DeleteAccountModal, BossTableHelpContent } from '../features/common/PageModals';

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

  return (
    <div className="page-container boss-table-page">
      <Navbar
        currentPage="bosstable"
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      <ViewTransitionWrapper>
        <div className="boss-table-main-container fade-in">
          <div className="boss-table-header-section">
            <h2 className="page-title-secondary">
              Boss Crystal Price Table
            </h2>
          </div>
          
          <div className="boss-table-wrapper-price">
            {/* Fixed Header Table */}
            <div className="boss-table-header-container-price">
              <table className="boss-price-table boss-table-header">
                <thead>
                  <tr className="boss-table-header">
                    <th className="boss-price-table-header-cell">
                      Boss
                    </th>
                    <th className="boss-price-table-header-cell-difficulty">
                      Difficulty
                    </th>
                    <th className="boss-price-table-header-cell-price">
                      Mesos
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Scrollable Body Table */}
            <div className="boss-table-body-container-price">
              <table className="boss-price-table boss-table-body">
                <tbody>
                  {isLoadingBossData ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                        Loading boss data...
                      </td>
                    </tr>
                  ) : (() => {
                    // Flatten all boss-difficulty pairs
                    const allBossDiffs = bossData.flatMap(boss =>
                      boss.difficulties.map(diff => ({
                        boss,
                        difficulty: diff.difficulty,
                        price: diff.price
                      }))
                    );
                    // Sort by price descending
                    allBossDiffs.sort((a, b) => b.price - a.price);
                    return allBossDiffs.map((item, idx) => (
                      <tr 
                        key={item.boss.name + '-' + item.difficulty} 
                        className={idx % 2 === 0 ? 'boss-table-row-even' : 'boss-table-row-odd'}
                      >
                        <td className="boss-price-table-name-cell">
                          {item.boss.image && (
                            <img 
                              src={item.boss.image} 
                              alt={item.boss.name} 
                              className="boss-price-table-image"
                            />
                          )}
                          <span className="boss-price-table-name-text">
                            {item.boss.name}
                          </span>
                        </td>
                        <td className="boss-price-table-difficulty-cell">
                          <span className="boss-price-table-difficulty-text">
                            {item.difficulty}
                          </span>
                        </td>
                        <td className="boss-price-table-price-cell">
                          <span className="boss-price-table-price-text">
                            {item.price.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ViewTransitionWrapper>

      {/* Consolidated page modals for better organization */}
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