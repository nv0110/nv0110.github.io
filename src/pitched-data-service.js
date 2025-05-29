import { getCurrentWeekKey as getWeekKeyFromUtils } from './utils/weekUtils';

// Helper: get current week key - now imports from weekUtils for consistency
export function getCurrentWeekKey() {
  return getWeekKeyFromUtils();
}

// Helper: get supabase client dynamically for code splitting
async function getSupabase() {
  const { supabase } = await import('./supabaseClient');
  return supabase;
}

// Removed unused helper functions - they were only used by pitched item tracking logic

// Function to save boss run data (within the existing data structure)
export async function saveBossRun(userCode, data) {
  try {
    // console.log('saveBossRun called with:', { userCode, data });
    const { character, characterIdx, bossName, bossDifficulty, isCleared, date, simulated } = data;
    
    if (!userCode || !character || !bossName || !bossDifficulty || isCleared === undefined) {
      console.error('Missing required fields:', { userCode, character, bossName, bossDifficulty, isCleared });
      return { success: false, error: 'Missing required fields' };
    }

    // 1. First, get the ENTIRE user record to ensure we don't lose any data
    const supabase = await getSupabase();
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('*')  // Select all columns to get the complete record
      .eq('id', userCode)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      throw fetchError;
    }

    // 2. Ensure we have a data object
    if (!userData) {
      console.error('No user data found');
      throw new Error('No user data found');
    }

    // 3. Create a proper copy of the data object (or initialize it if it doesn't exist)
    // Use a deep clone to ensure we're working with a complete copy
    const currentData = userData.data ? JSON.parse(JSON.stringify(userData.data)) : {};
    
    // 4. EXPLICITLY initialize boss_runs if it doesn't exist
    if (!currentData.boss_runs) {
      currentData.boss_runs = [];
      // console.log('Initializing missing boss_runs array in data object');
    } else if (!Array.isArray(currentData.boss_runs)) {
      // If it exists but isn't an array, make it an array
      // console.log('boss_runs exists but is not an array, fixing this issue');
      currentData.boss_runs = [];
    }
    
    const currentBossRuns = currentData.boss_runs;
    const currentWeekKey = getCurrentWeekKey();
    
    // 5. Log the existing state for debugging
    // console.log(`Current boss runs count: ${currentBossRuns.length}`);
    // console.log('Current data structure:', JSON.stringify(currentData, null, 2));
    
    // 🧹 COMPREHENSIVE CLEANUP: Remove any inconsistent boss_runs for this character
    // This handles cases where:
    // 1. Boss difficulty was changed on the input page
    // 2. Boss was completely removed and replaced with different boss
    // console.log('🧹 CLEANUP: Checking for inconsistent boss_runs to remove...');
    const charactersData = currentData.characters || [];
    const targetCharacter = charactersData.find((char, idx) => 
      char.name === character && (char.index === characterIdx || idx === characterIdx)
    );
    
    if (targetCharacter) {
      // console.log('🧹 CLEANUP: Found character data:', {
      //   name: targetCharacter.name,
      //   bosses: targetCharacter.bosses?.map(b => `${b.name}-${b.difficulty}`) || []
      // });
      
      // Create a set of valid boss-difficulty combinations for this character
      const validBossCombinations = new Set();
      targetCharacter.bosses?.forEach(boss => {
        validBossCombinations.add(`${boss.name}-${boss.difficulty}`);
      });
      
      // console.log('🧹 CLEANUP: Valid boss combinations for character:', Array.from(validBossCombinations));
      
      // Remove ALL boss_runs for this character that don't match the valid combinations
      const beforeCount = currentBossRuns.length;
      const filteredRuns = currentBossRuns.filter(run => {
        // Only check runs for this character and current week
        if (run.character !== character || run.weekKey !== currentWeekKey) {
          return true; // Keep runs for other characters/weeks
        }
        
        const runCombination = `${run.boss}-${run.difficulty}`;
        const isValid = validBossCombinations.has(runCombination);
        
        if (!isValid) {
          // console.log(`🗑️ CLEANUP: Removing invalid boss_run: ${run.character}-${run.boss}-${run.difficulty} (not in selected bosses)`);
        }
        
        return isValid;
      });
      
      // Update the boss_runs array
      currentData.boss_runs = filteredRuns;
      
      if (beforeCount !== filteredRuns.length) {
        // console.log(`🧹 CLEANUP: Removed ${beforeCount - filteredRuns.length} invalid boss_runs`);
      } else {
        // console.log('🧹 CLEANUP: No invalid boss_runs found to remove');
      }
    } else {
      // console.log('🧹 CLEANUP: Could not find character data for cleanup');
    }
    
    // 6. Continue with normal boss_run saving logic
    const updatedBossRuns = currentData.boss_runs; // Use the potentially cleaned array
    
    // Check for existing run entry for this character-boss-difficulty-week combination
    const existingRunIndex = updatedBossRuns.findIndex(run => 
      run.character === character && 
      run.boss === bossName && 
      run.difficulty === bossDifficulty && 
      run.weekKey === currentWeekKey
    );
    
    let finalBossRuns;
    
    if (isCleared) {
      // Boss is being checked - add or update entry
      const bossRun = {
        id: `${character}-${bossName}-${bossDifficulty}-${currentWeekKey}-${Date.now()}`,
        character,
        characterIdx: characterIdx || 0,
        boss: bossName,
        difficulty: bossDifficulty,
        cleared: true,
        date: date || new Date().toISOString(),
        weekKey: currentWeekKey,
        ...(simulated && { simulated: true }) // Add simulated flag if true
      };
      
      if (existingRunIndex !== -1) {
        // Update existing entry
        finalBossRuns = [...updatedBossRuns];
        finalBossRuns[existingRunIndex] = {
          ...finalBossRuns[existingRunIndex],
          cleared: true,
          date: date || new Date().toISOString(), // Update the timestamp
          lastUpdated: new Date().toISOString(),
          ...(simulated && { simulated: true }) // Add simulated flag if true
        };
        // console.log(`Updating existing boss run at index ${existingRunIndex}`);
      } else {
        // Add new entry
        finalBossRuns = [...updatedBossRuns, bossRun];
        // console.log(`Adding new boss run, total count will be ${finalBossRuns.length}`);
      }
    } else {
      // Boss is being unchecked - remove entry completely
      if (existingRunIndex !== -1) {
        finalBossRuns = updatedBossRuns.filter((run, index) => index !== existingRunIndex);
        // console.log(`Removing boss run at index ${existingRunIndex}, total count will be ${finalBossRuns.length}`);
      } else {
        // No existing entry to remove
        finalBossRuns = [...updatedBossRuns];
        // console.log('No existing boss run found to remove');
      }
    }
    
    // 7. Create the updated data object, ensuring we preserve all existing properties
    // IMPORTANT: We explicitly set boss_runs to make sure it's included
    const updatedData = {
      ...currentData,
      boss_runs: finalBossRuns,
      lastUpdated: new Date().toISOString()
    };
    
    // Double-check the updated data structure
    // console.log('About to save this data structure:', JSON.stringify({
    //   ...updatedData,
    //   boss_runs_count: finalBossRuns.length // Just for logging
    // }, null, 2).substring(0, 200) + '...');
    
    // 8. First try with a simpler approach - just add the boss_runs field directly
    // We'll avoid any complex structures and just make sure boss_runs is in the data
    const simplifiedData = {
      ...currentData,
      boss_runs: finalBossRuns,
      lastUpdated: new Date().toISOString()
    };
    
    // console.log('SIMPLIFIED DATA STRUCTURE:', JSON.stringify(simplifiedData).substring(0, 200) + '...');
    
    // console.log('🚨 ATTEMPTING DATABASE UPDATE WITH BOSS RUNS ARRAY');
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ 
        data: simplifiedData  // Use the simplified structure
      })
      .eq('id', userCode)
      .select();
    
    // console.log('UPDATE RESULT:', JSON.stringify(updateResult));
      
    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }
    
    // 9. Verify the update actually worked by checking the returned data
    // console.log(`Successfully ${isCleared ? 'saved' : 'removed'} boss run for ${character} - ${bossName} ${bossDifficulty}. Cleared: ${isCleared}`);
    
    // 10. IMPORTANT: Do a separate fetch to see what's ACTUALLY in the database
    // console.log('🔍 VERIFYING DATABASE STATE WITH SEPARATE FETCH');
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', userCode)
      .single();
    
    if (verifyError) {
      console.error('Verification fetch error:', verifyError);
    } else {
      // console.log('DATABASE ACTUAL STATE:', JSON.stringify(verifyData).substring(0, 200) + '...');
      
      // Check if boss_runs exists in the data
      if (verifyData?.data?.boss_runs) {
        // console.log(`✅ VERIFICATION SUCCESS: Database has ${verifyData.data.boss_runs.length} boss runs`);
      } else {
        // console.log('❌ VERIFICATION FAILED: No boss_runs array found in database');
        
        // Try another approach - use UPSERT instead of UPDATE
        // console.log('⚠️ Attempting UPSERT as a fallback...');
        
        // Create a complete record with the boss_runs array
        const completeRecord = {
          id: userCode,
          data: {
            ...verifyData.data,
            boss_runs: finalBossRuns,
            lastUpdated: new Date().toISOString()
          }
        };
        
        const { error: upsertError } = await supabase
          .from('user_data')
          .upsert(completeRecord);
          
        if (upsertError) {
          console.error('Upsert failed:', upsertError);
        } else {
          // console.log('✅ Upsert succeeded, verifying again...');
          
          // Verify one more time
          const { data: finalVerify } = await supabase
            .from('user_data')
            .select('*')
            .eq('id', userCode)
            .single();
            
          if (finalVerify?.data?.boss_runs) {
            // console.log(`✅✅ FINAL VERIFICATION: Database now has ${finalVerify.data.boss_runs.length} boss runs`);
          } else {
            // console.log('❌❌ FINAL VERIFICATION FAILED: Still no boss_runs array');
          }
        }
      }
    }
    
    
    return { 
      success: true, 
      bossRuns: finalBossRuns,
      updatedData: updatedData 
    };
  } catch (error) {
    console.error('Error saving boss run:', error);
    return { success: false, error };
  }
}

