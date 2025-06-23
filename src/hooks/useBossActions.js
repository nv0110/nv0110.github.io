import { useState, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';
import { getBossRegistryId } from '../utils/bossCodeMapping';
import { toggleBossClearStatus, clearAllBossesForCharacter, markAllBossesForCharacter } from '../services/userWeeklyDataService.js';
import { getCurrentMapleWeekStartDate } from '../utils/mapleWeekUtils.js';

/**
 * Hook for managing boss actions (check/uncheck, tick all)
 * @param {Object} options - Configuration options
 * @returns {Object} - Boss action handlers and state
 */
export function useBossActions({
  userId = null,
  characterBossSelections = [],
  selectedCharIdx = 0,
  checked = {},
  setChecked = () => {},
  setError = () => {},
  onDataChange = () => {},
  isHistoricalWeek = false,
  onBossUncheckStart = () => {},
  onBossUncheckEnd = () => {}
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const userInteractionRef = useRef(false);
  const lastUpdateRef = useRef(0);

  /**
   * Handle checking/unchecking a boss
   */
  const handleCheck = useCallback(async (boss, isChecked, event) => {
    if (isUpdating || !userId) {
      logger.info('useBossActions: Boss check skipped', { 
        isUpdating: isUpdating, 
        hasUserId: !!userId 
      });
      return;
    }

    // Skip if no character selected
    if (selectedCharIdx === null || selectedCharIdx === undefined) {
      logger.debug('useBossActions: Boss check skipped', {
        reason: 'No character selected',
        characterIdx: selectedCharIdx,
        bossName: boss.name,
        difficulty: boss.difficulty
      });
      return;
    }

    // Skip for historical weeks
    if (isHistoricalWeek) {
      logger.debug('useBossActions: Boss check skipped for historical week');
      return;
    }

    setIsUpdating(true);
    userInteractionRef.current = true;

    try {
      logger.debug('useBossActions: Boss check initiated', {
        bossName: boss.name,
        difficulty: boss.difficulty,
        isChecked: isChecked,
        characterIdx: selectedCharIdx
      });

      const char = characterBossSelections[selectedCharIdx];
      if (!char) {
        throw new Error('No character selected');
      }

      const charKey = `${char.name}-${selectedCharIdx}`;
      const bossKey = `${boss.name}-${boss.difficulty}`;

      // Update local state immediately for responsiveness
      setChecked(prevChecked => {
        const newChecked = { ...prevChecked };
        if (!newChecked[charKey]) {
          newChecked[charKey] = {};
        }
        newChecked[charKey] = { ...newChecked[charKey] };
        
        if (isChecked) {
          newChecked[charKey][bossKey] = true;
        } else {
          delete newChecked[charKey][bossKey];
        }
        
        return newChecked;
      });

      logger.debug('useBossActions: Boss check details', {
        charName: char.name,
        charIdx: selectedCharIdx,
        bossName: boss.name,
        difficulty: boss.difficulty
      });

      // Convert boss to registry ID for database storage
      logger.debug('useBossActions: Converting boss to registry ID', {
        bossName: boss.name,
        difficulty: boss.difficulty
      });
      const bossRegistryId = await getBossRegistryId(boss.name, boss.difficulty);
      logger.debug('useBossActions: Boss registry ID obtained', bossRegistryId);

      // Update database
      const { toggleBossClearStatus } = await import('../services/userWeeklyDataService');
      const { getCurrentMapleWeekStartDate } = await import('../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      
      const updateData = {
        userId: userId,
        characterName: char.name,
        characterIndex: char.index.toString(),
        bossRegistryId: bossRegistryId,
        isCompleted: isChecked,
        weekKey: currentWeekStart
      };
      
      logger.debug('useBossActions: Updating database', {
        userId: userId,
        characterName: char.name,
        characterIndex: char.index.toString(),
        bossRegistryId: bossRegistryId,
        isCompleted: isChecked,
        weekKey: currentWeekStart
      });

      const result = await toggleBossClearStatus(
        userId,
        currentWeekStart,
        char.index.toString(),
        bossRegistryId,
        isChecked
      );

      logger.debug('useBossActions: Database update result', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update boss completion');
      }

      // 🎯 REVERSE LOGIC: If unchecking a boss, remove all pitched items for this boss
      if (!isChecked) {
        // Notify that unchecking is starting
        onBossUncheckStart();
        
        try {
          logger.info('useBossActions: Boss unchecked - removing associated pitched items', {
            characterName: char.name,
            bossName: boss.name,
            difficulty: boss.difficulty
          });

          // Import pitched items service
          const { removeManyPitchedItems } = await import('../services/pitchedItemsService.js');
          const { getCurrentWeekKey, convertWeekKeyToDate, getWeekDateRange } = await import('../utils/weekUtils.js');
          
          const currentWeek = getCurrentWeekKey();
          const currentWeekDate = convertWeekKeyToDate(currentWeek);
          
          // Import week utils for date range checking
          const currentWeekRange = getWeekDateRange(currentWeek);
          
          logger.info('useBossActions: Week date analysis', {
            currentWeek,
            currentWeekDate,
            currentWeekRange: {
              start: currentWeekRange.start,
              end: currentWeekRange.end
            }
          });
          
          // Find all pitched items for this character, boss, and current week
          const itemsToRemove = [];
          
          // We need to remove all items for this boss regardless of item name
          // Since we don't have direct access to cloudPitchedItems here, we'll use the service
          // to find and remove items by character name and boss name for current week
          const { getPitchedItems } = await import('../services/pitchedItemsService.js');
          const pitchedResult = await getPitchedItems(userId, {});
          
          logger.info('useBossActions: Retrieved pitched items for removal check', {
            success: pitchedResult.success,
            totalItems: pitchedResult.success ? pitchedResult.items.length : 0,
            userId,
            currentWeekDate
          });
          
          if (pitchedResult.success) {
            // Enhanced logging to debug exact matching
            pitchedResult.items.forEach((item, index) => {
              // Check if item date is within current week range or is null (current week)
              // Convert string date to Date object for proper comparison
              const itemDateObj = item.date ? new Date(item.date) : null;
              const isInCurrentWeek = item.date === null || 
                (itemDateObj && itemDateObj >= currentWeekRange.start && itemDateObj <= currentWeekRange.end);
              
              logger.info(`useBossActions: Item ${index} - Character comparison: "${item.charId}" === "${char.name}" = ${item.charId === char.name}`);
              logger.info(`useBossActions: Item ${index} - Boss comparison: "${item.bossName}" === "${boss.name}" = ${item.bossName === boss.name}`);
              logger.info(`useBossActions: Item ${index} - Date analysis: ${item.date} (as Date: ${itemDateObj}) in range ${currentWeekRange.start} to ${currentWeekRange.end} OR null = ${isInCurrentWeek}`);
              logger.info(`useBossActions: Item ${index} - Overall match: ${item.charId === char.name && item.bossName === boss.name && isInCurrentWeek}`);
            });
            
            const currentWeekItems = pitchedResult.items.filter(item => {
              // Convert string date to Date object for proper comparison
              const itemDateObj = item.date ? new Date(item.date) : null;
              const isInCurrentWeek = item.date === null || 
                (itemDateObj && itemDateObj >= currentWeekRange.start && itemDateObj <= currentWeekRange.end);
              
              return item.charId === char.name && 
                     item.bossName === boss.name && 
                     isInCurrentWeek;
            });
            
            logger.info('useBossActions: Filtered items for removal', {
              totalItemsFromDB: pitchedResult.items.length,
              filteredItems: currentWeekItems.length,
              filterCriteria: {
                charId: char.name,
                bossName: boss.name,
                date: currentWeekDate,
                alsoMatchingNull: true
              },
              allItemsFromDB: pitchedResult.items.map(item => ({
                charId: item.charId,
                bossName: item.bossName,
                item: item.item,
                date: item.date
              })),
              filteredItemDetails: currentWeekItems.map(item => ({
                charId: item.charId,
                bossName: item.bossName,
                item: item.item,
                date: item.date
              }))
            });
            
            currentWeekItems.forEach(item => {
              itemsToRemove.push({
                charId: item.charId,
                bossName: item.bossName,
                item: item.item,
                date: item.date
              });
            });
            
            if (itemsToRemove.length > 0) {
              logger.info('useBossActions: Removing pitched items for unchecked boss', {
                characterName: char.name,
                bossName: boss.name,
                itemsToRemove: itemsToRemove.length,
                itemDetails: itemsToRemove
              });
              
              const removeResult = await removeManyPitchedItems(userId, itemsToRemove);
              
              logger.info('useBossActions: Pitched items removal result', {
                success: removeResult.success,
                error: removeResult.error,
                removedCount: removeResult.removedCount,
                attemptedRemovalCount: itemsToRemove.length
              });
              
              if (!removeResult.success) {
                logger.warn('useBossActions: Failed to remove some pitched items', {
                  error: removeResult.error,
                  itemsToRemove
                });
              } else {
                logger.info('useBossActions: Successfully removed pitched items', {
                  removedCount: removeResult.removedCount,
                  originalCount: itemsToRemove.length
                });
                
                // Trigger data refresh to update UI
                if (onDataChange) {
                  onDataChange();
                }
              }
            } else {
              logger.info('useBossActions: No pitched items found to remove', {
                characterName: char.name,
                bossName: boss.name,
                currentWeekDate,
                totalItemsInDB: pitchedResult.items.length
              });
            }
          }
        } catch (pitchedItemsError) {
          logger.warn('useBossActions: Failed to remove pitched items for unchecked boss', {
            error: pitchedItemsError,
            characterName: char.name,
            bossName: boss.name
          });
          // Don't fail the boss uncheck operation if pitched item removal fails
        } finally {
          // Notify that unchecking process is complete
          onBossUncheckEnd();
        }
      }

      // Update local state
      setChecked(prevChecked => {
        const newChecked = { ...prevChecked };
        if (!newChecked[charKey]) {
          newChecked[charKey] = {};
        }
        newChecked[charKey] = { ...newChecked[charKey] };
        
        if (isChecked) {
          newChecked[charKey][bossKey] = true;
        } else {
          delete newChecked[charKey][bossKey];
        }
        
        return newChecked;
      });
      
      logger.debug('useBossActions: Boss check completed successfully');

      lastUpdateRef.current = Date.now();

    } catch (error) {
      logger.error('useBossActions: Error handling boss check', error);
      setError(error.message);
      
      // Revert optimistic update on error
      setChecked(prevChecked => {
        const newChecked = { ...prevChecked };
        const char = characterBossSelections[selectedCharIdx];
        if (char) {
          const charKey = `${char.name}-${selectedCharIdx}`;
          const bossKey = `${boss.name}-${boss.difficulty}`;
          
          if (!newChecked[charKey]) {
            newChecked[charKey] = {};
          }
          newChecked[charKey] = { ...newChecked[charKey] };
          
          if (!isChecked) {
            newChecked[charKey][bossKey] = true;
          } else {
            delete newChecked[charKey][bossKey];
          }
        }
        return newChecked;
      });
    } finally {
      setIsUpdating(false);
    }
  }, [
    userId,
    characterBossSelections,
    selectedCharIdx,
    checked,
    setChecked,
    setError,
    onDataChange,
    isUpdating,
    isHistoricalWeek,
    onBossUncheckStart,
    onBossUncheckEnd
  ]);

  /**
   * Handle tick all bosses for current character
   */
  const handleTickAll = useCallback(async () => {
    if (!userId || isHistoricalWeek || isUpdating) {
      return;
    }

    setIsUpdating(true);
    userInteractionRef.current = true;

    try {
      const char = characterBossSelections[selectedCharIdx];
      if (!char) {
        throw new Error('No character selected');
      }

      const charKey = `${char.name}-${selectedCharIdx}`;
      const bosses = char.bosses || [];

      // Determine if we're checking all or unchecking all
      const allChecked = bosses.every(boss => 
        checked[charKey]?.[`${boss.name}-${boss.difficulty}`]
      );
      
      const shouldCheck = !allChecked;

      // Store original state for potential rollback
      const originalCheckedState = { ...checked };

      // Update local state immediately for responsiveness
      setChecked(prevChecked => {
        const newChecked = { ...prevChecked };
        if (!newChecked[charKey]) {
          newChecked[charKey] = {};
        }
        newChecked[charKey] = { ...newChecked[charKey] };

        for (const boss of bosses) {
          const bossKey = `${boss.name}-${boss.difficulty}`;
          if (shouldCheck) {
            newChecked[charKey][bossKey] = true;
          } else {
            delete newChecked[charKey][bossKey];
          }
        }

        return newChecked;
      });

      // Use bulk operations instead of parallel individual operations
      const { clearAllBossesForCharacter, markAllBossesForCharacter } = await import('../services/userWeeklyDataService');
      const { getCurrentMapleWeekStartDate } = await import('../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      
      let result;
      if (shouldCheck) {
        // Mark all bosses as cleared using bulk operation
        logger.debug('useBossActions: Marking all bosses as cleared', {
          characterIdx: char.index,
          bossCount: bosses.length,
          weekKey: currentWeekStart
        });
        
        result = await markAllBossesForCharacter(
          userId,
          currentWeekStart,
          char.index.toString()
        );
      } else {
        // Clear all bosses using bulk operation
        logger.debug('useBossActions: Clearing all bosses', {
          characterIdx: char.index,
          bossCount: bosses.length,
          weekKey: currentWeekStart
        });
        
        result = await clearAllBossesForCharacter(
          userId,
          currentWeekStart,
          char.index.toString()
        );
      }

      if (!result.success) {
        logger.error('useBossActions: Bulk operation failed', { 
          action: shouldCheck ? 'markAll' : 'clearAll',
          error: result.error 
        });
        
        // Revert to original state and show error
        setChecked(originalCheckedState);
        setError(`Failed to ${shouldCheck ? 'mark all bosses as completed' : 'clear all boss completions'}. Please try again.`);
      } else {
        // 🎯 REVERSE LOGIC: If clearing all bosses, remove all pitched items for this character
        if (!shouldCheck) {
          // Notify that unchecking is starting
          onBossUncheckStart();
          
          try {
            logger.info('useBossActions: All bosses cleared - removing all pitched items for character', {
              characterName: char.name,
              bossCount: bosses.length
            });

            // Import pitched items service
            const { getPitchedItems, removeManyPitchedItems } = await import('../services/pitchedItemsService.js');
            const { getCurrentWeekKey } = await import('../utils/weekUtils.js');
            const { convertWeekKeyToDate } = await import('../utils/weekUtils.js');
            
            const currentWeek = getCurrentWeekKey();
            const currentWeekDate = convertWeekKeyToDate(currentWeek);
            
            // Find all pitched items for this character and current week
            const pitchedResult = await getPitchedItems(userId, {});
            
            if (pitchedResult.success) {
              const currentWeekItems = pitchedResult.items.filter(item => 
                item.charId === char.name && 
                item.date === currentWeekDate
              );
              
              if (currentWeekItems.length > 0) {
                const itemsToRemove = currentWeekItems.map(item => ({
                  charId: item.charId,
                  bossName: item.bossName,
                  item: item.item,
                  date: item.date
                }));
                
                logger.info('useBossActions: Removing all pitched items for character', {
                  characterName: char.name,
                  itemsToRemove: itemsToRemove.length
                });
                
                const removeResult = await removeManyPitchedItems(userId, itemsToRemove);
                if (!removeResult.success) {
                  logger.warn('useBossActions: Failed to remove some pitched items during clear all', {
                    error: removeResult.error
                  });
                } else {
                  logger.info('useBossActions: Successfully removed all pitched items for character', {
                    removedCount: removeResult.removedCount
                  });
                }
              }
            }
          } catch (pitchedItemsError) {
            logger.warn('useBossActions: Failed to remove pitched items during clear all', {
              error: pitchedItemsError,
              characterName: char.name
            });
            // Don't fail the clear all operation if pitched item removal fails
          } finally {
            // Notify that unchecking process is complete
            onBossUncheckEnd();
          }
        }
        
        // Operation successful, trigger data refresh
        await onDataChange();
        logger.debug('useBossActions: Tick all completed successfully', {
          characterIdx: char.index,
          allTicked: shouldCheck,
          processedBosses: bosses.length
        });
      }

    } catch (error) {
      logger.error('useBossActions: Error handling tick all', error);
      setError(error.message);
      
      // Revert to original state on any error
      setChecked(prevChecked => {
        const char = characterBossSelections[selectedCharIdx];
        if (!char) return prevChecked;
        
        const charKey = `${char.name}-${selectedCharIdx}`;
        const originalCharState = prevChecked[charKey] || {};
        
        return {
          ...prevChecked,
          [charKey]: { ...originalCharState }
        };
      });
    } finally {
      setIsUpdating(false);
    }
  }, [
    userId,
    characterBossSelections,
    selectedCharIdx,
    checked,
    setChecked,
    setError,
    onDataChange,
    isUpdating,
    isHistoricalWeek,
    onBossUncheckStart,
    onBossUncheckEnd
  ]);

  /**
   * Refresh checked state from database
   */
  const refreshCheckedStateFromDatabase = async () => {
    try {
      if (!userId) return null;

      // This would need to fetch current weekly data and reconstruct checked state
      // For now, we'll let the parent component handle this
      if (onDataChange) {
        onDataChange();
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing checked state:', error);
      return null;
    }
  };

  return {
    handleCheck,
    handleTickAll,
    refreshCheckedStateFromDatabase,
    isUpdating,
    userInteractionRef,
    lastUpdate: lastUpdateRef.current
  };
} 
