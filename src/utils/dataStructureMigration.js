/**
 * DATA STRUCTURE MIGRATION UTILITIES
 * 
 * Functions to migrate from the old 'checked' structure to the new 
 * 'weeklyBossClearHistory' structure while preserving data integrity.
 */

import { getCurrentWeekKey } from './weekUtils';
import { createNewWeekEntry } from '../types/dataStructure';

/**
 * Migrate old data structure to new structure
 * @param {Object} oldUserData - The existing user data with 'checked' field
 * @returns {Object} - Migrated user data with new structure
 */
export function migrateUserDataStructure(oldUserData) {
  if (!oldUserData) return null;
  
  const currentWeekKey = getCurrentWeekKey();
  
  // Create the new structure
  const migratedData = {
    // Preserve existing character data
    characters: oldUserData.characters || [],
    
    // NEW: Weekly boss clear history with current week's data
    weeklyBossClearHistory: {},
    
    // NEW: Current active week
    currentWeekKey,
    
    // NEW: Weekly progress history (start empty, will be built over time)
    weeklyProgressHistory: oldUserData.weeklyHistory || [],
    
    // NEW: Account metadata
    accountCreatedDate: oldUserData.accountCreatedDate || new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
    
    // MIGRATION: Preserve old weekKey for reference
    legacyWeekKey: oldUserData.weekKey,
    
    // MIGRATION: Keep old checked data temporarily for safety
    legacyCheckedData: oldUserData.checked,
    
    // Preserve other existing data
    lastReset: oldUserData.lastReset,
    lastUpdated: new Date().toISOString()
  };
  
  // Migrate the old 'checked' data to the new weekly structure
  if (oldUserData.checked && Object.keys(oldUserData.checked).length > 0) {
    const weekToUse = oldUserData.weekKey || currentWeekKey;
    migratedData.weeklyBossClearHistory[weekToUse] = createNewWeekEntry(weekToUse);
    migratedData.weeklyBossClearHistory[weekToUse].bossClearStatus = oldUserData.checked;
    migratedData.weeklyBossClearHistory[weekToUse].lastUpdated = oldUserData.lastUpdated || new Date().toISOString();
    
    console.log(`✅ Migrated boss clear data from week ${weekToUse}`);
  }
  
  // Ensure current week exists in the history
  if (!migratedData.weeklyBossClearHistory[currentWeekKey]) {
    migratedData.weeklyBossClearHistory[currentWeekKey] = createNewWeekEntry(currentWeekKey);
  }
  
  console.log('🔄 Data structure migration completed');
  return migratedData;
}

/**
 * Get current week's boss clear status using new structure
 * @param {Object} userData - User data with new structure
 * @param {string} weekKey - Optional week key, defaults to current week
 * @returns {Object} - Boss clear status for the specified week
 */
export function getCurrentWeekBossClearStatus(userData, weekKey = null) {
  const targetWeek = weekKey || userData?.currentWeekKey || getCurrentWeekKey();
  return userData?.weeklyBossClearHistory?.[targetWeek]?.bossClearStatus || {};
}

/**
 * Update boss clear status for a specific week
 * @param {Object} userData - User data with new structure
 * @param {string} weekKey - Week to update
 * @param {Object} newBossClearStatus - New boss clear status object
 * @returns {Object} - Updated user data
 */
export function updateWeeklyBossClearStatus(userData, weekKey, newBossClearStatus) {
  const updatedData = { ...userData };
  
  // Ensure the week exists in history
  if (!updatedData.weeklyBossClearHistory) {
    updatedData.weeklyBossClearHistory = {};
  }
  
  if (!updatedData.weeklyBossClearHistory[weekKey]) {
    updatedData.weeklyBossClearHistory[weekKey] = createNewWeekEntry(weekKey);
  }
  
  // Update the boss clear status
  updatedData.weeklyBossClearHistory[weekKey].bossClearStatus = newBossClearStatus;
  updatedData.weeklyBossClearHistory[weekKey].lastUpdated = new Date().toISOString();
  updatedData.lastActiveDate = new Date().toISOString();
  updatedData.lastUpdated = new Date().toISOString();
  
  return updatedData;
}

