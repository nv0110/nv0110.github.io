import { useState, useEffect, useRef } from 'react';
import { 
  getPitchedItems, 
  getCurrentWeekPitchedItems, 
  addPitchedItem, 
  removePitchedItem, 
  removeManyPitchedItems,
  clearPitchedItemsForWeek,
  getYearlyPitchedStats,
  purgeAllPitchedItems
} from '../../services/pitchedItemsService.js';
import { getCurrentMapleWeekStartDate } from '../../utils/mapleWeekUtils.js';

/**
 * Hook for managing pitched items in the new schema
 * Integrates with user_data.pitched_items via pitchedItemsService
 */
export function usePitchedItems(userId) {
  const [pitchedChecked, setPitchedChecked] = useState({});
  const [cloudPitchedItems, setCloudPitchedItems] = useState([]);
  const [loadingPitchedItems, setLoadingPitchedItems] = useState({});
  const [isRefreshingPitchedItems, setIsRefreshingPitchedItems] = useState(false);
  const userInteractionRef = useRef(false);

  /**
   * Load pitched items from the database
   */
  const refreshPitchedItems = async (weekKey = null) => {
    try {
      if (!userId) return;

      setIsRefreshingPitchedItems(true);

      let result;
      if (weekKey) {
        result = await getPitchedItems(userId, weekKey);
      } else {
        result = await getCurrentWeekPitchedItems(userId);
      }

      if (result.success) {
        setCloudPitchedItems(result.items);
        
        // Update pitched checked state based on items
        const newPitchedChecked = {};
        result.items.forEach(item => {
          // Create key format: "CharacterName-idx__BossName__ItemName__WeekKey"
          // Note: We don't have character index in pitched items, so we'll use 0 as default
          const key = `${item.character}-0__${item.boss}__${item.item}__${item.weekKey}`;
          newPitchedChecked[key] = true;
        });
        setPitchedChecked(newPitchedChecked);
      } else {
        console.error('Failed to refresh pitched items:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing pitched items:', error);
    } finally {
      setIsRefreshingPitchedItems(false);
    }
  };

  /**
   * Add a new pitched item
   */
  const addNewPitchedItem = async (character, boss, item, date = null) => {
    try {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const currentWeekStart = getCurrentMapleWeekStartDate();
      const pitchedItemData = {
        character,
        boss,
        item,
        date: date || new Date().toISOString(),
        weekKey: currentWeekStart
      };

      const result = await addPitchedItem(userId, pitchedItemData);
      
      if (result.success) {
        // Update local state
        const newItem = result.pitchedItem;
        setCloudPitchedItems(prev => [...prev, newItem]);
        
        // Update checked state
        const key = `${character}-0__${boss}__${item}__${currentWeekStart}`;
        setPitchedChecked(prev => ({
          ...prev,
          [key]: true
        }));
        
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding pitched item:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Remove a pitched item
   */
  const removePitchedItemById = async (pitchedItemId) => {
    try {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const result = await removePitchedItem(userId, pitchedItemId);
      
      if (result.success) {
        // Update local state
        setCloudPitchedItems(prev => prev.filter(item => item.id !== pitchedItemId));
        
        // Update checked state (remove all matching keys)
        setPitchedChecked(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            // If the key corresponds to the removed item, remove it
            // This is a simplified approach - you might need more sophisticated matching
            const item = cloudPitchedItems.find(item => item.id === pitchedItemId);
            if (item) {
              const expectedKey = `${item.character}-0__${item.boss}__${item.item}__${item.weekKey}`;
              if (key === expectedKey) {
                delete updated[key];
              }
            }
          });
          return updated;
        });
        
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error removing pitched item:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Remove multiple pitched items
   */
  const removeManyPitchedItemsById = async (pitchedItemIds) => {
    try {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const result = await removeManyPitchedItems(userId, pitchedItemIds);
      
      if (result.success) {
        // Update local state
        const removedIds = new Set(pitchedItemIds);
        setCloudPitchedItems(prev => prev.filter(item => !removedIds.has(item.id)));
        
        // Update checked state
        setPitchedChecked(prev => {
          const updated = { ...prev };
          cloudPitchedItems.forEach(item => {
            if (removedIds.has(item.id)) {
              const expectedKey = `${item.character}-0__${item.boss}__${item.item}__${item.weekKey}`;
              delete updated[expectedKey];
            }
          });
          return updated;
        });
        
        return { success: true, removedCount: result.removedCount };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error removing multiple pitched items:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Clear all pitched items for a specific week
   */
  const clearWeekPitchedItems = async (weekKey) => {
    try {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const result = await clearPitchedItemsForWeek(userId, weekKey);
      
      if (result.success) {
        // Update local state
        setCloudPitchedItems(prev => prev.filter(item => item.weekKey !== weekKey));
        
        // Update checked state
        setPitchedChecked(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (key.endsWith(`__${weekKey}`)) {
              delete updated[key];
            }
          });
          return updated;
        });
        
        return { success: true, removedCount: result.removedCount };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error clearing week pitched items:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Get yearly statistics
   */
  const getYearlyStats = async (year = null) => {
    try {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const result = await getYearlyPitchedStats(userId, year);
      
      if (result.success) {
        return { success: true, stats: result.stats };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error getting yearly stats:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Purge all pitched items
   */
  const purgeAllItems = async () => {
    try {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const result = await purgeAllPitchedItems(userId);
      
      if (result.success) {
        // Clear local state
        setCloudPitchedItems([]);
        setPitchedChecked({});
        
        return { success: true, removedCount: result.removedCount };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error purging all pitched items:', error);
      return { success: false, error: error.message };
    }
  };

  // Load pitched items when userId changes
  useEffect(() => {
    if (userId) {
      refreshPitchedItems();
    }
  }, [userId]);

  return {
    pitchedChecked,
    setPitchedChecked,
    cloudPitchedItems,
    setCloudPitchedItems,
    userInteractionRef,
    refreshPitchedItems,
    loadingPitchedItems,
    setLoadingPitchedItems,
    isRefreshingPitchedItems,
    
    // New methods
    addNewPitchedItem,
    removePitchedItemById,
    removeManyPitchedItemsById,
    clearWeekPitchedItems,
    getYearlyStats,
    purgeAllItems
  };
}