import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthentication } from '../../hooks/useAuthentication';
import { logger } from '../utils/logger';
import '../styles/modals.css';

function LoginPage() {
  const {
    userCode,
    isLoggedIn,
    loginInput,
    setLoginInput,
    loginError,
    setLoginError,
    isCreating,
    createCooldown,
    showPassword,
    setShowPassword,
    handleCreateAccount,
    handleLogin,
  } = useAuthentication();

  const navigate = useNavigate();
  const location = useLocation();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newUserCode, setNewUserCode] = useState('');
  const [countdown, setCountdown] = useState(6);
  const [loginInputFocused, setLoginInputFocused] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const performLoginAndNavigate = async () => {
    if (newUserCode && loginInput !== newUserCode) {
      // setLoginInput(newUserCode); // handleCreateAccountWrapper already does this.
                                 // handleLogin in useAuthentication should use its internal loginInput state,
                                 // which is updated by setLoginInput.
    }
    const loginResult = await handleLogin();
    if (loginResult.success) {
      // Trigger immediate data refresh after successful login
      setTimeout(() => {
        const refreshEvent = new CustomEvent('authDataRefresh', { 
          detail: { userCode: newUserCode, action: 'create' } 
        });
        window.dispatchEvent(refreshEvent);
      }, 100);
      
      // Use controlled navigation with a small delay to ensure auth state has settled
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 200);
      setShowSuccessModal(false);
    } else {
      // Auto-login failed. Modal will close, user can try manually.
      setShowSuccessModal(false); 
      // setNewUserCode(''); // Keep newUserCode so they can see it if modal is re-shown or for copy
    }
  };
  
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setCountdown(6); // Reset countdown for next time
    // Navigation is handled by performLoginAndNavigate or if user logs in manually
  };

  useEffect(() => {
    let timer;
    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showSuccessModal && countdown === 0) {
      performLoginAndNavigate();
    }
    return () => clearTimeout(timer);
  }, [showSuccessModal, countdown, newUserCode, isLoggedIn]); // Added isLoggedIn to deps to avoid running if already logged in during redirect

  useEffect(() => {
    if (showCopiedToast) {
      const timer = setTimeout(() => setShowCopiedToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showCopiedToast]);

  if (isLoggedIn) {
    // navigate('/', { replace: true }); // This can cause issues if modal effect runs after redirect
    // Return null or a loader, the main App component will redirect ProtectedRoutes
    return null; 
  }

  const handleCreateAccountWrapper = async () => {
    const result = await handleCreateAccount();
    if (result.success && result.code) {
      setNewUserCode(result.code);
      setLoginInput(result.code); // PRE-FILL LOGIN INPUT for useAuthentication's handleLogin
      setShowSuccessModal(true);
      setCountdown(6); 
    }
  };

  const handleLoginWrapper = async () => {
    if (isLoggingIn) return; // Prevent double-clicks
    
    setIsLoggingIn(true);
    setLoginError(''); // Clear any previous errors
    
    try {
      const result = await handleLogin(); // Uses loginInput from useAuthentication state
      if (result.success) {
        // Use controlled navigation with a small delay to ensure auth state has settled
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 200);
      }
    } catch (error) {
      console.error('Login wrapper error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && loginInput.trim() && !isLoggingIn) {
      handleLoginWrapper();
    }
  };

  return (
    <div style={{
      padding: '2rem 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%'
    }}>
      <h1 style={{ fontWeight: 700, fontSize: '2.2rem', marginBottom: '1.5rem' }}>
        Maplestory Boss Crystal Calculator
      </h1>
      
      <div style={{ 
        background: '#2d2540', 
        borderRadius: 10, 
        padding: '2rem', 
        boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)', 
        minWidth: 320, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16, 
        alignItems: 'center' 
      }}>
        <button
          onClick={handleCreateAccountWrapper}
          disabled={isCreating || createCooldown > 0}
          style={{ 
            background: isCreating || createCooldown > 0 ? '#6b46c1' : '#a259f7', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            padding: '0.7rem 1.5rem', 
            fontWeight: 700, 
            fontSize: '1.1rem', 
            marginBottom: 8, 
            opacity: isCreating || createCooldown > 0 ? 0.6 : 1, 
            cursor: isCreating || createCooldown > 0 ? 'not-allowed' : 'pointer', 
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
            boxShadow: isCreating || createCooldown > 0 ? 'none' : '0 2px 8px rgba(162, 89, 247, 0.3)',
            transform: 'translateY(0)',
            width: '100%'
          }}
          onMouseOver={e => {
            if (!(isCreating || createCooldown > 0)) {
              e.currentTarget.style.background = '#b470ff';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.4)';
            }
          }}
          onMouseOut={e => {
            if (!(isCreating || createCooldown > 0)) {
              e.currentTarget.style.background = '#a259f7';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(162, 89, 247, 0.3)';
            }
          }}
          onMouseDown={e => {
            if (!(isCreating || createCooldown > 0)) {
              e.currentTarget.style.transform = 'translateY(1px)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(162, 89, 247, 0.2)';
            }
          }}
          onMouseUp={e => {
            if (!(isCreating || createCooldown > 0)) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.4)';
            }
          }}
        >
          {isCreating ? 'Creating Account...' : createCooldown > 0 ? `Creating Account (${createCooldown})` : 'Create Account'}
        </button>
        
        <div style={{ 
          width: '100%', 
          textAlign: 'center', 
          color: '#b39ddb', 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          margin: '16px 0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12 
        }}>
          <span style={{ flex: 1, height: 1, background: '#3a335a' }}></span>
          <span style={{ fontSize: '1.2em', fontWeight: 700 }}>or</span>
          <span style={{ flex: 1, height: 1, background: '#3a335a' }}></span>
        </div>
        
        <div style={{ position: 'relative', width: '100%', marginBottom: 8 }}>
          <input
            type={showPassword ? "text" : "password"}
            value={loginInput}
            onChange={e => setLoginInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter your code"
            onFocus={() => setLoginInputFocused(true)}
            onBlur={() => setLoginInputFocused(false)}
            style={{ 
              background: '#3a335a', 
              color: '#e6e0ff', 
              border: loginInputFocused ? '2px solid #a259f7' : '1.5px solid #2d2540', 
              borderRadius: 6, 
              padding: '0.5rem 1rem', 
              fontSize: '1.1rem', 
              width: '100%', 
              boxSizing: 'border-box',
              outline: 'none', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: loginInputFocused ? '0 0 0 3px rgba(162, 89, 247, 0.1), 0 0 20px rgba(162, 89, 247, 0.1)' : 'none',
              paddingRight: '3rem'
            }}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#b39ddb',
              cursor: 'pointer',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={showPassword ? "Hide code" : "Show code"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
            )}
          </button>
        </div>

        <button
          onClick={handleLoginWrapper}
          disabled={!loginInput.trim() || isLoggingIn}
          style={{ 
            background: (!loginInput.trim() || isLoggingIn) ? '#4a4570' : '#6b46c1', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            padding: '0.7rem 1.5rem', 
            fontWeight: 700, 
            fontSize: '1.1rem', 
            cursor: (!loginInput.trim() || isLoggingIn) ? 'not-allowed' : 'pointer', 
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
            boxShadow: (!loginInput.trim() || isLoggingIn) ? 'none' : '0 2px 8px rgba(107, 70, 193, 0.3)',
            transform: 'translateY(0)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={e => {
            if (!(!loginInput.trim() || isLoggingIn)) {
              e.currentTarget.style.background = '#7c5dc7';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 70, 193, 0.4)';
            }
          }}
          onMouseOut={e => {
            if (!(!loginInput.trim() || isLoggingIn)) {
              e.currentTarget.style.background = '#6b46c1';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 70, 193, 0.3)';
            }
          }}
          onMouseDown={e => {
            if (!(!loginInput.trim() || isLoggingIn)) {
              e.currentTarget.style.transform = 'translateY(1px)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(107, 70, 193, 0.2)';
            }
          }}
          onMouseUp={e => {
            if (!(!loginInput.trim() || isLoggingIn)) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 70, 193, 0.4)';
            }
          }}
        >
          {isLoggingIn && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #fff',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          )}
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
        {/* loginError from useAuthentication will be displayed here if present */}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <AccountCreatedModal
          show={showSuccessModal}
          userCode={newUserCode}
          countdown={countdown}
          onLoginNow={performLoginAndNavigate}
          onClose={handleSuccessModalClose}
        />
      )}
    </div>
  );
}

// Account Created Confirmation Modal Component
function AccountCreatedModal({ 
  show, 
  userCode, 
  countdown, 
  onLoginNow, 
  onClose
}) {
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      logger.error('Failed to copy to clipboard:', err);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content account-created-modal">
        <div className="account-created-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="account-created-title">
          Account Created Successfully!
        </h2>
        
        <p className="account-created-subtitle">
          Your unique login code is:
        </p>
        
        <div className="account-created-code-container">
          <span className="account-created-code">
            {userCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="account-created-copy-btn"
            title="Copy Code"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>

        <div className="account-created-warning">
          <p>
            <strong>⚠️ Important:</strong> Please save this code immediately. It's the only way to access your account. 
            If you lose it, your data cannot be recovered.
          </p>
        </div>

        <div className="account-created-countdown">
          <p>
            Logging you in automatically in: <strong>{countdown}</strong>s
          </p>
        </div>

        <div className="modal-button-container">
          <button
            onClick={onLoginNow}
            className="modal-btn modal-btn-primary"
          >
            Login Now
          </button>
          <button
            onClick={onClose}
            className="modal-btn-cancel"
          >
            Close
          </button>
        </div>

        {showCopiedToast && (
          <div className="account-created-toast">
            Code Copied!
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage; 