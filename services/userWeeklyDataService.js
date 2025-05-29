/**
 * User Weekly Data Service
 * 
 * Consolidated service for managing user weekly character and boss configuration
 * targeting the user_boss_data table in the new database schema.
 */

import { getCurrentMapleWeekStartDate } from '../utils/mapleWeekUtils.js';

// Helper: get supabase client dynamically for code splitting
async function getSupabase() {
  const { supabase } = await import('../src/supabaseClient');
  return supabase;
}

/**
 * Fetch user weekly data for a specific user and week
 * @param {string} userId - User's unique ID
 * @param {string} mapleWeekStart - Week start date in 'YYYY-MM-DD' format
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function fetchUserWeeklyData(userId, mapleWeekStart) {
  if (!userId || !mapleWeekStart) {
    return { success: false, error: 'Missing required parameters.' };
  }
  
  try {
    const supabase = await getSupabase();
    
    const { data, error } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', userId)
      .eq('maple_week_start', mapleWeekStart)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - return null data
        return { success: true, data: null };
      }
      console.error('Error fetching user weekly data:', error);
      return { success: false, error: 'Failed to fetch weekly data.' };
    }
    
    return { success: true, data };
    
  } catch (error) {
    console.error('Unexpected error fetching user weekly data:', error);
    return { success: false, error: 'Failed to fetch weekly data.' };
  }
}

/**
 * Save or update user weekly data (upsert operation)
 * @param {string} userId - User's unique ID
 * @param {string} mapleWeekStart - Week start date in 'YYYY-MM-DD' format
 * @param {object} weeklyDataPayload - Object containing user_boss_data fields to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveOrUpdateUserWeeklyData(userId, mapleWeekStart, weeklyDataPayload) {
  if (!userId || !mapleWeekStart || !weeklyDataPayload) {
    return { success: false, error: 'Missing required parameters.' };
  }
  
  try {
    const supabase = await getSupabase();
    
    const recordToUpsert = {
      user_id: userId,
      maple_week_start: mapleWeekStart,
      ...weeklyDataPayload
    };
    
    const { error } = await supabase
      .from('user_boss_data')
      .upsert(recordToUpsert, {
        onConflict: 'user_id,maple_week_start'
      });
    
    if (error) {
      console.error('Error saving user weekly data:', error);
      return { success: false, error: 'Failed to save weekly data.' };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Unexpected error saving user weekly data:', error);
    return { success: false, error: 'Failed to save weekly data.' };
  }
}

/**
 * Add a character to weekly setup
 * @param {string} userId - User's unique ID
 * @param {string} mapleWeekStart - Week start date in 'YYYY-MM-DD' format
 * @param {string} characterName - Name of the character to add
 * @returns {Promise<{success: boolean, characterIndex?: number, error?: string}>}
 */
export async function addCharacterToWeeklySetup(userId, mapleWeekStart, characterName) {
  if (!userId || !mapleWeekStart || !characterName?.trim()) {
    return { success: false, error: 'Missing required parameters.' };
  }
  
  try {
    // Fetch existing data
    const fetchResult = await fetchUserWeeklyData(userId, mapleWeekStart);
    if (!fetchResult.success) {
      return { success: false, error: fetchResult.error };
    }
    
    const currentData = fetchResult.data || {
      char_map: {},
      boss_config: {},
      weekly_clears: {}
    };
    
    // Find next available character index
    const existingIndices = Object.keys(currentData.char_map || {}).map(i => parseInt(i));
    const nextIndex = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 0;
    const nextIndexStr = nextIndex.toString();
    
    // Check if character name already exists
    const existingNames = Object.values(currentData.char_map || {});
    if (existingNames.some(name => name.toLowerCase() === characterName.trim().toLowerCase())) {
      return { success: false, error: `Character name '${characterName.trim()}' already exists.` };
    }
    
    // Add character to char_map and initialize empty entries
    const updatedCharMap = { ...currentData.char_map };
    const updatedBossConfig = { ...currentData.boss_config };
    const updatedWeeklyClears = { ...currentData.weekly_clears };
    
    updatedCharMap[nextIndexStr] = characterName.trim();
    updatedBossConfig[nextIndexStr] = ''; // Initialize empty boss config
    updatedWeeklyClears[nextIndexStr] = ''; // Initialize empty weekly clears
    
    // Save updated data
    const saveResult = await saveOrUpdateUserWeeklyData(userId, mapleWeekStart, {
      char_map: updatedCharMap,
      boss_config: updatedBossConfig,
      weekly_clears: updatedWeeklyClears
    });
    
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    
    return { success: true, characterIndex: nextIndex };
    
  } catch (error) {
    console.error('Unexpected error adding character:', error);
    return { success: false, error: 'Failed to add character.' };
  }
}

