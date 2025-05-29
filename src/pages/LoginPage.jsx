import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const navigate = useNavigate();
  const {
    isLoggedIn,
    loginInput,
    setLoginInput,
    isCreating,
    createCooldown,
    showPassword,
    setShowPassword,
    handleCreateAccount,
    handleLogin,
  } = useAuth();

  const [loginInputFocused, setLoginInputFocused] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newUserCode, setNewUserCode] = useState('');
  const [countdown, setCountdown] = useState(8);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const performLoginAndNavigate = async () => {
    if (newUserCode && loginInput !== newUserCode) {
      // setLoginInput(newUserCode); // handleCreateAccountWrapper already does this.
                                 // handleLogin in useAuth should use its internal loginInput state,
                                 // which is updated by setLoginInput.
    }
    const loginResult = await handleLogin();
    if (loginResult.success) {
      navigate('/', { replace: true });
    } else {
      // Auto-login failed. Modal will close, user can try manually.
      setShowSuccessModal(false); 
      // setNewUserCode(''); // Keep newUserCode so they can see it if modal is re-shown or for copy
    }
  };
  
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setCountdown(8); // Reset countdown for next time
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
      setLoginInput(result.code); // PRE-FILL LOGIN INPUT for useAuth's handleLogin
      setShowSuccessModal(true);
      setCountdown(8); 
    }
  };

  const handleLoginWrapper = async () => {
    const result = await handleLogin(); // Uses loginInput from useAuth state
    if (result.success) {
      navigate('/', { replace: true });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && loginInput.trim()) {
      handleLoginWrapper();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(newUserCode);
      setShowCopiedToast(true);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
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
          disabled={!loginInput.trim()}
          style={{ 
            background: !loginInput.trim() ? '#4a4570' : '#6b46c1', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            padding: '0.7rem 1.5rem', 
            fontWeight: 700, 
            fontSize: '1.1rem', 
            cursor: !loginInput.trim() ? 'not-allowed' : 'pointer', 
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
            boxShadow: !loginInput.trim() ? 'none' : '0 2px 8px rgba(107, 70, 193, 0.3)',
            transform: 'translateY(0)',
            width: '100%'
          }}
          onMouseOver={e => {
            if (loginInput.trim()) {
              e.currentTarget.style.background = '#805ad5';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 70, 193, 0.4)';
            }
          }}
          onMouseOut={e => {
            if (loginInput.trim()) {
              e.currentTarget.style.background = '#6b46c1';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 70, 193, 0.3)';
            }
          }}
          onMouseDown={e => {
            if (loginInput.trim()) {
              e.currentTarget.style.transform = 'translateY(1px)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(107, 70, 193, 0.2)';
            }
          }}
          onMouseUp={e => {
            if (loginInput.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 70, 193, 0.4)';
            }
          }}
        >
          Login
        </button>
        {/* loginError from useAuth will be displayed here if present */}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#2d2540',
            padding: '2rem',
            borderRadius: 12,
            textAlign: 'center',
            boxShadow: '0 5px 25px rgba(0,0,0,0.3)',
            width: '90%',
            maxWidth: 420,
            border: '1px solid #4a3b73',
            animation: 'modalFadeIn 0.3s ease-out, modalSlideIn 0.4s ease-out'
          }}>
            <h2 style={{ fontSize: '1.8rem', color: '#a259f7', marginBottom: '1rem', fontWeight: 700 }}>
              Account Created!
            </h2>
            <p style={{ marginBottom: '1rem', fontSize: '1rem', color: '#e6e0ff' }}>
              Your unique login code is:
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: '#3a335a',
              padding: '0.7rem 1rem',
              borderRadius: 6,
              marginBottom: '1.5rem',
              border: '1px solid #4a3b73'
            }}>
              <span style={{ 
                fontSize: '1.4rem', 
                fontWeight: 'bold', 
                color: '#f0e6ff', 
                letterSpacing: '1.5px',
                fontFamily: '"Roboto Mono", monospace' 
              }}>
                {newUserCode}
              </span>
              <button
                onClick={copyToClipboard}
                title="Copy Code"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a259f7',
                  padding: '0.3rem'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            
            {showCopiedToast && (
              <div style={{
                position: 'absolute',
                bottom: '20px', 
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#a259f7',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                boxShadow: '0 2px 10px rgba(162, 89, 247, 0.4)',
                animation: 'toastFadeInOut 2s ease-in-out forwards'
              }}>
                Code Copied!
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: '#b39ddb', marginBottom: '0.5rem' }}>
              Please save this code. It's the only way to access your data.
            </p>
            <p style={{ fontSize: '1rem', color: '#e6e0ff', marginBottom: '1.5rem' }}>
              Logging you in automatically in: <strong style={{color: '#a259f7'}}>{countdown}</strong>s
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={performLoginAndNavigate} // "Continue" button
                style={{
                  background: '#a259f7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.6rem 1.2rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flex: 1
                }}
                onMouseOver={e => e.currentTarget.style.background = '#b470ff'}
                onMouseOut={e => e.currentTarget.style.background = '#a259f7'}
              >
                Login Now
              </button>
              <button
                onClick={handleSuccessModalClose} // Close button
                style={{
                  background: '#4a3b73',
                  color: '#e6e0ff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.6rem 1.2rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flex: 1
                }}
                onMouseOver={e => e.currentTarget.style.background = '#5a4b83'}
                onMouseOut={e => e.currentTarget.style.background = '#4a3b73'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { transform: translateY(20px) scale(0.95); opacity: 0.6; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes toastFadeInOut {
          0% { opacity: 0; transform: translateY(10px) translateX(-50%); }
          10% { opacity: 1; transform: translateY(0) translateX(-50%); }
          90% { opacity: 1; transform: translateY(0) translateX(-50%); }
          100% { opacity: 0; transform: translateY(10px) translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage; 