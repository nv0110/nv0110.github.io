import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getTimeUntilReset } from '../utils/weekUtils';
import { useViewTransition } from '../hooks/useViewTransition';
import { useAppData } from '../hooks/AppDataContext.jsx';
import { useForceUpdate } from '../hooks/ForceUpdateContext';
import { Tooltip } from './Tooltip';

function Navbar({ onShowHelp, onShowDeleteConfirm }) {
  const { userCode, handleLogout } = useAuth();
  const { navigate } = useViewTransition();
  const location = useLocation();
  const { characterBossSelections } = useAppData();
  const { lastUpdate } = useForceUpdate(); // Get the force update trigger
  
  // State to track if weekly tracker should be enabled
  const [hasCharacters, setHasCharacters] = useState(false);
  
  // Update hasCharacters state whenever characterBossSelections changes OR when forceUpdate is triggered
  useEffect(() => {
    const characterCount = characterBossSelections?.length || 0;
    setHasCharacters(characterCount > 0);
  }, [characterBossSelections, lastUpdate]);

  // Timer state managed within navbar
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());

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
              <div className="navbar-timer-label">
                 Reset:  
              </div>
              <div className="navbar-timer-countdown">
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
          
          {!hasCharacters ? (
            <Tooltip text="You need to create at least one character first">
              <button
                className={`navbar-nav-btn disabled`}
                disabled
              >
                Weekly Tracker
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => navigate('/weeklytracker')}
              className={`navbar-nav-btn ${currentPageFromPath === 'weeklytracker' ? 'active' : ''}`}
              title="Weekly Boss Progress Tracker"
            >
              Weekly Tracker
            </button>
          )}
          
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