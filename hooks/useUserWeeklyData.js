/**
 * User Weekly Data Hook
 * 
 * Consolidated hook for managing user weekly character and boss configuration
 * using the new userWeeklyDataService that targets the user_boss_data table.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthentication } from './useAuthentication';
import { getCurrentMapleWeekStartDate } from '../utils/mapleWeekUtils';
import {
  fetchUserWeeklyData,
  saveOrUpdateUserWeeklyData,
  addCharacterToWeeklySetup,
  removeCharacterFromWeeklySetup,
  updateCharacterNameInWeeklySetup,
  updateCharacterBossConfigInWeeklySetup,
  fetchCurrentWeekData
} from '../services/userWeeklyDataService';

export function useUserWeeklyData() {
  const { userCode, isLoggedIn } = useAuthentication();
  
  // State for weekly data
  const [weeklyData, setWeeklyData] = useState(null);
  const [currentWeekStart, _setCurrentWeekStart] = useState(() => getCurrentMapleWeekStartDate());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Character management state
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(null);
  const [newCharacterName, setNewCharacterName] = useState('');

  // Load weekly data effect
  useEffect(() => {
    if (!userCode || !isLoggedIn) {
      setWeeklyData(null);
      setError('');
      return;
    }

    let isMounted = true;
    const loadWeeklyData = async () => {
      try {
        setIsLoading(true);
        setError('');

        const result = await fetchCurrentWeekData(userCode);
        
        if (!isMounted) return;

        if (result.success) {
          setWeeklyData(result.data);
        } else {
          setError(result.error || 'Failed to load weekly data.');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load weekly data:', err);
          setError('Failed to load weekly data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWeeklyData();
    return () => { isMounted = false; };
  }, [userCode, isLoggedIn, currentWeekStart]);

  // Refresh weekly data
  const refreshWeeklyData = useCallback(async () => {
    if (!userCode || !isLoggedIn) return;

    try {
      setIsLoading(true);
      const result = await fetchCurrentWeekData(userCode);
      
      if (result.success) {
        setWeeklyData(result.data);
        setError('');
      } else {
        setError(result.error || 'Failed to refresh data.');
      }
    } catch (err) {
      console.error('Failed to refresh weekly data:', err);
      setError('Failed to refresh data.');
    } finally {
      setIsLoading(false);
    }
  }, [userCode, isLoggedIn]);

  // Get characters array from weekly data
  const getCharacters = useCallback(() => {
    if (!weeklyData || !weeklyData.char_map) {
      return [];
    }

    return Object.entries(weeklyData.char_map).map(([index, name]) => ({
      index: parseInt(index),
      name: name,
      bossConfig: weeklyData.boss_config?.[index] || '',
      weeklyClears: weeklyData.weekly_clears?.[index] || ''
    })).sort((a, b) => a.index - b.index);
  }, [weeklyData]);

  // Add character
  const addCharacter = useCallback(async (characterName) => {
    if (!userCode || !isLoggedIn) {
      setError('Not logged in.');
      return { success: false, error: 'Not logged in.' };
    }

    if (!characterName?.trim()) {
      setError('Character name cannot be empty.');
      return { success: false, error: 'Character name cannot be empty.' };
    }

    try {
      setIsLoading(true);
      setError('');

      const result = await addCharacterToWeeklySetup(
        userCode,
        currentWeekStart,
        characterName.trim()
      );

      if (result.success) {
        await refreshWeeklyData();
        setNewCharacterName('');
        return { success: true, characterIndex: result.characterIndex };
      } else {
        setError(result.error || 'Failed to add character.');
        return result;
      }
    } catch (err) {
      console.error('Failed to add character:', err);
      const errorMessage = 'Failed to add character.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userCode, isLoggedIn, currentWeekStart, refreshWeeklyData]);

  // Remove character
  const removeCharacter = useCallback(async (characterIndex) => {
    if (!userCode || !isLoggedIn) {
      setError('Not logged in.');
      return { success: false, error: 'Not logged in.' };
    }

    try {
      setIsLoading(true);
      setError('');

      const result = await removeCharacterFromWeeklySetup(
        userCode,
        currentWeekStart,
        characterIndex
      );

      if (result.success) {
        await refreshWeeklyData();
        
        // Update selected character index if necessary
        if (selectedCharacterIndex === characterIndex) {
          setSelectedCharacterIndex(null);
        }
        
        return { success: true };
      } else {
        setError(result.error || 'Failed to remove character.');
        return result;
      }
    } catch (err) {
      console.error('Failed to remove character:', err);
      const errorMessage = 'Failed to remove character.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userCode, isLoggedIn, currentWeekStart, selectedCharacterIndex, refreshWeeklyData]);

  // Update character name
  const updateCharacterName = useCallback(async (characterIndex, newName) => {
    if (!userCode || !isLoggedIn) {
      setError('Not logged in.');
      return { success: false, error: 'Not logged in.' };
    }

    try {
      setIsLoading(true);
      setError('');

      const result = await updateCharacterNameInWeeklySetup(
        userCode,
        currentWeekStart,
        characterIndex,
        newName
      );

      if (result.success) {
        await refreshWeeklyData();
        return { success: true };
      } else {
        setError(result.error || 'Failed to update character name.');
        return result;
      }
    } catch (err) {
      console.error('Failed to update character name:', err);
      const errorMessage = 'Failed to update character name.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userCode, isLoggedIn, currentWeekStart, refreshWeeklyData]);

  // Update character boss configuration
  const updateCharacterBossConfig = useCallback(async (characterIndex, newBossConfigString) => {
    if (!userCode || !isLoggedIn) {
      setError('Not logged in.');
      return { success: false, error: 'Not logged in.' };
    }

    try {
      setIsLoading(true);
      setError('');

      const result = await updateCharacterBossConfigInWeeklySetup(
        userCode,
        currentWeekStart,
        characterIndex,
        newBossConfigString
      );

      if (result.success) {
        await refreshWeeklyData();
        return { success: true };
      } else {
        setError(result.error || 'Failed to update boss configuration.');
        return result;
      }
    } catch (err) {
      console.error('Failed to update boss configuration:', err);
      const errorMessage = 'Failed to update boss configuration.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userCode, isLoggedIn, currentWeekStart, refreshWeeklyData]);

  // Get character by index
  const getCharacterByIndex = useCallback((index) => {
    const characters = getCharacters();
    return characters.find(char => char.index === index) || null;
  }, [getCharacters]);

  // Check if character name exists
  const characterNameExists = useCallback((name, excludeIndex = null) => {
    const characters = getCharacters();
    return characters.some(char => 
      char.name.toLowerCase() === name.toLowerCase() && 
      char.index !== excludeIndex
    );
  }, [getCharacters]);

  return {
    // Data state
    weeklyData,
    currentWeekStart,
    isLoading,
    error,
    setError,

    // Character management
    characters: getCharacters(),
    selectedCharacterIndex,
    setSelectedCharacterIndex,
    newCharacterName,
    setNewCharacterName,

    // Actions
    refreshWeeklyData,
    addCharacter,
    removeCharacter,
    updateCharacterName,
    updateCharacterBossConfig,

    // Utilities
    getCharacterByIndex,
    characterNameExists,

    // Raw weekly data operations (for advanced use cases)
    fetchWeeklyData: (userId, weekStart) => fetchUserWeeklyData(userId, weekStart),
    saveWeeklyData: (userId, weekStart, payload) => saveOrUpdateUserWeeklyData(userId, weekStart, payload),
  };
}