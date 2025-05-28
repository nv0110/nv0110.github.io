import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getPitchedKey } from '../utils/stringUtils';
import { getAllPitchedItems } from '../pitched-data-service';

// Helper to create a stable hash for characterBossSelections
function hashCharacterSelections(chars) {
  return JSON.stringify(
    (chars || []).map(c => ({
      name: c.name,
      idx: c.idx ?? c.index ?? 0,
      bosses: (c.bosses || []).map(b => `${b.name}-${b.difficulty}`)
    }))
  );
}

export function usePitchedItems(userCode, characterBossSelections, checked, setChecked, weekKey, preservingCheckedStateRef = null) {
  const [pitchedChecked, setPitchedChecked] = useState({});
  const [cloudPitchedItems, setCloudPitchedItems] = useState([]);
  const [isRefreshingPitchedItems, setIsRefreshingPitchedItems] = useState(false);
  const [loadingPitchedItems, setLoadingPitchedItems] = useState({});
  const userInteractionRef = useRef(false);
  const lastSyncWeekRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  // Memoize a hash of characterBossSelections for stable dependencies
  const charHash = useMemo(() => hashCharacterSelections(characterBossSelections), [characterBossSelections]);
  const charLength = characterBossSelections.length;

  // Helper function to normalize week keys for comparison
  const normalizeWeekKey = useCallback((weekKey) => {
    if (!weekKey) return weekKey;
    const parts = weekKey.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const mw = parseInt(parts[1]).toString();
      const cw = parseInt(parts[2]).toString();
      return `${year}-${mw}-${cw}`;
    }
    return weekKey;
  }, []);

  // Function to refresh pitched items from database
  const refreshPitchedItems = useCallback(async (userCodeValue) => {
    if (isRefreshingPitchedItems) return;
    try {
      setIsRefreshingPitchedItems(true);
      const codeToUse = userCodeValue || userCode;
      if (!codeToUse) return;
      const result = await getAllPitchedItems(codeToUse);
      if (result.success) {
        setCloudPitchedItems(result.items || []);
        if (!userInteractionRef.current) {
          const normalizedWeekKey = normalizeWeekKey(weekKey);
          const currentWeekItems = (result.items || []).filter(item => normalizeWeekKey(item.weekKey) === normalizedWeekKey);
          const newPitchedChecked = {};
          currentWeekItems.forEach(item => {
            const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
            const character = characterBossSelections[charIdx];
            if (character && character.name === item.character) {
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
  }, [isRefreshingPitchedItems, userCode, weekKey, normalizeWeekKey]); // characterBossSelections intentionally omitted

  // Fetch pitched items from database - only run once when userCode changes
  useEffect(() => {
    if (!userCode) return;
    let isMounted = true;
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
        if (isMounted) {
          if (data && data.pitched_items && Array.isArray(data.pitched_items)) {
            setCloudPitchedItems(data.pitched_items);
          } else {
            setCloudPitchedItems([]);
          }
        }
      } catch (error) {
        console.error('Error in fetchPitchedItemsFromDatabase:', error);
      }
    };
    fetchPitchedItemsFromDatabase();
    lastSyncWeekRef.current = null;
    return () => { isMounted = false; };
  }, [userCode]);

  // Sync pitched items with boss checks - only on initial load and prevent loops
  useEffect(() => {
    if (!cloudPitchedItems.length || !weekKey) return;
    const normalizedWeekKey = normalizeWeekKey(weekKey);
    const currentWeekKey = getCurrentWeekKey();
    const normalizedCurrentWeekKey = normalizeWeekKey(currentWeekKey);
    if (normalizedWeekKey !== normalizedCurrentWeekKey) return;
    if (lastSyncWeekRef.current === normalizedWeekKey) return;
    if (userInteractionRef.current) return;
    // Use a timeout to break potential sync loops
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      const currentWeekItems = cloudPitchedItems.filter(item => normalizeWeekKey(item.weekKey) === normalizedWeekKey);
      if (currentWeekItems.length > 0) {
        setPitchedChecked(prev => {
          const newPitchedChecked = { ...prev };
          currentWeekItems.forEach(item => {
            const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
            const character = characterBossSelections[charIdx];
            if (character && character.name === item.character) {
              const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
              newPitchedChecked[key] = true;
            }
          });
          return newPitchedChecked;
        });
        // Only update boss checked state if needed and not during preservation
        setChecked(prevChecked => {
          let shouldUpdate = false;
          const newChecked = { ...prevChecked };
          currentWeekItems.forEach(item => {
            const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
            const character = characterBossSelections[charIdx];
            if (!character || character.name !== item.character) return;
            const charInfo = `${item.character}-${charIdx}`;
            if (!newChecked[charInfo]) newChecked[charInfo] = {};
            if (item.boss && !newChecked[charInfo][`${item.boss}-${item.difficulty}`]) {
              newChecked[charInfo][`${item.boss}-${item.difficulty}`] = true;
              shouldUpdate = true;
            }
          });
          if (shouldUpdate && (!preservingCheckedStateRef || !preservingCheckedStateRef.current)) {
            return newChecked;
          }
          return prevChecked;
        });
        lastSyncWeekRef.current = normalizedWeekKey;
      }
    }, 50);
    // Cleanup
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cloudPitchedItems, weekKey, charHash, charLength, checked, setChecked, preservingCheckedStateRef]);

  // Update pitched checked state when week changes - separate from sync logic
  useEffect(() => {
    if (!weekKey || !cloudPitchedItems.length) return;
    const normalizedWeekKey = normalizeWeekKey(weekKey);
    const currentWeekItems = cloudPitchedItems.filter(item => normalizeWeekKey(item.weekKey) === normalizedWeekKey);
    setPitchedChecked(() => {
      const newPitchedChecked = {};
      currentWeekItems.forEach(item => {
        const charIdx = item.characterIdx !== undefined ? item.characterIdx : characterBossSelections.findIndex(c => c.name === item.character);
        const character = characterBossSelections[charIdx];
        if (character && character.name === item.character) {
          const key = getPitchedKey(item.character, charIdx, item.boss, item.item, weekKey);
          newPitchedChecked[key] = true;
        }
      });
      return newPitchedChecked;
    });
    lastSyncWeekRef.current = null;
  }, [weekKey, cloudPitchedItems, charHash, charLength]);

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