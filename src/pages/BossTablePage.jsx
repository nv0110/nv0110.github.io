import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useViewTransition } from '../hooks/useViewTransition';
import { bossData } from '../data/bossData';
import Navbar from '../components/Navbar';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';

function BossTablePage() {
  const { navigate } = useViewTransition();
  const { isLoggedIn, handleDeleteAccount } = useAuth();

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
    <div className="page-container">
      <Navbar 
        currentPage="bosstable" 
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      <ViewTransitionWrapper>
        <div className="premium-content-container fade-in">
          <h2 className="page-title-secondary">
            Boss Crystal Price Table
          </h2>
          
          <div className="boss-table-wrapper">
            {/* Fixed Header Table */}
            <div className="boss-table-header-container">
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
            <div className="boss-table-body-container">
              <table className="boss-price-table boss-table-body">
                <tbody>
                  {(() => {
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
              <h3 className="modal-section-title">Boss Crystal Values</h3>
              <p>All bosses and difficulties sorted by crystal value (highest to lowest)</p>
              <p>Use this reference to plan your weekly boss priorities</p>
              <p>Values shown are for solo runs - adjust for your party size</p>
            </div>

            <div className="modal-section-content" style={{ marginBottom: 24 }}>
              <h3 className="modal-section-title">Planning Your Week</h3>
              <p>• <strong>Prioritize high-value bosses:</strong> Focus on the top of the list for maximum mesos</p>
              <p>• <strong>Consider time investment:</strong> Some bosses take longer but give more mesos</p>
              <p>• <strong>Difficulty scaling:</strong> Higher difficulties = more mesos + pitched items</p>
            </div>

            <div className="modal-section-content">
              <h3 className="modal-section-title">Quick Tips</h3>
              <p>• Use this table when setting up characters in the Calculator</p>
              <p>• Remember that party size divides the mesos shown</p>
              <p>• Higher difficulties also unlock pitched item tracking</p>
              <p>• Weekly reset happens every Thursday at 00:00 UTC</p>
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
    </div>
  );
}

export default BossTablePage; 