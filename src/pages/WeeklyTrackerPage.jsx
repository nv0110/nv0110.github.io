import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import WeeklyTracker from '../WeeklyTracker';
import { useAppData } from '../hooks/useAppData';
import { bossData } from '../data/bossData';
import Navbar from '../components/Navbar';

function WeeklyTrackerPage() {
  const navigate = useNavigate();
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
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar 
        currentPage="weeklytracker"
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      
      {/* Main content container - properly centered */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '80px 20px 20px 20px', // Top padding to account for fixed navbar
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px', // Adjust this based on your WeeklyTracker component width
          display: 'flex',
          justifyContent: 'center'
        }}>
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
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Weekly Tracker</h3>
              <p style={{ marginBottom: 8 }}>Track your weekly boss completion progress and earnings</p>
              <p style={{ marginBottom: 8 }}>Check off bosses as you complete them to see your progress</p>
              <p style={{ marginBottom: 8 }}>Use the navigation arrows to view different weeks</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Features</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Progress tracking:</strong> Visual progress bars and completion status</p>
              <p style={{ marginBottom: 8 }}>• <strong>Week navigation:</strong> Navigate between weeks to view historical data</p>
              <p style={{ marginBottom: 8 }}>• <strong>Hide completed:</strong> Toggle to hide characters with all bosses completed</p>
              <p style={{ marginBottom: 8 }}>• <strong>Reset timer:</strong> See when the weekly reset occurs</p>
            </div>

            <div>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Quick Tips</h3>
              <p style={{ marginBottom: 8 }}>• Weekly reset happens every Thursday at 00:00 UTC</p>
              <p style={{ marginBottom: 8 }}>• Check off bosses as you complete them throughout the week</p>
              <p style={{ marginBottom: 8 }}>• Use "Tick All" to quickly mark all bosses as completed for a character</p>
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

export default WeeklyTrackerPage; 