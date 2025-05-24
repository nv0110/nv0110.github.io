import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const navigate = useNavigate();
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
  } = useAuth();

  const [loginInputFocused, setLoginInputFocused] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newUserCode, setNewUserCode] = useState('');
  const [countdown, setCountdown] = useState(8);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Countdown timer for success modal
  useEffect(() => {
    if (showSuccessModal && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessModal && countdown === 0) {
      handleSuccessModalClose();
    }
  }, [showSuccessModal, countdown]);

  // Auto-hide copied toast
  useEffect(() => {
    if (showCopiedToast) {
      const timer = setTimeout(() => setShowCopiedToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showCopiedToast]);

  // Redirect if already logged in
  if (isLoggedIn) {
    navigate('/', { replace: true });
    return null;
  }

  const handleCreateAccountWrapper = async () => {
    const result = await handleCreateAccount();
    if (result.success) {
      setNewUserCode(result.code);
      setShowSuccessModal(true);
      setCountdown(8);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setNewUserCode('');
    setCountdown(8);
    navigate('/', { replace: true });
  };

  const handleLoginWrapper = async () => {
    const result = await handleLogin();
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
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#a259f7',
              cursor: 'pointer',
              padding: '0.25rem',
              fontSize: '0.9rem',
              borderRadius: 4,
              transition: 'all 0.2s ease'
            }}
            title={showPassword ? 'Hide password' : 'Show password'}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(162, 89, 247, 0.1)';
              e.currentTarget.style.color = '#b470ff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#a259f7';
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        
        <button
          onClick={handleLoginWrapper}
          disabled={!loginInput.trim()}
          style={{ 
            background: loginInput.trim() ? '#805ad5' : '#555', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            padding: '0.7rem 1.5rem', 
            fontWeight: 700, 
            fontSize: '1.1rem', 
            cursor: loginInput.trim() ? 'pointer' : 'not-allowed', 
            opacity: loginInput.trim() ? 1 : 0.6, 
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: loginInput.trim() ? '0 2px 8px rgba(128, 90, 213, 0.3)' : 'none',
            transform: 'translateY(0)',
            width: '100%'
          }}
          onMouseOver={e => {
            if (loginInput.trim()) {
              e.currentTarget.style.background = '#9f7aea';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(128, 90, 213, 0.4)';
            }
          }}
          onMouseOut={e => {
            if (loginInput.trim()) {
              e.currentTarget.style.background = '#805ad5';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(128, 90, 213, 0.3)';
            }
          }}
          onMouseDown={e => {
            if (loginInput.trim()) {
              e.currentTarget.style.transform = 'translateY(1px)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(128, 90, 213, 0.2)';
            }
          }}
          onMouseUp={e => {
            if (loginInput.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(128, 90, 213, 0.4)';
            }
          }}
        >
          Login
        </button>
        
        {loginError && (
          <div style={{ 
            color: '#ff6b6b', 
            fontSize: '0.95rem', 
            textAlign: 'center', 
            marginTop: 8,
            padding: '0.5rem',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: 6,
            animation: 'fadeInShake 0.5s ease-out'
          }}>
            {loginError}
          </div>
        )}
        
        <div style={{ 
          fontSize: '0.85rem', 
          color: '#888', 
          textAlign: 'center', 
          marginTop: 16, 
          lineHeight: 1.4 
        }}>
          Your code acts as both username and password. Keep it safe!
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(40, 32, 74, 0.95)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'modalFadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: '#2d2540',
            borderRadius: 16,
            padding: '3rem 2.5rem',
            maxWidth: 480,
            color: '#e6e0ff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            position: 'relative',
            minWidth: 400,
            textAlign: 'center',
            border: '2px solid #a259f7',
            animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              background: 'linear-gradient(135deg, #a259f7, #805ad5)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 4px 20px rgba(162, 89, 247, 0.4)',
              animation: 'checkmarkBounce 0.6s ease-out 0.2s both'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 20, fontSize: '1.8rem' }}>
              Account Created!
            </h2>

            <div style={{ 
              background: 'rgba(162, 89, 247, 0.1)', 
              border: '2px solid rgba(162, 89, 247, 0.3)',
              borderRadius: 12, 
              padding: '20px', 
              marginBottom: 28 
            }}>
              <p style={{ marginBottom: 16, fontSize: '1.1rem', lineHeight: '1.5', color: '#e6e0ff' }}>
                <strong>⚠️ IMPORTANT: Save this code immediately!</strong>
                <br />
                This is your unique login code. You cannot recover it if lost.
              </p>
              
              <div style={{
                background: '#3a335a',
                borderRadius: 8,
                padding: '16px',
                margin: '16px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <span style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: '#a259f7',
                  letterSpacing: '2px'
                }}>
                  {newUserCode}
                </span>
                <button
                  onClick={copyToClipboard}
                  style={{
                    background: '#805ad5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)'
                  }}
                  title="Copy to clipboard"
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#9f7aea';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(128, 90, 213, 0.4)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#805ad5';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseDown={e => {
                    e.currentTarget.style.transform = 'translateY(1px)';
                  }}
                  onMouseUp={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                >
                  📋 Copy
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.95rem', color: '#b39ddb' }}>
                Write it down, take a screenshot, or save it in a password manager.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: 8,
              padding: '12px',
              marginBottom: 24,
              fontSize: '1rem',
              color: '#ffc107'
            }}>
              Auto-login in {countdown} seconds...
            </div>

            <button
              onClick={handleSuccessModalClose}
              style={{
                background: 'linear-gradient(135deg, #a259f7, #805ad5)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '0.8rem 2rem',
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(162, 89, 247, 0.3)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: 'translateY(0)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #b470ff, #9f7aea)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(162, 89, 247, 0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #a259f7, #805ad5)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.3)';
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'translateY(1px)';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
            >
              I've Saved My Code - Continue
            </button>
          </div>
        </div>
      )}

      {/* Copied to Clipboard Toast */}
      {showCopiedToast && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.95rem',
          fontWeight: 600,
          animation: 'toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          ✅ Copied to clipboard!
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes checkmarkBounce {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.1);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes fadeInShake {
          0% {
            opacity: 0;
            transform: translateX(-10px);
          }
          25% {
            transform: translateX(10px);
          }
          50% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default LoginPage; 