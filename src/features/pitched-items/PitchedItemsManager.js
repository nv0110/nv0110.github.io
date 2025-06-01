/**
 * Pitched Items Manager
 * Consolidated management for pitched items functionality
 * 
 * This module provides a unified interface for:
 * - Adding/removing pitched items
 * - Calculating weekly/yearly stats
 * - Managing UI state for pitched items
 * - Converting between old and new data formats
 */

import { useState, useEffect, useRef } from 'react';
import {
  getPitchedItems,
  addPitchedItem as addPitchedItemService,
  removePitchedItem as removePitchedItemService,
  getYearlyPitchedStats
} from '../../services/pitchedItemsService.js';
import { convertDateToWeekKey } from '../../utils/weekUtils.js';
import { getBossPitchedItems } from '../../services/bossRegistryService.js';

/**
 * Hook for managing pitched items with the new simplified format
 * @param {string} userId - User ID
 * @returns {Object} - Pitched items management interface
 */
export function usePitchedItemsManager(userId) {
  const [pitchedItems, setPitchedItems] = useState([]);
  const [pitchedChecked, setPitchedChecked] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const userInteractionRef = useRef(false);

  /**
   * Load pitched items from database
   */
  const refreshPitchedItems = async (options = {}) => {
    try {
      if (!userId) return;
      
      setLoading(true);
      setError(null);

      const result = await getPitchedItems(userId, options);
      
      if (result.success) {
        setPitchedItems(result.items);
        updateCheckedState(result.items);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update checked state based on pitched items
   */
  const updateCheckedState = (items) => {
    const newChecked = {};
    items.forEach(item => {
      const weekKey = convertDateToWeekKey(item.date);
      const key = `${item.charId}__${item.bossName}__${item.item}__${weekKey}`;
      newChecked[key] = true;
    });
    setPitchedChecked(newChecked);
  };

  /**
   * Add a new pitched item
   */
  const addPitchedItem = async (charId, bossName, item, date = null) => {
    try {
      setError(null);
      userInteractionRef.current = true;

      const pitchedItemData = {
        charId,
        bossName,
        item,
        date: date || new Date().toISOString().split('T')[0]
      };

      const result = await addPitchedItemService(userId, pitchedItemData);
      
      if (result.success) {
        // Update local state
        setPitchedItems(prev => [...prev, result.pitchedItem]);
        
        // Update checked state with correct key format
        const weekKey = convertDateToWeekKey(result.pitchedItem.date);
        const key = `${charId}__${bossName}__${item}__${weekKey}`;
        setPitchedChecked(prev => ({ ...prev, [key]: true }));
        
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  /**
   * Remove a pitched item
   */
  const removePitchedItem = async (charId, bossName, item, date = null) => {
    try {
      setError(null);
      userInteractionRef.current = true;

      const result = await removePitchedItemService(userId, charId, bossName, item, date);
      
      if (result.success) {
        // Update local state
        setPitchedItems(prev => {
          if (date) {
            return prev.filter(pitchedItem => 
              !(pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item && pitchedItem.date === date)
            );
          } else {
            const reversedItems = [...prev].reverse();
            const targetIndex = reversedItems.findIndex(
              pitchedItem => pitchedItem.charId === charId && pitchedItem.bossName === bossName && pitchedItem.item === item
            );
            if (targetIndex !== -1) {
              const actualIndex = prev.length - 1 - targetIndex;
              return prev.filter((_, index) => index !== actualIndex);
            }
            return prev;
          }
        });
        
        // Update checked state with correct key format
        if (date) {
          const weekKey = convertDateToWeekKey(date);
          const key = `${charId}__${bossName}__${item}__${weekKey}`;
          setPitchedChecked(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        } else {
          // Remove all matching keys for this character, boss, and item
          setPitchedChecked(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(key => {
              if (key.startsWith(`${charId}__${bossName}__${item}__`)) {
                delete updated[key];
              }
            });
            return updated;
          });
        }
        
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  /**
   * Get pitched items for a specific character
   */
  const getCharacterPitchedItems = (charId) => {
    return pitchedItems.filter(item => item.charId === charId);
  };

  /**
   * Get yearly stats
   */
  const getYearlyStats = async (year = null) => {
    try {
      const result = await getYearlyPitchedStats(userId, year);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Check if an item is obtained for a character in a specific week
   */
  const isItemObtained = (charId, bossName, item, weekKey) => {
    const key = `${charId}__${bossName}__${item}__${weekKey}`;
    return !!pitchedChecked[key];
  };

  // Load initial data
  useEffect(() => {
    if (userId) {
      refreshPitchedItems();
    }
  }, [userId]);

  return {
    // State
    pitchedItems,
    pitchedChecked,
    loading,
    error,
    userInteractionRef,
    
    // Actions
    refreshPitchedItems,
    addPitchedItem,
    removePitchedItem,
    getCharacterPitchedItems,
    getYearlyStats,
    isItemObtained,
    
    // Utilities
    setPitchedChecked,
    setError
  };
}

/**
 * Utility function to get item image from any boss
 */
export function getItemImage(itemName) {
  const allBossNames = [
    'Lotus', 'Damien', 'Lucid', 'Will', 'Gloom', 'Darknell', 
    'Verus Hilla', 'Chosen Seren', 'Watcher Kalos', 'Kaling', 'Limbo'
  ];
  
  for (const bossName of allBossNames) {
    const bossItems = getBossPitchedItems(bossName);
    const itemObj = bossItems.find(bossItem => bossItem.name === itemName);
    if (itemObj) {
      return itemObj.image;
    }
  }
  
  return '/items/crystal.png'; // fallback
}

/**
 * Utility function to group pitched items by item name
 */
export function groupPitchedItemsByName(pitchedItems) {
  const itemMap = new Map();
  
  pitchedItems.forEach(item => {
    const key = item.item;
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        name: item.item,
        image: getItemImage(item.item),
        count: 0,
        history: []
      });
    }
    
    const entry = itemMap.get(key);
    entry.count += 1;
    entry.history.push({
      charId: item.charId,
      date: item.date
    });
  });

  // Sort by count descending
  return Array.from(itemMap.values())
    .sort((a, b) => b.count - a.count);
}