/**
 * Remove a character from weekly setup
 * @param {string} userId - User's unique ID
 * @param {string} mapleWeekStart - Week start date in 'YYYY-MM-DD' format
 * @param {number|string} characterIndexToRemove - Index of character to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeCharacterFromWeeklySetup(userId, mapleWeekStart, characterIndexToRemove) {
  if (!userId || !mapleWeekStart || characterIndexToRemove === undefined) {
    return { success: false, error: 'Missing required parameters.' };
  }
  
  try {
    // Fetch existing data
    const fetchResult = await fetchUserWeeklyData(userId, mapleWeekStart);
    if (!fetchResult.success) {
      return { success: false, error: fetchResult.error };
    }
    
    if (!fetchResult.data) {
      return { success: false, error: 'No weekly data found.' };
    }
    
    const currentData = fetchResult.data;
    const indexStr = characterIndexToRemove.toString();
    
    // Check if character exists
    if (!(indexStr in (currentData.char_map || {}))) {
      return { success: false, error: 'Character not found.' };
    }
    
    // Remove character from all maps (allow gaps in indices)
    const updatedCharMap = { ...currentData.char_map };
    const updatedBossConfig = { ...currentData.boss_config };
    const updatedWeeklyClears = { ...currentData.weekly_clears };
    
    delete updatedCharMap[indexStr];
    delete updatedBossConfig[indexStr];
    delete updatedWeeklyClears[indexStr];
    
    // Save updated data
    const saveResult = await saveOrUpdateUserWeeklyData(userId, mapleWeekStart, {
      char_map: updatedCharMap,
      boss_config: updatedBossConfig,
      weekly_clears: updatedWeeklyClears
    });
    
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Unexpected error removing character:', error);
    return { success: false, error: 'Failed to remove character.' };
  }
}

/**
 * Update a character's name in weekly setup
 * @param {string} userId - User's unique ID
 * @param {string} mapleWeekStart - Week start date in 'YYYY-MM-DD' format
 * @param {number|string} characterIndex - Index of character to update
 * @param {string} newName - New character name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateCharacterNameInWeeklySetup(userId, mapleWeekStart, characterIndex, newName) {
  if (!userId || !mapleWeekStart || characterIndex === undefined || !newName?.trim()) {
    return { success: false, error: 'Missing required parameters.' };
  }
  
  try {
    // Fetch existing data
    const fetchResult = await fetchUserWeeklyData(userId, mapleWeekStart);
    if (!fetchResult.success) {
      return { success: false, error: fetchResult.error };
    }
    
    if (!fetchResult.data) {
      return { success: false, error: 'No weekly data found.' };
    }
    
    const currentData = fetchResult.data;
    const indexStr = characterIndex.toString();
    
    // Check if character exists
    if (!(indexStr in (currentData.char_map || {}))) {
      return { success: false, error: 'Character not found.' };
    }
    
    // Check if new name already exists (excluding current character)
    const existingNames = Object.entries(currentData.char_map || {})
      .filter(entry => entry[0] !== indexStr)
      .map(entry => entry[1]);
    
    if (existingNames.some(name => name.toLowerCase() === newName.trim().toLowerCase())) {
      return { success: false, error: `Character name '${newName.trim()}' already exists.` };
    }
    
    // Update character name
    const updatedCharMap = { ...currentData.char_map };
    updatedCharMap[indexStr] = newName.trim();
    
    // Save updated data
    const saveResult = await saveOrUpdateUserWeeklyData(userId, mapleWeekStart, {
      char_map: updatedCharMap,
      boss_config: currentData.boss_config || {},
      weekly_clears: currentData.weekly_clears || {}
    });
    
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Unexpected error updating character name:', error);
    return { success: false, error: 'Failed to update character name.' };
  }
}

/**
 * Update a character's boss configuration in weekly setup
 * @param {string} userId - User's unique ID
 * @param {string} mapleWeekStart - Week start date in 'YYYY-MM-DD' format
 * @param {number|string} characterIndex - Index of character to update
 * @param {string} newBossConfigString - New boss config string (format: "boss_code:crystal_value:party_size,...")
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateCharacterBossConfigInWeeklySetup(userId, mapleWeekStart, characterIndex, newBossConfigString) {
  if (!userId || !mapleWeekStart || characterIndex === undefined) {
    return { success: false, error: 'Missing required parameters.' };
  }
  
  try {
    // Validate boss config string against boss_registry
    if (newBossConfigString && newBossConfigString.trim()) {
      const validationResult = await validateBossConfigString(newBossConfigString);
      if (!validationResult.success) {
        return { success: false, error: validationResult.error };
      }
    }
    
    // Fetch existing data
    const fetchResult = await fetchUserWeeklyData(userId, mapleWeekStart);
    if (!fetchResult.success) {
      return { success: false, error: fetchResult.error };
    }
    
    if (!fetchResult.data) {
      return { success: false, error: 'No weekly data found.' };
    }
    
    const currentData = fetchResult.data;
    const indexStr = characterIndex.toString();
    
    // Check if character exists
    if (!(indexStr in (currentData.char_map || {}))) {
      return { success: false, error: 'Character not found.' };
    }
    
    // Update boss config
    const updatedBossConfig = { ...currentData.boss_config };
    updatedBossConfig[indexStr] = newBossConfigString || '';
    
    // Save updated data
    const saveResult = await saveOrUpdateUserWeeklyData(userId, mapleWeekStart, {
      char_map: currentData.char_map || {},
      boss_config: updatedBossConfig,
      weekly_clears: currentData.weekly_clears || {}
    });
    
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Unexpected error updating boss config:', error);
    return { success: false, error: 'Failed to update boss configuration.' };
  }
}

/**
 * Validate boss config string against boss_registry
 * @param {string} bossConfigString - Boss config string to validate
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function validateBossConfigString(bossConfigString) {
  if (!bossConfigString || typeof bossConfigString !== 'string') {
    return { success: true }; // Empty string is valid
  }
  
  try {
    const supabase = await getSupabase();
    
    // Fetch all boss registry data for validation
    const { data: bossRegistry, error } = await supabase
      .from('boss_registry')
      .select('boss_code, difficulty_code, crystal_value, max_party_size, enabled');
    
    if (error) {
      console.error('Error fetching boss registry:', error);
      return { success: false, error: 'Failed to validate boss configuration.' };
    }
    
    // Parse config string and validate each entry
    const entries = bossConfigString.split(',');
    
    for (const entry of entries) {
      const parts = entry.split(':');
      if (parts.length !== 3) {
        return { success: false, error: `Invalid boss config format: ${entry}` };
      }
      
      const [bossCode, crystalValueStr, partySizeStr] = parts;
      const crystalValue = parseInt(crystalValueStr);
      const partySize = parseInt(partySizeStr);
      
      // Find matching boss in registry
      const registryEntry = bossRegistry.find(boss => {
        const fullBossCode = `${boss.boss_code}-${boss.difficulty_code}`;
        return fullBossCode === bossCode || boss.boss_code === bossCode;
      });
      
      if (!registryEntry) {
        return { success: false, error: `Unknown boss code: ${bossCode}` };
      }
      
      if (!registryEntry.enabled) {
        return { success: false, error: `Boss ${bossCode} is not enabled.` };
      }
      
      if (crystalValue !== registryEntry.crystal_value) {
        return { success: false, error: `Invalid crystal value for ${bossCode}. Expected: ${registryEntry.crystal_value}, got: ${crystalValue}` };
      }
      
      if (partySize < 1 || partySize > registryEntry.max_party_size) {
        return { success: false, error: `Invalid party size for ${bossCode}. Must be between 1 and ${registryEntry.max_party_size}.` };
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Unexpected error validating boss config:', error);
    return { success: false, error: 'Failed to validate boss configuration.' };
  }
}

/**
 * Convenience function to get current week data for a user
 * @param {string} userId - User's unique ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function fetchCurrentWeekData(userId) {
  const currentWeekStart = getCurrentMapleWeekStartDate();
  return await fetchUserWeeklyData(userId, currentWeekStart);
}

/**
 * Convenience function to save current week data for a user
 * @param {string} userId - User's unique ID
 * @param {object} weeklyDataPayload - Data payload to save
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveCurrentWeekData(userId, weeklyDataPayload) {
  const currentWeekStart = getCurrentMapleWeekStartDate();
  return await saveOrUpdateUserWeeklyData(userId, currentWeekStart, weeklyDataPayload);
}

/**
 * Update weekly clears for a specific character
 * @param {string} userId - User ID
 * @param {string} mapleWeekStart - Week start date ('YYYY-MM-DD')
 * @param {string} characterIndex - Character index (as string)
 * @param {string} newWeeklyClearsString - Comma-separated boss codes (e.g., "DH,LH,GC")
 * @returns {Object} - {success: boolean, data?: object, error?: string}
 */
