import { useState, useEffect, useCallback } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getAvailableWeeks, getHistoricalWeekAnalysis } from '../pitched-data-service';

export function useWeekNavigation(userCode) {
  const currentWeekKey = getCurrentWeekKey();
  const [selectedWeekKey, setSelectedWeekKey] = useState(currentWeekKey);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [weekDataCache, setWeekDataCache] = useState({});
  // New state for sophisticated navigation
  const [historicalAnalysis, setHistoricalAnalysis] = useState({
    hasHistoricalData: false,
    oldestHistoricalWeek: null,
    userType: 'new',
    adaptiveWeekLimit: 8,
    historicalWeeks: []
  });

  const isHistoricalWeek = selectedWeekKey !== currentWeekKey;

  // Function to refresh historical analysis - can be called when pitched items change
  const refreshHistoricalAnalysis = useCallback(async () => {
    if (!userCode) return;
    
    try {
      console.log('🔄 Refreshing historical analysis...');
      const analysisResult = await getHistoricalWeekAnalysis(userCode);
      
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
          adaptiveLimit: analysisResult.adaptiveWeekLimit
        });
      }
    } catch (error) {
      console.error('Error refreshing historical analysis:', error);
    }
  }, [userCode, setHistoricalAnalysis]);

  // Simplified week change handler
  const handleWeekChange = useCallback((newWeekKey) => {
    if (newWeekKey === selectedWeekKey) return;
    setSelectedWeekKey(newWeekKey);
  }, [selectedWeekKey]);

  // Fetch available weeks and historical analysis
  useEffect(() => {
    const fetchWeekData = async () => {
      if (!userCode) return;
      
      try {
        // Fetch both available weeks and historical analysis
        const [availableResult, analysisResult] = await Promise.all([
          getAvailableWeeks(userCode),
          getHistoricalWeekAnalysis(userCode)
        ]);
        
        if (availableResult.success) {
          setAvailableWeeks(availableResult.weeks);
        }
        
        if (analysisResult.success) {
          setHistoricalAnalysis({
            hasHistoricalData: analysisResult.hasHistoricalData,
            oldestHistoricalWeek: analysisResult.oldestHistoricalWeek,
            userType: analysisResult.userType,
            adaptiveWeekLimit: analysisResult.adaptiveWeekLimit,
            historicalWeeks: analysisResult.historicalWeeks,
            analysis: analysisResult.analysis
          });
          
          console.log('📊 Week navigation updated with historical analysis:', {
            userType: analysisResult.userType,
            hasData: analysisResult.hasHistoricalData,
            oldestWeek: analysisResult.oldestHistoricalWeek,
            adaptiveLimit: analysisResult.adaptiveWeekLimit
          });
        }
      } catch (error) {
        console.error('Error fetching week navigation data:', error);
      }
    };
    
    fetchWeekData();
  }, [userCode]);

  return {
    selectedWeekKey,
    availableWeeks,
    weekDataCache,
    setWeekDataCache,
    isHistoricalWeek,
    handleWeekChange,
    // New sophisticated navigation data
    historicalAnalysis,
    // Function to refresh historical analysis when data changes
    refreshHistoricalAnalysis
  };
} 