import { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLocalStorage, useLocalStorageString } from './useLocalStorage';
import { useBossCalculations } from './useBossCalculations';
import { bossData, getBossPrice } from '../data/bossData';
import { LIMITS, STORAGE_KEYS, PAGES, COOLDOWNS, ANIMATION_DURATIONS } from '../constants';
import { getCurrentWeekKey } from '../utils/weekUtils';

// Helper function to extract characters from the new data structure
function extractCharactersFromData(userData) {
  const characters = [];
  const characterSet = new Set();
  const characterBosses = {}; // Track bosses for each character
  
  console.log('🔍 Extracting characters from data structure...');
  
  // Method 1: From boss_runs data (most reliable and up-to-date)
  if (userData.boss_runs && Array.isArray(userData.boss_runs)) {
    userData.boss_runs.forEach(run => {
      if (run.character && typeof run.characterIdx === 'number') {
        const key = `${run.character}-${run.characterIdx}`;
        if (!characterSet.has(key)) {
          characterSet.add(key);
          characters.push({
            name: run.character,
            index: run.characterIdx,
            bosses: []
          });
          console.log(`✅ Found character from boss_runs: ${run.character} (index: ${run.characterIdx})`);
        }
        
        // Extract boss information from boss runs
        if (!characterBosses[key]) {
          characterBosses[key] = new Set();
        }
        
        if (run.boss && run.difficulty) {
          const bossId = `${run.boss}-${run.difficulty}`;
          if (!characterBosses[key].has(bossId)) {
            characterBosses[key].add(bossId);
            console.log(`📋 Found boss from boss_runs for ${run.character}: ${run.boss} (${run.difficulty})`);
          }
        }
      }
    });
  }
  
  // Method 2: From checked state (fallback for legacy data)
  if (userData.checked && typeof userData.checked === 'object') {
    Object.keys(userData.checked).forEach(charKey => {
      // Extract character name from "CharacterName-Index" format
      const parts = charKey.split('-');
      if (parts.length >= 2) {
        const characterName = parts.slice(0, -1).join('-'); // Handle names with dashes
        const characterIndex = parseInt(parts[parts.length - 1]);
        
        if (!isNaN(characterIndex) && characterName) {
          const key = `${characterName}-${characterIndex}`;
          if (!characterSet.has(key)) {
            characterSet.add(key);
            characters.push({
              name: characterName,
              index: characterIndex,
              bosses: []
            });
            console.log(`✅ Found character from checked (legacy): ${characterName} (index: ${characterIndex})`);
          }
          
          // Extract boss information from checked state
          if (!characterBosses[key]) {
            characterBosses[key] = new Set();
          }
          
          Object.keys(userData.checked[charKey] || {}).forEach(bossKey => {
            // Parse boss key format: "BossName-Difficulty"
            const bossparts = bossKey.split('-');
            if (bossparts.length >= 2) {
              const difficulty = bossparts[bossparts.length - 1];
              const bossName = bossparts.slice(0, -1).join('-');
              const bossId = `${bossName}-${difficulty}`;
              
              if (!characterBosses[key].has(bossId)) {
                characterBosses[key].add(bossId);
                console.log(`📋 Found boss from checked for ${characterName}: ${bossName} (${difficulty})`);
              }
            }
          });
        }
      }
    });
  }
  
  // Method 3: From weeklyBossClearHistory (additional fallback)
  if (userData.weeklyBossClearHistory && typeof userData.weeklyBossClearHistory === 'object') {
    Object.values(userData.weeklyBossClearHistory).forEach(weekData => {
      if (weekData.bossClearStatus && typeof weekData.bossClearStatus === 'object') {
        Object.keys(weekData.bossClearStatus).forEach(charKey => {
          const parts = charKey.split('-');
          if (parts.length >= 2) {
            const characterName = parts.slice(0, -1).join('-');
            const characterIndex = parseInt(parts[parts.length - 1]);
            
            if (!isNaN(characterIndex) && characterName) {
              const key = `${characterName}-${characterIndex}`;
              if (!characterSet.has(key)) {
                characterSet.add(key);
                characters.push({
                  name: characterName,
                  index: characterIndex,
                  bosses: []
                });
                console.log(`✅ Found character from weeklyBossClearHistory: ${characterName} (index: ${characterIndex})`);
              }
              
              // Extract boss information from weekly boss clear history
              if (!characterBosses[key]) {
                characterBosses[key] = new Set();
              }
              
              Object.keys(weekData.bossClearStatus[charKey] || {}).forEach(bossKey => {
                const bossparts = bossKey.split('-');
                if (bossparts.length >= 2) {
                  const difficulty = bossparts[bossparts.length - 1];
                  const bossName = bossparts.slice(0, -1).join('-');
                  const bossId = `${bossName}-${difficulty}`;
                  
                  if (!characterBosses[key].has(bossId)) {
                    characterBosses[key].add(bossId);
                    console.log(`📋 Found boss from history for ${characterName}: ${bossName} (${difficulty})`);
                  }
                }
              });
            }
          }
        });
      }
    });
  }
  
  // Populate bosses array for each character
  characters.forEach(char => {
    const key = `${char.name}-${char.index}`;
    const bosses = characterBosses[key];
    
    if (bosses && bosses.size > 0) {
      char.bosses = Array.from(bosses).map(bossId => {
        const parts = bossId.split('-');
        const difficulty = parts[parts.length - 1];
        const name = parts.slice(0, -1).join('-');
        
        return {
          name,
          difficulty,
          partySize: 1, // Default party size
          price: 0 // Will be calculated later
        };
      });
      
      console.log(`🎯 Populated ${char.bosses.length} bosses for ${char.name}:`, char.bosses.map(b => `${b.name}-${b.difficulty}`));
    }
  });
  
  // Sort characters by index to maintain consistent order
  characters.sort((a, b) => a.index - b.index);
  
  console.log(`🎯 Extracted ${characters.length} characters with bosses:`, characters.map(c => `${c.name}-${c.index} (${c.bosses.length} bosses)`));
  return characters;
}

