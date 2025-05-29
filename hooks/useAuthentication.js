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

const AUTH_CHANGE_EVENT = 'authChangeEvent';

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

  const dispatchAuthChange = (newCode) => {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: { userCode: newCode } }));
  };

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
        console.log('✅ Created new account:', result.code);
        return { success: true, code: result.code };
      } else {
        setLoginError(result.error);
        return result;
      }
    } catch {
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
        localStorage.setItem(STORAGE_KEYS.USER_CODE, loginInput);
        setUserCode(loginInput);
        dispatchAuthChange(loginInput);
        console.log('✅ Login successful for user:', loginInput);
        return { success: true };
      } else {
        setLoginError(result.error);
        return result;
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Failed to login. Try again.';
      setLoginError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = async () => {
    console.log('Logging out user:', userCode);
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
        console.error('Delete error:', result.error);
        return result;
      }
    } catch (error) {
      console.error('Delete error:', error);
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