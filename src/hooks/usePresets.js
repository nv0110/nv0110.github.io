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
  const createPreset = (selectedCharIdx, characters, batchSetBosses) => {
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
    const newBosses = preset.bosses.map(boss => ({ ...boss }));

    // Use the new batch function that handles cloud saving properly
    batchSetBosses(selectedCharIdx, newBosses);

    setPresetError('');
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