export function useAppData() {
  const { userCode, isLoggedIn } = useAuth();

  // Core state
  const [characters, setCharacters] = useState([]);
  const [newCharName, setNewCharName] = useState('');
  const [selectedCharIdx, setSelectedCharIdx] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState({});
  
  // Flag to prevent checked state overwrites during preservation
  const preservingCheckedStateRef = useRef(false);
  
  // Debug wrapper for setChecked to track all changes
  const debugSetChecked = (newChecked) => {
    console.log('🔄 STATE: setChecked called with:', JSON.stringify(newChecked, null, 2));
    console.log('🔄 STATE: Previous checked state was:', JSON.stringify(checked, null, 2));
    console.log('🔄 STATE: Preservation flag is:', preservingCheckedStateRef.current);
    setChecked(newChecked);
  };
  
  // Utility states
  const [cloneError, setCloneError] = useState('');
  const [showUndo, setShowUndo] = useState(false);
  const [undoData, setUndoData] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const undoTimeout = useRef(null);

  // Use boss calculations hook
  const {
    charTotal,
    overallTotal,
    sortedBossData,
    totalBossCount,
    getAvailablePartySizes,
    getBossDifficulties,
  } = useBossCalculations(characters, bossData);

  // Data loading effect
  useEffect(() => {
    if (!userCode || !isLoggedIn) {
      setCharacters([]);
      setChecked({});
      setError('');
      return;
    }

    const loadData = async () => {
      try {
        setError('');
        console.log('Loading data for user:', userCode);
        
        const { supabase } = await import('../supabaseClient');
        const { data, error } = await supabase
          .from('user_data')
          .select('data')
          .eq('id', userCode)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('No existing data found for user, starting fresh');
            setCharacters([]);
            debugSetChecked({});
            return;
          }
          throw error;
        }

        if (data && data.data) {
          const userData = data.data;
          console.log('📊 Raw user data:', userData);
          console.log('📊 Characters found:', userData.characters);
          console.log('📊 Boss runs found:', userData.boss_runs?.length || 0);
          
          // Load characters - handle both old and new data formats
          if (userData.characters && Array.isArray(userData.characters)) {
            // Old format - direct characters array
            setCharacters(userData.characters);
            console.log('✅ Loaded characters (old format):', userData.characters.length, userData.characters);
          } else {
            // New format - extract characters from data structures
            const extractedCharacters = extractCharactersFromData(userData);
            setCharacters(extractedCharacters);
            console.log('✅ Loaded characters (new format):', extractedCharacters.length, extractedCharacters);
          }
          
          // Reconstruct checked state from boss_runs (single source of truth)
          const reconstructedChecked = {};
          if (userData.boss_runs && Array.isArray(userData.boss_runs)) {
            userData.boss_runs.forEach(run => {
              if (run.cleared) {
                const charKey = `${run.character}-${run.characterIdx || 0}`;
                const bossKey = `${run.boss}-${run.difficulty}`;
                
                if (!reconstructedChecked[charKey]) {
                  reconstructedChecked[charKey] = {};
                }
                reconstructedChecked[charKey][bossKey] = true;
              }
            });
            console.log('✅ Reconstructed checked state from boss_runs:', Object.keys(reconstructedChecked).length, 'characters');
          }
          
          // Fallback to legacy checked state if no boss_runs data
          if (Object.keys(reconstructedChecked).length === 0 && userData.checked && typeof userData.checked === 'object') {
            console.log('📊 LOAD: Setting checked state from legacy data:', JSON.stringify(userData.checked, null, 2));
            debugSetChecked(userData.checked);
            console.log('✅ LOAD: Loaded legacy checked state:', Object.keys(userData.checked).length, 'entries');
          } else {
            console.log('📊 LOAD: Setting checked state from boss_runs:', JSON.stringify(reconstructedChecked, null, 2));
            debugSetChecked(reconstructedChecked);
            console.log('✅ LOAD: Using reconstructed checked state from boss_runs');
          }
        } else {
          console.log('No data found, starting fresh');
          setCharacters([]);
          debugSetChecked({});
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data. Please try refreshing the page.');
      }
    };

    loadData();
  }, [userCode, isLoggedIn]);

  // Function to refresh checked state from latest boss runs in database
  const refreshCheckedStateFromBossRuns = async () => {
    if (!userCode || !isLoggedIn) return;
    
    try {
      console.log('🔄 Refreshing checked state from boss runs...');
      
      const { supabase } = await import('../supabaseClient');
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('id', userCode)
        .single();

      if (error) throw error;

      if (data && data.data && data.data.boss_runs && Array.isArray(data.data.boss_runs)) {
        const reconstructedChecked = {};
        
        data.data.boss_runs.forEach(run => {
          if (run.cleared) {
            const charKey = `${run.character}-${run.characterIdx || 0}`;
            const bossKey = `${run.boss}-${run.difficulty}`;
            
            if (!reconstructedChecked[charKey]) {
              reconstructedChecked[charKey] = {};
            }
            reconstructedChecked[charKey][bossKey] = true;
          }
        });
        
        console.log('✅ Refreshed checked state from boss_runs:', Object.keys(reconstructedChecked).length, 'characters');
        debugSetChecked(reconstructedChecked);
        return reconstructedChecked;
      }
    } catch (error) {
      console.error('Error refreshing checked state from boss runs:', error);
    }
    
    return null;
  };

  // Helper function to parse character key format "CharacterName-Index"
  const parseCharacterKey = (charKey) => {
    const parts = charKey.split('-');
    if (parts.length >= 2) {
      const characterIndex = parseInt(parts[parts.length - 1]);
      const characterName = parts.slice(0, -1).join('-');
      return [characterName, characterIndex];
    }
    return [charKey, 0];
  };

  // Helper function to find character by name and index
  const findCharacterByNameAndIndex = (characters, name, index) => {
    return characters.find((char, idx) => 
      char.name === name && (char.index === index || idx === index)
    );
  };

  // Function to clean up checked state based on current boss selections
  const cleanupCheckedState = (newCharacters, currentChecked) => {
    const cleanedChecked = { ...currentChecked };
    
    console.log('🧹 Cleaning up checked state based on new boss selections...');
    console.log('📊 Current checked state:', currentChecked);
    console.log('📋 New characters:', newCharacters.map(c => `${c.name} (${c.bosses?.length || 0} bosses)`));
    
    // For each character in checked state
    Object.keys(cleanedChecked).forEach(charKey => {
      const [charName, charIdx] = parseCharacterKey(charKey);
      const character = findCharacterByNameAndIndex(newCharacters, charName, charIdx);
      
      if (!character) {
        // Character removed - remove all entries
        console.log(`🗑️ Removing all entries for deleted character: ${charKey}`);
        delete cleanedChecked[charKey];
      } else {
        // Character exists - clean up removed bosses only
        const currentBosses = (character.bosses || []).map(b => `${b.name}-${b.difficulty}`);
        const checkedBosses = Object.keys(cleanedChecked[charKey] || {});
        
        console.log(`🔍 Character ${charName}: Current bosses [${currentBosses.join(', ')}], Checked bosses [${checkedBosses.join(', ')}]`);
        
        checkedBosses.forEach(bossKey => {
          if (!currentBosses.includes(bossKey)) {
            console.log(`🗑️ Removing checked state for deselected boss: ${charName} - ${bossKey}`);
            delete cleanedChecked[charKey][bossKey];
          } else {
            console.log(`✅ Preserving checked state for: ${charName} - ${bossKey}`);
          }
        });
        
        // Remove empty character entries
        if (Object.keys(cleanedChecked[charKey] || {}).length === 0) {
          delete cleanedChecked[charKey];
        }
      }
    });
    
    console.log('🎯 Final cleaned checked state:', cleanedChecked);
    return cleanedChecked;
  };

  // Function to clean up boss_runs in database when boss selections change
  const cleanupBossRunsInDatabase = async (newCharacters, currentChecked) => {
    if (!userCode || !isLoggedIn) return;
    
    try {
      const startTime = new Date().toISOString();
      console.log(`🧹 DATABASE: Starting boss_runs cleanup at ${startTime}...`);
      console.log('🧹 DATABASE: New characters structure:', newCharacters.map((char, idx) => ({
        name: char.name,
        arrayIndex: idx,
        characterIndex: char.index,
        bosses: char.bosses?.map(b => `${b.name}-${b.difficulty}`) || []
      })));
      
      const { supabase } = await import('../supabaseClient');
      
      // Get current database state
      console.log('🧹 DATABASE: Fetching current database state...');
      const { data: userData, error: fetchError } = await supabase
        .from('user_data')
        .select('data')
        .eq('id', userCode)
        .single();
        
      if (fetchError) {
        console.error('Error fetching user data for boss_runs cleanup:', fetchError);
        return;
      }
      
      const currentData = userData.data || {};
      const currentBossRuns = currentData.boss_runs || [];
      
      console.log(`🧹 DATABASE: Found ${currentBossRuns.length} boss_runs in database:`);
      currentBossRuns.forEach((run, idx) => {
        console.log(`  ${idx + 1}. ${run.character}-${run.characterIdx}-${run.boss}-${run.difficulty} (${run.weekKey})`);
      });
      
      if (currentBossRuns.length === 0) {
        console.log('🧹 DATABASE: No boss_runs to clean up');
        return;
      }
      
      // Create a set of valid boss combinations from new characters
      // IMPORTANT: Use array index (charIdx) since that's what's stored in boss_runs
      const validBossCombinations = new Set();
      newCharacters.forEach((char, charIdx) => {
        char.bosses?.forEach(boss => {
          // Use the array index (charIdx) since that's what's stored in characterIdx field of boss_runs
          const key = `${char.name}-${charIdx}-${boss.name}-${boss.difficulty}`;
          validBossCombinations.add(key);
          console.log(`🧹 DATABASE: Adding valid combination: ${key}`);
        });
      });
      
      console.log('🧹 DATABASE: Valid boss combinations:', Array.from(validBossCombinations));
      
      // Filter boss_runs to keep only valid combinations
      const filteredBossRuns = currentBossRuns.filter(run => {
        const runKey = `${run.character}-${run.characterIdx || 0}-${run.boss}-${run.difficulty}`;
        const isValid = validBossCombinations.has(runKey);
        
        console.log(`🧹 DATABASE: Checking run: ${runKey} - Valid: ${isValid}`);
        
        if (!isValid) {
          console.log(`🗑️ DATABASE: WILL REMOVE invalid boss_run: ${runKey}`);
        } else {
          console.log(`✅ DATABASE: WILL KEEP valid boss_run: ${runKey}`);
        }
        
        return isValid;
      });
      
      // Only update if there are changes
      if (filteredBossRuns.length !== currentBossRuns.length) {
        console.log(`🧹 DATABASE: Changes detected! ${currentBossRuns.length} → ${filteredBossRuns.length}`);
        
        const updatedData = {
          ...currentData,
          boss_runs: filteredBossRuns,
          lastUpdated: new Date().toISOString()
        };
        
        console.log('🧹 DATABASE: Updating database with filtered boss_runs...');
        const { error: updateError } = await supabase
          .from('user_data')
          .update({ data: updatedData })
          .eq('id', userCode);
          
        if (updateError) {
          console.error('❌ DATABASE: Error updating boss_runs:', updateError);
        } else {
          console.log(`✅ DATABASE: Successfully cleaned up boss_runs: ${currentBossRuns.length} → ${filteredBossRuns.length}`);
          console.log('✅ DATABASE: Remaining boss_runs:');
          filteredBossRuns.forEach((run, idx) => {
            console.log(`  ${idx + 1}. ${run.character}-${run.characterIdx}-${run.boss}-${run.difficulty}`);
          });
        }
      } else {
        console.log('🧹 DATABASE: No boss_runs cleanup needed - no changes detected');
      }
      
    } catch (error) {
      console.error('❌ DATABASE: Error in cleanupBossRunsInDatabase:', error);
    }
  };

  // Function to preserve checked state when boss selections change
  // This ensures that checked bosses remain checked if they're still selected
  // and only removes checked state for bosses that are actually deselected
  const preserveCheckedStateOnBossChange = async (newCharacters) => {
    console.log('🔄 PRESERVE: Starting preservation process...');
    console.log('🔄 PRESERVE: userCode:', userCode, 'isLoggedIn:', isLoggedIn);
    
    if (!userCode || !isLoggedIn) {
      console.log('❌ PRESERVE: Skipping - no userCode or not logged in');
      return;
    }
    
    console.log('🔄 PRESERVE: Current checked state before preservation:', JSON.stringify(checked, null, 2));
    console.log('🔄 PRESERVE: New characters data:', newCharacters.map((c, idx) => ({
      name: c.name,
      arrayIndex: idx,
      characterIndex: c.index,
      bosses: c.bosses?.map(b => `${b.name}-${b.difficulty}`) || []
    })));
    
    // Set flag to prevent other hooks from overwriting during preservation
    preservingCheckedStateRef.current = true;
    console.log('🔒 PRESERVE: Flag set to prevent overwrites');
    
    // Clean up checked state based on new boss selections
    const cleanedChecked = cleanupCheckedState(newCharacters, checked);
    
    console.log('🔄 PRESERVE: Cleaned checked state:', JSON.stringify(cleanedChecked, null, 2));
    
    // Update local state immediately
    debugSetChecked(cleanedChecked);
    console.log('✅ PRESERVE: debugSetChecked called with cleaned state');
    
    // Also clean up boss_runs in database
    console.log('🔄 PRESERVE: About to call cleanupBossRunsInDatabase...');
    await cleanupBossRunsInDatabase(newCharacters, checked);
    console.log('✅ PRESERVE: cleanupBossRunsInDatabase completed');
    
    // Clean up orphaned pitched items
    try {
      console.log('🔄 PRESERVE: About to call cleanupOrphanedPitchedItems...');
      const { cleanupOrphanedPitchedItems } = await import('../pitched-data-service');
      const pitchedCleanupResult = await cleanupOrphanedPitchedItems(userCode, newCharacters);
      if (pitchedCleanupResult.success && pitchedCleanupResult.itemsRemoved > 0) {
        console.log(`🧹 PRESERVE: Cleaned up ${pitchedCleanupResult.itemsRemoved} orphaned pitched items`);
      } else {
        console.log('🧹 PRESERVE: No orphaned pitched items to clean up');
      }
    } catch (error) {
      console.error('Error cleaning up orphaned pitched items:', error);
    }
    
    // Clear flag after a delay to allow other effects to settle
    setTimeout(() => {
      preservingCheckedStateRef.current = false;
      console.log('🔓 PRESERVE: Flag cleared - other hooks can now update');
    }, 500);
    
    console.log('✅ PRESERVE: Preservation process completed');
  };

  // Save data to cloud
  const saveToCloud = async (updatedData) => {
    if (!userCode || !isLoggedIn) return;
    
    try {
      const { supabase } = await import('../supabaseClient');
      
      // First, get the current data to preserve existing fields
      const { data: currentData, error: fetchError } = await supabase
        .from('user_data')
        .select('data')
        .eq('id', userCode)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // Merge with existing data to preserve boss_runs and other fields
      const existingData = currentData?.data || {};
      const mergedData = {
        ...existingData,
        ...updatedData,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('💾 SAVE: Merging data - existing keys:', Object.keys(existingData), 'new keys:', Object.keys(updatedData));
      
      const { error } = await supabase
        .from('user_data')
        .update({ data: mergedData })
        .eq('id', userCode);
        
      if (error) throw error;
      console.log('Data saved to cloud successfully');
    } catch (error) {
      console.error('Error saving to cloud:', error);
    }
  };

  // Character management functions
  const handleCharacterChange = (e) => {
    setIsLoading(true);
    setSelectedCharIdx(e.target.value ? parseInt(e.target.value) : null);
    setTimeout(() => setIsLoading(false), 300);
  };

  const addCharacter = async () => {
    if (!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP) return;
    
    // Create new character with index
    const newIndex = characters.length > 0 ? Math.max(...characters.map(c => c.index || 0)) + 1 : 0;
    const newChar = { 
      name: newCharName.trim(), 
      index: newIndex,
      bosses: [] 
    };
    const newCharacters = [...characters, newChar];
    
    setCharacters(newCharacters);
    setNewCharName('');
    
    // Save to cloud (characters only, checked state reconstructed from boss_runs)
    const updatedData = {
      characters: newCharacters
    };
    await saveToCloud(updatedData);
  };

  const removeCharacter = async (idx) => {
    if (idx < 0 || idx >= characters.length) return;
    
    const characterToRemove = characters[idx];
    
    // Store undo data
    setUndoData({
      character: characterToRemove,
      index: idx,
      timestamp: Date.now()
    });
    
    setShowUndo(true);
    
    // Clear existing timeout
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current);
    }
    
    // Auto-hide undo after 10 seconds
    undoTimeout.current = setTimeout(() => {
      setShowUndo(false);
      setUndoData(null);
    }, 10000);
    
    const newCharacters = characters.filter((_, i) => i !== idx);
    setCharacters(newCharacters);
    
    // Adjust selectedCharIdx
    if (selectedCharIdx === idx) {
      setSelectedCharIdx(newCharacters.length > 0 ? Math.max(0, idx - 1) : null);
    } else if (selectedCharIdx > idx) {
      setSelectedCharIdx(selectedCharIdx - 1);
    }
    
    // Save to cloud (characters only, checked state reconstructed from boss_runs)
    const updatedData = {
      characters: newCharacters
    };
    await saveToCloud(updatedData);
  };

  const handleUndo = () => {
    if (!undoData) return;
    
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current);
    }
    
    const newCharacters = [...characters];
    newCharacters.splice(undoData.index, 0, undoData.character);
    setCharacters(newCharacters);
    
    if (selectedCharIdx === null || selectedCharIdx >= undoData.index) {
      setSelectedCharIdx(undoData.index);
    }
    
    setShowUndo(false);
    setUndoData(null);
  };

  const updateCharacterName = async (idx, newName) => {
    const newCharacters = characters.map((char, i) => 
      i === idx ? { ...char, name: newName } : char
    );
    setCharacters(newCharacters);
    
    // Save to cloud (characters only, checked state reconstructed from boss_runs)
    const updatedData = {
      characters: newCharacters
    };
    await saveToCloud(updatedData);
  };

  // Boss management functions
  const toggleBoss = (charIdx, bossName, difficulty) => {
    console.log('🎯 TOGGLE: Boss toggle called:', { charIdx, bossName, difficulty });
    console.log('🎯 TOGGLE: Current characters before change:', characters.map((c, idx) => ({
      name: c.name,
      arrayIndex: idx,
      characterIndex: c.index,
      bosses: c.bosses?.map(b => `${b.name}-${b.difficulty}`) || []
    })));
    
    const newCharacters = characters.map((char, idx) => {
      if (idx !== charIdx) return char;
      
      if (!difficulty) {
        // Remove boss entirely when difficulty is empty/falsy
        const existingBoss = char.bosses.find(b => b.name === bossName);
        if (existingBoss) {
          console.log('🎯 TOGGLE: Removing boss entirely:', bossName);
          return { ...char, bosses: char.bosses.filter(b => b.name !== bossName) };
        }
        return char;
      }

      // Check if boss already exists
      const existingBoss = char.bosses.find(b => b.name === bossName);
      if (existingBoss) {
        // Update existing boss with new difficulty
        console.log('🎯 TOGGLE: Updating existing boss:', bossName, 'from', existingBoss.difficulty, 'to', difficulty);
        return {
          ...char,
          bosses: char.bosses.map(b => 
            b.name === bossName 
              ? { 
                  ...b, 
                  difficulty,
                  price: getBossPrice(bossData.find(bd => bd.name === bossName), difficulty),
                  partySize: getAvailablePartySizes(bossName, difficulty)[0] || 1
                } 
              : b
          )
        };
      }

      // Add new boss if under limit
      if (char.bosses.length < LIMITS.CHARACTER_BOSS_CAP) {
        console.log('🎯 TOGGLE: Adding new boss:', bossName, 'with difficulty:', difficulty);
        return {
          ...char,
          bosses: [
            ...char.bosses,
            { 
              name: bossName, 
              difficulty,
              price: getBossPrice(bossData.find(bd => bd.name === bossName), difficulty),
              partySize: getAvailablePartySizes(bossName, difficulty)[0] || 1
            }
          ]
        };
      }
      
      return char;
    });

    console.log('🎯 TOGGLE: New characters after change:', newCharacters.map((c, idx) => ({
      name: c.name,
      arrayIndex: idx,
      characterIndex: c.index,
      bosses: c.bosses?.map(b => `${b.name}-${b.difficulty}`) || []
    })));

    setCharacters(newCharacters);
    console.log('🎯 TOGGLE: setCharacters called');
    
    // Preserve checked state after boss selection changes
    console.log('🎯 TOGGLE: About to call preserveCheckedStateOnBossChange');
    console.log('🎯 TOGGLE: Passing newCharacters to preservation:', JSON.stringify(newCharacters.map((c, idx) => ({
      name: c.name,
      arrayIndex: idx,
      bosses: c.bosses?.map(b => `${b.name}-${b.difficulty}`) || []
    })), null, 2));
    
    preserveCheckedStateOnBossChange(newCharacters).catch(console.error);
    
    // Save to cloud asynchronously without blocking UI
    const saveData = async () => {
      const updatedData = { characters: newCharacters };
      await saveToCloud(updatedData);
    };
    saveData().catch(console.error);
  };

  // Batch boss management - replaces all bosses for a character at once
  const batchSetBosses = (charIdx, newBosses) => {
    const newCharacters = characters.map((char, idx) => {
      if (idx !== charIdx) return char;
      
      // Process new bosses to ensure they have proper data structure
      const processedBosses = newBosses.map(boss => ({
        name: boss.name,
        difficulty: boss.difficulty,
        price: getBossPrice(bossData.find(bd => bd.name === boss.name), boss.difficulty),
        partySize: boss.partySize || getAvailablePartySizes(boss.name, boss.difficulty)[0] || 1
      }));
      
      return {
        ...char,
        bosses: processedBosses
      };
    });

    setCharacters(newCharacters);
    
    // Preserve checked state after boss selection changes
    preserveCheckedStateOnBossChange(newCharacters).catch(console.error);
    
    // Save to cloud asynchronously without blocking UI
    const saveData = async () => {
      const updatedData = { characters: newCharacters };
      await saveToCloud(updatedData);
    };
    saveData().catch(console.error);
  };

  const updatePartySize = async (charIdx, bossName, difficulty, newSize) => {
    const newCharacters = characters.map((char, idx) => {
      if (idx !== charIdx) return char;
      
      return {
        ...char,
        bosses: char.bosses.map(boss => 
          boss.name === bossName && boss.difficulty === difficulty
            ? { ...boss, partySize: newSize }
            : boss
        )
      };
    });

    setCharacters(newCharacters);
    
    // Save to cloud (characters only, checked state reconstructed from boss_runs)
    const updatedData = {
      characters: newCharacters
    };
    await saveToCloud(updatedData);
  };

  // Reset selectedCharIdx if out of bounds
  useEffect(() => {
    if (selectedCharIdx >= characters.length) {
      setSelectedCharIdx(Math.max(0, characters.length - 1));
    }
  }, [characters.length, selectedCharIdx]);

  return {
    // State
    characters,
    setCharacters,
    newCharName,
    setNewCharName,
    selectedCharIdx,
    setSelectedCharIdx,
    error,
    setError,
    isLoading,
    setIsLoading,
    checked,
    setChecked,
    cloneError,
    setCloneError,
    showUndo,
    undoData,
    fileInputRef,
    importError,
    setImportError,
    importSuccess,
    setImportSuccess,
    
    // Calculated values
    charTotal,
    overallTotal,
    sortedBossData,
    totalBossCount,
    
    // Functions
    getAvailablePartySizes,
    getBossDifficulties,
    handleCharacterChange,
    addCharacter,
    removeCharacter,
    handleUndo,
    toggleBoss,
    updateCharacterName,
    updatePartySize,
    batchSetBosses,
    refreshCheckedStateFromBossRuns,
    preserveCheckedStateOnBossChange,
    preservingCheckedStateRef,
  };
} 