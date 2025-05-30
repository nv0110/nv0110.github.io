import { useState, useEffect } from 'react';
import { useAuthentication } from '../../hooks/useAuthentication';
import { useViewTransition } from '../hooks/useViewTransition';
import WeeklyTracker from '../WeeklyTracker';
import { useAppData } from '../hooks/AppDataContext.jsx';
import Navbar from '../components/Navbar';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';
import { HelpModal, DeleteAccountModal, WeeklyTrackerHelpContent } from '../features/common/PageModals';
import { getBossDataForFrontend } from '../../services/bossRegistryService';

function WeeklyTrackerPage() {
  const { navigate } = useViewTransition();
  const { userCode, isLoggedIn, handleDeleteAccount } = useAuthentication();
  const {
    characterBossSelections,
    checked,
    setChecked,
    fullUserData,
    weekKey,
    preservingCheckedStateRef
  } = useAppData();

  // Boss data state
  const [bossData, setBossData] = useState([]);
  const [bossDataLoading, setBossDataLoading] = useState(true);

  // Modal states
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);

  // Load boss data from registry service
  useEffect(() => {
    const loadBossData = async () => {
      try {
        setBossDataLoading(true);
        const result = await getBossDataForFrontend();
        if (result.success) {
          setBossData(result.data);
        } else {
          console.error('Failed to load boss data:', result.error);
          setBossData([]);
        }
      } catch (error) {
        console.error('Error loading boss data:', error);
        setBossData([]);
      } finally {
        setBossDataLoading(false);
      }
    };

    loadBossData();
  }, []);

  // Redirect if not logged in
  if (!isLoggedIn) {
    navigate('/login', { replace: true });
    return null;
  }

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
      console.error('Delete error:', error);
    } finally {
      setShowDeleteLoading(false);
    }
  };

  // Show loading while boss data is being fetched
  if (bossDataLoading) {
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
          Loading boss data...
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
        />
      </ViewTransitionWrapper>

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