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
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
  const resetThrottleRef = useRef(false); // Add throttling to prevent rapid reset calls

  // Update countdown timer and check for week change
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());

      const currentWeek = getCurrentWeekKey();
      const previousWeek = previousWeekKeyRef.current;

      // Only trigger reset if week actually changed and we're not already throttled
      if (currentWeek !== previousWeek && !resetThrottleRef.current) {
        logger.info(`Weekly reset detected. Old week: ${previousWeek}, New week: ${currentWeek}`);
        
        // Set throttle to prevent rapid successive calls
        resetThrottleRef.current = true;
        
        if (onWeeklyReset) {
          onWeeklyReset(previousWeek); // Pass the week that just ENDED
        }
        
        previousWeekKeyRef.current = currentWeek; // Update to the new current week
        
        // Clear throttle after 30 seconds to allow for legitimate subsequent resets
        setTimeout(() => {
          resetThrottleRef.current = false;
        }, 30000);
      }
    }, 5000); // Reduce frequency from 1 second to 5 seconds to reduce performance impact

    return () => clearInterval(timer);
  }, [onWeeklyReset]); // Add onWeeklyReset to dependency array

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.navbar-mobile-menu') && !event.target.closest('.navbar-hamburger')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

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

          {/* Hamburger Menu Button (Mobile Only) */}
          <button 
            className="navbar-hamburger"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </button>

          {/* Page Navigation (Desktop) */}
          <div className="navbar-navigation navbar-navigation-desktop">
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

        {/* Mobile Navigation Menu */}
        <div className={`navbar-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="navbar-mobile-menu-content">
            <button
              onClick={() => handleNavigation('/')}
              className={`navbar-mobile-nav-btn ${currentPageFromPath === 'calculator' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 5.16-1 9-5.45 9-11V7l-10-5z"/>
                <path d="M8 11l2 2 4-4"/>
              </svg>
              <span>Boss Config</span>
            </button>
            
            {!hasCharacters ? (
              <button className="navbar-mobile-nav-btn disabled" disabled>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Weekly Tracker</span>
                <small>Add character first</small>
              </button>
            ) : (
              <button
                onClick={() => handleNavigation('/weeklytracker')}
                className={`navbar-mobile-nav-btn ${currentPageFromPath === 'weeklytracker' ? 'active' : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Weekly Tracker</span>
              </button>
            )}
            
            <button
              onClick={() => handleNavigation('/bosstable')}
              className={`navbar-mobile-nav-btn ${currentPageFromPath === 'bosstable' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
              <span>Boss Table</span>
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