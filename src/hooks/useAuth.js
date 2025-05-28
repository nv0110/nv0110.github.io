import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, COOLDOWNS } from '../constants';

// Helper: get supabase client dynamically for code splitting
async function getSupabase() {
  const { supabase } = await import('../supabaseClient');
  return supabase;
}

const AUTH_CHANGE_EVENT = 'authChangeEvent';

export function useAuth() {
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState(() => {
    const codeFromStorage = localStorage.getItem(STORAGE_KEYS.USER_CODE) || '';
    // console.log('useAuth: Initializing userCode from localStorage:', codeFromStorage); // Keep for now
    return codeFromStorage;
  });

  // isLoggedIn is derived from userCode state.
  const isLoggedIn = !!userCode;

  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createCooldown, setCreateCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleAuthChange = (event) => {
      const newCode = event.detail.userCode || '';
      // console.log(`useAuth: Event '${AUTH_CHANGE_EVENT}' received. New code: '${newCode}', Current instance code: '${userCode}'`);
      if (userCode !== newCode) {
        // console.log('useAuth: Updating userCode from event.');
        setUserCode(newCode);
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);

    // Initial sync and resync if localStorage was changed externally (e.g. devtools, another tab not firing event here)
    const codeFromStorage = localStorage.getItem(STORAGE_KEYS.USER_CODE) || '';
    if (userCode !== codeFromStorage) {
      // console.log('useAuth: Mismatch detected between state and localStorage on mount/userCode change. Syncing.');
      setUserCode(codeFromStorage);
    }

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [userCode]); // Rerun if userCode changes to ensure the comparison `userCode !== newCode` is fresh.

  useEffect(() => {
    if (createCooldown > 0) {
      const timer = setTimeout(() => setCreateCooldown(createCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [createCooldown]);

  const dispatchAuthChange = (newCode) => {
    // console.log(`useAuth: Dispatching '${AUTH_CHANGE_EVENT}' with code: '${newCode}'`);
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: { userCode: newCode } }));
  };

  const handleCreateAccount = async () => {
    if (createCooldown > 0) {
      return { success: false, error: 'Please wait a few seconds before creating another account.' };
    }
    setIsCreating(true);
    setCreateCooldown(COOLDOWNS.CREATE_ACCOUNT);
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    try {
      const initialData = { characters: [], checked: {}, lastUpdated: new Date().toISOString() };
      const supabase = await getSupabase();
      const { error } = await supabase.from('user_data').upsert([{ id: code, data: initialData, pitched_items: [] }]);
      setIsCreating(false);
      if (!error) {
        setCreateCooldown(0);
        console.log('✅ Created new account:', code);
        return { success: true, code }; // LoginPage will call handleLogin with this code
      } else {
        setLoginError('Failed to create account. Try again.');
        return { success: false, error: 'Failed to create account. Try again.' };
      }
    } catch (error) {
      setIsCreating(false);
      setLoginError('Failed to create account. Try again.');
      return { success: false, error: 'Failed to create account. Try again.' };
    }
  };

  const handleLogin = async () => {
    setLoginError('');
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.from('user_data').select('data').eq('id', loginInput).single();
      if (error || !data) {
        setLoginError('Invalid code.');
        return { success: false, error: 'Invalid code.' };
      }
      localStorage.setItem(STORAGE_KEYS.USER_CODE, loginInput);
      setUserCode(loginInput); // Update this instance's state
      dispatchAuthChange(loginInput); // Notify other instances
      console.log('✅ Login successful for user:', loginInput);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Failed to login. Try again.');
      return { success: false, error: 'Failed to login. Try again.' };
    }
  };

  const handleLogout = async () => {
    console.log('Logging out user:', userCode);
    localStorage.removeItem(STORAGE_KEYS.USER_CODE);
    setUserCode(''); // Update this instance's state
    dispatchAuthChange(''); // Notify other instances
    navigate('/login', { replace: true });
    return { success: true };
  };

  const handleDeleteAccount = async () => {
    try {
      const supabase = await getSupabase();
      const { error: deleteError } = await supabase.from('user_data').delete().eq('id', userCode);
      if (deleteError) {
        console.error('Delete error:', deleteError);
        return { success: false, error: 'Failed to delete account. Try again.' };
      }
      localStorage.removeItem(STORAGE_KEYS.USER_CODE);
      // Consider if localStorage.clear() is appropriate or too broad.
      // For now, just removing the specific user code.
      setUserCode(''); // Update this instance's state
      dispatchAuthChange(''); // Notify other instances
      navigate('/login', { replace: true });
      return { success: true };
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

