import React from 'react';

export function StatsResetConfirmDialog({ 
  showStatsResetConfirm, 
  setShowStatsResetConfirm, 
  onConfirm 
}) {
  if (!showStatsResetConfirm) return null;

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(40,32,74,0.92)',
      zIndex: 6000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="modal-fade" style={{ 
        background: '#2d2540', 
        borderRadius: 14, 
        padding: '2rem 1.5rem', 
        maxWidth: 340, 
        color: '#e6e0ff', 
        boxShadow: '0 4px 24px #0006', 
        position: 'relative', 
        minWidth: 220, 
        textAlign: 'center' 
      }}>
        <h3 style={{ color: '#ffbaba', marginBottom: 16 }}>Are you sure?</h3>
        <p style={{ marginBottom: 18 }}>This will permanently erase all stats. This cannot be undone.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => setShowStatsResetConfirm(false)}
            style={{ 
              background: '#3a335a', 
              color: '#e6e0ff', 
              border: 'none', 
              borderRadius: 8, 
              padding: '0.7rem 1.5rem', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              cursor: 'pointer', 
              minWidth: 100 
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ 
              background: '#e53e3e', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              padding: '0.7rem 1.5rem', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              cursor: 'pointer', 
              minWidth: 100 
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function CharacterPurgeDialog({ 
  showCharacterPurgeConfirm, 
  setShowCharacterPurgeConfirm, 
  purgeTargetCharacter, 
  purgeInProgress, 
  onConfirm 
}) {
  if (!showCharacterPurgeConfirm) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(40,32,74,0.96)',
      zIndex: 6000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="modal-fade" style={{
        background: '#2d2540',
        borderRadius: 16,
        padding: '2.5rem',
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
        <h2 style={{ color: '#ff6b6b', fontWeight: 700, marginBottom: 20, fontSize: '1.5rem' }}>
          Purge Character Data
        </h2>
        <div style={{ 
          background: 'rgba(255, 107, 107, 0.1)', 
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: 12, 
          padding: '20px', 
          marginBottom: 28 
        }}>
          <p style={{ marginBottom: 12, fontSize: '1.1rem', lineHeight: '1.5', color: '#ffbaba' }}>
            <strong>This will permanently delete all pitched items and boss runs for:</strong>
          </p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            {purgeTargetCharacter?.name}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#ffbaba', marginBottom: 0 }}>
            This action cannot be undone.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={() => setShowCharacterPurgeConfirm(false)}
            disabled={purgeInProgress}
            style={{
              background: purgeInProgress ? '#2a2540' : '#3a335a',
              color: purgeInProgress ? '#888' : '#e6e0ff',
              border: purgeInProgress ? '1px solid #2a2540' : '2px solid #4a4370',
              borderRadius: 12,
              padding: '0.8rem 2rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: purgeInProgress ? 'not-allowed' : 'pointer',
              minWidth: 140,
              transition: 'all 0.2s ease',
              opacity: purgeInProgress ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={purgeInProgress}
            style={{
              background: purgeInProgress ? '#cc5555' : 'linear-gradient(135deg, #ff6b6b, #ff4757)',
              color: '#fff',
              border: '2px solid #ff6b6b',
              borderRadius: 12,
              padding: '0.8rem 2rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: purgeInProgress ? 'not-allowed' : 'pointer',
              opacity: purgeInProgress ? 0.7 : 1,
              minWidth: 140,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: purgeInProgress ? 'none' : '0 4px 16px rgba(255, 107, 107, 0.3)'
            }}
          >
            {purgeInProgress && (
              <div style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {purgeInProgress ? 'Purging...' : 'Purge Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SuccessDialog({ 
  resetSuccessVisible, 
  closeResetSuccess,
  purgeSuccess,
  setPurgeSuccess 
}) {
  if (!resetSuccessVisible && !purgeSuccess) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 7000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div 
        className="modal-fade" 
        style={{ 
          background: '#2d2540', 
          borderRadius: 14, 
          padding: '2rem 1.5rem', 
          maxWidth: 340, 
          color: '#e6e0ff', 
          boxShadow: '0 4px 24px #0006', 
          position: 'relative', 
          minWidth: 220, 
          textAlign: 'center' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: '#38a169', marginBottom: 16, fontSize: '1.5rem' }}>
          {resetSuccessVisible ? 'Stats reset!' : 'Character purged!'}
        </h3>
        <p style={{ marginBottom: 24, fontSize: '1.1rem' }}>
          {resetSuccessVisible ? 'Your stats have been cleared.' : 'Character data has been purged.'}
        </p>
        <button
          onClick={resetSuccessVisible ? closeResetSuccess : () => setPurgeSuccess(false)}
          style={{ 
            background: '#3a335a', 
            color: '#e6e0ff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '0.6rem 1.5rem', 
            fontWeight: 600, 
            fontSize: '1.1rem', 
            cursor: 'pointer', 
            marginTop: 10, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)' 
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function PitchedItemDetailsModal({
  showPitchedModal,
  setShowPitchedModal,
  pitchedModalItem,
  pitchedModalDetails
}) {
  if (!showPitchedModal || !pitchedModalItem) return null;

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(40,32,74,0.92)',
      zIndex: 6000,
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center'
    }}
      onClick={() => setShowPitchedModal(false)}
    >
      <div className="modal-fade" style={{ 
        background: '#2d2540', 
        borderRadius: 14, 
        padding: '2rem 1.5rem', 
        maxWidth: 400, 
        color: '#e6e0ff', 
        boxShadow: '0 4px 24px #0006', 
        position: 'relative', 
        minWidth: 220, 
        textAlign: 'center' 
      }} onClick={e => e.stopPropagation()}>
        <button 
          onClick={() => setShowPitchedModal(false)} 
          style={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            background: 'transparent', 
            color: '#fff', 
            border: 'none', 
            fontSize: '1.3rem', 
            cursor: 'pointer' 
          }} 
          title="Close"
        >
          ×
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <img src={pitchedModalItem.image} alt={pitchedModalItem.name} style={{ width: 32, height: 32, borderRadius: 6 }} />
          <span style={{ fontWeight: 700, fontSize: '1.1em', color: '#a259f7' }}>{pitchedModalItem.name}</span>
        </div>
        <div style={{ marginBottom: 10, color: '#b39ddb', fontWeight: 600 }}>Obtained by:</div>
        {pitchedModalDetails.length === 0 ? (
          <div style={{ color: '#888', marginBottom: 8 }}>None this year.</div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1em', background: 'none' }}>
              <thead>
                <tr style={{ color: '#b39ddb', background: 'none' }}>
                  <th style={{ padding: '4px 8px', fontWeight: 700 }}>Character</th>
                  <th style={{ padding: '4px 8px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '4px 8px', fontWeight: 700 }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {pitchedModalDetails.map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#23203a' : '#201c32' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>{d.char}</td>
                    <td style={{ padding: '4px 8px', color: '#b39ddb' }}>{d.date}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                      {d.cloud && (
                        <span style={{ 
                          background: '#805ad5', 
                          color: 'white', 
                          padding: '1px 4px', 
                          borderRadius: 4, 
                          fontSize: '0.7rem',
                          display: 'inline-block'
                        }}>☁️</span>
                      )}
                      {d.local && (
                        <span style={{ 
                          background: '#38a169', 
                          color: 'white', 
                          padding: '1px 4px', 
                          borderRadius: 4, 
                          fontSize: '0.7rem',
                          display: 'inline-block'
                        }}>💻</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 