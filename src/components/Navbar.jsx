import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getTimeUntilReset, getCurrentWeekKey } from '../utils/weekUtils';
import { useViewTransition } from '../hooks/useViewTransition';
import { useAppData } from '../hooks/AppDataContext.jsx';
import { useForceUpdate } from '../hooks/ForceUpdateContext';
import { Tooltip } from './Tooltip';

function Navbar({ onShowHelp, onShowDeleteConfirm, onWeeklyReset }) {
  const { userCode, handleLogout } = useAuth();
  const { navigate } = useViewTransition();
  const location = useLocation();
  const { characterBossSelections, simulateWeekForward, revertWeekSimulation, isWeekSimulated } = useAppData();
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
  const previousWeekKeyRef = useRef(getCurrentWeekKey()); // Keep track of the week key

  // Update countdown timer and check for week change
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());

      const currentWeek = getCurrentWeekKey();
      const previousWeek = previousWeekKeyRef.current;

      if (currentWeek !== previousWeek) {
        console.log(`Weekly reset detected. Old week: ${previousWeek}, New week: ${currentWeek}`);
        if (onWeeklyReset) {
          onWeeklyReset(previousWeek); // Pass the week that just ENDED
        }
        previousWeekKeyRef.current = currentWeek; // Update to the new current week
      }
    }, 1000); // Check every second

    return () => clearInterval(timer);
  }, [onWeeklyReset]); // Add onWeeklyReset to dependency array

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

          {/* Debug Buttons for Week Simulation */}
          {process.env.NODE_ENV === 'development' && (
            <div className="navbar-debug-controls" style={{ marginLeft: '10px', display: 'flex', gap: '5px' }}>
              <button
                onClick={simulateWeekForward}
                disabled={isWeekSimulated} // Disable if already simulated forward
                className="navbar-btn debug-sim-forward"
                title="Simulate 1 Week Forward"
                style={{ backgroundColor: isWeekSimulated ? '#555' : '#28a745', color: 'white', padding: '5px 8px', fontSize: '0.8em' }}
              >
                Sim W+1
              </button>
              <button
                onClick={revertWeekSimulation}
                disabled={!isWeekSimulated} // Disable if not currently simulated
                className="navbar-btn debug-revert-sim"
                title="Revert Week Simulation"
                style={{ backgroundColor: !isWeekSimulated ? '#555' : '#dc3545', color: 'white', padding: '5px 8px', fontSize: '0.8em' }}
              >
                Revert Sim
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar; 