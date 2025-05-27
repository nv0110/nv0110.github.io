import { useState, useEffect, useMemo } from 'react';
import { getCurrentYearKey } from '../utils/weekUtils';
import { MONTH_NAMES } from '../constants';
import { getYearlyPitchedStats, purgePitchedRecords, clearCharacterPitchedUI, getPitchedResetAuditHistory, purgeAllStatsData } from '../pitched-data-service';

export function useStatsManagement(userCode, refreshPitchedItems) {
  // Stats modal state
  const [showStats, setShowStats] = useState(false);
  const [showStatsResetConfirm, setShowStatsResetConfirm] = useState(false);
  const [statsPanel, setStatsPanel] = useState({ monthly: [], yearly: [] });
  
  // Character purge state
  const [showCharacterPurgeConfirm, setShowCharacterPurgeConfirm] = useState(false);
  const [purgeTargetCharacter, setPurgeTargetCharacter] = useState(null);
  const [purgeInProgress, setPurgeInProgress] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [auditHistory, setAuditHistory] = useState([]);
  
  // Reset success state
  const [resetSuccessVisible, setResetSuccessVisible] = useState(false);
  
  // Cloud stats
  const [cloudPitchedStats, setCloudPitchedStats] = useState({});
  const [isLoadingCloudStats, setIsLoadingCloudStats] = useState(false);
  
  // Pitched modal state
  const [pitchedModalItem, setPitchedModalItem] = useState(null);
  const [showPitchedModal, setShowPitchedModal] = useState(false);
  
  // Historical modal state
  const [showHistoricalPitchedModal, setShowHistoricalPitchedModal] = useState(false);
  const [historicalPitchedData, setHistoricalPitchedData] = useState(null);

  // Year selection
  const allYears = useMemo(() => {
    const currentYear = getCurrentYearKey();
    const yearsSet = new Set([currentYear]);
    
    if (statsPanel?.yearly && Array.isArray(statsPanel.yearly)) {
      statsPanel.yearly.forEach(y => yearsSet.add(y.yearKey));
    }
    
    if (cloudPitchedStats) {
      Object.keys(cloudPitchedStats).forEach(year => yearsSet.add(year));
    }
    
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [statsPanel?.yearly, cloudPitchedStats]);
  
  const [selectedYear, setSelectedYear] = useState(() => getCurrentYearKey());
  
  useEffect(() => {
    if (allYears?.length > 0 && !allYears.includes(selectedYear)) {
      setSelectedYear(allYears[0]);
    }
  }, [allYears, selectedYear]);

  // Fetch cloud stats when viewing stats
  useEffect(() => {
    if (!showStats || !userCode) return;

    const fetchCloudStats = async () => {
      try {
        setIsLoadingCloudStats(true);
        const result = await getYearlyPitchedStats(userCode);
        if (result.success) {
          setCloudPitchedStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching cloud pitched stats:', error);
      } finally {
        setIsLoadingCloudStats(false);
      }
    };
    
    fetchCloudStats();
  }, [showStats, userCode]);

  // Yearly pitched summary
  const yearlyPitchedSummary = useMemo(() => {
    if (!selectedYear || !cloudPitchedStats) return [];

    const pitchedMap = new Map();
    const cloudData = cloudPitchedStats[selectedYear];
    
    if (cloudData?.items && Array.isArray(cloudData.items)) {
      cloudData.items.forEach(item => {
        if (!item?.item || !item?.image) return;
        
        const key = item.item + '|' + item.image;
        if (!pitchedMap.has(key)) {
          pitchedMap.set(key, { 
            name: item.item, 
            image: item.image, 
            count: 0, 
            history: [],
            source: 'cloud' 
          });
        }
        
        const entry = pitchedMap.get(key);
        entry.count += 1;
        
        if (item.date) {
          const date = new Date(item.date);
          const monthNum = date.getUTCMonth();
          const day = date.getUTCDate();
          entry.history.push({ 
            char: item.character, 
            date: `${MONTH_NAMES[monthNum]} ${day}`,
            cloud: true,
            fullDate: item.date
          });
        }
      });
    }
    
    const result = Array.from(pitchedMap.values());
    
    // Sort history by date
    result.forEach(item => {
      if (item.history?.length > 0) {
        item.history.sort((a, b) => {
          if (a.fullDate && b.fullDate) {
            return new Date(b.fullDate) - new Date(a.fullDate);
          }
          return 0;
        });
      }
    });
    
    return result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [selectedYear, cloudPitchedStats]);

  // Character purge handler
  const handleCharacterPurge = async (pitchedChecked, setPitchedChecked, weekKey, userInteractionRef, setError) => {
    if (!purgeTargetCharacter) return;
    
    try {
      setPurgeInProgress(true);
      const { name, idx } = purgeTargetCharacter;
      
      userInteractionRef.current = true;
      
      // Clear UI checkmarks first
      const updatedPitchedChecked = clearCharacterPitchedUI(pitchedChecked, name, idx, weekKey);
      setPitchedChecked(updatedPitchedChecked);
      
      // Purge from database
      const result = await purgePitchedRecords(userCode, name, idx);
      
      if (result.success) {
        // Clear cloud data and refresh
        setCloudPitchedStats({});
        await refreshPitchedItems(userCode);
        
        // Refresh cloud stats
        const statsResult = await getYearlyPitchedStats(userCode);
        if (statsResult.success) {
          setCloudPitchedStats(statsResult.data);
        }
        
        setPurgeSuccess(true);
        setShowCharacterPurgeConfirm(false);
        
        // Update audit history
        const auditResult = await getPitchedResetAuditHistory(userCode);
        if (auditResult.success) {
          setAuditHistory(auditResult.history);
        }
        
        setTimeout(() => {
          setPurgeSuccess(false);
        }, 3000);
        
      } else {
        setError('Failed to purge character data. Please try again.');
      }
      
    } catch (error) {
      console.error('Error in handleCharacterPurge:', error);
      setError('Failed to purge character data. Please try again.');
    } finally {
      setPurgeInProgress(false);
      setTimeout(() => {
        userInteractionRef.current = false;
      }, 1000);
    }
  };

  // Stats reset handler
  const handleStatsReset = async (setError) => {
    try {
      // Clear local UI state first
      setStatsPanel({ monthly: [], yearly: [] });
      setSelectedYear(getCurrentYearKey());
      
      // Perform cloud data deletion
      if (userCode) {
        const result = await purgeAllStatsData(userCode);
        
        if (result.success) {
          // Clear local cloud data states
          setCloudPitchedStats({});
          await refreshPitchedItems(userCode);
        } else {
          setError('Failed to reset stats data. Please try again.');
          return;
        }
      }
      
      setShowStatsResetConfirm(false);
      setResetSuccessVisible(true);
      
      setTimeout(() => {
        setResetSuccessVisible(false);
        setShowStats(false);
      }, 3400);
      
    } catch (error) {
      console.error('Error in stats reset:', error);
      setError('Failed to reset stats data. Please try again.');
    }
  };

  const closeResetSuccess = () => {
    setResetSuccessVisible(false);
    setShowStats(false);
  };

  const pitchedModalDetails = useMemo(() => {
    if (!pitchedModalItem) return [];
    return pitchedModalItem.history || [];
  }, [pitchedModalItem]);

  function startStatsTrackingIfNeeded() {
    console.log('Stats tracking is now cloud-based - no action needed');
  }

  return {
    // Stats modal
    showStats,
    setShowStats,
    showStatsResetConfirm,
    setShowStatsResetConfirm,
    statsPanel,
    setStatsPanel,
    
    // Character purge
    showCharacterPurgeConfirm,
    setShowCharacterPurgeConfirm,
    purgeTargetCharacter,
    setPurgeTargetCharacter,
    purgeInProgress,
    purgeSuccess,
    setPurgeSuccess,
    auditHistory,
    
    // Reset success
    resetSuccessVisible,
    closeResetSuccess,
    
    // Cloud stats
    cloudPitchedStats,
    setCloudPitchedStats,
    isLoadingCloudStats,
    
    // Pitched modal
    pitchedModalItem,
    setPitchedModalItem,
    showPitchedModal,
    setShowPitchedModal,
    pitchedModalDetails,
    
    // Historical modal
    showHistoricalPitchedModal,
    setShowHistoricalPitchedModal,
    historicalPitchedData,
    setHistoricalPitchedData,
    
    // Year selection
    allYears,
    selectedYear,
    setSelectedYear,
    yearlyPitchedSummary,
    
    // Handlers
    handleCharacterPurge,
    handleStatsReset,
    startStatsTrackingIfNeeded
  };
} 