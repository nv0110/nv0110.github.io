import { useState, useEffect, useCallback } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getAvailableWeeks, getWeekData, getHistoricalWeekAnalysis } from '../pitched-data-service';

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
  }, [userCode]);

  // Week change handler - now takes optional parameters for caching
  const handleWeekChange = async (newWeekKey, checked = {}, cloudPitchedItems = [], pitchedChecked = {}) => {
    if (newWeekKey === selectedWeekKey) return;
    
    console.log(`Navigating from week ${selectedWeekKey} to ${newWeekKey}`);
    
    // Cache current week data before switching if data is provided
    if (selectedWeekKey && !weekDataCache[selectedWeekKey] && (Object.keys(checked).length > 0 || cloudPitchedItems.length > 0)) {
      setWeekDataCache(prev => ({
        ...prev,
        [selectedWeekKey]: {
          checkedState: checked,
          pitchedItems: cloudPitchedItems,
          pitchedChecked: pitchedChecked,
          hasData: Object.keys(checked).length > 0 || cloudPitchedItems.length > 0
        }
      }));
    }
    
    setSelectedWeekKey(newWeekKey);
  };

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