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
  },
  {
    name: 'Damien',
    difficulties: [
      { difficulty: 'Normal', price: 169000000 },
      { difficulty: 'Hard', price: 421875000 },
    ],
    image: '/bosses/damien.png',
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
  },
  {
    name: 'Will',
    difficulties: [
      { difficulty: 'Easy', price: 246744750 },
      { difficulty: 'Normal', price: 279075000 },
      { difficulty: 'Hard', price: 621810000 },
    ],
    image: '/bosses/will.png',
  },
  {
    name: 'Gloom',
    difficulties: [
      { difficulty: 'Normal', price: 297675000 },
      { difficulty: 'Chaos', price: 563945000 },
    ],
    image: '/bosses/gloom.png',
  },
  {
    name: 'Darknell',
    difficulties: [
      { difficulty: 'Normal', price: 316875000 },
      { difficulty: 'Hard', price: 667920000 },
    ],
    image: '/bosses/darknell.png',
  },
  {
    name: 'Verus Hilla',
    difficulties: [
      { difficulty: 'Normal', price: 581880000 },
      { difficulty: 'Hard', price: 762105000 },
    ],
    image: '/bosses/verus_hilla.png',
  },
  {
    name: 'Chosen Seren',
    difficulties: [
      { difficulty: 'Normal', price: 889021875 },
      { difficulty: 'Hard', price: 1096562500 },
      { difficulty: 'Extreme', price: 4235000000 },
    ],
    image: '/bosses/seren.png',
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
      { difficulty: 'Hard', price: 3745000000 },
      { difficulty: 'Normal', price: 1100000000 },
      { difficulty: 'Hard', price: 2200000000 }
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

function App() {
  // State declarations
  const [characters, setCharacters] = useState([]);
  const [lastDifficulties, setLastDifficulties] = useState({});
  const [lastPartySizes, setLastPartySizes] = useState({});
  const [newCharName, setNewCharName] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [selectedCharIdx, setSelectedCharIdx] = useState(null);
  const [lastPreset, setLastPreset] = useState(null);
  const [error, setError] = useState('');
  const [showWeekly, setShowWeekly] = useState(false);
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
  const [deleteSuccess, setDeleteSuccess] = useState(false);

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
    applyPreset(selectedCharIdx, preset, presetName);
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
    setCharacters(characters.filter((_, i) => i !== idx));
    setSelectedCharIdx(null);
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

  // CTene and Hlom preset boss lists (up to 14)
  const cteneBosses = [
    { name: 'Verus Hilla', difficulty: 'Hard' },
    { name: 'Darknell', difficulty: 'Hard' },
    { name: 'Gloom', difficulty: 'Chaos' },
    { name: 'Will', difficulty: 'Hard' },
    { name: 'Lucid', difficulty: 'Hard' },
    { name: 'Guardian Angel Slime', difficulty: 'Chaos' },
    { name: 'Lotus', difficulty: 'Hard' },
    { name: 'Damien', difficulty: 'Hard' },
    { name: 'Aketchi', difficulty: 'Normal' },
    { name: 'Papulatus', difficulty: 'Chaos' },
    { name: 'Magnus', difficulty: 'Hard' },
    { name: 'Vellum', difficulty: 'Chaos' },
    { name: 'Pierre', difficulty: 'Chaos' },
    { name: 'Crimson Queen', difficulty: 'Chaos' },
    { name: 'Von Bon', difficulty: 'Chaos' },
  ];
  const hlomBosses = [
    { name: 'Damien', difficulty: 'Hard' },
    { name: 'Lotus', difficulty: 'Hard' },
    { name: 'Magnus', difficulty: 'Hard' },
    { name: 'Gloom', difficulty: 'Normal' },
    { name: 'Darknell', difficulty: 'Normal' },
    { name: 'Guardian Angel Slime', difficulty: 'Normal' },
    { name: 'Aketchi', difficulty: 'Normal' },
    { name: 'Lucid', difficulty: 'Easy' },
    { name: 'Vellum', difficulty: 'Chaos' },
    { name: 'Von Bon', difficulty: 'Chaos' },
    { name: 'Crimson Queen', difficulty: 'Chaos' },
    { name: 'Pierre', difficulty: 'Chaos' },
    { name: 'Papulatus', difficulty: 'Chaos' },
    { name: 'Zakum', difficulty: 'Chaos' },
  ];
  const applyPreset = (idx, preset, presetName) => {
    setCharacters(chars => chars.map((char, i) => {
      if (i !== idx) return char;
      
      // If clicking the same preset again, clear those bosses
      if (lastPreset === presetName) {
        setLastPreset(null);
        // Remove all bosses from the preset
        return {
          ...char,
          bosses: char.bosses.filter(b => !preset.some(p => p.name === b.name))
        };
      }

      // If clicking a different preset, first remove all bosses from the previous preset
      if (lastPreset) {
        const previousPreset = lastPreset === 'ctene' ? cteneBosses : hlomBosses;
        char = {
          ...char,
          bosses: char.bosses.filter(b => !previousPreset.some(p => p.name === b.name))
        };
      }

      // Now add the new preset bosses
      setLastPreset(presetName);
      let newBosses = preset.map(cb => {
        const bossObj = bossData.find(b => b.name === cb.name);
        return {
          name: cb.name,
          difficulty: cb.difficulty,
          price: getBossPrice(bossObj, cb.difficulty),
          partySize: 1
        };
      });
      newBosses = newBosses.slice(0, CHARACTER_BOSS_CAP - char.bosses.length);
      return { ...char, bosses: [...char.bosses, ...newBosses] };
    }));
  };

  // Login/Logout logic
  const weekKey = (() => {
    // Returns a string like '2024-23' for year-week, based on UTC
    const now = new Date();
    const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const onejan = new Date(utcNow.getUTCFullYear(), 0, 1);
    const week = Math.ceil((((utcNow - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
    return `${utcNow.getUTCFullYear()}-${week}`;
  })();

  // Initialize checked state from localStorage or Supabase
  useEffect(() => {
    if (isLoggedIn && userCode) {
      const loadData = async () => {
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
        }
      };
      loadData();
    }
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
              weekKey 
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
      syncData();
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
              weekKey 
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
        setUserCode(code);
        setIsLoggedIn(true);
        setCharacters([]);
        setChecked({});
        localStorage.setItem('ms-user-code', code);
      } else {
        setLoginError('Failed to create account. Try again.');
      }
    } catch (error) {
      setLoginError('Failed to create account. Try again.');
    }
    
    setIsCreating(false);
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
            weekKey 
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
                  <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 100, verticalAlign: 'bottom', color: undefined }}>Boss</th>
                  <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 90, color: undefined }}>Difficulty</th>
                  <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 90, color: undefined }}>Mesos</th>
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
                      <td style={{ padding: '8px', textAlign: 'center', minWidth: 110, fontWeight: 600, background: 'inherit' }}>
                        <span style={{ color: '#6a11cb' }}>{item.price.toLocaleString()}</span>
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
            style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: 6, padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, opacity: isCreating || createCooldown > 0 ? 0.6 : 1, cursor: isCreating || createCooldown > 0 ? 'not-allowed' : 'pointer', transition: 'all 0.18s cubic-bezier(.4,2,.6,1)', boxShadow: '0 2px 8px #a259f733', ...(isCreating || createCooldown > 0 ? {} : { ':hover': { background: '#b47aff', transform: 'scale(1.04)', boxShadow: '0 4px 16px #a259f799', } }) }}
            onMouseOver={e => { if (!(isCreating || createCooldown > 0)) { e.currentTarget.style.background = '#b47aff'; e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 16px #a259f799'; } }}
            onMouseOut={e => { e.currentTarget.style.background = '#a259f7'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px #a259f733'; }}
          >
            Create Account{createCooldown > 0 ? ` (${createCooldown})` : ''}
          </button>
          {cooldownMsg && <div style={{ color: '#ffbaba', fontSize: '1em', marginBottom: 4 }}>{cooldownMsg}</div>}
          <div style={{ width: '100%', textAlign: 'center', color: '#b39ddb', fontSize: '1.2rem', fontWeight: 700, margin: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, height: 1, background: '#3a335a' }}></span>
            <span style={{ fontSize: '1.2em', fontWeight: 700 }}>or</span>
            <span style={{ flex: 1, height: 1, background: '#3a335a' }}></span>
          </div>
          <input
            value={loginInput}
            onChange={e => setLoginInput(e.target.value.toUpperCase())}
            placeholder="Enter your code"
            style={{ background: '#3a335a', color: '#e6e0ff', border: loginInputFocused ? '2px solid #a259f7' : '1.5px solid #2d2540', borderRadius: 6, padding: '0.5rem 1rem', fontSize: '1.1rem', width: '100%', marginBottom: 8, outline: loginInputFocused ? '0 0 0 2px #a259f7' : 'none', boxShadow: loginInputFocused ? '0 0 0 2px #a259f755' : 'none', transition: 'border 0.18s, box-shadow 0.18s', }}
            onFocus={() => setLoginInputFocused(true)}
            onBlur={() => setLoginInputFocused(false)}
          />
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
      </div>
    );
  }

  return (
    <div className="App dark" style={{ background: '#28204a', minHeight: '100vh', color: '#e6e0ff', padding: '2rem 0', border: '1.5px solid #2d2540' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/bluecrystal.png" alt="Blue Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" style={{ width: 32, height: 32 }} />
      </div>
      <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2.2rem', marginBottom: '0.5rem' }}>Maplestory Boss Crystal Calculator</h1>
      <p style={{ color: '#6a11cb', textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem' }}>Create characters, select bosses, and calculate your total crystal value!</p>
      <button onClick={() => setShowTable(true)} style={{ background: '#805ad5', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', cursor: 'pointer', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
        View Boss Price Table
      </button>
      <button onClick={() => setShowWeekly(true)} style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', cursor: 'pointer', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
        Weekly Tracker
      </button>
      <div className={`table-container${selectedCharIdx !== null && characters[selectedCharIdx] ? ' wide' : ''}`} style={{ background: '#2d2540', borderRadius: 8, boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)', padding: '1rem', border: '1.5px solid #2d2540' }}>
        {error && <div style={{ color: 'red', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}
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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-1rem', marginBottom: '1rem' }}>
          <button
            className="delete-all-characters-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete all characters?')) {
                setCharacters([]);
                setSelectedCharIdx(null);
              }
            }}
            style={{ 
              background: 'transparent', 
              color: '#666', 
              border: 'none', 
              padding: '0.3rem 0.8rem', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              textDecoration: 'underline',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseOver={e => e.target.style.opacity = 1}
            onMouseOut={e => e.target.style.opacity = 0.7}
          >
            Delete All Characters
          </button>
        </div>
        {characters.length === 0 ? (
          <div style={{ padding: '2rem', color: '#888', fontSize: '1.2rem', textAlign: 'center' }}>
            <span role="img" aria-label="sparkles">✨</span> No characters yet. Add a character to get started!
          </div>
        ) : (
          <>
            <div className="char-header-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
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
                  <button 
                    className="boton-elegante clone" 
                    onClick={() => cloneCharacter(selectedCharIdx)}
                  >
                    Clone
                  </button>
                  <button 
                    className="boton-elegante ctene" 
                    onClick={() => handlePresetApply(cteneBosses, 'ctene')}
                  >
                    CTene
                  </button>
                  <button 
                    className="boton-elegante hlom" 
                    onClick={() => handlePresetApply(hlomBosses, 'hlom')}
                  >
                    HLom
                  </button>
                  <button 
                    className="boton-elegante delete" 
                    onClick={() => removeCharacter(selectedCharIdx)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
            {selectedCharIdx === null || !characters[selectedCharIdx] ? (
              <div style={{ padding: '2rem', color: '#888', fontSize: '1.1rem', textAlign: 'center' }}>
                <span role="img" aria-label="arrow">⬅️</span> Select a character to view and manage bosses.
              </div>
            ) : (
              <>
                {characters[selectedCharIdx].bosses.length === 0 && (
                  <div style={{ padding: '1rem', color: '#888', fontSize: '1.1rem', textAlign: 'center' }}>
                    <span role="img" aria-label="boss">👾</span> No bosses selected for this character. Use the checkboxes to add bosses!
                  </div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, border: '1px solid #2d2540', borderRadius: 12, overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#3a2a5d', color: '#e6e0ff' }}>
                      <th style={{ padding: '6px 2px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 70, verticalAlign: 'bottom', color: undefined }}>Boss</th>
                      <th style={{ padding: '6px 2px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 90, color: undefined }}>Difficulty</th>
                      <th className="boss-table-price" style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 70, color: undefined }}>Mesos</th>
                      <th className="boss-table-controls" style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 160, color: undefined }}>{selectedCharIdx !== null ? characters[selectedCharIdx]?.name : 'Selected Character'}</th>
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
              </>
            )}
          </>
        )}
      </div>
      <div style={{ marginTop: '2rem', fontSize: '1.2rem', fontWeight: 'bold', color: undefined, textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 28, height: 28, verticalAlign: 'middle', marginRight: 4 }} />
          Overall Total: <span style={{ color: '#a259f7' }}>{overallTotal.toLocaleString()} meso</span>
        </span>
        <br />
        <span style={{ fontSize: '1rem', color: '#6a11cb' }}>Bosses selected: {totalBossCount()} / {TOTAL_BOSS_CAP}</span>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#28204a',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #a259f7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        </div>
      )}

      {showDeleteLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#28204a', padding: '2rem', borderRadius: '12px', color: '#fff', fontWeight: 600 }}>
            Deleting account...
          </div>
        </div>
      )}
      {deleteError && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ffbaba', color: '#a00', padding: '1rem', textAlign: 'center', zIndex: 2001 }}>
          {deleteError}
          <button onClick={() => setDeleteError('')} style={{ marginLeft: 16, background: '#fff', color: '#a00', border: '1px solid #a00', borderRadius: 6, padding: '2px 10px', fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      {showCloudSync && (
        <span style={{ marginLeft: 8, verticalAlign: 'middle', display: 'inline-block', animation: 'cloudPop 0.5s' }} title="Data synced to cloud">
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="11" cy="10" rx="9" ry="6" fill="#a259f7"/>
            <ellipse cx="7" cy="8" rx="4" ry="3" fill="#b39ddb"/>
            <ellipse cx="15" cy="8" rx="4" ry="3" fill="#b39ddb"/>
          </svg>
        </span>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes cloudPop {
            0% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0; transform: scale(0.8); }
          }
          @media (max-width: 600px) {
            /* Top bar: compact, horizontal scroll if needed */
            div[style*='position: absolute'][style*='top: 18px'] {
              position: static !important;
              display: flex !important;
              flex-direction: row !important;
              flex-wrap: wrap !important;
              align-items: center !important;
              gap: 6px !important;
              margin-bottom: 12px;
              width: 100vw;
              left: 0 !important;
              right: 0 !important;
              top: 0 !important;
              z-index: 100;
              overflow-x: auto;
              justify-content: flex-start;
            }
            div[style*='position: absolute'][style*='top: 18px'] > * {
              margin: 0 !important;
              min-width: 0;
              width: auto !important;
              max-width: 90vw;
              font-size: 0.95em !important;
              padding: 0.5rem 1rem !important;
              box-sizing: border-box;
              flex: 0 0 auto;
            }
            /* Code and cloud icon */
            div[style*='position: absolute'][style*='top: 18px'] span {
              font-size: 0.9em !important;
              word-break: break-all;
              text-align: center;
              margin: 0 4px !important;
              width: auto;
              display: inline-block;
            }
            /* Main content */
            .App.dark > * {
              max-width: 100vw !important;
              box-sizing: border-box;
            }
            /* Character controls row */
            .char-header-row {
              display: flex !important;
              flex-direction: row !important;
              flex-wrap: wrap !important;
              gap: 6px !important;
              align-items: center !important;
              justify-content: flex-start !important;
              margin-bottom: 10px !important;
            }
            .char-header-row > * {
              min-width: 0;
              width: auto !important;
              max-width: 90vw;
              font-size: 0.95em !important;
              padding: 0.5rem 1rem !important;
              margin: 0 !important;
              flex: 0 0 auto;
            }
            /* Table scroll container */
            .table-scroll {
              width: 100%;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            table {
              min-width: 650px !important;
              width: auto !important;
              max-width: none !important;
              display: table;
              font-size: 0.95em;
            }
            thead, tbody, tr {
              display: table-row;
              width: auto;
              table-layout: auto;
            }
            th, td {
              padding: 6px 2px !important;
              font-size: 0.95em !important;
              white-space: nowrap;
            }
            /* Inputs and main containers */
            input, select {
              font-size: 1em !important;
              min-height: 44px !important;
              width: 100% !important;
              max-width: 100%;
              box-sizing: border-box;
            }
            button {
              font-size: 0.95em !important;
              min-height: 38px !important;
              width: auto !important;
              max-width: 90vw;
              padding: 0.5rem 1rem !important;
              margin-bottom: 4px !important;
              box-sizing: border-box;
              border-radius: 12px !important;
            }
            .table-container {
              min-width: 0 !important;
              width: 100vw !important;
              padding: 0.5rem !important;
            }
            /* Modal overlays */
            [style*='position: fixed'][style*='z-index: 3000'],
            [style*='position: fixed'][style*='z-index: 4000'],
            [style*='position: fixed'][style*='z-index: 4100'] {
              padding: 0 !important;
              align-items: flex-start !important;
            }
            [style*='position: fixed'][style*='z-index: 3000'] > div,
            [style*='position: fixed'][style*='z-index: 4000'] > div,
            [style*='position: fixed'][style*='z-index: 4100'] > div {
              width: 98vw !important;
              max-width: 98vw !important;
              min-width: 0 !important;
              padding: 1.2rem 0.5rem !important;
              font-size: 1em !important;
            }
            html, body {
              overflow-x: hidden !important;
            }
          }
        `}
      </style>
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div style={{ position: 'absolute', top: 18, right: 32, zIndex: 10 }}>
        <button onClick={handleLogout} style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: '20px', padding: '0.4rem 1.2rem', fontWeight: 700, fontSize: '1rem', boxShadow: '0 2px 8px #0002', cursor: 'pointer', transition: 'all 0.2s', marginRight: 8 }}>Logout</button>
        <button onClick={() => setShowDeleteConfirm(true)} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '20px', padding: '0.4rem 1.2rem', fontWeight: 700, fontSize: '1rem', boxShadow: '0 2px 8px #0002', cursor: 'pointer', transition: 'all 0.2s', marginRight: 8 }}>Delete Account</button>
        <button onClick={() => setShowHelp(true)} style={{ background: '#805ad5', color: '#fff', border: 'none', borderRadius: '20px', padding: '0.4rem 1.2rem', fontWeight: 700, fontSize: '1rem', boxShadow: '0 2px 8px #0002', cursor: 'pointer', transition: 'all 0.2s', marginRight: 8 }}>Help</button>
        <span style={{ marginLeft: 12, color: '#b39ddb', fontSize: '0.95em' }}>Code: {userCode}</span>
      </div>

      {showHelp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(40,32,74,0.96)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#2d2540', borderRadius: 12, padding: '2.5rem 2rem', maxWidth: 480, color: '#e6e0ff', boxShadow: '0 4px 24px #0006', position: 'relative' }}>
            <button onClick={() => setShowHelp(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', color: '#fff', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} title="Close">×</button>
            <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 16 }}>Help & FAQ</h2>
            <div style={{ fontSize: '1.08rem', lineHeight: 1.6 }}>
              <b>What is this site?</b><br />
              This is a Maplestory Boss Crystal Calculator and Weekly Tracker. You can manage your characters, track boss clears, and sync your data to the cloud.
              <br /><br />
              <b>How does the code system work?</b><br />
              When you create an account, you get a unique code. Use this code to log in from any device and access your data. <b>Keep your code safe!</b>
              <br /><br />
              <b>How is my data saved?</b><br />
              Your data is saved to the cloud (Supabase) and automatically synced whenever you make changes. A cloud icon will briefly appear when your data is synced.
              <br /><br />
              <b>When does the weekly reset happen?</b><br />
              The weekly reset is every Thursday at 00:00 UTC. Your boss clears will reset automatically.
              <br /><br />
              <b>How can I recover my data?</b><br />
              If you lose your code, your data cannot be recovered. Consider writing down your code or exporting your data (feature coming soon).
              <br /><br />
              <b>Need more help?</b><br />
              Contact the developer or check for updates.
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(40,32,74,0.92)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#2d2540', borderRadius: 12, padding: '2.5rem 2rem', maxWidth: 400, color: '#e6e0ff', boxShadow: '0 4px 24px #0006', position: 'relative', textAlign: 'center' }}>
            <h2 style={{ color: '#ff6b6b', fontWeight: 700, marginBottom: 16 }}>Delete Account</h2>
            <div style={{ fontSize: '1.08rem', lineHeight: 1.6, marginBottom: 24 }}>
              Are you <b>sure</b> you want to delete your account?<br />
              <span style={{ color: '#ffbaba', fontWeight: 600 }}>This cannot be undone!</span>
            </div>
            <button onClick={handleDeleteAccount} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', marginRight: 12, cursor: 'pointer' }}>Yes, Delete</button>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ background: '#805ad5', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(40,32,74,0.92)', zIndex: 4100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#2d2540', borderRadius: 12, padding: '2.5rem 2rem', maxWidth: 400, color: '#e6e0ff', boxShadow: '0 4px 24px #0006', textAlign: 'center' }}>
            <h2 style={{ color: '#38a169', fontWeight: 700, marginBottom: 16 }}>Account Deleted</h2>
            <div style={{ fontSize: '1.08rem', lineHeight: 1.6 }}>
              Your account and all data have been deleted.<br />
              You will be logged out.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditCharacterName({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  if (!editing) {
    return (
      <button
        className="editBtn"
        title="Edit character name"
        onClick={() => setEditing(true)}
      >
        <svg height="1em" viewBox="0 0 512 512">
          <path
            d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"
          ></path>
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
          borderRadius: 6,
          border: '1px solid #a259f7',
          padding: '2px 6px',
          marginRight: 2,
          minWidth: 70,
          maxWidth: 120
        }}
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(value); setEditing(false); }
          if (e.key === 'Escape') { setEditing(false); setValue(name); }
        }}
      />
      <button
        style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 6px', marginRight: 2, cursor: 'pointer', fontSize: '0.95em' }}
        onClick={() => { onSave(value); setEditing(false); }}
        title="Save"
      >
        ✔
      </button>
      <button
        style={{ background: 'transparent', color: '#a259f7', border: 'none', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontSize: '0.95em' }}
        onClick={() => { setEditing(false); setValue(name); }}
        title="Cancel"
      >
        ✖
      </button>
    </span>
  );
}

export default App