// REMOVED: savePitchedItem function - pitched item tracking disabled
export async function savePitchedItem() {
  return { success: false, error: 'Pitched item tracking has been disabled' };
}

// Function to get all pitched items for a user
export async function getPitchedItems(userCode) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userCode)
      .single();
      
    if (error) throw error;
    return { success: true, data: data?.data?.pitchedItems || [] };
  } catch (error) {
    console.error('Error fetching pitched items:', error);
    return { success: false, error, data: [] };
  }
}

// Function to get all pitched items from the pitched_items column
export async function getAllPitchedItems(userCode) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userCode)
      .single();
      
    if (error) throw error;
    return { success: true, items: data?.pitched_items || [] };
  } catch (error) {
    console.error('Error fetching all pitched items:', error);
    return { success: false, error, items: [] };
  }
}

// Function to get yearly stats for pitched items
export async function getYearlyPitchedStats(userCode, year = null) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userCode)
      .single();
      
    if (error) throw error;
    
    const pitchedItems = data.pitched_items || [];
    
    // Process data to get yearly stats
    const yearlyStats = {};
    
    pitchedItems.forEach(item => {
      const itemYear = new Date(item.date).getFullYear();
      
      // Skip if filtering by year and this item is from a different year
      if (year && itemYear !== parseInt(year)) return;
      
      if (!yearlyStats[itemYear]) {
        yearlyStats[itemYear] = {
          total: 0,
          characters: new Set(),
          items: []
        };
      }
      
      yearlyStats[itemYear].total += 1;
      yearlyStats[itemYear].characters.add(item.character);
      yearlyStats[itemYear].items.push({
        character: item.character,
        boss: item.boss,
        item: item.item,
        image: item.image,
        date: item.date
      });
    });
    
    // Convert Sets to Arrays for easier handling in the frontend
    Object.keys(yearlyStats).forEach(year => {
      yearlyStats[year].characters = Array.from(yearlyStats[year].characters);
    });
    
    return { success: true, data: yearlyStats };
  } catch (error) {
    console.error('Error fetching yearly pitched stats:', error);
    return { success: false, error, data: {} };
  }
}

