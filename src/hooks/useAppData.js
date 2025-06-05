import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { useAuthentication } from '../../hooks/useAuthentication';
import { useBossCalculations } from './useBossCalculations';
import { LIMITS, COOLDOWNS, ANIMATION_DURATIONS, STORAGE_KEYS } from '../constants';
import { getCurrentWeekKey as getRealCurrentWeekKeyUtil } from '../utils/weekUtils';
import { logger } from '../utils/logger';
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

  // Combined data loading state
  const [dataLoadingState, setDataLoadingState] = useState({
    isLoading: true,
    hasLoaded: false,
    error: null
  });

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

  // COMBINED data loading effect - prevent cascading loops and double loads
  useEffect(() => {
    // Enhanced guard: Don't run effect during logout transition
    if (!userCode || !isLoggedIn) {
      // Only clear state if we actually have data to clear (prevent unnecessary re-renders)
      setCharacterBossSelections(prev => prev.length > 0 ? [] : prev);
      setChecked(prev => Object.keys(prev).length > 0 ? {} : prev);
      setError(prev => prev ? '' : prev);
      setDataLoadingState(prev => 
        prev.isLoading || !prev.hasLoaded || prev.error ? 
        { isLoading: false, hasLoaded: true, error: null } : prev
      );
      return;
    }

    let isMounted = true;
    let isLoadingData = false; // Prevent multiple simultaneous loads
    let abortController = new AbortController(); // Add abort controller for async operations
    
    const loadAllData = async () => {
      // Multiple guards to prevent loading during logout
      if (!userCode || !isLoggedIn || isLoadingData) {
        logger.debug('useAppData: Aborting data load - auth state invalid');
        return;
      }
      
      // Check abort signal before starting
      if (abortController.signal.aborted) {
        logger.debug('useAppData: Aborting data load - operation cancelled');
        return;
      }
      
      isLoadingData = true;
      
      try {
        // Final check before setting loading state
        if (!userCode || !isLoggedIn || !isMounted) {
          logger.debug('useAppData: Aborting data load before state update');
          return;
        }
        
        setDataLoadingState({ isLoading: true, hasLoaded: false, error: null });
        setError('');
        
        // Double-check auth state before making any API calls
        if (!userCode || !isLoggedIn || abortController.signal.aborted) {
          logger.info('useAppData: Auth state changed during load, aborting');
          return;
        }
        
        // Load boss data and user data in parallel
        const [bossDataResult, weekDataResult] = await Promise.all([
          (async () => {
            try {
              // Check abort signal before each async operation
              if (abortController.signal.aborted || !userCode || !isLoggedIn) return { success: false, error: 'Aborted' };
              
              const { getBossDataForFrontend } = await import('../../services/bossRegistryService.js');
              // Only force refresh boss registry if we have a user and are starting fresh
              // Don't force refresh during logout/cleanup operations
              const shouldForceRefresh = userCode && isLoggedIn;
              return await getBossDataForFrontend(shouldForceRefresh);
            } catch (error) {
              if (abortController.signal.aborted) return { success: false, error: 'Aborted' };
              logger.error('useAppData: Error loading boss data', { error });
              return { success: false, error: error.message };
            }
          })(),
          (async () => {
            try {
              // Check abort signal before each async operation
              if (abortController.signal.aborted || !userCode || !isLoggedIn) return { success: false, error: 'Aborted' };
              
              const { fetchCurrentWeekData } = await import('../../services/userWeeklyDataService.js');
              return await fetchCurrentWeekData(userCode);
            } catch (error) {
              if (abortController.signal.aborted) return { success: false, error: 'Aborted' };
              logger.error('useAppData: Error loading weekly data', { error });
              return { success: false, error: error.message };
            }
          })()
        ]);
        
        // Final auth check before processing results
        if (!isMounted || !userCode || !isLoggedIn || abortController.signal.aborted) {
          logger.info('useAppData: Component unmounted or auth changed, skipping data processing');
          return;
        }
        
        // Process boss data
        if (bossDataResult.success && !abortController.signal.aborted) {
          setBossData(bossDataResult.data);
          logger.info('useAppData: Loaded fresh boss data from database', {
            dataLength: bossDataResult.data.length
          });
        } else if (!abortController.signal.aborted) {
          logger.error('useAppData: Failed to load boss data', { error: bossDataResult.error });
          setBossData([]);
        }
        
        // Process user weekly data (with abort checks throughout)
        if (weekDataResult.success && weekDataResult.data && !abortController.signal.aborted) {
          const weeklyData = weekDataResult.data;
          
          // Convert user_boss_data format to characterBossSelections format
          const characters = [];
          const charMap = weeklyData.char_map || {};
          const bossConfig = weeklyData.boss_config || {};
          
          // Import boss code mapping utility
          const { parseBossConfigStringToFrontend } = await import('../utils/bossCodeMapping.js');
          
          // Check abort before processing characters
          if (abortController.signal.aborted || !userCode || !isLoggedIn) return;
          
          Object.entries(charMap).forEach(([index, name]) => {
            if (abortController.signal.aborted) return; // Check in loop
            
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
                logger.error('useAppData: Error parsing boss config', { error });
                character.bosses = [];
              }
            }
            
            characters.push(character);
          });
          
          // Sort by index
          characters.sort((a, b) => a.index - b.index);
          
          // Load checked state from user_boss_data weekly_clears
          const reconstructedChecked = {};
          const weeklyClearData = weeklyData.weekly_clears || {};
          
          logger.debug('useAppData: Converting weekly_clears to checked state', {
            weeklyClearData,
            charMapEntries: Object.entries(charMap).length,
            weeklyClearEntries: Object.entries(weeklyClearData).length,
            weeklyClearKeys: Object.keys(weeklyClearData),
            weeklyClearSample: Object.fromEntries(Object.entries(weeklyClearData).slice(0, 2))
          });
          
          // Check abort before fetching boss registry
          if (abortController.signal.aborted || !userCode || !isLoggedIn) return;
          
          // Fetch boss registry once for all conversions
          let bossRegistryData = [];
          try {
            const { fetchBossRegistry } = await import('../../services/bossRegistryService.js');
            const registryResult = await fetchBossRegistry();
            if (registryResult.success && !abortController.signal.aborted) {
              bossRegistryData = registryResult.data;
              logger.debug('useAppData: Boss registry loaded', { 
                entriesCount: bossRegistryData.length,
                sampleEntries: bossRegistryData.slice(0, 3).map(entry => ({
                  id: entry.id,
                  boss_name: entry.boss_name,
                  difficulty: entry.difficulty,
                  boss_code: entry.boss_code,
                  difficulty_code: entry.difficulty_code
                }))
              });
            }
          } catch (error) {
            if (!abortController.signal.aborted) {
              logger.error('useAppData: Error fetching boss registry for checked state conversion', error);
            }
          }
          
          // Check abort before processing weekly clears
          if (abortController.signal.aborted || !userCode || !isLoggedIn) return;
          
          // Convert boss registry IDs back to UI format
          for (const [charIndex, clearsString] of Object.entries(weeklyClearData)) {
            if (abortController.signal.aborted) break; // Check in loop
            
            const characterName = charMap[charIndex];
            if (characterName && clearsString) {
              const charKey = `${characterName}-${charIndex}`;
              const clearedBossIds = clearsString.split(',').map(id => id.trim()).filter(id => id);
              
              logger.debug('useAppData: Processing weekly clears for character', {
                charIndex,
                characterName,
                charKey,
                clearedBossIds,
                clearsString,
                clearedBossIdsCount: clearedBossIds.length
              });
              
              if (clearedBossIds.length > 0) {
                reconstructedChecked[charKey] = {};
                
                // Convert each boss registry ID to UI format
                for (const bossId of clearedBossIds) {
                  if (abortController.signal.aborted) break; // Check in inner loop
                  
                  let bossEntry = null;
                  
                  // Try to parse as numeric ID first (new format)
                  const numericId = parseInt(bossId);
                  if (!isNaN(numericId)) {
                    bossEntry = bossRegistryData.find(entry => entry.id === numericId);
                    if (bossEntry) {
                      const uiKey = `${bossEntry.boss_name}-${bossEntry.difficulty}`;
                      reconstructedChecked[charKey][uiKey] = true;
                      logger.debug('useAppData: Converted boss clear (numeric ID)', {
                        bossId: numericId,
                        uiKey,
                        bossName: bossEntry.boss_name,
                        difficulty: bossEntry.difficulty
                      });
                      continue;
                    } else {
                      logger.warn('useAppData: Boss entry not found for numeric ID', { bossId: numericId });
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
                      logger.debug('useAppData: Converted boss clear (boss code)', {
                        bossId,
                        uiKey,
                        bossName: bossEntry.boss_name,
                        difficulty: bossEntry.difficulty
                      });
                      continue;
                    } else {
                      logger.warn('useAppData: Boss entry not found for boss code', { bossId });
                    }
                  }
                  
                  // If still not found, log warning with more detail
                  logger.warn('useAppData: Boss entry not found for ID/code', { 
                    bossId, 
                    bossIdType: typeof bossId,
                    isNumeric: !isNaN(parseInt(bossId)),
                    includesDash: bossId.includes('-'),
                    bossRegistryCount: bossRegistryData.length
                  });
                }
                
                logger.debug('useAppData: Character weekly clears processed', {
                  charKey,
                  processedBossIds: clearedBossIds,
                  resultingUIKeys: Object.keys(reconstructedChecked[charKey]),
                  uiKeysCount: Object.keys(reconstructedChecked[charKey]).length
                });
              } else {
                logger.debug('useAppData: No cleared boss IDs for character', { charIndex, characterName });
              }
            } else {
              logger.debug('useAppData: Skipping weekly clears entry', {
                charIndex,
                characterName,
                hasClearsString: !!clearsString,
                clearsString
              });
            }
          }
          
          // Final check before updating state
          if (isMounted && !abortController.signal.aborted && userCode && isLoggedIn) {
            setCharacterBossSelections(characters);
            debugSetChecked(reconstructedChecked);
            
            logger.info('useAppData: Loaded characters and checked state from user_boss_data', {
              charactersCount: characters.length,
              checkedKeys: Object.keys(reconstructedChecked).length,
              sampleCheckedKeys: Object.keys(reconstructedChecked).slice(0, 3),
              reconstructedChecked: Object.keys(reconstructedChecked).reduce((sample, key) => {
                sample[key] = Object.keys(reconstructedChecked[key]).length;
                return sample;
              }, {}),
              finalReconstructedChecked: reconstructedChecked
            });
          }
        } else if (weekDataResult.success && weekDataResult.data === null && !abortController.signal.aborted) {
          // Explicitly handle the case where no user_boss_data row exists yet
          logger.info('useAppData: No user_boss_data found for current week - starting with empty state');
          if (isMounted && userCode && isLoggedIn) {
            setCharacterBossSelections([]);
            debugSetChecked({});
          }
        } else if (!abortController.signal.aborted) {
          // Handle actual errors
          logger.error('useAppData: Error fetching weekly data', weekDataResult.error);
          if (isMounted && userCode && isLoggedIn) {
            setCharacterBossSelections([]);
            debugSetChecked({});
          }
        }
        
        if (isMounted && !abortController.signal.aborted && userCode && isLoggedIn) {
          setDataLoadingState({ isLoading: false, hasLoaded: true, error: null });
        }
      } catch (err) {
        if (!abortController.signal.aborted && isMounted && userCode && isLoggedIn) {
          logger.error('useAppData: Failed to load user data', { error: err });
          setError('Failed to load data. Please try again.');
          setCharacterBossSelections([]);
          debugSetChecked({});
          setDataLoadingState({ isLoading: false, hasLoaded: true, error: err.message });
        }
      } finally {
        isLoadingData = false;
      }
    };

    loadAllData();
    return () => { 
      isMounted = false; 
      isLoadingData = false;
      abortController.abort(); // Abort any ongoing async operations
    };
  }, [userCode, isLoggedIn]); // FIXED: Removed lastWeeklyResetTimestamp to prevent infinite loop

  // Listen for authentication data refresh events for optimistic updates
  useEffect(() => {
    const handleAuthDataRefresh = async (event) => {
      const { userCode: newUserCode, action } = event.detail;
      
      // Enhanced guards to prevent processing during logout
      if (!newUserCode || (action !== 'login' && action !== 'create')) {
        logger.debug('useAppData: Ignoring auth refresh event', { newUserCode, action });
        return;
      }
      
      // Don't process if we're currently in a logout state
      if (!isLoggedIn && action === 'login') {
        logger.debug('useAppData: Ignoring login refresh event when not logged in');
        return;
      }
      
      // Additional guard: don't process if userCode doesn't match
      if (userCode && userCode !== newUserCode) {
        logger.debug('useAppData: Ignoring auth refresh event - userCode mismatch', { 
          currentUserCode: userCode, 
          newUserCode 
        });
        return;
      }
      
      logger.info('useAppData: Received auth data refresh event', { newUserCode, action });
      
      // Force immediate data refresh for better UX
      try {
        // Guard against processing if user is no longer logged in
        if (!isLoggedIn || !newUserCode) {
          logger.debug('useAppData: Aborting auth refresh - user not logged in');
          return;
        }
        
        setDataLoadingState({ isLoading: true, hasLoaded: false, error: null });
        setError('');
        
        // Load fresh data immediately
        const [bossDataResult, weekDataResult] = await Promise.all([
          (async () => {
            try {
              // Check auth state before import
              if (!isLoggedIn || !newUserCode) return { success: false, error: 'Auth state invalid' };
              
              const { getBossDataForFrontend } = await import('../../services/bossRegistryService.js');
              return await getBossDataForFrontend(true); // Force refresh for new user
            } catch (error) {
              logger.error('useAppData: Error loading boss data on auth refresh', { error });
              return { success: false, error: error.message };
            }
          })(),
          (async () => {
            try {
              // Check auth state before import
              if (!isLoggedIn || !newUserCode) return { success: false, error: 'Auth state invalid' };
              
              const { fetchCurrentWeekData } = await import('../../services/userWeeklyDataService.js');
              return await fetchCurrentWeekData(newUserCode);
            } catch (error) {
              logger.error('useAppData: Error loading weekly data on auth refresh', { error });
              return { success: false, error: error.message };
            }
          })()
        ]);
        
        // Guard against processing results if auth state changed
        if (!isLoggedIn || !newUserCode) {
          logger.debug('useAppData: Aborting auth refresh data processing - auth state changed');
          return;
        }
        
        // Process boss data
        if (bossDataResult.success) {
          setBossData(bossDataResult.data);
          logger.info('useAppData: Loaded fresh boss data on auth refresh');
        }
        
        // For new accounts, initialize empty state, for existing users, load their data
        if (action === 'create') {
          // New account - start with empty state
          setCharacterBossSelections([]);
          debugSetChecked({});
          logger.info('useAppData: Initialized empty state for new account');
        } else if (weekDataResult.success && weekDataResult.data) {
          // Existing account - load their data (same logic as main effect)
          const weeklyData = weekDataResult.data;
          const characters = [];
          const charMap = weeklyData.char_map || {};
          const bossConfig = weeklyData.boss_config || {};
          
          const { parseBossConfigStringToFrontend } = await import('../utils/bossCodeMapping.js');
          
          Object.entries(charMap).forEach(([index, name]) => {
            const character = {
              name,
              index: parseInt(index),
              bosses: []
            };
            
            const configString = bossConfig[index] || '';
            if (configString) {
              try {
                const bosses = parseBossConfigStringToFrontend(configString);
                character.bosses = bosses;
              } catch (error) {
                logger.error('useAppData: Error parsing boss config on auth refresh', { error });
                character.bosses = [];
              }
            }
            
            characters.push(character);
          });
          
          characters.sort((a, b) => a.index - b.index);
          
          // Load checked state
          const reconstructedChecked = {};
          const weeklyClearData = weeklyData.weekly_clears || {};
          
          // Fetch boss registry for conversions
          try {
            const { fetchBossRegistry } = await import('../../services/bossRegistryService.js');
            const registryResult = await fetchBossRegistry();
            if (registryResult.success) {
              const bossRegistryData = registryResult.data;
              
              // Convert boss registry IDs back to UI format
              for (const [charIndex, clearsString] of Object.entries(weeklyClearData)) {
                const characterName = charMap[charIndex];
                if (characterName && clearsString) {
                  const charKey = `${characterName}-${charIndex}`;
                  const clearedBossIds = clearsString.split(',').map(id => id.trim()).filter(id => id);
                  
                  if (clearedBossIds.length > 0) {
                    reconstructedChecked[charKey] = {};
                    
                    for (const bossId of clearedBossIds) {
                      const numericId = parseInt(bossId);
                      if (!isNaN(numericId)) {
                        const bossEntry = bossRegistryData.find(entry => entry.id === numericId);
                        if (bossEntry) {
                          const uiKey = `${bossEntry.boss_name}-${bossEntry.difficulty}`;
                          reconstructedChecked[charKey][uiKey] = true;
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            logger.error('useAppData: Error processing checked state on auth refresh', error);
          }
          
          // Final guard before updating state
          if (isLoggedIn && newUserCode) {
            setCharacterBossSelections(characters);
            debugSetChecked(reconstructedChecked);
            
            logger.info('useAppData: Loaded existing account data on auth refresh', {
              charactersCount: characters.length,
              checkedKeys: Object.keys(reconstructedChecked).length
            });
          }
        } else {
          // No data found for existing account - start with empty state
          if (isLoggedIn && newUserCode) {
            setCharacterBossSelections([]);
            debugSetChecked({});
            logger.info('useAppData: No data found for existing account, initialized empty state');
          }
        }
        
        if (isLoggedIn && newUserCode) {
          setDataLoadingState({ isLoading: false, hasLoaded: true, error: null });
        }
        
      } catch (error) {
        logger.error('useAppData: Error during auth data refresh', { error });
        if (isLoggedIn && newUserCode) {
          setError('Failed to load data after login. Please refresh the page.');
          setDataLoadingState({ isLoading: false, hasLoaded: true, error: error.message });
        }
      }
    };
    
    window.addEventListener('authDataRefresh', handleAuthDataRefresh);
    
    return () => {
      window.removeEventListener('authDataRefresh', handleAuthDataRefresh);
    };
  }, [isLoggedIn, userCode]); // Add userCode dependency for better guard coordination

  // Separate effect for timestamp initialization to prevent loops
  useEffect(() => {
    // Enhanced guard: Only initialize timestamp for valid logged-in users
    if (lastWeeklyResetTimestamp === 0 && userCode && isLoggedIn) {
      // Additional check to ensure we're not in a logout transition
      const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
      if (!currentStoredCode || currentStoredCode !== userCode) {
        logger.debug('useAppData: Skipping timestamp init - logout in progress');
        return;
      }
      
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      let dayOfWeek = today.getUTCDay(); // 0 (Sun) to 6 (Sat)
      let daysToSubtract = (dayOfWeek - 4 + 7) % 7; // 4 is Thursday
      today.setUTCDate(today.getUTCDate() - daysToSubtract);
      today.setUTCHours(0,0,0,0);
      const timestamp = today.getTime();
      
      logger.debug('useAppData: Initializing timestamp for user', { timestamp, userCode });
      
      // Use setTimeout to prevent immediate state update and potential loops
      setTimeout(() => {
        // Final check before setting timestamp
        if (userCode && isLoggedIn && localStorage.getItem(STORAGE_KEYS.USER_CODE) === userCode) {
          setLastWeeklyResetTimestamp(timestamp);
        }
      }, 50);
    }
  }, [lastWeeklyResetTimestamp, userCode, isLoggedIn]); // Separate effect for timestamp

  // SIMPLIFIED: UI-only simulation actions (no database manipulation)
  const performSafeSimulationActions = useCallback(async (endedWeekKey, newCurrentWeekKey, newResetTimestampVal) => {
    logger.info('useAppData: UI simulation', { endedWeekKey, newCurrentWeekKey });
    
    try {
      // Clear local UI state for simulated week
      setChecked({});
      setCurrentOperatingWeekKey(newCurrentWeekKey);
      
      // Update timestamp with delay to prevent cascading effects
      setTimeout(() => {
        setLastWeeklyResetTimestamp(newResetTimestampVal);
      }, 50);
      
      logger.info('useAppData: UI simulation active - Week', { newCurrentWeekKey });
      
    } catch (error) {
      logger.error('useAppData: Error during UI simulation', { error });
    }
  }, [setChecked, setCurrentOperatingWeekKey, setLastWeeklyResetTimestamp]);

  // SIMPLIFIED: UI-only revert actions (no database manipulation)
  const performSafeRevertActions = useCallback(async (lastSimulatedWeekKey, restoredRealWeek, restoredRealTimestamp) => {
    logger.info('useAppData: UI revert', { lastSimulatedWeekKey, restoredRealWeek });
    
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
      
      logger.info('useAppData: UI revert complete - returned to real week', { restoredRealWeek });
      
    } catch (error) {
      logger.error('useAppData: Error during UI revert', { error });
    }
  }, [setChecked, setCurrentOperatingWeekKey, setLastWeeklyResetTimestamp, forceUpdate]);

  // SIMPLIFIED: Weekly reset for new user_boss_data system
  const performWeeklyResetActions = useCallback(async (endedWeekKey, newCurrentWeekKey, newResetTimestampVal) => {
    logger.info('useAppData: Performing weekly reset', { endedWeekKey, newCurrentWeekKey });
    
    try {
      // Clear weekly_clears in user_boss_data for the new week using new service
      if (userCode && isLoggedIn) {
        const { fetchCurrentWeekData, saveCurrentWeekData } = await import('../../services/userWeeklyDataService.js');
        
        // First, fetch existing data for current week to preserve char_map and boss_config
        const existingData = await fetchCurrentWeekData(userCode);
        
        let preservedCharMap = {};
        let preservedBossConfig = {};
        
        if (existingData.success && existingData.data) {
          // Current week data exists, preserve char_map and boss_config
          preservedCharMap = existingData.data.char_map || {};
          preservedBossConfig = existingData.data.boss_config || {};
        } else {
          // Current week data doesn't exist, try to get from previous week
          // This handles the case where weekly reset creates new week data
          if (characterBossSelections && characterBossSelections.length > 0) {
            // Reconstruct char_map and boss_config from current UI state
            for (const char of characterBossSelections) {
              preservedCharMap[char.index.toString()] = char.name;
              
              // Convert character bosses back to config string
              if (char.bosses && char.bosses.length > 0) {
                const { convertBossesToConfigString } = await import('../utils/bossCodeMapping.js');
                preservedBossConfig[char.index.toString()] = await convertBossesToConfigString(char.bosses);
              } else {
                preservedBossConfig[char.index.toString()] = '';
              }
            }
          }
        }
        
        // Clear weekly_clears for new week while preserving char_map and boss_config
        await saveCurrentWeekData(userCode, {
          char_map: preservedCharMap,
          boss_config: preservedBossConfig,
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
      
      logger.info('useAppData: Weekly reset complete. New week', { newCurrentWeekKey });
    } catch (error) {
      logger.error('useAppData: Error during weekly reset', { error });
    }
  }, [userCode, isLoggedIn]); // Simplified dependencies

  const handleExternalWeeklyReset = useCallback(async (endedRealWeekKey) => {
    logger.info('useAppData: Handle External (Real) Weekly Reset. Ended week', { endedRealWeekKey });
    
    // Prevent multiple simultaneous resets
    if (handleExternalWeeklyReset._isRunning) {
      logger.info('useAppData: Weekly reset already in progress, skipping...');
      return;
    }
    handleExternalWeeklyReset._isRunning = true;
    
    try {
      if (simulatedWeeksForward > 0) {
        logger.warn('useAppData: Real weekly reset occurred during simulation. Reverting simulation first.');
        // Revert simulation without triggering its own full reset actions again, just state.
        setSimulatedWeeksForward(0);
        setRealCurrentWeekKeySnapshot(null);
      }
      
      const newRealCurrentWeekKey = getRealCurrentWeekKeyUtil();
      // Calculate timestamp without setting state immediately to prevent loops
      const currentActualTimestamp = calculateAndSetActualLastResetTimestampSnapshot(); 
      
      // Update the snapshot state separately to avoid circular dependencies
      updateLastResetTimestamp(currentActualTimestamp);
      
      logger.info('useAppData: Processing real reset', {
        endedRealWeekKey,
        newRealCurrentWeekKey,
        newRealTimestamp: new Date(currentActualTimestamp)
      });
      await performWeeklyResetActions(endedRealWeekKey, newRealCurrentWeekKey, currentActualTimestamp);
      
    } finally {
      // Clear the running flag after completion
      setTimeout(() => {
        handleExternalWeeklyReset._isRunning = false;
      }, 100);
    }
  }, [simulatedWeeksForward, performWeeklyResetActions, calculateAndSetActualLastResetTimestampSnapshot, updateLastResetTimestamp]);

  const simulateWeekForward = useCallback(async () => {
    logger.info('useAppData: Starting safe week forward simulation...');
    
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
          logger.error('useAppData: Simulation snapshots corrupted. Aborting simulation.');
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
      
      logger.info('useAppData: Simulating Week +1', { from: previousEffectiveWeekKey, to: newSimulatedWeekKey });
      
      // Update simulation count first
      setSimulatedWeeksForward(newSimulatedCount);
      
      // SAFE: Perform simulation actions without affecting database or pitched_items
      await performSafeSimulationActions(previousEffectiveWeekKey, newSimulatedWeekKey, newSimulatedResetTimestamp);
      
    } catch (error) {
      logger.error('useAppData: Error during week simulation', { error });
      // Reset simulation state on error
      setSimulatedWeeksForward(0);
      setRealCurrentWeekKeySnapshot(null);
      setActualLastResetTimestampSnapshot(null);
    }
  }, [simulatedWeeksForward, realCurrentWeekKeySnapshot, actualLastResetTimestampSnapshot, lastWeeklyResetTimestamp, calculateAndSetActualLastResetTimestampSnapshot, performSafeSimulationActions]);

  const revertWeekSimulation = useCallback(async (forceRevert = false) => {
    if (simulatedWeeksForward === 0 && !forceRevert) {
      logger.info('useAppData: No simulation to revert');
      return;
    }
    
    logger.info('useAppData: Reverting safe week simulation...');
    
    try {
      let lastSimulatedEffectiveWeekKey;
      let restoredRealWeek;
      let restoredRealTimestamp;

      if (!realCurrentWeekKeySnapshot || actualLastResetTimestampSnapshot === null) {
        logger.warn('useAppData: Cannot revert simulation: no snapshot data. Restoring to real state.');
        lastSimulatedEffectiveWeekKey = currentOperatingWeekKey;
        restoredRealWeek = getRealCurrentWeekKeyUtil();
        restoredRealTimestamp = calculateAndSetActualLastResetTimestampSnapshot();
      } else {
        const { getWeekKeyOffset } = await import('../utils/weekUtils');
        lastSimulatedEffectiveWeekKey = getWeekKeyOffset(simulatedWeeksForward, realCurrentWeekKeySnapshot);
        restoredRealWeek = realCurrentWeekKeySnapshot;
        restoredRealTimestamp = actualLastResetTimestampSnapshot;
      }

      logger.info('useAppData: Reverting from', { lastSimulatedEffectiveWeekKey }, 'back to real week', { restoredRealWeek });
      
      // Reset simulation count first
      setSimulatedWeeksForward(0);
      
      // SAFE: Perform revert actions without affecting database or pitched_items
      await performSafeRevertActions(lastSimulatedEffectiveWeekKey, restoredRealWeek, restoredRealTimestamp);
      
      // Clear snapshots
      setRealCurrentWeekKeySnapshot(null);
      setActualLastResetTimestampSnapshot(null);
      
    } catch (error) {
      logger.error('useAppData: Error during simulation revert', { error });
      // Force clean state on error
      setSimulatedWeeksForward(0);
      setRealCurrentWeekKeySnapshot(null);
      setActualLastResetTimestampSnapshot(null);
      setCurrentOperatingWeekKey(getRealCurrentWeekKeyUtil());
    }
  }, [simulatedWeeksForward, realCurrentWeekKeySnapshot, actualLastResetTimestampSnapshot, currentOperatingWeekKey, calculateAndSetActualLastResetTimestampSnapshot, performSafeRevertActions]);
  
  const isWeekSimulated = simulatedWeeksForward > 0;

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
      
      logger.info('useAppData: Character added to user_boss_data table', { newCharacter: newCharacter.name });
      
    } catch (error) {
      logger.error('useAppData: Error adding character', { error });
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
        logger.error('useAppData: Error removing character from user_boss_data', { error: removeResult.error });
        setError('Failed to remove character from database.');
      } else {
        logger.info('useAppData: Character removed from user_boss_data table');
      }
    } catch (serviceError) {
      logger.error('useAppData: Error calling remove character service', { error: serviceError });
      setError('Failed to remove character.');
    }
    
    // Remove associated pitched_items from database
    try {
      const { purgePitchedRecords } = await import('../../services/utilityService.js');
      await purgePitchedRecords(userCode, charToRemove.name, charToRemove.index);
    } catch (purgeError) {
      logger.warn('useAppData: Error purging pitched records for removed character', { error: purgeError });
      // Non-critical, continue
    }
    
    // Trigger a force update to ensure Navbar reflects character count change
    forceUpdate();
  };

  // Function to update character name - UPDATED to use new service
  const updateCharacterName = async (idx, newName) => {
    const character = characterBossSelections[idx];
    if (!character) return { success: false, error: 'Character not found' };

    try {
      // Update in user_boss_data using new service
      const { updateCharacterNameInWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const result = await updateCharacterNameInWeeklySetup(userCode, currentWeekStart, character.index, newName);
      
      if (!result.success) {
        setError(result.error || 'Failed to update character name');
        setTimeout(() => setError(''), 3000);
        return { success: false, error: result.error || 'Failed to update character name' };
      }

      // Update local state
      const updatedCharacters = [...characterBossSelections];
      updatedCharacters[idx].name = newName;
      setCharacterBossSelections(updatedCharacters);
      
      logger.info('useAppData: Character name updated in user_boss_data table');
      return { success: true };
    } catch (error) {
      logger.error('useAppData: Error updating character name', { error });
      setError('Failed to update character name');
      setTimeout(() => setError(''), 3000);
      return { success: false, error: 'Failed to update character name' };
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
        logger.error('useAppData: Failed to save boss configuration', { error: result.error });
        setError('Failed to save boss configuration. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
      
    } catch (error) {
      logger.error('useAppData: Error saving boss configuration', { error });
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
        logger.error('useAppData: Failed to save Quick Select configuration', { error: result.error });
        setError('Failed to save boss configuration. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
      
    } catch (error) {
      logger.error('useAppData: Error saving Quick Select configuration', { error });
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
        logger.error('useAppData: Failed to save party size update', { error: result.error });
        setError('Failed to save party size change. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
      
    } catch (error) {
      logger.error('useAppData: Error updating party size', { error });
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

  // Function to copy a character with numbered naming
  const copyCharacter = async (sourceCharIdx, newName) => {
    const charToCopy = characterBossSelections[sourceCharIdx];
    if (!charToCopy) {
      logger.error('useAppData: Character to copy not found at index', { sourceCharIdx });
      return { success: false, error: 'Character not found' };
    }

    if (characterBossSelections.length >= LIMITS.CHARACTER_CAP) {
      setCloneError('Cannot copy: Maximum character limit reached');
      setTimeout(() => setCloneError(''), 3000);
      return { success: false, error: 'Character limit reached' };
    }

    // Check account-wide crystal cap
    const totalCrystals = characterBossSelections.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0);
    const copyCrystals = charToCopy.bosses ? charToCopy.bosses.length : 0;

    if (totalCrystals + copyCrystals > LIMITS.CRYSTAL_CAP) {
      setCloneError(`Cannot copy: Would exceed ${LIMITS.CRYSTAL_CAP} crystal limit`);
      setTimeout(() => setCloneError(''), 3000);
      return { success: false, error: 'Crystal limit would be exceeded' };
    }

    try {
      // Import necessary services
      const { addCharacterToWeeklySetup, updateCharacterBossConfigInWeeklySetup } = await import('../../services/userWeeklyDataService.js');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      
      // 1. Add the character to user_boss_data
      const addResult = await addCharacterToWeeklySetup(userCode, currentWeekStart, newName);
      
      if (!addResult.success) {
        setCloneError(addResult.error || 'Failed to copy character');
        setTimeout(() => setCloneError(''), 3000);
        return { success: false, error: addResult.error };
      }

      // 2. If the original character has bosses, copy their boss configuration
      if (charToCopy.bosses && charToCopy.bosses.length > 0) {
        try {
          // Convert bosses array to boss config string format using new mapping utility
          const { convertBossesToConfigString } = await import('../utils/bossCodeMapping.js');
          const bossConfigString = await convertBossesToConfigString(charToCopy.bosses);

          const configResult = await updateCharacterBossConfigInWeeklySetup(
            userCode,
            currentWeekStart,
            addResult.characterIndex,
            bossConfigString
          );

          if (!configResult.success) {
            logger.warn('useAppData: Failed to copy boss configuration', { error: configResult.error });
            // Don't fail the whole operation, just log warning
          }
        } catch (error) {
          logger.error('useAppData: Error converting boss configuration for copy', { error });
          // Don't fail the whole operation, just log error
        }
      }

      // 3. Update local state
      const copiedChar = {
        ...charToCopy,
        name: newName,
        index: addResult.characterIndex,
        bosses: [...(charToCopy.bosses || [])]
      };

      const newCharacterBossSelections = [...characterBossSelections, copiedChar];
      setCharacterBossSelections(newCharacterBossSelections);
      
      // Trigger a force update to ensure Navbar reflects character count change
      forceUpdate();
      
      logger.info('useAppData: Character successfully copied', { original: charToCopy.name, copy: newName });
      
      return { success: true, newCharacter: copiedChar };
      
    } catch (error) {
      logger.error('useAppData: Error copying character', { error });
      setCloneError('Failed to copy character');
      setTimeout(() => setCloneError(''), 3000);
      return { success: false, error: 'Failed to copy character' };
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
    copyCharacter,
    
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
    isLoading: dataLoadingState.isLoading,
    hasDataLoaded: dataLoadingState.hasLoaded,
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
    
    // Combined data loading state
    dataLoadingState,
  };
} 