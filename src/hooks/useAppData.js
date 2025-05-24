import { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLocalStorage, useLocalStorageString } from './useLocalStorage';
import { useBossCalculations } from './useBossCalculations';
import { bossData, getBossPrice } from '../data/bossData';
import { LIMITS, STORAGE_KEYS, PAGES, COOLDOWNS, ANIMATION_DURATIONS } from '../constants';
import { getCurrentWeekKey } from '../utils/weekUtils';

// Helper function to extract characters from the new data structure
function extractCharactersFromData(userData) {
  const characters = [];
  const characterSet = new Set();
  const characterBosses = {}; // Track bosses for each character
  
  console.log('🔍 Extracting characters from data structure...');
  
  // Method 1: From boss_runs data (most reliable and up-to-date)
  if (userData.boss_runs && Array.isArray(userData.boss_runs)) {
    userData.boss_runs.forEach(run => {
      if (run.character && typeof run.characterIdx === 'number') {
        const key = `${run.character}-${run.characterIdx}`;
        if (!characterSet.has(key)) {
          characterSet.add(key);
          characters.push({
            name: run.character,
            index: run.characterIdx,
            bosses: []
          });
          console.log(`✅ Found character from boss_runs: ${run.character} (index: ${run.characterIdx})`);
        }
        
        // Extract boss information from boss runs
        if (!characterBosses[key]) {
          characterBosses[key] = new Set();
        }
        
        if (run.boss && run.difficulty) {
          const bossId = `${run.boss}-${run.difficulty}`;
          if (!characterBosses[key].has(bossId)) {
            characterBosses[key].add(bossId);
            console.log(`📋 Found boss from boss_runs for ${run.character}: ${run.boss} (${run.difficulty})`);
          }
        }
      }
    });
  }
  
  // Method 2: From checked state (fallback for legacy data)
  if (userData.checked && typeof userData.checked === 'object') {
    Object.keys(userData.checked).forEach(charKey => {
      // Extract character name from "CharacterName-Index" format
      const parts = charKey.split('-');
      if (parts.length >= 2) {
        const characterName = parts.slice(0, -1).join('-'); // Handle names with dashes
        const characterIndex = parseInt(parts[parts.length - 1]);
        
        if (!isNaN(characterIndex) && characterName) {
          const key = `${characterName}-${characterIndex}`;
          if (!characterSet.has(key)) {
            characterSet.add(key);
            characters.push({
              name: characterName,
              index: characterIndex,
              bosses: []
            });
            console.log(`✅ Found character from checked (legacy): ${characterName} (index: ${characterIndex})`);
          }
          
          // Extract boss information from checked state
          if (!characterBosses[key]) {
            characterBosses[key] = new Set();
          }
          
          Object.keys(userData.checked[charKey] || {}).forEach(bossKey => {
            // Parse boss key format: "BossName-Difficulty"
            const bossparts = bossKey.split('-');
            if (bossparts.length >= 2) {
              const difficulty = bossparts[bossparts.length - 1];
              const bossName = bossparts.slice(0, -1).join('-');
              const bossId = `${bossName}-${difficulty}`;
              
              if (!characterBosses[key].has(bossId)) {
                characterBosses[key].add(bossId);
                console.log(`📋 Found boss from checked for ${characterName}: ${bossName} (${difficulty})`);
              }
            }
          });
        }
      }
    });
  }
  
  // Method 3: From weeklyBossClearHistory (additional fallback)
  if (userData.weeklyBossClearHistory && typeof userData.weeklyBossClearHistory === 'object') {
    Object.values(userData.weeklyBossClearHistory).forEach(weekData => {
      if (weekData.bossClearStatus && typeof weekData.bossClearStatus === 'object') {
        Object.keys(weekData.bossClearStatus).forEach(charKey => {
          const parts = charKey.split('-');
          if (parts.length >= 2) {
            const characterName = parts.slice(0, -1).join('-');
            const characterIndex = parseInt(parts[parts.length - 1]);
            
            if (!isNaN(characterIndex) && characterName) {
              const key = `${characterName}-${characterIndex}`;
              if (!characterSet.has(key)) {
                characterSet.add(key);
                characters.push({
                  name: characterName,
                  index: characterIndex,
                  bosses: []
                });
                console.log(`✅ Found character from weeklyBossClearHistory: ${characterName} (index: ${characterIndex})`);
              }
              
              // Extract boss information from weekly boss clear history
              if (!characterBosses[key]) {
                characterBosses[key] = new Set();
              }
              
              Object.keys(weekData.bossClearStatus[charKey] || {}).forEach(bossKey => {
                const bossparts = bossKey.split('-');
                if (bossparts.length >= 2) {
                  const difficulty = bossparts[bossparts.length - 1];
                  const bossName = bossparts.slice(0, -1).join('-');
                  const bossId = `${bossName}-${difficulty}`;
                  
                  if (!characterBosses[key].has(bossId)) {
                    characterBosses[key].add(bossId);
                    console.log(`📋 Found boss from history for ${characterName}: ${bossName} (${difficulty})`);
                  }
                }
              });
            }
          }
        });
      }
    });
  }
  
  // Populate bosses array for each character
  characters.forEach(char => {
    const key = `${char.name}-${char.index}`;
    const bosses = characterBosses[key];
    
    if (bosses && bosses.size > 0) {
      char.bosses = Array.from(bosses).map(bossId => {
        const parts = bossId.split('-');
        const difficulty = parts[parts.length - 1];
        const name = parts.slice(0, -1).join('-');
        
        return {
          name,
          difficulty,
          partySize: 1, // Default party size
          price: 0 // Will be calculated later
        };
      });
      
      console.log(`🎯 Populated ${char.bosses.length} bosses for ${char.name}:`, char.bosses.map(b => `${b.name}-${b.difficulty}`));
    }
  });
  
  // Sort characters by index to maintain consistent order
  characters.sort((a, b) => a.index - b.index);
  
  console.log(`🎯 Extracted ${characters.length} characters with bosses:`, characters.map(c => `${c.name}-${c.index} (${c.bosses.length} bosses)`));
  return characters;
}

