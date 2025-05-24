import { useState } from 'react';
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

  // Redirect if already logged in
  if (isLoggedIn) {
    navigate('/', { replace: true });
    return null;
  }

  const handleCreateAccountWrapper = async () => {
    const result = await handleCreateAccount();
    if (result.success) {
      navigate('/', { replace: true });
    }
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

  return (    <div style={{       padding: '2rem 0',       display: 'flex',       flexDirection: 'column',       alignItems: 'center',       justifyContent: 'center',      minHeight: '100vh',      width: '100%'    }}>
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
            background: '#a259f7', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            padding: '0.7rem 1.5rem', 
            fontWeight: 700, 
            fontSize: '1.1rem', 
            marginBottom: 8, 
            opacity: isCreating || createCooldown > 0 ? 0.6 : 1, 
            cursor: isCreating || createCooldown > 0 ? 'not-allowed' : 'pointer', 
            transition: 'all 0.18s cubic-bezier(.4,2,.6,1)', 
            boxShadow: '0 2px 8px #a259f733'
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
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              boxShadow: loginInputFocused ? '0 0 0 3px rgba(162, 89, 247, 0.1)' : 'none',
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
              fontSize: '0.9rem'
            }}
            title={showPassword ? 'Hide password' : 'Show password'}
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
            transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
            boxShadow: loginInput.trim() ? '0 2px 8px #805ad533' : 'none'
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
            borderRadius: 6
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
    </div>
  );
}

export default LoginPage; 