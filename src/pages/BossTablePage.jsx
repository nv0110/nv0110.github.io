import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useViewTransition } from '../hooks/useViewTransition';
import { bossData } from '../data/bossData';
import Navbar from '../components/Navbar';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';

function BossTablePage() {
  const { navigate } = useViewTransition();
  const { userCode, isLoggedIn, handleDeleteAccount } = useAuth();

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
          
          <div className="table-scroll">
            <table className="boss-price-table">
              <thead>
                <tr className="boss-table-header">
                  <th className="boss-table-header-cell">
                    Boss
                  </th>
                  <th className="boss-table-header-cell-difficulty">
                    Difficulty
                  </th>
                  <th className="boss-table-header-cell-price">
                    Mesos
                  </th>
                </tr>
              </thead>
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
                      <td className="boss-name-cell">
                        {item.boss.image && (
                          <img 
                            src={item.boss.image} 
                            alt={item.boss.name} 
                            className="boss-table-image"
                          />
                        )}
                        <span className="boss-name-text">
                          {item.boss.name}
                        </span>
                      </td>
                      <td className="boss-difficulty-cell">
                        <span className="boss-difficulty-text">
                          {item.difficulty}
                        </span>
                      </td>
                      <td className="boss-price-cell">
                        <span className="boss-price-text">
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
              <h3 className="modal-section-title">Boss Price Table</h3>
              <p>This table shows all bosses sorted by crystal value (highest to lowest)</p>
              <p>Use this to plan which bosses give the most mesos for your time</p>
              <p>Crystal prices are based on current market rates</p>
            </div>

            <div className="modal-section-content" style={{ marginBottom: 24 }}>
              <h3 className="modal-section-title">Navigation</h3>
              <p>• <strong>Calculator:</strong> Main page for character and boss management</p>
              <p>• <strong>Weekly Tracker:</strong> Track your weekly boss completion progress</p>
              <p>• <strong>Boss Table:</strong> This page - reference for all boss crystal values</p>
            </div>

            <div className="modal-section-content">
              <h3 className="modal-section-title">Quick Tips</h3>
              <p>• Higher difficulty bosses generally give more mesos</p>
              <p>• Party size affects mesos earned (displayed values are for solo)</p>
              <p>• Use this table when deciding which bosses to prioritize</p>
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