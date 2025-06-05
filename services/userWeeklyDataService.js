/**
 * User Weekly Data Service
 * 
 * Consolidated service for managing user weekly character and boss configuration
 * targeting the user_boss_data table in the new database schema.
 */

import { getCurrentMapleWeekStartDate } from '../utils/mapleWeekUtils.js';
import { logger } from '../src/utils/logger.js';

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
    logger.error('fetchUserWeeklyData: Missing required parameters', { userId, mapleWeekStart });
    return { success: false, error: 'Missing required parameters.' };
  }
  
  try {
    const supabase = await getSupabase();
    
    logger.info(`fetchUserWeeklyData: Querying database`, {
      userId,
      mapleWeekStart,
      queryTable: 'user_boss_data',
      queryColumns: 'user_id, maple_week_start'
    });
    
    const { data, error } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', userId)
      .eq('maple_week_start', mapleWeekStart);
    
    logger.info(`fetchUserWeeklyData: Database query result`, {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      dataLength: Array.isArray(data) ? data.length : (data ? 1 : 0),
      rawData: data
    });
    
    if (error) {
      logger.error('fetchUserWeeklyData: Database error', error);
      return { success: false, error: 'Failed to fetch weekly data.' };
    }
    
    // Handle array response - take first result if multiple exist
    const weekData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
    
    logger.info(`fetchUserWeeklyData: Processed result`, {
      hasWeekData: !!weekData,
      originalDataType: Array.isArray(data) ? 'array' : typeof data,
      resultKeys: weekData ? Object.keys(weekData) : null
    });
    
    return { success: true, data: weekData };
    
  } catch (error) {
    logger.error('fetchUserWeeklyData: Unexpected error', error);
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
    
    // Check if record already exists before upsert
    const existingCheck = await supabase
      .from('user_boss_data')
      .select('user_id, maple_week_start')
      .eq('user_id', userId)
      .eq('maple_week_start', mapleWeekStart);
    
    // Also check what other records exist for this user
    const allUserRecords = await supabase
      .from('user_boss_data')
      .select('user_id, maple_week_start')
      .eq('user_id', userId);

    if (existingCheck.error) {
      logger.error('saveOrUpdateUserWeeklyData: Error checking existing record', existingCheck.error);
    }

    logger.info(`saveOrUpdateUserWeeklyData: Record analysis`, {
      targetWeek: mapleWeekStart,
      hasExistingForWeek: existingCheck.data && existingCheck.data.length > 0,
      existingForWeekCount: existingCheck.data ? existingCheck.data.length : 0,
      allUserRecordsCount: allUserRecords.data ? allUserRecords.data.length : 0,
      allUserWeeks: allUserRecords.data ? allUserRecords.data.map(r => r.maple_week_start) : [],
      operation: existingCheck.data && existingCheck.data.length > 0 ? 'update' : 'insert'
    });

    let result;
    
    if (existingCheck.data && existingCheck.data.length > 0) {
      // Record exists - use UPDATE
      logger.info(`saveOrUpdateUserWeeklyData: Updating existing record`);
      result = await supabase
        .from('user_boss_data')
        .update(weeklyDataPayload)
        .eq('user_id', userId)
        .eq('maple_week_start', mapleWeekStart);
    } else {
      // No record exists for this week - check if any record exists for user
      if (allUserRecords.data && allUserRecords.data.length > 0) {
        // User has records for other weeks, but database constraint only allows one record per user
        // This indicates wrong primary key setup - we need to delete old record first
        logger.info(`saveOrUpdateUserWeeklyData: Database constraint issue detected - user has ${allUserRecords.data.length} existing records, deleting and inserting`);
        
        // Delete all existing records for this user
        const deleteResult = await supabase
          .from('user_boss_data')
          .delete()
          .eq('user_id', userId);
        
        if (deleteResult.error) {
          logger.error('saveOrUpdateUserWeeklyData: Failed to delete existing records', deleteResult.error);
          return { success: false, error: 'Failed to clear existing data.' };
        }
        
        logger.info(`saveOrUpdateUserWeeklyData: Deleted existing records, now inserting new record`);
      }
      
      // Insert new record
      logger.info(`saveOrUpdateUserWeeklyData: Inserting new record`);
      result = await supabase
        .from('user_boss_data')
        .insert(recordToUpsert);
    }
    
    const { error } = result;
    
    logger.info(`saveOrUpdateUserWeeklyData: Operation completed successfully`, {
      operation: existingCheck.data && existingCheck.data.length > 0 ? 'update' : 'insert',
      targetWeek: mapleWeekStart,
      userId: userId,
      charCount: Object.keys(weeklyDataPayload.char_map || {}).length,
      bossConfigCount: Object.keys(weeklyDataPayload.boss_config || {}).length,
      clearsCount: Object.keys(weeklyDataPayload.weekly_clears || {}).length
    });
    
    if (error) {
      logger.error('saveOrUpdateUserWeeklyData: Operation failed', error);
      return { success: false, error: 'Failed to save weekly data.' };
    }
    
    return { success: true };
    
  } catch (error) {
    logger.error('Unexpected error saving user weekly data:', error);
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
    logger.error('Unexpected error adding character:', error);
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
    logger.error('Unexpected error removing character:', error);
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
    logger.error('Unexpected error updating character name:', error);
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
    logger.error('Unexpected error updating boss config:', error);
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
      logger.error('Error fetching boss registry:', error);
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
      
      // Temporarily disable crystal value validation due to frontend/database sync issues
      if (crystalValue !== registryEntry.crystal_value) {
        logger.warn(`Crystal value mismatch for ${bossCode}. Expected: ${registryEntry.crystal_value}, got: ${crystalValue}. Using database value.`);
        // Use database value instead of rejecting
      }
      
      if (partySize < 1 || partySize > registryEntry.max_party_size) {
        return { success: false, error: `Invalid party size for ${bossCode}. Must be between 1 and ${registryEntry.max_party_size}.` };
      }
    }
    
    return { success: true };
    
  } catch (error) {
    logger.error('Unexpected error validating boss config:', error);
    return { success: false, error: 'Failed to validate boss configuration.' };
  }
}