export async function updateCharacterWeeklyClearsInWeeklySetup(userId, mapleWeekStart, characterIndex, newWeeklyClearsString) {
  try {
    if (!userId || !mapleWeekStart || characterIndex === undefined) {
      return { success: false, error: 'Missing required parameters: userId, mapleWeekStart, and characterIndex' };
    }

    // Validate boss codes against boss_registry if provided
    if (newWeeklyClearsString && newWeeklyClearsString.trim()) {
      const bossCodes = newWeeklyClearsString.split(',').map(code => code.trim()).filter(code => code);
      
      if (bossCodes.length > 0) {
        const supabase = await getSupabase();
        const { data: bossRegistry, error: bossError } = await supabase
          .from('boss_registry')
          .select('boss_code')
          .in('boss_code', bossCodes);

        if (bossError) {
          throw bossError;
        }

        const validBossCodes = new Set(bossRegistry.map(boss => boss.boss_code));
        const invalidCodes = bossCodes.filter(code => !validBossCodes.has(code));
        
        if (invalidCodes.length > 0) {
          return { success: false, error: `Invalid boss codes: ${invalidCodes.join(', ')}` };
        }
      }
    }

    // Fetch current weekly data
    const fetchResult = await fetchUserWeeklyData(userId, mapleWeekStart);
    if (!fetchResult.success) {
      return fetchResult;
    }

    const currentData = fetchResult.data;
    if (!currentData) {
      return { success: false, error: 'No weekly data found. Please add characters first.' };
    }

    // Validate character exists
    const charMap = currentData.char_map || {};
    if (!charMap[characterIndex]) {
      return { success: false, error: `Character at index ${characterIndex} not found` };
    }

    // Update weekly_clears
    const updatedWeeklyClears = {
      ...(currentData.weekly_clears || {}),
      [characterIndex]: newWeeklyClearsString || ''
    };

    const updatePayload = {
      weekly_clears: updatedWeeklyClears
    };

    const saveResult = await saveOrUpdateUserWeeklyData(userId, mapleWeekStart, updatePayload);
    return saveResult;

  } catch (error) {
    console.error('Error updating character weekly clears:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle a single boss clear status for a character
 * @param {string} userId - User ID
 * @param {string} mapleWeekStart - Week start date ('YYYY-MM-DD')
 * @param {string} characterIndex - Character index (as string)
 * @param {string} bossCode - Boss code to toggle (e.g., "DH")
 * @param {boolean} isCleared - Whether the boss is cleared
 * @returns {Object} - {success: boolean, data?: object, error?: string}
 */
export async function toggleBossClearStatus(userId, mapleWeekStart, characterIndex, bossCode, isCleared) {
  try {
    if (!userId || !mapleWeekStart || characterIndex === undefined || !bossCode || isCleared === undefined) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Validate boss code against boss_registry
    const supabase = await getSupabase();
    const { data: _bossRegistry, error: bossError } = await supabase
      .from('boss_registry')
      .select('boss_code')
      .eq('boss_code', bossCode)
      .single();

    if (bossError) {
      if (bossError.code === 'PGRST116') {
        return { success: false, error: `Invalid boss code: ${bossCode}` };
      }
      throw bossError;
    }

    // Fetch current weekly data
    const fetchResult = await fetchUserWeeklyData(userId, mapleWeekStart);
    if (!fetchResult.success) {
      return fetchResult;
    }

    const currentData = fetchResult.data;
    if (!currentData) {
      return { success: false, error: 'No weekly data found. Please add characters first.' };
    }

    // Validate character exists
    const charMap = currentData.char_map || {};
    if (!charMap[characterIndex]) {
      return { success: false, error: `Character at index ${characterIndex} not found` };
    }

    // Get current weekly clears for this character
    const currentWeeklyClears = currentData.weekly_clears || {};
    const currentClearsString = currentWeeklyClears[characterIndex] || '';
    const currentClears = currentClearsString.split(',').map(code => code.trim()).filter(code => code);

    let updatedClears;
    if (isCleared) {
      // Add boss code if not already present
      if (!currentClears.includes(bossCode)) {
        updatedClears = [...currentClears, bossCode];
      } else {
        updatedClears = currentClears;
      }
    } else {
      // Remove boss code if present
      updatedClears = currentClears.filter(code => code !== bossCode);
    }

    // Update weekly_clears
    const updatedWeeklyClears = {
      ...currentWeeklyClears,
      [characterIndex]: updatedClears.join(',')
    };

    const updatePayload = {
      weekly_clears: updatedWeeklyClears
    };

    const saveResult = await saveOrUpdateUserWeeklyData(userId, mapleWeekStart, updatePayload);
    return saveResult;

  } catch (error) {
    console.error('Error toggling boss clear status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all boss clears for a specific character
 * @param {string} userId - User ID
 * @param {string} mapleWeekStart - Week start date ('YYYY-MM-DD')
 * @param {string} characterIndex - Character index (as string)
 * @returns {Object} - {success: boolean, data?: object, error?: string}
 */
export async function clearAllBossesForCharacter(userId, mapleWeekStart, characterIndex) {
  try {
    return await updateCharacterWeeklyClearsInWeeklySetup(userId, mapleWeekStart, characterIndex, '');
  } catch (error) {
    console.error('Error clearing all bosses for character:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark all configured bosses as cleared for a specific character
 * @param {string} userId - User ID
 * @param {string} mapleWeekStart - Week start date ('YYYY-MM-DD')
 * @param {string} characterIndex - Character index (as string)
 * @returns {Object} - {success: boolean, data?: object, error?: string}
 */
export async function markAllBossesForCharacter(userId, mapleWeekStart, characterIndex) {
  try {
    if (!userId || !mapleWeekStart || characterIndex === undefined) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Fetch current weekly data
    const fetchResult = await fetchUserWeeklyData(userId, mapleWeekStart);
    if (!fetchResult.success) {
      return fetchResult;
    }

    const currentData = fetchResult.data;
    if (!currentData) {
      return { success: false, error: 'No weekly data found. Please add characters first.' };
    }

    // Validate character exists
    const charMap = currentData.char_map || {};
    if (!charMap[characterIndex]) {
      return { success: false, error: `Character at index ${characterIndex} not found` };
    }

    // Get boss configuration for this character
    const bossConfig = currentData.boss_config || {};
    const configString = bossConfig[characterIndex] || '';
    
    if (!configString) {
      return { success: false, error: 'No boss configuration found for this character' };
    }

    // Parse boss configuration to get all boss codes
    const { parseBossConfigString } = await import('../utils/mapleWeekUtils.js');
    const configs = parseBossConfigString(configString);
    const allBossCodes = configs.map(config => config.bossCode);

    // Mark all bosses as cleared
    const allClearsString = allBossCodes.join(',');
    return await updateCharacterWeeklyClearsInWeeklySetup(userId, mapleWeekStart, characterIndex, allClearsString);

  } catch (error) {
    console.error('Error marking all bosses for character:', error);
    return { success: false, error: error.message };
  }
}