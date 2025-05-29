/**
 * Authentication Service
 * 
 * Consolidated authentication logic targeting the new database schema.
 * Handles create, login, and delete account operations for user_data table.
 */

// Helper: get supabase client dynamically for code splitting
async function getSupabase() {
  const { supabase } = await import('../src/supabaseClient');
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
    
    // Insert new record into user_data with minimal data structure
    const { error } = await supabase
      .from('user_data')
      .insert([{
        id: userCode,
        data: null, // Truly minimal - no legacy structure
        pitched_items: [] // Initialize empty pitched items array
      }]);
    
    if (error) {
      console.error('Error creating account:', error);
      return { 
        success: false, 
        error: 'Failed to create account. Please try again.' 
      };
    }
    
    console.log('✅ Created new account:', userCode);
    return { success: true, code: userCode };
    
  } catch (error) {
    console.error('Unexpected error during account creation:', error);
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
    
    console.log('✅ Login successful for user:', userId);
    return { success: true };
    
  } catch (error) {
    console.error('Unexpected error during login:', error);
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
    
    // Perform cascading delete using Supabase transaction-like approach
    // Note: Supabase doesn't have explicit transactions, but we can batch operations
    
    // 1. Delete all user_boss_data records for this user
    const { error: bossDataDeleteError } = await supabase
      .from('user_boss_data')
      .delete()
      .eq('user_id', userId.trim());
    
    if (bossDataDeleteError) {
      console.error('Error deleting user_boss_data:', bossDataDeleteError);
      // Continue with user_data deletion even if user_boss_data deletion fails
      // as the user_data deletion is more critical
    }
    
    // 2. Delete the main user_data record (this also removes pitched_items)
    const { error: userDataDeleteError } = await supabase
      .from('user_data')
      .delete()
      .eq('id', userId.trim());
    
    if (userDataDeleteError) {
      console.error('Error deleting user_data:', userDataDeleteError);
      return { 
        success: false, 
        error: 'Failed to delete account. Please try again.' 
      };
    }
    
    console.log('✅ Account deleted successfully for user:', userId);
    return { success: true };
    
  } catch (error) {
    console.error('Unexpected error during account deletion:', error);
    return { 
      success: false, 
      error: 'Failed to delete account. Please try again.' 
    };
  }
}