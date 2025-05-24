import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getTimeUntilReset, getCurrentWeekKey } from '../utils/weekUtils';

function Navbar({ currentPage, onShowHelp, onShowDeleteConfirm }) {
  const { userCode, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Timer state managed within navbar
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());
  const currentWeekKey = getCurrentWeekKey();

  // Update countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogoutClick = async () => {
    await handleLogout();
  };

  const handleDeleteClick = () => {
    if (onShowDeleteConfirm) {
      onShowDeleteConfirm();
    }
  };

  const handleHelpClick = () => {
    if (onShowHelp) {
      onShowHelp();
    }
  };

  const getPageFromPath = (pathname) => {
    if (pathname === '/') return 'calculator';
    if (pathname === '/weeklytracker') return 'weeklytracker';
    if (pathname === '/bosstable') return 'bosstable';
    return 'calculator';
  };

  const currentPageFromPath = getPageFromPath(location.pathname);

  return (
    <div className="navbar-container">
      <div className="navbar-content">
        {/* Left Section: Timer and User Code */}
        <div className="navbar-left">
          {timeUntilReset && (
            <div className="navbar-timer">
              <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#b39ddb', marginRight: '0.6rem' }}>
                 Reset:  
              </div>
              <div style={{ 
                fontSize: '1.1rem', 
                fontFamily: 'monospace', 
                fontWeight: 700, 
                display: 'flex',
                justifyContent: 'center',
                gap: '0.3rem',
                color: '#e6e0ff'
                
              }}>
                <span>{timeUntilReset.days}D</span>
                <span>{timeUntilReset.hours}H</span>
                <span>{timeUntilReset.minutes}M</span>
              </div>
            </div>
          )}
          
          <div className="navbar-usercode">
            ID: {userCode}
          </div>
        </div>

        {/* Page Navigation (Center) */}
        <div className="navbar-navigation">
          <button
            onClick={() => navigate('/')}
            className={`navbar-nav-btn ${currentPageFromPath === 'calculator' ? 'active' : ''}`}
            title="Character & Boss Configuration"
          >
            Boss Config
          </button>
          
          <button
            onClick={() => navigate('/weeklytracker')}
            className={`navbar-nav-btn ${currentPageFromPath === 'weeklytracker' ? 'active' : ''}`}
            title="Weekly Boss Progress Tracker"
          >
            Weekly Tracker
          </button>
          
          <button
            onClick={() => navigate('/bosstable')}
            className={`navbar-nav-btn ${currentPageFromPath === 'bosstable' ? 'active' : ''}`}
            title="Boss Crystal Price Reference"
          >
            Boss Table
          </button>
        </div>

        {/* Action Buttons (Right) */}
        <div className="navbar-actions">
          <button
            onClick={handleLogoutClick}
            className="navbar-btn logout"
          >
            Logout
          </button>
          
          <button
            onClick={handleDeleteClick}
            className="navbar-btn delete"
          >
            Delete Account
          </button>
          
          <button
            onClick={handleHelpClick}
            className="navbar-btn help"
            title="Help & FAQ"
          >
            Help
          </button>
        </div>
      </div>
    </div>
  );
}

export default Navbar; 