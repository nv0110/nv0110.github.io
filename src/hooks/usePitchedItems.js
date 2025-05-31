import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPitchedItems,
  addPitchedItem,
  removePitchedItem,
  removeManyPitchedItems,
  clearPitchedItemsForWeek,
  getYearlyPitchedStats,
  purgeAllPitchedItems
} from '../../services/pitchedItemsService.js';
import { convertDateToWeekKey } from '../utils/weekUtils.js';
import { logger } from '../utils/logger';

/**
 * Hook for managing pitched items in the new simplified schema
 * Format: [{ "charId": "CharacterName", "item": "ItemName", "date": "2025-05-23" }]
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
  const refreshPitchedItems = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsRefreshingPitchedItems(true);

      // Always load ALL pitched items to maintain proper state
      const result = await getPitchedItems(userId, {});

      if (result.success) {
        setCloudPitchedItems(result.items);
        
        // Update pitched checked state based on ALL items
        const newPitchedChecked = {};
        result.items.forEach(item => {
          // Create key format: "CharacterName-0__BossName__ItemName__WeekKey"
          const itemWeekKey = convertDateToWeekKey(item.date);
          const key = `${item.charId}-0__${item.bossName}__${item.item}__${itemWeekKey}`;
          newPitchedChecked[key] = true;
        });
        setPitchedChecked(newPitchedChecked);
      } else {
        logger.error('usePitchedItems: Failed to refresh pitched items', result.error);
      }
    } catch (error) {
      logger.error('usePitchedItems: Error refreshing pitched items', error);
    } finally {
      setIsRefreshingPitchedItems(false);
    }
  }, [userId]);

  /**
   * Add a new pitched item
   */
  const addNewPitchedItem = useCallback(async (charId, bossName, item, date = null) => {
      if (!userId) {
      logger.warn('usePitchedItems: No user ID available, user may not be authenticated yet');
        return { success: false, error: 'User not authenticated' };
      }

      const itemDate = date || new Date().toISOString().split('T')[0];
      const itemWeekKey = convertDateToWeekKey(itemDate);
      const key = `${charId}-0__${bossName}__${item}__${itemWeekKey}`;

      // Check if item already exists to prevent duplicates
      if (pitchedChecked[key]) {
      logger.info('usePitchedItems: Item already exists, skipping add');
        return { success: true, message: 'Item already exists' };
      }

      const pitchedItemData = {
        charId,
        bossName,
        item,
        date: itemDate
      };

      const result = await addPitchedItem(userId, pitchedItemData);
      
      if (result.success) {
        // Update local state
        const newItem = result.pitchedItem;
        setCloudPitchedItems(prev => [...prev, newItem]);
        
        // Update checked state
        setPitchedChecked(prev => ({
          ...prev,
          [key]: true
        }));
        
        return { success: true };
      } else {
        throw new Error(result.error);
      }
  }, [userId, pitchedChecked]);

  /**
   * Remove a pitched item
   */
  const removePitchedItemByDetails = useCallback(async (charId, bossName, item, date = null) => {
      if (!userId) {
      logger.warn('usePitchedItems: No user ID available, user may not be authenticated yet');
        return { success: false, error: 'User not authenticated' };
      }

      // If no date provided, find the most recent item for this character, boss, and item
      let targetDate = date;
      if (!targetDate) {
        const matchingItems = cloudPitchedItems.filter(
          pitchedItem => pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item
        );
        
        if (matchingItems.length > 0) {
          // Sort by date descending and get the most recent
          matchingItems.sort((a, b) => new Date(b.date) - new Date(a.date));
          targetDate = matchingItems[0].date;
        } else {
        logger.info('usePitchedItems: No matching items found to remove');
          return { success: true, message: 'No items to remove' };
        }
      }

      const result = await removePitchedItem(userId, charId, bossName, item, targetDate);
      
      if (result.success) {
        // Update local state
        setCloudPitchedItems(prev => prev.filter(pitchedItem =>
          !(pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item && pitchedItem.date === targetDate)
        ));
        
        // Update checked state
        const itemWeekKey = convertDateToWeekKey(targetDate);
        const key = `${charId}-0__${bossName}__${item}__${itemWeekKey}`;
        setPitchedChecked(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
        
        return { success: true };
      } else {
        throw new Error(result.error);
      }
  }, [userId, cloudPitchedItems]);

  /**
   * Remove multiple pitched items
   */
  const removeManyPitchedItemsByDetails = useCallback(async (itemsToRemove) => {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const result = await removeManyPitchedItems(userId, itemsToRemove);
      
      if (result.success) {
        // Update local state
        setCloudPitchedItems(prev => {
          let updated = [...prev];
          itemsToRemove.forEach(({ charId, item, date }) => {
            if (date) {
              updated = updated.filter(
                pitchedItem => !(pitchedItem.charId === charId && pitchedItem.item === item && pitchedItem.date === date)
              );
            } else {
              const targetIndex = updated.findLastIndex(
                pitchedItem => pitchedItem.charId === charId && pitchedItem.item === item
              );
              if (targetIndex !== -1) {
                updated.splice(targetIndex, 1);
              }
            }
          });
          return updated;
        });
        
        // Update checked state
        setPitchedChecked(prev => {
          const updated = { ...prev };
          itemsToRemove.forEach(({ charId, item, date }) => {
            if (date) {
              const itemWeekKey = convertDateToWeekKey(date);
              const key = `${charId}-0__${item}__${itemWeekKey}`;
              delete updated[key];
            } else {
              // Remove all matching keys for this character and item
              Object.keys(updated).forEach(key => {
                if (key.startsWith(`${charId}-0__${item}__`)) {
                  delete updated[key];
                }
              });
            }
          });
          return updated;
        });
        
        return { success: true, removedCount: result.removedCount };
      } else {
        throw new Error(result.error);
      }
  }, [userId]);

  /**
   * Clear all pitched items for a specific week
   */
  const clearWeekPitchedItems = useCallback(async (weekKey) => {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const result = await clearPitchedItemsForWeek(userId, weekKey);
      
      if (result.success) {
        // Update local state
        setCloudPitchedItems(prev => prev.filter(item => {
          const itemWeekKey = convertDateToWeekKey(item.date);
          return itemWeekKey !== weekKey;
        }));
        
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
  }, [userId]);

  /**
   * Get yearly statistics
   */
  const getYearlyStats = useCallback(async (year = null) => {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      const result = await getYearlyPitchedStats(userId, year);
      
      if (result.success) {
        return { success: true, stats: result.stats };
      } else {
        throw new Error(result.error);
      }
  }, [userId]);

  /**
   * Purge all pitched items
   */
  const purgeAllItems = useCallback(async () => {
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
  }, [userId]);

  // Load pitched items when userId changes
  useEffect(() => {
    if (userId) {
      refreshPitchedItems();
    }
  }, [refreshPitchedItems]);

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
    removePitchedItemByDetails,
    removeManyPitchedItemsByDetails,
    clearWeekPitchedItems,
    getYearlyStats,
    purgeAllItems
  };
}