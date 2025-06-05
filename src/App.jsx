import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, Component, useRef, useEffect } from 'react';
import { useAuthentication } from '../hooks/useAuthentication';
import { ForceUpdateProvider } from './hooks/ForceUpdateContext';
import ViewTransitionWrapper from './components/ViewTransitionWrapper';
import { AppDataProvider, useAppData } from './hooks/AppDataContext.jsx';
import { STORAGE_KEYS } from './constants';
import './App.css';
import React from 'react';
import Navbar from './components/Navbar';
import { clearPitchedItemsForWeek } from '../services/pitchedItemsService.js';

// Import debug helpers for development
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugHelpers.js');
}

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const InputPage = lazy(() => import('./pages/InputPage'));
const BossTablePage = lazy(() => import('./pages/BossTablePage'));
const WeeklyTrackerPage = lazy(() => import('./pages/WeeklyTrackerPage'));

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="App dark" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      color: '#e6e0ff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #805ad5', 
          borderTop: '3px solid transparent', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p>Loading...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  componentWillUnmount() {
    // Cleanup any resources if needed
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="App dark error-container">
          <h1 className="error-page-title">Something went wrong</h1>
          <p className="error-page-description">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="error-refresh-btn"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 404 Not Found Component
function NotFound() {
  const { isLoggedIn } = useAuthentication();
  
  // Enhanced guard: Only navigate if user is logged in and not in transition
  if (isLoggedIn && localStorage.getItem(STORAGE_KEYS.USER_CODE)) {
    return (
      <div className="App dark not-found-container">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-description">
          The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }
  
  // For logged out users or during transitions, just show the 404 without navigation
  return (
    <div className="App dark not-found-container">
      <h1 className="not-found-title">404</h1>
      <h2 className="not-found-subtitle">Page Not Found</h2>
      <p className="not-found-description">
        The page you're looking for doesn't exist. Please log in to continue.
      </p>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuthentication();
  const location = useLocation();
  
  // Enhanced guard: Check for logout transitions
  useEffect(() => {
    // Don't trigger redirects during component mount/unmount cycles
    const timeoutId = setTimeout(() => {
      // Allow navigation logic to process after initial render
    }, 50);
    return () => clearTimeout(timeoutId);
  }, []);

  if (!isLoggedIn) {
    // Additional check to prevent navigation during logout transitions
    const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
    if (!currentStoredCode) {
      // Only navigate if we're actually logged out, not in transition
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    // During logout transition, return null to prevent navigation throttling
    return null;
  }
  return children;
}

// New MainAppContent component that uses AppData
function MainAppContent() {
  const { isLoggedIn, userCode } = useAuthentication();
  const { setChecked, handleExternalWeeklyReset, characterBossSelections } = useAppData();
  const resetInProgressRef = useRef(false); // Add ref to track reset status

  // console.log('MainAppContent: isLoggedIn:', isLoggedIn, 'userCode:', userCode);

  const handleWeeklyReset = async (endedWeekKey) => {
    // Prevent multiple simultaneous resets
    if (resetInProgressRef.current) {
      console.log('Weekly reset already in progress, skipping duplicate call');
      return;
    }
    
    // Enhanced guard: Check if user is still logged in before proceeding
    const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
    if (!userCode || !currentStoredCode || currentStoredCode !== userCode) {
      console.log('MainAppContent: Skipping weekly reset - logout in progress');
      return;
    }
    
    console.log(`MainAppContent: handleWeeklyReset called for ended week: ${endedWeekKey}`);
    
    if (!endedWeekKey) {
      console.warn('Cannot perform weekly reset: missing endedWeekKey');
      return;
    }
    
    resetInProgressRef.current = true;
    
    try {
      // Final check before any operations
      const finalStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
      if (!finalStoredCode || finalStoredCode !== userCode) {
        console.log('MainAppContent: Aborting weekly reset - logout occurred during process');
        return;
      }
      
      // 1. Clear UI for boss clears (current week)
      setChecked({});
      console.log('Boss clears UI reset for the new week.');

      // 2. REMOVED: Do NOT clear pitched items - they should remain as historical data
      // Pitched items automatically become "historical" when the current week changes
      
      // 3. Use the new service-based weekly reset system
      await handleExternalWeeklyReset(endedWeekKey);

      console.log(`✅ Weekly reset completed successfully for ended week: ${endedWeekKey}`);

    } catch (error) {
      console.error('❌ Error during weekly reset process:', error);
      // Don't rethrow the error to prevent it from bubbling up and potentially causing UI issues
    } finally {
      // Clear the progress flag after a delay to prevent rapid successive resets
      setTimeout(() => {
        resetInProgressRef.current = false;
      }, 5000);
    }
  };

  return (
    <>
      {isLoggedIn && (
        <Navbar 
          onShowHelp={() => { /* Implement help modal logic if needed */ }}
          onShowDeleteConfirm={() => { /* Implement delete confirm logic if needed */ }}
          onWeeklyReset={handleWeeklyReset} 
          characterBossSelections={characterBossSelections} 
        />
      )}
      <div className="App dark main-content-scrollable-area"> 
        <ViewTransitionWrapper>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route 
                path="/login" 
                element={
                  isLoggedIn ? (
                    // Enhanced guard: Check if we're in a logout transition
                    localStorage.getItem(STORAGE_KEYS.USER_CODE) ? 
                      <Navigate to="/" replace /> : 
                      <LoginPage />
                  ) : (
                    <LoginPage />
                  )
                } 
              />
              <Route 
                path="/" 
                element={<ProtectedRoute><InputPage /></ProtectedRoute>}
              />
              <Route 
                path="/weeklytracker" 
                element={<ProtectedRoute><WeeklyTrackerPage /></ProtectedRoute>}
              />
              <Route 
                path="/bosstable" 
                element={<ProtectedRoute><BossTablePage /></ProtectedRoute>}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ViewTransitionWrapper>
      </div>
    </>
  );
}

// Main App Component - Now primarily for Providers
function App() {
  return (
    <ErrorBoundary>
      <ForceUpdateProvider>
        <AppDataProvider>
          <MainAppContent />
        </AppDataProvider>
      </ForceUpdateProvider>
    </ErrorBoundary>
  );
}

export default App; 