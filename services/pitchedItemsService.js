import { supabase } from '../src/supabaseClient.js';
import { getCurrentMapleWeekStartDate } from '../utils/mapleWeekUtils.js';

/**
 * Pitched Items Service
 * Handles all CRUD operations for pitched items in user_data.pitched_items
 */

/**
 * Add a new pitched item to the user's collection
 * @param {string} userId - User ID
 * @param {Object} pitchedItemData - Pitched item data
 * @param {string} pitchedItemData.character - Character name
 * @param {string} pitchedItemData.boss - Boss name
 * @param {string} pitchedItemData.item - Item code/name
 * @param {string} pitchedItemData.weekKey - Week key (optional, defaults to current week)
 * @param {string} pitchedItemData.date - Date string (optional, defaults to current date)
 * @returns {Object} - {success: boolean, error?: string}
 */
export async function addPitchedItem(userId, pitchedItemData) {
  try {
    if (!userId || !pitchedItemData) {
      return { success: false, error: 'Missing required parameters: userId and pitchedItemData' };
    }

    const { character, boss, item } = pitchedItemData;
    if (!character || !boss || !item) {
      return { success: false, error: 'Missing required fields: character, boss, item' };
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

    // Prepare pitched item entry
    const currentWeekStart = getCurrentMapleWeekStartDate();
    const pitchedItem = {
      id: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      character: character.trim(),
      boss: boss.trim(),
      item: item.trim(),
      date: pitchedItemData.date || new Date().toISOString(),
      weekKey: pitchedItemData.weekKey || currentWeekStart,
      userId
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
 * @param {string} pitchedItemId - ID of the pitched item to remove
 * @returns {Object} - {success: boolean, error?: string}
 */
export async function removePitchedItem(userId, pitchedItemId) {
  try {
    if (!userId || !pitchedItemId) {
      return { success: false, error: 'Missing required parameters: userId and pitchedItemId' };
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

    // Remove item from pitched items array
    const currentPitchedItems = userData.pitched_items || [];
    const updatedPitchedItems = currentPitchedItems.filter(item => item.id !== pitchedItemId);

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
 * @param {string[]} pitchedItemIds - Array of pitched item IDs to remove
 * @returns {Object} - {success: boolean, removedCount?: number, error?: string}
 */
export async function removeManyPitchedItems(userId, pitchedItemIds) {
  try {
    if (!userId || !Array.isArray(pitchedItemIds) || pitchedItemIds.length === 0) {
      return { success: false, error: 'Missing required parameters or empty ID array' };
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
    const idsToRemove = new Set(pitchedItemIds);
    const updatedPitchedItems = currentPitchedItems.filter(item => !idsToRemove.has(item.id));
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
 * @param {string} weekKey - Optional week filter
 * @returns {Object} - {success: boolean, items?: array, error?: string}
 */
export async function getPitchedItems(userId, weekKey = null) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing required parameter: userId' };
    }

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

    // Filter by week if specified
    if (weekKey) {
      pitchedItems = pitchedItems.filter(item => item.weekKey === weekKey);
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
  const currentWeekStart = getCurrentMapleWeekStartDate();
  return await getPitchedItems(userId, currentWeekStart);
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

    // Remove items for the specified week
    const currentPitchedItems = userData.pitched_items || [];
    const updatedPitchedItems = currentPitchedItems.filter(item => item.weekKey !== weekKey);
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
 * @param {number} year - Year to analyze (optional, defaults to current year)
 * @returns {Object} - {success: boolean, stats?: object, error?: string}
 */
export async function getYearlyPitchedStats(userId, year = null) {
  try {
    if (!userId) {
      return { success: false, error: 'Missing required parameter: userId' };
    }

    const targetYear = year || new Date().getFullYear();

    // Get all pitched items
    const result = await getPitchedItems(userId);
    if (!result.success) {
      return result;
    }

    const pitchedItems = result.items;

    // Process data to get yearly stats
    const yearlyStats = {
      total: 0,
      characters: new Set(),
      bosses: new Set(),
      items: []
    };

    pitchedItems.forEach(item => {
      const itemYear = new Date(item.date).getFullYear();
      
      // Skip if filtering by year and this item is from a different year
      if (itemYear !== targetYear) return;
      
      yearlyStats.total += 1;
      yearlyStats.characters.add(item.character);
      yearlyStats.bosses.add(item.boss);
      yearlyStats.items.push({
        character: item.character,
        boss: item.boss,
        item: item.item,
        date: item.date,
        weekKey: item.weekKey
      });
    });

    // Convert Sets to Arrays for easier handling in the frontend
    const stats = {
      year: targetYear,
      total: yearlyStats.total,
      characters: Array.from(yearlyStats.characters),
      bosses: Array.from(yearlyStats.bosses),
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
    const result = await getPitchedItems(userId);
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