import { useState, useEffect, useMemo, useRef } from 'react';
import { savePitchedItem, getYearlyPitchedStats, removeManyPitchedItems } from './pitched-data-service';
import { getTimeUntilReset, getCurrentWeekKey, getCurrentMonthKey, getCurrentYearKey } from './utils/weekUtils';
import { STORAGE_KEYS, MONTH_NAMES, BOSS_DIFFICULTIES, COOLDOWNS } from './constants';

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

  const weekKey = getCurrentWeekKey();
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());
  const [crystalAnimation, setCrystalAnimation] = useState(null);
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const [error, setError] = useState(null);
  
  // Track user interactions to prevent sync conflicts
  const userInteractionRef = useRef(false);
  
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
      const codeToUse = userCodeValue || userCode || localStorage.getItem('ms-user-code');
      
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
  
  // Fetch pitched items on component mount
  useEffect(() => {
    if (userCode) {
      refreshPitchedItems(userCode);
    }
  }, [userCode]);
  
  // Add a dedicated effect for synchronizing pitched items with boss checks
  const [pitchedItemsSynced, setPitchedItemsSynced] = useState(false);
  const [cloudPitchedItems, setCloudPitchedItems] = useState([]);
  
  // First, fetch pitched items from database via user code in localStorage
  useEffect(() => {
    const fetchPitchedItemsFromDatabase = async () => {
      try {
        const userCode = localStorage.getItem('ms-user-code');
        if (!userCode) {
          console.log('No user code found in localStorage');
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
  }, []);
  
  // Import ensureDataSynchronization from pitched-data-service.js
  useEffect(() => {
    // Run whenever cloud pitched items change, or when week changes
    if (cloudPitchedItems.length === 0) return;
    
    const syncPitchedWithBossChecks = async () => {
      try {
        console.log(`🔄 SYNC: Syncing pitched items for week ${weekKey} with boss checks...`);
        
        // Skip sync if user is actively interacting
        if (userInteractionRef.current) {
          console.log(`⏸️ SYNC: Skipping sync - user interaction in progress`);
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
  
  // Reset pitchedChecked if week changes
  useEffect(() => {
    const savedWeekKey = localStorage.getItem('ms-weekly-pitched-week-key');
    if (savedWeekKey !== weekKey) {
      setPitchedChecked({});
      // REMOVED: localStorage.setItem('ms-weekly-pitched-week-key', weekKey); // Now handled by cloud storage
    }
  }, [weekKey]);

  // Handle boss checkbox changes - handles both direct calls and checkbox event objects
  const handleCheck = async (bossOrEvent, checkedValOrBoss, event = null) => {
    try {
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
      const userCode = localStorage.getItem('ms-user-code');
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
          
          // 2. Now also save this as a boss run in the new format
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
        } catch (dbError) {
          console.error('Error saving boss state to database:', dbError);
          // Continue with local updates even if database sync fails
        }
      }
      
      // If boss is being unticked, also untick all pitched items for this boss/character/week
      if (!checkedVal) {
        const weekKey = getCurrentWeekKey();
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
          if (userCode) {
            const itemsToRemove = bossObj.pitchedItems.map(item => ({
              character: charName,
              bossName: bossName,
              itemName: item.name,
              weekKey
            }));
            
            if (itemsToRemove.length > 0) {
              removeManyPitchedItems(userCode, itemsToRemove).catch(err => {
                console.error('Error removing pitched items:', err);
              });
            }
          }
        }
      }
      
      startStatsTrackingIfNeeded();
    } catch (err) {
      console.error('Error in handleCheck:', err);
      setError('Failed to update boss status. Please try again.');
    }
  };

  // Update handleTickAll to handle pitched items
  const handleTickAll = async () => {
    try {
      const charKey = `${characters[selectedCharIdx]?.name || ''}-${selectedCharIdx}`;
      const currentState = checked[charKey] || {};
      const allChecked = charBosses.every(b => currentState[b.name + '-' + b.difficulty]);
      
      const newChecked = {
        ...checked,
        [charKey]: Object.fromEntries(charBosses.map(b => [b.name + '-' + b.difficulty, !allChecked]))
      };

      setChecked(newChecked);

      // If checking all bosses and not unticking
      if (!allChecked) {
        // Get userCode for cloud syncing
        const userCode = localStorage.getItem('ms-user-code');
        
        if (userCode) {
          // For each boss that has pitched items, mark them in the UI
          // but don't automatically mark them as obtained in the cloud
          // Users still need to click each item individually to track it
          charBosses.forEach(boss => {
            const bossObj = bossData.find(bd => bd.name === boss.name);
            // No need to save pitched items to cloud here, user will click on them individually
          });
        }
      } 
      // If unticking all, also untick all pitched items for this character
      else {
        const newPitchedChecked = { ...pitchedChecked };
        const userCode = localStorage.getItem('ms-user-code');
        const itemsToRemove = [];
        charBosses.forEach(boss => {
          const bossObj = bossData.find(bd => bd.name === boss.name);
          if (bossObj?.pitchedItems) {
            bossObj.pitchedItems.forEach(item => {
              const key = getPitchedKey(characters[selectedCharIdx].name, selectedCharIdx, boss.name, item.name, weekKey);
              if (newPitchedChecked[key]) {
                delete newPitchedChecked[key];
                // Collect for batch removal
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
        setPitchedChecked(newPitchedChecked);
        // REMOVED: localStorage.setItem('ms-weekly-pitched', JSON.stringify(newPitchedChecked)); // Now handled by cloud storage
        // Batch remove from cloud
        if (userCode && itemsToRemove.length > 0) {
          await removeManyPitchedItems(userCode, itemsToRemove);
        }
      }
    } catch (err) {
      console.error('Error in handleTickAll:', err);
      setError('Failed to update all bosses. Please try again.');
    }
  };

  // Check if week has changed
  useEffect(() => {
    try {
      const savedWeekKey = localStorage.getItem('ms-weekly-week-key');
      if (savedWeekKey !== weekKey) {
        // REMOVED: setChecked({}); // This was wiping out boss clears - now handled by App.jsx
        // REMOVED: localStorage.setItem('ms-weekly-week-key', weekKey); // Now handled by cloud storage
      }
    } catch (err) {
      console.error('Error checking week change:', err);
      setError('Failed to check week change. Please refresh the page.');
    }
  }, [weekKey, setChecked]);

  // Save checked state to localStorage
  useEffect(() => {
    try {
      // REMOVED: localStorage.setItem('ms-weekly-clears', JSON.stringify({ weekKey, checked })); // Now handled by cloud storage
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      setError('Failed to save progress. Please try again.');
    }
  }, [checked, weekKey]);

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

  // Only load from localStorage on first mount
  const [progressData, setProgressData] = useState(() => {
    const saved = localStorage.getItem('ms-progress');
    return saved ? JSON.parse(saved) : {
      weeklyTotal: 0,
      lastReset: new Date().toISOString(),
      history: []
    };
  });

  // Calculate total meso value for a character
  const charTotal = (char) => char.bosses.reduce((sum, b) => sum + Math.ceil(b.price / (b.partySize || 1)), 0);

  // Calculate total meso value for all characters
  const overallTotal = characters.reduce((sum, c) => sum + charTotal(c), 0);

  // Update progress when total changes
  useEffect(() => {
    setProgressData(prev => ({
      ...prev,
      weeklyTotal: overallTotal
    }));
    // REMOVED: localStorage.setItem('ms-progress', JSON.stringify(progressData)); // Now handled by cloud storage
  }, [overallTotal]);

  // Update progress tracking
  useEffect(() => {
    const now = new Date();
    const lastReset = new Date(progressData.lastReset);
    const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

    // Reset weekly total if it's been 7 days
    if (daysSinceReset >= 7) {
      setProgressData(prev => ({
        weeklyTotal: 0,
        lastReset: now.toISOString(),
        history: [...prev.history, { date: prev.lastReset, total: prev.weeklyTotal }]
      }));
    }
  }, [progressData.lastReset]);

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if any character has at least one selected boss
  const anyBossesSelected = characters.some(char => (char.bosses || []).length > 0);

  // Stats modal state
  const [showStats, setShowStats] = useState(false);
  const [showStatsResetConfirm, setShowStatsResetConfirm] = useState(false);
  // Persistent stats (never reset unless user requests)
  const [statsPanel, setStatsPanel] = useState(() => {
    try {
      const saved = localStorage.getItem('ms-stats-panel');
      if (!saved) return { monthly: [], yearly: [] };
      
      const parsed = JSON.parse(saved);
      // Ensure the structure is correct
      return {
        monthly: Array.isArray(parsed.monthly) ? parsed.monthly : [],
        yearly: Array.isArray(parsed.yearly) ? parsed.yearly : []
      };
    } catch (error) {
      console.error('Error parsing stats panel from localStorage:', error);
      return { monthly: [], yearly: [] };
    }
  });
  // Save statsPanel to localStorage
  useEffect(() => {
    // REMOVED: localStorage.setItem('ms-stats-panel', JSON.stringify(statsPanel)); // Now handled by cloud storage
  }, [statsPanel]);
  // --- Stats tracking flag ---
  const [statsTrackingStarted, setStatsTrackingStarted] = useState(() => {
    return localStorage.getItem('ms-stats-tracking-started') === 'true';
  });
  // Set flag on first input
  function startStatsTrackingIfNeeded() {
    if (!statsTrackingStarted) {
      setStatsTrackingStarted(true);
      // REMOVED: localStorage.setItem('ms-stats-tracking-started', 'true'); // Now handled by cloud storage
    }
  }
  // --- Update stats panel on pitched/clears change, only if tracking started ---
  useEffect(() => {
    if (!statsTrackingStarted) return;
    if (showStats) return;
    
    const weekKey = getCurrentWeekKey();
    const monthKey = getCurrentMonthKey();
    const yearKey = getCurrentYearKey();

    // Gather monthly data
    const monthlyData = [];
    characters.forEach((char, charIdx) => {
      (char.bosses || []).forEach(boss => {
        const bossObj = bossData.find(bd => bd.name === boss.name);
        if (!bossObj) return;
        const cleared = checked[`${char.name}-${charIdx}`]?.[boss.name + '-' + boss.difficulty];
        const pitched = (bossObj.pitchedItems || []).map(item => {
          const key = getPitchedKey(char.name, charIdx, boss.name, item.name, weekKey);
          return { name: item.name, image: item.image, obtained: !!pitchedChecked[key] };
        });
        monthlyData.push({
          char: char.name,
          boss: boss.name,
          difficulty: boss.difficulty,
          cleared,
          mesos: cleared ? getBossPrice(boss.name, boss.difficulty) / (boss.partySize || 1) : 0,
          pitched: pitched.filter(p => p.obtained),
          weekKey
        });
      });
    });

    // Update monthly stats
    setStatsPanel(prev => {
      const newMonthly = prev.monthly.filter(m => m.monthKey !== monthKey);
      const monthData = newMonthly.find(m => m.monthKey === monthKey) || { monthKey, data: [] };
      
      // Remove the current week's data if it exists
      monthData.data = monthData.data.filter(d => d.weekKey !== weekKey);
      // Add the new data
      monthData.data.push({ weekKey, monthlyData });
      
      newMonthly.push(monthData);
      
      // Update yearly stats
      const newYearly = prev.yearly.filter(y => y.yearKey !== yearKey);
      const yearData = newYearly.find(y => y.yearKey === yearKey) || { yearKey, data: [] };
      
      // Remove the current week's data if it exists
      yearData.data = yearData.data.filter(d => d.weekKey !== weekKey);
      // Add the new data
      yearData.data.push({ weekKey, monthlyData });
      
      newYearly.push(yearData);

      const newStats = {
        monthly: newMonthly,
        yearly: newYearly
      };

      // Save to localStorage immediately
      // REMOVED: localStorage.setItem('ms-stats-panel', JSON.stringify(newStats)); // Now handled by cloud storage
      
      return newStats;
    });
  }, [characters, checked, pitchedChecked, showStats, statsTrackingStarted]);

  // --- Brand new confirmation state management ---
  const [resetSuccessVisible, setResetSuccessVisible] = useState(false);
  
  // --- Separate function to handle the actual data reset ---
  const resetAllStatsData = () => {
    // Clear stats panel
    setStatsPanel({ monthly: [], yearly: [] });
    // REMOVED: localStorage.setItem('ms-stats-panel', JSON.stringify({ monthly: [], yearly: [] })); // Now handled by cloud storage
    
    // Clear pitched items
    setPitchedChecked({});
    // REMOVED: localStorage.setItem('ms-weekly-pitched', JSON.stringify({})); // Now handled by cloud storage
    
    // Reset selectors
    setSelectedYear(getCurrentYearKey());
    setSelectedChar('');
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

  // Cloud-based pitched items stats
  const [cloudPitchedStats, setCloudPitchedStats] = useState({});
  const [isLoadingCloudStats, setIsLoadingCloudStats] = useState(false);
  
  // Fetch cloud-based pitched items stats when viewing stats
  useEffect(() => {
    if (showStats) {
      const fetchCloudStats = async () => {
        try {
          setIsLoadingCloudStats(true);
          const userCode = localStorage.getItem('ms-user-code');
          
          if (userCode) {
            const result = await getYearlyPitchedStats(userCode);
            if (result.success) {
              setCloudPitchedStats(result.data);
            }
          }
        } catch (error) {
          console.error('Error fetching cloud pitched stats:', error);
        } finally {
          setIsLoadingCloudStats(false);
        }
      };
      
      fetchCloudStats();
    }
  }, [showStats]);
  
  // State for selected year in stats modal
  const allYears = useMemo(() => {
    if (!statsPanel || !statsPanel.yearly || !Array.isArray(statsPanel.yearly)) return [];
    // Combine years from stats panel and cloud pitched stats
    const statsYears = statsPanel.yearly.map(y => y.yearKey);
    const cloudYears = Object.keys(cloudPitchedStats);
    
    // Combine and deduplicate years
    const allYearsSet = new Set([...statsYears, ...cloudYears]);
    return Array.from(allYearsSet).sort((a, b) => b.localeCompare(a));
  }, [statsPanel.yearly, cloudPitchedStats]);
  
  const [selectedYear, setSelectedYear] = useState(() => {
    return allYears && allYears.length > 0 ? allYears[0] : getCurrentYearKey();
  });
  useEffect(() => {
    if (allYears && Array.isArray(allYears) && allYears.length > 0) {
      if (!allYears.includes(selectedYear)) {
        setSelectedYear(allYears[0]);
      }
    }
    // eslint-disable-next-line
  }, [allYears]);

  // --- Combined local and cloud pitched items summary ---
  const yearlyPitchedSummary = useMemo(() => {
    // Start with an empty map to store all pitched items
    const pitchedMap = new Map();
    
    // Process local data from statsPanel
    if (statsPanel?.yearly && Array.isArray(statsPanel.yearly)) {
      const yearData = statsPanel.yearly.find(y => y.yearKey === selectedYear);
      if (yearData?.data) {
        yearData.data.forEach(w => {
          if (!w || !w.monthlyData) return;
          w.monthlyData.forEach(d => {
            if (!d || !d.pitched || !Array.isArray(d.pitched)) return;
            d.pitched.forEach(p => {
              if (!p || !p.name || !p.image) return;
              const key = p.name + '|' + p.image;
              if (!pitchedMap.has(key)) pitchedMap.set(key, { ...p, count: 0, history: [], source: 'local' });
              pitchedMap.get(key).count += 1;
              const [year, weekNum] = d.weekKey.split('-');
              const jan1 = new Date(Date.UTC(parseInt(year), 0, 1));
              const weekOffset = (parseInt(weekNum) - 1) * 7;
              const weekDate = new Date(jan1.getTime() + weekOffset * 24 * 60 * 60 * 1000);
              const monthNum = weekDate.getUTCMonth();
              const day = weekDate.getUTCDate();
              pitchedMap.get(key).history.push({ char: d.char, date: `${MONTH_NAMES[monthNum]} ${day}`, local: true });
            });
          });
        });
      }
    }
    
    // Process cloud data from cloudPitchedStats
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
          fullDate: item.date  // Store full date for sorting
        });
      });
    }
    
    // Convert map to array and sort by count (highest first) then name
    const result = Array.from(pitchedMap.values());
    
    // Sort each item's history by date (newest first)
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
  }, [statsPanel.yearly, selectedYear, cloudPitchedStats]);

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
  function CustomCheckbox({ checked, onChange }) {
    return (
      <div className="checkbox-wrapper" style={{ transform: 'scale(0.8)' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ background: '#3a335a', color: '#e6e0ff', border: '1.5px solid #2d2540' }}
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

      <div style={{ position: 'absolute', top: 18, left: 32, zIndex: 10 }}>
        <span style={{ color: '#d6b4ff', fontSize: '1.08em', fontWeight: 700, letterSpacing: 1, background: 'rgba(128,90,213,0.08)', borderRadius: 8, padding: '0.3rem 1.1rem', boxShadow: '0 2px 8px #a259f722' }}>
          ID: {userCode}
        </span>
      </div>
      
      {/* Current Week Display - Make it more prominent */}
      <div style={{ 
        maxWidth: 700, 
        margin: '0 auto 1rem auto', 
        background: 'linear-gradient(135deg, #3a2a5d, #28204a)', 
        borderRadius: 12, 
        padding: '1rem', 
        boxShadow: '0 4px 16px rgba(40, 20, 60, 0.25)',
        textAlign: 'center',
        border: '2px solid #805ad5'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          marginBottom: 8,
          color: '#a259f7',
          fontWeight: 700,
          textShadow: '0 0 10px rgba(162, 89, 247, 0.5)'
        }}>
          CURRENT WEEK: {weekKey}
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: 10 }}>Next Reset</h3>
        <div style={{ 
          fontSize: '1.5rem', 
          fontFamily: 'monospace', 
          fontWeight: 600, 
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>{timeUntilReset.days}d</span>
          <span>{timeUntilReset.hours}h</span>
          <span>{timeUntilReset.minutes}m</span>
        </div>
        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Thursday 00:00 UTC
        </div>
      </div>

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
                border: '1px solid #3a335a',
                textAlign: 'center',
                transform: 'translateY(0)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(40, 20, 60, 0.25)',
                  background: '#2a2540'
                }
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
      {showCharacterDetails && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={handleTickAll} style={{ 
              padding: '0.5rem 1.2rem', 
              borderRadius: 6, 
              background: '#805ad5', 
              color: '#fff', 
              fontWeight: 600, 
              cursor: 'pointer',
              border: '1px solid #9f7aea'
            }}>
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
                        cursor: 'pointer',
                        color: '#e6e0ff'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#2a2540'}
                      onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#23203a' : '#201c32'}
                      onClick={(e) => {
                        // Only trigger if the click wasn't on the checkbox or pitched item
                        if (!e.target.closest('.checkbox-wrapper') && !e.target.closest('.pitched-item-icon')) {
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
                                    cursor: 'pointer',
                                    borderRadius: 6,
                                    boxShadow: got ? '0 0 8px #a259f7' : 'none',
                                    border: got ? '2px solid #a259f7' : '2px solid #3a335a',
                                    background: got ? '#3a335a' : '#23203a',
                                    transition: 'box-shadow 0.2s, border 0.2s, background 0.2s',
                                    width: 32,
                                    height: 32,
                                    marginLeft: 2
                                  }}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    
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
                                      const userCodeVal = userCode || localStorage.getItem('ms-user-code');
                                      if (!userCodeVal) {
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
                                      const result = await savePitchedItem(userCodeVal, {
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
                            onChange={e => handleCheck(b, e.target.checked, e)}
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

          </div>
        </>
      )}
      {/* Action buttons at top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1.1rem', fontWeight: 700, fontSize: '1em', cursor: 'pointer' }}
          onClick={async () => {
            if (window.confirm('Are you sure you want to reset all weekly data? This will clear all boss clears and pitched items for the current week.')) {
              try {
                // 1. Clear all local state for boss clears
                setChecked({});
                
                // 2. Clear all local state for pitched items
                setPitchedChecked({});
                
                // 3. Clear database data if user is logged in
                const userCode = localStorage.getItem('ms-user-code');
                if (userCode) {
                  // Get current data from database
                  const { supabase } = await import('./supabaseClient');
                  
                  // For pitched items: filter out items from current week
                  const { data, error } = await supabase
                    .from('user_data')
                    .select('pitched_items')
                    .eq('id', userCode)
                    .single();
                  
                  if (!error && data && data.pitched_items) {
                    const currentWeekKey = getCurrentWeekKey();
                    const filteredItems = data.pitched_items.filter(item => item.weekKey !== currentWeekKey);
                    
                    // Update pitched_items in database
                    await supabase
                      .from('user_data')
                      .update({ pitched_items: filteredItems })
                      .eq('id', userCode);
                    
                    // Update cloud pitched items in local state
                    setCloudPitchedItems(filteredItems);
                    
                    // Refresh pitched items to ensure UI is in sync with database
                    refreshPitchedItems(userCode);
                  }
                  
                  // For boss clears: clear current week data
                  const { data: userData, error: userError } = await supabase
                    .from('user_data')
                    .select('data')
                    .eq('id', userCode)
                    .single();
                  
                  if (!userError && userData && userData.data) {
                    const updatedData = {
                      ...userData.data,
                      checked: {},
                      lastUpdated: new Date().toISOString()
                    };
                    
                    // Update data in database
                    await supabase
                      .from('user_data')
                      .update({ data: updatedData })
                      .eq('id', userCode);
                  }
                }
                
                alert('Weekly tracking data has been reset successfully!');
              } catch (error) {
                console.error('Error resetting data:', error);
                setError('Failed to reset data. Please try again.');
              }
            }
          }}
        >
          Reset Data
        </button>
        <button
          style={{ background: '#805ad5', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1.1rem', fontWeight: 700, fontSize: '1em', cursor: 'pointer' }}
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
            <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ background: '#3a335a', color: '#e6e0ff', border: '1px solid #805ad5', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: '1.08em', minWidth: 120, textAlign: 'center' }}>
                {allYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>Pitched Items Obtained:</div>
            {isLoadingCloudStats ? (
              <div style={{ textAlign: 'center', padding: '15px', color: '#b39ddb' }}>Loading cloud stats...</div>
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
    </div>
  );
}

<style>
{`
  @media (max-width: 600px) {
    /* Table scroll container: full viewport width, no cutoff */
    .table-scroll {
      width: 100vw;
      margin-left: -8px;
      margin-right: -8px;
      padding-left: 8px;
      padding-right: 8px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px;
      margin-bottom: 12px;
      box-sizing: border-box;
    }
    table {
      min-width: 700px !important;
      width: auto !important;
      max-width: none !important;
      display: table;
      font-size: 0.95em;
      border-collapse: separate !important;
      border-spacing: 0;
    }
    thead, tbody, tr {
      display: table-row;
      width: auto;
      table-layout: auto;
    }
    th, td {
      padding: 6px 2px !important;
      font-size: 0.95em !important;
      white-space: nowrap;
    }
    thead tr {
      background: #3a2a5d !important;
    }
    table, th, td {
      border: 1.5px solid #2d2540 !important;
    }
    /* Remove padding from main content to avoid cutoff */
    .App.dark > * {
      padding-left: 0 !important;
      padding-right: 0 !important;
      max-width: 100vw !important;
      box-sizing: border-box;
    }
    /* Center and align buttons */
    .char-header-row, .table-container, .App.dark > div[style*='display: flex'] {
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 8px !important;
    }
    .char-header-row > *, .table-container > button, .App.dark > div[style*='display: flex'] > button {
      margin: 0 auto !important;
      min-width: 0;
      width: auto !important;
      max-width: 90vw;
      font-size: 0.95em !important;
      padding: 0.5rem 1rem !important;
      flex: 0 0 auto;
    }
    input, select {
      font-size: 1em !important;
      min-height: 44px !important;
      width: 100% !important;
      max-width: 100%;
      box-sizing: border-box;
    }
    button {
      font-size: 0.95em !important;
      min-height: 38px !important;
      width: auto !important;
      max-width: 90vw;
      padding: 0.5rem 1rem !important;
      margin-bottom: 4px !important;
      box-sizing: border-box;
      border-radius: 12px !important;
    }
    .table-container {
      min-width: 0 !important;
      width: 100vw !important;
      padding: 0.5rem 0 !important;
    }
    html, body {
      overflow-x: hidden !important;
    }
  }
  .pitched-count-white {
    color: #fff !important;
  }
  .pitched-hover:hover {
    background: #4b3a7a !important;
    box-shadow: 0 4px 16px #a259f7cc !important;
    transform: scale(1.08) !important;
    transition: transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1);
  }
  @keyframes pitched-spinner {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`}
</style> 

// Export the WeeklyTracker component as default
export default WeeklyTracker;