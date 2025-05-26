import { useState } from 'react';

// Simple Tooltip component
export function Tooltip({ children, text, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute',
          [position]: '120%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2d2540',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: '0.95em',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          boxShadow: '0 2px 8px #0004',
          pointerEvents: 'none',
          opacity: 0.95
        }}>
          {text}
        </span>
      )}
    </span>
  );
} 