import { useState, useEffect, useMemo, useCallback } from 'react';
import { getCurrentYearKey } from '../utils/weekUtils';
import { MONTH_NAMES } from '../constants';
import { getYearlyPitchedStats } from '../services/pitchedItemsService.js';
import { purgePitchedRecords, clearCharacterPitchedUI, getPitchedResetAuditHistory, purgeAllStatsData } from '../services/utilityService.js';
import { getBossPitchedItems } from '../services/bossRegistryService.js';
import { logger } from '../utils/logger.js';

// Helper function to get item image
const getItemImage = (itemName) => {
  const allBossNames = [
    'Lotus', 'Damien', 'Lucid', 'Will', 'Gloom', 'Darknell', 
    'Verus Hilla', 'Chosen Seren', 'Watcher Kalos', 'Kaling', 'Limbo'
  ];
  
  for (const bossName of allBossNames) {
    const bossItems = getBossPitchedItems(bossName);
    const itemObj = bossItems.find(bossItem => bossItem.name === itemName);
    if (itemObj) {
      return itemObj.image;
    }
  }
  
  return '/items/crystal.png'; // fallback
};

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
  const [showCharacterPitchedModal, setShowCharacterPitchedModal] = useState(false);
  
  // Item detail modal state
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  
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
    // Enhanced guard: Only fetch if stats are shown, we have userCode, and we're not in logout
    if (!showStats || !userCode) return;

    const fetchCloudStats = async () => {
      // Additional check to ensure we're not in a logout transition
      try {
        const { STORAGE_KEYS } = await import('../constants');
        const currentStoredCode = localStorage.getItem(STORAGE_KEYS.USER_CODE);
        
        if (!currentStoredCode || currentStoredCode !== userCode) {
          logger.debug('useStatsManagement: Skipping cloud stats fetch - logout in progress', {
            userCode,
            storedCode: currentStoredCode
          });
          return;
        }
      } catch (error) {
        console.error('useStatsManagement: Error checking auth state for stats fetch', { error });
        return;
      }
      
      try {
        setIsLoadingCloudStats(true);
        // Convert selectedYear to number to ensure type consistency
        const yearAsNumber = parseInt(selectedYear, 10);
        const result = await getYearlyPitchedStats(userCode, yearAsNumber);
        
        // Final check before processing result
        const { STORAGE_KEYS: STORAGE_KEYS_FINAL } = await import('../constants');
        const finalStoredCode = localStorage.getItem(STORAGE_KEYS_FINAL.USER_CODE);
        if (!finalStoredCode || finalStoredCode !== userCode) {
          logger.debug('useStatsManagement: Skipping result processing - logout occurred during fetch');
          return;
        }
        
        if (result.success) {
          setCloudPitchedStats(prev => ({
            ...prev,
            [selectedYear]: result.stats
          }));
        }
      } catch (error) {
        console.error('Error fetching cloud pitched stats:', error);
      } finally {
        // Only update loading state if we're still in valid auth state
        const { STORAGE_KEYS: STORAGE_KEYS_FINALLY } = await import('../constants');
        const finalStoredCode = localStorage.getItem(STORAGE_KEYS_FINALLY.USER_CODE);
        if (finalStoredCode && finalStoredCode === userCode) {
          setIsLoadingCloudStats(false);
        }
      }
    };
    
    fetchCloudStats();
  }, [showStats, userCode, selectedYear]);

  // Yearly pitched summary - groups items by type with counts and detailed history
  const groupedYearlyPitchedItems = useMemo(() => {
    if (!selectedYear || !cloudPitchedStats) return [];

    const cloudData = cloudPitchedStats[selectedYear];
    
    if (!cloudData?.items || !Array.isArray(cloudData.items)) return [];

    // Group items by item name
    const itemGroups = new Map();
    
    cloudData.items
      .filter(item => item?.item && item?.charId && item?.date)
      .forEach(item => {
        const itemName = item.item;
        
        if (!itemGroups.has(itemName)) {
          itemGroups.set(itemName, {
            itemName,
            itemImage: getItemImage(itemName),
            count: 0,
            instances: []
          });
        }
        
        const group = itemGroups.get(itemName);
        group.count += 1;
        
        // Create detailed instance
        const date = new Date(item.date);
        const monthName = MONTH_NAMES[date.getUTCMonth()];
        const day = date.getUTCDate();
        
        group.instances.push({
          charId: item.charId,
          fullDate: item.date,
          displayDate: `${monthName} ${day}`,
          sortDate: date.getTime()
        });
      });

    // Convert to array and sort by count (most obtained first), then by name
    const result = Array.from(itemGroups.values())
      .map(group => ({
        ...group,
        instances: group.instances.sort((a, b) => b.sortDate - a.sortDate) // Most recent first
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count; // Higher count first
        return a.itemName.localeCompare(b.itemName); // Alphabetical for same count
      });

    return result;
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
          const currentYear = getCurrentYearKey();
          setCloudPitchedStats({ [currentYear]: statsResult.stats });
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
    logger.silence('Stats tracking is now cloud-based - no action needed');
  }

  // Handle historical pitched item confirmation
  const handleHistoricalPitchedConfirm = async (date, characterName) => {
    try {
      if (!historicalPitchedData) {
        throw new Error('No historical pitched data available');
      }

      const { itemName, bossName, weekKey } = historicalPitchedData;
      
      logger.userAction('Adding historical pitched item', `${itemName} for ${bossName} by ${characterName}`);
      
      // Import the pitched items service
      const { addPitchedItem } = await import('../services/pitchedItemsService.js');
      
      // Create the pitched item data (now includes boss name)
      const pitchedItemData = {
        charId: characterName,
        bossName: bossName,
        item: itemName,
        date: date.split('T')[0] // Extract just the YYYY-MM-DD part
      };

      // Add the historical pitched item to the database
      const result = await addPitchedItem(userCode, pitchedItemData);
      
      if (result.success) {
        logger.silence('Historical pitched item added successfully');
        
        // Close the modal
        setShowHistoricalPitchedModal(false);
        setHistoricalPitchedData(null);
        
        // Refresh the pitched items to reflect the new data
        if (refreshPitchedItems) {
          await refreshPitchedItems();
        }
        
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to add historical pitched item');
      }
      
    } catch (error) {
      logger.error('Error handling historical pitched confirmation:', error);
      throw error;
    }
  };

  // Handle historical pitched item removal
  const handleHistoricalPitchedRemove = async (characterName, bossName, itemName, weekKey = null) => {
    try {
      // If weekKey is not provided, try to get it from historicalPitchedData (modal context)
      let targetWeekKey = weekKey;
      let targetBossName = bossName;
      
      if (!targetWeekKey && historicalPitchedData) {
        targetWeekKey = historicalPitchedData.weekKey;
        // Use boss name from parameters if available, otherwise from modal data
        if (!targetBossName) {
          targetBossName = historicalPitchedData.bossName;
        }
      }
      
      if (!targetWeekKey) {
        throw new Error('Week key not available for historical pitched item removal');
      }
      
      if (!targetBossName) {
        throw new Error('Boss name not available for historical pitched item removal');
      }
      
      logger.userAction('Removing historical pitched item', `${itemName} from ${targetBossName} by ${characterName}`);
      
      // Import the pitched items service
      const { removePitchedItem } = await import('../services/pitchedItemsService.js');
      
      // Remove the historical pitched item from the database
      // The service now expects (userId, charId, bossName, item, date)
      // Since we don't have the exact date, we'll pass null to remove the most recent entry
      const result = await removePitchedItem(userCode, characterName, targetBossName, itemName, null);
      
      if (result.success) {
        logger.silence('Historical pitched item removed successfully');
        
        // Only close modal if we're in modal context (historicalPitchedData exists)
        if (historicalPitchedData) {
          setShowHistoricalPitchedModal(false);
          setHistoricalPitchedData(null);
        }
        
        // Refresh the pitched items to reflect the change
        if (refreshPitchedItems) {
          await refreshPitchedItems();
        }
        
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to remove historical pitched item');
      }
      
    } catch (error) {
      logger.error('Error handling historical pitched removal:', error);
      throw error;
    }
  };

  // Handler for opening item detail modal
  const handleItemDetailClick = (itemGroup) => {
    setSelectedItemDetail(itemGroup);
    setShowItemDetailModal(true);
  };

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
    showCharacterPitchedModal,
    setShowCharacterPitchedModal,
    pitchedModalDetails,
    
    // Item detail modal
    showItemDetailModal,
    setShowItemDetailModal,
    selectedItemDetail,
    setSelectedItemDetail,
    
    // Historical modal
    showHistoricalPitchedModal,
    setShowHistoricalPitchedModal,
    historicalPitchedData,
    setHistoricalPitchedData,
    
    // Year selection
    allYears,
    selectedYear,
    setSelectedYear,
    groupedYearlyPitchedItems,
    
    // Handlers
    handleCharacterPurge,
    handleStatsReset,
    startStatsTrackingIfNeeded,
    handleHistoricalPitchedConfirm,
    handleHistoricalPitchedRemove,
    handleItemDetailClick
  };
} 
