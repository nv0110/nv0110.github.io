import { supabase } from '../supabaseClient.js';
import { convertDateToWeekKey } from '../utils/weekUtils.js';

/**
 * Pitched Items Service
 * Handles all CRUD operations for pitched items in user_data.pitched_items
 * Format: [{ "charId": "CharacterName", "item": "ItemName", "date": "2025-05-23" }]
 */

/**
 * Add a new pitched item to the user's collection
 * @param {string} userId - User ID
 * @param {Object} pitchedItemData - Pitched item data
 * @param {string} pitchedItemData.charId - Character name/ID
 * @param {string} pitchedItemData.bossName - Boss name
 * @param {string} pitchedItemData.item - Item name
 * @param {string} pitchedItemData.date - Date string (YYYY-MM-DD format, optional - defaults to current date)
 * @returns {Object} - {success: boolean, pitchedItem?: object, error?: string}
 */
export async function addPitchedItem(userId, pitchedItemData) {
  try {
    if (!userId || !pitchedItemData) {
      return { success: false, error: 'Missing required parameters: userId and pitchedItemData' };
    }

    const { charId, bossName, item } = pitchedItemData;
    if (!charId || !bossName || !item) {
      return { success: false, error: 'Missing required fields: charId, bossName, item' };
    }

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user data for pitched items:', fetchError);
      return { success: false, error: 'Failed to fetch user data' };
    }

    if (!userData) {
      return { success: false, error: 'User not found' };
    }

    // Prepare pitched item entry (includes boss name for uniqueness)
    const pitchedItem = {
      charId: charId.trim(),
      bossName: bossName.trim(),
      item: item.trim(),
      date: pitchedItemData.date || new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    };

    // Add to existing pitched items array
    const currentPitchedItems = userData.pitched_items || [];
    const updatedPitchedItems = [...currentPitchedItems, pitchedItem];

    // Update database
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ pitched_items: updatedPitchedItems })
      .eq('id', userId);

    if (updateError) {
      console.error('Error adding pitched item:', updateError);
      return { success: false, error: 'Failed to add pitched item' };
    }

    return { success: true, pitchedItem };

  } catch (error) {
    console.error('Error in addPitchedItem:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a pitched item from the user's collection
 * @param {string} userId - User ID
 * @param {string} charId - Character ID
 * @param {string} bossName - Boss name
 * @param {string} item - Item name
 * @param {string} date - Date string (optional, removes latest if not specified)
 * @returns {Object} - {success: boolean, error?: string}
 */
export async function removePitchedItem(userId, charId, bossName, item, date = null) {
  try {
    if (!userId || !charId || !bossName || !item) {
      return { success: false, error: 'Missing required parameters: userId, charId, bossName, and item' };
    }

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user data for pitched item removal:', fetchError);
      return { success: false, error: 'Failed to fetch user data' };
    }

    if (!userData) {
      return { success: false, error: 'User not found' };
    }

    // Find and remove item from pitched items array
    const currentPitchedItems = userData.pitched_items || [];
    let updatedPitchedItems;
    
    if (date) {
      // Remove specific item with exact date match
      updatedPitchedItems = currentPitchedItems.filter(
        pitchedItem => !(pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item && pitchedItem.date === date)
      );
    } else {
      // Remove the latest occurrence of this item for this character and boss
      const targetIndex = currentPitchedItems.findLastIndex(
        pitchedItem => pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item
      );
      
      if (targetIndex === -1) {
        return { success: false, error: 'Pitched item not found' };
      }
      
      updatedPitchedItems = currentPitchedItems.filter((_, index) => index !== targetIndex);
    }

    if (updatedPitchedItems.length === currentPitchedItems.length) {
      return { success: false, error: 'Pitched item not found' };
    }

    // Update database
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ pitched_items: updatedPitchedItems })
      .eq('id', userId);

    if (updateError) {
      console.error('Error removing pitched item:', updateError);
      return { success: false, error: 'Failed to remove pitched item' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error in removePitchedItem:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove multiple pitched items from the user's collection
 * @param {string} userId - User ID
 * @param {Array} itemsToRemove - Array of {charId, item, date} objects to remove
 * @returns {Object} - {success: boolean, removedCount?: number, error?: string}
 */
export async function removeManyPitchedItems(userId, itemsToRemove) {
  try {
    if (!userId || !Array.isArray(itemsToRemove) || itemsToRemove.length === 0) {
      return { success: false, error: 'Missing required parameters or empty items array' };
    }

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user data for bulk removal:', fetchError);
      return { success: false, error: 'Failed to fetch user data' };
    }

    if (!userData) {
      return { success: false, error: 'User not found' };
    }

    // Remove items from pitched items array
    const currentPitchedItems = userData.pitched_items || [];
    let updatedPitchedItems = [...currentPitchedItems];
    
    // Remove each specified item
    itemsToRemove.forEach(({ charId, item, date }) => {
      if (date) {
        // Remove specific item with exact match
        updatedPitchedItems = updatedPitchedItems.filter(
          pitchedItem => !(pitchedItem.charId === charId && pitchedItem.item === item && pitchedItem.date === date)
        );
      } else {
        // Remove latest occurrence
        const targetIndex = updatedPitchedItems.findLastIndex(
          pitchedItem => pitchedItem.charId === charId && pitchedItem.item === item
        );
        if (targetIndex !== -1) {
          updatedPitchedItems.splice(targetIndex, 1);
        }
      }
    });

    const removedCount = currentPitchedItems.length - updatedPitchedItems.length;

    if (removedCount === 0) {
      return { success: false, error: 'No matching pitched items found' };
    }

    // Update database
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ pitched_items: updatedPitchedItems })
      .eq('id', userId);

    if (updateError) {
      console.error('Error removing multiple pitched items:', updateError);
      return { success: false, error: 'Failed to remove pitched items' };
    }

    return { success: true, removedCount };

  } catch (error) {
    console.error('Error in removeManyPitchedItems:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all pitched items for a user
 * @param {string} userId - User ID
 * @param {string} weekKey - Optional week filter (will derive from date)
 * @param {string} charId - Optional character filter
 * @param {number} year - Optional year filter
 * @returns {Object} - {success: boolean, items?: array, error?: string}
 */
export async function getPitchedItems(userId, options = {}) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing required parameter: userId' };
    }

    const { weekKey, charId, year } = options;

    // Get user pitched items
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching pitched items:', fetchError);
      return { success: false, error: 'Failed to fetch pitched items' };
    }

    if (!userData) {
      return { success: false, error: 'User not found' };
    }

    let pitchedItems = userData.pitched_items || [];

    // Apply filters
    if (weekKey) {
      pitchedItems = pitchedItems.filter(item => {
        const itemWeekKey = convertDateToWeekKey(item.date);
        return itemWeekKey === weekKey;
      });
    }

    if (charId) {
      pitchedItems = pitchedItems.filter(item => item.charId === charId);
    }

    if (year) {
      pitchedItems = pitchedItems.filter(item => {
        const itemYear = new Date(item.date).getFullYear();
        return itemYear === year;
      });
    }

    return { success: true, items: pitchedItems };

  } catch (error) {
    console.error('Error in getPitchedItems:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get pitched items for current week
 * @param {string} userId - User ID
 * @returns {Object} - {success: boolean, items?: array, error?: string}
 */
export async function getCurrentWeekPitchedItems(userId) {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentWeekKey = convertDateToWeekKey(currentDate);
  return await getPitchedItems(userId, { weekKey: currentWeekKey });
}

/**
 * Clear all pitched items for a specific week
 * @param {string} userId - User ID
 * @param {string} weekKey - Week key to clear
 * @returns {Object} - {success: boolean, removedCount?: number, error?: string}
 */
export async function clearPitchedItemsForWeek(userId, weekKey) {
  try {
    if (!userId || !weekKey) {
      return { success: false, error: 'Missing required parameters: userId and weekKey' };
    }

    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user data for week clear:', fetchError);
      return { success: false, error: 'Failed to fetch user data' };
    }

    if (!userData) {
      return { success: false, error: 'User not found' };
    }

    // Remove items for the specified week (derive week from date)
    const currentPitchedItems = userData.pitched_items || [];
    const updatedPitchedItems = currentPitchedItems.filter(item => {
      const itemWeekKey = convertDateToWeekKey(item.date);
      return itemWeekKey !== weekKey;
    });
    const removedCount = currentPitchedItems.length - updatedPitchedItems.length;

    if (removedCount === 0) {
      return { success: true, removedCount: 0 }; // No items to remove
    }

    // Update database
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ pitched_items: updatedPitchedItems })
      .eq('id', userId);

    if (updateError) {
      console.error('Error clearing week pitched items:', updateError);
      return { success: false, error: 'Failed to clear week pitched items' };
    }

    return { success: true, removedCount };

  } catch (error) {
    console.error('Error in clearPitchedItemsForWeek:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get yearly statistics for pitched items
 * @param {string} userId - User ID
 * @param {number|string} year - Year to analyze (optional, defaults to current year)
 * @returns {Object} - {success: boolean, stats?: object, error?: string}
 */
export async function getYearlyPitchedStats(userId, year = null) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing required parameter: userId' };
    }

    // Convert year to number to ensure type consistency
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    // Get all pitched items for the specific year
    const result = await getPitchedItems(userId, { year: targetYear });
    if (!result.success) {
      return result;
    }

    const pitchedItems = result.items;

    // Process data to get yearly stats
    const yearlyStats = {
      total: pitchedItems.length,
      characters: new Set(),
      items: []
    };

    pitchedItems.forEach(item => {
      yearlyStats.characters.add(item.charId);
      yearlyStats.items.push({
        charId: item.charId,
        item: item.item,
        date: item.date
      });
    });

    // Convert Sets to Arrays for easier handling in the frontend
    const stats = {
      year: targetYear,
      total: yearlyStats.total,
      characters: Array.from(yearlyStats.characters),
      items: yearlyStats.items
    };

    return { success: true, stats };

  } catch (error) {
    console.error('Error in getYearlyPitchedStats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Purge all pitched items for a user (admin/reset function)
 * @param {string} userId - User ID
 * @returns {Object} - {success: boolean, removedCount?: number, error?: string}
 */
export async function purgeAllPitchedItems(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing required parameter: userId' };
    }

    // Get current count for reporting
    const result = await getPitchedItems(userId, {});
    if (!result.success) {
      return result;
    }

    const removedCount = result.items.length;

    if (removedCount === 0) {
      return { success: true, removedCount: 0 };
    }

    // Clear all pitched items
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ pitched_items: [] })
      .eq('id', userId);

    if (updateError) {
      console.error('Error purging all pitched items:', updateError);
      return { success: false, error: 'Failed to purge pitched items' };
    }

    return { success: true, removedCount };

  } catch (error) {
    console.error('Error in purgeAllPitchedItems:', error);
    return { success: false, error: error.message };
  }
}
