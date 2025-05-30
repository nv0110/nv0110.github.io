import { useState, useEffect, useCallback } from 'react';
import { getCurrentWeekKey as getRealCurrentWeekKey } from '../utils/weekUtils';
import { getHistoricalWeekAnalysis } from '../../services/utilityService.js';

export function useWeekNavigation(userCode, appWeekKeyFromProps) {
  const [selectedWeekKey, setSelectedWeekKey] = useState(appWeekKeyFromProps || getRealCurrentWeekKey());
  const [historicalAnalysis, setHistoricalAnalysis] = useState({
    hasHistoricalData: false,
    oldestHistoricalWeek: null,
    userType: 'new',
    adaptiveWeekLimit: 8,
    historicalWeeks: [],
    analysis: null
  });

  useEffect(() => {
    if (appWeekKeyFromProps && appWeekKeyFromProps !== selectedWeekKey) {
      console.log(`useWeekNavigation: appWeekKeyFromProps (${appWeekKeyFromProps}) differs from selectedWeekKey (${selectedWeekKey}). Updating selectedWeekKey.`);
      setSelectedWeekKey(appWeekKeyFromProps);
    }
  }, [appWeekKeyFromProps]); // Removed selectedWeekKey to prevent circular updates

  const isHistoricalWeek = selectedWeekKey !== (appWeekKeyFromProps || getRealCurrentWeekKey());

  const refreshHistoricalAnalysis = useCallback(async () => {
    if (!userCode) return;
    const realCurrentWeek = getRealCurrentWeekKey();
    try {
      console.log(`🔄 Refreshing historical analysis (user: ${userCode}, relative to real week: ${realCurrentWeek})...`);
      const analysisResult = await getHistoricalWeekAnalysis(userCode, appWeekKeyFromProps || realCurrentWeek);
      
      if (analysisResult.success) {
        setHistoricalAnalysis({
          hasHistoricalData: analysisResult.hasHistoricalData,
          oldestHistoricalWeek: analysisResult.oldestHistoricalWeek,
          userType: analysisResult.userType,
          adaptiveWeekLimit: analysisResult.adaptiveWeekLimit,
          historicalWeeks: analysisResult.historicalWeeks,
          analysis: analysisResult.analysis
        });
        
        console.log('✅ Historical analysis refreshed:', {
          userType: analysisResult.userType,
          hasData: analysisResult.hasHistoricalData,
          oldestWeek: analysisResult.oldestHistoricalWeek,
          adaptiveLimit: analysisResult.adaptiveWeekLimit,
        });
      } else {
        console.error('Error in analysisResult:', analysisResult.error);
      }
    } catch (error) {
      console.error('Error refreshing historical analysis:', error);
    }
  }, [userCode, appWeekKeyFromProps]);

  const handleWeekChange = useCallback((newWeekKey) => {
    if (newWeekKey !== selectedWeekKey) {
      setSelectedWeekKey(newWeekKey);
    }
  }, [selectedWeekKey]);

  useEffect(() => {
    if (userCode) {
      // Use a timeout to prevent immediate cascading effects
      const timeoutId = setTimeout(() => {
        refreshHistoricalAnalysis();
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [userCode, appWeekKeyFromProps]); // Removed refreshHistoricalAnalysis from deps to prevent loops

  return {
    selectedWeekKey,
    isHistoricalWeek,
    handleWeekChange,
    historicalAnalysis,
    refreshHistoricalAnalysis
  };
} 