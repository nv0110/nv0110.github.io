import { supabase } from '../src/supabaseClient.js';
import { convertDateToWeekKey } from '../src/utils/weekUtils.js';
import { logger } from '../src/utils/logger.js';

/**
 * Utility Service for MapleStory Boss Crystal Calculator
 * Contains utility functions that were previously in pitched-data-service.js
 */

/**
 * Get historical week analysis for navigation
 */
export async function getHistoricalWeekAnalysis(userCode) {
  try {
    if (!userCode) {
      console.log('No user code provided for getHistoricalWeekAnalysis');
      return { success: false, error: 'No user code provided' };
    }

    const { getCurrentWeekKey } = await import('../src/utils/weekUtils.js');
    const currentWeek = getCurrentWeekKey();
    const historicalWeeks = new Set();

    // Query user_boss_data table for historical weeks
    const { data: userBossData, error: bossDataError } = await supabase
      .from('user_boss_data')
      .select('maple_week_start, weekly_clears')
      .eq('user_id', userCode);

    if (bossDataError && bossDataError.code !== 'PGRST116') {
      console.error('Error fetching user_boss_data for historical analysis:', bossDataError);
      return { success: false, error: bossDataError.message };
    }

    // Query user_data for pitched items historical weeks
    const { data: userData, error: userDataError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userCode)
      .single();

    if (userDataError && userDataError.code !== 'PGRST116') {
      console.error('Error fetching user_data for historical analysis:', userDataError);
    }

    // Check pitched items for historical weeks
    if (userData?.pitched_items && Array.isArray(userData.pitched_items)) {
      userData.pitched_items.forEach((item) => {
        if (item.date) {
          const weekKey = convertDateToWeekKey(item.date);
          if (weekKey && weekKey !== currentWeek) {
            historicalWeeks.add(weekKey);
          }
        }
      });
    }

    // Check user_boss_data for historical weeks
    if (userBossData && Array.isArray(userBossData)) {
      userBossData.forEach((weekData) => {
        if (weekData.maple_week_start && weekData.weekly_clears && Object.keys(weekData.weekly_clears).length > 0) {
          const weekKey = convertDateToWeekKey(weekData.maple_week_start);
          if (weekKey && weekKey !== currentWeek) {
            historicalWeeks.add(weekKey);
          }
        }
      });
    }

    // Convert to sorted array (oldest to newest)
    const historicalWeeksList = Array.from(historicalWeeks).sort((a, b) => {
      const parseWeekForSort = (weekKey) => {
        const parts = weekKey.split('-');
        if (parts.length === 2) {
          return { year: parseInt(parts[0]), week: parseInt(parts[1]) };
        } else if (parts.length === 3) {
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
      oldestHistoricalWeek = historicalWeeksList[0];
      
      const { getWeekOffset } = await import('../src/utils/weekUtils.js');
      const oldestOffset = getWeekOffset(oldestHistoricalWeek);
      const weeksOfHistory = Math.abs(oldestOffset);

      if (weeksOfHistory > 8) {
        userType = 'existing';
        adaptiveWeekLimit = weeksOfHistory;
      }
    }

    return {
      success: true,
      hasHistoricalData,
      oldestHistoricalWeek,
      historicalWeeks: historicalWeeksList,
      totalHistoricalWeeks: historicalWeeksList.length,
      userType,
      adaptiveWeekLimit,
      currentWeek,
      analysis: {
        pitchedItemsCount: userData?.pitched_items ? userData.pitched_items.length : 0,
        userBossDataCount: userBossData ? userBossData.length : 0,
        weeksWithData: historicalWeeksList.length + 1 // +1 for current week
      }
    };

  } catch (error) {
    console.error('Error in getHistoricalWeekAnalysis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get historical week analysis for navigation - CHARACTER SPECIFIC
 */
export async function getCharacterHistoricalWeekAnalysis(userCode, characterName) {
  try {
    if (!userCode || !characterName) {
      console.log('No user code or character name provided for character-specific getHistoricalWeekAnalysis');
      return { success: false, error: 'No user code or character name provided' };
    }

    const { getCurrentWeekKey } = await import('../src/utils/weekUtils.js');
    const currentWeek = getCurrentWeekKey();
    const historicalWeeks = new Set();

    // Query user_boss_data table for historical weeks - FILTER BY CHARACTER
    const { data: userBossData, error: bossDataError } = await supabase
      .from('user_boss_data')
      .select('maple_week_start, weekly_clears')
      .eq('user_id', userCode);

    if (bossDataError && bossDataError.code !== 'PGRST116') {
      console.error('Error fetching user_boss_data for character historical analysis:', bossDataError);
      return { success: false, error: bossDataError.message };
    }

    // Query user_data for pitched items historical weeks - FILTER BY CHARACTER
    const { data: userData, error: userDataError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userCode)
      .single();

    if (userDataError && userDataError.code !== 'PGRST116') {
      console.error('Error fetching user_data for character historical analysis:', userDataError);
    }

    // Check pitched items for historical weeks - CHARACTER SPECIFIC
    if (userData?.pitched_items && Array.isArray(userData.pitched_items)) {
      userData.pitched_items
        .filter(item => item.charId === characterName) // Filter by character
        .forEach((item) => {
          if (item.date) {
            const weekKey = convertDateToWeekKey(item.date);
            if (weekKey && weekKey !== currentWeek) {
              historicalWeeks.add(weekKey);
            }
          }
        });
    }

    // Check user_boss_data for historical weeks - CHARACTER SPECIFIC
    if (userBossData && Array.isArray(userBossData)) {
      userBossData.forEach((weekData) => {
        if (weekData.maple_week_start && weekData.weekly_clears && Object.keys(weekData.weekly_clears).length > 0) {
          // Check if this character has any data in this week
          const hasCharacterData = Object.keys(weekData.weekly_clears).some(key => 
            key.includes(characterName)
          );
          
          if (hasCharacterData) {
            const weekKey = convertDateToWeekKey(weekData.maple_week_start);
            if (weekKey && weekKey !== currentWeek) {
              historicalWeeks.add(weekKey);
            }
          }
        }
      });
    }

    // Convert to sorted array (oldest to newest)
    const historicalWeeksList = Array.from(historicalWeeks).sort((a, b) => {
      const parseWeekForSort = (weekKey) => {
        const parts = weekKey.split('-');
        if (parts.length === 2) {
          return { year: parseInt(parts[0]), week: parseInt(parts[1]) };
        } else if (parts.length === 3) {
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
      oldestHistoricalWeek = historicalWeeksList[0];
      
      const { getWeekOffset } = await import('../src/utils/weekUtils.js');
      const oldestOffset = getWeekOffset(oldestHistoricalWeek);
      const weeksOfHistory = Math.abs(oldestOffset);

      if (weeksOfHistory > 8) {
        userType = 'existing';
        adaptiveWeekLimit = weeksOfHistory;
      }
    }

    // Count character-specific data
    const characterPitchedItems = userData?.pitched_items?.filter(item => item.charId === characterName) || [];
    const characterBossDataWeeks = userBossData?.filter(weekData => {
      return weekData.weekly_clears && Object.keys(weekData.weekly_clears).some(key => 
        key.includes(characterName)
      );
    }) || [];

    return {
      success: true,
      hasHistoricalData,
      oldestHistoricalWeek,
      historicalWeeks: historicalWeeksList,
      totalHistoricalWeeks: historicalWeeksList.length,
      userType,
      adaptiveWeekLimit,
      currentWeek,
      characterName, // Include character info
      analysis: {
        pitchedItemsCount: characterPitchedItems.length,
        userBossDataCount: characterBossDataWeeks.length,
        weeksWithData: historicalWeeksList.length + 1 // +1 for current week
      }
    };

  } catch (error) {
    console.error('Error in getCharacterHistoricalWeekAnalysis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear UI pitched item checkmarks for a specific character
 */
export function clearCharacterPitchedUI(pitchedChecked, characterName, characterIdx, weekKey) {
  const updatedPitchedChecked = { ...pitchedChecked };
  
  // Remove all pitched checkmarks for this character
  Object.keys(updatedPitchedChecked).forEach(key => {
    // Key format: "CharacterName-idx__ItemName__WeekKey"
    if (key.startsWith(`${characterName}-${characterIdx}__`) && key.endsWith(`__${weekKey}`)) {
      delete updatedPitchedChecked[key];
    }
  });
  
  return updatedPitchedChecked;
}

/**
 * Get pitched reset audit history for a user
 */
export async function getPitchedResetAuditHistory(userCode) {
  try {
    if (!userCode) {
      return { success: false, error: 'User code is required' };
    }

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
 * Complete stats reset: Purge ALL data for a user
 */
export async function purgeAllStatsData(userCode) {
  try {
    if (!userCode) {
      console.error('Missing required field: userCode');
      return { success: false, error: 'Missing required field: userCode' };
    }

    let totalItemsRemoved = 0;
    let totalUserBossDataRemoved = 0;

    // 1. Handle user_data (pitched items and audit)
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user data:', fetchError);
      throw fetchError;
    }

    if (userData) {
      const currentData = userData.data || {};
      const currentPitchedItems = userData.pitched_items || [];
      totalItemsRemoved = currentPitchedItems.length;

      // Create audit entry
      const auditTimestamp = new Date().toISOString();
      const auditEntry = {
        timestamp: auditTimestamp,
        action: 'complete_stats_reset',
        itemsRemoved: totalItemsRemoved,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
      };

      // Clear pitched items and add audit entry
      const updatedData = {
        ...currentData,
        lastUpdated: auditTimestamp,
        pitched_reset_history: [
          ...(currentData.pitched_reset_history || []),
          auditEntry
        ].slice(-50) // Keep only last 50 audit entries
      };

      await supabase
        .from('user_data')
        .update({
          pitched_items: [], // Clear all pitched items
          data: updatedData
        })
        .eq('id', userCode);
    }

    // 2. Handle user_boss_data
    const { data: userBossData, error: bossDataError } = await supabase
      .from('user_boss_data')
      .select('id')
      .eq('user_id', userCode);

    if (bossDataError && bossDataError.code !== 'PGRST116') {
      console.warn('Error fetching user_boss_data:', bossDataError);
    } else if (userBossData && userBossData.length > 0) {
      totalUserBossDataRemoved = userBossData.length;
      
      // Clear all user_boss_data entries
      const { error: deleteError } = await supabase
        .from('user_boss_data')
        .delete()
        .eq('user_id', userCode);

      if (deleteError) {
        console.error('Error clearing user_boss_data:', deleteError);
        throw deleteError;
      }
    }

    return {
      success: true,
      itemsRemoved: totalItemsRemoved,
      userBossDataRemoved: totalUserBossDataRemoved,
      totalEntriesRemoved: totalItemsRemoved + totalUserBossDataRemoved
    };

  } catch (error) {
    console.error('Error in complete stats reset:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Purge pitched records for a specific character
 */
export async function purgePitchedRecords(userCode, characterName, characterIdx) {
  try {
    if (!userCode || !characterName) {
      return { success: false, error: 'Missing required parameters' };
    }

    const supabase = await getSupabase();

    // Get current pitched items
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userCode)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const currentItems = userData?.pitched_items || [];
    
    // Filter out items for this character
    const filteredItems = currentItems.filter(item => 
      item.charId !== characterName
    );
    
    const removedCount = currentItems.length - filteredItems.length;

    // Update the database
    await supabase
      .from('user_data')
      .update({ pitched_items: filteredItems })
      .eq('id', userCode);

    return {
      success: true,
      removedCount,
      message: `Removed ${removedCount} pitched items for character ${characterName}`
    };

  } catch (error) {
    logger.error('Error purging pitched records:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

/**
 * Export user data
 */
export async function exportUserData(userCode) {
  try {
    
    // Get new user_boss_data
    const { data: userBossData, error: bossDataError } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', userCode);
    
    if (bossDataError && bossDataError.code !== 'PGRST116') {
      throw bossDataError;
    }
    
    // Get pitched items from user_data
    const { data: userData, error: userDataError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userCode)
      .single();
    
    if (userDataError && userDataError.code !== 'PGRST116') {
      console.warn('Could not fetch pitched items:', userDataError);
    }
    
    // Export clean data structure
    const exportData = { 
      user_boss_data: userBossData || [],
      pitched_items: userData?.pitched_items || [],
      exportDate: new Date().toISOString(),
      dataVersion: '3.0'
    };
    
    return { success: true, data: exportData };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { success: false, error };
  }
}

/**
 * Import user data
 */
export async function importUserData(userCode, importObj) {
  try {
    if (!importObj || typeof importObj !== 'object') {
      throw new Error('Invalid import object');
    }
    
    // Only handle new format (v3.0+)
    if (importObj.dataVersion !== '3.0') {
      throw new Error('Unsupported data format. Please export from a newer version.');
    }
    
    const { user_boss_data, pitched_items } = importObj;
    
    // 1. Clear existing user_boss_data and import new
    await supabase
      .from('user_boss_data')
      .delete()
      .eq('user_id', userCode);
      
    if (user_boss_data && Array.isArray(user_boss_data) && user_boss_data.length > 0) {
      const dataToInsert = user_boss_data.map(row => ({
        ...row,
        user_id: userCode // Ensure correct user_id
      }));
      
      await supabase
        .from('user_boss_data')
        .insert(dataToInsert);
    }
    
    // 2. Update pitched items if present
    if (pitched_items && Array.isArray(pitched_items)) {
      // Validate that all items have the new format
      const validItems = pitched_items.filter(item => 
        item && typeof item === 'object' && 
        item.charId && item.item && item.date
      );
      
      await supabase
        .from('user_data')
        .upsert({ 
          id: userCode, 
          pitched_items: validItems 
        });
    }
    
    console.log(`[Import] Successfully imported v3.0 data for user '${userCode}'`);
    return { success: true, message: 'Data imported successfully' };
    
  } catch (error) {
    console.error('Error importing user data:', error);
    return { success: false, error: error.message || 'Import failed' };
  }
}

// Helper: get supabase client dynamically for code splitting
async function getSupabase() {
  const { supabase } = await import('../src/supabaseClient');
  return supabase;
}

/**
 * Get user's full data including user_data and user_boss_data
 * Fetches all related data in a single request for efficiency
 * @param {string} userId - User's unique ID
 * @param {string} mapleWeekStart - Current week start date
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getUserFullData(userId, mapleWeekStart) {
  if (!userId || !mapleWeekStart) {
    return { success: false, error: 'Missing required parameters: userId and mapleWeekStart.' };
  }
  
  try {
    const supabase = await getSupabase();
    
    // Fetch user_data
    const { data: userData, error: userError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      logger.error('Error fetching user data:', userError);
      return { success: false, error: 'Failed to fetch user data.' };
    }
    
    if (!userData) {
      return { success: false, error: 'User not found.' };
    }
    
    // Fetch user_boss_data for current week
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', userId)
      .eq('maple_week_start', mapleWeekStart)
      .single();
    
    if (weeklyError && weeklyError.code !== 'PGRST116') {
      logger.error('Error fetching weekly data:', weeklyError);
      return { success: false, error: 'Failed to fetch weekly data.' };
    }
    
    return {
      success: true,
      data: {
        userData,
        weeklyData: weeklyData || null
      }
    };
    
  } catch (error) {
    logger.error('Unexpected error fetching user full data:', error);
    return { success: false, error: 'Failed to fetch user data.' };
  }
}

/**
 * Generate weekly stats from pitched items data
 * @param {Array} pitchedItems - Array of pitched item objects
 * @returns {Object} - Aggregated stats by week
 */
export function generateWeeklyStats(pitchedItems) {
  if (!Array.isArray(pitchedItems)) {
    return {};
  }
  
  const weeklyStats = {};
  
  pitchedItems.forEach(item => {
    // Convert date to week key using utility function
    const { convertDateToWeekKey } = require('../src/utils/weekUtils');
    const weekKey = convertDateToWeekKey(item.date);
    
    if (!weeklyStats[weekKey]) {
      weeklyStats[weekKey] = {
        totalItems: 0,
        itemCounts: {},
        characters: new Set()
      };
    }
    
    weeklyStats[weekKey].totalItems++;
    weeklyStats[weekKey].itemCounts[item.item] = (weeklyStats[weekKey].itemCounts[item.item] || 0) + 1;
    weeklyStats[weekKey].characters.add(item.charId);
  });
  
  // Convert Set to Array for JSON serialization
  Object.keys(weeklyStats).forEach(weekKey => {
    weeklyStats[weekKey].characters = Array.from(weeklyStats[weekKey].characters);
  });
  
  return weeklyStats;
}

/**
 * Clean up orphaned weekly boss clear data
 * @param {string} userId - User's unique ID
 * @param {Array} activeCharacterNames - Array of active character names
 * @returns {Promise<{success: boolean, cleanedWeeks?: number, error?: string}>}
 */
export async function cleanupOrphanedWeeklyData(userId, activeCharacterNames = []) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    const supabase = await getSupabase();
    
    // Fetch all weekly data for this user
    const { data: allWeeklyData, error: fetchError } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) {
      logger.error('Error fetching weekly data for cleanup:', fetchError);
      return { success: false, error: 'Failed to fetch weekly data' };
    }
    
    if (!allWeeklyData || allWeeklyData.length === 0) {
      return { success: true, cleanedWeeks: 0 };
    }
    
    let cleanedWeeks = 0;
    
    // Clean each weekly record
    for (const weekRecord of allWeeklyData) {
      let hasChanges = false;
      const cleanedCharMap = { ...weekRecord.char_map };
      const cleanedBossConfig = { ...weekRecord.boss_config };
      const cleanedWeeklyClears = { ...weekRecord.weekly_clears };
      
      // Remove entries for characters that no longer exist
      Object.keys(cleanedCharMap).forEach(charIndex => {
        const characterName = cleanedCharMap[charIndex];
        if (!activeCharacterNames.includes(characterName)) {
          delete cleanedCharMap[charIndex];
          delete cleanedBossConfig[charIndex];
          delete cleanedWeeklyClears[charIndex];
          hasChanges = true;
        }
      });
      
      // Update the record if changes were made
      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('user_boss_data')
          .update({
            char_map: cleanedCharMap,
            boss_config: cleanedBossConfig,
            weekly_clears: cleanedWeeklyClears
          })
          .eq('user_id', userId)
          .eq('maple_week_start', weekRecord.maple_week_start);
        
        if (updateError) {
          logger.error('Error updating cleaned weekly data:', updateError);
          // Continue with other records instead of failing completely
        } else {
          cleanedWeeks++;
        }
      }
    }
    
    if (cleanedWeeks > 0) {
      logger.info(`Cleaned orphaned data from ${cleanedWeeks} weekly records for user ${userId}`);
    }
    
    return { success: true, cleanedWeeks };
    
  } catch (error) {
    logger.error('Error cleaning up orphaned weekly data:', error);
    return { success: false, error: 'Failed to cleanup orphaned data' };
  }
}

/**
 * Reset pitched item statistics for a user
 * @param {string} userId - User's unique ID
 * @returns {Promise<{success: boolean, removedCount?: number, error?: string}>}
 */
export async function resetPitchedItemStats(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    const supabase = await getSupabase();
    
    // Get current pitched items count
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      logger.error('Error fetching user data for stats reset:', fetchError);
      return { success: false, error: 'Failed to fetch user data' };
    }
    
    const currentItems = userData?.pitched_items || [];
    const removedCount = currentItems.length;
    
    // Clear all pitched items
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ pitched_items: [] })
      .eq('id', userId);
    
    if (updateError) {
      logger.error('Error resetting pitched item stats:', updateError);
      return { success: false, error: 'Failed to reset stats' };
    }
    
    logger.info(`Reset ${removedCount} pitched items for user ${userId}`);
    
    return { success: true, removedCount };
    
  } catch (error) {
    logger.error('Error resetting pitched item stats:', error);
    return { success: false, error: 'Failed to reset stats' };
  }
}

/**
 * Validate and clean user data integrity
 * @param {string} userId - User's unique ID
 * @returns {Promise<{success: boolean, issues?: Array, fixed?: number, error?: string}>}
 */
export async function validateUserDataIntegrity(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing user ID' };
    }
    
    const supabase = await getSupabase();
    const issues = [];
    let fixedCount = 0;
    
    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      return { success: false, error: 'Failed to fetch user data' };
    }
    
    // Validate pitched_items structure
    const pitchedItems = userData.pitched_items || [];
    if (!Array.isArray(pitchedItems)) {
      issues.push('pitched_items is not an array');
      
      // Fix: Convert to empty array
      await supabase
        .from('user_data')
        .update({ pitched_items: [] })
        .eq('id', userId);
      
      fixedCount++;
    }
    
    // Validate each pitched item structure
    let validPitchedItems = [];
    pitchedItems.forEach((item, index) => {
      if (!item.charId || !item.item || !item.date) {
        issues.push(`Invalid pitched item at index ${index}: missing required fields`);
      } else {
        validPitchedItems.push(item);
      }
    });
    
    // If we found invalid items, update with only valid ones
    if (validPitchedItems.length !== pitchedItems.length) {
      await supabase
        .from('user_data')
        .update({ pitched_items: validPitchedItems })
        .eq('id', userId);
      
      fixedCount++;
    }
    
    // Fetch all weekly data for consistency checks
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', userId);
    
    if (weeklyError) {
      issues.push('Failed to fetch weekly data for validation');
    } else if (weeklyData) {
      // Check for data consistency issues
      weeklyData.forEach(week => {
        const charMap = week.char_map || {};
        const bossConfig = week.boss_config || {};
        const weeklyClears = week.weekly_clears || {};
        
        // Check if all characters in char_map have corresponding boss_config and weekly_clears
        Object.keys(charMap).forEach(charIndex => {
          if (!bossConfig[charIndex]) {
            issues.push(`Missing boss config for character ${charMap[charIndex]} in week ${week.maple_week_start}`);
          }
          if (!weeklyClears.hasOwnProperty(charIndex)) {
            issues.push(`Missing weekly clears for character ${charMap[charIndex]} in week ${week.maple_week_start}`);
          }
        });
      });
    }
    
    logger.info(`Data integrity check completed for user ${userId}: ${issues.length} issues found, ${fixedCount} fixed`);
    
    return {
      success: true,
      issues,
      fixed: fixedCount
    };
    
  } catch (error) {
    logger.error('Error validating user data integrity:', error);
    return { success: false, error: 'Failed to validate data integrity' };
  }
} 