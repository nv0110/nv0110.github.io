import { useState, useRef, useMemo, useEffect } from 'react'
import './App.css'
import WeeklyTracker from './WeeklyTracker'
import { supabase } from './supabaseClient'

// Boss data, grouped by boss name with difficulties as array
const bossData = [

  {
    name: 'Pink Bean',
    difficulties: [
      { difficulty: 'Chaos', price: 64000000 },
      { difficulty: 'Normal', price: 7022500 },
    ],
    image: '/bosses/PinkBean.png',
  },
  {
    name: 'Cygnus',
    difficulties: [
      { difficulty: 'Easy', price: 45562500 },
      { difficulty: 'Normal', price: 72250000 },
    ],
    image: '/bosses/cygnus.png',
  },
  {
    name: 'Zakum',
    difficulties: [
      { difficulty: 'Easy', price: 1000000 },
      { difficulty: 'Normal', price: 3062500 },
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/zakum.png',
  },
  {
    name: 'Crimson Queen',
    difficulties: [
      { difficulty: 'Normal', price: 4840000 },
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/crimsonqueen.png',
  },
  {
    name: 'Von Bon',
    difficulties: [
      { difficulty: 'Normal', price: 4840000 },
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/von_bon.png',
  },
  {
    name: 'Pierre',
    difficulties: [
      { difficulty: 'Normal', price: 4840000 },
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/pierre.png',
  },
  {
    name: 'Magnus',
    difficulties: [
      { difficulty: 'Easy', price: 3610000 },
      { difficulty: 'Normal', price: 12960000 },
      { difficulty: 'Hard', price: 95062500 },
    ],
    image: '/bosses/magnus.png',
  },
  {
    name: 'Vellum',
    difficulties: [
      { difficulty: 'Normal', price: 4840000 },
      { difficulty: 'Chaos', price: 105062500 },
    ],
    image: '/bosses/vellum.png',
  },
  {
    name: 'Papulatus',
    difficulties: [
      { difficulty: 'Easy', price: 3422500 },
      { difficulty: 'Normal', price: 13322500 },
      { difficulty: 'Chaos', price: 132250000 },
    ],
    image: '/bosses/Papulatus.png',
  },
  {
    name: 'Aketchi',
    difficulties: [
      { difficulty: 'Normal', price: 144000000 },
    ],
    image: '/bosses/akechi.png',
  },
  {
    name: 'Lotus',
    difficulties: [
      { difficulty: 'Normal', price: 162562500 },
      { difficulty: 'Hard', price: 444675000 },
      { difficulty: 'Extreme', price: 1397500000 },
    ],
    image: '/bosses/lotus.png',
    pitchedItems: [
      { name: 'Black Heart', image: '/items/blackheart.png' },
      { name: 'Berserked', image: '/items/berserked.png' },
      { name: 'Total Control', image: '/items/tc.png' }
    ]
  },
  {
    name: 'Damien',
    difficulties: [
      { difficulty: 'Normal', price: 169000000 },
      { difficulty: 'Hard', price: 421875000 },
    ],
    image: '/bosses/damien.png',
    pitchedItems: [
      { name: 'Magic Eyepatch', image: '/items/eyepatch.webp' }
    ]
  },
  {
    name: 'Guardian Angel Slime',
    difficulties: [
      { difficulty: 'Normal', price: 231673500 },
      { difficulty: 'Chaos', price: 600578125 },
    ],
    image: '/bosses/slime.png',
  },
  {
    name: 'Lucid',
    difficulties: [
      { difficulty: 'Easy', price: 237009375 },
      { difficulty: 'Normal', price: 253828125 },
      { difficulty: 'Hard', price: 504000000 },
    ],
    image: '/bosses/lucid.png',
    pitchedItems: [
      { name: 'Dreamy Belt', image: '/items/dreamy.png' }
    ]
  },
  {
    name: 'Will',
    difficulties: [
      { difficulty: 'Easy', price: 246744750 },
      { difficulty: 'Normal', price: 279075000 },
      { difficulty: 'Hard', price: 621810000 },
    ],
    image: '/bosses/will.png',
    pitchedItems: [
      { name: 'Cursed Spellbook', image: '/items/book.png' }
    ]
  },
  {
    name: 'Gloom',
    difficulties: [
      { difficulty: 'Normal', price: 297675000 },
      { difficulty: 'Chaos', price: 563945000 },
    ],
    image: '/bosses/gloom.png',
    pitchedItems: [
      { name: 'Endless Terror', image: '/items/et.webp' }
    ]
  },
  {
    name: 'Darknell',
    difficulties: [
      { difficulty: 'Normal', price: 316875000 },
      { difficulty: 'Hard', price: 667920000 },
    ],
    image: '/bosses/darknell.png',
    pitchedItems: [
      { name: 'Commanding Force Earring', image: '/items/cfe.webp' }
    ]
  },
  {
    name: 'Verus Hilla',
    difficulties: [
      { difficulty: 'Normal', price: 581880000 },
      { difficulty: 'Hard', price: 762105000 },
    ],
    image: '/bosses/verus_hilla.png',
    pitchedItems: [
      { name: 'Source of Suffering', image: '/items/sos.png' }
    ]
  },
  {
    name: 'Chosen Seren',
    difficulties: [
      { difficulty: 'Normal', price: 889021875 },
      { difficulty: 'Hard', price: 1096562500 },
      { difficulty: 'Extreme', price: 4235000000 },
    ],
    image: '/bosses/seren.png',
    pitchedItems: [
      { name: "Mitra's Rage", image: '/items/emblem.webp' }
    ]
  },
  {
    name: 'Watcher Kalos',
    difficulties: [
      { difficulty: 'Easy', price: 937500000 },
      { difficulty: 'Normal', price: 1300000000 },
      { difficulty: 'Chaos', price: 2600000000 },
      { difficulty: 'Extreme', price: 5200000000 },
    ],
    image: '/bosses/Kalos.png',
  },
  {
    name: 'Kaling',
    difficulties: [
      { difficulty: 'Easy', price: 1031250000 },
      { difficulty: 'Normal', price: 1506500000 },
      { difficulty: 'Hard', price: 2990000000 },
      { difficulty: 'Extreme', price: 6026000000 },
    ],
    image: '/bosses/Kaling.png',
  },
  {
    name: 'Limbo',
    difficulties: [
      { difficulty: 'Normal', price: 2100000000 },
      { difficulty: 'Hard', price: 3745000000 }
    ],
    image: '/bosses/Limbo.png',
  },
  {
    name: 'Hilla',
    difficulties: [
      { difficulty: 'Normal', price: 4000000 },
      { difficulty: 'Hard', price: 56250000 },
    ],
    image: '/bosses/hilla.png',
  },
  {
    name: 'Princess No',
    difficulties: [
      { difficulty: 'Normal', price: 81000000 },
    ],
    image: '/bosses/pno.png',
  },
];

const CHARACTER_BOSS_CAP = 14;
const TOTAL_BOSS_CAP = 180;

// Helper: get price for a boss/difficulty
const getBossPrice = (boss, difficulty) => {
  const d = boss.difficulties.find(d => d.difficulty === difficulty);
  return d ? d.price : 0;
};

// Simple Tooltip component
function Tooltip({ children, text, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute',
          [position]: '120%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2d2540',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: '0.95em',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          boxShadow: '0 2px 8px #0004',
          pointerEvents: 'none',
          opacity: 0.95
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

function App() {
  // State declarations
  const [characters, setCharacters] = useState([]);
  const [lastDifficulties, setLastDifficulties] = useState({});
  const [lastPartySizes, setLastPartySizes] = useState({});
  const [newCharName, setNewCharName] = useState('');
  const [showTable, setShowTable] = useState(() => localStorage.getItem('ms-active-page') === 'table');
  const [selectedCharIdx, setSelectedCharIdx] = useState(null);
  const [lastPreset, setLastPreset] = useState(null);
  const [error, setError] = useState('');
  const [showWeekly, setShowWeekly] = useState(() => localStorage.getItem('ms-active-page') === 'weekly');
  const [isLoading, setIsLoading] = useState(false);
  const [progressData, setProgressData] = useState({
    weeklyTotal: 0,
    lastReset: new Date().toISOString(),
    history: []
  });
  const [userCode, setUserCode] = useState(() => localStorage.getItem('ms-user-code') || '');
  const [loginInput, setLoginInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!userCode);
  const [loginError, setLoginError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createCooldown, setCreateCooldown] = useState(0);
  const [cooldownMsg, setCooldownMsg] = useState('');
  const [loginInputFocused, setLoginInputFocused] = useState(false);
  const [checked, setChecked] = useState({});
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showCloudSync, setShowCloudSync] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const [presets, setPresets] = useState(() => {
    // Try to load from localStorage, else default to empty
    const saved = localStorage.getItem('ms-presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingPresetIdx, setEditingPresetIdx] = useState(null);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetDraft, setPresetDraft] = useState({ name: '', bosses: [] });
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalCountdown, setAccountModalCountdown] = useState(8);
  const [lastCreatedCode, setLastCreatedCode] = useState('');
  const [cloneError, setCloneError] = useState('');
  const [undoData, setUndoData] = useState(null); // { character, index }
  const [showUndo, setShowUndo] = useState(false);
  let undoTimeout = useRef(null);

  // Week key calculation
  const weekKey = (() => {
    // Returns a string like '2024-23' for year-week, based on UTC
    const now = new Date();
    const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const onejan = new Date(utcNow.getUTCFullYear(), 0, 1);
    const week = Math.ceil((((utcNow - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
    return `${utcNow.getUTCFullYear()}-${week}`;
  })();

  // Total meso value for a character (split by party size)
  const charTotal = (char) => char.bosses.reduce((sum, b) => sum + (b.price / (b.partySize || 1)), 0);

  // Total meso value for all characters
  const overallTotal = characters.reduce((sum, c) => sum + charTotal(c), 0);

  // Update progress when total changes
  useEffect(() => {
    setProgressData(prev => ({
      ...prev,
      weeklyTotal: overallTotal
    }));
  }, [overallTotal]);

  // Update progress tracking
  useEffect(() => {
    const now = new Date();
    const lastReset = new Date(progressData.lastReset);
    const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

    // Reset weekly total if it's been 7 days
    if (daysSinceReset >= 7) {
      setProgressData(prev => ({
        weeklyTotal: 0,
        lastReset: now.toISOString(),
        history: [...prev.history, { date: prev.lastReset, total: prev.weeklyTotal }]
      }));
    }
  }, [progressData.lastReset]);

  // Loading state for character switching
  const handleCharacterChange = (e) => {
    setIsLoading(true);
    setSelectedCharIdx(e.target.value ? parseInt(e.target.value) : null);
    setTimeout(() => setIsLoading(false), 300);
  };

  // Loading state for preset application
  const handlePresetApply = (preset, presetName) => {
    setIsLoading(true);
    // Note: This function isn't used directly anymore, but kept for compatibility
    // The applyPreset function now handles everything with the presetIdx
    setTimeout(() => setIsLoading(false), 300);
  };

  // Apply a preset to a character with enhanced logic
  const applyPreset = (presetIdx) => {
    if (selectedCharIdx === null || !presets[presetIdx]) return;
    
    const preset = presets[presetIdx];
    setIsLoading(true);
    
    // Check if this preset was the last one applied
    const isReapplyingSamePreset = lastPreset === presetIdx;
    
    setCharacters(chars => chars.map((char, idx) => {
      if (idx !== selectedCharIdx) return char;
      
      const currentBosses = [...char.bosses];
      const presetBossNames = preset.bosses.map(b => b.name);
      
      // Case 1: If re-pressing the same preset, unselect all bosses from that preset
      if (isReapplyingSamePreset) {
        const newBosses = currentBosses.filter(b => !presetBossNames.includes(b.name));
        setLastPreset(null); // Reset last preset since we're toggling it off
        return { ...char, bosses: newBosses };
      }
      
      // For all other cases, we'll build a new bosses array
      let newBosses = [];
      
      // Keep track of bosses already selected that aren't in the preset
      const nonPresetBosses = currentBosses.filter(b => !presetBossNames.includes(b.name));
      
      // Keep track of bosses already selected that are in the preset (for case 3)
      const existingPresetBosses = currentBosses.filter(b => presetBossNames.includes(b.name));
      
      // Case 3: If a boss is already selected and in the preset, keep it
      const existingPresetBossNames = existingPresetBosses.map(b => b.name);
      
      // Count how many bosses we can still add
      const availableSlots = CHARACTER_BOSS_CAP - nonPresetBosses.length;
      
      if (availableSlots <= 0) {
        // No slots available, can't add any preset bosses
        newBosses = currentBosses;
      } else {
        // Sort preset bosses by price (highest first) to prioritize expensive ones
        const sortedPresetBosses = [...preset.bosses].sort((a, b) => {
          const bossA = sortedBossData.find(boss => boss.name === a.name);
          const bossB = sortedBossData.find(boss => boss.name === b.name);
          if (!bossA || !bossB) return 0;
          
          const priceA = getBossPrice(bossA, a.difficulty);
          const priceB = getBossPrice(bossB, b.difficulty);
          return priceB - priceA;
        });
        
        // Add preset bosses up to the available slots
        const presetBossesToAdd = [];
        
        for (const presetBoss of sortedPresetBosses) {
          // Skip if we've reached the limit
          if (presetBossesToAdd.length >= availableSlots) break;
          
          // Case 3 & 4: If boss is already selected in the preset
          const existingBoss = currentBosses.find(b => b.name === presetBoss.name);
          
          if (existingBoss) {
            // Keep the existing boss with its current settings
            presetBossesToAdd.push(existingBoss);
          } else {
            // Add new boss from preset
            const bossData = sortedBossData.find(b => b.name === presetBoss.name);
            if (bossData) {
              presetBossesToAdd.push({
                name: presetBoss.name,
                difficulty: presetBoss.difficulty,
                price: getBossPrice(bossData, presetBoss.difficulty),
                partySize: presetBoss.partySize || 1
              });
            }
          }
        }
        
        // Combine non-preset bosses with preset bosses
        newBosses = [...nonPresetBosses];
        
        // For bosses that are in both the current selection and preset,
        // we need to handle them specially to avoid duplicates
        for (const presetBoss of presetBossesToAdd) {
          // Only add if not already in newBosses
          if (!newBosses.some(b => b.name === presetBoss.name)) {
            newBosses.push(presetBoss);
          }
        }
      }
      
      return { ...char, bosses: newBosses };
    }));
    
    // Only set lastPreset if we're not toggling off
    if (!isReapplyingSamePreset) {
      setLastPreset(presetIdx);
    }
    
    setTimeout(() => setIsLoading(false), 300);
  };

  // Remove the dynamicSortedBossData useMemo and replace with a simple sort by max price
  const sortedBossData = useMemo(() => {
    return [...bossData].sort((a, b) => {
      const maxPriceA = Math.max(...a.difficulties.map(d => d.price));
      const maxPriceB = Math.max(...b.difficulties.map(d => d.price));
      return maxPriceB - maxPriceA;
    });
  }, []);

  // Get available party sizes for a boss and difficulty
  const getAvailablePartySizes = (bossName, difficulty) => {
    if (bossName === 'Limbo') {
      return [1, 2, 3];
    }
    if (bossName === 'Lotus' && difficulty === 'Extreme') {
      return [1, 2];
    }
    return [1, 2, 3, 4, 5, 6];
  };

  // Update party size with restrictions
  const updatePartySize = (charIdx, bossName, difficulty, newSize) => {
    const availableSizes = getAvailablePartySizes(bossName, difficulty);
    if (!availableSizes.includes(newSize)) {
      newSize = availableSizes[0]; // Default to first available size
    }

    setCharacters(chars =>
      chars.map((char, i) => {
        if (i !== charIdx) return char;
        
        setLastPartySizes(prev => ({
          ...prev,
          [char.name]: {
            ...(prev[char.name] || {}),
            [bossName]: newSize
          }
        }));

        return {
          ...char,
          bosses: char.bosses.map(b =>
            b.name === bossName && b.difficulty === difficulty
              ? { ...b, partySize: newSize }
              : b
          )
        };
      })
    );
  };

  // Add a new character
  const addCharacter = () => {
    if (!newCharName.trim()) {
      setError('Character name cannot be empty.');
      return;
    }
    if (characters.length >= 50) {
      setError('Character creation is full. Try again later.');
      return;
    }
    setError('');
    const newChar = { name: newCharName.trim(), bosses: [] };
    setCharacters(prevChars => {
      const updatedChars = [...prevChars, newChar];
      setSelectedCharIdx(updatedChars.length - 1); // Select the newly created character
      return updatedChars;
    });
    setNewCharName('');
  };

  // Remove a character
  const removeCharacter = (idx) => {
    setCharacters(prevChars => {
      const removed = prevChars[idx];
      const newChars = prevChars.filter((_, i) => i !== idx);
      setUndoData({ character: removed, index: idx });
      setShowUndo(true);
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
      undoTimeout.current = setTimeout(() => setShowUndo(false), 4000);
      // Determine new selection
      if (newChars.length === 0) {
        setSelectedCharIdx(null);
      } else if (idx < newChars.length) {
        setSelectedCharIdx(idx); // Select the next character
      } else {
        setSelectedCharIdx(newChars.length - 1); // Select the new last character
      }
      return newChars;
    });
  };

  // Undo character deletion
  const handleUndo = () => {
    if (!undoData) return;
    setCharacters(prevChars => {
      const newChars = [...prevChars];
      newChars.splice(undoData.index, 0, undoData.character);
      setSelectedCharIdx(undoData.index);
      return newChars;
    });
    setShowUndo(false);
    setUndoData(null);
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
  };

  // Toggle boss selection for a character (robust version)
  const toggleBoss = (charIdx, bossName, difficulty) => {
    setCharacters(chars =>
      chars.map((char, i) => {
        if (i !== charIdx) return char;
        
        if (!difficulty) {
          const existingBoss = char.bosses.find(b => b.name === bossName);
          if (existingBoss) {
            setLastDifficulties(prev => ({
              ...prev,
              [char.name]: {
                ...(prev[char.name] || {}),
                [bossName]: existingBoss.difficulty
              }
            }));
            setLastPartySizes(prev => ({
              ...prev,
              [char.name]: {
                ...(prev[char.name] || {}),
                [bossName]: existingBoss.partySize
              }
            }));
            return { ...char, bosses: char.bosses.filter(b => b.name !== bossName) };
          }
          return char;
        }

        if (char.bosses.find(b => b.name === bossName)) {
          return {
            ...char,
            bosses: char.bosses.map(b => 
              b.name === bossName 
                ? { 
                    ...b, 
                    difficulty, 
                    price: getBossPrice(bossData.find(b => b.name === bossName), difficulty),
                    partySize: 1
                  } 
                : b
            )
          };
        }

        if (char.bosses.length < CHARACTER_BOSS_CAP) {
          const lastDifficulty = lastDifficulties[char.name]?.[bossName] || difficulty;
          return {
            ...char,
            bosses: [
              ...char.bosses,
              { 
                name: bossName, 
                difficulty: lastDifficulty,
                price: getBossPrice(bossData.find(b => b.name === bossName), lastDifficulty),
                partySize: lastPartySizes[char.name]?.[bossName] || 1
              }
            ]
          };
        }
        return char;
      })
    );
  };

  const getBossDifficulties = boss => boss.difficulties.map(d => d.difficulty);

  // Total bosses selected across all characters
  const totalBossCount = () => characters.reduce((sum, c) => sum + c.bosses.length, 0);

  // Clone character
  const cloneCharacter = idx => {
    const totalBosses = characters.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0);
    const cloneBosses = characters[idx]?.bosses ? characters[idx].bosses.length : 0;
    if (totalBosses + cloneBosses > 180) {
      setCloneError('Cannot clone: total crystals cap (180) would be exceeded.');
      setTimeout(() => setCloneError(''), 2500);
      return;
    }
    setCharacters(chars => [
      ...chars.slice(0, idx + 1),
      { ...chars[idx], name: chars[idx].name + ' (copy)', bosses: chars[idx].bosses.map(b => ({ ...b })) },
      ...chars.slice(idx + 1)
    ]);
  };

  // Update character name
  const updateCharacterName = (idx, newName) => {
    setCharacters(chars => chars.map((c, i) => i === idx ? { ...c, name: newName } : c));
  };

  // Initialize checked state from localStorage or Supabase
  useEffect(() => {
    const loadData = async () => {
      if (isLoggedIn && userCode) {
        try {
          const { data, error } = await supabase.from('user_data').select('data').eq('id', userCode).single();
          if (!error && data) {
            // Load characters
            if (data.data.characters) {
              setCharacters(data.data.characters);
            }
            
            // Handle checked state and weekKey
            if (data.data.weekKey === weekKey && data.data.checked) {
              setChecked(data.data.checked);
            } else {
              // Reset checked state for new week
              setChecked({});
              // Update Supabase with new weekKey and cleared checked
              await supabase.from('user_data').upsert([{ 
                id: userCode, 
                data: { 
                  ...data.data, 
                  weekKey, 
                  checked: {} 
                } 
              }]);
            }

            // Load presets from localStorage
            const savedPresets = localStorage.getItem('ms-presets');
            if (savedPresets) {
              setPresets(JSON.parse(savedPresets));
            }
          }
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };
    loadData();
  }, [isLoggedIn, userCode, weekKey]);

  // Sync to Supabase on data change
  useEffect(() => {
    if (isLoggedIn && userCode) {
      const syncData = async () => {
        try {
          const { error } = await supabase.from('user_data').upsert([{ 
            id: userCode, 
            data: { 
              characters, 
              checked, 
              weekKey,
              lastUpdated: new Date().toISOString()
            } 
          }]);
          if (error) {
            console.error('Error syncing data:', error);
          } else {
            setShowCloudSync(true);
            setTimeout(() => setShowCloudSync(false), 1500);
          }
        } catch (error) {
          console.error('Error syncing data:', error);
        }
      };

      // Debounce the sync to prevent too many requests
      const timeoutId = setTimeout(syncData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [characters, checked, userCode, isLoggedIn, weekKey]);

  // Handle window unload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isLoggedIn && userCode) {
        try {
          await supabase.from('user_data').upsert([{ 
            id: userCode, 
            data: { 
              characters, 
              checked, 
              weekKey,
              lastUpdated: new Date().toISOString()
            } 
          }]);
        } catch (error) {
          console.error('Error saving data before unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [characters, checked, userCode, isLoggedIn, weekKey]);

  useEffect(() => {
    let timer;
    if (showAccountModal && accountModalCountdown > 0) {
      timer = setTimeout(() => {
        setAccountModalCountdown(c => c - 1);
      }, 1000);
    } else if (showAccountModal && accountModalCountdown === 0) {
      setShowAccountModal(false);
    }
    return () => clearTimeout(timer);
  }, [showAccountModal, accountModalCountdown]);

  const handleCreateAccount = async () => {
    if (createCooldown > 0) {
      setCooldownMsg('Please wait a few seconds before creating another account.');
      return;
    }
    setIsCreating(true);
    setCooldownMsg('');
    setCreateCooldown(5);
    const code = Math.random().toString(36).slice(2, 10).toUpperCase();
    
    try {
      const { error } = await supabase.from('user_data').upsert([{ 
        id: code, 
        data: { 
          characters: [], 
          checked: {}, 
          weekKey 
        } 
      }]);
      
      if (!error) {
        // Set states directly without setTimeout
        setLastCreatedCode(code);
        setIsCreating(false);
        setCreateCooldown(0);
        setShowAccountModal(true);
        setAccountModalCountdown(8);
      } else {
        setLoginError('Failed to create account. Try again.');
        setIsCreating(false);
      }
    } catch (error) {
      setLoginError('Failed to create account. Try again.');
      setIsCreating(false);
    }
  };

  const handleLogin = async () => {
    setLoginError('');
    try {
      const { data, error } = await supabase.from('user_data').select('data').eq('id', loginInput).single();
      if (error || !data) {
        setLoginError('Invalid code.');
        return;
      }

      setUserCode(loginInput);
      setIsLoggedIn(true);
      localStorage.setItem('ms-user-code', loginInput);
      
      // Load characters
      if (data.data.characters) {
        setCharacters(data.data.characters);
      }
      
      // Handle checked state and weekKey
      if (data.data.weekKey === weekKey && data.data.checked) {
        setChecked(data.data.checked);
      } else {
        setChecked({});
        // Update Supabase with new weekKey and cleared checked
        await supabase.from('user_data').upsert([{ 
          id: loginInput, 
          data: { 
            ...data.data, 
            weekKey, 
            checked: {} 
          } 
        }]);
      }

      // Load presets from localStorage
      const savedPresets = localStorage.getItem('ms-presets');
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      }
    } catch (error) {
      setLoginError('Failed to login. Try again.');
    }
  };

  const handleLogout = async () => {
    if (isLoggedIn && userCode) {
      try {
        // Save final state before logout
        await supabase.from('user_data').upsert([{ 
          id: userCode, 
          data: { 
            characters, 
            checked, 
            weekKey,
            lastUpdated: new Date().toISOString()
          } 
        }]);
      } catch (error) {
        console.error('Error saving data before logout:', error);
      }
    }
    
    setUserCode('');
    setIsLoggedIn(false);
    setCharacters([]);
    setChecked({});
    localStorage.removeItem('ms-user-code');
  };

  const handleDeleteAccount = async () => {
    setShowDeleteLoading(true);
    setDeleteError('');
    try {
      const { error, data, status, count } = await supabase.from('user_data').delete().eq('id', userCode);
      console.log('Supabase delete response:', { error, data, status, count });
      if (error) {
        setDeleteError('Failed to delete account. Try again.');
      } else if ((data && data.length === 0) || status === 0) {
        setDeleteError('No account was deleted. Please check your code or contact support.');
      } else {
        setDeleteSuccess(true);
        setTimeout(() => {
          setDeleteSuccess(false);
          setUserCode('');
          setIsLoggedIn(false);
          setCharacters([]);
          setChecked({});
          localStorage.removeItem('ms-user-code');
          localStorage.clear();
        }, 1800);
      }
    } catch (error) {
      setDeleteError('Failed to delete account. Try again.');
      console.error('Delete error:', error);
    } finally {
      setShowDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  useEffect(() => {
    if (createCooldown > 0) {
      const timer = setTimeout(() => setCreateCooldown(createCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [createCooldown]);

  // Export data function
  const handleExport = () => {
    try {
      const exportData = {
        characters: characters,
        version: '1.0',
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maplestory-boss-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      setImportError('Failed to export data. Please try again.');
    }
  };

  // Import data function
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!data.characters || !Array.isArray(data.characters)) {
          throw new Error('Invalid data format');
        }

        // Validate each character
        data.characters.forEach(char => {
          if (!char.name || !Array.isArray(char.bosses)) {
            throw new Error('Invalid character data');
          }
          char.bosses.forEach(boss => {
            if (!boss.name || !boss.difficulty || typeof boss.price !== 'number') {
              throw new Error('Invalid boss data');
            }
          });
        });

        setCharacters(data.characters);
        if (data.presets && Array.isArray(data.presets)) {
          setPresets(data.presets);
        } else {
          setPresets([]);
        }
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 2000);
      } catch (error) {
        console.error('Error importing data:', error);
        setImportError('Invalid data file. Please check the format and try again.');
      }
    };
    reader.readAsText(file);
  };

  // Update active page in localStorage when it changes
  useEffect(() => {
    if (showTable) {
      localStorage.setItem('ms-active-page', 'table');
    } else if (showWeekly) {
      localStorage.setItem('ms-active-page', 'weekly');
    } else {
      localStorage.setItem('ms-active-page', 'calculator');
    }
  }, [showTable, showWeekly]);

  // Table view
  if (showTable) {
    return (
      <div className="App dark" style={{ background: '#28204a', minHeight: '100vh', color: '#e6e0ff', padding: '2rem 0', border: '1.5px solid #2d2540' }}>
        <button onClick={() => setShowTable(false)} style={{ background: '#805ad5', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', cursor: 'pointer' }}>← Back to Calculator</button>
        <div style={{ background: '#28204a', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)', maxWidth: 900, margin: '0 auto', border: '1.5px solid #2d2540' }}>
          <h2 style={{ color: '#a259f7', marginBottom: '1rem', textAlign: 'center', fontWeight: 700 }}>Boss Crystal Price Table</h2>
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, border: '1px solid #2d2540', borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#3a2a5d', color: '#fff' }}>
                  <th style={{ padding: '6px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 100, verticalAlign: 'bottom', color: undefined }}>Boss</th>
                  <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 90, color: undefined }}>Difficulty</th>
                  <th style={{ padding: '6px 14px', textAlign: 'right', fontWeight: 600, fontSize: '0.9em', minWidth: 120, color: undefined }}>Mesos</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Flatten all boss-difficulty pairs
                  const allBossDiffs = bossData.flatMap(boss =>
                    boss.difficulties.map(diff => ({
                      boss,
                      difficulty: diff.difficulty,
                      price: diff.price
                    }))
                  );
                  // Sort by price descending
                  allBossDiffs.sort((a, b) => b.price - a.price);
                  return allBossDiffs.map((item, idx) => (
                    <tr key={item.boss.name + '-' + item.difficulty} style={{ background: idx % 2 === 0 ? '#23203a' : '#201c32', border: '1px solid #3a335a' }}>
                      <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 100 }}>
                        {item.boss.image && (
                          <img src={item.boss.image} alt={item.boss.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, background: '#fff1', marginRight: 8 }} />
                        )}
                        <span className="boss-name" style={{ fontWeight: 600, fontSize: '1.05em', color: undefined }}>{item.boss.name}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'left', minWidth: 90 }}>
                        <span style={{ color: undefined, fontWeight: 500 }}>{item.difficulty}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', minWidth: 120 }}>
                        <span style={{ color: '#6a11cb', fontWeight: 600 }}>{item.price.toLocaleString()}</span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (showWeekly) {
    return <WeeklyTracker characters={characters} bossData={bossData} onBack={() => setShowWeekly(false)} checked={checked} setChecked={setChecked} />;
  }

  // Main calculator view
  if (!isLoggedIn) {
    return (
      <div className="App dark" style={{ background: '#28204a', minHeight: '100vh', color: '#e6e0ff', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontWeight: 700, fontSize: '2.2rem', marginBottom: '1.5rem' }}>Maplestory Boss Crystal Calculator</h1>
        <div style={{ background: '#2d2540', borderRadius: 10, padding: '2rem', boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <button
            onClick={handleCreateAccount}
            disabled={isCreating || createCooldown > 0}
            style={{ 
              background: '#a259f7', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 6, 
              padding: '0.7rem 1.5rem', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              marginBottom: 8, 
              opacity: isCreating || createCooldown > 0 ? 0.6 : 1, 
              cursor: isCreating || createCooldown > 0 ? 'not-allowed' : 'pointer', 
              transition: 'all 0.18s cubic-bezier(.4,2,.6,1)', 
              boxShadow: '0 2px 8px #a259f733'
            }}
          >
            {isCreating ? 'Creating Account...' : createCooldown > 0 ? `Creating Account (${createCooldown})` : 'Create Account'}
          </button>
          {cooldownMsg && <div style={{ color: '#ffbaba', fontSize: '1em', marginBottom: 4 }}>{cooldownMsg}</div>}
          <div style={{ width: '100%', textAlign: 'center', color: '#b39ddb', fontSize: '1.2rem', fontWeight: 700, margin: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, height: 1, background: '#3a335a' }}></span>
            <span style={{ fontSize: '1.2em', fontWeight: 700 }}>or</span>
            <span style={{ flex: 1, height: 1, background: '#3a335a' }}></span>
          </div>
          <div style={{ position: 'relative', width: '100%', marginBottom: 8 }}>
            <input
              type={showPassword ? "text" : "password"}
              value={loginInput}
              onChange={e => setLoginInput(e.target.value.toUpperCase())}
              placeholder="Enter your code"
              style={{ 
                background: '#3a335a', 
                color: '#e6e0ff', 
                border: loginInputFocused ? '2px solid #a259f7' : '1.5px solid #2d2540', 
                borderRadius: 6, 
                padding: '0.5rem 1rem', 
                fontSize: '1.1rem', 
                width: '80%', 
                outline: loginInputFocused ? '0 0 0 2px #a259f7' : 'none', 
                boxShadow: loginInputFocused ? '0 0 0 2px #a259f755' : 'none', 
                transition: 'border 0.18s, box-shadow 0.18s',
                paddingRight: '40px' // Make room for the eye icon
              }}
              onFocus={() => setLoginInputFocused(true)}
              onBlur={() => setLoginInputFocused(false)}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a259f7',
                padding: '4px'
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={handleLogin}
            style={{ background: '#805ad5', color: '#fff', border: 'none', borderRadius: 6, padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.18s cubic-bezier(.4,2,.6,1)', boxShadow: '0 2px 8px #805ad533', }}
            onMouseOver={e => { e.currentTarget.style.background = '#a259f7'; e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 16px #a259f799'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#805ad5'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px #805ad533'; }}
          >
            Login
          </button>
          {loginError && <div style={{ color: 'red', marginTop: 8 }}>{loginError}</div>}
        </div>
        {/* Guide and caution text below the login box */}
        <div style={{
          marginTop: 28,
          background: 'rgba(44, 34, 80, 0.95)',
          borderRadius: 10,
          padding: '1.2rem 1.5rem',
          maxWidth: 440,
          boxShadow: '0 2px 8px #0002',
          color: '#e6e0ff',
          fontSize: '1.08rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', justifyContent: 'center' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#a259f7', flexShrink: 0, position: 'relative', top: '-10px' }} />
            <span style={{ textAlign: 'center', flex: 1 }}>
              Create an account to generate your unique code. Use this code to access your data from any device.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', justifyContent: 'center' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#ffd700', flexShrink: 0, position: 'relative', top: '-10px' }} />
            <span style={{ color: '#ffd700', fontWeight: 600, textAlign: 'center', flex: 1 }}>
              Save your code somewhere safe! You'll need it to log in again.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', justifyContent: 'center' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#ffbaba', flexShrink: 0, position: 'relative', top: '-10px' }} />
            <span style={{ color: '#ffbaba', fontWeight: 500, textAlign: 'center', flex: 1 }}>
              Don't spam account creation—each code is unique and tied to your data.
            </span>
          </div>
        </div>

        {/* Account Creation Modal */}
        {showAccountModal && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(40,32,74,0.96)', 
            zIndex: 5000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <div style={{ 
              background: '#2d2540', 
              borderRadius: 12, 
              padding: '2.5rem 2rem', 
              maxWidth: 440, 
              color: '#e6e0ff', 
              boxShadow: '0 4px 24px #0006', 
              position: 'relative', 
              minWidth: 320, 
              textAlign: 'center' 
            }}>
              <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 18 }}>Account Created!</h2>
              <div style={{ fontSize: '1.15rem', marginBottom: 18 }}>
                <b>Your unique code:</b>
                <div style={{ 
                  fontSize: '1.5rem', 
                  color: '#ffd700', 
                  margin: '12px 0', 
                  letterSpacing: 2,
                  background: '#23203a',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #3a335a'
                }}>
                  {lastCreatedCode}
                </div>
                <div style={{ color: '#ffbaba', fontWeight: 600, marginBottom: 10 }}>
                  ⚠️ Save this code somewhere safe!<br/>
                  If you lose it, <u>all your data will be lost</u>.
                </div>
                <div style={{ color: '#b39ddb', fontSize: '1.1rem', marginBottom: 10 }}>
                  Use this code to log in now.<br/>
                  You will be redirected in <b>{accountModalCountdown}</b> second{accountModalCountdown !== 1 ? 's' : ''}...
                </div>
              </div>
              <button 
                onClick={() => setShowAccountModal(false)} 
                style={{ 
                  background: '#a259f7', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  padding: '0.7rem 1.5rem', 
                  fontWeight: 700, 
                  fontSize: '1.1rem', 
                  cursor: 'pointer', 
                  marginTop: 10,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#b47aff'}
                onMouseOut={e => e.currentTarget.style.background = '#a259f7'}
              >
                Continue to Login
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main app view - show this regardless of whether there are characters or not
  return (
    <div className="App dark" style={{ background: '#28204a', minHeight: '100vh', color: '#e6e0ff', padding: '2rem 0', border: '1.5px solid #2d2540' }}>
      <div style={{ position: 'absolute', top: 18, left: 32, zIndex: 10 }}>
        <span style={{ color: '#d6b4ff', fontSize: '1.08em', fontWeight: 700, letterSpacing: 1, background: 'rgba(128,90,213,0.08)', borderRadius: 8, padding: '0.3rem 1.1rem', boxShadow: '0 2px 8px #a259f722' }}>
          Code: {userCode}
        </span>
      </div>
      <div style={{ position: 'absolute', top: 18, right: 32, zIndex: 10, display: 'flex', gap: 8 }}>
        <button
          onClick={handleLogout}
          style={{
            background: '#a259f7',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '0.4rem 1.2rem',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 2px 8px #0002',
            cursor: 'pointer',
            transition: 'all 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
            marginRight: 0
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#b47aff'; e.currentTarget.style.boxShadow = '0 4px 16px #a259f799'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#a259f7'; e.currentTarget.style.boxShadow = '0 2px 8px #0002'; }}
        >
          Logout
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            background: '#ff6b6b',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '0.4rem 1.2rem',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 2px 8px #0002',
            cursor: 'pointer',
            transition: 'all 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
            marginRight: 0
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#ff8b8b'; e.currentTarget.style.boxShadow = '0 4px 16px #ff6b6b99'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#ff6b6b'; e.currentTarget.style.boxShadow = '0 2px 8px #0002'; }}
        >
          Delete Account
        </button>
        <Tooltip text="Help & FAQ"><button
          onClick={() => setShowHelp(true)}
          style={{
            background: '#805ad5',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '0.4rem 1.2rem',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 2px 8px #0002',
            cursor: 'pointer',
            transition: 'all 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s',
            marginRight: 0
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#a259f7'; e.currentTarget.style.boxShadow = '0 4px 16px #805ad599'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#805ad5'; e.currentTarget.style.boxShadow = '0 2px 8px #0002'; }}
        >
          Help
        </button></Tooltip>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/bluecrystal.png" alt="Blue Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" style={{ width: 32, height: 32 }} />
      </div>
      <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2.2rem', marginBottom: '0.5rem' }}>Maplestory Boss Crystal Calculator</h1>
      <p style={{ color: '#6a11cb', textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem' }}>Create characters, select bosses, and calculate your total crystal value!</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => setShowTable(true)} style={{ background: '#805ad5', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>
          View Boss Price Table
        </button>
        <button onClick={() => setShowWeekly(true)} style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>
          Weekly Tracker
        </button>
        <Tooltip text="Export all character data as a file"><button 
          onClick={handleExport} 
          style={{ 
            background: '#805ad5', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '0.5rem 1.2rem', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Data
        </button></Tooltip>
        <Tooltip text="Import character data from a file"><button 
          onClick={() => fileInputRef.current?.click()} 
          style={{ 
            background: '#a259f7', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '0.5rem 1.2rem', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Import Data
        </button></Tooltip>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          style={{ display: 'none' }}
        />
      </div>

      <div className="table-container" style={{ background: '#2d2540', borderRadius: 8, boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)', padding: '1rem', border: '1.5px solid #2d2540', maxWidth: 800, margin: '0 auto' }}>
        {error && <div style={{ color: 'red', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}
        
        {/* Character Creation Section */}
        <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="text"
            value={newCharName}
            onChange={e => setNewCharName(e.target.value)}
            placeholder="Character name"
            style={{ 
              padding: '0.5rem', 
              borderRadius: '6px', 
              border: '1px solid #3a335a', 
              minWidth: '180px', 
              fontSize: '1rem', 
              background: '#3a335a', 
              color: '#e6e0ff',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          <button
            onClick={addCharacter}
            style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            Add Character
          </button>
        </div>

        {characters.length === 0 ? (
          <div style={{ padding: '2rem', color: '#888', fontSize: '1.2rem', textAlign: 'center', background: '#23203a', borderRadius: '8px', margin: '1rem 0' }}>
            <span role="img" aria-label="sparkles">✨</span> Welcome! Add your first character to get started.
          </div>
        ) : (
          <>
            {/* Character Management Section */}
            <div className="char-header-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center', position: 'relative' }}>
              {cloneError && (
                <div style={{ color: '#ffbaba', background: '#3a335a', borderRadius: 6, padding: '6px 16px', fontSize: '1em', fontWeight: 500, marginBottom: 4, boxShadow: '0 2px 8px #ffbaba22', transition: 'opacity 0.3s', position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
                  {cloneError}
                </div>
              )}
              {selectedCharIdx !== null && characters[selectedCharIdx] && (
                <EditCharacterName
                  name={characters[selectedCharIdx].name}
                  onSave={newName => updateCharacterName(selectedCharIdx, newName)}
                />
              )}
              <select
                value={selectedCharIdx ?? ''}
                onChange={handleCharacterChange}
                style={{
                  background: '#3a335a',
                  color: '#e6e0ff',
                  border: '1px solid #3a335a',
                  borderRadius: 10,
                  fontSize: '1.1em',
                  minWidth: 140,
                  height: 36,
                  boxShadow: 'none',
                  textAlign: 'center',
                  textAlignLast: 'center',
                  paddingRight: 20,
                  outline: 'none',
                }}
              >
                <option value="">Select a Character</option>
                {characters.map((char, idx) => (
                  <option key={idx} value={idx}>{char.name}</option>
                ))}
              </select>
              {selectedCharIdx !== null && (
                <>
                  <Tooltip text="Clone this character (max 180 crystals)"><button 
                    className="boton-elegante clone" 
                    onClick={() => cloneCharacter(selectedCharIdx)}
                  >
                    Clone
                  </button></Tooltip>
                  <Tooltip text="Add a new preset"><button 
                    className="boton-elegante add-preset"
                    onClick={() => { setEditingPresetIdx(null); setPresetDraft({ name: '', bosses: [] }); setPresetModalOpen(true); }}
                    style={{ 
                      minWidth: 60, 
                      fontWeight: 700
                    }}
                  >
                    +Preset
                  </button></Tooltip>
                  <Tooltip text="Delete this character"><button 
                    className="boton-elegante delete" 
                    onClick={() => removeCharacter(selectedCharIdx)}
                  >
                    Delete
                  </button></Tooltip>
                </>
              )}
            </div>

            {/* Preset row below main controls */}
            {selectedCharIdx !== null && (
              <div className="preset-row" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', margin: '8px 0 18px 0' }}>
                {presets.map((preset, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Tooltip text="Edit this preset">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingPresetIdx(idx); setPresetDraft(preset); setPresetModalOpen(true); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '1.2em',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M20.548 3.452a1.542 1.542 0 0 1 0 2.182l-7.636 7.636-3.273 1.091 1.091-3.273 7.636-7.636a1.542 1.542 0 0 1 2.182 0zM4 21h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-2 0v7H5V6h7a1 1 0 0 0 0-2H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1z"/>
                        </svg>
                      </button>
                    </Tooltip>
                    <Tooltip text="Left click to apply, right click to edit this preset">
                      <button
                        className={`boton-elegante preset${idx}`}
                        onClick={() => applyPreset(idx)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setEditingPresetIdx(idx);
                          setPresetDraft(preset);
                          setPresetModalOpen(true);
                        }}
                        style={{
                          minWidth: 60,
                          maxWidth: 90,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          fontWeight: 700
                        }}
                      >
                        {preset.name}
                      </button>
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}

            {/* Boss Selection Table */}
            {selectedCharIdx !== null && characters[selectedCharIdx] ? (
              <div style={{ marginTop: '1rem' }}>
                {/* Total Crystals Counter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, fontWeight: 700, fontSize: '1.08em', color: '#a259f7' }}>
                  <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 24, height: 24, marginRight: 4 }} />
                  {characters.reduce((sum, char) => sum + (char.bosses ? char.bosses.length : 0), 0)} / 180
                </div>
                {/* Restored: Original Boss Table with all features and styling */}
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, border: '1px solid #2d2540', borderRadius: 12, overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#3a2a5d', color: '#e6e0ff' }}>
                        <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 70 }}>Boss</th>
                        <th style={{ padding: '6px 0px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 90 }}>Difficulty</th>
                        <th className="boss-table-price" style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 70 }}>Mesos</th>
                        <th className="boss-table-controls" style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 160 }}>{selectedCharIdx !== null ? characters[selectedCharIdx]?.name : 'Selected Character'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBossData.map((boss, bidx) => {
                        const difficulties = getBossDifficulties(boss);
                        const selected = selectedCharIdx !== null ? characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name) : null;
                        return (
                          <tr 
                            key={bidx} 
                            style={{ 
                              background: bidx % 2 === 0 ? '#23203a' : '#201c32', 
                              border: '1px solid #3a335a',
                              color: '#e6e0ff',
                              transition: 'background-color 0.2s ease, transform 0.2s ease',
                              cursor: 'pointer'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#2a2540'}
                            onMouseOut={e => e.currentTarget.style.background = bidx % 2 === 0 ? '#23203a' : '#201c32'}
                            onClick={() => {
                              if (selected) {
                                toggleBoss(selectedCharIdx, boss.name, '');
                              } else {
                                toggleBoss(selectedCharIdx, boss.name, difficulties[0]);
                              }
                            }}
                          >
                            <td style={{ padding: '8px 2px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 70 }}>
                              {boss.image && (
                                <img 
                                  src={boss.image} 
                                  alt={boss.name} 
                                  loading="lazy"
                                  style={{ 
                                    width: 40, 
                                    height: 40, 
                                    objectFit: 'contain', 
                                    borderRadius: 6, 
                                    background: '#fff1', 
                                    marginRight: 8,
                                    transition: 'transform 0.2s ease'
                                  }} 
                                  onMouseOver={e => e.target.style.transform = 'scale(1.1)'}
                                  onMouseOut={e => e.target.style.transform = 'scale(1)'}
                                />
                              )}
                              <span className="boss-name" style={{ fontWeight: 600, fontSize: '1.05em', color: undefined }}>{boss.name}</span>
                            </td>
                            <td style={{ padding: '8px 2px', textAlign: 'left', minWidth: 90 }}>
                              <span style={{ color: undefined, fontWeight: 500 }}>{selected ? selected.difficulty : '—'}</span>
                            </td>
                            <td className="boss-table-price" style={{ padding: '8px 2px', textAlign: 'center', minWidth: 70, fontWeight: 600, background: 'inherit', verticalAlign: 'middle' }}>
                              <span style={{ color: '#6a11cb' }}>{selected && selected.difficulty && Math.floor(getBossPrice(boss, selected.difficulty) / (selected.partySize || 1)).toLocaleString()}</span>
                            </td>
                            <td className="boss-table-controls" style={{ padding: '8px 2px', textAlign: 'center', minWidth: 160, background: 'inherit', verticalAlign: 'middle' }}>
                              {selectedCharIdx !== null && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6 }}>
                                  <div className="checkbox-wrapper" style={{ marginRight: 4, transform: 'scale(0.8)' }}>
                                    <input
                                      type="checkbox"
                                      checked={!!selected}
                                      onClick={e => e.stopPropagation()}
                                      onChange={() => {
                                        if (selected) {
                                          toggleBoss(selectedCharIdx, boss.name, '');
                                        } else {
                                          toggleBoss(selectedCharIdx, boss.name, difficulties[0]);
                                        }
                                      }}
                                    />
                                    <svg viewBox="0 0 35.6 35.6">
                                      <circle className="background" cx="17.8" cy="17.8" r="17.8"></circle>
                                      <circle className="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
                                      <polyline className="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
                                    </svg>
                                  </div>
                                  {selected && (
                                    <>
                                      <select
                                        className="boss-table-difficulty"
                                        value={selected.difficulty}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                          toggleBoss(selectedCharIdx, boss.name, e.target.value);
                                          // Reset party size when changing difficulty
                                          const availableSizes = getAvailablePartySizes(boss.name, e.target.value);
                                          updatePartySize(selectedCharIdx, boss.name, e.target.value, availableSizes[0]);
                                        }}
                                        style={{ 
                                          marginLeft: 0, 
                                          height: 32, 
                                          borderRadius: 6, 
                                          border: '1px solid #3a335a', 
                                          background: '#3a335a', 
                                          color: '#e6e0ff', 
                                          fontWeight: 600,
                                          paddingRight: 18,
                                          cursor: 'pointer',
                                          minWidth: 90,
                                          maxWidth: 120,
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          boxSizing: 'border-box',
                                          fontSize: '1rem',
                                        }}
                                      >
                                        {difficulties.map(diff => (
                                          <option key={diff} value={diff}>{diff}</option>
                                        ))}
                                      </select>
                                      <select
                                        className="party-size-dropdown boss-table-party-size"
                                        value={selected.partySize || 1}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => {
                                          updatePartySize(selectedCharIdx, boss.name, selected.difficulty, parseInt(e.target.value));
                                        }}
                                        style={{ 
                                          marginLeft: 4, 
                                          height: 32, 
                                          borderRadius: 6, 
                                          border: '1px solid #3a335a', 
                                          background: '#3a335a', 
                                          color: '#e6e0ff', 
                                          fontWeight: 600, 
                                          textAlign: 'center',
                                          fontSize: '1rem',
                                          boxSizing: 'border-box',
                                          appearance: 'none',
                                          WebkitAppearance: 'none',
                                          width: 44,
                                          minWidth: 44,
                                          padding: '0 10px 0 6px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {getAvailablePartySizes(boss.name, selected.difficulty).map(size => (
                                          <option key={size} value={size}>{size}</option>
                                        ))}
                                      </select>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', color: '#888', fontSize: '1.1rem', textAlign: 'center' }}>
                <span role="img" aria-label="arrow">⬅️</span> Select a character to view and manage bosses.
              </div>
            )}
          </>
        )}
      </div>

      {/* Preset Modal for create/edit */}
      {presetModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(40,32,74,0.92)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-fade" style={{ background: '#2d2540', borderRadius: 12, padding: '2.5rem 2rem', maxWidth: 440, color: '#e6e0ff', boxShadow: '0 4px 24px #0006', position: 'relative', minWidth: 320 }}>
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
              {editingPresetIdx !== null && (
                <button 
                  onClick={() => {
                    setPresets(presets => presets.filter((_, i) => i !== editingPresetIdx));
                    setPresetModalOpen(false);
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#ff6b6b', 
                    cursor: 'pointer', 
                    fontSize: '1.2em', 
                    padding: '4px', 
                    display: 'flex', 
                    alignItems: 'center',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Delete Preset"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H17ZM15 4H9V5H15V4ZM17 7H7V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V7Z" fill="currentColor"/>
                    <path d="M9 9H11V17H9V9Z" fill="currentColor" />
                    <path d="M13 9H15V17H13V9Z" fill="currentColor" />
                  </svg>
                </button>
              )}
              <button 
                onClick={() => setPresetModalOpen(false)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  fontSize: '1.5rem', 
                  padding: '4px', 
                  display: 'flex', 
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Close"
              >
                ×
              </button>
            </div>
            <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 18 }}>{editingPresetIdx === null ? 'Create Preset' : 'Edit Preset'}</h2>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, fontSize: '1.1em', marginRight: 8 }}>Name:</label>
              <input
                type="text"
                value={presetDraft.name}
                maxLength={5}
                onChange={e => setPresetDraft(d => ({ ...d, name: e.target.value.replace(/[^\w\s]/g, '').slice(0, 5) }))}
                style={{ background: '#3a335a', color: '#e6e0ff', border: '1.5px solid #2d2540', borderRadius: 6, padding: '0.5rem 1rem', fontSize: '1.1rem', width: 120, marginRight: 8 }}
                placeholder="Name"
              />
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 18, background: '#23203a', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Select Bosses (max 14):</div>
              {[...bossData].sort((a, b) => {
                const maxA = Math.max(...a.difficulties.map(d => d.price));
                const maxB = Math.max(...b.difficulties.map(d => d.price));
                return maxB - maxA;
              }).map(boss => {
                const selected = presetDraft.bosses.find(b => b.name === boss.name);
                return (
                  <div key={boss.name} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: '#a259f7', marginBottom: 2 }}>{boss.name}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }} key={selected ? selected.difficulty : 'none'}>
                      {boss.difficulties.map(diff => {
                        const checked = selected && selected.difficulty === diff.difficulty;
                        const atMax = !checked && presetDraft.bosses.length >= 14;
                        return (
                          <label key={diff.difficulty} style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, background: checked ? '#805ad5' : '#3a335a', color: checked ? '#fff' : '#e6e0ff', borderRadius: 6, padding: '2px 8px', cursor: atMax ? 'not-allowed' : 'pointer', fontSize: '0.98em', opacity: atMax ? 0.5 : 1 }}>
                            <input
                              type="radio"
                              name={`preset-boss-${boss.name}`}
                              checked={checked}
                              disabled={atMax}
                              onChange={e => {
                                // Only add if not already checked
                                if (!checked && e.target.checked) {
                                  setPresetDraft(d => {
                                    let bosses = d.bosses.filter(b => b.name !== boss.name);
                                    bosses = [...bosses, { name: boss.name, difficulty: diff.difficulty }];
                                    return { ...d, bosses };
                                  });
                                }
                              }}
                              onClick={e => {
                                // If already checked, unselect (toggle off)
                                if (checked) {
                                  setPresetDraft(d => ({ ...d, bosses: d.bosses.filter(b => b.name !== boss.name) }));
                                }
                              }}
                              style={{ marginRight: 2 }}
                            />
                            {diff.difficulty}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: presetDraft.name.length === 0 || presetDraft.bosses.length === 0 ? 'not-allowed' : 'pointer', opacity: presetDraft.name.length === 0 || presetDraft.bosses.length === 0 ? 0.6 : 1, width: '100%', marginTop: 8 }}
              disabled={presetDraft.name.length === 0 || presetDraft.bosses.length === 0}
              onClick={() => {
                if (presetDraft.name.length === 0 || presetDraft.bosses.length === 0) return;
                if (editingPresetIdx === null) {
                  setPresets(presets => [...presets, { ...presetDraft, name: presetDraft.name.slice(0, 5) }]);
                } else {
                  setPresets(presets => presets.map((p, i) => i === editingPresetIdx ? { ...presetDraft, name: presetDraft.name.slice(0, 5) } : p));
                }
                setPresetModalOpen(false);
              }}
            >
              Save Preset
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(40,32,74,0.92)',
            zIndex: 4000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="modal-fade"
            style={{
              background: '#2d2540',
              borderRadius: 12,
              padding: '2.5rem 2rem',
              maxWidth: 600,
              color: '#e6e0ff',
              boxShadow: '0 4px 24px #0006',
              position: 'relative',
              minWidth: 320,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                outline: 'none',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'text-shadow 0.2s ease, color 0.2s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.8)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.textShadow = 'none';
              }}
              title="Close"
            >
              ×
            </button>
            <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 24 }}>Help & FAQ</h2>
            
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Getting Started</h3>
              <p style={{ marginBottom: 8 }}>1. Create an account or log in with your existing code</p>
              <p style={{ marginBottom: 8 }}>2. Add characters using the input field at the top</p>
              <p style={{ marginBottom: 8 }}>3. Select a character and choose their bosses</p>
              <p style={{ marginBottom: 8 }}>4. Adjust party sizes for each boss as needed</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Presets</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Creating:</strong> Click the "+Preset" button to create a new preset (limit of 2 per character)</p>
              <p style={{ marginBottom: 8 }}>• <strong>Applying:</strong> Left-click on a preset button to apply it to your character</p>
              <p style={{ marginBottom: 8 }}>• <strong>Editing:</strong> Right-click on a preset button to edit its name and boss selections</p>
              <p style={{ marginBottom: 8 }}>• <strong>Deleting:</strong> Click the red trash icon in the top-right corner of the edit modal</p>
              <p style={{ marginBottom: 8 }}>• <strong>Toggle behavior:</strong> Left-clicking the same preset twice will toggle it off</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Weekly Tracker</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Progress bar:</strong> Shows current mesos earned vs. maximum possible mesos</p>
              <p style={{ marginBottom: 8 }}>• <strong>Hide completed:</strong> Toggle to hide characters with all bosses cleared</p>
              <p style={{ marginBottom: 8 }}>• <strong>Character summary:</strong> Shows each character's completion status</p>
              <p style={{ marginBottom: 8 }}>• <strong>Tick All button:</strong> Quickly mark all bosses as completed for a character</p>
              <p style={{ marginBottom: 8 }}>• <strong>Reset timer:</strong> Shows time until the weekly reset (Thursday 00:00 UTC)</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Export / Import</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Export:</strong> Creates a JSON file with all your character data and presets</p>
              <p style={{ marginBottom: 8 }}>• <strong>Import:</strong> Loads character data and presets from a previously exported file</p>
              <p style={{ marginBottom: 8 }}>• <strong>Backup regularly:</strong> Export your data periodically as a backup</p>
              <p style={{ marginBottom: 8 }}>• <strong>Transfer between devices:</strong> Export from one device and import on another</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Other Features</h3>
              <p style={{ marginBottom: 8 }}>• <strong>Cloud saving:</strong> Data is automatically saved to the cloud with your account</p>
              <p style={{ marginBottom: 8 }}>• <strong>Page memory:</strong> The app remembers which page you were on last</p>
              <p style={{ marginBottom: 8 }}>• <strong>Character editing:</strong> Click the pencil icon to edit a character's name</p>
              <p style={{ marginBottom: 8 }}>• <strong>Cloning:</strong> Create an exact copy of a character with the Clone button</p>
              <p style={{ marginBottom: 8 }}>• <strong>Party size:</strong> Adjust the party size for each boss to calculate split mesos</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Limits</h3>
              <p style={{ marginBottom: 8 }}>• Each character can select up to 14 bosses</p>
              <p style={{ marginBottom: 8 }}>• Total boss cap across all characters: 180</p>
              <p style={{ marginBottom: 8 }}>• Party size restrictions apply to certain bosses (e.g., Limbo: 1-3, Lotus Extreme: 1-2)</p>
              <p style={{ marginBottom: 8 }}>• Maximum of 2 presets per character</p>
            </div>

            <div>
              <h3 style={{ color: '#b39ddb', marginBottom: 12 }}>Quick Tips</h3>
              <p style={{ marginBottom: 8 }}>• Hover over buttons and elements for helpful tooltips</p>
              <p style={{ marginBottom: 8 }}>• Click on a boss row to toggle selection (not just the checkbox)</p>
              <p style={{ marginBottom: 8 }}>• Use the Price Table to see all boss values sorted by price</p>
              <p style={{ marginBottom: 8 }}>• Save your account code somewhere safe - you'll need it to log in!</p>
              <p style={{ marginBottom: 8 }}>• Weekly reset happens every Thursday at 00:00 UTC</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(40,32,74,0.92)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-fade" style={{
            background: '#2d2540',
            borderRadius: 12,
            padding: '2.5rem 2rem',
            maxWidth: 440,
            color: '#e6e0ff',
            boxShadow: '0 4px 24px #0006',
            position: 'relative',
            minWidth: 320,
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#ff6b6b', fontWeight: 700, marginBottom: 18 }}>Delete Account</h2>
            <p style={{ marginBottom: 24, fontSize: '1.1rem' }}>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: '#3a335a',
                  color: '#e6e0ff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  minWidth: 120
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={showDeleteLoading}
                style={{
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  cursor: showDeleteLoading ? 'not-allowed' : 'pointer',
                  opacity: showDeleteLoading ? 0.6 : 1,
                  minWidth: 120
                }}
              >
                {showDeleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
            {deleteError && (
              <div style={{ color: '#ff6b6b', marginTop: 16, fontWeight: 600 }}>
                {deleteError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {deleteSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(40,32,74,0.92)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="modal-fade" style={{
            background: '#2d2540',
            borderRadius: 12,
            padding: '2.5rem 2rem',
            maxWidth: 440,
            color: '#e6e0ff',
            boxShadow: '0 4px 24px #0006',
            position: 'relative',
            minWidth: 320,
            textAlign: 'center'
          }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              background: '#4caf50', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 4px 16px #4caf5033'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#fff"/>
              </svg>
            </div>
            <h2 style={{ color: '#4caf50', fontWeight: 700, marginBottom: 16 }}>Account Deleted</h2>
            <p style={{ marginBottom: 24, fontSize: '1.1rem', color: '#e6e0ff' }}>
              Your account has been successfully deleted. You will be logged out shortly.
            </p>
            <div style={{ 
              background: '#4caf5022', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: '1px solid #4caf5033',
              marginTop: 16
            }}>
              <p style={{ color: '#4caf50', margin: 0, fontSize: '0.95rem' }}>
                Thank you for using the Boss Crystal Calculator!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Undo Snackbar */}
      {showUndo && undoData && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#23203a',
          color: '#fff',
          borderRadius: 8,
          padding: '1rem 2rem',
          fontWeight: 700,
          fontSize: '1.1rem',
          boxShadow: '0 4px 24px #0006',
          zIndex: 5000,
          display: 'flex',
          alignItems: 'center',
          gap: 18
        }}>
          Character deleted.
          <button
            onClick={handleUndo}
            style={{
              background: '#a259f7',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.5rem 1.2rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: 'pointer',
              marginLeft: 12
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

function EditCharacterName({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isFocused, setIsFocused] = useState(false);
  
  if (!editing) {
    return (
      <button
        className="character-name-edit-btn"
        title="Edit character name"
        onClick={() => setEditing(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path fill="currentColor" d="M20.548 3.452a1.542 1.542 0 0 1 0 2.182l-7.636 7.636-3.273 1.091 1.091-3.273 7.636-7.636a1.542 1.542 0 0 1 2.182 0zM4 21h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-2 0v7H5V6h7a1 1 0 0 0 0-2H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1z"/>
        </svg>
      </button>
    );
  }
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 0, marginRight: 4 }}>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{
          fontSize: '0.95em',
          borderRadius: 8,
          border: isFocused ? '1px solid #a259f7' : '1px solid #4a4370',
          padding: '4px 8px',
          marginRight: 4,
          minWidth: 80,
          maxWidth: 120,
          background: '#3a335a',
          color: '#e6e0ff',
          boxShadow: isFocused ? '0 0 0 2px rgba(162, 89, 247, 0.3), 0 0 10px rgba(255, 255, 255, 0.15)' : 'none',
          transition: 'all 0.25s ease',
          outline: 'none'
        }}
        autoFocus
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(value); setEditing(false); }
          if (e.key === 'Escape') { setEditing(false); setValue(name); }
        }}
      />
      <button
        style={{ 
          background: '#a259f7', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 8, 
          padding: '4px 8px', 
          marginRight: 4, 
          cursor: 'pointer', 
          fontSize: '0.95em',
          boxShadow: '0 2px 6px rgba(162, 89, 247, 0.3)',
          transition: 'all 0.2s ease'
        }}
        onClick={() => { onSave(value); setEditing(false); }}
        title="Save"
        onMouseOver={e => { e.currentTarget.style.background = '#b47aff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#a259f7'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        ✔
      </button>
      <button
        style={{ 
          background: 'transparent', 
          color: '#a259f7', 
          border: '1px solid #a259f7', 
          borderRadius: 8, 
          padding: '4px 8px', 
          cursor: 'pointer', 
          fontSize: '0.95em',
          transition: 'all 0.2s ease'
        }}
        onClick={() => { setEditing(false); setValue(name); }}
        title="Cancel"
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(162, 89, 247, 0.1)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        ✖
      </button>
    </span>
  );
}

export default App