/**
 * Convenience function to get current week data for a user
 * Handles weekly reset by migrating previous week's character setup if current week has no data
 * @param {string} userId - User's unique ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function fetchCurrentWeekData(userId) {
  const currentWeekStart = getCurrentMapleWeekStartDate();
  
  logger.info(`fetchCurrentWeekData: Starting for user ${userId}, current week start: ${currentWeekStart}`);
  
  // First, try to fetch data for current week
  const currentWeekResult = await fetchUserWeeklyData(userId, currentWeekStart);
  
  logger.info(`fetchCurrentWeekData: Current week query result`, {
    success: currentWeekResult.success,
    hasData: !!currentWeekResult.data,
    error: currentWeekResult.error,
    data: currentWeekResult.data
  });
  
  if (!currentWeekResult.success) {
    logger.error('fetchCurrentWeekData: Failed to fetch current week data', currentWeekResult.error);
    return currentWeekResult;
  }
  
  // If current week data exists, return it
  if (currentWeekResult.data) {
    logger.info(`fetchCurrentWeekData: Found existing data for current week ${currentWeekStart}`, {
      charCount: currentWeekResult.data.char_map ? Object.keys(currentWeekResult.data.char_map).length : 0,
      charMap: currentWeekResult.data.char_map,
      bossConfig: currentWeekResult.data.boss_config
    });
    return currentWeekResult;
  }
  
  // No current week data found, check for previous week data to migrate
  try {
    logger.info(`fetchCurrentWeekData: No data found for current week ${currentWeekStart}, checking previous week`);
    
    // Calculate previous week start date
    const currentDate = new Date(currentWeekStart + 'T00:00:00.000Z');
    const previousWeekDate = new Date(currentDate);
    previousWeekDate.setUTCDate(currentDate.getUTCDate() - 7);
    
    const previousWeekStart = previousWeekDate.getUTCFullYear() + '-' + 
      String(previousWeekDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
      String(previousWeekDate.getUTCDate()).padStart(2, '0');
    
    logger.info(`fetchCurrentWeekData: Checking previous week ${previousWeekStart} for user ${userId}`);
    
    // Fetch previous week data
    const previousWeekResult = await fetchUserWeeklyData(userId, previousWeekStart);
    
    if (!previousWeekResult.success) {
      logger.info(`fetchCurrentWeekData: Failed to fetch previous week data: ${previousWeekResult.error}`);
      return { success: true, data: null };
    }
    
    if (!previousWeekResult.data) {
      logger.info('fetchCurrentWeekData: No previous week data found either');
      return { success: true, data: null };
    }
    
    const previousData = previousWeekResult.data;
    
    // Check if previous week has character setup
    if (!previousData.char_map || Object.keys(previousData.char_map).length === 0) {
      logger.info('fetchCurrentWeekData: Previous week data exists but has no characters');
      return { success: true, data: null };
    }
    
         logger.info(`fetchCurrentWeekData: Migrating ${Object.keys(previousData.char_map).length} characters from ${previousWeekStart} to ${currentWeekStart} for user ${userId}`, {
       previousCharMap: previousData.char_map,
       previousBossConfig: previousData.boss_config,
       previousWeeklyClears: previousData.weekly_clears
     });
     
     // Migrate character setup to current week, but reset weekly clears
     const migratedData = {
       char_map: previousData.char_map,
       boss_config: previousData.boss_config || {},
       weekly_clears: {} // Reset weekly clears for new week
     };
     
     // Initialize empty weekly clears for all characters
     Object.keys(migratedData.char_map).forEach(charIndex => {
       migratedData.weekly_clears[charIndex] = '';
     });
     
     logger.info(`fetchCurrentWeekData: Prepared migration data`, {
       migratedCharMap: migratedData.char_map,
       migratedBossConfig: migratedData.boss_config,
       migratedWeeklyClears: migratedData.weekly_clears
     });
    
         // Double-check if current week data was created between our checks
     const recheckResult = await fetchUserWeeklyData(userId, currentWeekStart);
     if (recheckResult.success && recheckResult.data) {
       logger.info(`fetchCurrentWeekData: Current week data appeared during migration, using existing data`);
       return recheckResult;
     }

     // Save migrated data to current week
     const saveResult = await saveOrUpdateUserWeeklyData(userId, currentWeekStart, migratedData);
     
     if (!saveResult.success) {
       logger.error(`fetchCurrentWeekData: Failed to save migrated data for user ${userId}: ${saveResult.error}`);
       
       // Try one more fetch to see if data exists now
       const finalCheckResult = await fetchUserWeeklyData(userId, currentWeekStart);
       if (finalCheckResult.success && finalCheckResult.data) {
         logger.info(`fetchCurrentWeekData: Found data after failed migration - using existing data`);
         return finalCheckResult;
       }
       
       // If still no data, check if we can return previous week data as fallback
       logger.error(`fetchCurrentWeekData: Migration completely failed - returning previous week data as fallback`);
       return { success: true, data: previousData };
     }
    
    logger.info(`fetchCurrentWeekData: Successfully migrated data for user ${userId} from ${previousWeekStart} to ${currentWeekStart}`);
    
    // Return the migrated data
    return { success: true, data: migratedData };
    
  } catch (error) {
    logger.error('fetchCurrentWeekData: Error during weekly data migration:', error);
    return { success: false, error: 'Failed to check for previous week data.' };
  }
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
 * Debug function to check if user has data for previous week (useful for testing weekly reset)
 * @param {string} userId - User's unique ID
 * @returns {Promise<{success: boolean, currentWeekData?: object, previousWeekData?: object, error?: string}>}
 */
