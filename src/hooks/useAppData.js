import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthentication } from '../../hooks/useAuthentication';
import { useBossCalculations } from './useBossCalculations';
import { LIMITS, COOLDOWNS, ANIMATION_DURATIONS } from '../constants';
// Aliased import for clarity
import { getCurrentWeekKey as getRealCurrentWeekKeyUtil } from '../utils/weekUtils';

import { useForceUpdate } from './ForceUpdateContext';

export function useAppData() {
  const { userCode, isLoggedIn } = useAuthentication();
  const { forceUpdate } = useForceUpdate();

  const [characterBossSelections, setCharacterBossSelections] = useState([]);
  const [newCharName, setNewCharName] = useState('');
  const [selectedCharIdx, setSelectedCharIdx] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState({});
  const [bossData, setBossData] = useState([]); // Boss data from database
  // This is the "effective" timestamp, manipulated by simulation or real resets
  const [lastWeeklyResetTimestamp, setLastWeeklyResetTimestamp] = useState(0); 
  const preservingCheckedStateRef = useRef(false);

  // New states for simulation
  const [simulatedWeeksForward, setSimulatedWeeksForward] = useState(0);
  const [realCurrentWeekKeySnapshot, setRealCurrentWeekKeySnapshot] = useState(null);
  // Stores the *actual* last reset timestamp before any simulation starts, or from the latest real reset.
  const [actualLastResetTimestampSnapshot, setActualLastResetTimestampSnapshot] = useState(null);
  
  const [currentOperatingWeekKey, setCurrentOperatingWeekKey] = useState(() => getRealCurrentWeekKeyUtil());

  const debugSetChecked = (newChecked) => {
    setChecked(newChecked);
  };
  
  const [cloneError, setCloneError] = useState('');
  const [showUndo, setShowUndo] = useState(false);
  const [undoData, setUndoData] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const undoTimeout = useRef(null);
  const [showCrystalCapError, setShowCrystalCapError] = useState(false);

  const {
    charTotal,
    overallTotal,
    sortedBossData,
    totalBossCount,
    getAvailablePartySizes,
    getBossDifficulties,
  } = useBossCalculations(characterBossSelections, bossData);

  const calculateAndSetActualLastResetTimestampSnapshot = useCallback(() => {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    let dayOfWeek = today.getUTCDay(); // 0 (Sun) to 6 (Sat)
    let daysToSubtract = (dayOfWeek - 4 + 7) % 7; // 4 is Thursday
    today.setUTCDate(today.getUTCDate() - daysToSubtract);
    today.setUTCHours(0,0,0,0);
    const timestamp = today.getTime();
    
    // Don't immediately set state to prevent circular loops
    // Return the calculated timestamp instead
    return timestamp;
  }, []); // Remove all dependencies to prevent circular loops

  // Separate function for setting the timestamp state to avoid circular dependencies
  const updateLastResetTimestamp = useCallback((timestamp) => {
    setActualLastResetTimestampSnapshot(timestamp);
  }, []);

  useEffect(() => {
    // Initialize on load - calculate timestamp but don't set state immediately
    setCurrentOperatingWeekKey(getRealCurrentWeekKeyUtil());
    const initialTimestamp = calculateAndSetActualLastResetTimestampSnapshot();
    // Use setTimeout to prevent immediate state update during render
    setTimeout(() => {
      setActualLastResetTimestampSnapshot(initialTimestamp);
    }, 10);
  }, []); // Empty dependency array to run only once

  // Load boss data from database on mount (force fresh data)
  useEffect(() => {
    const loadBossData = async () => {
      try {
        const { getBossDataForFrontend, forceRefreshBossRegistry } = await import('../../services/bossRegistryService.js');
        
        // Force refresh to ensure we have latest database values
        await forceRefreshBossRegistry();
        
        const result = await getBossDataForFrontend(true); // Force fresh data
        
        if (result.success) {
          setBossData(result.data);
          console.log('✅ Loaded fresh boss data from database:', result.data.length, 'bosses');
        } else {
          console.error('Failed to load boss data:', result.error);
          // Fallback to empty array
          setBossData([]);
        }
      } catch (error) {
        console.error('Error loading boss data:', error);
        setBossData([]);
      }
    };
    
    loadBossData();
  }, []);
  
  // SIMPLIFIED: UI-only simulation actions (no database manipulation)
  const performSafeSimulationActions = useCallback(async (endedWeekKey, newCurrentWeekKey, newResetTimestampVal) => {
    console.log(`🔮 UI simulation: ${endedWeekKey} → ${newCurrentWeekKey}`);
    
    try {
      // Clear local UI state for simulated week
      setChecked({});
      setCurrentOperatingWeekKey(newCurrentWeekKey);
      
      // Update timestamp with delay to prevent cascading effects
      setTimeout(() => {
        setLastWeeklyResetTimestamp(newResetTimestampVal);
      }, 50);
      
      console.log(`✅ UI simulation active - Week ${newCurrentWeekKey} (UI only)`);
      
    } catch (error) {
      console.error('🚨 Error during UI simulation:', error);
    }
  }, [setChecked, setCurrentOperatingWeekKey, setLastWeeklyResetTimestamp]);

  // SIMPLIFIED: UI-only revert actions (no database manipulation)
  const performSafeRevertActions = useCallback(async (lastSimulatedWeekKey, restoredRealWeek, restoredRealTimestamp) => {
    console.log(`🔄 UI revert: ${lastSimulatedWeekKey} → ${restoredRealWeek}`);
    
    try {
      // Restore local UI state only
      setChecked({});
      setCurrentOperatingWeekKey(restoredRealWeek);
      
      // Update timestamp with delay to prevent cascading effects
      setTimeout(() => {
        setLastWeeklyResetTimestamp(restoredRealTimestamp);
      }, 50);
      
      // Force refresh to load current week data
      setTimeout(() => {
        forceUpdate();
      }, 100);
      
      console.log(`✅ UI revert complete - returned to real week ${restoredRealWeek}`);
      
    } catch (error) {
      console.error('🚨 Error during UI revert:', error);
    }
  }, [setChecked, setCurrentOperatingWeekKey, setLastWeeklyResetTimestamp, forceUpdate]);

  // SIMPLIFIED: Weekly reset for new user_boss_data system
  const performWeeklyResetActions = useCallback(async (endedWeekKey, newCurrentWeekKey, newResetTimestampVal) => {
    console.log(`Performing weekly reset: ended ${endedWeekKey}, new current ${newCurrentWeekKey}`);
    
    try {
      // Clear weekly_clears in user_boss_data for the new week using new service
      if (userCode && isLoggedIn) {
        const { saveCurrentWeekData } = await import('../../services/userWeeklyDataService.js');
        
        // Clear weekly_clears for new week (preserve char_map and boss_config)
        await saveCurrentWeekData(userCode, {
          weekly_clears: {} // Clear all weekly clears for new week
        });
      }

      // Update local UI state with batched updates to prevent cascading
      const updates = () => {
        setChecked({});
        setCurrentOperatingWeekKey(newCurrentWeekKey);
        setLastWeeklyResetTimestamp(newResetTimestampVal);
      };
      
      // Use setTimeout to batch state updates and prevent cascading effects
      setTimeout(updates, 10);
      
      console.log(`✅ Weekly reset complete. New week: ${newCurrentWeekKey}`);
    } catch (error) {
      console.error('❌ Error during weekly reset:', error);
    }
  }, [userCode, isLoggedIn]); // Simplified dependencies

  const handleExternalWeeklyReset = useCallback(async (endedRealWeekKey) => {
    console.log(`Handle External (Real) Weekly Reset. Ended week: ${endedRealWeekKey}`);
    
    // Prevent multiple simultaneous resets
    if (handleExternalWeeklyReset._isRunning) {
      console.log('Weekly reset already in progress, skipping...');
      return;
    }
    handleExternalWeeklyReset._isRunning = true;
    
    try {
      if (simulatedWeeksForward > 0) {
        console.warn("Real weekly reset occurred during simulation. Reverting simulation first.");
        // Revert simulation without triggering its own full reset actions again, just state.
        setSimulatedWeeksForward(0);
        setRealCurrentWeekKeySnapshot(null);
      }
      
      const newRealCurrentWeekKey = getRealCurrentWeekKeyUtil();
      // Calculate timestamp without setting state immediately to prevent loops
      const currentActualTimestamp = calculateAndSetActualLastResetTimestampSnapshot(); 
      
      // Update the snapshot state separately to avoid circular dependencies
      updateLastResetTimestamp(currentActualTimestamp);
      
      console.log(`Processing real reset. Ended: ${endedRealWeekKey}, New Real Current: ${newRealCurrentWeekKey}, New Real Timestamp: ${new Date(currentActualTimestamp)}`);
      await performWeeklyResetActions(endedRealWeekKey, newRealCurrentWeekKey, currentActualTimestamp);
      
    } finally {
      // Clear the running flag after completion
      setTimeout(() => {
        handleExternalWeeklyReset._isRunning = false;
      }, 100);
    }
  }, [simulatedWeeksForward, performWeeklyResetActions, calculateAndSetActualLastResetTimestampSnapshot, updateLastResetTimestamp]);

  const simulateWeekForward = useCallback(async () => {
    console.log('🔮 Starting safe week forward simulation...');
    
    try {
      let previousEffectiveWeekKey;
      let currentRealKeySnap = realCurrentWeekKeySnapshot;
      let currentActualTsSnap = actualLastResetTimestampSnapshot;

      if (simulatedWeeksForward === 0) {
        // First simulation - snapshot current state
        currentRealKeySnap = getRealCurrentWeekKeyUtil();
        currentActualTsSnap = lastWeeklyResetTimestamp === 0 ?
          calculateAndSetActualLastResetTimestampSnapshot() : lastWeeklyResetTimestamp;
        
        setRealCurrentWeekKeySnapshot(currentRealKeySnap);
        setActualLastResetTimestampSnapshot(currentActualTsSnap);
        previousEffectiveWeekKey = currentRealKeySnap;
      } else {
        // Continuing simulation - validate snapshots
        if (!currentRealKeySnap || currentActualTsSnap === null) {
          console.error("🚨 Simulation snapshots corrupted. Aborting simulation.");
          return;
        }
        const { getWeekKeyOffset } = await import('../utils/weekUtils');
        previousEffectiveWeekKey = getWeekKeyOffset(simulatedWeeksForward, currentRealKeySnap);
      }

      const newSimulatedCount = simulatedWeeksForward + 1;
      const { getWeekKeyOffset } = await import('../utils/weekUtils');
      const newSimulatedWeekKey = getWeekKeyOffset(newSimulatedCount, currentRealKeySnap);
      
      // SAFE: Calculate new timestamp without affecting real timestamp
      const newSimulatedResetTimestamp = currentActualTsSnap + newSimulatedCount * 7 * 24 * 60 * 60 * 1000;
      
      console.log(`🔮 Simulating Week +1: From ${previousEffectiveWeekKey} to ${newSimulatedWeekKey}`);
      
      // Update simulation count first
      setSimulatedWeeksForward(newSimulatedCount);
      
      // SAFE: Perform simulation actions without affecting database or pitched_items
      await performSafeSimulationActions(previousEffectiveWeekKey, newSimulatedWeekKey, newSimulatedResetTimestamp);
      
    } catch (error) {
      console.error('🚨 Error during week simulation:', error);
      // Reset simulation state on error
      setSimulatedWeeksForward(0);
      setRealCurrentWeekKeySnapshot(null);
      setActualLastResetTimestampSnapshot(null);
    }
  }, [simulatedWeeksForward, realCurrentWeekKeySnapshot, actualLastResetTimestampSnapshot, lastWeeklyResetTimestamp, calculateAndSetActualLastResetTimestampSnapshot, performSafeSimulationActions]);

  const revertWeekSimulation = useCallback(async (forceRevert = false) => {
    if (simulatedWeeksForward === 0 && !forceRevert) {
      console.log('🔮 No simulation to revert');
      return;
    }
    
    console.log('🔄 Reverting safe week simulation...');
    
    try {
      let lastSimulatedEffectiveWeekKey;
      let restoredRealWeek;
      let restoredRealTimestamp;

      if (!realCurrentWeekKeySnapshot || actualLastResetTimestampSnapshot === null) {
        console.warn("🚨 Cannot revert simulation: no snapshot data. Restoring to real state.");
        lastSimulatedEffectiveWeekKey = currentOperatingWeekKey;
        restoredRealWeek = getRealCurrentWeekKeyUtil();
        restoredRealTimestamp = calculateAndSetActualLastResetTimestampSnapshot();
      } else {
        const { getWeekKeyOffset } = await import('../utils/weekUtils');
        lastSimulatedEffectiveWeekKey = getWeekKeyOffset(simulatedWeeksForward, realCurrentWeekKeySnapshot);
        restoredRealWeek = realCurrentWeekKeySnapshot;
        restoredRealTimestamp = actualLastResetTimestampSnapshot;
      }

      console.log(`🔄 Reverting from ${lastSimulatedEffectiveWeekKey} back to real week ${restoredRealWeek}`);
      
      // Reset simulation count first
      setSimulatedWeeksForward(0);
      
      // SAFE: Perform revert actions without affecting database or pitched_items
      await performSafeRevertActions(lastSimulatedEffectiveWeekKey, restoredRealWeek, restoredRealTimestamp);
      
      // Clear snapshots
      setRealCurrentWeekKeySnapshot(null);
      setActualLastResetTimestampSnapshot(null);
      
    } catch (error) {
      console.error('🚨 Error during simulation revert:', error);
      // Force clean state on error
      setSimulatedWeeksForward(0);
      setRealCurrentWeekKeySnapshot(null);
      setActualLastResetTimestampSnapshot(null);
      setCurrentOperatingWeekKey(getRealCurrentWeekKeyUtil());
    }
  }, [simulatedWeeksForward, realCurrentWeekKeySnapshot, actualLastResetTimestampSnapshot, currentOperatingWeekKey, calculateAndSetActualLastResetTimestampSnapshot, performSafeRevertActions]);
  
  const isWeekSimulated = simulatedWeeksForward > 0;

  // FIXED: Data loading effect - prevent cascading loops
  useEffect(() => {
    if (!userCode || !isLoggedIn) {
      setCharacterBossSelections([]);
      setChecked({});
      setError('');
      return;
    }

    let isMounted = true;
    let isLoading = false; // Prevent multiple simultaneous loads
    
    const loadData = async () => {
      if (isLoading) return;
      isLoading = true;
      
      try {
        setIsLoading(true);
        setError('');
        
        // Load ONLY from user_boss_data table (new system)
        try {
          const { fetchCurrentWeekData } = await import('../../services/userWeeklyDataService.js');
          const weekDataResult = await fetchCurrentWeekData(userCode);
          
          if (weekDataResult.success && weekDataResult.data) {
            const weeklyData = weekDataResult.data;
            
            // Convert user_boss_data format to characterBossSelections format
            const characters = [];
            const charMap = weeklyData.char_map || {};
            const bossConfig = weeklyData.boss_config || {};
            
            // Import boss code mapping utility
            const { parseBossConfigStringToFrontend } = await import('../utils/bossCodeMapping.js');
            
            Object.entries(charMap).forEach(([index, name]) => {
              const character = {
                name,
                index: parseInt(index),
                bosses: []
              };
              
              // Parse boss config for this character using new mapping utility
              const configString = bossConfig[index] || '';
              if (configString) {
                try {
                  const bosses = parseBossConfigStringToFrontend(configString);
                  character.bosses = bosses;
                } catch (error) {
                  console.error('Error parsing boss config:', error);
                  character.bosses = [];
                }
              }
              
              characters.push(character);
            });
            
            // Sort by index
            characters.sort((a, b) => a.index - b.index);
            setCharacterBossSelections(characters);
            
            // Load checked state from user_boss_data weekly_clears
            const reconstructedChecked = {};
            const weeklyClearData = weeklyData.weekly_clears || {};
            
            // Fetch boss registry once for all conversions
            let bossRegistryData = [];
            try {
              const { fetchBossRegistry } = await import('../../services/bossRegistryService.js');
              const registryResult = await fetchBossRegistry();
              if (registryResult.success) {
                bossRegistryData = registryResult.data;
              }
            } catch (error) {
              console.error('Error fetching boss registry for checked state conversion:', error);
            }
            
            // Convert boss registry IDs back to UI format
            for (const [charIndex, clearsString] of Object.entries(weeklyClearData)) {
              const characterName = charMap[charIndex];
              if (characterName && clearsString) {
                const charKey = `${characterName}-${charIndex}`;
                const clearedBossIds = clearsString.split(',').map(id => id.trim()).filter(id => id);
                
                if (clearedBossIds.length > 0) {
                  reconstructedChecked[charKey] = {};
                  
                  // Convert each boss registry ID to UI format
                  for (const bossId of clearedBossIds) {
                    let bossEntry = null;
                    
                    // Try to parse as numeric ID first (new format)
                    const numericId = parseInt(bossId);
                    if (!isNaN(numericId)) {
                      bossEntry = bossRegistryData.find(entry => entry.id === numericId);
                      if (bossEntry) {
                        const uiKey = `${bossEntry.boss_name}-${bossEntry.difficulty}`;
                        reconstructedChecked[charKey][uiKey] = true;
                        continue;
                      }
                    }
                    
                    // If not found as numeric ID, try as boss code (old format for backward compatibility)
                    if (bossId.includes('-')) {
                      const [bossCode, diffCode] = bossId.split('-');
                      bossEntry = bossRegistryData.find(entry => 
                        entry.boss_code === bossCode && entry.difficulty_code === diffCode
                      );
                      if (bossEntry) {
                        const uiKey = `${bossEntry.boss_name}-${bossEntry.difficulty}`;
                        reconstructedChecked[charKey][uiKey] = true;
                        continue;
                      }
                    }
                    
                    // If still not found, log warning
                    console.warn(`Boss entry not found for ID/code: ${bossId}`);
                  }
                }
              }
            }
            
            debugSetChecked(reconstructedChecked);
            console.log('✅ Loaded characters and checked state from user_boss_data:', characters.length);
          } else if (weekDataResult.success && weekDataResult.data === null) {
            // Explicitly handle the case where no user_boss_data row exists yet
            // This is normal for new accounts or weeks where no characters have been created
            console.log('ℹ️ No user_boss_data found for current week - starting with empty state');
            setCharacterBossSelections([]);
            debugSetChecked({});
          } else {
            // Handle actual errors
            console.error('Error fetching weekly data:', weekDataResult.error);
            setCharacterBossSelections([]);
            debugSetChecked({});
          }
        } catch (weekDataError) {
          console.error('Unexpected error loading weekly data:', weekDataError);
          setCharacterBossSelections([]);
          debugSetChecked({});
        }

        // Initialize timestamp for new users only once
        if (lastWeeklyResetTimestamp === 0) {
          const now = new Date();
          const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          let dayOfWeek = today.getUTCDay(); // 0 (Sun) to 6 (Sat)
          let daysToSubtract = (dayOfWeek - 4 + 7) % 7; // 4 is Thursday
          today.setUTCDate(today.getUTCDate() - daysToSubtract);
          today.setUTCHours(0,0,0,0);
          const timestamp = today.getTime();
          // Use a longer delay to prevent cascading effects
          setTimeout(() => {
            if (isMounted) {
              setLastWeeklyResetTimestamp(timestamp);
            }
          }, 200);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load user data:', err);
          setError('Failed to load data. Please try again.');
          setCharacterBossSelections([]);
          debugSetChecked({});
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isLoading = false;
      }
    };

    loadData();
    return () => { 
      isMounted = false; 
      isLoading = false;
    };
  }, [userCode, isLoggedIn, lastWeeklyResetTimestamp]); // Include lastWeeklyResetTimestamp to prevent redundant timestamp initialization

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeout.current) {
        clearTimeout(undoTimeout.current);
      }
    };
  }, []);

  // Function to add a new character - NOW USES NEW SERVICE
  const addCharacter = async () => {
    if (characterBossSelections.length >= LIMITS.CHARACTER_CAP) {
      setError(`Character limit reached (${LIMITS.CHARACTER_CAP}).`);
      setTimeout(() => setError(''), COOLDOWNS.ERROR_MESSAGE);
      return;
    }
    if (!newCharName.trim()) {
      setError('Character name cannot be empty.');
      setTimeout(() => setError(''), COOLDOWNS.ERROR_MESSAGE);
      return;
    }
    // Check if character name already exists (case-insensitive)
    if (characterBossSelections.some(char => char.name.toLowerCase() === newCharName.trim().toLowerCase())) {
      setError(`Character name '${newCharName.trim()}' already exists.`);
      setTimeout(() => setError(''), COOLDOWNS.ERROR_MESSAGE);
      return;
    }

    // Check account-wide crystal cap before adding new character
    const totalCurrentCrystals = characterBossSelections.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0);
    if (totalCurrentCrystals >= LIMITS.CRYSTAL_CAP) {
      setError(`Cannot add character: Account crystal limit reached (${LIMITS.CRYSTAL_CAP}).`);
      setTimeout(() => setError(''), COOLDOWNS.ERROR_MESSAGE);
      return;
    }

    try {
      // Use new service to add character to user_boss_data table
      const { addCharacterToWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const result = await addCharacterToWeeklySetup(userCode, currentWeekStart, newCharName.trim());
      
      if (!result.success) {
        setError(result.error || 'Failed to add character');
        setTimeout(() => setError(''), COOLDOWNS.ERROR_MESSAGE);
        return;
      }

      // Update local state to match new structure
      const newCharacter = {
        name: newCharName.trim(),
        bosses: [],
        index: result.characterIndex || 0
      };
      const updatedCharacters = [...characterBossSelections, newCharacter];
      setCharacterBossSelections(updatedCharacters);
      setNewCharName('');
      setSelectedCharIdx(updatedCharacters.length - 1);
      setError('');
      
      // Trigger a force update to ensure Navbar reflects character count change
      forceUpdate();
      
      console.log('✅ Character added to user_boss_data table:', newCharacter.name);
      
    } catch (error) {
      console.error('Error adding character:', error);
      setError('Failed to add character. Please try again.');
      setTimeout(() => setError(''), COOLDOWNS.ERROR_MESSAGE);
    }
  };

  // Function to remove a character
  const removeCharacter = async (idx) => {
    const charToRemove = characterBossSelections[idx];
    if (!charToRemove) return;

    // Store data for potential undo
    setUndoData({ removedChar: charToRemove, originalIndex: idx, originalSelections: [...characterBossSelections] });
    setShowUndo(true);

    // Clear any existing undo timeout
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current);
    }

    // Set new timeout for undo
    undoTimeout.current = setTimeout(() => {
      setShowUndo(false);
      setUndoData(null);
    }, COOLDOWNS.UNDO_TIMEOUT);

    // Remove the character from the local state
    const updatedCharacters = characterBossSelections.filter((_, i) => i !== idx);
    setCharacterBossSelections(updatedCharacters);

    // Clean up checked state for the removed character
    const cleanedChecked = { ...checked };
    const charKeyToRemove = `${charToRemove.name}-${charToRemove.index}`;
    if (cleanedChecked[charKeyToRemove]) {
      delete cleanedChecked[charKeyToRemove];
      debugSetChecked(cleanedChecked);
    }
    
    // Update selected index if necessary
    if (selectedCharIdx === idx) {
      setSelectedCharIdx(updatedCharacters.length > 0 ? Math.max(0, idx - 1) : null);
    } else if (selectedCharIdx > idx) {
      setSelectedCharIdx(selectedCharIdx - 1);
    }
    
    // Remove character from user_boss_data using new service
    try {
      const { removeCharacterFromWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const removeResult = await removeCharacterFromWeeklySetup(userCode, currentWeekStart, charToRemove.index);
      
      if (!removeResult.success) {
        console.error('Error removing character from user_boss_data:', removeResult.error);
        setError('Failed to remove character from database.');
      } else {
        console.log('✅ Character removed from user_boss_data table');
      }
    } catch (serviceError) {
      console.error('Error calling remove character service:', serviceError);
      setError('Failed to remove character.');
    }
    
    // Remove associated pitched_items from database
    try {
      const { purgePitchedRecords } = await import('../../services/utilityService.js');
      await purgePitchedRecords(userCode, charToRemove.name, charToRemove.index);
    } catch (purgeError) {
      console.error('Error purging pitched records for removed character:', purgeError);
      // Non-critical, continue
    }
    
    // Trigger a force update to ensure Navbar reflects character count change
    forceUpdate();
  };

  // Function to update character name - UPDATED to use new service
  const updateCharacterName = async (idx, newName) => {
    const character = characterBossSelections[idx];
    if (!character) return;

    try {
      // Update in user_boss_data using new service
      const { updateCharacterNameInWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const result = await updateCharacterNameInWeeklySetup(userCode, currentWeekStart, character.index, newName);
      
      if (!result.success) {
        setError(result.error || 'Failed to update character name');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Update local state
      const updatedCharacters = [...characterBossSelections];
      updatedCharacters[idx].name = newName;
      setCharacterBossSelections(updatedCharacters);
      
      console.log('✅ Character name updated in user_boss_data table');
    } catch (error) {
      console.error('Error updating character name:', error);
      setError('Failed to update character name');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Function to toggle boss selection for a character - UPDATED to save to database
  const toggleBoss = async (charIdx, bossName, difficulty) => {
    const character = characterBossSelections[charIdx];
    if (!character) return;

    const updatedCharacters = [...characterBossSelections];
    const char = updatedCharacters[charIdx];
    const bossIndex = char.bosses.findIndex(b => b.name === bossName);

    // Calculate account-wide total crystals across all characters
    let totalCrystals = updatedCharacters.reduce((sum, c) => sum + (c.bosses ? c.bosses.length : 0), 0);

    if (difficulty) { // Adding or changing difficulty
      if (bossIndex !== -1) { // Boss already exists, update difficulty
        char.bosses[bossIndex].difficulty = difficulty;
      } else { // New boss, add it
        if (totalCrystals >= LIMITS.CRYSTAL_CAP) {
          setShowCrystalCapError(true);
          setTimeout(() => setShowCrystalCapError(false), COOLDOWNS.ERROR_MESSAGE_SHORT);
          return; // Prevent adding more bosses
        }
        char.bosses.push({ name: bossName, difficulty, partySize: 1 });
        totalCrystals++; // Increment crystal count
      }
    } else { // Removing boss (difficulty is empty or null)
      if (bossIndex !== -1) {
        char.bosses.splice(bossIndex, 1);
        totalCrystals--; // Decrement crystal count
      }
    }
    
    // Update local state immediately for responsive UI
    setCharacterBossSelections(updatedCharacters);
    
    // Save to database
    try {
      const { convertBossesToConfigString } = await import('../utils/bossCodeMapping.js');
      const { updateCharacterBossConfigInWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const bossConfigString = await convertBossesToConfigString(char.bosses);
      
      const result = await updateCharacterBossConfigInWeeklySetup(
        userCode,
        currentWeekStart,
        character.index,
        bossConfigString
      );
      
      if (!result.success) {
        console.error('Failed to save boss configuration:', result.error);
        setError('Failed to save boss configuration. Please try again.');
        setTimeout(() => setError(''), 3000);
      } else {
        console.log('✅ Boss configuration saved to database');
      }
      
    } catch (error) {
      console.error('Error saving boss configuration:', error);
      setError('Failed to save boss configuration. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Function to batch set bosses for a character (used by Quick Select) - UPDATED to save to database
  const batchSetBosses = async (charIdx, newBosses) => {
    const character = characterBossSelections[charIdx];
    if (!character) return;

    const updatedCharacters = [...characterBossSelections];

    // Calculate account-wide total crystals excluding the current character
    let totalCrystalsExcludingCurrentChar = updatedCharacters.reduce((sum, char, index) => {
      if (index !== charIdx) {
        return sum + (char.bosses ? char.bosses.length : 0);
      }
      return sum;
    }, 0);

    if (totalCrystalsExcludingCurrentChar + newBosses.length > LIMITS.CRYSTAL_CAP) {
      setShowCrystalCapError(true);
      setTimeout(() => setShowCrystalCapError(false), COOLDOWNS.ERROR_MESSAGE_SHORT);
      return; // Prevent applying if it exceeds crystal cap
    }
    
    // Update local state immediately for responsive UI
    updatedCharacters[charIdx].bosses = newBosses;
    setCharacterBossSelections(updatedCharacters);
    
    // Save to database
    try {
      const { convertBossesToConfigString } = await import('../utils/bossCodeMapping.js');
      const { updateCharacterBossConfigInWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const bossConfigString = await convertBossesToConfigString(newBosses);
      
      const result = await updateCharacterBossConfigInWeeklySetup(
        userCode,
        currentWeekStart,
        character.index,
        bossConfigString
      );
      
      if (!result.success) {
        console.error('Failed to save Quick Select configuration:', result.error);
        setError('Failed to save boss configuration. Please try again.');
        setTimeout(() => setError(''), 3000);
      } else {
        console.log('✅ Quick Select configuration saved to database');
      }
      
    } catch (error) {
      console.error('Error saving Quick Select configuration:', error);
      setError('Failed to save boss configuration. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Function to update party size for a boss - UPDATED to save to database
  const updatePartySize = async (charIdx, bossName, difficulty, newSize) => {
    const character = characterBossSelections[charIdx];
    if (!character) return;

    try {
      // Update local state for immediate UI feedback
      const updatedCharacters = [...characterBossSelections];
      const char = updatedCharacters[charIdx];
      const boss = char.bosses.find(b => b.name === bossName && b.difficulty === difficulty);
      if (boss) {
        boss.partySize = newSize;
        setCharacterBossSelections(updatedCharacters);
      }

      // Save updated boss configuration to database
      const { convertBossesToConfigString } = await import('../utils/bossCodeMapping.js');
      const { updateCharacterBossConfigInWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const bossConfigString = await convertBossesToConfigString(char.bosses);
      
      const result = await updateCharacterBossConfigInWeeklySetup(
        userCode,
        currentWeekStart,
        character.index,
        bossConfigString
      );
      
      if (!result.success) {
        console.error('Failed to save party size update:', result.error);
        setError('Failed to save party size change. Please try again.');
        setTimeout(() => setError(''), 3000);
      } else {
        console.log(`✅ Party size updated to ${newSize} for ${bossName} ${difficulty}`);
      }
      
    } catch (error) {
      console.error('Error updating party size:', error);
      setError('Failed to save party size change. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Reset selectedCharIdx if out of bounds
  useEffect(() => {
    if (selectedCharIdx >= characterBossSelections.length) {
      setSelectedCharIdx(Math.max(0, characterBossSelections.length - 1));
    }
  }, [characterBossSelections.length, selectedCharIdx]);

  // Add missing functions that InputPage expects
  const handleCharacterChange = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    setSelectedCharIdx(newIndex);
  };

  const handleUndo = () => {
    if (undoData) {
      setCharacterBossSelections(undoData.originalSelections);
      setSelectedCharIdx(undoData.originalIndex);
      setShowUndo(false);
      setUndoData(null);
      if (undoTimeout.current) {
        clearTimeout(undoTimeout.current);
      }
    }
  };

  return {
    // Core character data
    characterBossSelections,
    setCharacterBossSelections,
    
    // Character management
    newCharName,
    setNewCharName,
    selectedCharIdx,
    setSelectedCharIdx,
    handleCharacterChange,
    addCharacter,
    removeCharacter,
    updateCharacterName,
    
    // Boss selection and calculations (for InputPage - configuration)
    checked,
    setChecked: debugSetChecked,
    toggleBoss, // This is for boss CONFIGURATION, not tracking clears
    batchSetBosses,
    updatePartySize,
    charTotal,
    overallTotal,
    sortedBossData,
    totalBossCount,
    getAvailablePartySizes,
    getBossDifficulties,
    
    // UI states
    error,
    setError,
    isLoading,
    showCrystalCapError,
    setShowCrystalCapError,
    
    // Week management and simulation
    lastWeeklyResetTimestamp,
    weekKey: currentOperatingWeekKey,
    simulateWeekForward,
    revertWeekSimulation,
    isWeekSimulated,
    handleExternalWeeklyReset,
    
    // Undo functionality
    showUndo,
    setShowUndo,
    undoData,
    setUndoData,
    handleUndo,
    
    // Legacy compatibility (for pages that still reference these)
    fullUserData: null, // Deprecated - use new services instead
    preservingCheckedStateRef,
    
    // File/import states (if used by InputPage)
    importError,
    setImportError,
    importSuccess,
    setImportSuccess,
    fileInputRef,
    cloneError,
    setCloneError,
  };
} 