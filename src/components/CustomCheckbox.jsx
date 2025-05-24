import React from 'react';

// --- 4. Custom checkbox component ---
function CustomCheckbox({ checked, onChange, disabled = false }) {
  return (
    <div className="checkbox-wrapper" style={{ 
      transform: 'scale(0.8)',
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ 
          background: '#3a335a', 
          color: '#e6e0ff', 
          border: '1.5px solid #2d2540',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      />
      <svg viewBox="0 0 35.6 35.6">
        <circle className="background" cx="17.8" cy="17.8" r="17.8"></circle>
        <circle className="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
        <polyline className="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
      </svg>
    </div>
  );
}

export default CustomCheckbox; 