import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getPitchedKey } from '../utils/stringUtils';
import { getPitchedItems, getAllPitchedItems } from '../pitched-data-service';

export function usePitchedItems(userCode, characterBossSelections, checked, setChecked, weekKey, preservingCheckedStateRef = null, selectedCharIdx = null) {
  const [pitchedChecked, setPitchedChecked] = useState({});
  const [cloudPitchedItems, setCloudPitchedItems] = useState([]);
  const [isRefreshingPitchedItems, setIsRefreshingPitchedItems] = useState(false);
  const [loadingPitchedItems, setLoadingPitchedItems] = useState({});
  const userInteractionRef = useRef(false);

  // console.log('🎯 PITCHED HOOK: Hook called with:', {
  //   userCode: userCode ? 'present' : 'missing',
  //   charactersCount: characterBossSelections.length,
  //   selectedCharIdx,
  //   weekKey,
  //   cloudPitchedItemsCount: cloudPitchedItems.length
  // });

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
            // Use the stored characterIdx from the pitched item data instead of findIndex
            // This prevents issues with cloned characters having the same name
            const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
            
            // Verify the character still exists at that index
            const character = characterBossSelections[charIdx];
            if (character && character.name === item.character) {
              const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
              newPitchedChecked[key] = true;
              // console.log(`🎯 PITCHED: Adding pitched item for ${item.character} (idx: ${charIdx}): ${item.boss} - ${item.item}`);
            } else {
              // console.log(`⚠️ PITCHED: Character mismatch or not found for pitched item: ${item.character} (stored idx: ${item.characterIdx}, found character: ${character?.name || 'none'})`);
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
          // Use the stored characterIdx from the pitched item data instead of findIndex
          // This prevents issues with cloned characters having the same name
          const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
          
          // Verify the character still exists at that index
          const character = characterBossSelections[charIdx];
          if (character && character.name === item.character) {
            const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
            newPitchedChecked[key] = true;
            // console.log(`🎯 PITCHED: Adding pitched item for ${item.character} (idx: ${charIdx}): ${item.boss} - ${item.item}`);
          } else {
            // console.log(`⚠️ PITCHED: Character mismatch or not found for pitched item: ${item.character} (stored idx: ${item.characterIdx}, found character: ${character?.name || 'none'})`);
          }
        });
        
        setPitchedChecked(newPitchedChecked);
      }
    } catch (error) {
      console.error('Error refreshing pitched items:', error);
    }
  }, [userCode, weekKey, characterBossSelections]);

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
        const currentWeekKey = getCurrentWeekKey();
        const normalizedCurrentWeekKey = normalizeWeekKey(currentWeekKey);
        
        const currentWeekItems = cloudPitchedItems.filter(item => 
          normalizeWeekKey(item.weekKey) === normalizedWeekKey
        );
        
        if (currentWeekItems.length > 0) {
          const newChecked = { ...checked };
          const newPitchedChecked = {};
          let updatedChecks = false;
          
          currentWeekItems.forEach(item => {
            // Use the stored characterIdx from the pitched item data instead of findIndex
            // This prevents issues with cloned characters having the same name
            const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
            
            // Verify the character still exists at that index
            const character = characterBossSelections[charIdx];
            if (!character || character.name !== item.character) {
              // console.log(`⚠️ PITCHED SYNC: Character mismatch or not found for pitched item: ${item.character} (stored idx: ${item.characterIdx}, found character: ${character?.name || 'none'})`);
              return;
            }
            
            const charInfo = `${item.character}-${charIdx}`;
            
            if (!newChecked[charInfo]) {
              newChecked[charInfo] = {};
            }
            
            // Use the character we already verified exists
            const char = character;
            
            const boss = char.bosses.find(b => b.name === item.boss);
            if (!boss) return;
            
            const bossKey = `${boss.name}-${boss.difficulty}`;
            const pitchedKey = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
            
            // Always add pitched items from database to the pitched checked state
            newPitchedChecked[pitchedKey] = true;
            
            // CRITICAL FIX: Only auto-check boss if we're in the CURRENT week
            // Historical weeks should NOT auto-check bosses in the current week's state
            if (normalizedWeekKey === normalizedCurrentWeekKey && !newChecked[charInfo][bossKey]) {
              newChecked[charInfo][bossKey] = true;
              updatedChecks = true;
            }
          });
          
          // Always update pitched checked state from database
          setPitchedChecked(newPitchedChecked);
          
          // Only update boss checked state if needed and not during preservation
          if (updatedChecks && (!preservingCheckedStateRef || !preservingCheckedStateRef.current)) {
            setChecked(newChecked);
          }
        }
      } catch (error) {
        console.error('Error synchronizing pitched items:', error);
      }
    };
    
    syncPitchedWithBossChecks();
  }, [cloudPitchedItems, weekKey, characterBossSelections]); // Removed checked and pitchedChecked from dependencies

  // Separate effect to handle week changes and update pitched checked state
  useEffect(() => {
    // console.log('🎯 PITCHED WEEK EFFECT: Rebuilding pitched state for week change/character change');
    // console.log('🎯 PITCHED WEEK EFFECT: Input data:', {
    //   weekKey,
    //   selectedCharIdx,
    //   charactersCount: characterBossSelections.length,
    //   cloudPitchedItemsCount: cloudPitchedItems.length
    // });

    const normalizedWeekKey = normalizeWeekKey(weekKey);
    
    // Filter pitched items for the current week with normalization
    const currentWeekItems = cloudPitchedItems.filter(item => {
      const normalizedItemWeekKey = normalizeWeekKey(item.weekKey);
      return normalizedItemWeekKey === normalizedWeekKey;
    });
    
    // console.log(`🎯 PITCHED WEEK EFFECT: Found ${currentWeekItems.length} items for week ${weekKey}:`, 
    //   currentWeekItems.map(item => `${item.character}(${item.characterIdx})-${item.boss}-${item.item}`)
    // );
    
    // Update pitched checked state based on current week items
    const newPitchedChecked = {};
    currentWeekItems.forEach(item => {
      // Use the stored characterIdx from the pitched item data instead of findIndex
      // This prevents issues with cloned characters having the same name
      const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
      
      // Verify the character still exists at that index
      const character = characterBossSelections[charIdx];
      if (character && character.name === item.character) {
        const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
        newPitchedChecked[key] = true;
        // console.log(`🎯 PITCHED WEEK: Adding pitched item for ${item.character} (idx: ${charIdx}): ${item.boss} - ${item.item} (week: ${weekKey})`);
      } else {
        // console.log(`⚠️ PITCHED WEEK: Character mismatch or not found for pitched item: ${item.character} (stored idx: ${item.characterIdx}, found character: ${character?.name || 'none'})`);
      }
    });
    
    // console.log('🎯 PITCHED WEEK EFFECT: Final pitched checked state:', Object.keys(newPitchedChecked));
    setPitchedChecked(newPitchedChecked);
  }, [weekKey, cloudPitchedItems, characterBossSelections, selectedCharIdx]); // Added selectedCharIdx to dependencies

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