export function useAppData() {
  const { userCode, isLoggedIn } = useAuth();

  // Core state
  const [characters, setCharacters] = useState([]);
  const [newCharName, setNewCharName] = useState('');
  const [selectedCharIdx, setSelectedCharIdx] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState({});
  
  // Utility states
  const [cloneError, setCloneError] = useState('');
  const [showUndo, setShowUndo] = useState(false);
  const [undoData, setUndoData] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const undoTimeout = useRef(null);

  // Use boss calculations hook
  const {
    charTotal,
    overallTotal,
    sortedBossData,
    totalBossCount,
    getAvailablePartySizes,
    getBossDifficulties,
  } = useBossCalculations(characters, bossData);

  // Data loading effect
  useEffect(() => {
    if (!userCode || !isLoggedIn) {
      setCharacters([]);
      setChecked({});
      setError('');
      return;
    }

    const loadData = async () => {
      try {
        setError('');
        console.log('Loading data for user:', userCode);
        
        const { supabase } = await import('../supabaseClient');
        const { data, error } = await supabase
          .from('user_data')
          .select('data')
          .eq('id', userCode)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('No existing data found for user, starting fresh');
            setCharacters([]);
            setChecked({});
            return;
          }
          throw error;
        }

        if (data && data.data) {
          const userData = data.data;
          console.log('📊 Raw user data:', userData);
          console.log('📊 Characters found:', userData.characters);
          console.log('📊 Boss runs found:', userData.boss_runs?.length || 0);
          
          // Load characters - handle both old and new data formats
          if (userData.characters && Array.isArray(userData.characters)) {
            // Old format - direct characters array
            setCharacters(userData.characters);
            console.log('✅ Loaded characters (old format):', userData.characters.length, userData.characters);
          } else {
            // New format - extract characters from data structures
            const extractedCharacters = extractCharactersFromData(userData);
            setCharacters(extractedCharacters);
            console.log('✅ Loaded characters (new format):', extractedCharacters.length, extractedCharacters);
          }
          
          // Reconstruct checked state from boss_runs (single source of truth)
          const reconstructedChecked = {};
          if (userData.boss_runs && Array.isArray(userData.boss_runs)) {
            userData.boss_runs.forEach(run => {
              if (run.cleared) {
                const charKey = `${run.character}-${run.characterIdx || 0}`;
                const bossKey = `${run.boss}-${run.difficulty}`;
                
                if (!reconstructedChecked[charKey]) {
                  reconstructedChecked[charKey] = {};
                }
                reconstructedChecked[charKey][bossKey] = true;
              }
            });
            console.log('✅ Reconstructed checked state from boss_runs:', Object.keys(reconstructedChecked).length, 'characters');
          }
          
          // Fallback to legacy checked state if no boss_runs data
          if (Object.keys(reconstructedChecked).length === 0 && userData.checked && typeof userData.checked === 'object') {
            setChecked(userData.checked);
            console.log('✅ Loaded legacy checked state:', Object.keys(userData.checked).length, 'entries');
          } else {
            setChecked(reconstructedChecked);
            console.log('✅ Using reconstructed checked state from boss_runs');
          }
        } else {
          console.log('No data found, starting fresh');
          setCharacters([]);
          setChecked({});
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data. Please try refreshing the page.');
      }
    };

    loadData();
  }, [userCode, isLoggedIn]);

  // Save data to cloud
  const saveToCloud = async (updatedData) => {
    if (!userCode || !isLoggedIn) return;
    
    try {
      const { supabase } = await import('../supabaseClient');
      const { error } = await supabase
        .from('user_data')
        .update({ 
          data: {
            ...updatedData,
            lastUpdated: new Date().toISOString()
          }
        })
        .eq('id', userCode);
        
      if (error) throw error;
      console.log('Data saved to cloud successfully');
    } catch (error) {
      console.error('Error saving to cloud:', error);
    }
  };

  // Character management functions
  const handleCharacterChange = (e) => {
    setIsLoading(true);
    setSelectedCharIdx(e.target.value ? parseInt(e.target.value) : null);
    setTimeout(() => setIsLoading(false), 300);
  };

  const addCharacter = async () => {
    if (!newCharName.trim() || characters.length >= LIMITS.CHARACTER_CAP) return;
    
    // Create new character with index
    const newIndex = characters.length > 0 ? Math.max(...characters.map(c => c.index || 0)) + 1 : 0;
    const newChar = { 
      name: newCharName.trim(), 
      index: newIndex,
      bosses: [] 
    };
    const newCharacters = [...characters, newChar];
    
    setCharacters(newCharacters);
    setNewCharName('');
    
    // Save to cloud (characters only, checked state reconstructed from boss_runs)
    const updatedData = {
      characters: newCharacters
    };
    await saveToCloud(updatedData);
  };

  const removeCharacter = async (idx) => {
    if (idx < 0 || idx >= characters.length) return;
    
    const characterToRemove = characters[idx];
    
    // Store undo data
    setUndoData({
      character: characterToRemove,
      index: idx,
      timestamp: Date.now()
    });
    
    setShowUndo(true);
    
    // Clear existing timeout
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current);
    }
    
    // Auto-hide undo after 10 seconds
    undoTimeout.current = setTimeout(() => {
      setShowUndo(false);
      setUndoData(null);
    }, 10000);
    
    const newCharacters = characters.filter((_, i) => i !== idx);
    setCharacters(newCharacters);
    
    // Adjust selectedCharIdx
    if (selectedCharIdx === idx) {
      setSelectedCharIdx(newCharacters.length > 0 ? Math.max(0, idx - 1) : null);
    } else if (selectedCharIdx > idx) {
      setSelectedCharIdx(selectedCharIdx - 1);
    }
    
    // Save to cloud (characters only, checked state reconstructed from boss_runs)
    const updatedData = {
      characters: newCharacters
    };
    await saveToCloud(updatedData);
  };

  const handleUndo = () => {
    if (!undoData) return;
    
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current);
    }
    
    const newCharacters = [...characters];
    newCharacters.splice(undoData.index, 0, undoData.character);
    setCharacters(newCharacters);
    
    if (selectedCharIdx === null || selectedCharIdx >= undoData.index) {
      setSelectedCharIdx(undoData.index);
    }
    
    setShowUndo(false);
    setUndoData(null);
  };

  const updateCharacterName = async (idx, newName) => {
    const newCharacters = characters.map((char, i) => 
      i === idx ? { ...char, name: newName } : char
    );
    setCharacters(newCharacters);
    
    // Save to cloud (characters only, checked state reconstructed from boss_runs)
    const updatedData = {
      characters: newCharacters
    };
    await saveToCloud(updatedData);
  };

  // Boss management functions
  const toggleBoss = (charIdx, bossName, difficulty) => {
    const newCharacters = characters.map((char, idx) => {
      if (idx !== charIdx) return char;
      
      if (!difficulty) {
        // Remove boss entirely when difficulty is empty/falsy
        const existingBoss = char.bosses.find(b => b.name === bossName);
        if (existingBoss) {
          return { ...char, bosses: char.bosses.filter(b => b.name !== bossName) };
        }
        return char;
      }

      // Check if boss already exists
      if (char.bosses.find(b => b.name === bossName)) {
        // Update existing boss with new difficulty
        return {
          ...char,
          bosses: char.bosses.map(b => 
            b.name === bossName 
              ? { 
                  ...b, 
                  difficulty,
                  price: getBossPrice(bossData.find(bd => bd.name === bossName), difficulty),
                  partySize: getAvailablePartySizes(bossName, difficulty)[0] || 1
                } 
              : b
          )
        };
      }

      // Add new boss if under limit
      if (char.bosses.length < LIMITS.CHARACTER_BOSS_CAP) {
        return {
          ...char,
          bosses: [
            ...char.bosses,
            { 
              name: bossName, 
              difficulty,
              price: getBossPrice(bossData.find(bd => bd.name === bossName), difficulty),
              partySize: getAvailablePartySizes(bossName, difficulty)[0] || 1
            }
          ]
        };
      }
      
      return char;
    });

    setCharacters(newCharacters);
    
    // Save to cloud asynchronously without blocking UI
    const saveData = async () => {
      const updatedData = { characters: newCharacters };
      await saveToCloud(updatedData);
    };
    saveData().catch(console.error);
  };

  const updatePartySize = async (charIdx, bossName, difficulty, newSize) => {
    const newCharacters = characters.map((char, idx) => {
      if (idx !== charIdx) return char;
      
      return {
        ...char,
        bosses: char.bosses.map(boss => 
          boss.name === bossName && boss.difficulty === difficulty
            ? { ...boss, partySize: newSize }
            : boss
        )
      };
    });

    setCharacters(newCharacters);
    
    // Save to cloud (characters only, checked state reconstructed from boss_runs)
    const updatedData = {
      characters: newCharacters
    };
    await saveToCloud(updatedData);
  };

  // Reset selectedCharIdx if out of bounds
  useEffect(() => {
    if (selectedCharIdx >= characters.length) {
      setSelectedCharIdx(Math.max(0, characters.length - 1));
    }
  }, [characters.length, selectedCharIdx]);

  return {
    // State
    characters,
    setCharacters,
    newCharName,
    setNewCharName,
    selectedCharIdx,
    setSelectedCharIdx,
    error,
    setError,
    isLoading,
    setIsLoading,
    checked,
    setChecked,
    cloneError,
    setCloneError,
    showUndo,
    undoData,
    fileInputRef,
    importError,
    setImportError,
    importSuccess,
    setImportSuccess,
    
    // Calculated values
    charTotal,
    overallTotal,
    sortedBossData,
    totalBossCount,
    
    // Functions
    getAvailablePartySizes,
    getBossDifficulties,
    handleCharacterChange,
    addCharacter,
    removeCharacter,
    handleUndo,
    toggleBoss,
    updateCharacterName,
    updatePartySize,
  };
} 