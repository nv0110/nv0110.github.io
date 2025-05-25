import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useViewTransition } from '../hooks/useViewTransition';
import WeeklyTracker from '../WeeklyTracker';
import { useAppData } from '../hooks/useAppData';
import { bossData } from '../data/bossData';
import Navbar from '../components/Navbar';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';

function WeeklyTrackerPage() {
  const { navigate } = useViewTransition();
  const { userCode, isLoggedIn, handleDeleteAccount } = useAuth();
  const { characters, checked, setChecked, fullUserData, weekKey } = useAppData();

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
        currentPage="weeklytracker"
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      
      {/* Main content container - properly centered */}
      <ViewTransitionWrapper>
        <div className="weekly-tracker-main-container">
          <div className="weekly-tracker-content-wrapper">
            <WeeklyTracker 
              characters={characters}
              bossData={bossData}
              checked={checked}
              setChecked={setChecked}
              userCode={userCode}
              fullUserData={fullUserData}
              weekKey={weekKey}
            />
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
              <h3 className="modal-section-title">Weekly Tracker</h3>
              <p>Track your weekly boss completion progress and earnings</p>
              <p>Check off bosses as you complete them to see your progress</p>
              <p>Use the navigation arrows to view different weeks</p>
            </div>

            <div className="modal-section-content" style={{ marginBottom: 24 }}>
              <h3 className="modal-section-title">Features</h3>
              <p>• <strong>Progress tracking:</strong> Visual progress bars and completion status</p>
              <p>• <strong>Week navigation:</strong> Navigate between weeks to view historical data</p>
              <p>• <strong>Hide completed:</strong> Toggle to hide characters with all bosses completed</p>
              <p>• <strong>Reset timer:</strong> See when the weekly reset occurs</p>
            </div>

            <div className="modal-section-content">
              <h3 className="modal-section-title">Quick Tips</h3>
              <p>• Weekly reset happens every Thursday at 00:00 UTC</p>
              <p>• Check off bosses as you complete them throughout the week</p>
              <p>• Use "Tick All" to quickly mark all bosses as completed for a character</p>
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

export default WeeklyTrackerPage; 