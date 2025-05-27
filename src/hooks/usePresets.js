import { useState } from 'react';

export function usePresets() {
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem('boss-presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [newPresetName, setNewPresetName] = useState('');
  const [presetError, setPresetError] = useState('');
  const [presetCreationMode, setPresetCreationMode] = useState(false); // false = from character, true = manual selection
  const [presetBosses, setPresetBosses] = useState({}); // For manual preset creation

  // Save presets to localStorage
  const savePresets = (newPresets) => {
    setPresets(newPresets);
    localStorage.setItem('boss-presets', JSON.stringify(newPresets));
  };

  // Create preset from current character
  const createPreset = (selectedCharIdx, characters) => {
    if (!newPresetName.trim()) {
      setPresetError('Please enter a preset name');
      return;
    }

    if (presets.some(p => p.name.toLowerCase() === newPresetName.toLowerCase())) {
      setPresetError('A preset with this name already exists');
      return;
    }

    let bossesToSave = [];

    if (presetCreationMode) {
      // Manual creation mode - use selected bosses
      if (Object.keys(presetBosses).length === 0) {
        setPresetError('Please select at least one boss');
        return;
      }
      
      bossesToSave = Object.entries(presetBosses).map(([bossName, difficulty]) => ({
        name: bossName,
        difficulty,
        partySize: 1, // Default party size
        price: 0 // Will be calculated when applied
      }));
    } else {
      // From character mode - use current character's bosses
      if (selectedCharIdx === null || !characters[selectedCharIdx]) {
        setPresetError('Please select a character first');
        return;
      }

      const currentChar = characters[selectedCharIdx];
      if (!currentChar.bosses || currentChar.bosses.length === 0) {
        setPresetError('Selected character has no bosses configured');
        return;
      }

      bossesToSave = [...currentChar.bosses];
    }

    const newPreset = {
      id: Date.now(),
      name: newPresetName.trim(),
      bosses: bossesToSave,
      createdAt: new Date().toISOString()
    };

    savePresets([...presets, newPreset]);
    setNewPresetName('');
    setPresetError('');
    setPresetBosses({});
    setPresetCreationMode(false);
  };

  // Apply preset to character
  const applyPreset = (preset, selectedCharIdx, characters, batchSetBosses) => {
    if (selectedCharIdx === null || !characters[selectedCharIdx]) {
      setPresetError('Please select a character first');
      setTimeout(() => setPresetError(''), 3000);
      return;
    }

    // Create a copy of the preset bosses to avoid reference issues
    let newBosses = preset.bosses.map(boss => ({ ...boss }));

    // Calculate current total crystal count across all characters (excluding the target character)
    const currentTotalCrystals = characters.reduce((sum, char, idx) => {
      if (idx === selectedCharIdx) return sum; // Skip the target character
      return sum + (char.bosses ? char.bosses.length : 0);
    }, 0);
  
    // Calculate how many crystals we can add to stay within the limit
    const availableCrystalSlots = 180 - currentTotalCrystals;
  
    // If applying all bosses would exceed the total crystal limit
    if (newBosses.length > availableCrystalSlots) {
      // Sort by price (highest to lowest) to keep the most valuable bosses
      newBosses.sort((a, b) => {
        // Add fallback values for missing price
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        return priceB - priceA;
      });
      
      // Only keep the bosses that fit within the limit
      newBosses = newBosses.slice(0, availableCrystalSlots);
      
      // Show warning
      setPresetError(`Preset trimmed to stay within 180 crystal limit. Added ${availableCrystalSlots} highest-value bosses.`);
      setTimeout(() => setPresetError(''), 5000);
    } else {
      setPresetError('');
    }

    // Use the batch function that handles cloud saving properly
    batchSetBosses(selectedCharIdx, newBosses);
  };

  // Delete preset
  const deletePreset = (presetId) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    savePresets(updatedPresets);
  };

  // Handle preset boss selection (similar to quick select)
  const handlePresetBossSelect = (bossName, difficulty) => {
    if (presetBosses[bossName]) {
      // If boss already selected, update difficulty or remove if same difficulty
      if (presetBosses[bossName] === difficulty) {
        const newBosses = { ...presetBosses };
        delete newBosses[bossName];
        setPresetBosses(newBosses);
      } else {
        setPresetBosses({
          ...presetBosses,
          [bossName]: difficulty
        });
      }
    } else {
      // Adding new boss
      setPresetBosses({
        ...presetBosses,
        [bossName]: difficulty
      });
    }
    setPresetError('');
  };

  return {
    presets,
    newPresetName,
    setNewPresetName,
    presetError,
    setPresetError,
    presetCreationMode,
    setPresetCreationMode,
    presetBosses,
    setPresetBosses,
    createPreset,
    applyPreset,
    deletePreset,
    handlePresetBossSelect
  };
} 