/**
 * Add a weekly progress entry to history
 * @param {Object} userData - User data with new structure
 * @param {string} weekKey - Week key
 * @param {number} totalMesos - Total mesos earned that week
 * @param {number} completedBosses - Number of completed bosses
 * @param {number} totalBosses - Total number of bosses available
 * @returns {Object} - Updated user data
 */
export function addWeeklyProgressEntry(userData, weekKey, totalMesos, completedBosses, totalBosses) {
  const updatedData = { ...userData };
  
  if (!updatedData.weeklyProgressHistory) {
    updatedData.weeklyProgressHistory = [];
  }
  
  // Remove existing entry for this week if it exists
  updatedData.weeklyProgressHistory = updatedData.weeklyProgressHistory.filter(
    entry => entry.weekKey !== weekKey
  );
  
  // Add new entry
  updatedData.weeklyProgressHistory.push({
    weekKey,
    totalMesos,
    completedBosses,
    totalBosses,
    completionDate: new Date().toISOString()
  });
  
  // Sort by week key (most recent first)
  updatedData.weeklyProgressHistory.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  
  return updatedData;
}

/**
 * Check if user data needs migration
 * @param {Object} userData - User data to check
 * @returns {boolean} - True if migration is needed
 */
export function needsMigration(userData) {
  if (!userData) return false;
  
  // If it has the old 'checked' field but not the new structure, needs migration
  const hasOldStructure = userData.checked && !userData.weeklyBossClearHistory;
  const hasLegacyFields = userData.weekKey && !userData.currentWeekKey;
  
  return hasOldStructure || hasLegacyFields;
}

/**
 * Clean up migrated data (remove legacy fields after successful migration)
 * @param {Object} userData - User data after migration
 * @returns {Object} - Cleaned user data
 */
export function cleanupLegacyFields(userData) {
  const cleanedData = { ...userData };
  
  // Remove legacy fields after confirming new structure works
  delete cleanedData.checked;
  delete cleanedData.weekKey;
  delete cleanedData.legacyCheckedData;
  delete cleanedData.legacyWeekKey;
  delete cleanedData.pitched_item_tracking; // Replaced with pitched_items calculation
  delete cleanedData.pitchedItemTrackingData; // Redundant - can be calculated from pitched_items
  
  console.log('🧹 Legacy fields cleaned up');
  return cleanedData;
}

/**
 * Get all available weeks from history
 * @param {Object} userData - User data with new structure
 * @returns {Array} - Array of week keys sorted by date (most recent first)
 */
export function getAvailableWeeks(userData) {
  if (!userData?.weeklyBossClearHistory) return [];
  
  return Object.keys(userData.weeklyBossClearHistory)
    .sort((a, b) => b.localeCompare(a)); // Most recent first
}

/**
 * Calculate statistics for a specific week
 * @param {Object} userData - User data with new structure
 * @param {string} weekKey - Week to calculate stats for
 * @param {Array} bossData - Boss data for price calculations
 * @returns {Object} - Week statistics
 */
export function calculateWeekStats(userData, weekKey, bossData) {
  const weekData = userData?.weeklyBossClearHistory?.[weekKey];
  if (!weekData) return null;
  
  const bossClearStatus = weekData.bossClearStatus;
  let totalMesos = 0;
  let completedBosses = 0;
  let totalPossibleBosses = 0;
  
  // Calculate stats from characters and their boss selections
  const characters = userData?.characters || [];
  
  characters.forEach((char, charIdx) => {
    const charKey = `${char.name}-${charIdx}`;
    const charClearStatus = bossClearStatus[charKey] || {};
    
    char.bosses?.forEach(boss => {
      const bossKey = `${boss.name}-${boss.difficulty}`;
      totalPossibleBosses++;
      
      if (charClearStatus[bossKey]) {
        completedBosses++;
        totalMesos += Math.ceil((boss.price || 0) / (boss.partySize || 1));
      }
    });
  });
  
  return {
    weekKey,
    totalMesos,
    completedBosses,
    totalPossibleBosses,
    completionPercentage: totalPossibleBosses > 0 ? (completedBosses / totalPossibleBosses) * 100 : 0,
    lastUpdated: weekData.lastUpdated
  };
}

