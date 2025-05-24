import { useState, useEffect, useMemo, useRef } from 'react';
import { savePitchedItem, getYearlyPitchedStats, removeManyPitchedItems, purgePitchedRecords, clearCharacterPitchedUI, getPitchedResetAuditHistory, getAvailableWeeks, getWeekData } from './pitched-data-service';
import { getTimeUntilReset, getCurrentWeekKey, getCurrentMonthKey, getCurrentYearKey } from './utils/weekUtils';
import { STORAGE_KEYS, MONTH_NAMES, BOSS_DIFFICULTIES, COOLDOWNS } from './constants';
import WeekNavigator from './components/WeekNavigator';

function ProgressFace({ progress, darkMode }) {
  let emoji = '😐';
  if (progress >= 1) emoji = '🤑';
  else if (progress >= 0.7) emoji = '😁';
  else if (progress >= 0.4) emoji = '🙂';

  return (
    <span style={{ 
      fontSize: '1.5em', 
      marginLeft: '0.5rem',
      display: 'inline-flex',
      alignItems: 'center',
      transition: 'transform 0.3s ease',
      transform: progress >= 1 ? 'scale(1.2)' : 'scale(1)'
    }}>
      {emoji}
    </span>
  );
}

function CrystalAnimation({ startPosition, endPosition, onComplete }) {
  const [position, setPosition] = useState(startPosition);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1000; // 1 second animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic bezier curve for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const newX = startPosition.x + (endPosition.x - startPosition.x) * easeOutCubic;
      const newY = startPosition.y + (endPosition.y - startPosition.y) * easeOutCubic;

      setPosition({ x: newX, y: newY });
      setOpacity(1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [startPosition, endPosition, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        opacity,
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'transform 0.1s ease'
      }}
    >
      <img
        src="/bosses/crystal.png"
        alt="Crystal"
        style={{
          width: 24,
          height: 24,
          transform: `rotate(${position.x * 0.1}deg)`,
          filter: 'drop-shadow(0 0 4px rgba(162, 89, 247, 0.6))'
        }}
      />
    </div>
  );
}

// Helper: get pitched item state key
function getPitchedKey(charName, charIdx, bossName, itemName, weekKey) {
  return `${charName}-${charIdx}__${bossName}__${itemName}__${weekKey}`;
}

