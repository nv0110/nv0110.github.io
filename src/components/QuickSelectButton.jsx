import React from 'react';
import './QuickSelectButton.css';

function QuickSelectButton({ onClick, title = "Quick Select Bosses" }) {
  return (
    <button 
      className="quick-select-btn" 
      onClick={onClick}
      title={title}
    >
      <svg 
        className="quick-select-icon" 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      Quick Select
    </button>
  );
}

export default QuickSelectButton; 