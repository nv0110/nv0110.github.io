import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { syncPitchedItemsToCheckedState, getCurrentWeekKey } from '../pitched-data-service';
import { STORAGE_KEYS, COOLDOWNS } from '../constants';
import { migrateUserDataStructure, needsMigration, getCurrentWeekBossClearStatus } from '../utils/dataStructureMigration';
import { createNewWeekEntry } from '../types/dataStructure';

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
      const currentWeekKey = getCurrentWeekKey();
      
      // NEW IMPROVED DATA STRUCTURE
      const initialData = {
        // Character data
        characters: [],
        
        // NEW: Weekly boss clear tracking with historical preservation
        weeklyBossClearHistory: {
          [currentWeekKey]: createNewWeekEntry(currentWeekKey)
        },
        
        // NEW: Current active week for quick access
        currentWeekKey,
        
        // NEW: Weekly progress history for statistics
        weeklyProgressHistory: [],
        
        // NEW: Account metadata
        accountCreatedDate: new Date().toISOString(),
        lastActiveDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      const { error } = await supabase.from('user_data').upsert([{ 
        id: code, 
        data: initialData,
        pitched_items: []
      }]);
      
      if (!error) {
        setIsCreating(false);
        setCreateCooldown(0);
        console.log('✅ Created new account with improved data structure');
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
      let userData = data.data;
      const pitchedItems = data.pitched_items || [];
      
      // 🔄 MIGRATION: Check if user data needs migration from old structure
      if (needsMigration(userData)) {
        console.log('🔄 Migrating user data to new structure...');
        userData = migrateUserDataStructure(userData);
        
        // Save migrated data back to database
        try {
          await supabase.from('user_data').upsert([{ 
            id: loginInput, 
            data: userData
          }]);
          console.log('✅ User data migration completed and saved');
        } catch (migrationError) {
          console.error('⚠️ Failed to save migrated data:', migrationError);
          // Continue with local migration for this session
        }
      }
      
      // Ensure current week exists in the weekly history
      if (!userData.weeklyBossClearHistory) {
        userData.weeklyBossClearHistory = {};
      }
      if (!userData.weeklyBossClearHistory[currentWeekKey]) {
        userData.weeklyBossClearHistory[currentWeekKey] = createNewWeekEntry(currentWeekKey);
      }
      
      // Update current week key
      userData.currentWeekKey = currentWeekKey;
      userData.lastActiveDate = new Date().toISOString();
      
      // Get current week's boss clear status
      let currentWeekBossClearStatus = getCurrentWeekBossClearStatus(userData, currentWeekKey);
      
      // Sync pitched items with current week's boss clear status
      const syncedBossClearStatus = syncPitchedItemsToCheckedState(
        pitchedItems,
        currentWeekBossClearStatus,
        currentWeekKey
      );
      
      // Update the current week's data if sync changed anything
      if (JSON.stringify(syncedBossClearStatus) !== JSON.stringify(currentWeekBossClearStatus)) {
        userData.weeklyBossClearHistory[currentWeekKey].bossClearStatus = syncedBossClearStatus;
        userData.weeklyBossClearHistory[currentWeekKey].lastUpdated = new Date().toISOString();
        
        // Save updated data to database
        try {
          await supabase.from('user_data').upsert([{ 
            id: loginInput, 
            data: userData
          }]);
          console.log('🔄 Synced pitched items with boss clear status');
        } catch (syncError) {
          console.error('⚠️ Failed to save synced data:', syncError);
        }
      }

      return { 
        success: true, 
        userData: {
          characters: userData.characters || [],
          // For backward compatibility, provide 'checked' as current week's boss clear status
          checked: syncedBossClearStatus,
          pitchedItems,
          // Provide access to the full new structure
          fullUserData: userData
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Failed to login. Try again.');
      return { success: false, error: 'Failed to login. Try again.' };
    }
  };

  const handleLogout = async (characters, checkedStatus) => {
    if (isLoggedIn && userCode) {
      try {
        const currentWeekKey = getCurrentWeekKey();
        
        // Fetch current user data to preserve the new structure
        const { data: currentData, error: fetchError } = await supabase
          .from('user_data')
          .select('data')
          .eq('id', userCode)
          .single();
        
        if (!fetchError && currentData?.data) {
          let userData = currentData.data;
          
          // Update current week's boss clear status
          if (!userData.weeklyBossClearHistory) {
            userData.weeklyBossClearHistory = {};
          }
          if (!userData.weeklyBossClearHistory[currentWeekKey]) {
            userData.weeklyBossClearHistory[currentWeekKey] = createNewWeekEntry(currentWeekKey);
          }
          
          userData.weeklyBossClearHistory[currentWeekKey].bossClearStatus = checkedStatus;
          userData.weeklyBossClearHistory[currentWeekKey].lastUpdated = new Date().toISOString();
          userData.characters = characters;
          userData.currentWeekKey = currentWeekKey;
          userData.lastActiveDate = new Date().toISOString();
          userData.lastUpdated = new Date().toISOString();
          
          await supabase.from('user_data').upsert([{ 
            id: userCode, 
            data: userData
          }]);
          console.log('💾 User data saved with new structure on logout');
        } else {
          // Fallback to old structure if new data fetch fails
          await supabase.from('user_data').upsert([{ 
            id: userCode, 
            data: { 
              characters, 
              checked: checkedStatus, 
              weekKey: currentWeekKey,
              lastUpdated: new Date().toISOString()
            } 
          }]);
          console.log('💾 User data saved with legacy structure on logout');
        }
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