import { useAuthentication } from '../../hooks/useAuthentication';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { getTimeUntilReset, getCurrentWeekKey } from '../utils/weekUtils';
import { useViewTransition } from '../hooks/useViewTransition';
import { useAppData } from '../hooks/AppDataContext.jsx';
import { useForceUpdate } from '../hooks/ForceUpdateContext';
import { Tooltip } from './Tooltip';
import SettingsModal from './SettingsModal';
import { DeleteAccountModal } from '../features/common/PageModals';
import { logger } from '../utils/logger';

function Navbar({ onWeeklyReset, onExport, onImport, fileInputRef }) {
  const { userCode, handleLogout, handleDeleteAccount } = useAuthentication();
  const { navigate } = useViewTransition();
  const location = useLocation();
  const { characterBossSelections } = useAppData();
  const { lastUpdate } = useForceUpdate(); // Get the force update trigger
  
  // State for settings modal and delete confirmation
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);
  
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
        logger.info(`Weekly reset detected. Old week: ${previousWeek}, New week: ${currentWeek}`);
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

  // Handle delete account
  const handleDeleteAccountWrapper = async () => {
    setShowDeleteLoading(true);
    setDeleteError('');
    try {
      const result = await handleDeleteAccount();
      if (result.success) {
        setShowDeleteConfirm(false);
        navigate('/login', { replace: true });
      } else {
        setDeleteError(result.error);
      }
    } catch (error) {
      setDeleteError('Failed to delete account. Try again.');
      logger.error('Delete error:', error);
    } finally {
      setShowDeleteLoading(false);
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
    <>
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

          {/* Right Section: Account Settings and Logout */}
          <div className="navbar-right">
            <button
              className="navbar-icon-button settings"
              onClick={() => setShowSettings(true)}
              title="Account Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <circle cx="12" cy="10" r="3" strokeWidth="2"/>
                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <button
              onClick={handleLogoutClick}
              className="navbar-icon-button logout"
              title="Logout"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M17 7L21 12L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 3H7.8C6.12 3 5.28 3 4.64 3.33C4.07 3.61 3.61 4.07 3.33 4.64C3 5.28 3 6.12 3 7.8V16.2C3 17.88 3 18.72 3.33 19.36C3.61 19.93 4.07 20.39 4.64 20.67C5.28 21 6.12 21 7.8 21H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        onExport={onExport}
        onImport={onImport}
        fileInputRef={fileInputRef}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        showDeleteConfirm={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccountWrapper}
        showDeleteLoading={showDeleteLoading}
        deleteError={deleteError}
      />
    </>
  );
}

export default Navbar; 