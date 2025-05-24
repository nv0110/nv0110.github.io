import React from 'react';

function ReadOnlyModeIndicator({ isHistoricalWeek, isReadOnlyMode, readOnlyOverride, setReadOnlyOverride }) {
  if (!isHistoricalWeek) {
    return null;
  }

  return (
    <div style={{
      margin: '0 auto 1rem auto',
      maxWidth: 'calc(100% - 2rem)',
      background: isReadOnlyMode 
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.2))' 
        : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.2))',
      borderRadius: 12,
      padding: '1rem 1.5rem',
      fontWeight: 600,
      boxShadow: isReadOnlyMode 
        ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
        : '0 4px 12px rgba(34, 197, 94, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      border: isReadOnlyMode
        ? '2px solid rgba(239, 68, 68, 0.6)'
        : '2px solid rgba(34, 197, 94, 0.6)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
        <span style={{ fontSize: '1.2rem' }}>
          {isReadOnlyMode ? '🔒' : '✏️'}
        </span>
        <div>
          <div style={{ 
            fontSize: '1rem', 
            marginBottom: '0.2rem',
            color: '#ffffff', // White text for maximum contrast
            fontWeight: 700,
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)', // Text shadow for readability
            filter: 'none' // Remove any glow effects
          }}>
            {isReadOnlyMode ? 'Read-Only Mode' : 'Edit Mode'}
          </div>
          <div style={{ 
            fontSize: '0.85rem', 
            color: '#f3f4f6', // Very light gray text
            fontWeight: 500,
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)', // Text shadow for readability
            filter: 'none', // Remove any glow effects
            opacity: 0.95
          }}>
            {isReadOnlyMode 
              ? 'Historical week data is protected from changes'
              : 'Editing enabled for historical week data'
            }
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setReadOnlyOverride(!readOnlyOverride)}
        style={{
          background: isReadOnlyMode 
            ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
            : 'linear-gradient(135deg, #059669, #047857)',
          border: 'none',
          borderRadius: 8,
          color: '#ffffff', // White text for maximum contrast
          padding: '0.6rem 1.2rem',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minWidth: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: isReadOnlyMode
            ? '0 2px 8px rgba(220, 38, 38, 0.4)'
            : '0 2px 8px rgba(5, 150, 105, 0.4)',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', // Text shadow for button text
          filter: 'none' // Remove any glow effects
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = isReadOnlyMode
            ? '0 4px 12px rgba(220, 38, 38, 0.6)'
            : '0 4px 12px rgba(5, 150, 105, 0.6)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = isReadOnlyMode
            ? '0 2px 8px rgba(220, 38, 38, 0.4)'
            : '0 2px 8px rgba(5, 150, 105, 0.4)';
        }}
        title={isReadOnlyMode 
          ? 'Enable editing for this historical week' 
          : 'Disable editing to protect historical data'
        }
      >
        <span>{isReadOnlyMode ? '🔓' : '🔒'}</span>
        <span>{isReadOnlyMode ? 'Enable Edit' : 'Lock Data'}</span>
      </button>
    </div>
  );
}

export default ReadOnlyModeIndicator; 