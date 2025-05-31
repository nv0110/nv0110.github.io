import { useState, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';
import { getBossRegistryId } from '../utils/bossCodeMapping';
import { toggleBossClearStatus, clearAllBossesForCharacter, markAllBossesForCharacter } from '../../services/userWeeklyDataService.js';
import { getCurrentMapleWeekStartDate } from '../../utils/mapleWeekUtils.js';

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
  setCrystalAnimation = () => {},
  setError = () => {},
  onDataChange = () => {},
  isHistoricalWeek = false
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

    if (isHistoricalWeek) {
      logger.info('useBossActions: Boss check skipped for historical week');
      return;
    }

    setIsUpdating(true);
    userInteractionRef.current = true;

    try {
      logger.info('useBossActions: Boss check initiated', {
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

      logger.info('useBossActions: Boss check details', { 
        charName: char.name, 
        charIdx: selectedCharIdx, 
        bossName: boss.name, 
        difficulty: boss.difficulty 
      });

      // Convert boss to registry ID for database operations
      let bossRegistryId;
      try {
        logger.info('useBossActions: Converting boss to registry ID', { 
          bossName: boss.name, 
          difficulty: boss.difficulty 
        });
        bossRegistryId = await getBossRegistryId(boss.name, boss.difficulty);
        logger.info('useBossActions: Boss registry ID obtained', bossRegistryId);
      } catch (conversionError) {
        throw new Error(`Failed to convert boss to registry ID: ${conversionError.message}`);
      }

      // Update database
      const { toggleBossClearStatus } = await import('../../services/userWeeklyDataService');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      
      logger.info('useBossActions: Updating database', {
        userId: userId,
        characterName: char.name,
        characterIndex: selectedCharIdx.toString(),
        bossRegistryId: bossRegistryId,
        isCompleted: isChecked,
        weekStart: currentWeekStart
      });

      const result = await toggleBossClearStatus(
        userId,
        currentWeekStart,
        selectedCharIdx.toString(),
        bossRegistryId,
        isChecked
      );

      logger.info('useBossActions: Database update result', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update boss clear status');
      }

      // Trigger data refresh
      await onDataChange();
      
      logger.info('useBossActions: Boss check completed successfully');

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
    setCrystalAnimation,
    setError,
    onDataChange,
    isUpdating,
    isHistoricalWeek
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
      const { clearAllBossesForCharacter, markAllBossesForCharacter } = await import('../../services/userWeeklyDataService');
      const { getCurrentMapleWeekStartDate } = await import('../../utils/mapleWeekUtils.js');
      
      const currentWeekStart = getCurrentMapleWeekStartDate();
      
      let result;
      if (shouldCheck) {
        // Mark all bosses as cleared using bulk operation
        logger.info('useBossActions: Marking all bosses as cleared', {
          userId: userId,
          characterIndex: selectedCharIdx.toString(),
          weekStart: currentWeekStart
        });
        
        result = await markAllBossesForCharacter(
          userId,
          currentWeekStart,
          selectedCharIdx.toString()
        );
      } else {
        // Clear all bosses using bulk operation
        logger.info('useBossActions: Clearing all bosses', {
          userId: userId,
          characterIndex: selectedCharIdx.toString(),
          weekStart: currentWeekStart
        });
        
        result = await clearAllBossesForCharacter(
          userId,
          currentWeekStart,
          selectedCharIdx.toString()
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
        // Operation successful, trigger data refresh
        await onDataChange();
        logger.info('useBossActions: Tick all completed successfully', { 
          action: shouldCheck ? 'check' : 'uncheck', 
          bossCount: bosses.length 
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
    isHistoricalWeek
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