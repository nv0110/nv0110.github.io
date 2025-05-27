import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, COOLDOWNS } from '../constants';

// Helper: get supabase client dynamically for code splitting
async function getSupabase() {
  const { supabase } = await import('../supabaseClient');
  return supabase;
}

export function useAuth() {
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState(() => localStorage.getItem(STORAGE_KEYS.USER_CODE) || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!userCode);
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createCooldown, setCreateCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Cooldown timer effect
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
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    
    try {
      const initialData = {
        characters: [],
        checked: {},
        lastUpdated: new Date().toISOString()
      };
      
      const supabase = await getSupabase();
      const { error } = await supabase.from('user_data').upsert([{ 
        id: code, 
        data: initialData,
        pitched_items: []
      }]);
      
      if (!error) {
        setIsCreating(false);
        setCreateCooldown(0);
        console.log('✅ Created new account:', code);
        return { success: true, code };
      } else {
        setLoginError('Failed to create account. Try again.');
        setIsCreating(false);
        return { success: false, error: 'Failed to create account. Try again.' };
      }
    } catch (error) {
      setLoginError('Failed to create account. Try again.');
      setIsCreating(false);
      return { success: false, error: 'Failed to create account. Try again.' };
    }
  };

  const handleLogin = async () => {
    setLoginError('');
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('id', loginInput)
        .single();
        
      if (error || !data) {
        setLoginError('Invalid code.');
        return { success: false, error: 'Invalid code.' };
      }

      setUserCode(loginInput);
      setIsLoggedIn(true);
      localStorage.setItem(STORAGE_KEYS.USER_CODE, loginInput);
      
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
    
    setUserCode('');
    setIsLoggedIn(false);
    localStorage.removeItem(STORAGE_KEYS.USER_CODE);
    
    // Navigate to login page
    navigate('/login', { replace: true });
    
    return { success: true };
  };

  const handleDeleteAccount = async () => {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase.from('user_data').delete().eq('id', userCode);
      
      if (error) {
        return { success: false, error: 'Failed to delete account. Try again.' };
      }
      
      setUserCode('');
      setIsLoggedIn(false);
      localStorage.removeItem(STORAGE_KEYS.USER_CODE);
      localStorage.clear();
      
      // Navigate to login page
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