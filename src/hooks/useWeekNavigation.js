import { useState, useEffect } from 'react';
import { getCurrentWeekKey } from '../utils/weekUtils';
import { getAvailableWeeks, getWeekData } from '../pitched-data-service';

export function useWeekNavigation(userCode) {
  const currentWeekKey = getCurrentWeekKey();
  const [selectedWeekKey, setSelectedWeekKey] = useState(currentWeekKey);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [weekDataCache, setWeekDataCache] = useState({});
  const [readOnlyOverride, setReadOnlyOverride] = useState(false);

  const isHistoricalWeek = selectedWeekKey !== currentWeekKey;
  const isReadOnlyMode = isHistoricalWeek && !readOnlyOverride;

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
    
    setReadOnlyOverride(false);
    setSelectedWeekKey(newWeekKey);
  };

  // Fetch available weeks
  useEffect(() => {
    const fetchAvailableWeeks = async () => {
      if (!userCode) return;
      
      try {
        const result = await getAvailableWeeks(userCode);
        if (result.success) {
          setAvailableWeeks(result.weeks);
        }
      } catch (error) {
        console.error('Error fetching available weeks:', error);
      }
    };
    
    fetchAvailableWeeks();
  }, [userCode]);

  return {
    selectedWeekKey,
    availableWeeks,
    weekDataCache,
    setWeekDataCache,
    isHistoricalWeek,
    isReadOnlyMode,
    readOnlyOverride,
    setReadOnlyOverride,
    handleWeekChange
  };
} 