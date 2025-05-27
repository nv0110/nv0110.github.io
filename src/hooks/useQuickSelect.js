import { useState } from 'react';

export function useQuickSelect() {
  const [quickSelectBosses, setQuickSelectBosses] = useState({});
  const [quickSelectError, setQuickSelectError] = useState('');

  // Quick select boss
  const handleQuickSelectBoss = (bossName, difficulty) => {
    const selectedCount = Object.keys(quickSelectBosses).length;
    
    if (quickSelectBosses[bossName]) {
      // If boss already selected, update difficulty or remove if same difficulty
      if (quickSelectBosses[bossName] === difficulty) {
        const newBosses = { ...quickSelectBosses };
        delete newBosses[bossName];
        setQuickSelectBosses(newBosses);
      } else {
        setQuickSelectBosses({
          ...quickSelectBosses,
          [bossName]: difficulty
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
        [bossName]: difficulty
      });
    }
    setQuickSelectError('');
  };

  // Apply quick selection to character
  const applyQuickSelection = (selectedCharIdx, characters, batchSetBosses) => {
    if (selectedCharIdx === null || !characters[selectedCharIdx]) {
      setQuickSelectError('Please select a character first');
      setTimeout(() => setQuickSelectError(''), 3000);
      return;
    }

    // Create boss objects from quick select entries
    let newBosses = Object.entries(quickSelectBosses).map(([bossName, difficulty]) => ({
      name: bossName,
      difficulty,
      partySize: 1, // Default party size for quick select
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
        console.error('Error loading boss data for price sorting:', error);
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
    quickSelectError,
    setQuickSelectError,
    handleQuickSelectBoss,
    applyQuickSelection,
    resetQuickSelection
  };
} 