/**
 * Calculate pitched item tracking metadata from pitched_items array
 * This replaces the redundant pitchedItemTrackingData field
 * @param {Array} pitchedItems - Array of pitched item objects
 * @returns {Object} - Calculated metadata
 */
export function calculatePitchedItemMetadata(pitchedItems = []) {
  if (!Array.isArray(pitchedItems) || pitchedItems.length === 0) {
    return {
      lastUpdated: new Date().toISOString(),
      totalItemsTracked: 0,
      weeksTracked: []
    };
  }
  
  // Calculate metadata from the source of truth
  const totalItemsTracked = pitchedItems.length;
  const weeksTracked = [...new Set(pitchedItems.map(item => item.weekKey))].sort();
  const lastUpdated = pitchedItems.reduce((latest, item) => {
    const itemDate = new Date(item.obtainedDate);
    return itemDate > new Date(latest) ? item.obtainedDate : latest;
  }, pitchedItems[0]?.obtainedDate || new Date().toISOString());
  
  return {
    lastUpdated,
    totalItemsTracked,
    weeksTracked
  };
}

/**
 * Get pitched items for a specific week
 * @param {Array} pitchedItems - Array of pitched item objects
 * @param {string} weekKey - Week key to filter by
 * @returns {Array} - Pitched items for the specified week
 */
export function getPitchedItemsForWeek(pitchedItems = [], weekKey) {
  if (!Array.isArray(pitchedItems)) return [];
  return pitchedItems.filter(item => item.weekKey === weekKey);
}

/**
 * Get pitched items grouped by week
 * @param {Array} pitchedItems - Array of pitched item objects
 * @returns {Object} - Object with week keys as keys and arrays of items as values
 */
export function groupPitchedItemsByWeek(pitchedItems = []) {
  if (!Array.isArray(pitchedItems)) return {};
  
  return pitchedItems.reduce((grouped, item) => {
    const weekKey = item.weekKey;
    if (!grouped[weekKey]) {
      grouped[weekKey] = [];
    }
    grouped[weekKey].push(item);
    return grouped;
  }, {});
}

/**
 * USAGE EXAMPLES:
 * 
 * // Instead of accessing userData.pitchedItemTrackingData:
 * const metadata = calculatePitchedItemMetadata(pitchedItems);
 * console.log(`Total items: ${metadata.totalItemsTracked}`);
 * console.log(`Weeks tracked: ${metadata.weeksTracked.join(', ')}`);
 * console.log(`Last updated: ${metadata.lastUpdated}`);
 * 
 * // Get items for current week:
 * const currentWeekItems = getPitchedItemsForWeek(pitchedItems, currentWeekKey);
 * 
 * // Group all items by week:
 * const groupedItems = groupPitchedItemsByWeek(pitchedItems);
 */

/**
 * Clean up orphaned character data when a character is deleted
 * @param {Object} userData - User data with new structure
 * @param {Array} pitchedItems - Array of pitched item objects  
 * @param {string} deletedCharacterName - Name of the deleted character
 * @param {number} deletedCharacterIndex - Index of the deleted character
 * @returns {Object} - Object with cleaned userData and pitchedItems
 */
