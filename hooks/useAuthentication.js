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
  const event = new CustomEvent(AUTH_CHANGE_EVENT, { detail: { userCode } });
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
        
        // DO NOT immediately set the user as logged in
        // Let the confirmation modal handle the login process
        
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
        
        // Trigger immediate data refresh after successful login
        setTimeout(() => {
          const refreshEvent = new CustomEvent('authDataRefresh', { 
            detail: { userCode: loginInput, action: 'login' } 
          });
          window.dispatchEvent(refreshEvent);
        }, 100);
        
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
    
    // Clear localStorage first
    localStorage.removeItem(STORAGE_KEYS.USER_CODE);
    
    // Update state in sequence to prevent cascading effects
    setUserCode('');
    dispatchAuthChange('');
    
    // Use shorter delay - 500ms was too long and allowed navbar to stay visible
    // Most React effects should finish within 100ms
    setTimeout(() => {
      // Double-check we're still in logout state before navigating
      const currentCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
      if (!currentCode) {
        navigate('/login', { replace: true });
      }
    }, 100); // Reduced from 500ms to 100ms for faster logout
    
    return { success: true };
  };

  const handleDeleteAccount = async () => {
    const userCodeToDelete = userCode; // Store reference before clearing state
    
    if (!userCodeToDelete) {
      return { success: false, error: 'No user logged in.' };
    }
    
    try {
      // Clear authentication state IMMEDIATELY to prevent other hooks from making requests
      localStorage.removeItem(STORAGE_KEYS.USER_CODE);
      setUserCode('');
      dispatchAuthChange('');
      
      // Now delete the account from the database
      const result = await deleteUserAccount(userCodeToDelete);
      
      if (result.success) {
        // Navigate to login page
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 100);
        return { success: true };
      } else {
        // If deletion failed, restore the authentication state
        logger.error('Delete error - restoring auth state:', result.error);
        localStorage.setItem(STORAGE_KEYS.USER_CODE, userCodeToDelete);
        setUserCode(userCodeToDelete);
        dispatchAuthChange(userCodeToDelete);
        return result;
      }
    } catch (error) {
      logger.error('Delete error - network/unexpected error:', error);
      // For network errors, try to restore auth state
      try {
        localStorage.setItem(STORAGE_KEYS.USER_CODE, userCodeToDelete);
        setUserCode(userCodeToDelete);
        dispatchAuthChange(userCodeToDelete);
        return { success: false, error: 'Network error. Please try again.' };
      } catch (restoreError) {
        // If we can't restore state, navigate to login
        logger.error('Failed to restore auth state after delete error:', restoreError);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 100);
        return { success: false, error: 'Failed to delete account. Please try again.' };
      }
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