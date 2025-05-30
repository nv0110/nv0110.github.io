/**
 * Authentication Hook
 * 
 * Consolidated authentication hook using the new authentication service.
 * Provides the same interface as the legacy useAuth hook for compatibility.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, COOLDOWNS } from '../src/constants';
import { createAccount, loginUser, deleteUserAccount } from '../services/authenticationService';
import { logger } from '../src/utils/logger';

const AUTH_CHANGE_EVENT = 'authChangeEvent';

// Unified authentication event dispatcher for global state consistency
// This allows different parts of the app to subscribe to authentication changes
function dispatchAuthChange(userCode) {
  const event = new CustomEvent('authChange', { detail: { userCode } });
  window.dispatchEvent(event);
}

export function useAuthentication() {
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState(() => {
    const codeFromStorage = localStorage.getItem(STORAGE_KEYS.USER_CODE) || '';
    return codeFromStorage;
  });

  // isLoggedIn is derived from userCode state
  const isLoggedIn = !!userCode;

  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createCooldown, setCreateCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleAuthChange = (event) => {
      const newCode = event.detail.userCode || '';
      if (userCode !== newCode) {
        setUserCode(newCode);
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    // Initial sync and resync if localStorage was changed externally
    const codeFromStorage = localStorage.getItem(STORAGE_KEYS.USER_CODE) || '';
    if (userCode !== codeFromStorage) {
      setUserCode(codeFromStorage);
    }

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [userCode]);

  useEffect(() => {
    if (createCooldown > 0) {
      const timer = setTimeout(() => setCreateCooldown(createCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [createCooldown]);

  const handleCreateAccount = async () => {
    if (createCooldown > 0) {
      return { success: false, error: 'Please wait a few seconds before creating another account.' };
    }
    
    setIsCreating(true);
    setCreateCooldown(COOLDOWNS.CREATE_ACCOUNT);
    
    try {
      const result = await createAccount();
      setIsCreating(false);
      
      if (result.success) {
        setCreateCooldown(0);
        logger.info('✅ Created new account:', result.code);
        localStorage.setItem(STORAGE_KEYS.USER_CODE, result.code);
        setUserCode(result.code);
        dispatchAuthChange(result.code);
        return { success: true, code: result.code };
      } else {
        logger.error('Account creation failed:', result.error);
        setLoginError(result.error);
        return result;
      }
    } catch (error) {
      logger.error('Account creation error:', error);
      setIsCreating(false);
      const errorMessage = 'Failed to create account. Try again.';
      setLoginError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleLogin = async () => {
    setLoginError('');
    
    try {
      const result = await loginUser(loginInput);
      
      if (result.success) {
        logger.info('✅ Login successful for user:', loginInput);
        localStorage.setItem(STORAGE_KEYS.USER_CODE, loginInput);
        setUserCode(loginInput);
        dispatchAuthChange(loginInput);
        return { success: true };
      } else {
        logger.error('Login failed:', result.error);
        setLoginError(result.error);
        return result;
      }
    } catch (error) {
      logger.error('Login error:', error);
      const errorMessage = 'Failed to login. Try again.';
      setLoginError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = async () => {
    logger.info('Logging out user:', userCode);
    localStorage.removeItem(STORAGE_KEYS.USER_CODE);
    setUserCode('');
    dispatchAuthChange('');
    navigate('/login', { replace: true });
    return { success: true };
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await deleteUserAccount(userCode);
      
      if (result.success) {
        localStorage.removeItem(STORAGE_KEYS.USER_CODE);
        setUserCode('');
        dispatchAuthChange('');
        navigate('/login', { replace: true });
        return { success: true };
      } else {
        logger.error('Delete error:', result.error);
        return result;
      }
    } catch (error) {
      logger.error('Delete error:', error);
      return { success: false, error: 'Failed to delete account. Try again.' };
    }
  };

  return {
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
    handleLogout,
    handleDeleteAccount,
  };
}