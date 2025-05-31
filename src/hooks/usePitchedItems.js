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
export function usePitchedItems(userId, selectedWeekKey = null) {
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
        
        // Log current week info for debugging
        const { getCurrentWeekKey } = await import('../utils/weekUtils');
        const currentAppWeekKey = getCurrentWeekKey();
        const currentViewingWeekKey = selectedWeekKey || currentAppWeekKey;
        
        logger.debug('usePitchedItems: Current week info', { 
          currentAppWeekKey,
          currentViewingWeekKey,
          selectedWeekKey,
          totalItems: result.items.length
        });
        
        // 🎯 FIX: Only mark items as checked if they belong to current viewing week
        const newPitchedChecked = {};
        result.items.forEach(item => {
          const itemWeekKey = convertDateToWeekKey(item.date);
          
          // Only include items that match the currently selected/viewing week
          if (itemWeekKey === currentViewingWeekKey) {
            // Create key format: "CharacterName__BossName__ItemName__WeekKey"
            const key = `${item.charId}__${item.bossName}__${item.item}__${itemWeekKey}`;
            newPitchedChecked[key] = true;
          }
        });
        
        logger.debug('usePitchedItems: Loaded pitched items with week filtering', {
          totalItemsInDatabase: result.items.length,
          checkedKeysForCurrentWeek: Object.keys(newPitchedChecked).length,
          currentViewingWeekKey,
          sampleCheckedKeys: Object.keys(newPitchedChecked).slice(0, 3),
          itemsInCurrentWeek: result.items.filter(item => convertDateToWeekKey(item.date) === currentViewingWeekKey).length,
          itemsInOtherWeeks: result.items.filter(item => convertDateToWeekKey(item.date) !== currentViewingWeekKey).length
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
  }, [userId, selectedWeekKey]); // 🎯 Add selectedWeekKey to dependencies

  /**
   * Update checked state based on pitched items for specific week
   */
  const updateCheckedState = (items, targetWeekKey = null) => {
    const { getCurrentWeekKey } = require('../utils/weekUtils');
    const currentViewingWeekKey = targetWeekKey || selectedWeekKey || getCurrentWeekKey();
    
    const newChecked = {};
    items.forEach(item => {
      const itemWeekKey = convertDateToWeekKey(item.date);
      
      // Only mark as checked if it belongs to the target week
      if (itemWeekKey === currentViewingWeekKey) {
        const key = `${item.charId}__${item.bossName}__${item.item}__${itemWeekKey}`;
        newChecked[key] = true;
      }
    });
    setPitchedChecked(newChecked);
  };

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
      const key = `${charId}__${bossName}__${item}__${itemWeekKey}`;

      // Check if item already exists to prevent duplicates
      if (pitchedChecked[key]) {
        logger.info('usePitchedItems: Item already exists, skipping add', { 
          key, 
          existingChecked: !!pitchedChecked[key],
          charId,
          bossName,
          item,
          itemWeekKey
        });
        return { success: true, message: 'Item already exists' };
      }

      logger.debug('usePitchedItems: Adding new pitched item', {
        key,
        charId,
        bossName,
        item,
        itemWeekKey,
        pitchedCheckedKeys: Object.keys(pitchedChecked).length
      });

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

      logger.debug('usePitchedItems: Attempting to remove pitched item', {
        charId,
        bossName,
        item,
        providedDate: date,
        cloudItemsCount: cloudPitchedItems.length
      });

      // If no date provided, find the most recent item for this character, boss, and item
      let targetDate = date;
      if (!targetDate) {
        const matchingItems = cloudPitchedItems.filter(
          pitchedItem => pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item
        );
        
        logger.debug('usePitchedItems: Searching for matching items without date', {
          matchingItemsCount: matchingItems.length,
          matchingItems: matchingItems.map(item => ({
            charId: item.charId,
            bossName: item.bossName,
            item: item.item,
            date: item.date
          }))
        });
        
        if (matchingItems.length > 0) {
          // Sort by date descending and get the most recent
          matchingItems.sort((a, b) => new Date(b.date) - new Date(a.date));
          targetDate = matchingItems[0].date;
          logger.debug('usePitchedItems: Found most recent item', { targetDate });
        } else {
        logger.info('usePitchedItems: No matching items found to remove', {
          charId,
          bossName,
          item,
          availableItems: cloudPitchedItems.map(item => ({
            charId: item.charId,
            bossName: item.bossName,
            item: item.item,
            date: item.date
          })).slice(0, 5) // Show first 5 for debugging
        });
          return { success: true, message: 'No items to remove' };
        }
      } else {
        // Verify the specific date item exists
        const exactMatch = cloudPitchedItems.find(
          pitchedItem => pitchedItem.charId === charId && 
                        pitchedItem.bossName === bossName && 
                        pitchedItem.item === item && 
                        pitchedItem.date === date
        );
        
        if (!exactMatch) {
          logger.warn('usePitchedItems: Exact date match not found', {
            charId,
            bossName,
            item,
            targetDate: date,
            availableItemsForCharacter: cloudPitchedItems.filter(item => item.charId === charId).map(item => ({
              bossName: item.bossName,
              item: item.item,
              date: item.date
            }))
          });
          
          // Try to find alternative matches with same character/boss/item but different dates
          const alternativeMatches = cloudPitchedItems.filter(
            pitchedItem => pitchedItem.charId === charId && 
                          pitchedItem.bossName === bossName && 
                          pitchedItem.item === item
          );
          
          if (alternativeMatches.length > 0) {
            logger.info('usePitchedItems: Found alternative matches, using most recent', {
              alternativeCount: alternativeMatches.length,
              alternatives: alternativeMatches.map(item => item.date)
            });
            // Use the most recent alternative
            alternativeMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
            targetDate = alternativeMatches[0].date;
          } else {
            logger.error('usePitchedItems: No alternative matches found');
            throw new Error('Pitched item not found');
          }
        }
      }

      logger.debug('usePitchedItems: Proceeding with removal', {
        charId,
        bossName,
        item,
        targetDate
      });

      const result = await removePitchedItem(userId, charId, bossName, item, targetDate);
      
      if (result.success) {
        // Update local state
        setCloudPitchedItems(prev => prev.filter(pitchedItem =>
          !(pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item && pitchedItem.date === targetDate)
        ));
        
        // Update checked state
        const itemWeekKey = convertDateToWeekKey(targetDate);
        const key = `${charId}__${bossName}__${item}__${itemWeekKey}`;
        setPitchedChecked(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
        
        logger.info('usePitchedItems: Successfully removed pitched item', {
          charId,
          bossName,
          item,
          targetDate,
          removedKey: key
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
          itemsToRemove.forEach(({ charId, bossName, item, date }) => {
            if (date) {
              updated = updated.filter(
                pitchedItem => !(pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item && pitchedItem.date === date)
              );
            } else {
              const targetIndex = updated.findLastIndex(
                pitchedItem => pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item
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
          itemsToRemove.forEach(({ charId, bossName, item, date }) => {
            if (date) {
              const itemWeekKey = convertDateToWeekKey(date);
              const key = `${charId}__${bossName}__${item}__${itemWeekKey}`;
              delete updated[key];
            } else {
              // Remove all matching keys for this character, boss, and item
              Object.keys(updated).forEach(key => {
                if (key.startsWith(`${charId}__${bossName}__${item}__`)) {
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
    // Enhanced guard: Only load if we have a valid userId and we're not in a logout transition
    if (userId) {
      // Additional check to ensure we're not in a logout transition
      // Import STORAGE_KEYS from constants to check localStorage
      const checkAuthAndLoad = async () => {
        try {
          const { STORAGE_KEYS } = await import('../constants');
          const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
          
          // Only proceed if localStorage matches the provided userId
          if (currentStoredCode && currentStoredCode === userId) {
            logger.debug('usePitchedItems: Loading pitched items for user', { userId });
            refreshPitchedItems();
          } else {
            logger.debug('usePitchedItems: Skipping load - logout in progress or userId mismatch', {
              userId,
              storedCode: currentStoredCode
            });
          }
        } catch (error) {
          logger.error('usePitchedItems: Error checking auth state', { error });
        }
      };
      
      checkAuthAndLoad();
    } else {
      // Clear state when userId is null (during logout)
      logger.debug('usePitchedItems: Clearing state for logout');
      setCloudPitchedItems([]);
      setPitchedChecked({});
      setIsRefreshingPitchedItems(false);
    }
  }, [userId, refreshPitchedItems]); // Add refreshPitchedItems to dependencies

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