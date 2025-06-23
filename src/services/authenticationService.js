/**
 * Authentication Service
 * 
 * Consolidated authentication logic targeting the new database schema.
 * Handles create, login, and delete account operations for user_data table.
 */

import { logger } from '../utils/logger.js';

// Helper: get supabase client dynamically for code splitting
async function getSupabase() {
  const { supabase } = await import('../supabaseClient');
  return supabase;
}

/**
 * Create a new user account
 * @returns {Promise<{success: boolean, code?: string, error?: string}>}
 */
export async function createAccount() {
  try {
    // Generate unique user ID (8-character uppercase alphanumeric)
    const userCode = Math.random().toString(36).slice(2, 10).toUpperCase();
    
    const supabase = await getSupabase();
    
    // Get current maple week start date for initial user_boss_data row
    const { getCurrentMapleWeekStartDate } = await import('../utils/mapleWeekUtils.js');
    const currentWeekStart = getCurrentMapleWeekStartDate();
    
    // Insert new record into user_data with minimal data structure
    const { error: userDataError } = await supabase
      .from('user_data')
      .insert([{
        id: userCode,
        data: null, // Truly minimal - no legacy structure
        pitched_items: [] // Initialize empty pitched items array
      }]);
    
    if (userDataError) {
      logger.error('Error creating user_data:', userDataError);
      return {
        success: false,
        error: 'Failed to create account. Please try again.'
      };
    }
    
    // Create initial empty user_boss_data row for the current week
    // This ensures the row exists immediately when user logs in
    const { error: bossDataError } = await supabase
      .from('user_boss_data')
      .insert([{
        user_id: userCode,
        maple_week_start: currentWeekStart,
        char_map: {},
        boss_config: {},
         weekly_clears: {}
      }]);
    
    if (bossDataError) {
      logger.error('Error creating initial user_boss_data:', bossDataError);
      // This is not critical - the row will be created when first character is added
      // So we don't fail the account creation, just log the error
      logger.info('⚠️ Account created but initial weekly data setup failed. Will be created on first character addition.');
    } else {
      logger.info('✅ Created initial user_boss_data row for week:', currentWeekStart);
    }
    
    logger.info('✅ Created new account:', userCode);
    return { success: true, code: userCode };
    
  } catch (error) {
    logger.error('Unexpected error during account creation:', error);
    return {
      success: false,
      error: 'Failed to create account. Please try again.'
    };
  }
}

/**
 * Login user by validating user ID exists in database
 * @param {string} userId - User's login code
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function loginUser(userId) {
  if (!userId || !userId.trim()) {
    return { success: false, error: 'User code cannot be empty.' };
  }
  
  try {
    const supabase = await getSupabase();
    
    // Query user_data for matching id to validate login
    const { data, error } = await supabase
      .from('user_data')
      .select('id')
      .eq('id', userId.trim())
      .single();
    
    if (error || !data) {
      return { success: false, error: 'Invalid code.' };
    }
    
    logger.info('✅ Login successful for user:', userId);
    return { success: true };
    
  } catch (error) {
    logger.error('Unexpected error during login:', error);
    return { 
      success: false, 
      error: 'Failed to login. Please try again.' 
    };
  }
}

/**
 * Delete user account and all associated data
 * Performs cascading delete:
 * 1. Delete all records from user_boss_data where user_id matches
 * 2. Delete the record from user_data (includes pitched_items)
 * 
 * @param {string} userId - User's ID to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteUserAccount(userId) {
  if (!userId || !userId.trim()) {
    return { success: false, error: 'Invalid user ID.' };
  }
  
  try {
    const supabase = await getSupabase();
    
    logger.info('🗑️ Starting account deletion for user:', userId);
    
    // Perform cascading delete with detailed logging
    
    // 1. Delete all user_boss_data records for this user
    logger.info('🗑️ Deleting user_boss_data records...');
    const { data: deletedBossData, error: bossDataDeleteError } = await supabase
      .from('user_boss_data')
      .delete()
      .eq('user_id', userId.trim())
      .select(); // Select to see what was deleted
    
    if (bossDataDeleteError) {
      logger.error('❌ Error deleting user_boss_data:', bossDataDeleteError);
      // Don't stop - continue with user_data deletion
    } else {
      logger.info(`✅ Deleted ${deletedBossData?.length || 0} user_boss_data records`);
    }
    
    // 2. Delete the main user_data record (this also removes pitched_items)
    logger.info('🗑️ Deleting user_data record...');
    const { data: deletedUserData, error: userDataDeleteError } = await supabase
      .from('user_data')
      .delete()
      .eq('id', userId.trim())
      .select(); // Select to see what was deleted
    
    if (userDataDeleteError) {
      logger.error('❌ Error deleting user_data:', userDataDeleteError);
      return {
        success: false,
        error: 'Failed to delete account. Please try again.'
      };
    }
    
    if (!deletedUserData || deletedUserData.length === 0) {
      logger.info('⚠️ No user_data record found for deletion. User may not exist.');
      return {
        success: false,
        error: 'Account not found or already deleted.'
      };
    }
    
    logger.info('✅ Account deleted successfully for user:', userId);
    logger.info(`✅ Deleted user_data records: ${deletedUserData.length}`);
    
    return { success: true };
    
  } catch (error) {
    logger.error('❌ Unexpected error during account deletion:', error);
    return {
      success: false,
      error: 'Failed to delete account. Please try again.'
    };
  }
}
