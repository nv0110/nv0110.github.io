import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import useScrollbarVisibility from './hooks/useScrollbarVisibility';
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
        <div className="App dark" style={{ 
          background: '#28204a', 
          minHeight: '100vh', 
                color: '#e6e0ff', 
          display: 'flex',
          flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
          <h1 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ marginBottom: '1rem', textAlign: 'center', maxWidth: 600 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
              <button 
            onClick={() => window.location.reload()} 
                style={{ 
                  background: '#a259f7', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
              padding: '0.8rem 1.5rem',
                  fontWeight: 700, 
              cursor: 'pointer'
                }}
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
    <div className="App dark" style={{ 
      background: '#28204a', 
      minHeight: '100vh', 
              color: '#e6e0ff',
      padding: '2rem', 
                display: 'flex',
      flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center'
        }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: '#a259f7' }}>404</h1>
      <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ marginBottom: '2rem', textAlign: 'center', maxWidth: 600 }}>
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
      <div className="App dark" style={{
        background: '#28204a',
        minHeight: '100vh',
        color: '#e6e0ff'
      }}>
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
      </div>
    </ErrorBoundary>
  );
}

export default App; 