// REMOVED: deletePitchedItems and removeManyPitchedItems functions - pitched item tracking disabled
export async function deletePitchedItems() {
  return { success: false, error: 'Pitched item tracking has been disabled' };
}

export async function removeManyPitchedItems() {
  return { success: false, error: 'Pitched item tracking has been disabled' };
}

// Export user data (both data and pitched_items columns)
export async function exportUserData(userCode) {
  try {
    const supabase = await getSupabase();
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();
    if (error) throw error;
    
    // Export data with weekKey for compatibility
    const exportData = { 
      data: userData.data, 
      pitched_items: userData.pitched_items,
      weekKey: userData.data?.weekKey || getCurrentWeekKey(),
      exportDate: new Date().toISOString()
    };
    
    return { success: true, export: exportData };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { success: false, error };
  }
}

// REMOVED: syncPitchedItemsToCheckedState function - pitched item tracking disabled
export function syncPitchedItemsToCheckedState() {
  console.log('Pitched item tracking has been disabled');
  return {};
}

// Utility function to ensure pitched items and boss tracking are in sync
export async function ensureDataSynchronization(userCode, checkedState, pitchedItems, weekKey = getCurrentWeekKey()) {
  if (!userCode) {
    console.log('No user code provided for data synchronization');
    return { success: false, error: 'No user code provided' };
  }
  
  try {
    console.log(`Starting comprehensive data synchronization for user ${userCode} and week ${weekKey}`);
    
    // 1. Fetch the current database state
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();
    
    if (error) throw error;
    
    // Ensure data structure is valid
    if (!data) {
      console.error('No data found for user', userCode);
      return { success: false, error: 'No user data found' };
    }
    
    // 2. Update database state without legacy checked field (boss_runs is single source of truth)
    let updatedData = {
      ...data.data,
      weekKey,
      lastUpdated: new Date().toISOString()
    };
    
    // 3. Ensure database pitched items are reflected in local state
    const dbPitchedItems = data.pitched_items || [];
    
    // 4. Update the database with the merged state
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ 
        data: updatedData
      })
      .eq('id', userCode);
    
    if (updateError) throw updateError;
    
    console.log(`Data synchronization completed successfully for user ${userCode}`);
    return { success: true, updatedData, updatedPitchedItems: dbPitchedItems };
  } catch (error) {
    console.error('Error in data synchronization:', error);
    return { success: false, error };
  }
}

