import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getPitchedKey } from '../utils/stringUtils';
import { getAllPitchedItems } from '../pitched-data-service';

export function usePitchedItems(userCode, characterBossSelections, checked, setChecked, weekKey, preservingCheckedStateRef = null) {
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
  const normalizeWeekKey = useCallback((weekKey) => {
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
  }, []);

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

  // Fetch pitched items from database
  useEffect(() => {
    if (!userCode) return;

    const fetchPitchedItemsFromDatabase = async () => {
      try {
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
  }, [userCode, setCloudPitchedItems]);

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
        
        // Only sync if we're viewing the current week
        if (normalizedWeekKey !== normalizedCurrentWeekKey) return;
        
        const currentWeekItems = cloudPitchedItems.filter(item => 
          normalizeWeekKey(item.weekKey) === normalizedWeekKey
        );
        
        if (currentWeekItems.length > 0) {
          const newChecked = { ...checked };
          const newPitchedChecked = {};
          let updatedChecks = false;
          
          currentWeekItems.forEach(item => {
            const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
            
            // Verify the character still exists at that index
            const character = characterBossSelections[charIdx];
            if (!character || character.name !== item.character) return;
            
            const charInfo = `${item.character}-${charIdx}`;
            
            if (!newChecked[charInfo]) {
              newChecked[charInfo] = {};
            }
            
            const boss = character.bosses.find(b => b.name === item.boss);
            if (!boss) return;
            
            const bossKey = `${boss.name}-${boss.difficulty}`;
            const pitchedKey = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
            
            // Always add pitched items from database to the pitched checked state
            newPitchedChecked[pitchedKey] = true;
            
            // Only auto-check boss if we're in the CURRENT week
            if (!newChecked[charInfo][bossKey]) {
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
        console.error('Error in syncPitchedWithBossChecks:', error);
      }
    };

    syncPitchedWithBossChecks();
  }, [cloudPitchedItems, weekKey, normalizeWeekKey, userInteractionRef, characterBossSelections, checked, setChecked, preservingCheckedStateRef]);

  // Update pitched checked state when week changes
  useEffect(() => {
    if (!weekKey || !cloudPitchedItems.length) return;

    const normalizedWeekKey = normalizeWeekKey(weekKey);
    
    // Filter pitched items for the current week with normalization
    const currentWeekItems = cloudPitchedItems.filter(item => {
      const normalizedItemWeekKey = normalizeWeekKey(item.weekKey);
      return normalizedItemWeekKey === normalizedWeekKey;
    });
    
    // Update pitched checked state based on current week items
    const newPitchedChecked = {};
    currentWeekItems.forEach(item => {
      const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
      
      // Verify the character still exists at that index
      const character = characterBossSelections[charIdx];
      if (character && character.name === item.character) {
        const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
        newPitchedChecked[key] = true;
      }
    });
    
    setPitchedChecked(newPitchedChecked);
  }, [weekKey, cloudPitchedItems, characterBossSelections, normalizeWeekKey, setPitchedChecked]);

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