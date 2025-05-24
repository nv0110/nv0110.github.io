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

// Function to save boss run data (within the existing data structure)
export async function saveBossRun(userCode, data) {
  try {
    console.log('saveBossRun called with:', { userCode, data });
    const { character, characterIdx, bossName, bossDifficulty, isCleared, date } = data;
    
    if (!userCode || !character || !bossName || !bossDifficulty || isCleared === undefined) {
      console.error('Missing required fields:', { userCode, character, bossName, bossDifficulty, isCleared });
      return { success: false, error: 'Missing required fields' };
    }

    // 1. First, get the ENTIRE user record to ensure we don't lose any data
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
      console.log('Initializing missing boss_runs array in data object');
    } else if (!Array.isArray(currentData.boss_runs)) {
      // If it exists but isn't an array, make it an array
      console.log('boss_runs exists but is not an array, fixing this issue');
      currentData.boss_runs = [];
    }
    
    const currentBossRuns = currentData.boss_runs;
    const currentWeekKey = getCurrentWeekKey();
    
    // 5. Log the existing state for debugging
    console.log(`Current boss runs count: ${currentBossRuns.length}`);
    console.log('Current data structure:', JSON.stringify(currentData, null, 2));
    
    // 6. Construct the boss run object with a unique ID
    const bossRun = {
      id: `${character}-${bossName}-${bossDifficulty}-${currentWeekKey}-${Date.now()}`,
      character,
      characterIdx: characterIdx || 0,
      boss: bossName,
      difficulty: bossDifficulty,
      cleared: isCleared,
      date: date || new Date().toISOString(),
      weekKey: currentWeekKey,
    };
    
    // 7. Check for existing run entry for this character-boss-difficulty-week combination
    const existingRunIndex = currentBossRuns.findIndex(run => 
      run.character === character && 
      run.boss === bossName && 
      run.difficulty === bossDifficulty && 
      run.weekKey === currentWeekKey
    );
    
    let updatedBossRuns;
    
    if (existingRunIndex !== -1) {
      // Update existing entry
      updatedBossRuns = [...currentBossRuns];
      updatedBossRuns[existingRunIndex] = {
        ...updatedBossRuns[existingRunIndex],
        cleared: isCleared,
        date: date || new Date().toISOString(), // Update the timestamp
        lastUpdated: new Date().toISOString()
      };
      console.log(`Updating existing boss run at index ${existingRunIndex}`);
    } else {
      // Add new entry
      updatedBossRuns = [...currentBossRuns, bossRun];
      console.log(`Adding new boss run, total count will be ${updatedBossRuns.length}`);
    }
    
    // 8. Create the updated data object, ensuring we preserve all existing properties
    // IMPORTANT: We explicitly set boss_runs to make sure it's included
    const updatedData = {
      ...currentData,
      boss_runs: updatedBossRuns,
      lastUpdated: new Date().toISOString()
    };
    
    // Double-check the updated data structure
    console.log('About to save this data structure:', JSON.stringify({
      ...updatedData,
      boss_runs_count: updatedBossRuns.length // Just for logging
    }, null, 2).substring(0, 200) + '...');
    
    // 9. First try with a simpler approach - just add the boss_runs field directly
    // We'll avoid any complex structures and just make sure boss_runs is in the data
    const simplifiedData = {
      ...currentData,
      boss_runs: updatedBossRuns,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('SIMPLIFIED DATA STRUCTURE:', JSON.stringify(simplifiedData).substring(0, 200) + '...');
    
    console.log('🚨 ATTEMPTING DATABASE UPDATE WITH BOSS RUNS ARRAY');
    const { data: updateResult, error: updateError } = await supabase
      .from('user_data')
      .update({ 
        data: simplifiedData  // Use the simplified structure
      })
      .eq('id', userCode)
      .select();
    
    console.log('UPDATE RESULT:', JSON.stringify(updateResult));
      
    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }
    
    // 10. Verify the update actually worked by checking the returned data
    console.log(`Successfully saved boss run for ${character} - ${bossName} ${bossDifficulty}. Cleared: ${isCleared}`);
    
    // 11. IMPORTANT: Do a separate fetch to see what's ACTUALLY in the database
    console.log('🔍 VERIFYING DATABASE STATE WITH SEPARATE FETCH');
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', userCode)
      .single();
    
    if (verifyError) {
      console.error('Verification fetch error:', verifyError);
    } else {
      console.log('DATABASE ACTUAL STATE:', JSON.stringify(verifyData).substring(0, 200) + '...');
      
      // Check if boss_runs exists in the data
      if (verifyData?.data?.boss_runs) {
        console.log(`✅ VERIFICATION SUCCESS: Database has ${verifyData.data.boss_runs.length} boss runs`);
      } else {
        console.log('❌ VERIFICATION FAILED: No boss_runs array found in database');
        
        // Try another approach - use UPSERT instead of UPDATE
        console.log('⚠️ Attempting UPSERT as a fallback...');
        
        // Create a complete record with the boss_runs array
        const completeRecord = {
          id: userCode,
          data: {
            ...verifyData.data,
            boss_runs: updatedBossRuns,
            lastUpdated: new Date().toISOString()
          }
        };
        
        const { error: upsertError } = await supabase
          .from('user_data')
          .upsert(completeRecord);
          
        if (upsertError) {
          console.error('Upsert failed:', upsertError);
        } else {
          console.log('✅ Upsert succeeded, verifying again...');
          
          // Verify one more time
          const { data: finalVerify } = await supabase
            .from('user_data')
            .select('*')
            .eq('id', userCode)
            .single();
            
          if (finalVerify?.data?.boss_runs) {
            console.log(`✅✅ FINAL VERIFICATION: Database now has ${finalVerify.data.boss_runs.length} boss runs`);
          } else {
            console.log('❌❌ FINAL VERIFICATION FAILED: Still no boss_runs array');
          }
        }
      }
    }
    
    
    return { 
      success: true, 
      bossRuns: updatedBossRuns,
      updatedData: updatedData 
    };
  } catch (error) {
    console.error('Error saving boss run:', error);
    return { success: false, error };
  }
}