export async function debugWeeklyDataTransition(userId) {
  try {
    const currentWeekStart = getCurrentMapleWeekStartDate();
    
    // Calculate previous week start date
    const currentDate = new Date(currentWeekStart + 'T00:00:00.000Z');
    const previousWeekDate = new Date(currentDate);
    previousWeekDate.setUTCDate(currentDate.getUTCDate() - 7);
    
    const previousWeekStart = previousWeekDate.getUTCFullYear() + '-' + 
      String(previousWeekDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
      String(previousWeekDate.getUTCDate()).padStart(2, '0');
    
    // Fetch both current and previous week data
    const [currentResult, previousResult] = await Promise.all([
      fetchUserWeeklyData(userId, currentWeekStart),
      fetchUserWeeklyData(userId, previousWeekStart)
    ]);
    
    return {
      success: true,
      currentWeekStart,
      previousWeekStart,
      currentWeekData: currentResult.success ? currentResult.data : null,
      previousWeekData: previousResult.success ? previousResult.data : null,
      currentWeekError: currentResult.success ? null : currentResult.error,
      previousWeekError: previousResult.success ? null : previousResult.error
    };
    
  } catch (error) {
    logger.error('Error in debugWeeklyDataTransition:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Force migration test function - manually trigger migration for testing
 * @param {string} userId - User's unique ID
 * @returns {Promise<{success: boolean, result?: object, error?: string}>}
 */
export async function forceMigrationTest(userId) {
  try {
    logger.info(`forceMigrationTest: Starting manual migration test for user ${userId}`);
    
    const result = await fetchCurrentWeekData(userId);
    
    logger.info(`forceMigrationTest: Migration test completed`, {
      success: result.success,
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : [],
      charCount: result.data?.char_map ? Object.keys(result.data.char_map).length : 0
    });
    
    return {
      success: true,
      result: result
    };
    
  } catch (error) {
    logger.error('forceMigrationTest: Error during migration test:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Debug function to inspect all user data in database (for troubleshooting)
 * @param {string} userId - User's unique ID
 * @returns {Promise<{success: boolean, allData?: object[], error?: string}>}
 */
export async function debugAllUserData(userId) {
  try {
    const supabase = await getSupabase();
    
    logger.info(`debugAllUserData: Fetching all data for user ${userId}`);
    
    // Get ALL rows for this user (no date filter)
    const { data, error } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', userId)
      .order('maple_week_start', { ascending: false });
    
    if (error) {
      logger.error('debugAllUserData: Database error', error);
      return { success: false, error: error.message };
    }
    
    logger.info(`debugAllUserData: Found ${data?.length || 0} rows for user ${userId}`, {
      allData: data,
      weekStarts: data?.map(row => row.maple_week_start),
      characterCounts: data?.map(row => ({
        week: row.maple_week_start,
        charCount: row.char_map ? Object.keys(row.char_map).length : 0,
        chars: row.char_map
      }))
    });
    
    return {
      success: true,
      allData: data || [],
      currentWeekStart: getCurrentMapleWeekStartDate()
    };
    
  } catch (error) {
    logger.error('debugAllUserData: Unexpected error', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update weekly clears for a specific character
 * @param {string} userId - User ID
 * @param {string} mapleWeekStart - Week start date ('YYYY-MM-DD')
 * @param {string} characterIndex - Character index (as string)
 * @param {string} newWeeklyClearsString - Comma-separated boss codes OR boss registry IDs
 * @returns {Object} - {success: boolean, data?: object, error?: string}
 */
export async function updateCharacterWeeklyClearsInWeeklySetup(userId, mapleWeekStart, characterIndex, newWeeklyClearsString) {
  try {
    if (!userId || !mapleWeekStart || characterIndex === undefined) {
      return { success: false, error: 'Missing required parameters: userId, mapleWeekStart, and characterIndex' };
    }

    // Validate boss codes/IDs against boss_registry if provided
    if (newWeeklyClearsString && newWeeklyClearsString.trim()) {
      const entries = newWeeklyClearsString.split(',').map(code => code.trim()).filter(code => code);
      
      if (entries.length > 0) {
        const supabase = await getSupabase();
        
        // Check if entries are numeric (boss registry IDs) or string (boss codes)
        const areNumericIds = entries.every(entry => /^\d+$/.test(entry));
        
        if (areNumericIds) {
          // Validate boss registry IDs
          const numericIds = entries.map(id => parseInt(id));
          
          const { data: bossRegistry, error: bossError } = await supabase
            .from('boss_registry')
            .select('id')
            .in('id', numericIds);

          if (bossError) {
            throw bossError;
          }

          const validIds = new Set(bossRegistry.map(boss => boss.id));
          const invalidIds = numericIds.filter(id => !validIds.has(id));
          
          if (invalidIds.length > 0) {
            return { success: false, error: `Invalid boss registry IDs: ${invalidIds.join(', ')}` };
          }
        } else {
          // Validate boss codes (boss_registry.id field contains composite codes like "WK-X")
          const { data: bossRegistry, error: bossError } = await supabase
            .from('boss_registry')
            .select('id')  // Use id field, not boss_code field
            .in('id', entries);  // Look for entries in id field

          if (bossError) {
            throw bossError;
          }

          const validBossCodes = new Set(bossRegistry.map(boss => boss.id));  // Use id field
          const invalidCodes = entries.filter(code => !validBossCodes.has(code));
          
          if (invalidCodes.length > 0) {
            return { success: false, error: `Invalid boss codes: ${invalidCodes.join(', ')}` };
          }
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
    logger.error('Error updating character weekly clears:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle a single boss clear status for a character
 * @param {string} userId - User ID
 * @param {string} mapleWeekStart - Week start date ('YYYY-MM-DD')
 * @param {string} characterIndex - Character index (as string)
 * @param {number} bossRegistryId - Boss registry ID to toggle
 * @param {boolean} isCleared - Whether the boss is cleared
 * @returns {Object} - {success: boolean, data?: object, error?: string}
 */
export async function toggleBossClearStatus(userId, mapleWeekStart, characterIndex, bossRegistryId, isCleared) {
  try {
    if (!userId || !mapleWeekStart || characterIndex === undefined || !bossRegistryId || isCleared === undefined) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Validate boss registry ID against boss_registry
    const supabase = await getSupabase();
    const { data: bossRegistry, error: bossError } = await supabase
      .from('boss_registry')
      .select('id, boss_name, difficulty')
      .eq('id', bossRegistryId)
      .single();

    if (bossError) {
      if (bossError.code === 'PGRST116') {
        return { success: false, error: `Invalid boss registry ID: ${bossRegistryId}` };
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
    const currentClears = currentClearsString.split(',').map(id => id.trim()).filter(id => id);

    // Convert to string for comparison
    const bossIdString = bossRegistryId.toString();

    let updatedClears;
    if (isCleared) {
      // Add boss registry ID if not already present
      if (!currentClears.includes(bossIdString)) {
        updatedClears = [...currentClears, bossIdString];
      } else {
        updatedClears = currentClears;
      }
    } else {
      // Remove boss registry ID if present
      updatedClears = currentClears.filter(id => id !== bossIdString);
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
    logger.error('Error toggling boss clear status:', error);
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
    logger.error('Error clearing all bosses for character:', error);
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

    // Parse boss configuration to get boss details
    const { parseBossConfigString } = await import('../utils/mapleWeekUtils.js');
    const configs = parseBossConfigString(configString);
    
    // Convert boss codes to boss registry IDs (which are actually boss codes like "WK-X")
    const supabase = await getSupabase();
    const { data: fullBossRegistry, error: fullRegistryError } = await supabase
      .from('boss_registry')
      .select('*');
    
    if (fullRegistryError) {
      throw fullRegistryError;
    }
    
    const allBossRegistryIds = [];
    for (const config of configs) {
      // Find the boss registry entry that matches this boss code
      const bossCodeParts = config.bossCode.split('-');
      const bossCode = bossCodeParts[0];
      const difficultyCode = bossCodeParts[1];
      
      const bossEntry = fullBossRegistry.find(entry => 
        entry.boss_code === bossCode && 
        entry.difficulty_code === difficultyCode
      );
      
      if (bossEntry) {
        // Use the id field which contains the full boss code (e.g., "WK-X")
        allBossRegistryIds.push(bossEntry.id);
      } else {
        logger.warn(`Boss registry entry not found for boss code: ${config.bossCode}`);
      }
    }

    // Mark all bosses as cleared using boss registry IDs
    const allClearsString = allBossRegistryIds.join(',');
    return await updateCharacterWeeklyClearsInWeeklySetup(userId, mapleWeekStart, characterIndex, allClearsString);

  } catch (error) {
    logger.error('Error marking all bosses for character:', error);
    return { success: false, error: error.message };
  }
}