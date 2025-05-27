import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, Component } from 'react';
import { useAuth } from './hooks/useAuth';
import { ForceUpdateProvider } from './hooks/ForceUpdateContext';
import ViewTransitionWrapper from './components/ViewTransitionWrapper';
import { AppDataProvider } from './hooks/AppDataContext.jsx';
import './App.css';

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
  const { isLoggedIn } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Main App Component
function App() {
  const { isLoggedIn } = useAuth();

  return (
    <ErrorBoundary>
      <ForceUpdateProvider>
        <AppDataProvider>
          <div className="App dark">
            <ViewTransitionWrapper>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Login Route - redirect to home if already logged in */}
                <Route 
                  path="/login" 
                  element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} 
                />
                
                {/* Protected Routes */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <InputPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/weeklytracker" 
                  element={
                    <ProtectedRoute>
                      <WeeklyTrackerPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/bosstable" 
                  element={
                    <ProtectedRoute>
                      <BossTablePage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch all route - 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </ViewTransitionWrapper>
          </div>
        </AppDataProvider>
      </ForceUpdateProvider>
    </ErrorBoundary>
  );
}

export default App; 