// Function to save a pitched item to the cloud database
export async function savePitchedItem(userCode, data, remove = false) {
  try {
    console.log('savePitchedItem called with:', { userCode, data, remove });
    const { character, bossName, itemName, itemImage, date, characterIdx } = data;
    
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
    const currentData = userData.data || {};
    // Track boss runs inside the data object
    const currentBossRuns = currentData.boss_runs || [];
    const currentWeekKey = getCurrentWeekKey();
    
    if (remove) {
      // Remove the pitched item (filter it out)
      console.log('Removing pitched item:', { character, bossName, itemName, weekKey: currentWeekKey });
      const updatedPitched = currentPitched.filter(item => {
        return !(item.character === character && 
               item.boss === bossName && 
               item.item === itemName && 
               item.weekKey === currentWeekKey);
      });
      
      const { error: updateError } = await supabase
        .from('user_data')
        .update({ pitched_items: updatedPitched })
        .eq('id', userCode);
      
      if (updateError) throw updateError;
      console.log(`Successfully removed pitched item for ${character} from ${bossName}. Remaining items: ${updatedPitched.length}`);
      
      return { success: true };
    } else {
      // Construct the pitched item object
      const pitchedItem = {
        character,
        characterIdx: characterIdx || 0,
        boss: bossName,
        item: itemName,
        image: itemImage,
        date: date || new Date().toISOString(),
        weekKey: currentWeekKey,
      };
      
      // Check for duplicates
      const existingItem = currentPitched.find(item => 
        item.character === character && 
        item.boss === bossName && 
        item.item === itemName && 
        item.weekKey === currentWeekKey
      );
      
      if (existingItem) {
        console.log('Item already exists in database, not adding duplicate');
        return { success: true, alreadyExists: true };
      }
      
      // Add the new pitched item
      const updatedPitched = [...currentPitched, pitchedItem];
      
      // Also make sure there's a boss run entry for this
      let updatedBossRuns = [...currentBossRuns];
      
      // Check for existing run entry for this character-boss-week combination
      const existingRunIndex = currentBossRuns.findIndex(run => 
        run.character === character && 
        run.boss === bossName && 
        run.weekKey === currentWeekKey
      );
      
      // If no existing run for this boss (which is unlikely since we're getting a pitched item),
      // create a boss run entry
      if (existingRunIndex === -1) {
        // Find the most likely difficulty for this boss
        const possibleBossKeys = generateBossKeysForAllDifficulties(bossName);
        const sortedKeys = possibleBossKeys.sort((a, b) => {
          const difficultyOrder = {
            'Extreme': 5, 'Hard': 4, 'Chaos': 3, 'Normal': 2, 'Easy': 1
          };
          // Extract difficulty from "BossName-Difficulty" format
          const diffA = a.split('-')[1];
          const diffB = b.split('-')[1];
          return (difficultyOrder[diffB] || 0) - (difficultyOrder[diffA] || 0);
        });
        
        // Use the highest difficulty
        const highestKey = sortedKeys[0];
        const bossDifficulty = highestKey.split('-')[1];
        
        // Add a new boss run entry
        updatedBossRuns.push({
          character,
          characterIdx: characterIdx || 0,
          boss: bossName,
          difficulty: bossDifficulty,
          cleared: true,
          date: date || new Date().toISOString(),
          weekKey: currentWeekKey,
          hasPitchedItem: true
        });
      } else {
        // Update existing boss run to indicate it has a pitched item
        updatedBossRuns[existingRunIndex] = {
          ...updatedBossRuns[existingRunIndex],
          hasPitchedItem: true,
          date: date || new Date().toISOString() // Update the timestamp
        };
      }
      
      // Update data object with boss runs tracking
      const updatedData = {
        ...currentData,
        boss_runs: updatedBossRuns,
        lastUpdated: new Date().toISOString()
      };
      
      // Update both pitched items and data in the database
      const { error: updateError } = await supabase
        .from('user_data')
        .update({ 
          pitched_items: updatedPitched,
          data: updatedData
        })
        .eq('id', userCode);
        
      if (updateError) throw updateError;
      console.log(`Successfully saved pitched item for ${character} from ${bossName}`);
      
      // Get the current checked state from userData
      let userDataObj = updatedData; // Use the already updated data object
      const checkedState = userDataObj.checked || {};
      
      // Make sure the boss is marked as checked too
      // This is needed to ensure pitched items and boss clears are in sync
      const charKey = `${character}-${characterIdx || 0}`;
      const possibleBossKeys = generateBossKeysForAllDifficulties(bossName);
      
      // Check if any of the difficulties is already checked
      let anyDifficultyChecked = false;
      if (checkedState[charKey]) {
        for (const bossKey of possibleBossKeys) {
          if (checkedState[charKey][bossKey]) {
            anyDifficultyChecked = true;
            break;
          }
        }
      }
      
      // If no difficulty is checked, mark the highest one
      if (!anyDifficultyChecked && possibleBossKeys.length > 0) {
        // Sort by probable difficulty - typically hardest is more valuable
        const sortedKeys = possibleBossKeys.sort((a, b) => {
          const difficultyOrder = {
            'Extreme': 5, 'Hard': 4, 'Chaos': 3, 'Normal': 2, 'Easy': 1
          };
          // Extract difficulty from "BossName-Difficulty" format
          const diffA = a.split('-')[1];
          const diffB = b.split('-')[1];
          return (difficultyOrder[diffB] || 0) - (difficultyOrder[diffA] || 0);
        });
        
        // Use the highest difficulty
        const highestKey = sortedKeys[0];
        if (!checkedState[charKey]) {
          checkedState[charKey] = {};
        }
        checkedState[charKey][highestKey] = true;
        
        // Update the user data with the new checked state
        userDataObj = {
          ...userDataObj,
          checked: checkedState,
          weekKey: currentWeekKey,
          lastUpdated: new Date().toISOString()
        };
        
        const { error: dataUpdateError } = await supabase
          .from('user_data')
          .update({ data: userDataObj })
          .eq('id', userCode);
          
        if (dataUpdateError) {
          console.error('Error updating checked state:', dataUpdateError);
          // Continue anyway since the pitched item was saved
        }
      }
      
      return { success: true };
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

// Enhanced utility function to synchronize pitched items with checked state
export function syncPitchedItemsToCheckedState(pitchedItems, checkedState = {}, weekKey = getCurrentWeekKey()) {
  if (!pitchedItems || !Array.isArray(pitchedItems) || pitchedItems.length === 0) {
    console.log('📦 No pitched items to sync, returning existing checked state unchanged');
    return checkedState;
  }
  
  // Create a deep copy of the checked state to avoid mutation
  const updatedCheckedState = JSON.parse(JSON.stringify(checkedState));
  
  // Filter pitched items to current week if needed
  const relevantItems = pitchedItems.filter(item => item.weekKey === weekKey);
  
  console.log(`📦 Syncing ${relevantItems.length} pitched items from week ${weekKey} to checked state (ADDITIVE ONLY)`);
  console.log('📊 Existing checked state before sync:', updatedCheckedState);
  
  let addedCompletions = 0;
  
  relevantItems.forEach(item => {
    const { character, boss } = item;
    
    // Handle character ID format that includes the index (e.g., "Envy-0")
    // We'll try both the raw character name and potential indexed versions
    const possibleCharKeys = [character];
    for (let i = 0; i < 10; i++) { // Try with indices 0-9
      possibleCharKeys.push(`${character}-${i}`);
    }
    
    // Find the character key that exists in checked state, or use the most likely one
    let charKey = possibleCharKeys.find(key => updatedCheckedState[key]);
    
    // If no existing character key found, try to find the right index by looking at the character name
    if (!charKey) {
      // Use the character name format that's most likely correct
      charKey = `${character}-0`; // Default to index 0
    }
    
    // Initialize character object if it doesn't exist
    if (!updatedCheckedState[charKey]) {
      updatedCheckedState[charKey] = {};
      console.log(`🆕 Created new character entry for ${charKey}`);
    }
    
    // Generate boss keys for all difficulties (we don't know which one the user has selected)
    const bossKeys = generateBossKeysForAllDifficulties(boss);
    
    // Check if ANY difficulty for this boss is already completed
    let anyDifficultyAlreadyCompleted = false;
    for (const key of Object.keys(updatedCheckedState[charKey] || {})) {
      if (key.startsWith(`${boss}-`) && updatedCheckedState[charKey][key]) {
        anyDifficultyAlreadyCompleted = true;
        console.log(`✅ Boss ${boss} already completed for ${charKey} (${key}), skipping sync`);
        break;
      }
    }
    
    // Only add completion if no difficulty of this boss is already completed
    if (!anyDifficultyAlreadyCompleted && bossKeys.length > 0) {
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
      addedCompletions++;
      console.log(`➕ Added boss completion: ${highestDifficultyKey} for ${charKey} (based on pitched item)`);
    }
  });
  
  // CRITICAL: Ensure NO existing boss clears were lost during sync
  Object.keys(checkedState).forEach(charKey => {
    Object.keys(checkedState[charKey] || {}).forEach(bossKey => {
      if (checkedState[charKey][bossKey] === true) {
        // Ensure this boss clear is preserved in the updated state
        if (!updatedCheckedState[charKey]) {
          updatedCheckedState[charKey] = {};
        }
        if (!updatedCheckedState[charKey][bossKey]) {
          updatedCheckedState[charKey][bossKey] = true;
          console.log(`🔒 PRESERVED: ${charKey} - ${bossKey} (was not lost during sync)`);
        }
      }
    });
  });
  
  console.log(`✅ Sync completed: Added ${addedCompletions} new boss completions based on pitched items`);
  console.log('📊 Final checked state after sync:', updatedCheckedState);
  
  return updatedCheckedState;
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
    
    // 2. Merge the local checked state with database state
    let updatedData = {
      ...data.data,
      checked: checkedState,
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

/**
 * Enhanced reset functionality: Purge pitched records for a specific character
 * @param {string} userCode - User code
 * @param {string} characterName - Name of the character to purge records for
 * @param {number} characterIdx - Index of the character (default: 0)
 * @returns {Object} - Result with success status and audit information
 */
export async function purgePitchedRecords(userCode, characterName, characterIdx = 0) {
  try {
    console.log(`🗑️ Starting pitched records purge for character: ${characterName} (idx: ${characterIdx})`);
    
    if (!userCode || !characterName) {
      console.error('Missing required fields:', { userCode, characterName });
      return { success: false, error: 'Missing required fields' };
    }

    // 1. Fetch current user data
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

    // 2. Filter out pitched items for the target character
    const filteredPitchedItems = currentPitchedItems.filter(item => {
      const matches = item.character === characterName && 
                     (item.characterIdx === characterIdx || item.characterIndex === characterIdx);
      if (matches) {
        console.log(`🗑️ Removing pitched item: ${item.item} from ${item.boss} for ${characterName}`);
      }
      return !matches;
    });

    // 3. Filter boss runs - remove only those with isPitched flag or hasPitchedItem flag
    const filteredBossRuns = currentBossRuns.filter(run => {
      const characterMatches = run.character === characterName && 
                              (run.characterIdx === characterIdx || run.characterIndex === characterIdx);
      
      // Only remove if it's a pitched-related run
      const isPitchedRun = run.isPitched === true || run.hasPitchedItem === true;
      
      if (characterMatches && isPitchedRun) {
        console.log(`🗑️ Removing pitched boss run: ${run.boss} ${run.difficulty} for ${characterName}`);
        return false;
      }
      
      // Preserve all other boss runs (non-pitched)
      return true;
    });

    // 4. Create audit entry
    const auditTimestamp = new Date().toISOString();
    const auditEntry = {
      timestamp: auditTimestamp,
      action: 'purge_pitched_records',
      character: characterName,
      characterIdx: characterIdx,
      itemsRemoved: currentPitchedItems.length - filteredPitchedItems.length,
      bossRunsRemoved: currentBossRuns.length - filteredBossRuns.length,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
    };

    // 5. Update data object with audit tracking
    const updatedData = {
      ...currentData,
      boss_runs: filteredBossRuns,
      lastUpdated: auditTimestamp,
      // Add audit tracking
      pitched_reset_history: [
        ...(currentData.pitched_reset_history || []),
        auditEntry
      ].slice(-50) // Keep only last 50 audit entries
    };

    // 6. Update database with cleaned data and audit trail
    const { error: updateError } = await supabase
      .from('user_data')
      .update({ 
        pitched_items: filteredPitchedItems,
        data: updatedData
      })
      .eq('id', userCode);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log(`✅ Pitched records purged successfully for ${characterName}`);
    console.log(`📊 Removed ${auditEntry.itemsRemoved} pitched items and ${auditEntry.bossRunsRemoved} boss runs`);
    console.log(`📊 Preserved ${filteredBossRuns.length} non-pitched boss runs`);

    return { 
      success: true, 
      audit: auditEntry,
      itemsRemoved: auditEntry.itemsRemoved,
      bossRunsRemoved: auditEntry.bossRunsRemoved,
      bossRunsPreserved: filteredBossRuns.length
    };

  } catch (error) {
    console.error('Error purging pitched records:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
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
      console.log(`🗑️ Clearing UI checkmark: ${key}`);
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
    console.log('📊 Fetching global reset statistics...');
    
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

    // Get all unique week keys from pitched_items, boss_runs, and main data
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('data, pitched_items, boss_runs')
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

    // Add weeks from boss runs
    if (userData.boss_runs && Array.isArray(userData.boss_runs)) {
      userData.boss_runs.forEach(run => {
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

    console.log(`Found ${weeks.length} weeks with data:`, weeks);

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

    console.log(`Fetching data for week: ${weekKey}`);

    // Get user data
    const { data: userData, error } = await supabase
      .from('user_data')
      .select('data, pitched_items, boss_runs')
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

    // Filter boss runs for this week
    const bossRuns = userData.boss_runs
      ? userData.boss_runs.filter(run => run.weekKey === weekKey)
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

    console.log(`Week ${weekKey} data:`, {
      pitchedItems: pitchedItems.length,
      bossRuns: bossRuns.length,
      checkedStates: Object.keys(checkedState).length
    });

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
