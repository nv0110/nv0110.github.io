import React from 'react';

function SidebarToggle({ sidebarVisible, setSidebarVisible }) {
  return (
    <button
      onClick={() => setSidebarVisible(!sidebarVisible)}
      style={{
        position: 'fixed',
        left: sidebarVisible ? 260 : 10,
        top: '110px',
        background: 'linear-gradient(135deg, #a259f7, #805ad5)',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 200,
        boxShadow: '0 4px 12px rgba(162, 89, 247, 0.4)',
        transition: 'all 0.3s ease',
        fontSize: '1.2rem'
      }}
      title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(162, 89, 247, 0.6)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(162, 89, 247, 0.4)';
      }}
    >
      {sidebarVisible ? '◀' : '▶'}
    </button>
  );
}

export default SidebarToggle; 