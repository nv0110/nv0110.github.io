import { useState, useEffect, useCallback } from 'react';
import { getCurrentWeekKey as getRealCurrentWeekKey } from '../utils/weekUtils';
import { getHistoricalWeekAnalysis, getCharacterHistoricalWeekAnalysis } from '../../services/utilityService.js';
import { logger } from '../utils/logger';

export function useWeekNavigation(userCode, appWeekKeyFromProps, selectedCharacterName = null) {
  const [selectedWeekKey, setSelectedWeekKey] = useState(appWeekKeyFromProps || getRealCurrentWeekKey());
  const [historicalAnalysis, setHistoricalAnalysis] = useState({
    hasHistoricalData: false,
    oldestHistoricalWeek: null,
    userType: 'new',
    adaptiveWeekLimit: 8,
    historicalWeeks: [],
    analysis: null
  });
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    if (appWeekKeyFromProps && appWeekKeyFromProps !== selectedWeekKey) {
      logger.info('useWeekNavigation: App week key differs from selected, updating', { 
        appWeekKey: appWeekKeyFromProps, 
        selectedWeekKey: selectedWeekKey 
      });
      setSelectedWeekKey(appWeekKeyFromProps);
    }
  }, [appWeekKeyFromProps]); // Removed selectedWeekKey to prevent circular updates

  const isHistoricalWeek = selectedWeekKey !== (appWeekKeyFromProps || getRealCurrentWeekKey());

  const refreshHistoricalAnalysis = useCallback(async () => {
    // Enhanced guard: Check for auth state validity
    if (!userCode || isLoadingAnalysis) return;
    
    // Additional check to ensure we're not in a logout transition
    try {
      const { STORAGE_KEYS } = await import('../constants');
      const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
      
      if (!currentStoredCode || currentStoredCode !== userCode) {
        logger.debug('useWeekNavigation: Skipping analysis refresh - logout in progress', {
          userCode,
          storedCode: currentStoredCode
        });
        return;
      }
    } catch (error) {
      logger.error('useWeekNavigation: Error checking auth state for analysis', { error });
      return;
    }
    
    const realCurrentWeek = getRealCurrentWeekKey();
    try {
      setIsLoadingAnalysis(true);
      logger.debug('useWeekNavigation: Refreshing historical analysis', {
        userCode,
        realCurrentWeek,
        selectedCharacterName
      });
      
      // Call character-specific historical analysis
      const analysisResult = selectedCharacterName 
        ? await getCharacterHistoricalWeekAnalysis(userCode, selectedCharacterName)
        : await getHistoricalWeekAnalysis(userCode);
      
      if (analysisResult.success) {
        setHistoricalAnalysis({
          hasHistoricalData: analysisResult.hasHistoricalData,
          oldestHistoricalWeek: analysisResult.oldestHistoricalWeek,
          userType: analysisResult.userType,
          adaptiveWeekLimit: analysisResult.adaptiveWeekLimit,
          historicalWeeks: analysisResult.historicalWeeks,
          analysis: analysisResult.analysis
        });
        
        logger.debug('useWeekNavigation: Historical analysis refreshed', {
          userType: analysisResult.userType,
          hasData: analysisResult.hasHistoricalData,
          oldestWeek: analysisResult.oldestHistoricalWeek,
          adaptiveLimit: analysisResult.adaptiveWeekLimit,
          historicalWeeksCount: analysisResult.historicalWeeks?.length || 0,
          characterSpecific: !!selectedCharacterName
        });
      } else {
        logger.error('useWeekNavigation: Error in historical analysis result', analysisResult.error);
      }
    } catch (error) {
      logger.error('useWeekNavigation: Error refreshing historical analysis', error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [userCode, isLoadingAnalysis, selectedCharacterName]);

  const handleWeekChange = useCallback((newWeekKey) => {
    if (newWeekKey !== selectedWeekKey) {
      logger.info('useWeekNavigation: Week changed', { 
        from: selectedWeekKey, 
        to: newWeekKey 
      });
      setSelectedWeekKey(newWeekKey);
      
      // Refresh historical analysis when week changes
      if (userCode) {
        // Additional auth check before scheduling analysis refresh
        const checkAuthAndRefresh = async () => {
          try {
            const { STORAGE_KEYS } = await import('../constants');
            const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
            
            if (currentStoredCode && currentStoredCode === userCode) {
              setTimeout(() => {
                refreshHistoricalAnalysis();
              }, 100);
            } else {
              logger.debug('useWeekNavigation: Skipping week change analysis - logout in progress');
            }
          } catch (error) {
            logger.error('useWeekNavigation: Error checking auth for week change', { error });
          }
        };
        
        checkAuthAndRefresh();
      }
    }
  }, [selectedWeekKey, userCode, refreshHistoricalAnalysis]);

  // Load historical analysis when userCode changes or on mount
  useEffect(() => {
    // Enhanced guard: Only load if we have a valid userCode and we're not in a logout transition
    if (userCode) {
      const checkAuthAndLoad = async () => {
        try {
          const { STORAGE_KEYS } = await import('../constants');
          const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
          
          // Only proceed if localStorage matches the provided userCode
          if (currentStoredCode && currentStoredCode === userCode) {
            logger.debug('useWeekNavigation: Loading historical analysis for user', { userCode });
            // Use a timeout to prevent immediate cascading effects
            const timeoutId = setTimeout(() => {
              // Final check before executing
              if (userCode && localStorage.getItem(STORAGE_KEYS.USER_CODE) === userCode) {
                refreshHistoricalAnalysis();
              }
            }, 150);
            return () => clearTimeout(timeoutId);
          } else {
            logger.debug('useWeekNavigation: Skipping load - logout in progress or userCode mismatch', {
              userCode,
              storedCode: currentStoredCode
            });
          }
        } catch (error) {
          logger.error('useWeekNavigation: Error checking auth state', { error });
        }
      };
      
      checkAuthAndLoad();
    } else {
      // Clear state when userCode is null (during logout)
      logger.debug('useWeekNavigation: Clearing analysis state for logout');
      setHistoricalAnalysis({
        hasHistoricalData: false,
        oldestHistoricalWeek: null,
        userType: 'new',
        adaptiveWeekLimit: 8,
        historicalWeeks: [],
        analysis: null
      });
      setIsLoadingAnalysis(false);
    }
  }, [userCode, selectedCharacterName, refreshHistoricalAnalysis]); // Add refreshHistoricalAnalysis to dependencies

  return {
    selectedWeekKey,
    isHistoricalWeek,
    handleWeekChange,
    historicalAnalysis,
    refreshHistoricalAnalysis,
    isLoadingAnalysis
  };
} 