function WeeklyTracker({ characters, bossData, onBack, checked, setChecked, userCode }) {
  // Helper function to get boss price (now has access to bossData prop)
  function getBossPrice(bossName, difficulty) {
    const boss = bossData.find(b => b.name === bossName);
    if (!boss) return 0;
    const d = boss.difficulties.find(d => d.difficulty === difficulty);
    return d ? d.price : 0;
  }

  // Week navigation state
  const currentWeekKey = getCurrentWeekKey();
  const [selectedWeekKey, setSelectedWeekKey] = useState(currentWeekKey);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [isLoadingWeekData, setIsLoadingWeekData] = useState(false);
  const [weekDataCache, setWeekDataCache] = useState({});
  
  // Use selected week instead of current week
  const weekKey = selectedWeekKey;
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());
  const [crystalAnimation, setCrystalAnimation] = useState(null);
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const [error, setError] = useState(null);
  
  // Track user interactions to prevent sync conflicts
  const userInteractionRef = useRef(false);
  
  // Week navigation handler
  const handleWeekChange = async (newWeekKey) => {
    if (newWeekKey === selectedWeekKey) return;
    
    console.log(`Navigating from week ${selectedWeekKey} to ${newWeekKey}`);
    
    // Cache current week data before switching
    if (selectedWeekKey && !weekDataCache[selectedWeekKey]) {
      setWeekDataCache(prev => ({
        ...prev,
        [selectedWeekKey]: {
          checkedState: checked,
          pitchedItems: cloudPitchedItems,
          hasData: Object.keys(checked).length > 0 || cloudPitchedItems.length > 0
        }
      }));
    }
    
    // Reset read-only override when changing weeks
    setReadOnlyOverride(false);
    
    // Clear UI state first for smooth transition
    setPitchedChecked({});
    
    // Update selected week
    setSelectedWeekKey(newWeekKey);
  };
  
  // Hide completed characters toggle
  const [hideCompleted, setHideCompleted] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_HIDE_COMPLETED);
    return saved ? JSON.parse(saved) : false;
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_HIDE_COMPLETED, JSON.stringify(hideCompleted));
  }, [hideCompleted]);

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pitched item state (per week, per char, per boss, per item) - now cloud-only
  const [pitchedChecked, setPitchedChecked] = useState({});
  const [isRefreshingPitchedItems, setIsRefreshingPitchedItems] = useState(false);
  const [loadingPitchedItems, setLoadingPitchedItems] = useState({});

  // Function to refresh pitched items from the database
  const refreshPitchedItems = async (userCodeValue) => {
    if (isRefreshingPitchedItems) return; // Prevent multiple concurrent refreshes
    
    try {
      setIsRefreshingPitchedItems(true);
      const codeToUse = userCodeValue || userCode;
      
      if (!codeToUse) {
        console.log('No user code available to refresh pitched items');
        return;
      }
      
      console.log('Refreshing pitched items from database...');
      const { supabase } = await import('./supabaseClient');
      const { data, error } = await supabase
        .from('user_data')
        .select('pitched_items')
        .eq('id', codeToUse)
        .single();
        
      if (error) {
        console.error('Error refreshing pitched items:', error);
        return;
      }
      
      if (data && data.pitched_items && Array.isArray(data.pitched_items)) {
        console.log(`Refreshed ${data.pitched_items.length} pitched items from database`);
        setCloudPitchedItems(data.pitched_items);
      } else {
        console.log('No pitched items found during refresh');
        setCloudPitchedItems([]);
      }
    } catch (error) {
      console.error('Error in refreshPitchedItems:', error);
    } finally {
      setIsRefreshingPitchedItems(false);
    }
  };
  
  // Fetch available weeks on component mount and when userCode changes
  useEffect(() => {
    const fetchAvailableWeeks = async () => {
      if (!userCode) return;
      
      try {
        const result = await getAvailableWeeks(userCode);
        if (result.success) {
          setAvailableWeeks(result.weeks);
          console.log('Available weeks:', result.weeks);
        } else {
          console.error('Failed to fetch available weeks:', result.error);
        }
      } catch (error) {
        console.error('Error fetching available weeks:', error);
      }
    };
    
    fetchAvailableWeeks();
  }, [userCode]);

  // Fetch data for selected week
  useEffect(() => {
    const fetchWeekData = async () => {
      if (!userCode || !selectedWeekKey) return;
      
      // Check cache first
      if (weekDataCache[selectedWeekKey]) {
        console.log(`Using cached data for week ${selectedWeekKey}`);
        const cachedData = weekDataCache[selectedWeekKey];
        
        // Apply cached data
        if (cachedData.checkedState) {
          setChecked(cachedData.checkedState);
        }
        if (cachedData.pitchedItems) {
          setCloudPitchedItems(cachedData.pitchedItems);
        }
        return;
      }
      
      setIsLoadingWeekData(true);
      
      try {
        console.log(`Fetching data for week: ${selectedWeekKey}`);
        const result = await getWeekData(userCode, selectedWeekKey);
        
        if (result.success) {
          // Cache the data
          setWeekDataCache(prev => ({
            ...prev,
            [selectedWeekKey]: {
              checkedState: result.checkedState,
              pitchedItems: result.pitchedItems,
              hasData: result.hasData
            }
          }));
          
          // Apply the data
          setChecked(result.checkedState || {});
          setCloudPitchedItems(result.pitchedItems || []);
          
          console.log(`Week ${selectedWeekKey} data loaded:`, {
            checkedStates: Object.keys(result.checkedState || {}).length,
            pitchedItems: result.pitchedItems?.length || 0
          });
        } else {
          console.error('Failed to fetch week data:', result.error);
          // Clear data for weeks with no data
          setChecked({});
          setCloudPitchedItems([]);
        }
      } catch (error) {
        console.error('Error fetching week data:', error);
        setError('Failed to load week data. Please try again.');
      } finally {
        setIsLoadingWeekData(false);
      }
    };
    
    fetchWeekData();
  }, [userCode, selectedWeekKey]);

  // Fetch pitched items on component mount (only for current week compatibility)
  useEffect(() => {
    if (userCode && selectedWeekKey === currentWeekKey) {
      refreshPitchedItems(userCode);
    }
  }, [userCode, selectedWeekKey, currentWeekKey]);
  
  // Add a dedicated effect for synchronizing pitched items with boss checks
  const [pitchedItemsSynced, setPitchedItemsSynced] = useState(false);
  const [cloudPitchedItems, setCloudPitchedItems] = useState([]);
  
  // Fetch pitched items from database via user code parameter
  useEffect(() => {
    const fetchPitchedItemsFromDatabase = async () => {
      try {
        if (!userCode) {
          console.log('No user code provided');
          return;
        }
        
        // Use supabase to get pitched_items
        const { supabase } = await import('./supabaseClient');
        const { data, error } = await supabase
          .from('user_data')
          .select('pitched_items')
          .eq('id', userCode)
          .single();
          
        if (error) {
          console.error('Error fetching pitched items:', error);
          return;
        }
        
        if (data && data.pitched_items && Array.isArray(data.pitched_items)) {
          console.log(`Fetched ${data.pitched_items.length} pitched items from database`);
          // Store the fetched items
          setCloudPitchedItems(data.pitched_items);
        } else {
          console.log('No pitched items found in database');
        }
      } catch (error) {
        console.error('Error in fetchPitchedItemsFromDatabase:', error);
      }
    };
    
    fetchPitchedItemsFromDatabase();
  }, [userCode]);
  
  // Import ensureDataSynchronization from pitched-data-service.js
  useEffect(() => {
    // Run whenever cloud pitched items change, or when week changes
    if (cloudPitchedItems.length === 0) return;
    
    const syncPitchedWithBossChecks = async () => {
      try {
        console.log(`🔄 SYNC: Syncing pitched items for week ${weekKey} with boss checks...`);
        
        // Skip sync if user is actively interacting (e.g., during purge)
        if (userInteractionRef.current) {
          console.log(`⏸️ SYNC: Skipping sync - user interaction in progress (purge/click)`);
          return;
        }
        
        // Filter items for the current week
        const currentWeekItems = cloudPitchedItems.filter(item => item.weekKey === weekKey);
        
        if (currentWeekItems.length > 0) {
          console.log(`📋 SYNC: Found ${currentWeekItems.length} pitched items for week ${weekKey} in database:`, currentWeekItems);          
          
          // Create new state objects
          const newChecked = { ...checked };
          const newPitchedChecked = { ...pitchedChecked };
          let updatedChecks = false;
          let updatedPitched = false;
          
          // Process each pitched item from the database
          currentWeekItems.forEach(item => {
            // Find character in the characters array by name
            const charIdx = characters.findIndex(c => c.name === item.character);
            if (charIdx === -1) {
              console.log(`⚠️ SYNC: Character ${item.character} not found in characters array`);
              return;
            }
            
            const charInfo = `${item.character}-${charIdx}`;
            
            // Initialize character in checked state if needed
            if (!newChecked[charInfo]) {
              newChecked[charInfo] = {};
            }
            
            // Find the corresponding boss in the character's boss list
            const char = characters[charIdx];
            if (!char) {
              console.log(`⚠️ SYNC: Character object not found for index ${charIdx}`);
              return;
            }
            
            // Get boss name from the item's boss field
            const bossNameFromItem = item.boss;
            
            // Find matching boss in character's bosses
            const boss = char.bosses.find(b => b.name === bossNameFromItem);
            if (!boss) {
              console.log(`⚠️ SYNC: Boss ${bossNameFromItem} not found in character's boss list`);
              return;
            }
            
            const bossKey = `${boss.name}-${boss.difficulty}`;
            
            // ✅ AUTO-TICK BOSS: Mark boss as checked if it's not already
            if (!newChecked[charInfo][bossKey]) {
              console.log(`✅ SYNC: AUTO-TICKING boss ${bossKey} for character ${charInfo} due to pitched item ${item.item}`);
              newChecked[charInfo][bossKey] = true;
              updatedChecks = true;
            } else {
              console.log(`ℹ️ SYNC: Boss ${bossKey} already checked for character ${charInfo}`);
            }
            
            // ✅ MARK PITCHED ITEM: Update the pitched item UI state
            const pitchedKey = getPitchedKey(item.character, charIdx, bossNameFromItem, item.item, weekKey);
            if (!newPitchedChecked[pitchedKey]) {
              console.log(`✅ SYNC: Setting pitched item UI toggle for ${item.item} from ${bossNameFromItem}`);
              newPitchedChecked[pitchedKey] = true;
              updatedPitched = true;
            } else {
              console.log(`ℹ️ SYNC: Pitched item ${item.item} already marked in UI`);
            }
          });
          
          // Apply updates if any changes were made
          if (updatedChecks) {
            console.log('🔄 SYNC: Updating checked state based on pitched items');
            setChecked(newChecked);
          } else {
            console.log('ℹ️ SYNC: No boss check updates needed');
          }
          
          if (updatedPitched) {
            console.log('🔄 SYNC: Updating pitched item UI state based on database');
            setPitchedChecked(newPitchedChecked);
          } else {
            console.log('ℹ️ SYNC: No pitched item UI updates needed');
          }
        } else {
          console.log(`ℹ️ SYNC: No pitched items found for week ${weekKey} in database`);          
        }
        
        console.log('✅ SYNC: Synchronization completed successfully');
        setPitchedItemsSynced(true);
      } catch (error) {
        console.error('❌ SYNC: Error synchronizing pitched items with boss checks:', error);
      }
    };
    
    syncPitchedWithBossChecks();
    
    // Re-run this effect whenever the cloud pitched items or week changes
    // IMPORTANT: Do NOT include checked/pitchedChecked in dependencies to avoid race conditions
  }, [cloudPitchedItems, weekKey, characters]);
  
  // Reset pitchedChecked if week changes (no longer using localStorage)
  useEffect(() => {
    // Week change now handled entirely by cloud data sync
    // Clear UI state when week changes
    setPitchedChecked({});
  }, [weekKey]);

  // Handle boss checkbox changes - handles both direct calls and checkbox event objects
  const handleCheck = async (bossOrEvent, checkedValOrBoss, event = null) => {
    try {
      // Show warning when editing historical data
      if (isHistoricalWeek && !readOnlyOverride) {
        console.log('Boss check blocked - read-only mode active for historical week');
        return;
      }
      
      // Determine if this is coming from a checkbox click or a direct call
      let boss, checkedVal, e;
      
      if (bossOrEvent && bossOrEvent.name) {
        // Direct call format: handleCheck(boss, checkedVal, event)
        boss = bossOrEvent;
        checkedVal = checkedValOrBoss;
        e = event;
      } else if (bossOrEvent && bossOrEvent.target) {
        // Checkbox event format: handleCheck(event, boss)
        e = bossOrEvent;
        boss = checkedValOrBoss;
        checkedVal = e.target.checked;
      } else {
        console.error('Invalid parameters to handleCheck');
        return;
      }
      
      // Handle animation if this is from a UI click
      if (e && e.clientX && !crystalAnimation) {
        // Calculate start position (checkbox)
        const startPosition = {
          x: e.clientX,
          y: e.clientY
        };

        // Calculate end position (progress bar)
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
          const progressBarRect = progressBar.getBoundingClientRect();
          const endPosition = {
            x: progressBarRect.left + progressBarRect.width / 2,
            y: progressBarRect.top + progressBarRect.height / 2
          };

          setCrystalAnimation({
            startPosition,
            endPosition
          });
        }
      }

      const charName = characters[selectedCharIdx]?.name || '';
      const charIdx = selectedCharIdx;
      const charKey = `${charName}-${charIdx}`;
      const bossName = boss.name;
      const bossDifficulty = boss.difficulty;
      const bossKey = `${bossName}-${bossDifficulty}`;
      
      // Update local state
      const newChecked = {
        ...checked,
        [charKey]: {
          ...(checked[charKey] || {}),
          [bossKey]: checkedVal
        }
      };

      setChecked(newChecked);
      
      // Save to database (independent of pitched items)
      if (userCode) {
        try {
          // 1. First update the traditional checked state in the data object
          const { supabase } = await import('./supabaseClient');
          
          const { data, error } = await supabase
            .from('user_data')
            .select('data')
            .eq('id', userCode)
            .single();
            
          if (error) throw error;
          
          // Update the checked state in the data object
          const updatedData = {
            ...data.data,
            checked: newChecked,
            weekKey: getCurrentWeekKey(),
            lastUpdated: new Date().toISOString()
          };
          
          // Save back to database
          const { error: updateError } = await supabase
            .from('user_data')
            .update({ data: updatedData })
            .eq('id', userCode);
            
          if (updateError) throw updateError;
          
          // 2. Only save boss run for current week (read-only for historical weeks)
          if (selectedWeekKey === currentWeekKey) {
            const { saveBossRun } = await import('./pitched-data-service');
            const bossRunData = {
              character: charName,
              characterIdx: charIdx,
              bossName: bossName,
              bossDifficulty: bossDifficulty,
              isCleared: checkedVal,
              date: new Date().toISOString()
            };
            
            // Save to boss_runs array in database
            const result = await saveBossRun(userCode, bossRunData);
            if (!result.success) {
              console.error('Error saving boss run:', result.error);
            } else {
              console.log(`Boss run saved to database: ${charName} - ${bossName} ${bossDifficulty}: ${checkedVal}`);
            }
          } else {
            console.log(`Skipping boss run save for historical week: ${selectedWeekKey}`);
          }
        } catch (dbError) {
          console.error('Error saving boss state to database:', dbError);
          // Continue with local updates even if database sync fails
        }
      }
      
      // If boss is being unticked, also untick all pitched items for this boss/character/week
      // But only for current week (historical weeks are read-only)
      if (!checkedVal && selectedWeekKey === currentWeekKey) {
        const bossObj = bossData.find(bd => bd.name === bossName);
        if (bossObj && bossObj.pitchedItems) {
          setPitchedChecked(prev => {
            const updated = { ...prev };
            bossObj.pitchedItems.forEach(item => {
              const key = getPitchedKey(charName, charIdx, bossName, item.name, weekKey);
              if (updated[key]) delete updated[key];
            });
            return updated;
          });
          
          // Also remove pitched items from database if user is logged in
          const itemsToRemove = bossObj.pitchedItems.map(item => ({
            character: charName,
            bossName: bossName,
            itemName: item.name,
            weekKey
          }));
          
          if (itemsToRemove.length > 0 && userCode) {
            removeManyPitchedItems(userCode, itemsToRemove).catch(err => {
              console.error('Error removing pitched items:', err);
            });
          }
        }
      }
      
      startStatsTrackingIfNeeded();
    } catch (err) {
      console.error('Error in handleCheck:', err);
      setError('Failed to update boss status. Please try again.');
    }
  };

  // Fixed handleTickAll to instantly update UI then handle database operations in background
  const handleTickAll = async () => {
    try {
      // Prevent tick all for read-only historical weeks
      if (isHistoricalWeek && !readOnlyOverride) {
        console.log('Tick All blocked - read-only mode active for historical week');
        return;
      }
      
      const charKey = `${characters[selectedCharIdx]?.name || ''}-${selectedCharIdx}`;
      const currentState = checked[charKey] || {};
      const allChecked = charBosses.every(b => currentState[b.name + '-' + b.difficulty]);
      const targetState = !allChecked; // Will check all if not all checked, uncheck all if all checked
      
      console.log(`🔄 TICK ALL: ${targetState ? 'Checking' : 'Unchecking'} all ${charBosses.length} bosses instantly for ${characters[selectedCharIdx]?.name}`);
      
      // Set user interaction flag to prevent sync conflicts during batch operation
      userInteractionRef.current = true;
      
      // 1. INSTANTLY update UI state for all bosses at once
      const newChecked = {
        ...checked,
        [charKey]: Object.fromEntries(charBosses.map(b => [b.name + '-' + b.difficulty, targetState]))
      };
      setChecked(newChecked);
      
      // 2. Handle pitched items UI state based on target state
      if (!targetState) {
        // If unticking all, remove all pitched items for this character
        const newPitchedChecked = { ...pitchedChecked };
        charBosses.forEach(boss => {
          const bossObj = bossData.find(bd => bd.name === boss.name);
          if (bossObj?.pitchedItems) {
            bossObj.pitchedItems.forEach(item => {
              const key = getPitchedKey(characters[selectedCharIdx].name, selectedCharIdx, boss.name, item.name, weekKey);
              if (newPitchedChecked[key]) {
                delete newPitchedChecked[key];
              }
            });
          }
        });
        setPitchedChecked(newPitchedChecked);
      }
      
      // 3. Process database operations in background for all bosses that changed
      console.log(`🔄 TICK ALL: Processing database operations for ${charBosses.length} bosses...`);
      
      if (userCode) {
        // Process each boss for database operations (but UI is already updated)
        const databasePromises = charBosses.map(async (boss, index) => {
          const bossKey = `${boss.name}-${boss.difficulty}`;
          const wasChecked = currentState[bossKey] || false;
          
          // Only process if state actually changed
          if (wasChecked !== targetState) {
            try {
              // Add small staggered delay to prevent overwhelming database
              await new Promise(resolve => setTimeout(resolve, index * 25));
              
              // Save boss run to database using the same logic as handleCheck
              const { supabase } = await import('./supabaseClient');
              const { data, error } = await supabase
                .from('user_data')
                .select('data')
                .eq('id', userCode)
                .single();
                
              if (error) throw error;
              
              const updatedData = {
                ...data.data,
                checked: newChecked,
                weekKey: getCurrentWeekKey(),
                lastUpdated: new Date().toISOString()
              };
              
              const { error: updateError } = await supabase
                .from('user_data')
                .update({ data: updatedData })
                .eq('id', userCode);
                
              if (updateError) throw updateError;
              
              // Also save boss run in new format
              const { saveBossRun } = await import('./pitched-data-service');
              const bossRunData = {
                character: characters[selectedCharIdx].name,
                characterIdx: selectedCharIdx,
                bossName: boss.name,
                bossDifficulty: boss.difficulty,
                isCleared: targetState,
                date: new Date().toISOString()
              };
              
              await saveBossRun(userCode, bossRunData);
              
              console.log(`✅ TICK ALL: Database updated for ${boss.name} ${boss.difficulty}: ${targetState}`);
              
            } catch (error) {
              console.error(`❌ TICK ALL: Database error for ${boss.name}:`, error);
            }
          }
        });
        
        // Handle pitched items removal if unticking
        if (!targetState) {
          const itemsToRemove = [];
          charBosses.forEach(boss => {
            const bossObj = bossData.find(bd => bd.name === boss.name);
            if (bossObj?.pitchedItems) {
              bossObj.pitchedItems.forEach(item => {
                const key = getPitchedKey(characters[selectedCharIdx].name, selectedCharIdx, boss.name, item.name, weekKey);
                if (pitchedChecked[key]) {
                  itemsToRemove.push({
                    character: characters[selectedCharIdx].name,
                    bossName: boss.name,
                    itemName: item.name,
                    weekKey,
                  });
                }
              });
            }
          });
          
          if (itemsToRemove.length > 0) {
            databasePromises.push(removeManyPitchedItems(userCode, itemsToRemove));
          }
        }
        
        // Wait for all database operations to complete
        await Promise.allSettled(databasePromises);
      }
      
      console.log(`✅ TICK ALL: Completed batch ${targetState ? 'check' : 'uncheck'} operation with instant UI update`);
      
    } catch (err) {
      console.error('Error in handleTickAll:', err);
      setError('Failed to update all bosses. Please try again.');
    } finally {
      // Clear user interaction flag after all operations complete
      setTimeout(() => {
        userInteractionRef.current = false;
        console.log('🔄 TICK ALL: Interaction flag cleared, sync can resume');
      }, 1000);
    }
  };

  // Week change handling now fully managed by cloud data sync (no localStorage needed)

  // Checked state saving now fully handled by cloud storage (no localStorage needed)

  // Reset selectedCharIdx if it's out of bounds
  useEffect(() => {
    if (selectedCharIdx >= characters.length) {
      setSelectedCharIdx(Math.max(0, characters.length - 1));
    }
  }, [characters.length, selectedCharIdx]);

  // --- Main table for selected character ---
  const char = characters[selectedCharIdx];
  const charKey = `${char?.name || ''}-${selectedCharIdx}`;
  const charBosses = char?.bosses || [];

  // --- 3. Sort bosses by price (highest to lowest) ---
  const sortedBosses = [...charBosses].sort((a, b) => {
    try {
      const priceA = getBossPrice(a.name, a.difficulty) / (a.partySize || 1);
      const priceB = getBossPrice(b.name, b.difficulty) / (b.partySize || 1);
      return priceB - priceA;
    } catch (err) {
      console.error('Error sorting bosses:', err);
      return 0;
    }
  });

  // Progress data now tracked in memory only (no localStorage)
  const [progressData, setProgressData] = useState({
    weeklyTotal: 0,
    lastReset: new Date().toISOString(),
    history: []
  });

  // Calculate total meso value for a character
  const charTotal = (char) => char.bosses.reduce((sum, b) => sum + Math.ceil(b.price / (b.partySize || 1)), 0);

  // Calculate total meso value for all characters
  const overallTotal = characters.reduce((sum, c) => sum + charTotal(c), 0);

  // Update progress when total changes (memory only, no localStorage)
  useEffect(() => {
    setProgressData(prev => ({
      ...prev,
      weeklyTotal: overallTotal
    }));
  }, [overallTotal]);

  // Update progress tracking  useEffect(() => {    const now = new Date();    const lastReset = new Date(progressData.lastReset);    const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));    // Reset weekly total if it's been 7 days    if (daysSinceReset >= 7) {      setProgressData(prev => ({        weeklyTotal: 0,        lastReset: now.toISOString(),        history: [...prev.history, { date: prev.lastReset, total: prev.weeklyTotal }]      }));    }  }, [progressData.lastReset]);  // Window size state for confetti  const [windowSize, setWindowSize] = useState({    width: window.innerWidth,    height: window.innerHeight  });  // Update window size for confetti  useEffect(() => {    const handleResize = () => {      setWindowSize({        width: window.innerWidth,        height: window.innerHeight      });    };    window.addEventListener('resize', handleResize);    return () => window.removeEventListener('resize', handleResize);  }, []);

  // Check if any character has at least one selected boss
  const anyBossesSelected = characters.some(char => (char.bosses || []).length > 0);
  
  // Read-only mode for historical weeks with toggle
  const isHistoricalWeek = selectedWeekKey !== currentWeekKey;
  const [readOnlyOverride, setReadOnlyOverride] = useState(false);
  const isReadOnlyMode = isHistoricalWeek && !readOnlyOverride;

  // Stats modal state
  const [showStats, setShowStats] = useState(false);
  const [showStatsResetConfirm, setShowStatsResetConfirm] = useState(false);
  
  // Stats are now completely cloud-based - no local storage
  const [statsPanel] = useState({ monthly: [], yearly: [] }); // Empty placeholder
  
  // No more local stats tracking - everything is cloud-based
  function startStatsTrackingIfNeeded() {
    // Stats tracking now handled by cloud pitched items
    console.log('Stats tracking is now cloud-based - no action needed');
  }

    // Stats panel updates are no longer needed - everything is cloud-based

    // --- Brand new confirmation state management ---
    const [resetSuccessVisible, setResetSuccessVisible] = useState(false);
    
    // --- Character-specific purge state management ---
    const [showCharacterPurgeConfirm, setShowCharacterPurgeConfirm] = useState(false);
    const [purgeTargetCharacter, setPurgeTargetCharacter] = useState(null);
    const [purgeInProgress, setPurgeInProgress] = useState(false);
    const [purgeSuccess, setPurgeSuccess] = useState(false);
    const [auditHistory, setAuditHistory] = useState([]);
  
    // --- Separate function to handle the actual data reset ---
    const resetAllStatsData = () => {
      // Clear pitched items UI only (cloud data cleared separately)
      setPitchedChecked({});
      
      // Reset selectors
      setSelectedYear(getCurrentYearKey());
    };
    
    // --- Reset handler (just closes confirm dialog and shows success message) ---
    const handleStatsReset = () => {
      resetAllStatsData();
      setShowStatsResetConfirm(false);
      setResetSuccessVisible(true);
    };
    
    // --- Close success message handler ---
    const closeResetSuccess = () => {
      setResetSuccessVisible(false);
      setShowStats(false);
    };

    // --- Character-specific purge handler ---
    const handleCharacterPurge = async () => {
      if (!purgeTargetCharacter) return;
      
      try {
        setPurgeInProgress(true);
        const { name, idx } = purgeTargetCharacter;
        
        console.log(`🗑️ Starting purge for character: ${name} (index: ${idx})`);
        
        // Prevent background sync conflicts during purge
        userInteractionRef.current = true;
        
        // 1. Clear any old localStorage data that might interfere
        console.log('🔄 PURGE: Clearing old localStorage pitched data...');
        localStorage.removeItem('ms-weekly-pitched');
        localStorage.removeItem('ms-weekly-pitched-week-key');
        localStorage.removeItem('ms-stats-panel');
        
        // 2. Clear UI checkmarks first
        const updatedPitchedChecked = clearCharacterPitchedUI(pitchedChecked, name, idx, weekKey);
        setPitchedChecked(updatedPitchedChecked);
        
        // 2. Purge from database
        const result = await purgePitchedRecords(userCode, name, idx);
        
        if (result.success) {
          console.log(`✅ Successfully purged ${result.itemsRemoved} items and ${result.bossRunsRemoved} boss runs for ${name}`);
          
          // 3. IMMEDIATE: Clear the cloud data states to force fresh reload
          console.log('🔄 PURGE: Clearing stale cloud data from state...');
          setCloudPitchedItems([]);
          setCloudPitchedStats({});
          
          // 4. Force refresh cloud pitched items (used by sync logic)
          console.log('🔄 PURGE: Refreshing cloud pitched items from database...');
          await refreshPitchedItems(userCode);
          
          // 4.5. Log the refreshed data for debugging
          console.log('🔄 PURGE: Current cloudPitchedItems after refresh:', cloudPitchedItems.length);
          
          // 5. Wait a moment for database to update then refresh cloud stats
          console.log('🔄 PURGE: Waiting for database consistency...');
          await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for consistency
          
          console.log('🔄 PURGE: Refreshing cloud stats from database...');
          const statsResult = await getYearlyPitchedStats(userCode);
          if (statsResult.success) {
            console.log('🔄 PURGE: Cloud stats refreshed successfully, items found:', Object.keys(statsResult.data).length);
            setCloudPitchedStats(statsResult.data);
          } else {
            console.error('🔄 PURGE: Failed to refresh cloud stats:', statsResult.error);
          }
          
          // 6. Show success
          setPurgeSuccess(true);
          setShowCharacterPurgeConfirm(false);
          
          // 7. Update audit history
          const auditResult = await getPitchedResetAuditHistory(userCode);
          if (auditResult.success) {
            setAuditHistory(auditResult.history);
          }
          
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            setPurgeSuccess(false);
          }, 3000);
          
        } else {
          console.error('Purge failed:', result.error);
          setError('Failed to purge character data. Please try again.');
        }
        
      } catch (error) {
        console.error('Error in handleCharacterPurge:', error);
        setError('Failed to purge character data. Please try again.');
      } finally {
        setPurgeInProgress(false);
        // Clear user interaction flag
        setTimeout(() => {
          userInteractionRef.current = false;
        }, 1000);
      }
    };

  // Cloud-based pitched items stats
  const [cloudPitchedStats, setCloudPitchedStats] = useState({});
  const [isLoadingCloudStats, setIsLoadingCloudStats] = useState(false);
  
  // Fetch cloud-based pitched items stats when viewing stats
  useEffect(() => {
    if (showStats && userCode) {
      const fetchCloudStats = async () => {
        try {
          setIsLoadingCloudStats(true);
          const result = await getYearlyPitchedStats(userCode);
          if (result.success) {
            setCloudPitchedStats(result.data);
          }
        } catch (error) {
          console.error('Error fetching cloud pitched stats:', error);
        } finally {
          setIsLoadingCloudStats(false);
        }
      };
      
      fetchCloudStats();
    }
  }, [showStats, userCode]);
  
  // State for selected year in stats modal
  const allYears = useMemo(() => {
    // Always start with current year as fallback
    const currentYear = getCurrentYearKey();
    const yearsSet = new Set([currentYear]);
    
    // Add years from stats panel (if any)
    if (statsPanel && statsPanel.yearly && Array.isArray(statsPanel.yearly)) {
      statsPanel.yearly.forEach(y => yearsSet.add(y.yearKey));
    }
    
    // Add years from cloud pitched stats (if any)
    const cloudYears = Object.keys(cloudPitchedStats);
    cloudYears.forEach(year => yearsSet.add(year));
    
    // Convert to array and sort (most recent first)
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [statsPanel.yearly, cloudPitchedStats]);
  
  const [selectedYear, setSelectedYear] = useState(() => getCurrentYearKey());
  
  useEffect(() => {
    // Always ensure selected year is in the available years list
    if (allYears && Array.isArray(allYears) && allYears.length > 0) {
      if (!allYears.includes(selectedYear)) {
        // If current selection isn't available, default to first year (which will be most recent)
        setSelectedYear(allYears[0]);
      }
    }
    // eslint-disable-next-line
  }, [allYears]);

  // --- Combined local and cloud pitched items summary ---
  const yearlyPitchedSummary = useMemo(() => {
    // Only use cloud data for pitched summary
    const pitchedMap = new Map();
    const cloudData = cloudPitchedStats[selectedYear];
    if (cloudData && cloudData.items && Array.isArray(cloudData.items)) {
      cloudData.items.forEach(item => {
        if (!item || !item.item || !item.image) return;
        const key = item.item + '|' + item.image;
        if (!pitchedMap.has(key)) {
          pitchedMap.set(key, { 
            name: item.item, 
            image: item.image, 
            count: 0, 
            history: [],
            source: 'cloud' 
          });
        }
        pitchedMap.get(key).count += 1;
        // Format the date for display
        const date = new Date(item.date);
        const monthNum = date.getUTCMonth();
        const day = date.getUTCDate();
        pitchedMap.get(key).history.push({ 
          char: item.character, 
          date: `${MONTH_NAMES[monthNum]} ${day}`,
          cloud: true,
          fullDate: item.date
        });
      });
    }
    // Convert map to array and sort
    const result = Array.from(pitchedMap.values());
    result.forEach(item => {
      if (item.history && Array.isArray(item.history)) {
        item.history.sort((a, b) => {
          if (a.fullDate && b.fullDate) {
            return new Date(b.fullDate) - new Date(a.fullDate);
          }
          return 0;
        });
      }
    });
    return result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [selectedYear, cloudPitchedStats]);

  // --- State for pitched modal ---
  const [pitchedModalItem, setPitchedModalItem] = useState(null);
  const [showPitchedModal, setShowPitchedModal] = useState(false);

  // --- Modal details for clicked pitched item ---
  const pitchedModalDetails = useMemo(() => {
    if (!pitchedModalItem) return [];
    return pitchedModalItem.history || [];
  }, [pitchedModalItem]);

  if (error) {
    return (
      <div className="App dark" style={{ padding: '2rem', color: '#e6e0ff', fontSize: '1.2rem', textAlign: 'center' }}>
        <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>
        <button onClick={() => setError(null)} style={{ marginRight: '1rem' }}>Try Again</button>
        <button onClick={onBack}>Back to Calculator</button>
      </div>
    );
  }

  if (!characters.length) {
    return (
      <div className="App dark" style={{ padding: '2rem', color: '#e6e0ff', fontSize: '1.2rem', textAlign: 'center' }}>
        No characters found. Go back and add a character first.
        <br /><br />
        <button onClick={onBack} style={{ marginTop: 16 }}>Back to Calculator</button>
      </div>
    );
  }

  // --- 2. Total meso for all characters ---
  const totalMeso = characters.reduce((sum, char, charIndex) => {
    // Use both name and index to create a unique key for each character
    const charKey = `${char?.name || ''}-${charIndex}`;
    return sum + (char.bosses || []).reduce((s, b) =>
      checked[charKey]?.[b.name + '-' + b.difficulty] ? s + (getBossPrice(b.name, b.difficulty) / (b.partySize || 1)) : s, 0
    );
  }, 0);

  // --- 2b. Total obtainable meso for all characters (goal) ---
  const obtainableMeso = characters.reduce((sum, char) =>
    sum + (char.bosses || []).reduce((s, b) => s + (getBossPrice(b.name, b.difficulty) / (b.partySize || 1)), 0)
  , 0);

  // Calculate progress percentage
  const progressPercentage = obtainableMeso > 0 ? totalMeso / obtainableMeso : 0;

  // --- 3. Character summary table ---
  const charSummaries = characters.map((char, idx) => {
    const charKey = `${char?.name || ''}-${idx}`;
    const bosses = char?.bosses || [];
    const cleared = bosses.filter(b => checked[charKey]?.[b.name + '-' + b.difficulty]).length;
    const total = bosses.length;
    const totalMeso = bosses.reduce((sum, b) => 
      checked[charKey]?.[b.name + '-' + b.difficulty] ? sum + Math.ceil(getBossPrice(b.name, b.difficulty) / (b.partySize || 1)) : sum, 0
    );
    return {
      name: char.name,
      cleared,
      total,
      allCleared: total > 0 && cleared === total,
      left: total - cleared,
      idx,
      totalMeso
    };
  });

  // Filtered summaries if hideCompleted is on
  const visibleCharSummaries = hideCompleted ? charSummaries.filter(cs => !cs.allCleared) : charSummaries;

  // --- 4. Custom checkbox component ---
  function CustomCheckbox({ checked, onChange, disabled = false }) {
    return (
      <div className="checkbox-wrapper" style={{ 
        transform: 'scale(0.8)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          style={{ 
            background: '#3a335a', 
            color: '#e6e0ff', 
            border: '1.5px solid #2d2540',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        />
        <svg viewBox="0 0 35.6 35.6">
          <circle className="background" cx="17.8" cy="17.8" r="17.8"></circle>
          <circle className="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
          <polyline className="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
        </svg>
      </div>
    );
  }

  // Only show main table, total meso, progress bar, and Tick All button if the selected character has bosses
  const showCharacterDetails = charBosses.length > 0;

  return (
    <div className="App dark" style={{ minHeight: '100vh', color: '#e6e0ff', padding: '2rem 0', background: '#28204a' }}>
      {crystalAnimation && (
        <CrystalAnimation
          startPosition={crystalAnimation.startPosition}
          endPosition={crystalAnimation.endPosition}
          onComplete={() => setCrystalAnimation(null)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 700, margin: '0 auto 1rem auto' }}>
        <button onClick={onBack} style={{ marginBottom: 24 }}>← Back to Calculator</button>
      </div>
      <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2rem', marginBottom: '0.5rem' }}>Weekly Boss Tracker</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1rem' }}>
        <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/bluecrystal.png" alt="Blue Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" style={{ width: 32, height: 32 }} />
      </div>

      {/* Week Navigation */}
      <WeekNavigator
        selectedWeekKey={selectedWeekKey}
        onWeekChange={handleWeekChange}
        availableWeeks={availableWeeks}
        isLoading={isLoadingWeekData}
        isReadOnlyMode={isReadOnlyMode}
        isHistoricalWeek={isHistoricalWeek}
      />

      {/* Top positioned elements */}
      <div style={{ position: 'absolute', top: 18, left: 32, zIndex: 10 }}>
        <span style={{ color: '#d6b4ff', fontSize: '1.08em', fontWeight: 700, letterSpacing: 1, background: 'rgba(128,90,213,0.08)', borderRadius: 8, padding: '0.3rem 1.1rem', boxShadow: '0 2px 8px #a259f722' }}>
          ID: {userCode}
        </span>
      </div>
      
      {/* Reset timer - top right position, only show for current week */}
      {selectedWeekKey === currentWeekKey && (
        <div style={{ 
          position: 'absolute', 
          top: 18, 
          right: 32, 
          zIndex: 10,
          background: 'linear-gradient(135deg, #3a2a5d, #28204a)', 
          borderRadius: 10, 
          padding: '0.8rem 1rem', 
          boxShadow: '0 4px 16px rgba(40, 20, 60, 0.3)',
          textAlign: 'center',
          border: '1px solid #4a4570',
          minWidth: 180
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, marginBottom: 6, color: '#b39ddb' }}>Next Reset</div>
          <div style={{ 
            fontSize: '1.1rem', 
            fontFamily: 'monospace', 
            fontWeight: 600, 
            display: 'flex',
            justifyContent: 'center',
            gap: '0.3rem',
            color: '#e6e0ff'
          }}>
            <span>{timeUntilReset.days}d</span>
            <span>{timeUntilReset.hours}h</span>
            <span>{timeUntilReset.minutes}m</span>
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.3rem', color: '#9f7aea' }}>
            Thursday 00:00 UTC
          </div>
        </div>
      )}

      {/* 3. Character summary table/list */}
      <div style={{ 
        maxWidth: 700, 
        margin: '0 auto 1.5rem auto', 
        background: '#28204a', 
        borderRadius: 10, 
        padding: '1rem', 
        boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)',
        textAlign: 'center',
        border: '1.5px solid #2d2540'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 }}>Weekly Clear Status</h3>
        {/* Progress Bar directly under heading */}
        <div style={{ margin: '0 auto 0.8rem auto', background: '#23203a', borderRadius: 8, padding: '1.2rem', border: '1px solid #3a335a', maxWidth: 420 }}>
          <div style={{ background: '#3a335a', height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <div style={{ background: 'linear-gradient(90deg, #805ad5, #a259f7)', height: '100%', width: `${obtainableMeso > 0 ? Math.min((totalMeso / obtainableMeso) * 100, 100) : 0}%`, borderRadius: 4, transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', color: '#b39ddb', fontSize: '0.9rem' }}>
            <span>{totalMeso.toLocaleString()}</span>
            <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 20, height: 20, margin: '0 auto' }} />
            <span>{obtainableMeso.toLocaleString()}</span>
          </div>
          {/* Checkbox moved here, under the progress bar */}
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <label style={{ fontSize: '0.98em', color: '#b39ddb', cursor: 'pointer', userSelect: 'none', display: 'inline-flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={e => setHideCompleted(e.target.checked)}
                style={{ marginRight: 6, accentColor: '#805ad5' }}
              />
              Hide characters with all bosses cleared
            </label>
          </div>
          {visibleCharSummaries.length === 0 && (
            <div style={{ color: '#888', fontSize: '1.05em', margin: '1.5rem 0 0 0', textAlign: 'center', width: '100%', display: 'block' }}>
              {hideCompleted ? 'No characters with bosses left to clear.' : 'No characters found.'}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {visibleCharSummaries.map(cs => (
            <div
              key={cs.name + '-' + cs.idx}
              onClick={() => setSelectedCharIdx(cs.idx)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!isReadOnlyMode) {
                  setPurgeTargetCharacter({ name: cs.name, idx: cs.idx });
                  setShowCharacterPurgeConfirm(true);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: selectedCharIdx === cs.idx ? '#3a335a' : '#23203a',
                borderRadius: 8,
                padding: '0.6rem 1rem',
                minWidth: 140,
                maxWidth: 160,
                boxShadow: '0 1px 4px rgba(40, 20, 60, 0.18)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: selectedCharIdx === cs.idx 
                  ? (isHistoricalWeek ? '1px solid #9f7aea' : '1px solid #805ad5')
                  : '1px solid #3a335a',
                textAlign: 'center',
                transform: 'translateY(0)',
                opacity: isHistoricalWeek ? 0.9 : 1,
                position: 'relative'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 20, 60, 0.25)';
                e.currentTarget.style.background = selectedCharIdx === cs.idx ? '#3a335a' : '#23203a';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(40, 20, 60, 0.18)';
                e.currentTarget.style.background = selectedCharIdx === cs.idx ? '#3a335a' : '#23203a';
              }}
            >
              {/* Historical week indicator */}
              {isHistoricalWeek && selectedCharIdx === cs.idx && (
                <div style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: isReadOnlyMode ? '#ff6b6b' : '#38a169',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  zIndex: 5
                }}>
                  {isReadOnlyMode ? '🔒' : '✏️'}
                </div>
              )}
              {cs.allCleared ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, fontSize: '1em', width: '100%' }}>
                  <span>{cs.name}</span>
                  <svg width="19" height="19" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#38a169"/><polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              ) : (
                <>
                  <span>{cs.name}</span>
                  {cs.total === 0 ? (
                    <span style={{ color: '#888', fontWeight: 500, fontSize: '0.95em' }}>No bosses</span>
                  ) : (
                    <span>{cs.cleared} / {cs.total} sold</span>
                  )}
                </>
              )}
              <span>
                {cs.totalMeso.toLocaleString()} meso
              </span>
            </div>
          ))}
        </div>

      </div>
      {/* Read-only mode indicator and controls for historical weeks */}
      {isHistoricalWeek && (
        <div style={{
          maxWidth: 700,
          margin: '0 auto 1rem auto',
          background: isReadOnlyMode 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.2))' 
            : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.2))',
          borderRadius: 12,
          padding: '1rem 1.5rem',
          fontWeight: 600,
          boxShadow: isReadOnlyMode 
            ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
            : '0 4px 12px rgba(34, 197, 94, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          border: isReadOnlyMode
            ? '2px solid rgba(239, 68, 68, 0.6)'
            : '2px solid rgba(34, 197, 94, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <span style={{ fontSize: '1.2rem' }}>
              {isReadOnlyMode ? '🔒' : '✏️'}
            </span>
            <div>
              <div style={{ 
                fontSize: '1rem', 
                marginBottom: '0.2rem',
                color: '#ffffff', // White text for maximum contrast
                fontWeight: 700,
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)', // Text shadow for readability
                filter: 'none' // Remove any glow effects
              }}>
                {isReadOnlyMode ? 'Read-Only Mode' : 'Edit Mode'}
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#f3f4f6', // Very light gray text
                fontWeight: 500,
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)', // Text shadow for readability
                filter: 'none', // Remove any glow effects
                opacity: 0.95
              }}>
                {isReadOnlyMode 
                  ? 'Historical week data is protected from changes'
                  : 'Editing enabled for historical week data'
                }
              </div>
            </div>
          </div>
          
          {/* Toggle button */}
          <button
            onClick={() => setReadOnlyOverride(!readOnlyOverride)}
            style={{
              background: isReadOnlyMode 
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
                : 'linear-gradient(135deg, #059669, #047857)',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff', // White text for maximum contrast
              padding: '0.6rem 1.2rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: isReadOnlyMode
                ? '0 2px 8px rgba(220, 38, 38, 0.4)'
                : '0 2px 8px rgba(5, 150, 105, 0.4)',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', // Text shadow for button text
              filter: 'none' // Remove any glow effects
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = isReadOnlyMode
                ? '0 4px 12px rgba(220, 38, 38, 0.6)'
                : '0 4px 12px rgba(5, 150, 105, 0.6)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isReadOnlyMode
                ? '0 2px 8px rgba(220, 38, 38, 0.4)'
                : '0 2px 8px rgba(5, 150, 105, 0.4)';
            }}
            title={isReadOnlyMode 
              ? 'Enable editing for this historical week' 
              : 'Disable editing to protect historical data'
            }
          >
            <span>{isReadOnlyMode ? '🔓' : '🔒'}</span>
            <span>{isReadOnlyMode ? 'Enable Edit' : 'Lock Data'}</span>
          </button>
        </div>
      )}

      {showCharacterDetails && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <button 
              onClick={handleTickAll} 
              disabled={isReadOnlyMode}
              style={{ 
                padding: '0.5rem 1.2rem', 
                borderRadius: 6, 
                background: isReadOnlyMode ? '#4a4a4a' : '#805ad5', 
                color: '#fff', 
                fontWeight: 600, 
                cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
                opacity: isReadOnlyMode ? 0.5 : 1,
                border: '1px solid #9f7aea'
              }}
              title={isReadOnlyMode ? 'Cannot modify historical week data' : undefined}
            >
              {charBosses.every(b => checked[`${char?.name || ''}-${selectedCharIdx}`]?.[b.name + '-' + b.difficulty]) && charBosses.length > 0 ? 'Untick All' : 'Tick All'}
            </button>
          </div>
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, border: '1px solid #e0e0ef', borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#3a2a5d', color: '#e6e0ff' }}>
                  <th style={{ padding: '6px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 180 }}>Boss</th>
                  <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 110 }}>Difficulty</th>
                  <th style={{ padding: '6px 24px', textAlign: 'right', fontWeight: 600, fontSize: '0.9em', minWidth: 110 }}>Mesos</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 90 }}>Cleared</th>
                </tr>
              </thead>
              <tbody>
                {sortedBosses.map((b, idx) => {
                  const bossObj = bossData.find(bd => bd.name === b.name);
                  const isChecked = !!checked[charKey]?.[b.name + '-' + b.difficulty];
                  const pitched = bossObj?.pitchedItems || [];
                  return (
                    <tr
                      key={b.name + '-' + b.difficulty}
                      style={{
                        background: idx % 2 === 0 ? '#23203a' : '#201c32',
                        border: '1px solid #3a335a',
                        transition: 'background-color 0.2s ease, transform 0.2s ease',
                        cursor: isReadOnlyMode ? 'default' : 'pointer',
                        color: '#e6e0ff',
                        ...(isReadOnlyMode && { opacity: 0.8 })
                      }}
                      onMouseOver={e => !isReadOnlyMode && (e.currentTarget.style.background = '#2a2540')}
                      onMouseOut={e => !isReadOnlyMode && (e.currentTarget.style.background = idx % 2 === 0 ? '#23203a' : '#201c32')}
                      onClick={(e) => {
                        // Only trigger if the click wasn't on the checkbox or pitched item
                        // Also check if it's read-only mode
                        if (!isReadOnlyMode && !e.target.closest('.checkbox-wrapper') && !e.target.closest('.pitched-item-icon')) {
                          handleCheck(b, !isChecked, e);
                        }
                      }}
                    >
                      <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {bossObj?.image && (
                          <img
                            src={bossObj.image}
                            alt={b.name}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: 'contain',
                              borderRadius: 6,
                              background: '#fff2',
                              marginRight: 8,
                              transition: 'transform 0.2s ease'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        )}
                        <span style={{ fontWeight: 600 }}>{b.name}</span>
                        {pitched.length > 0 && (
                          (b.name === 'Lotus' && (b.difficulty === 'Hard' || b.difficulty === 'Extreme')) ||
                          (b.name !== 'Lotus' && ['Hard', 'Chaos', 'Extreme', 'Hell'].includes(b.difficulty))
                        ) && (
                          <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                            {pitched.map(item => {
                              // For Lotus, TC only on Extreme, others on Hard/Extreme
                              if (b.name === 'Lotus') {
                                if (item.name === 'Total Control' && b.difficulty !== 'Extreme') return null;
                                if ((item.name === 'Berserked' || item.name === 'Black Heart') && !['Hard', 'Extreme'].includes(b.difficulty)) return null;
                              }
                              const key = getPitchedKey(char.name, selectedCharIdx, b.name, item.name, weekKey);
                              const got = !!pitchedChecked[key];
                              return (
                                <span
                                  key={item.name}
                                  className="pitched-item-icon"
                                  title={`Track: ${item.name}`}
                                  style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
                                    borderRadius: 6,
                                    boxShadow: got ? '0 0 8px #a259f7' : 'none',
                                    border: got ? '2px solid #a259f7' : '2px solid #3a335a',
                                    background: got ? '#3a335a' : '#23203a',
                                    transition: 'box-shadow 0.2s, border 0.2s, background 0.2s',
                                    width: 32,
                                    height: 32,
                                    marginLeft: 2,
                                    opacity: isReadOnlyMode ? 0.6 : 1
                                  }}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    
                                    // Prevent interaction for historical weeks
                                    if (isReadOnlyMode) {
                                      console.log('Pitched item click blocked - read-only mode');
                                      return;
                                    }
                                    
                                    // Set user interaction flag to prevent sync conflicts
                                    userInteractionRef.current = true;
                                    console.log('🖱️ USER: Pitched item clicked:', { item, boss: b.name, character: char.name, currentState: got });
                                    
                                    // If boss is not cleared, check it too
                                    const bossCleared = !!checked[charKey]?.[b.name + '-' + b.difficulty];
                                    if (!bossCleared) {
                                      console.log('🖱️ USER: Auto-checking boss since it was not cleared');
                                      handleCheck(b, true, e);
                                    }
                                    
                                    // Set loading state
                                    setLoadingPitchedItems(prev => ({ ...prev, [key]: true }));
                                    
                                    try {
                                      if (!userCode) {
                                        setError('Please log in to save pitched items to cloud.');
                                        return;
                                      }

                                      // Determine the new state (toggle current state)
                                      const newGotState = !got;
                                      console.log(`🖱️ USER: Toggling pitched item from ${got} to ${newGotState}`);
                                      
                                      // 1. Update local state optimistically
                                      setPitchedChecked(prev => {
                                        const newState = { ...prev };
                                        if (newGotState) {
                                          newState[key] = true;
                                        } else {
                                          delete newState[key];
                                        }
                                        console.log('🖱️ USER: Updated local pitched state:', newGotState ? 'added' : 'removed');
                                        return newState;
                                      });
                                      
                                      // 2. Save to cloud
                                      console.log('🖱️ USER: Saving to cloud...');
                                      const result = await savePitchedItem(userCode, {
                                        character: char.name,
                                        bossName: b.name,
                                        itemName: item.name,
                                        itemImage: item.image,
                                        date: new Date().toISOString()
                                      }, got); // got=true means remove, got=false means add
                                      
                                      if (!result.success) {
                                        console.error('🖱️ USER: Cloud save failed:', result.error);
                                        setError('Failed to save to cloud. Reverting changes.');
                                        // Revert optimistic update
                                        setPitchedChecked(prev => {
                                          const revertState = { ...prev };
                                          if (got) {
                                            revertState[key] = true; // restore original state
                                          } else {
                                            delete revertState[key]; // restore original state
                                          }
                                          return revertState;
                                        });
                                      } else {
                                        console.log('🖱️ USER: Cloud save successful');
                                        // Note: We removed refreshPitchedItems to prevent sync conflicts!
                                        // The periodic background sync will handle consistency
                                      }
                                      
                                    } catch (error) {
                                      console.error('🖱️ USER: Error in pitched item click handler:', error);
                                      setError('Failed to save pitched item. Please try again.');
                                      // Revert optimistic update
                                      setPitchedChecked(prev => {
                                        const revertState = { ...prev };
                                        if (got) {
                                          revertState[key] = true; // restore original state
                                        } else {
                                          delete revertState[key]; // restore original state
                                        }
                                        return revertState;
                                      });
                                    } finally {
                                      // Clear loading state
                                      setLoadingPitchedItems(prev => {
                                        const newState = { ...prev };
                                        delete newState[key];
                                        return newState;
                                      });
                                      
                                      // Clear user interaction flag after a delay to allow UI to settle
                                      setTimeout(() => {
                                        userInteractionRef.current = false;
                                        console.log('🖱️ USER: Interaction flag cleared, sync can resume');
                                      }, 1000);
                                    }
                                    
                                    startStatsTrackingIfNeeded();
                                  }}
                                >
                                  {loadingPitchedItems[key] ? (
                                    <div style={{
                                      width: 28,
                                      height: 28,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      position: 'relative'
                                    }}>
                                      <div style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        border: '3px solid rgba(162, 89, 247, 0.2)',
                                        borderTopColor: '#a259f7',
                                        animation: 'pitched-spinner 1s linear infinite',
                                        position: 'absolute'
                                      }} />
                                    </div>
                                  ) : (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      style={{
                                        width: 28,
                                        height: 28,
                                        objectFit: 'contain',
                                        borderRadius: 4,
                                        opacity: got ? 1 : 0.7,
                                        filter: got ? 'drop-shadow(0 0 6px #a259f7)' : 'none',
                                        transition: 'opacity 0.2s, filter 0.2s'
                                      }}
                                    />
                                  )}
                                  {got && (
                                    <span style={{
                                      position: 'absolute',
                                      top: 2,
                                      right: 2,
                                      background: '#a259f7',
                                      color: '#fff',
                                      borderRadius: '50%',
                                      width: 14,
                                      height: 14,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      boxShadow: '0 1px 4px #0004'
                                    }}>✓</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'left' }}>
                        <span>{b.difficulty}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                        <span>{Math.floor(getBossPrice(b.name, b.difficulty) / (b.partySize || 1)).toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span onClick={e => e.stopPropagation()}>
                          <CustomCheckbox
                            checked={isChecked}
                            onChange={e => !isReadOnlyMode && handleCheck(b, e.target.checked, e)}
                            disabled={isReadOnlyMode}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ 
            marginTop: '2rem', 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            textAlign: 'center' 
          }}>
            {/* Other content if needed */}
          </div>
        </>
      )}
      {/* Action buttons at top */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, maxWidth: 700, margin: '0 auto 12px auto' }}>
        <button
          style={{
            background: 'linear-gradient(135deg, #805ad5, #9f7aea)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '0.8rem 2.5rem',
            fontWeight: 700,
            fontSize: '1.1em',
            cursor: 'pointer',
            width: '100%',
            maxWidth: 320,
            boxShadow: '0 4px 12px rgba(128, 90, 213, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '0.5px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(128, 90, 213, 0.6)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(128, 90, 213, 0.4)';
          }}
          onClick={() => setShowStats(true)}
        >
           View Stats
        </button>
      </div>
      {/* Stats Modal Panel */}
      {showStats && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(40,32,74,0.92)',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
          onClick={() => setShowStats(false)}
        >
          <div className="modal-fade" style={{ background: '#2d2540', borderRadius: 14, padding: '2.5rem 2rem', maxWidth: 600, color: '#e6e0ff', boxShadow: '0 4px 24px #0006', position: 'relative', minWidth: 320, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowStats(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', color: '#fff', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} title="Close">×</button>
            <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>Yearly Stats</h2>
            {/* Year selector dropdown */}
            <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ background: '#3a335a', color: '#e6e0ff', border: '1px solid #805ad5', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: '1.08em', minWidth: 120, textAlign: 'center' }}>
                {allYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {yearlyPitchedSummary.length === 0 && (
                <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#b39ddb', textAlign: 'center' }}>
                  No ptiched were found for {selectedYear}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 8 }}>Pitched Items Obtained:</div>
            {isLoadingCloudStats ? (
              <div style={{ textAlign: 'center', padding: '15px', color: '#b39ddb' }}>Loading cloud stats...</div>
            ) : yearlyPitchedSummary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#888', fontSize: '1.1rem' }}>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8, justifyContent: 'center' }}>
                {yearlyPitchedSummary.map((p, i) => {
                  const hasCloudItems = p.history && p.history.some(h => h.cloud);
                  const hasLocalItems = p.history && p.history.some(h => h.local);
                  
                  return (
                    <span
                      key={i}
                      className="pitched-count-white pitched-hover"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#3a335a',
                        borderRadius: 6,
                        padding: '2px 10px',
                        fontSize: '1em',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: hasCloudItems ? '0 0 8px #805ad5' : '0 1px 4px #0002',
                        border: hasCloudItems ? '1px solid #805ad5' : 'none',
                        transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1)',
                        position: 'relative',
                      }}
                      onClick={() => { setPitchedModalItem(p); setShowPitchedModal(true); }}
                      title={`Click for details${hasCloudItems ? ' (includes cloud data)' : ''}`}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                        e.currentTarget.style.boxShadow = '0 4px 16px #a259f7cc';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = hasCloudItems ? '0 0 8px #805ad5' : '0 1px 4px #0002';
                      }}
                    >
                      <img src={p.image} alt={p.name} style={{ width: 22, height: 22, borderRadius: 4, marginRight: 2, transition: 'box-shadow 0.18s cubic-bezier(.4,2,.6,1)' }} />
                      {p.name}
                      <span className="pitched-count-white" style={{ color: '#fff', marginLeft: 6, fontWeight: 700, fontSize: '1.1em' }}>×{p.count}</span>
                      {hasCloudItems && (
                        <span style={{ 
                          position: 'absolute',
                          top: -5, 
                          right: -5,
                          background: '#805ad5', 
                          color: 'white', 
                          borderRadius: '50%',
                          width: 16,
                          height: 16,
                          fontSize: '0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 4px #0004'
                        }}>☁️</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer' }}
                onClick={() => setShowStatsResetConfirm(true)}
              >
                Reset Stats
              </button>
            </div>
            {/* Double-confirm dialog */}
            {showStatsResetConfirm && (
              <div style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(40,32,74,0.92)',
                zIndex: 6000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="modal-fade" style={{ background: '#2d2540', borderRadius: 14, padding: '2rem 1.5rem', maxWidth: 340, color: '#e6e0ff', boxShadow: '0 4px 24px #0006', position: 'relative', minWidth: 220, textAlign: 'center' }}>
                  <h3 style={{ color: '#ffbaba', marginBottom: 16 }}>Are you sure?</h3>
                  <p style={{ marginBottom: 18 }}>This will permanently erase all stats. This cannot be undone.</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      onClick={() => setShowStatsResetConfirm(false)}
                      style={{ background: '#3a335a', color: '#e6e0ff', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', minWidth: 100 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Clear stats data
                        setStatsPanel({ monthly: [], yearly: [] });
                        // REMOVED: localStorage.setItem('ms-stats-panel', JSON.stringify({ monthly: [], yearly: [] })); // Now handled by cloud storage
                        setPitchedChecked({});
                        // REMOVED: localStorage.setItem('ms-weekly-pitched', JSON.stringify({})); // Now handled by cloud storage
                        
                        // Close confirmation dialog
                        setShowStatsResetConfirm(false);
                        
                        // Show success message
                        setResetSuccessVisible(true);
                        
                        // Auto-close success message after 2 seconds
                        setTimeout(() => {
                          setResetSuccessVisible(false);
                          setShowStats(false);
                        }, 2000);
                      }}
                      style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', minWidth: 100 }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showPitchedModal && pitchedModalItem && (
              <div style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(40,32,74,0.92)',
                zIndex: 6000,
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center'
              }}
                onClick={() => setShowPitchedModal(false)}
              >
                <div className="modal-fade" style={{ background: '#2d2540', borderRadius: 14, padding: '2rem 1.5rem', maxWidth: 400, color: '#e6e0ff', boxShadow: '0 4px 24px #0006', position: 'relative', minWidth: 220, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowPitchedModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', color: '#fff', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }} title="Close">×</button>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
                    <img src={pitchedModalItem.image} alt={pitchedModalItem.name} style={{ width: 32, height: 32, borderRadius: 6 }} />
                    <span style={{ fontWeight: 700, fontSize: '1.1em', color: '#a259f7' }}>{pitchedModalItem.name}</span>
                  </div>
                  <div style={{ marginBottom: 10, color: '#b39ddb', fontWeight: 600 }}>Obtained by:</div>
                  {pitchedModalDetails.length === 0 ? (
                    <div style={{ color: '#888', marginBottom: 8 }}>None this year.</div>
                  ) : (
                    <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1em', background: 'none' }}>
                        <thead>
                          <tr style={{ color: '#b39ddb', background: 'none' }}>
                            <th style={{ padding: '4px 8px', fontWeight: 700 }}>Character</th>
                            <th style={{ padding: '4px 8px', fontWeight: 700 }}>Date</th>
                            <th style={{ padding: '4px 8px', fontWeight: 700 }}>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pitchedModalDetails.map((d, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#23203a' : '#201c32' }}>
                              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{d.char}</td>
                              <td style={{ padding: '4px 8px', color: '#b39ddb' }}>{d.date}</td>
                              <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                {d.cloud && (
                                  <span style={{ 
                                    background: '#805ad5', 
                                    color: 'white', 
                                    padding: '1px 4px', 
                                    borderRadius: 4, 
                                    fontSize: '0.7rem',
                                    display: 'inline-block'
                                  }}>☁️</span>
                                )}
                                {d.local && (
                                  <span style={{ 
                                    background: '#38a169', 
                                    color: 'white', 
                                    padding: '1px 4px', 
                                    borderRadius: 4, 
                                    fontSize: '0.7rem',
                                    display: 'inline-block'
                                  }}>💻</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Success message after stats reset */}
            {resetSuccessVisible && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                zIndex: 7000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div 
                  className="modal-fade" 
                  style={{ 
                    background: '#2d2540', 
                    borderRadius: 14, 
                    padding: '2rem 1.5rem', 
                    maxWidth: 340, 
                    color: '#e6e0ff', 
                    boxShadow: '0 4px 24px #0006', 
                    position: 'relative', 
                    minWidth: 220, 
                    textAlign: 'center' 
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={{ color: '#38a169', marginBottom: 16, fontSize: '1.5rem' }}>Stats reset!</h3>
                  <p style={{ marginBottom: 24, fontSize: '1.1rem' }}>Your stats have been cleared.</p>
                  <button
                    onClick={closeResetSuccess}
                    style={{ 
                      background: '#3a335a', 
                      color: '#e6e0ff', 
                      border: 'none', 
                      borderRadius: 8, 
                      padding: '0.6rem 1.5rem', 
                      fontWeight: 600, 
                      fontSize: '1.1rem', 
                      cursor: 'pointer', 
                      marginTop: 10, 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)' 
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pitched-spinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Export the WeeklyTracker component as default
export default WeeklyTracker;