export function cleanupDeletedCharacterData(userData, pitchedItems, deletedCharacterName, deletedCharacterIndex) {
  const cleanedUserData = { ...userData };
  const cleanedPitchedItems = [...pitchedItems];
  
  // Generate the character key that would be used in boss clear status
  const characterKey = `${deletedCharacterName}-${deletedCharacterIndex}`;
  
  console.log(`🧹 Cleaning up data for deleted character: ${characterKey}`);
  
  // Clean up weekly boss clear history for all weeks
  if (cleanedUserData.weeklyBossClearHistory) {
    let totalCleaned = 0;
    Object.keys(cleanedUserData.weeklyBossClearHistory).forEach(weekKey => {
      const weekData = cleanedUserData.weeklyBossClearHistory[weekKey];
      if (weekData?.bossClearStatus && weekData.bossClearStatus[characterKey]) {
        delete weekData.bossClearStatus[characterKey];
        weekData.lastUpdated = new Date().toISOString();
        totalCleaned++;
        console.log(`🧹 Removed boss clear data for ${characterKey} from week ${weekKey}`);
      }
    });
    
    if (totalCleaned > 0) {
      cleanedUserData.lastUpdated = new Date().toISOString();
      console.log(`✅ Cleaned boss clear data from ${totalCleaned} weeks`);
    }
  }
  
  // Clean up pitched items for the deleted character
  const originalPitchedCount = cleanedPitchedItems.length;
  const filteredPitchedItems = cleanedPitchedItems.filter(item => 
    item.character !== deletedCharacterName
  );
  
  const removedPitchedCount = originalPitchedCount - filteredPitchedItems.length;
  if (removedPitchedCount > 0) {
    console.log(`🧹 Removed ${removedPitchedCount} pitched items for character ${deletedCharacterName}`);
  }
  
  return {
    userData: cleanedUserData,
    pitchedItems: filteredPitchedItems,
    cleanupStats: {
      weeksWithBossClearData: totalCleaned,
      pitchedItemsRemoved: removedPitchedCount
    }
  };
}

/**
 * Clean up orphaned data for characters that no longer exist
 * This is useful for fixing data inconsistencies
 * @param {Object} userData - User data with new structure
 * @param {Array} pitchedItems - Array of pitched item objects
 * @returns {Object} - Object with cleaned userData and pitchedItems
 */
export function cleanupOrphanedCharacterData(userData, pitchedItems) {
  const cleanedUserData = { ...userData };
  const cleanedPitchedItems = [...pitchedItems];
  
  // Get list of current character names
  const currentCharacters = userData?.characters || [];
  const currentCharacterNames = currentCharacters.map(char => char.name);
  
  console.log(`🔍 Checking for orphaned data. Current characters: ${currentCharacterNames.join(', ')}`);
  
  let totalWeeksCleaned = 0;
  let totalBossDataRemoved = 0;
  
  // Clean up weekly boss clear history
  if (cleanedUserData.weeklyBossClearHistory) {
    Object.keys(cleanedUserData.weeklyBossClearHistory).forEach(weekKey => {
      const weekData = cleanedUserData.weeklyBossClearHistory[weekKey];
      if (weekData?.bossClearStatus) {
        const originalKeys = Object.keys(weekData.bossClearStatus);
        
        // Filter out character keys that don't match current characters
        Object.keys(weekData.bossClearStatus).forEach(charKey => {
          // Extract character name from key (format: "CharacterName-Index")
          const characterName = charKey.split('-').slice(0, -1).join('-');
          if (!currentCharacterNames.includes(characterName)) {
            delete weekData.bossClearStatus[charKey];
            totalBossDataRemoved++;
            console.log(`🧹 Removed orphaned boss data for ${charKey} from week ${weekKey}`);
          }
        });
        
        // Update last modified if we cleaned anything
        if (Object.keys(weekData.bossClearStatus).length < originalKeys.length) {
          weekData.lastUpdated = new Date().toISOString();
          totalWeeksCleaned++;
        }
      }
    });
  }
  
  // Clean up pitched items for non-existent characters
  const originalPitchedCount = cleanedPitchedItems.length;
  const filteredPitchedItems = cleanedPitchedItems.filter(item => 
    currentCharacterNames.includes(item.character)
  );
  
  const removedPitchedCount = originalPitchedCount - filteredPitchedItems.length;
  
  if (totalWeeksCleaned > 0 || removedPitchedCount > 0) {
    cleanedUserData.lastUpdated = new Date().toISOString();
    console.log(`✅ Orphaned data cleanup completed:`);
    console.log(`   - ${totalBossDataRemoved} boss clear records from ${totalWeeksCleaned} weeks`);
    console.log(`   - ${removedPitchedCount} pitched items`);
  } else {
    console.log(`✅ No orphaned data found`);
  }
  
  // Remove redundant pitchedItemTrackingData field if it exists
  if (cleanedUserData.pitchedItemTrackingData) {
    delete cleanedUserData.pitchedItemTrackingData;
    cleanedUserData.lastUpdated = new Date().toISOString();
    console.log(`🧹 Removed redundant pitchedItemTrackingData field`);
  }
  
  return {
    userData: cleanedUserData,
    pitchedItems: filteredPitchedItems,
    cleanupStats: {
      weeksWithBossClearData: totalWeeksCleaned,
      bossDataRecordsRemoved: totalBossDataRemoved,
      pitchedItemsRemoved: removedPitchedCount
    }
  };
}

