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
    if (!userCode || isLoadingAnalysis) return;
    
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
        setTimeout(() => {
          refreshHistoricalAnalysis();
        }, 100);
      }
    }
  }, [selectedWeekKey, userCode, refreshHistoricalAnalysis]);

  // Load historical analysis when userCode changes or on mount
  useEffect(() => {
    if (userCode) {
      // Use a timeout to prevent immediate cascading effects
      const timeoutId = setTimeout(() => {
        refreshHistoricalAnalysis();
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [userCode, selectedCharacterName]); // Also depend on selectedCharacterName

  return {
    selectedWeekKey,
    isHistoricalWeek,
    handleWeekChange,
    historicalAnalysis,
    refreshHistoricalAnalysis,
    isLoadingAnalysis
  };
} 