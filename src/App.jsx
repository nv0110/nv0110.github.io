import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import useScrollbarVisibility from './hooks/useScrollbarVisibility';
import ViewTransitionWrapper from './components/ViewTransitionWrapper';
import LoginPage from './pages/LoginPage';
import InputPage from './pages/InputPage';
import BossTablePage from './pages/BossTablePage';
import WeeklyTrackerPage from './pages/WeeklyTrackerPage';
import './App.css';

// Error Boundary Component
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
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
  
  // Enable global scroll-triggered scrollbar visibility
  useScrollbarVisibility();

  return (
    <ErrorBoundary>
      <div className="App dark">
        <ViewTransitionWrapper>
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
        </ViewTransitionWrapper>
      </div>
    </ErrorBoundary>
  );
}

export default App; 