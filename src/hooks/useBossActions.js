import { useState, useRef } from 'react';
import { toggleBossClearStatus, clearAllBossesForCharacter, markAllBossesForCharacter } from '../../services/userWeeklyDataService.js';
import { getCurrentMapleWeekStartDate } from '../../utils/mapleWeekUtils.js';

/**
 * Hook for managing boss clear actions in the new schema
 * Integrates with user_boss_data table via userWeeklyDataService
 */
export function useBossActions({
  userId,
  characterBossSelections,
  selectedCharIdx,
  checked,
  setChecked,
  setCrystalAnimation,
  setError,
  onDataChange
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const lastUpdateRef = useRef(null);

  /**
   * Handle individual boss check/uncheck
   */
  const handleCheck = async (bossOrEvent, checkedValOrBoss, event = null) => {
    try {
      if (isUpdating || !userId) return;

      let boss, checkedVal, e;
      
      if (bossOrEvent && bossOrEvent.name) {
        boss = bossOrEvent;
        checkedVal = checkedValOrBoss;
        e = event;
      } else if (bossOrEvent && bossOrEvent.target) {
        e = bossOrEvent;
        boss = checkedValOrBoss;
        checkedVal = e.target.checked;
      } else {
        console.error('Invalid parameters to handleCheck');
        return;
      }
      
      setIsUpdating(true);

      // Handle animation if this is from a UI click
      if (e && e.clientX && setCrystalAnimation) {
        const startPosition = { x: e.clientX, y: e.clientY };
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
          const progressBarRect = progressBar.getBoundingClientRect();
          const endPosition = {
            x: progressBarRect.left + progressBarRect.width / 2,
            y: progressBarRect.top + progressBarRect.height / 2
          };
          setCrystalAnimation({ startPosition, endPosition });
        }
      }

      const character = characterBossSelections[selectedCharIdx];
      if (!character) {
        throw new Error('No character selected');
      }

      const charName = character.name || '';
      const charIdx = selectedCharIdx.toString();
      const charKey = `${charName}-${selectedCharIdx}`;
      const bossName = boss.name;
      const bossDifficulty = boss.difficulty;
      const bossKey = `${bossName}-${bossDifficulty}`;
      
      // Update UI state immediately for responsiveness
      const newChecked = {
        ...checked,
        [charKey]: {
          ...(checked[charKey] || {}),
          [bossKey]: checkedVal
        }
      };
      setChecked(newChecked);

      // Convert boss name and difficulty to boss code
      // This assumes boss code format like "DH" for "Darknell Hard"
      const bossCode = getBossCodeFromNameAndDifficulty(bossName, bossDifficulty);
      
      if (!bossCode) {
        throw new Error(`Could not determine boss code for ${bossName} ${bossDifficulty}`);
      }

      // Update database
      const currentWeekStart = getCurrentMapleWeekStartDate();
      const result = await toggleBossClearStatus(
        userId,
        currentWeekStart,
        charIdx,
        bossCode,
        checkedVal
      );

      if (!result.success) {
        // Revert UI state on error
        setChecked(checked);
        throw new Error(result.error);
      }

      // Notify parent of data change
      if (onDataChange) {
        onDataChange();
      }

      lastUpdateRef.current = Date.now();
      
    } catch (err) {
      console.error('Error in handleCheck:', err);
      // Revert UI state on error
      setChecked(checked);
      if (setError) {
        setError(`Failed to update boss status: ${err.message}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handle tick all bosses for current character
   */
  const handleTickAll = async () => {
    try {
      if (isUpdating || !userId) return;

      setIsUpdating(true);

      const character = characterBossSelections[selectedCharIdx];
      if (!character) {
        throw new Error('No character selected');
      }

      const charBosses = character.bosses || [];
      const charKey = `${character.name || ''}-${selectedCharIdx}`;
      const currentState = checked[charKey] || {};
      
      // Check if all bosses are currently checked
      const allChecked = charBosses.every(b => currentState[b.name + '-' + b.difficulty]);
      const targetState = !allChecked;
      
      // Update UI state immediately
      const newChecked = {
        ...checked,
        [charKey]: Object.fromEntries(charBosses.map(b => [b.name + '-' + b.difficulty, targetState]))
      };
      setChecked(newChecked);

      const charIdx = selectedCharIdx.toString();
      const currentWeekStart = getCurrentMapleWeekStartDate();

      let result;
      if (targetState) {
        // Mark all bosses as cleared
        result = await markAllBossesForCharacter(userId, currentWeekStart, charIdx);
      } else {
        // Clear all bosses
        result = await clearAllBossesForCharacter(userId, currentWeekStart, charIdx);
      }

      if (!result.success) {
        // Revert UI state on error
        setChecked(checked);
        throw new Error(result.error);
      }

      // Notify parent of data change
      if (onDataChange) {
        onDataChange();
      }

      lastUpdateRef.current = Date.now();
      
    } catch (err) {
      console.error('Error in handleTickAll:', err);
      // Revert UI state on error
      setChecked(checked);
      if (setError) {
        setError(`Failed to update all bosses: ${err.message}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

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
    lastUpdate: lastUpdateRef.current
  };
}

/**
 * Helper function to convert boss name and difficulty to boss code
 * Creates a consistent code from any boss name and difficulty
 */
function getBossCodeFromNameAndDifficulty(bossName, difficulty) {
  if (!bossName || !difficulty) return null;
  
  // Create a consistent boss code by combining first letters of boss name with difficulty
  const bossInitials = bossName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  const difficultyCode = difficulty.charAt(0).toUpperCase();
  
  // Return format: BossInitials + DifficultyCode (e.g., "DH" for Darknell Hard)
  return `${bossInitials}${difficultyCode}`;
}