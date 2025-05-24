import { useState, useEffect, useRef } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getPitchedKey } from '../utils/stringUtils';

export function usePitchedItems(userCode, characters, checked, setChecked, weekKey) {
  const [pitchedChecked, setPitchedChecked] = useState({});
  const [isRefreshingPitchedItems, setIsRefreshingPitchedItems] = useState(false);
  const [loadingPitchedItems, setLoadingPitchedItems] = useState({});
  const [cloudPitchedItems, setCloudPitchedItems] = useState([]);
  const userInteractionRef = useRef(false);

  // Function to refresh pitched items from database
  const refreshPitchedItems = async (userCodeValue) => {
    if (isRefreshingPitchedItems) return;
    
    try {
      setIsRefreshingPitchedItems(true);
      const codeToUse = userCodeValue || userCode;
      
      if (!codeToUse) return;
      
      const { supabase } = await import('../supabaseClient');
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
        setCloudPitchedItems(data.pitched_items);
      } else {
        setCloudPitchedItems([]);
      }
    } catch (error) {
      console.error('Error in refreshPitchedItems:', error);
    } finally {
      setIsRefreshingPitchedItems(false);
    }
  };

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
    loadingPitchedItems,
    setLoadingPitchedItems,
    cloudPitchedItems,
    setCloudPitchedItems,
    userInteractionRef,
    refreshPitchedItems
  };
} 