/**
 * Manual cleanup utility - can be called from browser console
 * Usage: window.cleanupUserData('YOUR_USER_CODE')
 * @param {string} userCode - User code to clean up
 */
export async function manualDataCleanup(userCode) {
  if (!userCode) {
    console.error('❌ User code is required');
    return;
  }
  
  try {
    console.log(`🔧 Starting manual cleanup for user: ${userCode}`);
    
    // Import supabase dynamically
    const { supabase } = await import('../supabaseClient');
    
    // Get current user data
    const { data, error } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();
      
    if (error) {
      console.error('❌ Failed to fetch user data:', error);
      return;
    }
    
    const userData = data.data;
    const pitchedItems = data.pitched_items || [];
    
    console.log('📊 Current data state:');
    console.log(`   - Characters: ${(userData?.characters || []).length}`);
    console.log(`   - Weeks with boss data: ${userData?.weeklyBossClearHistory ? Object.keys(userData.weeklyBossClearHistory).length : 0}`);
    console.log(`   - Pitched items: ${pitchedItems.length}`);
    console.log(`   - Has redundant field: ${!!userData?.pitchedItemTrackingData}`);
    
    // Run cleanup
    const cleanupResult = cleanupOrphanedCharacterData(userData, pitchedItems);
    
    // Save cleaned data
    await supabase.from('user_data').upsert([{
      id: userCode,
      data: cleanupResult.userData,
      pitched_items: cleanupResult.pitchedItems
    }]);
    
    console.log('✅ Manual cleanup completed successfully!');
    console.log('📊 Cleanup statistics:', cleanupResult.cleanupStats);
    
    return cleanupResult;
    
  } catch (error) {
    console.error('❌ Manual cleanup failed:', error);
    throw error;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.cleanupUserData = manualDataCleanup;
}

/**
 * Clean up redundant localStorage keys that are now handled by cloud storage
 * This removes keys that were used before cloud sync was implemented
 */
export function cleanupRedundantLocalStorage() {
  const redundantKeys = [
    'ms-weekly-pitched-week-key',  // -> Cloud currentWeekKey
    'ms-weekly-week-key',          // -> Cloud currentWeekKey  
    'ms-weekly-clears',            // -> Cloud weeklyBossClearHistory
    'ms-weekly-pitched',           // -> Cloud pitched_items
    'ms-progress',                 // -> Cloud weeklyProgressHistory
    'ms-stats-panel',              // -> Calculated from cloud data
    'ms-stats-tracking-started',   // -> Unnecessary flag
    'ms-show-table',               // -> Use ACTIVE_PAGE instead
    'ms-show-weekly',              // -> Use ACTIVE_PAGE instead
  ];
  
  let removedCount = 0;
  redundantKeys.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removedCount++;
      console.log(`🧹 Removed redundant localStorage key: ${key}`);
    }
  });
  
  if (removedCount > 0) {
    console.log(`✅ Cleaned up ${removedCount} redundant localStorage keys`);
  } else {
    console.log(`✅ No redundant localStorage keys found`);
  }
  
  return { removedCount, redundantKeys };
}

// Auto-cleanup on import (run once when app starts)
if (typeof window !== 'undefined') {
  // Add a small delay to ensure app is loaded
  setTimeout(() => {
    cleanupRedundantLocalStorage();
  }, 1000);
} 