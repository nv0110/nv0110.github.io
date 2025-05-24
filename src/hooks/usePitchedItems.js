import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getPitchedKey } from '../utils/stringUtils';
import { getPitchedItems } from '../pitched-data-service';

export function usePitchedItems(userCode, characters, checked, setChecked, weekKey) {
  const [pitchedChecked, setPitchedChecked] = useState({});
  const [cloudPitchedItems, setCloudPitchedItems] = useState([]);
  const userInteractionRef = useRef(false);

  // Load pitched items from cloud
  const refreshPitchedItems = useCallback(async () => {
    if (!userCode) return;
    
    try {
      const result = await getPitchedItems(userCode);
      if (result.success) {
        setCloudPitchedItems(result.data || []);
        
        // Update pitched checked state based on current week
        const currentWeekItems = (result.data || []).filter(item => item.weekKey === weekKey);
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
        }
      } catch (error) {
        console.error('Error in fetchPitchedItemsFromDatabase:', error);
      }
    };
    
    fetchPitchedItemsFromDatabase();
  }, [userCode]);

  // Sync pitched items with boss checks
  useEffect(() => {
    if (cloudPitchedItems.length === 0) return;
    
    const syncPitchedWithBossChecks = async () => {
      try {
        if (userInteractionRef.current) return;
        
        const currentWeekItems = cloudPitchedItems.filter(item => item.weekKey === weekKey);
        
        if (currentWeekItems.length > 0) {
          const newChecked = { ...checked };
          const newPitchedChecked = { ...pitchedChecked };
          let updatedChecks = false;
          let updatedPitched = false;
          
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
            
            if (!newChecked[charInfo][bossKey]) {
              newChecked[charInfo][bossKey] = true;
              updatedChecks = true;
            }
            
            const pitchedKey = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
            if (!newPitchedChecked[pitchedKey]) {
              newPitchedChecked[pitchedKey] = true;
              updatedPitched = true;
            }
          });
          
          if (updatedChecks) {
            setChecked(newChecked);
          }
          
          if (updatedPitched) {
            setPitchedChecked(newPitchedChecked);
          }
        }
      } catch (error) {
        console.error('Error synchronizing pitched items:', error);
      }
    };
    
    syncPitchedWithBossChecks();
  }, [cloudPitchedItems, weekKey, characters, checked, pitchedChecked, setChecked]);

  return {
    pitchedChecked,
    setPitchedChecked,
    cloudPitchedItems,
    setCloudPitchedItems,
    userInteractionRef,
    refreshPitchedItems
  };
} 