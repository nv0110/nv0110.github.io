import { useState } from 'react';
import { logger } from '../utils/logger';

export function useQuickSelect() {
  const [quickSelectBosses, setQuickSelectBosses] = useState({}); // Now stores {bossName: {difficulty, partySize}}
  const [lastQuickSelectBosses, setLastQuickSelectBosses] = useState({}); // Store last used selection for reuse
  const [quickSelectError, setQuickSelectError] = useState('');

  // Quick select boss
  const handleQuickSelectBoss = (bossName, difficulty, partySize = 1) => {
    const selectedCount = Object.keys(quickSelectBosses).length;
    
    if (quickSelectBosses[bossName]) {
      // If boss already selected, update difficulty or remove if same difficulty
      if (quickSelectBosses[bossName].difficulty === difficulty) {
        const newBosses = { ...quickSelectBosses };
        delete newBosses[bossName];
        setQuickSelectBosses(newBosses);
      } else {
        setQuickSelectBosses({
          ...quickSelectBosses,
          [bossName]: { difficulty, partySize: quickSelectBosses[bossName].partySize || partySize }
        });
      }
    } else {
      // Adding new boss
      if (selectedCount >= 14) {
        setQuickSelectError('Maximum 14 bosses can be selected');
        setTimeout(() => setQuickSelectError(''), 3000);
        return;
      }
      
      setQuickSelectBosses({
        ...quickSelectBosses,
        [bossName]: { difficulty, partySize }
      });
    }
    setQuickSelectError('');
  };

  // Update party size for a boss
  const updateQuickSelectPartySize = (bossName, partySize) => {
    if (quickSelectBosses[bossName]) {
      setQuickSelectBosses({
        ...quickSelectBosses,
        [bossName]: {
          ...quickSelectBosses[bossName],
          partySize
        }
      });
    }
  };

  // Reuse last quick select settings
  const reuseLastQuickSelect = () => {
    if (Object.keys(lastQuickSelectBosses).length === 0) {
      setQuickSelectError('No previous quick select settings to reuse');
      setTimeout(() => setQuickSelectError(''), 3000);
      return;
    }

    logger.info('QuickSelect: Reusing last quick select settings', { 
      bossCount: Object.keys(lastQuickSelectBosses).length,
      bosses: Object.keys(lastQuickSelectBosses)
    });

    setQuickSelectBosses({ ...lastQuickSelectBosses });
    setQuickSelectError('');
  };

  // Apply quick selection to character
  const applyQuickSelection = (selectedCharIdx, characters, batchSetBosses) => {
    if (selectedCharIdx === null || !characters[selectedCharIdx]) {
      setQuickSelectError('Please select a character first');
      setTimeout(() => setQuickSelectError(''), 3000);
      return;
    }

    // Store current selection as last used before applying
    if (Object.keys(quickSelectBosses).length > 0) {
      setLastQuickSelectBosses({ ...quickSelectBosses });
      logger.info('QuickSelect: Storing selection for reuse', { 
        bossCount: Object.keys(quickSelectBosses).length 
      });
    }

    // Create boss objects from quick select entries with proper party sizes
    let newBosses = Object.entries(quickSelectBosses).map(([bossName, bossData]) => ({
      name: bossName,
      difficulty: bossData.difficulty,
      partySize: bossData.partySize || 1,
    }));

    // Calculate current total crystal count across all characters (excluding the target character)
    const currentTotalCrystals = characters.reduce((sum, char, idx) => {
      if (idx === selectedCharIdx) return sum; // Skip the target character
      return sum + (char.bosses ? char.bosses.length : 0);
    }, 0);
    
    // Calculate how many crystals we can add to stay within the limit
    const availableCrystalSlots = 180 - currentTotalCrystals;
    
    // If applying all bosses would exceed the total crystal limit
    if (newBosses.length > availableCrystalSlots) {
      // Try to fetch boss data to get prices
      try {
        const bossDataModule = require('../data/bossData');
        const bossData = bossDataModule.bossData;
        
        // Add price info to bosses
        newBosses = newBosses.map(boss => ({
          ...boss,
          price: bossDataModule.getBossPrice(
            bossData.find(bd => bd.name === boss.name),
            boss.difficulty
          ) || 0
        }));
        
        // Sort by price (highest to lowest) to keep the most valuable bosses
        newBosses.sort((a, b) => (b.price || 0) - (a.price || 0));
      } catch (error) {
        logger.error('Error loading boss data for price sorting:', error);
        // If price info isn't available, keep the order as is
      }
      
      // Only keep the bosses that fit within the limit
      newBosses = newBosses.slice(0, availableCrystalSlots);
      
      // Show warning
      setQuickSelectError(`Selection trimmed to stay within 180 crystal limit. Added ${availableCrystalSlots} ${availableCrystalSlots === 1 ? 'boss' : 'bosses'}.`);
      setTimeout(() => setQuickSelectError(''), 5000);
    }

    // Use the batch function that handles cloud saving properly
    batchSetBosses(selectedCharIdx, newBosses);

    setQuickSelectBosses({});
    if (!newBosses.length) {
      setQuickSelectError('');
    }
  };

  // Reset quick selection
  const resetQuickSelection = () => {
    setQuickSelectBosses({});
    setQuickSelectError('');
  };

  return {
    quickSelectBosses,
    setQuickSelectBosses,
    lastQuickSelectBosses,
    quickSelectError,
    setQuickSelectError,
    handleQuickSelectBoss,
    updateQuickSelectPartySize,
    reuseLastQuickSelect,
    applyQuickSelection,
    resetQuickSelection
  };
} 