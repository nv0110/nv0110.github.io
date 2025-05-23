import { supabase } from './supabaseClient';

// Helper: get current week key (YYYY-WW)
export function getCurrentWeekKey() {
  const now = new Date();
  const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const onejan = new Date(utcNow.getUTCFullYear(), 0, 1);
  const week = Math.ceil((((utcNow - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${utcNow.getUTCFullYear()}-${week}`;
}

// Helper: get current month key (YYYY-MM)
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Function to verify saved data
async function verifySavedData(userCode) {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userCode)
      .single();
      
    if (error) throw error;
    
    console.log('Verifying saved data:', data);
    return data;
  } catch (error) {
    console.error('Error verifying saved data:', error);
    return null;
  }
}

// Function to save a pitched item to the cloud database
export async function savePitchedItem(userCode, data, remove = false) {
  try {
    console.log('savePitchedItem called with:', { userCode, data, remove });
    const { character, bossName, itemName, itemImage, date } = data;
    
    if (!userCode || !character || !bossName || !itemName || !itemImage) {
      console.error('Missing required fields:', { userCode, character, bossName, itemName, itemImage });
      return { success: false, error: 'Missing required fields' };
    }

    // Fetch both pitched_items and data for comprehensive synchronization
    console.log('Fetching user data for userCode:', userCode);
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items, data')
      .eq('id', userCode)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      throw fetchError;
    }

    const currentPitched = userData.pitched_items || [];
    console.log('Current pitched_items:', currentPitched);

    // Get the current week key
    const currentWeekKey = getCurrentWeekKey();
    const currentMonthKey = getCurrentMonthKey();
    
    // Create the pitched item record
    const pitchedItem = {
      character,
      boss: bossName,
      item: itemName,
      image: itemImage,
      date: date || new Date().toISOString(),
      year: new Date(date || Date.now()).getUTCFullYear(),
      weekKey: currentWeekKey,
      monthKey: currentMonthKey,
      uniqueId: `${character}_${bossName}_${itemName}_${currentWeekKey}_${Date.now()}`
    };

    let updatedPitched;
    if (remove) {
      // Remove the item
      updatedPitched = currentPitched.filter(item =>
        !(
          item.character === character &&
          item.boss === bossName &&
          item.item === itemName &&
          item.weekKey === pitchedItem.weekKey
        )
      );
      console.log('Updated pitched_items after removal:', updatedPitched);
    } else {
      // Check for duplicate (same character, boss, item, weekKey)
      const exists = currentPitched.some(item =>
        item.character === character &&
        item.boss === bossName &&
        item.item === itemName &&
        item.weekKey === pitchedItem.weekKey
      );
      if (exists) {
        console.log('Pitched item already exists for this week. Not adding duplicate.');
        return { success: true, data: pitchedItem };
      }
      // Add the new pitched item
      updatedPitched = [...currentPitched, pitchedItem];
      console.log('Updated pitched_items to save:', updatedPitched);
    }

    // Update the application data structure to track pitched items
    let updatedData = { ...userData.data };
    
    // Initialize or update pitched_item_tracking
    if (!updatedData.pitched_item_tracking) {
      updatedData.pitched_item_tracking = {
        lastUpdated: new Date().toISOString(),
        itemCount: updatedPitched.length,
        weekKeys: [currentWeekKey]
      };
    } else {
      updatedData.pitched_item_tracking = {
        ...updatedData.pitched_item_tracking,
        lastUpdated: new Date().toISOString(),
        itemCount: updatedPitched.length,
        weekKeys: [...new Set([...updatedData.pitched_item_tracking.weekKeys || [], currentWeekKey])]
      };
    }
    
    // Ensure the current weekKey is correct
    updatedData.weekKey = currentWeekKey;
    
    // Important: Ensure the checked state is preserved for the character that got the pitched item
    // This prevents weekly tracker resets from affecting pitched item eligibility
    if (!remove && updatedData.checked) {
      // If we're adding a pitched item, make sure the character's checked state is preserved
      if (!updatedData.checked[character]) {
        updatedData.checked[character] = {};
      }
      
      // Mark the boss as checked for this character - this ensures continuity between
      // weekly tracker state and pitched items
      updatedData.checked[character][bossName] = true;
      
      console.log(`Ensuring boss ${bossName} is marked as checked for character ${character}`);
    }

    // Update both pitched_items column and data column for complete synchronization
    const { data: updateResult, error: updateError } = await supabase
      .from('user_data')
      .update({ 
        pitched_items: updatedPitched,
        data: updatedData
      })
      .eq('id', userCode)
      .select();

    if (updateError) {
      console.error('Error updating user data:', updateError);
      throw updateError;
    }

    console.log('Update result:', updateResult);

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_data')
      .select('pitched_items, data')
      .eq('id', userCode)
      .single();

    if (verifyError) {
      console.error('Error verifying data update:', verifyError);
      throw verifyError;
    }

    if (!verifyData.pitched_items || !Array.isArray(verifyData.pitched_items)) {
      console.error('pitched_items array is missing from saved data');
      throw new Error('Failed to save pitched_items array');
    }

    console.log('Successfully updated pitched_items and synchronized with application data');
    return { 
      success: true, 
      data: pitchedItem,
      updatedWeekKey: currentWeekKey,
      checked: updatedData.checked
    };
  } catch (error) {
    console.error('Error saving pitched item:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// Function to get all pitched items for a user
export async function getPitchedItems(userCode) {
  try {
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

// Function to get yearly stats for pitched items
export async function getYearlyPitchedStats(userCode, year = null) {
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userCode)
      .single();
      
    if (error) throw error;
    
    const pitchedItems = data?.data?.pitchedItems || [];
    
    // Process data to get yearly stats
    const yearlyStats = {};
    
    pitchedItems.forEach(item => {
      const itemYear = item.year;
      
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

// Function to delete pitched items for a user (used when deleting account)
export async function deletePitchedItems(userCode) {
  try {
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userCode)
      .single();

    if (fetchError) throw fetchError;

    const currentData = userData.data || {};
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ 
        data: { 
          ...currentData,
          pitchedItems: [],
          lastUpdated: new Date().toISOString()
        }
      })
      .eq('id', userCode);
      
    if (updateError) throw updateError;
    return { success: true };
  } catch (error) {
    console.error('Error deleting pitched items:', error);
    return { success: false, error };
  }
}

export async function removeManyPitchedItems(userCode, itemsToRemove) {
  try {
    const { data: userData, error: fetchError } = await supabase
      .from('user_data')
      .select('pitched_items')
      .eq('id', userCode)
      .single();

    if (fetchError) throw fetchError;

    const currentPitched = userData.pitched_items || [];
    const updatedPitched = currentPitched.filter(item =>
      !itemsToRemove.some(rem =>
        item.character === rem.character &&
        item.boss === rem.bossName &&
        item.item === rem.itemName &&
        item.weekKey === rem.weekKey
      )
    );

    const { error: updateError } = await supabase
      .from('user_data')
      .update({ pitched_items: updatedPitched })
      .eq('id', userCode);

    if (updateError) throw updateError;
    console.log(`[Batch Removal] Successfully removed ${itemsToRemove.length} pitched items for user '${userCode}'. Remaining items: ${updatedPitched.length}`);
    console.log('[Batch Removal] Items removed:', itemsToRemove);
    return { success: true };
  } catch (error) {
    console.error('Error removing many pitched items:', error);
    return { success: false, error };
  }
}

// Export user data (both data and pitched_items columns)
export async function exportUserData(userCode) {
  try {
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', userCode)
      .single();
    if (error) throw error;
    
    // Make sure weekKey and checked state are included in the export
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

// Utility function to synchronize pitched items with checked state
export function syncPitchedItemsToCheckedState(pitchedItems, checkedState = {}, weekKey = getCurrentWeekKey()) {
  if (!pitchedItems || !Array.isArray(pitchedItems) || pitchedItems.length === 0) {
    return checkedState;
  }
  
  // Create a fresh copy of the checked state to avoid mutation
  const updatedCheckedState = { ...checkedState };
  
  // Filter pitched items to current week if needed
  const relevantItems = pitchedItems.filter(item => item.weekKey === weekKey);
  
  console.log(`Syncing ${relevantItems.length} pitched items from week ${weekKey} to checked state`);
  
  relevantItems.forEach(item => {
    const { character, boss } = item;
    
    // Handle character ID format that includes the index (e.g., "Envy-0")
    // We'll try both the raw character name and potential indexed versions
    const possibleCharKeys = [character];
    for (let i = 0; i < 10; i++) { // Try with indices 0-9
      possibleCharKeys.push(`${character}-${i}`);
    }
    
    // Find the character key that exists in checked state, or use the raw name
    const charKey = possibleCharKeys.find(key => checkedState[key]) || character;
    
    // Initialize character object if it doesn't exist
    if (!updatedCheckedState[charKey]) {
      updatedCheckedState[charKey] = {};
    }
    
    // Generate boss keys for all difficulties (we don't know which one the user has selected)
    const bossKeys = generateBossKeysForAllDifficulties(boss);
    
    // Set at least one difficulty to checked
    let setAnyDifficulty = false;
    
    // First try to find existing boss entries and mark them checked
    for (const key of Object.keys(updatedCheckedState[charKey] || {})) {
      if (key.startsWith(`${boss}-`)) {
        updatedCheckedState[charKey][key] = true;
        console.log(`Marked existing boss key ${key} as checked for character ${charKey}`);
        setAnyDifficulty = true;
      }
    }
    
    // If no existing entry was found, use the highest difficulty
    if (!setAnyDifficulty && bossKeys.length > 0) {
      // Sort by probable difficulty - typically hardest is more valuable
      const sortedKeys = bossKeys.sort((a, b) => {
        const difficultyOrder = {
          'Extreme': 5, 'Hard': 4, 'Chaos': 3, 'Normal': 2, 'Easy': 1
        };
        // Extract difficulty from "BossName-Difficulty" format
        const diffA = a.split('-')[1];
        const diffB = b.split('-')[1];
        return (difficultyOrder[diffB] || 0) - (difficultyOrder[diffA] || 0);
      });
      
      // Use the highest difficulty (first after sorting)
      const highestDifficultyKey = sortedKeys[0];
      updatedCheckedState[charKey][highestDifficultyKey] = true;
      console.log(`No existing boss entry found, marking ${highestDifficultyKey} as checked for ${charKey}`);
    }
  });
  
  return updatedCheckedState;
}

// Helper function to generate boss keys for all possible difficulties
function generateBossKeysForAllDifficulties(bossName) {
  const standardDifficulties = ['Easy', 'Normal', 'Hard', 'Chaos', 'Extreme'];
  
  // Special case handling for specific bosses
  const bossSpecificDifficulties = {
    'Lotus': ['Easy', 'Normal', 'Hard', 'Extreme'],
    'Damien': ['Normal', 'Hard'],
    'Will': ['Easy', 'Normal', 'Hard'],
    'Lucid': ['Easy', 'Normal', 'Hard'],
    'Chosen Seren': ['Normal', 'Hard', 'Extreme'],
    'Watcher Kalos': ['Easy', 'Normal', 'Chaos', 'Extreme'],
    'Kaling': ['Easy', 'Normal', 'Hard', 'Extreme'],
    'Limbo': ['Normal', 'Hard']
  };
  
  const difficulties = bossSpecificDifficulties[bossName] || standardDifficulties;
  return difficulties.map(diff => `${bossName}-${diff}`);
}

// Import user data (overwrites both data and pitched_items columns for the user)
export async function importUserData(userCode, importObj) {
  try {
    if (!importObj || typeof importObj !== 'object') throw new Error('Invalid import object');
    const { data, pitched_items, weekKey: importedWeekKey } = importObj;
    
    // Fetch current user data to compare week keys
    const { data: currentData, error: fetchError } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userCode)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    
    const currentWeekKey = getCurrentWeekKey();
    const existingWeekKey = currentData?.data?.weekKey;
    
    // Handle week key transitions
    let updatedData = { ...data };
    
    // If we're in a new week compared to the backup, update the weekKey but preserve boss clear state
    if (importedWeekKey && importedWeekKey !== currentWeekKey) {
      console.log(`[Import] Week key transition: ${importedWeekKey} -> ${currentWeekKey}`);
      updatedData.weekKey = currentWeekKey;
      
      // If it's a new week, we might want to preserve the checked state rather than reset it
      // This ensures pitched items eligibility is maintained across backups
      if (updatedData.checked && Object.keys(updatedData.checked).length > 0) {
        console.log('[Import] Preserving checked state across week transition');
      }
    }
    
    // Synchronize pitched items with checked state
    if (pitched_items && pitched_items.length > 0) {
      console.log('[Import] Synchronizing pitched items with checked state');
      updatedData.checked = syncPitchedItemsToCheckedState(
        pitched_items, 
        updatedData.checked || {}, 
        currentWeekKey
      );
    }
    
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
