import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { bossData } from '../data/bossData';
import Navbar from '../components/Navbar';

function BossTablePage() {
  const navigate = useNavigate();
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
    <div style={{
      padding: '2rem 0',
      width: '100%',
      paddingTop: '5rem' // Add space for the navbar
    }}>
      <Navbar 
        currentPage="bosstable" 
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      
      <div style={{ 
        background: '#28204a', 
        borderRadius: '12px', 
        padding: '1.5rem', 
        boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)', 
        maxWidth: 900, 
        margin: '0 auto', 
        border: '1.5px solid #2d2540' 
      }}>
        <h2 style={{ 
          color: '#a259f7', 
          marginBottom: '1rem', 
          textAlign: 'center', 
          fontWeight: 700 
        }}>
          Boss Crystal Price Table
        </h2>
        
        <div className="table-scroll">
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            minWidth: 700, 
            border: '1px solid #2d2540', 
            borderRadius: 12, 
            overflow: 'hidden' 
          }}>
            <thead>
              <tr style={{ background: '#3a2a5d', color: '#fff' }}>
                <th style={{ 
                  padding: '6px 14px', 
                  textAlign: 'left', 
                  fontWeight: 600, 
                  fontSize: '0.9em', 
                  minWidth: 100, 
                  verticalAlign: 'bottom' 
                }}>
                  Boss
                </th>
                <th style={{ 
                  padding: '6px 4px', 
                  textAlign: 'left', 
                  fontWeight: 600, 
                  fontSize: '0.9em', 
                  minWidth: 90 
                }}>
                  Difficulty
                </th>
                <th style={{ 
                  padding: '6px 14px', 
                  textAlign: 'right', 
                  fontWeight: 600, 
                  fontSize: '0.9em', 
                  minWidth: 120 
                }}>
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
                    style={{ 
                      background: idx % 2 === 0 ? '#23203a' : '#201c32', 
                      border: '1px solid #3a335a' 
                    }}
                  >
                    <td style={{ 
                      padding: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      minWidth: 100 
                    }}>
                      {item.boss.image && (
                        <img 
                          src={item.boss.image} 
                          alt={item.boss.name} 
                          style={{ 
                            width: 40, 
                            height: 40, 
                            objectFit: 'contain', 
                            borderRadius: 6, 
                            background: '#fff1', 
                            marginRight: 8 
                          }} 
                        />
                      )}
                      <span className="boss-name" style={{ 
                        fontWeight: 600, 
                        fontSize: '1.05em' 
                      }}>
                        {item.boss.name}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '8px', 
                      textAlign: 'left', 
                      minWidth: 90 
                    }}>
                      <span style={{ fontWeight: 500 }}>
                        {item.difficulty}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '8px', 
                      textAlign: 'right', 
                      minWidth: 120 
                    }}>
                      <span style={{ 
                        color: '#6a11cb', 
                        fontWeight: 600 
                      }}>
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
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Boss Price Table</h3>
              <p style={{ marginBottom: 8 }}>This table shows all bosses sorted by crystal value (highest to lowest)</p>
              <p style={{ marginBottom: 8 }}>Use this to plan which bosses give the most mesos for your time</p>
              <p style={{ marginBottom: 8 }}>Crystal prices are based on current market rates</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Navigation</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Calculator:</strong> Main page for character and boss management</p>
              <p style={{ marginBottom: 8 }}>• <strong>Weekly Tracker:</strong> Track your weekly boss completion progress</p>
              <p style={{ marginBottom: 8 }}>• <strong>Boss Table:</strong> This page - reference for all boss crystal values</p>
            </div>

            <div>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Quick Tips</h3>
              <p style={{ marginBottom: 8 }}>• Higher difficulty bosses generally give more mesos</p>
              <p style={{ marginBottom: 8 }}>• Party size affects mesos earned (displayed values are for solo)</p>
              <p style={{ marginBottom: 8 }}>• Use this table when deciding which bosses to prioritize</p>
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

export default BossTablePage; 