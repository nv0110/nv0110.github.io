import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, Component, useRef } from 'react';
import { useAuthentication } from '../hooks/useAuthentication';
import { ForceUpdateProvider } from './hooks/ForceUpdateContext';
import ViewTransitionWrapper from './components/ViewTransitionWrapper';
import { AppDataProvider, useAppData } from './hooks/AppDataContext.jsx';
import './App.css';
import React from 'react';
import Navbar from './components/Navbar';
import { clearPitchedItemsForWeek } from '../services/pitchedItemsService.js';

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

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuthentication();
  const location = useLocation();
  // console.log('ProtectedRoute: isLoggedIn:', isLoggedIn, 'path:', location.pathname);

  if (!isLoggedIn) {
    // console.log('ProtectedRoute: Redirecting to /login from', location.pathname);
    return <Navigate to="/login" replace state={{ from: location }} />;
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
    
    console.log(`MainAppContent: handleWeeklyReset called for ended week: ${endedWeekKey}`);
    
    if (!userCode || !endedWeekKey) {
      console.warn('Cannot perform weekly reset: missing userCode or endedWeekKey');
      return;
    }
    
    resetInProgressRef.current = true;
    
    try {
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
                element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} 
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