// Removed generateBossKeysForAllDifficulties - only used by pitched item tracking logic

// Import user data (overwrites both data and pitched_items columns for the user)
export async function importUserData(userCode, importObj) {
  try {
    if (!importObj || typeof importObj !== 'object') throw new Error('Invalid import object');
    const { data, pitched_items, weekKey: importedWeekKey } = importObj;
    
    // Fetch current user data to compare week keys
    const supabase = await getSupabase();
    const { error: fetchError } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userCode)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    
    const currentWeekKey = getCurrentWeekKey();
    
    // Handle week key transitions
    let updatedData = { ...data };
    
    // If we're in a new week compared to the backup, update the weekKey
    if (importedWeekKey && importedWeekKey !== currentWeekKey) {
      console.log(`[Import] Week key transition: ${importedWeekKey} -> ${currentWeekKey}`);
      updatedData.weekKey = currentWeekKey;
    }
    
    // Note: Boss clear state is now tracked via boss_runs array, not legacy checked field
    // Pitched items sync is handled separately via boss_runs reconstruction
    
    // Update the database with the processed data
    const { error } = await supabase
      .from('user_data')
      .update({ data: updatedData, pitched_items })
      .eq('id', userCode);
      
    if (error) throw error;
    console.log(`[Import] Successfully imported data for user '${userCode}'.`);
    return { success: true, data: updatedData };
  } catch (error) {
    console.error('Error importing user data:', error);
    return { success: false, error };
  }
}

// REMOVED: purgePitchedRecords function - pitched item tracking disabled
export async function purgePitchedRecords() {
  return { success: false, error: 'Pitched item tracking has been disabled' };
}

/**
 * Get pitched reset audit history for a user
 * @param {string} userCode - User code
 * @returns {Object} - Result with audit history
 */
