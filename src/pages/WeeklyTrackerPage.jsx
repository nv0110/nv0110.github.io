import { useState, useEffect } from 'react';
import { useAuthentication } from '../../hooks/useAuthentication';
import { useViewTransition } from '../hooks/useViewTransition';
import WeeklyTracker from '../WeeklyTracker';
import { useAppData } from '../hooks/AppDataContext.jsx';
import Navbar from '../components/Navbar';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';
import { HelpModal, DeleteAccountModal, WeeklyTrackerHelpContent } from '../features/common/PageModals';
import OnboardingGuide from '../components/OnboardingGuide';
import { STORAGE_KEYS } from '../constants';

function WeeklyTrackerPage() {
  const { navigate } = useViewTransition();
  const { userCode, isLoggedIn, handleDeleteAccount } = useAuthentication();
  const {
    characterBossSelections,
    checked,
    setChecked,
    fullUserData,
    weekKey,
    preservingCheckedStateRef,
    sortedBossData: bossData,
    isLoading: appDataLoading,
    hasDataLoaded
  } = useAppData();

  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if this is the user's first visit to Weekly Tracker
  useEffect(() => {
    if (hasDataLoaded && characterBossSelections.length > 0) {
      const hasSeenGuide = localStorage.getItem(STORAGE_KEYS.WEEKLY_ONBOARDING_SEEN);
      if (!hasSeenGuide) {
        // Small delay to ensure page has loaded properly
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [hasDataLoaded, characterBossSelections.length]);

  // Mark onboarding as seen
  const handleOnboardingComplete = () => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_ONBOARDING_SEEN, 'true');
    setShowOnboarding(false);
  };

  // Redirect if not logged in - handled by ProtectedRoute in App.jsx
  // Don't call navigate directly here to prevent navigation throttling
  if (!isLoggedIn) {
    return null; // Let ProtectedRoute component handle the redirect
  }

  // Handle delete account
  const handleDeleteAccountWrapper = async () => {
    setShowDeleteLoading(true);
    setDeleteError('');
    try {
      const result = await handleDeleteAccount();
      if (result.success) {
        setShowDeleteConfirm(false);
        // Navigation is now handled by the authentication hook
      } else {
        setDeleteError(result.error);
      }
    } catch (error) {
      setDeleteError('Failed to delete account. Try again.');
      console.error('Delete error:', error);
    } finally {
      setShowDeleteLoading(false);
    }
  };

  // Show loading while app data is being fetched (includes boss data)
  if (appDataLoading || !hasDataLoaded) {
    return (
      <div className="page-container">
        <Navbar
          currentPage="weeklytracker"
          onShowHelp={() => setShowHelp(true)}
          onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          color: '#e6e0ff',
          fontSize: '1.2rem'
        }}>
          Loading data...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar
        currentPage="weeklytracker"
        onShowHelp={() => setShowHelp(true)}
        onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
      />
      
      {/* Main content container - full width for sidebar + content layout */}
      <ViewTransitionWrapper>
        <WeeklyTracker
          characterBossSelections={characterBossSelections}
          bossData={bossData}
          checked={checked}
          setChecked={setChecked}
          userCode={userCode}
          fullUserData={fullUserData}
          appWeekKey={weekKey}
          preservingCheckedStateRef={preservingCheckedStateRef}
          showOnboardingIndicators={showOnboarding}
        />
      </ViewTransitionWrapper>

      {/* Onboarding Guide Modal */}
      <OnboardingGuide
        show={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingComplete}
      />

      {/* Consolidated page modals for better organization */}
      <HelpModal
        showHelp={showHelp}
        onClose={() => setShowHelp(false)}
      >
        <WeeklyTrackerHelpContent />
      </HelpModal>
      
      <DeleteAccountModal
        showDeleteConfirm={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccountWrapper}
        showDeleteLoading={showDeleteLoading}
        deleteError={deleteError}
      />
    </div>
  );
}

export default WeeklyTrackerPage; 