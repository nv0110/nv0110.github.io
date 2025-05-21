import { useState, useRef, useMemo, useEffect } from 'react'
import './App.css'
import WeeklyTracker from './WeeklyTracker'

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
  const [characters, setCharacters] = useState(() => {
    const saved = localStorage.getItem('ms-characters');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastDifficulties, setLastDifficulties] = useState(() => {
    const saved = localStorage.getItem('ms-lastDifficulties');
    return saved ? JSON.parse(saved) : {};
  });
  const [lastPartySizes, setLastPartySizes] = useState(() => {
    const saved = localStorage.getItem('ms-lastPartySizes');
    return saved ? JSON.parse(saved) : {};
  });
  const [newCharName, setNewCharName] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [selectedCharIdx, setSelectedCharIdx] = useState(() => {
    const saved = localStorage.getItem('ms-selectedCharIdx');
    return saved ? JSON.parse(saved) : null;
  });
  const [lastPreset, setLastPreset] = useState(() => {
    const saved = localStorage.getItem('ms-lastPreset');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ms-darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [showWeekly, setShowWeekly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressData, setProgressData] = useState(() => {
    const saved = localStorage.getItem('ms-progress');
    return saved ? JSON.parse(saved) : {
      weeklyTotal: 0,
      lastReset: new Date().toISOString(),
      history: []
    };
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('ms-characters', JSON.stringify(characters));
  }, [characters]);
  useEffect(() => {
    localStorage.setItem('ms-lastDifficulties', JSON.stringify(lastDifficulties));
  }, [lastDifficulties]);
  useEffect(() => {
    localStorage.setItem('ms-lastPartySizes', JSON.stringify(lastPartySizes));
  }, [lastPartySizes]);
  useEffect(() => {
    localStorage.setItem('ms-selectedCharIdx', JSON.stringify(selectedCharIdx));
  }, [selectedCharIdx]);
  useEffect(() => {
    localStorage.setItem('ms-lastPreset', JSON.stringify(lastPreset));
  }, [lastPreset]);
  useEffect(() => {
    localStorage.setItem('ms-darkMode', JSON.stringify(darkMode));
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

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
    localStorage.setItem('ms-progress', JSON.stringify(progressData));
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

  // Dynamic sorting based on selected value for current character, otherwise max possible value
  const dynamicSortedBossData = useMemo(() => {
    if (selectedCharIdx === null || !characters[selectedCharIdx]) {
      return [...bossData].sort((a, b) => {
        const maxPriceA = Math.max(...a.difficulties.map(d => d.price));
        const maxPriceB = Math.max(...b.difficulties.map(d => d.price));
        return maxPriceB - maxPriceA;
      });
    }
    const char = characters[selectedCharIdx];
    
    // Split bosses into selected and unselected
    const selectedBosses = [...bossData].filter(boss => 
      char.bosses.some(b => b.name === boss.name)
    );
    const unselectedBosses = [...bossData].filter(boss => 
      !char.bosses.some(b => b.name === boss.name)
    );

    // Sort selected bosses by their actual selected value
    selectedBosses.sort((a, b) => {
      const selectedA = char.bosses.find(boss => boss.name === a.name);
      const selectedB = char.bosses.find(boss => boss.name === b.name);
      const valueA = getBossPrice(a, selectedA.difficulty) / (selectedA.partySize || 1);
      const valueB = getBossPrice(b, selectedB.difficulty) / (selectedB.partySize || 1);
      return valueB - valueA;
    });

    // Sort unselected bosses by their maximum possible value
    unselectedBosses.sort((a, b) => {
      const maxPriceA = Math.max(...a.difficulties.map(d => d.price));
      const maxPriceB = Math.max(...b.difficulties.map(d => d.price));
      return maxPriceB - maxPriceA;
    });

    // Combine the sorted arrays
    return [...selectedBosses, ...unselectedBosses];
  }, [selectedCharIdx, characters]);

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

  // Table view
  if (showTable) {
    return (
      <div className={`App${darkMode ? ' dark' : ''}`} style={{ background: darkMode ? '#28204a' : '#f4f6fb', minHeight: '100vh', color: darkMode ? '#e6e0ff' : '#222', padding: '2rem 0' }}>
        <button onClick={() => setShowTable(false)} style={{ background: darkMode ? '#805ad5' : '#a259f7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', cursor: 'pointer' }}>← Back to Calculator</button>
        <div style={{ background: darkMode ? '#28204a' : '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: darkMode ? '0 2px 8px rgba(40, 20, 60, 0.18)' : '0 2px 8px #0002', maxWidth: 900, margin: '0 auto', border: darkMode ? '1.5px solid #6a11cb' : 'none' }}>
          <h2 style={{ color: darkMode ? '#a259f7' : '#6a11cb', marginBottom: '1rem', textAlign: 'center', fontWeight: 700 }}>Boss Crystal Price Table</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: darkMode ? '#3a2a5d' : '#444', color: '#fff' }}>
                <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', borderRadius: '6px 0 0 0', minWidth: 100, verticalAlign: 'bottom', color: darkMode ? '#e6e0ff' : undefined }}>Boss</th>
                <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 90, color: darkMode ? '#e6e0ff' : undefined }}>Difficulty</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 90, color: darkMode ? '#e6e0ff' : undefined }}>Mesos</th>
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
                  <tr key={item.boss.name + '-' + item.difficulty} style={{ background: idx % 2 === 0 ? (darkMode ? '#23203a' : '#f4f6fb') : (darkMode ? '#201c32' : '#e9e9ef'), border: darkMode ? '1px solid #3a335a' : 'none' }}>
                    <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 100 }}>
                      {item.boss.image && (
                        <img src={item.boss.image} alt={item.boss.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, background: darkMode ? '#fff1' : '#fff2', marginRight: 8 }} />
                      )}
                      <span className="boss-name" style={{ fontWeight: 600, fontSize: '1.05em', color: darkMode ? '#e6e0ff' : '#222' }}>{item.boss.name}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'left', minWidth: 90 }}>
                      <span style={{ color: darkMode ? '#e6e0ff' : '#222', fontWeight: 500 }}>{item.difficulty}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', minWidth: 110, fontWeight: 600, background: 'inherit' }}>
                      <span style={{ color: darkMode ? '#e6e0ff' : '#6a11cb' }}>{item.price.toLocaleString()}</span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (showWeekly) {
    return <WeeklyTracker characters={characters} bossData={bossData} onBack={() => setShowWeekly(false)} />;
  }

  // Main calculator view
  return (
    <div className={`App${darkMode ? ' dark' : ''}`} style={{ background: darkMode ? '#28204a' : '#f4f6fb', minHeight: '100vh', color: darkMode ? '#e6e0ff' : '#222', padding: '2rem 0' }}>
      <div style={{ position: 'absolute', top: 18, right: 32, zIndex: 10 }}>
        <button
          onClick={() => setDarkMode(d => !d)}
          style={{
            background: darkMode ? '#fff' : '#222',
            color: darkMode ? '#222' : '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '0.4rem 1.2rem',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 2px 8px #0002',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/bluecrystal.png" alt="Blue Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" style={{ width: 32, height: 32 }} />
      </div>
      <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2.2rem', marginBottom: '0.5rem', color: darkMode ? '#a259f7' : '#222' }}>Maplestory Boss Crystal Calculator</h1>
      <p style={{ color: darkMode ? '#b39ddb' : '#6a11cb', textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem' }}>Create characters, select bosses, and calculate your total crystal value!</p>
      <button onClick={() => setShowTable(true)} style={{ background: darkMode ? '#805ad5' : '#a259f7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', cursor: 'pointer', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
        View Boss Price Table
      </button>
      <button onClick={() => setShowWeekly(true)} style={{ background: darkMode ? '#a259f7' : '#805ad5', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', cursor: 'pointer', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
        Weekly Tracker
      </button>
      <div className={`table-container${selectedCharIdx !== null && characters[selectedCharIdx] ? ' wide' : ''}`} style={{ background: darkMode ? '#28204a' : '#fff', borderRadius: 8, boxShadow: darkMode ? '0 2px 8px rgba(40, 20, 60, 0.18)' : '0 2px 8px #0001', padding: '1rem', border: darkMode ? '1.5px solid #6a11cb' : 'none' }}>
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
              border: darkMode ? '1px solid #6a11cb' : '1px solid #ccc', 
              minWidth: '180px', 
              fontSize: '1rem', 
              background: darkMode ? '#3a335a' : '#fff', 
              color: darkMode ? '#e6e0ff' : '#222',
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
                  background: darkMode ? '#3a335a' : '#fff',
                  color: darkMode ? '#e6e0ff' : '#222',
                  border: darkMode ? '1px solid #6a11cb' : '1px solid #ccc',
                  borderRadius: 10,
                  fontSize: '1.1em',
                  minWidth: 140,
                  height: 36,
                  boxShadow: darkMode ? 'none' : '0 1px 4px #0001',
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
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: darkMode ? '#3a2a5d' : '#444', color: '#fff' }}>
                      <th style={{ padding: '6px 2px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', borderRadius: '6px 0 0 0', minWidth: 70, verticalAlign: 'bottom', color: darkMode ? '#e6e0ff' : undefined }}>Boss</th>
                      <th style={{ padding: '6px 2px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 90, color: darkMode ? '#e6e0ff' : undefined }}>Difficulty</th>
                      <th className="boss-table-price" style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 70, color: darkMode ? '#e6e0ff' : undefined }}>Mesos</th>
                      <th className="boss-table-controls" style={{ padding: '6px 2px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 160, borderRadius: '0 6px 0 0', color: darkMode ? '#e6e0ff' : undefined }}>{selectedCharIdx !== null ? characters[selectedCharIdx]?.name : 'Selected Character'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicSortedBossData.map((boss, bidx) => {
                      const difficulties = getBossDifficulties(boss);
                      const selected = selectedCharIdx !== null ? characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name) : null;
                      return (
                        <tr 
                          key={bidx} 
                          style={{ 
                            background: darkMode ? (bidx % 2 === 0 ? '#23203a' : '#201c32') : (bidx % 2 === 0 ? '#f4f6fb' : '#e9e9ef'), 
                            border: darkMode ? '1px solid #3a335a' : 'none',
                            transition: 'background-color 0.2s ease, transform 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = darkMode ? '#2a2540' : '#eef0f5'}
                          onMouseOut={e => e.currentTarget.style.background = darkMode ? (bidx % 2 === 0 ? '#23203a' : '#201c32') : (bidx % 2 === 0 ? '#f4f6fb' : '#e9e9ef')}
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
                                  background: darkMode ? '#fff1' : '#fff2', 
                                  marginRight: 8,
                                  transition: 'transform 0.2s ease'
                                }} 
                                onMouseOver={e => e.target.style.transform = 'scale(1.1)'}
                                onMouseOut={e => e.target.style.transform = 'scale(1)'}
                              />
                            )}
                            <span className="boss-name" style={{ fontWeight: 600, fontSize: '1.05em', color: darkMode ? '#e6e0ff' : '#222' }}>{boss.name}</span>
                          </td>
                          <td style={{ padding: '8px 2px', textAlign: 'left', minWidth: 90 }}>
                            <span style={{ color: darkMode ? '#e6e0ff' : '#222', fontWeight: 500 }}>{selected ? selected.difficulty : '—'}</span>
                          </td>
                          <td className="boss-table-price" style={{ padding: '8px 2px', textAlign: 'center', minWidth: 70, fontWeight: 600, background: 'inherit', verticalAlign: 'middle' }}>
                            <span style={{ color: darkMode ? '#e6e0ff' : '#6a11cb' }}>{selected && selected.difficulty && Math.floor(getBossPrice(boss, selected.difficulty) / (selected.partySize || 1)).toLocaleString()}</span>
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
                                        border: darkMode ? '1px solid #3a335a' : '1px solid #ccc', 
                                        background: darkMode ? '#181622' : '#222', 
                                        color: '#fff', 
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
                                        border: darkMode ? '1px solid #3a335a' : '1px solid #ccc', 
                                        background: darkMode ? '#181622' : '#222', 
                                        color: '#fff', 
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
      <div style={{ marginTop: '2rem', fontSize: '1.2rem', fontWeight: 'bold', color: darkMode ? '#e6e0ff' : '#222', textAlign: 'center' }}>
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
            background: darkMode ? '#28204a' : '#fff',
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

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

function EditCharacterName({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  useEffect(() => { setValue(name); }, [name]);
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
