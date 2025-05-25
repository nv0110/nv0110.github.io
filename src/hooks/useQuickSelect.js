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

    const newBosses = Object.entries(quickSelectBosses).map(([bossName, difficulty]) => ({
      name: bossName,
      difficulty,
      partySize: 1, // Default party size for quick select
    }));

    // Use the new batch function that handles cloud saving properly
    batchSetBosses(selectedCharIdx, newBosses);

    setQuickSelectBosses({});
    setQuickSelectError('');
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