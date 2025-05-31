import React from 'react';

/**
 * Minimal scroll indicator component
 * Shows a subtle down arrow when content is scrollable
 */
const ScrollIndicator = ({ show, className = '' }) => {
  return (
    <div className={`scroll-indicator ${show ? 'visible' : 'hidden'} ${className}`}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 10L12 15L17 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default ScrollIndicator; 