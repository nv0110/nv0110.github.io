import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getPitchedKey } from '../utils/stringUtils';
import { getPitchedItems, getAllPitchedItems } from '../pitched-data-service';

export function usePitchedItems(userCode, characters, checked, setChecked, weekKey, preservingCheckedStateRef = null) {
  const [pitchedChecked, setPitchedChecked] = useState({});
  const [cloudPitchedItems, setCloudPitchedItems] = useState([]);
  const [isRefreshingPitchedItems, setIsRefreshingPitchedItems] = useState(false);
  const [loadingPitchedItems, setLoadingPitchedItems] = useState({});
  const userInteractionRef = useRef(false);

  // Helper function to normalize week keys for comparison
  const normalizeWeekKey = (weekKey) => {
    if (!weekKey) return weekKey;
    
    const parts = weekKey.split('-');
    if (parts.length === 3) {
      // Format: YYYY-MW-CW, normalize to remove leading zeros
      const year = parts[0];
      const mw = parseInt(parts[1]).toString(); // Remove leading zeros
      const cw = parseInt(parts[2]).toString(); // Remove leading zeros
      return `${year}-${mw}-${cw}`;
    }
    return weekKey;
  };

  // Function to refresh pitched items from database
  const refreshPitchedItems = async (userCodeValue) => {
    if (isRefreshingPitchedItems) return;
    
    try {
      setIsRefreshingPitchedItems(true);
      const codeToUse = userCodeValue || userCode;
      
      if (!codeToUse) return;
      
      const result = await getAllPitchedItems(codeToUse);
      
      if (result.success) {
        setCloudPitchedItems(result.items || []);
        
        // Only update local state if not during user interaction
        if (!userInteractionRef.current) {
          const normalizedWeekKey = normalizeWeekKey(weekKey);
          const currentWeekItems = (result.items || []).filter(item => 
            normalizeWeekKey(item.weekKey) === normalizedWeekKey
          );
          
          // Update pitched checked state based on current week
          const newPitchedChecked = {};
          currentWeekItems.forEach(item => {
            const charIdx = characters.findIndex(c => c.name === item.character);
            if (charIdx !== -1) {
              const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
              newPitchedChecked[key] = true;
            }
          });
          
          setPitchedChecked(newPitchedChecked);
        }
      } else {
        console.error('Error refreshing pitched items:', result.error);
      }
    } catch (error) {
      console.error('Error in refreshPitchedItems:', error);
    } finally {
      setIsRefreshingPitchedItems(false);
    }
  };

  // Load pitched items from cloud
  const loadPitchedItems = useCallback(async () => {
    if (!userCode) return;
    
    try {
      const result = await getPitchedItems(userCode);
      if (result.success) {
        setCloudPitchedItems(result.data || []);
        
        // Update pitched checked state based on current week
        const normalizedWeekKey = normalizeWeekKey(weekKey);
        const currentWeekItems = (result.data || []).filter(item => 
          normalizeWeekKey(item.weekKey) === normalizedWeekKey
        );
        const newPitchedChecked = {};
        
        currentWeekItems.forEach(item => {
          const charIdx = characters.findIndex(c => c.name === item.character);
          if (charIdx !== -1) {
            const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
            newPitchedChecked[key] = true;
          }
        });
        
        setPitchedChecked(newPitchedChecked);
      }
    } catch (error) {
      console.error('Error refreshing pitched items:', error);
    }
  }, [userCode, weekKey, characters]);

  // Fetch pitched items from database
  useEffect(() => {
    const fetchPitchedItemsFromDatabase = async () => {
      try {
        if (!userCode) return;
        
        const { supabase } = await import('../supabaseClient');
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
          setCloudPitchedItems(data.pitched_items);
        } else {
          setCloudPitchedItems([]);
        }
      } catch (error) {
        console.error('Error in fetchPitchedItemsFromDatabase:', error);
      }
    };
    
    fetchPitchedItemsFromDatabase();
  }, [userCode]);

  // Sync pitched items with boss checks - only on initial load
  useEffect(() => {
    if (cloudPitchedItems.length === 0) return;
    
    const syncPitchedWithBossChecks = async () => {
      try {
        // Skip sync during user interactions to prevent conflicts
        if (userInteractionRef.current) return;
        
        const normalizedWeekKey = normalizeWeekKey(weekKey);
        const currentWeekItems = cloudPitchedItems.filter(item => 
          normalizeWeekKey(item.weekKey) === normalizedWeekKey
        );
        
        if (currentWeekItems.length > 0) {
          const newChecked = { ...checked };
          const newPitchedChecked = {};
          let updatedChecks = false;
          
          currentWeekItems.forEach(item => {
            const charIdx = characters.findIndex(c => c.name === item.character);
            if (charIdx === -1) return;
            
            const charInfo = `${item.character}-${charIdx}`;
            
            if (!newChecked[charInfo]) {
              newChecked[charInfo] = {};
            }
            
            const char = characters[charIdx];
            if (!char) return;
            
            const boss = char.bosses.find(b => b.name === item.boss);
            if (!boss) return;
            
            const bossKey = `${boss.name}-${boss.difficulty}`;
            const pitchedKey = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
            
            // Always add pitched items from database to the pitched checked state
            newPitchedChecked[pitchedKey] = true;
            
            // Auto-check boss if it's not already checked (for initial sync only)
            if (!newChecked[charInfo][bossKey]) {
              newChecked[charInfo][bossKey] = true;
              updatedChecks = true;
            }
          });
          
          // Always update pitched checked state from database
          setPitchedChecked(newPitchedChecked);
          
          // Only update boss checked state if needed and not during preservation
          if (updatedChecks && (!preservingCheckedStateRef || !preservingCheckedStateRef.current)) {
            console.log('🔄 PITCHED: Updating checked state from pitched items sync');
            console.log('🔄 PITCHED: New checked state being set:', JSON.stringify(newChecked, null, 2));
            setChecked(newChecked);
          } else if (updatedChecks && preservingCheckedStateRef?.current) {
            console.log('🚫 PITCHED: Skipping checked state update - preservation in progress');
            console.log('🚫 PITCHED: Would have set:', JSON.stringify(newChecked, null, 2));
          } else if (!updatedChecks) {
            console.log('ℹ️ PITCHED: No boss checks needed updating');
          }
        }
      } catch (error) {
        console.error('Error synchronizing pitched items:', error);
      }
    };
    
    syncPitchedWithBossChecks();
  }, [cloudPitchedItems, weekKey, characters]); // Removed checked and pitchedChecked from dependencies

  // Separate effect to handle week changes and update pitched checked state
  useEffect(() => {
    console.log(`🔄 PITCHED: Week changed to ${weekKey}, updating pitched checked state...`);
    console.log(`🔄 PITCHED: Total cloud pitched items: ${cloudPitchedItems.length}`);
    
    const normalizedWeekKey = normalizeWeekKey(weekKey);
    console.log(`🔄 PITCHED: Normalized week key: ${weekKey} → ${normalizedWeekKey}`);
    
    // Filter pitched items for the current week with normalization
    const currentWeekItems = cloudPitchedItems.filter(item => {
      const normalizedItemWeekKey = normalizeWeekKey(item.weekKey);
      const matches = normalizedItemWeekKey === normalizedWeekKey;
      
      if (!matches) {
        console.log(`🔄 PITCHED: Week key mismatch: item(${item.weekKey}→${normalizedItemWeekKey}) vs target(${weekKey}→${normalizedWeekKey})`);
      }
      
      return matches;
    });
    
    console.log(`🔄 PITCHED: Items for week ${weekKey}:`, currentWeekItems.map(item => ({
      character: item.character,
      boss: item.boss,
      item: item.item,
      difficulty: item.difficulty,
      weekKey: item.weekKey,
      normalizedWeekKey: normalizeWeekKey(item.weekKey)
    })));
    
    // Update pitched checked state based on current week items
    const newPitchedChecked = {};
    currentWeekItems.forEach(item => {
      const charIdx = characters.findIndex(c => c.name === item.character);
      if (charIdx !== -1) {
        const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
        newPitchedChecked[key] = true;
        console.log(`🔄 PITCHED: Adding key: ${key}`);
      } else {
        console.log(`🔄 PITCHED: Character not found: ${item.character}`);
      }
    });
    
    console.log(`🔄 PITCHED: Found ${currentWeekItems.length} pitched items for week ${weekKey}`);
    console.log('🔄 PITCHED: Setting pitched checked state:', newPitchedChecked);
    
    setPitchedChecked(newPitchedChecked);
  }, [weekKey, cloudPitchedItems, characters]); // This effect specifically handles week changes

  return {
    pitchedChecked,
    setPitchedChecked,
    cloudPitchedItems,
    setCloudPitchedItems,
    userInteractionRef,
    refreshPitchedItems,
    loadingPitchedItems,
    setLoadingPitchedItems,
    isRefreshingPitchedItems
  };
} 