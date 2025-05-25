import React from 'react';

function SidebarToggle({ sidebarVisible, setSidebarVisible }) {
  return (
    <div
      className={`sidebar-toggle ${sidebarVisible ? 'visible' : 'hidden'}`}
      onClick={() => setSidebarVisible(!sidebarVisible)}
      title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
    >
      {sidebarVisible ? (
        // Close icon (SVG X)
        <svg
          className="sidebar-toggle-close-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="crossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e6e0ff" />
              <stop offset="100%" stopColor="#d6b4ff" />
            </linearGradient>
          </defs>
          <path
            d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z"
            fill="url(#crossGradient)"
          />
        </svg>
      ) : (
        // Hamburger icon (3 lines)
        <div className="sidebar-toggle-hamburger">
          {[0, 1, 2].map(index => (
            <span
              key={index}
              className="sidebar-toggle-hamburger-line"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SidebarToggle; 