export async function getPitchedResetAuditHistory(userCode) {
  try {
    if (!userCode) {
      return { success: false, error: 'User code is required' };
    }

    const supabase = await getSupabase();
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userCode)
      .single();

    if (fetchError) {
      console.error('Error fetching audit history:', fetchError);
      throw fetchError;
    }

    const auditHistory = userData.data?.pitched_reset_history || [];
    
    // Sort by timestamp (most recent first)
    const sortedHistory = auditHistory.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    return { 
      success: true, 
      history: sortedHistory,
      totalResets: sortedHistory.length
    };

  } catch (error) {
    console.error('Error getting pitched reset audit history:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Clear UI pitched item checkmarks for a specific character
 * @param {Object} pitchedChecked - Current pitched checked state
 * @param {string} characterName - Character name to clear
 * @param {number} characterIdx - Character index
 * @param {string} weekKey - Current week key
 * @returns {Object} - Updated pitched checked state
 */
export function clearCharacterPitchedUI(pitchedChecked, characterName, characterIdx, weekKey) {
  const updatedPitchedChecked = { ...pitchedChecked };
  
  // Remove all pitched checkmarks for this character
  Object.keys(updatedPitchedChecked).forEach(key => {
    // Key format: "CharacterName-idx__BossName__ItemName__WeekKey"
    if (key.startsWith(`${characterName}-${characterIdx}__`) && key.endsWith(`__${weekKey}`)) {
      // console.log(`🗑️ Clearing UI checkmark: ${key}`);
      delete updatedPitchedChecked[key];
    }
  });
  
  return updatedPitchedChecked;
}

/**
 * Admin utility: Get comprehensive reset statistics for all users
 * @param {string} adminUserCode - Admin user code (for authorization)
 * @returns {Object} - Aggregated reset statistics
 */
export async function getGlobalResetStatistics(adminUserCode) {
  try {
    // Basic authorization check (you might want to enhance this)
    if (!adminUserCode || !adminUserCode.startsWith('ADMIN_')) {
      return { success: false, error: 'Unauthorized access' };
    }

    // This would require admin privileges - implement based on your auth system
    // console.log('📊 Fetching global reset statistics...');
    
    // For now, return a placeholder - you'd need to implement proper admin queries
    return {
      success: true,
      message: 'Admin feature - implement based on your authorization system',
      note: 'This requires database-level aggregation queries with proper admin authentication'
    };

  } catch (error) {
    console.error('Error getting global reset statistics:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// Get all available weeks for a user (for navigation)
export async function getAvailableWeeks(userCode) {
  try {
    if (!userCode) {
      console.log('No user code provided for getAvailableWeeks');
      return { success: false, error: 'No user code provided' };
    }

    // Get all unique week keys from pitched_items and main data
    const supabase = await getSupabase();
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();

    if (error) {
      console.error('Error fetching user data for available weeks:', error);
      return { success: false, error: error.message };
    }

    const weekSet = new Set();
    const currentWeek = getCurrentWeekKey();
    
    // Always include current week
    weekSet.add(currentWeek);

    // Add weeks from pitched items
    if (userData.pitched_items && Array.isArray(userData.pitched_items)) {
      userData.pitched_items.forEach(item => {
        if (item.weekKey) {
          weekSet.add(item.weekKey);
        }
      });
    }

    // Add weeks from boss runs stored in data object
    if (userData.data && userData.data.boss_runs && Array.isArray(userData.data.boss_runs)) {
      userData.data.boss_runs.forEach(run => {
        if (run.weekKey) {
          weekSet.add(run.weekKey);
        }
      });
    }

    // Add week from main data if it exists
    if (userData.data && userData.data.weekKey) {
      weekSet.add(userData.data.weekKey);
    }

    // Convert to sorted array (oldest to newest)
    const weeks = Array.from(weekSet).sort((a, b) => {
      const [yearA, weekA] = a.split('-').map(Number);
      const [yearB, weekB] = b.split('-').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      return weekA - weekB;
    });

    // console.log(`Found ${weeks.length} weeks with data:`, weeks);

    return {
      success: true,
      weeks,
      currentWeek,
      oldestWeek: weeks.length > 0 ? weeks[0] : currentWeek,
      newestWeek: weeks.length > 0 ? weeks[weeks.length - 1] : currentWeek
    };

  } catch (error) {
    console.error('Error in getAvailableWeeks:', error);
    return { success: false, error: error.message };
  }
}

// Get data for a specific week
export async function getWeekData(userCode, weekKey) {
  try {
    if (!userCode || !weekKey) {
      return { success: false, error: 'Missing userCode or weekKey' };
    }

    // console.log(`Fetching data for week: ${weekKey}`);

    // Get user data
    const supabase = await getSupabase();
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();

    if (error) {
      console.error('Error fetching week data:', error);
      return { success: false, error: error.message };
    }

    // Filter pitched items for this week
    const pitchedItems = userData.pitched_items 
      ? userData.pitched_items.filter(item => item.weekKey === weekKey)
      : [];

    // Filter boss runs for this week (stored in data object)
    const bossRuns = userData.data && userData.data.boss_runs
      ? userData.data.boss_runs.filter(run => run.weekKey === weekKey)
      : [];

    // Get checked state - either from specific week data or reconstruct from boss runs
    let checkedState = {};
    
    // If main data is for this week, use it
    if (userData.data && userData.data.weekKey === weekKey) {
      checkedState = userData.data.checked || {};
    } else {
      // Reconstruct checked state from boss runs
      bossRuns.forEach(run => {
        if (run.cleared) {
          const charKey = `${run.character}-${run.characterIdx || 0}`;
          const bossKey = `${run.boss}-${run.difficulty}`;
          
          if (!checkedState[charKey]) {
            checkedState[charKey] = {};
          }
          checkedState[charKey][bossKey] = true;
        }
      });
    }

    // console.log(`Week ${weekKey} data:`, {
    //   pitchedItems: pitchedItems.length,
    //   bossRuns: bossRuns.length,
    //   checkedStates: Object.keys(checkedState).length
    // });

    return {
      success: true,
      weekKey,
      pitchedItems,
      bossRuns,
      checkedState,
      hasData: pitchedItems.length > 0 || bossRuns.length > 0 || Object.keys(checkedState).length > 0
    };

  } catch (error) {
    console.error('Error in getWeekData:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete stats reset: Purge ALL pitched records and boss runs for a user
 * @param {string} userCode - User code
 * @returns {Object} - Result with success status and audit information
 */
export async function purgeAllStatsData(userCode) {
  try {
    // console.log(`🗑️ Starting complete stats reset for user: ${userCode}`);
    
    if (!userCode) {
      console.error('Missing required field: userCode');
      return { success: false, error: 'Missing required field: userCode' };
    }

    // 1. Fetch current user data
    const supabase = await getSupabase();
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      throw fetchError;
    }

    const currentData = userData.data || {};
    const currentPitchedItems = userData.pitched_items || [];
    const currentBossRuns = currentData.boss_runs || [];

    // 2. Create audit entry before clearing
    const auditTimestamp = new Date().toISOString();
    const auditEntry = {
      timestamp: auditTimestamp,
      action: 'complete_stats_reset',
      itemsRemoved: currentPitchedItems.length,
      bossRunsRemoved: currentBossRuns.length,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
    };

    // 3. Clear ALL pitched items and boss runs
    const updatedData = {
      ...currentData,
      boss_runs: [], // Clear all boss runs
      lastUpdated: auditTimestamp,
      // Add audit tracking
      pitched_reset_history: [
        ...(currentData.pitched_reset_history || []),
        auditEntry
      ].slice(-50) // Keep only last 50 audit entries
    };

    // 4. Update database with completely cleared data
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ 
        pitched_items: [], // Clear all pitched items
        data: updatedData
      })
      .eq('id', userCode);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    // console.log(`✅ Complete stats reset successful for user ${userCode}`);
    // console.log(`📊 Removed ${auditEntry.itemsRemoved} pitched items and ${auditEntry.bossRunsRemoved} boss runs`);

    return { 
      success: true, 
      audit: auditEntry,
      itemsRemoved: auditEntry.itemsRemoved,
      bossRunsRemoved: auditEntry.bossRunsRemoved
    };

  } catch (error) {
    console.error('Error in complete stats reset:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// Function to save multiple boss runs in a single batch operation
export async function saveBatchBossRuns(userCode, bossRunsArray) {
  try {
    // console.log('saveBatchBossRuns called with:', { userCode, count: bossRunsArray.length });
    
    if (!userCode || !Array.isArray(bossRunsArray) || bossRunsArray.length === 0) {
      console.error('Invalid parameters for batch boss runs');
      return { success: false, error: 'Invalid parameters' };
    }

    // Validate all entries
    for (const data of bossRunsArray) {
      const { character, bossName, bossDifficulty, isCleared } = data;
      if (!character || !bossName || !bossDifficulty || isCleared === undefined) {
        console.error('Missing required fields in batch entry:', data);
        return { success: false, error: 'Missing required fields in batch entry' };
      }
    }

    // Get current user data
    const supabase = await getSupabase();
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', userCode)
      .single();

    if (fetchError) {
      console.error('Error fetching user data for batch update:', fetchError);
      throw fetchError;
    }

    if (!userData) {
      console.error('No user data found for batch update');
      throw new Error('No user data found');
    }

    // Create a proper copy of the data object
    const currentData = userData.data ? JSON.parse(JSON.stringify(userData.data)) : {};
    
    // Initialize boss_runs if it doesn't exist
    if (!currentData.boss_runs || !Array.isArray(currentData.boss_runs)) {
      currentData.boss_runs = [];
      // console.log('Initializing boss_runs array for batch update');
    }
    
    const currentBossRuns = [...currentData.boss_runs];
    const currentWeekKey = getCurrentWeekKey();
    
    // console.log(`Starting batch update with ${currentBossRuns.length} existing boss runs`);
    
    // Process all boss runs in the batch
    let updatedBossRuns = [...currentBossRuns];
    
    for (const bossRunData of bossRunsArray) {
      const { character, characterIdx, bossName, bossDifficulty, isCleared, date, simulated } = bossRunData;
      
      // Find existing run for this character-boss-difficulty-week combination
      const existingRunIndex = updatedBossRuns.findIndex(run => 
        run.character === character && 
        run.boss === bossName && 
        run.difficulty === bossDifficulty && 
        run.weekKey === currentWeekKey
      );
      
      if (isCleared) {
        // Boss is being checked - add or update entry
        const bossRun = {
          id: `${character}-${bossName}-${bossDifficulty}-${currentWeekKey}-${Date.now()}`,
          character,
          characterIdx: characterIdx || 0,
          boss: bossName,
          difficulty: bossDifficulty,
          cleared: true,
          date: date || new Date().toISOString(),
          weekKey: currentWeekKey,
          ...(simulated && { simulated: true }) // Add simulated flag if true
        };
        
        if (existingRunIndex !== -1) {
          // Update existing entry
          updatedBossRuns[existingRunIndex] = {
            ...updatedBossRuns[existingRunIndex],
            cleared: true,
            date: date || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          // console.log(`Batch: Updating existing boss run for ${bossName} ${bossDifficulty}`);
        } else {
          // Add new entry
          updatedBossRuns.push(bossRun);
          // console.log(`Batch: Adding new boss run for ${bossName} ${bossDifficulty}`);
        }
      } else {
        // Boss is being unchecked - remove entry completely
        if (existingRunIndex !== -1) {
          updatedBossRuns = updatedBossRuns.filter((run, index) => index !== existingRunIndex);
          // console.log(`Batch: Removing boss run for ${bossName} ${bossDifficulty}`);
        }
      }
    }
    
    // Create the updated data object
    const updatedData = {
      ...currentData,
      boss_runs: updatedBossRuns,
      lastUpdated: new Date().toISOString()
    };
    
    // console.log(`Batch update: ${currentBossRuns.length} → ${updatedBossRuns.length} boss runs`);
    
    // Perform single database update
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ data: updatedData })
      .eq('id', userCode)
      .select();
      
    if (updateError) {
      console.error('Batch database update error:', updateError);
      throw updateError;
    }
    
    // console.log(`✅ Batch boss runs update successful: ${bossRunsArray.length} operations completed`);
    
    return { 
      success: true, 
      updatedCount: bossRunsArray.length,
      totalBossRuns: updatedBossRuns.length
    };
    
  } catch (error) {
    console.error('Error in saveBatchBossRuns:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get historical week analysis for sophisticated navigation
 * Implements adaptive week limits and finds oldest historical data
 * @param {string} userCode - User code
 * @returns {Object} - Analysis with oldest historical week, adaptive limits, and user type
 */
export async function getHistoricalWeekAnalysis(userCode) {
  try {
    if (!userCode) {
      console.log('No user code provided for getHistoricalWeekAnalysis');
      return { success: false, error: 'No user code provided' };
    }

    // console.log('🔍 Analyzing historical week data for user:', userCode);

    // Query the user_data table in Supabase
    const supabase = await getSupabase();
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();

    if (error) {
      console.error('Error fetching user data for historical analysis:', error);
      return { success: false, error: error.message };
    }

    const currentWeek = getCurrentWeekKey();
    // console.log('📅 Current week:', currentWeek);
    // console.log('📊 Raw user data:', {
    //   pitchedItemsCount: userData.pitched_items ? userData.pitched_items.length : 0,
    //   bossRunsCount: userData.data && userData.data.boss_runs ? userData.data.boss_runs.length : 0
    // });

    const historicalWeeks = new Set();

    // Check for existing weekKey entries in the pitched_items column that are NOT from the current week
    if (userData.pitched_items && Array.isArray(userData.pitched_items)) {
      // console.log('🔍 Checking pitched_items for historical weeks...');
      userData.pitched_items.forEach((item) => {
        if (item.weekKey && item.weekKey !== currentWeek) {
          historicalWeeks.add(item.weekKey);
          // console.log(`    ✅ Added historical week: ${item.weekKey}`);
        }
      });
    } else {
      // console.log('❌ No pitched_items found or not an array');
    }

    // Also check boss_runs for historical weeks
    if (userData.data && userData.data.boss_runs && Array.isArray(userData.data.boss_runs)) {
      // console.log('🔍 Checking boss_runs for historical weeks...');
      userData.data.boss_runs.forEach((run) => {
        if (run.weekKey && run.weekKey !== currentWeek) {
          historicalWeeks.add(run.weekKey);
          // console.log(`    ✅ Added historical week: ${run.weekKey}`);
        }
      });
    } else {
      // console.log('❌ No boss_runs found or not an array');
    }

    // console.log('📋 Found historical weeks:', Array.from(historicalWeeks));

    // Convert to sorted array (oldest to newest)
    const historicalWeeksList = Array.from(historicalWeeks).sort((a, b) => {
      // Handle both legacy (YYYY-WW) and new (YYYY-MW-CW) formats
      const parseWeekForSort = (weekKey) => {
        const parts = weekKey.split('-');
        if (parts.length === 2) {
          // Legacy format
          return { year: parseInt(parts[0]), week: parseInt(parts[1]) };
        } else if (parts.length === 3) {
          // New format - use MapleStory week for sorting
          return { year: parseInt(parts[0]), week: parseInt(parts[1]) };
        }
        return { year: 0, week: 0 };
      };

      const weekA = parseWeekForSort(a);
      const weekB = parseWeekForSort(b);
      
      if (weekA.year !== weekB.year) return weekA.year - weekB.year;
      return weekA.week - weekB.week;
    });

    // Determine user type and adaptive limits
    const hasHistoricalData = historicalWeeksList.length > 0;
    let oldestHistoricalWeek = null;
    let userType = 'new';
    let adaptiveWeekLimit = 8; // Default 8-week limit

    if (hasHistoricalData) {
      // Select the oldest entry first (this ensures we're working with the earliest available data)
      oldestHistoricalWeek = historicalWeeksList[0];
      
      // Calculate how many weeks back the oldest data goes
      const { getWeekOffset } = await import('./utils/weekUtils');
      const oldestOffset = getWeekOffset(oldestHistoricalWeek);
      const weeksOfHistory = Math.abs(oldestOffset);

      if (weeksOfHistory > 8) {
        userType = 'existing';
        // Dynamic limit: extend the limit to match their tracking history
        adaptiveWeekLimit = weeksOfHistory;
        // console.log(`📊 Existing user detected: ${weeksOfHistory} weeks of history, adaptive limit: ${adaptiveWeekLimit}`);
      } else {
        userType = 'new';
        // console.log(`📊 New user detected: ${weeksOfHistory} weeks of history, standard limit: ${adaptiveWeekLimit}`);
      }
    }

    const result = {
      success: true,
      hasHistoricalData,
      oldestHistoricalWeek,
      historicalWeeks: historicalWeeksList,
      totalHistoricalWeeks: historicalWeeksList.length,
      userType,
      adaptiveWeekLimit,
      currentWeek,
      analysis: {
        pitchedItemsCount: userData.pitched_items ? userData.pitched_items.length : 0,
        bossRunsCount: userData.data && userData.data.boss_runs ? userData.data.boss_runs.length : 0,
        weeksWithData: historicalWeeksList.length + 1 // +1 for current week
      }
    };

    // console.log('📈 Historical week analysis result:', {
    //   userType: result.userType,
    //   hasHistoricalData: result.hasHistoricalData,
    //   oldestWeek: result.oldestHistoricalWeek,
    //   adaptiveLimit: result.adaptiveWeekLimit,
    //   totalWeeks: result.totalHistoricalWeeks
    // });

    return result;

  } catch (error) {
    console.error('Error in getHistoricalWeekAnalysis:', error);
    return { success: false, error: error.message };
  }
}

// REMOVED: cleanupOrphanedPitchedItems and clearPitchedItemsForWeek functions - pitched item tracking disabled
export async function cleanupOrphanedPitchedItems() {
  return { success: false, error: 'Pitched item tracking has been disabled' };
}

export async function clearPitchedItemsForWeek() {
  return { success: false, error: 'Pitched item tracking has been disabled' };
}
