import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { syncPitchedItemsToCheckedState, getCurrentWeekKey } from '../pitched-data-service';
import { STORAGE_KEYS, COOLDOWNS } from '../constants';

export function useAuth() {
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
        weekKey: getCurrentWeekKey(),
        pitched_item_tracking: {
          lastUpdated: new Date().toISOString(),
          itemCount: 0,
          weekKeys: [getCurrentWeekKey()]
        },
        weeklyHistory: [],
        lastReset: new Date().toISOString()
      };
      
      const { error } = await supabase.from('user_data').upsert([{ 
        id: code, 
        data: initialData,
        pitched_items: []
      }]);
      
      if (!error) {
        setIsCreating(false);
        setCreateCooldown(0);
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
      const { data, error } = await supabase
        .from('user_data')
        .select('data, pitched_items')
        .eq('id', loginInput)
        .single();
        
      if (error || !data) {
        setLoginError('Invalid code.');
        return { success: false, error: 'Invalid code.' };
      }

      setUserCode(loginInput);
      setIsLoggedIn(true);
      localStorage.setItem(STORAGE_KEYS.USER_CODE, loginInput);
      
      const currentWeekKey = getCurrentWeekKey();
      const storedWeekKey = data.data?.weekKey;
      const pitchedItems = data.pitched_items || [];
      
      let syncedCheckedState;
      
      if (storedWeekKey === currentWeekKey && data.data?.checked) {
        syncedCheckedState = syncPitchedItemsToCheckedState(
          pitchedItems,
          data.data.checked,
          currentWeekKey
        );
      } else {
        syncedCheckedState = syncPitchedItemsToCheckedState(
          pitchedItems,
          {},
          currentWeekKey
        );
        
        await supabase.from('user_data').upsert([{ 
          id: loginInput, 
          data: { 
            ...data.data, 
            weekKey: currentWeekKey, 
            checked: syncedCheckedState,
            pitched_item_tracking: {
              ...(data.data?.pitched_item_tracking || {}),
              lastUpdated: new Date().toISOString(),
              weekKeys: [...new Set([...(data.data?.pitched_item_tracking?.weekKeys || []), currentWeekKey])]
            }
          } 
        }]);
      }

      return { 
        success: true, 
        userData: {
          characters: data.data?.characters || [],
          checked: syncedCheckedState,
          pitchedItems
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Failed to login. Try again.');
      return { success: false, error: 'Failed to login. Try again.' };
    }
  };

  const handleLogout = async (characters, checked) => {
    if (isLoggedIn && userCode) {
      try {
        await supabase.from('user_data').upsert([{ 
          id: userCode, 
          data: { 
            characters, 
            checked, 
            weekKey: getCurrentWeekKey(),
            lastUpdated: new Date().toISOString()
          } 
        }]);
      } catch (error) {
        console.error('Error saving data before logout:', error);
      }
    }
    
    setUserCode('');
    setIsLoggedIn(false);
    localStorage.removeItem(STORAGE_KEYS.USER_CODE);
    return { success: true };
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.from('user_data').delete().eq('id', userCode);
      
      if (error) {
        return { success: false, error: 'Failed to delete account. Try again.' };
      }
      
      setUserCode('');
      setIsLoggedIn(false);
      localStorage.removeItem(STORAGE_KEYS.USER_CODE);
      localStorage.clear();
      
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