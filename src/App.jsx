import { useState, useRef, useMemo } from 'react'
import './App.css'

// Boss data, grouped by boss name with difficulties as array
const bossData = [

  {
    name: 'Pink Bean',
    difficulties: [
      { difficulty: 'Chaos', price: 64000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/PinkBean.png',
  },
  {
    name: 'Cygnus',
    difficulties: [
      { difficulty: 'Normal', price: 72250000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/cygnus.png',
  },
  {
    name: 'Zakum',
    difficulties: [
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/zakum.png',
  },
  {
    name: 'Crimson Queen',
    difficulties: [
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/crimsonqueen.png',
  },
  {
    name: 'Von Bon',
    difficulties: [
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/von_bon.png',
  },
  {
    name: 'Pierre',
    difficulties: [
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/pierre.png',
  },
  {
    name: 'Magnus',
    difficulties: [
      { difficulty: 'Hard', price: 95062500 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/magnus.png',
  },
  {
    name: 'Vellum',
    difficulties: [
      { difficulty: 'Chaos', price: 105062500 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/vellum.png',
  },
  {
    name: 'Papulatus',
    difficulties: [
      { difficulty: 'Chaos', price: 132250000 },
    ],
      image: '/maplestory-boss-crystal-calculator/bosses/Papulatus.png', 
  },
  {     
    name: 'Aketchi',
    difficulties: [
      { difficulty: 'Normal', price: 144000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/akechi.png',
  },
  {
    name: 'Lotus',
    difficulties: [
      { difficulty: 'Normal', price: 162562500 },
      { difficulty: 'Hard', price: 444675000 },
      { difficulty: 'Extreme', price: 1397500000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/lotus.png',
  },
  {
    name: 'Damien',
    difficulties: [
      { difficulty: 'Normal', price: 169000000 },
      { difficulty: 'Hard', price: 421875000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/damien.png',
  },
  {
    name: 'Guardian Angel Slime',
    difficulties: [
      { difficulty: 'Normal', price: 231673500 },
      { difficulty: 'Hard', price: 600578125 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/slime.png',
  },
  {
    name: 'Lucid',
    difficulties: [
      { difficulty: 'Easy', price: 237009375 },
      { difficulty: 'Normal', price: 253828125 },
      { difficulty: 'Hard', price: 504000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/lucid.png',
  },
  {
    name: 'Will',
    difficulties: [
      { difficulty: 'Easy', price: 246744750 },
      { difficulty: 'Normal', price: 279075000 },
      { difficulty: 'Hard', price: 621810000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/will.png',
  },
  {
    name: 'Gloom',
    difficulties: [
      { difficulty: 'Normal', price: 297675000 },
      { difficulty: 'Chaos', price: 563945000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/gloom.png',
  },
  {
    name: 'Darknell',
    difficulties: [
      { difficulty: 'Normal', price: 316875000 },
      { difficulty: 'Hard', price: 667920000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/darknell.png',
  },
  {
    name: 'Verus Hilla',
    difficulties: [
      { difficulty: 'Normal', price: 581880000 },
      { difficulty: 'Hard', price: 762105000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/verus_hilla.png',
  },
  {
    name: 'Chosen Seren',
    difficulties: [
      { difficulty: 'Normal', price: 889021875 },
      { difficulty: 'Hard', price: 1096562500 },
      { difficulty: 'Extreme', price: 4235000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/seren.png',
  },
  {
    name: 'Watcher Kalos',
    difficulties: [
      { difficulty: 'Easy', price: 937500000 },
      { difficulty: 'Normal', price: 1300000000 },
      { difficulty: 'Chaos', price: 2600000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/Kalos.png',
  },
  {
    name: 'Kaling',
    difficulties: [
      { difficulty: 'Easy', price: 1031250000 },
      { difficulty: 'Normal', price: 1506500000 },
      { difficulty: 'Hard', price: 2990000000 },
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/Kaling.png',
  },
  {
    name: 'Limbo',
    difficulties: [
      { difficulty: 'Normal', price: 1100000000 },
      { difficulty: 'Hard', price: 2200000000 }
    ],
    image: '/maplestory-boss-crystal-calculator/bosses/limbo.png',
  },
];

const CHARACTER_BOSS_CAP = 14;
const TOTAL_BOSS_CAP = 180;

function App() {
  // State declarations
  const [characters, setCharacters] = useState([]);
  const [lastDifficulties, setLastDifficulties] = useState({});
  const [lastPartySizes, setLastPartySizes] = useState({}); // Store last selected party sizes per character
  const [newCharName, setNewCharName] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [selectedCharIdx, setSelectedCharIdx] = useState(null);
  const [lastPreset, setLastPreset] = useState(null);

  // Dynamic sorting based on price only
  const dynamicSortedBossData = useMemo(() => {
    return [...bossData].sort((a, b) => {
      // Get max price for each boss
      const maxPriceA = Math.max(...a.difficulties.map(d => d.price));
      const maxPriceB = Math.max(...b.difficulties.map(d => d.price));
      
      return maxPriceB - maxPriceA; // Descending order by price
    });
  }, []); // Sort is static based on price only

  // Add a new character
  const addCharacter = () => {
    if (!newCharName.trim()) return;
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

  const updatePartySize = (charIdx, bossName, difficulty, newSize) => {
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

  const getBossDifficulties = boss => boss.difficulties.map(d => d.difficulty);

  // Helper: get price for a boss/difficulty
  const getBossPrice = (boss, difficulty) => {
    const d = boss.difficulties.find(d => d.difficulty === difficulty);
    return d ? d.price : 0;
  };

  // Total bosses selected across all characters
  const totalBossCount = () => characters.reduce((sum, c) => sum + c.bosses.length, 0);

  // Total meso value for a character (split by party size)
  const charTotal = (char) => char.bosses.reduce((sum, b) => sum + (b.price / (b.partySize || 1)), 0);

  // Total meso value for all characters
  const overallTotal = characters.reduce((sum, c) => sum + charTotal(c), 0);

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
    { name: 'Guardian Angel Slime', difficulty: 'Hard' },
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
    { name: 'Lotus', difficulty: 'Hard' },
    { name: 'Damien', difficulty: 'Hard' },
    { name: 'Aketchi', difficulty: 'Normal' },
    { name: 'Papulatus', difficulty: 'Chaos' },
    { name: 'Magnus', difficulty: 'Hard' },
    { name: 'Vellum', difficulty: 'Chaos' },
    { name: 'Pierre', difficulty: 'Chaos' },
    { name: 'Crimson Queen', difficulty: 'Chaos' },
    { name: 'Von Bon', difficulty: 'Chaos' },
    { name: 'Lucid', difficulty: 'Easy' },
    { name: 'Guardian Angel Slime', difficulty: 'Normal' },
    { name: 'Zakum', difficulty: 'Chaos' },
    { name: 'Cygnus', difficulty: 'Normal' },
  ];
  const applyPreset = (idx, preset, presetName) => {
    setCharacters(chars => chars.map((char, i) => {
      if (i !== idx) return char;
      
      // If clicking the same preset again, clear those bosses
      if (lastPreset === presetName) {
        setLastPreset(null);
        return {
          ...char,
          bosses: char.bosses.filter(b => !preset.some(p => p.name === b.name))
        };
      }

      // If clicking a different preset, remove previous preset bosses and add new ones
      setLastPreset(presetName);
      
      // Remove all bosses that are in either preset
      const allPresetBosses = [...cteneBosses, ...hlomBosses].map(b => b.name);
      let filtered = char.bosses.filter(b => !allPresetBosses.includes(b.name));
      
      // Add new preset bosses
      let newBosses = preset.map(cb => {
        const bossObj = bossData.find(b => b.name === cb.name);
        return {
          name: cb.name,
          difficulty: cb.difficulty,
          price: getBossPrice(bossObj, cb.difficulty),
          partySize: 1
        };
      });
      
      newBosses = newBosses.slice(0, CHARACTER_BOSS_CAP - filtered.length);
      return { ...char, bosses: [...filtered, ...newBosses] };
    }));
  };

  // Table view
  if (showTable) {
    return (
      <div className="App" style={{ background: '#f4f6fb', minHeight: '100vh', color: '#222', padding: '2rem 0' }}>
        <button onClick={() => setShowTable(false)} style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', cursor: 'pointer' }}>← Back to Calculator</button>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px #0002', maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ color: '#6a11cb', marginBottom: '1rem', textAlign: 'center', fontWeight: 700 }}>Boss Crystal Price Table</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#444', color: '#fff' }}>
                <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', borderRadius: '6px 0 0 0', minWidth: 150, verticalAlign: 'bottom' }}>Boss</th>
                <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600, fontSize: '0.9em', minWidth: 90 }}>Mesos</th>
                <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 200, borderRadius: '0 6px 0 0' }}>{selectedCharIdx !== null ? characters[selectedCharIdx]?.name : 'Selected Character'}</th>
              </tr>
            </thead>
            <tbody>
              {dynamicSortedBossData.map((boss, bidx) => {
                const difficulties = getBossDifficulties(boss);
                return (
                  <tr key={bidx} style={{ background: bidx % 2 === 0 ? '#f4f6fb' : '#e9e9ef' }}>
                    <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                      {boss.image && (
                        <img src={boss.image} alt={boss.name} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: '#fff2', marginRight: 8 }} />
                      )}
                      <span style={{ fontWeight: 600, color: '#222', fontSize: '1.05em' }}>{boss.name}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', minWidth: 110, color: '#6a11cb', fontWeight: 600, background: 'inherit' }}>
                      {selectedCharIdx !== null && characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name)?.difficulty &&
                        Math.floor(getBossPrice(boss, characters[selectedCharIdx].bosses.find(b => b.name === boss.name).difficulty) / 
                        (characters[selectedCharIdx].bosses.find(b => b.name === boss.name).partySize || 1)).toLocaleString()
                      }
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', minWidth: 120, background: 'inherit' }}>
                      {selectedCharIdx !== null && (
                        <div className="boss-controls">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              checked={!!characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name)}
                              onChange={() => {
                                const selectedBoss = characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name);
                                if (selectedBoss) {
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
                          {characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name) && (
                            <select
                              className="difficulty-select"
                              value={characters[selectedCharIdx].bosses.find(b => b.name === boss.name).difficulty}
                              onChange={(e) => {
                                const selectedBoss = characters[selectedCharIdx].bosses.find(b => b.name === boss.name);
                                if (selectedBoss) {
                                  toggleBoss(selectedCharIdx, boss.name, e.target.value);
                                }
                              }}
                            >
                              {difficulties.map((diff, idx) => (
                                <option key={idx} value={diff}>{diff}</option>
                              ))}
                            </select>
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
    );
  }

  // Main calculator view
  return (
    <div className="App" style={{ background: '#f4f6fb', minHeight: '100vh', color: '#222', padding: '2rem 0' }}>
      <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2.2rem', marginBottom: '1.5rem', color: '#222' }}>Maplestory Boss Crystal Calculator</h1>
      <p style={{ color: '#6a11cb', textAlign: 'center', marginBottom: '2rem', fontSize: '1.1rem' }}>Create characters, select bosses, and calculate your total crystal value!</p>
      <button onClick={() => setShowTable(true)} style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', cursor: 'pointer', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
        View Boss Price Table
      </button>
      <div className="table-container" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1rem' }}>
        <div className="char-header-row">
          <select
            value={selectedCharIdx ?? ''}
            onChange={e => setSelectedCharIdx(e.target.value ? parseInt(e.target.value) : null)}
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
                onClick={() => {
                  const ctenePreset = [
                    { name: 'Gloom', difficulty: 'Chaos' },
                    { name: 'Verus Hilla', difficulty: 'Hard' },
                    { name: 'Darknell', difficulty: 'Hard' },
                    { name: 'Will', difficulty: 'Hard' },
                    { name: 'Lucid', difficulty: 'Hard' },
                    { name: 'Guardian Angel Slime', difficulty: 'Hard' },
                    { name: 'Damien', difficulty: 'Hard' },
                    { name: 'Lotus', difficulty: 'Hard' },
                    { name: 'Aketchi', difficulty: 'Normal' },
                    { name: 'Papulatus', difficulty: 'Chaos' },
                    { name: 'Magnus', difficulty: 'Hard' },
                    { name: 'Vellum', difficulty: 'Chaos' },
                    { name: 'Pierre', difficulty: 'Chaos' },
                    { name: 'Von Bon', difficulty: 'Chaos' }
                  ];
                  applyPreset(selectedCharIdx, ctenePreset, 'ctene');
                }}
              >
                CTene
              </button>
              <button 
                className="boton-elegante hlom" 
                onClick={() => {
                  const hlomPreset = [
                    { name: 'Damien', difficulty: 'Hard' },
                    { name: 'Lotus', difficulty: 'Hard' },
                    { name: 'Darknell', difficulty: 'Normal' },
                    { name: 'Gloom', difficulty: 'Normal' },
                    { name: 'Lucid', difficulty: 'Easy' },
                    { name: 'Papulatus', difficulty: 'Chaos' },
                    { name: 'Aketchi', difficulty: 'Normal' },
                    { name: 'Magnus', difficulty: 'Hard' },
                    { name: 'Vellum', difficulty: 'Chaos' },
                    { name: 'Pierre', difficulty: 'Chaos' },
                    { name: 'Von Bon', difficulty: 'Chaos' },
                    { name: 'Crimson Queen', difficulty: 'Chaos' },
                    { name: 'Guardian Angel Slime', difficulty: 'Normal' },
                    { name: 'Zakum', difficulty: 'Chaos' }
                  ];
                  applyPreset(selectedCharIdx, hlomPreset, 'hlom');
                }}
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
        <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="text"
            value={newCharName}
            onChange={e => setNewCharName(e.target.value)}
            placeholder="Character name"
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', minWidth: '180px', fontSize: '1rem' }}
          />
          <button
            onClick={addCharacter}
            style={{ background: '#a259f7', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            Add Character
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#444', color: '#fff' }}>
              <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', borderRadius: '6px 0 0 0', minWidth: 150, verticalAlign: 'bottom' }}>Boss</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600, fontSize: '0.9em', minWidth: 90 }}>Mesos</th>
              <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', minWidth: 200, borderRadius: '0 6px 0 0' }}>{selectedCharIdx !== null ? characters[selectedCharIdx]?.name : 'Selected Character'}</th>
            </tr>
          </thead>
          <tbody>
            {dynamicSortedBossData.map((boss, bidx) => {
              const difficulties = getBossDifficulties(boss);
              return (
                <tr key={bidx} style={{ background: bidx % 2 === 0 ? '#f4f6fb' : '#e9e9ef' }}>
                  <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                    {boss.image && (
                      <img src={boss.image} alt={boss.name} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: '#fff2', marginRight: 8 }} />
                    )}
                    <span style={{ fontWeight: 600, color: '#222', fontSize: '1.05em' }}>{boss.name}</span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', minWidth: 110, color: '#6a11cb', fontWeight: 600, background: 'inherit' }}>
                    {selectedCharIdx !== null && characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name)?.difficulty &&
                      Math.floor(getBossPrice(boss, characters[selectedCharIdx].bosses.find(b => b.name === boss.name).difficulty) / 
                      (characters[selectedCharIdx].bosses.find(b => b.name === boss.name).partySize || 1)).toLocaleString()
                    }
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center', minWidth: 120, background: 'inherit' }}>
                    {selectedCharIdx !== null && (
                      <div className="boss-controls">
                        <div className="checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={!!characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name)}
                            onChange={() => {
                              const selectedBoss = characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name);
                              if (selectedBoss) {
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
                        {characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name) && (
                          <select
                            className="difficulty-select"
                            value={characters[selectedCharIdx].bosses.find(b => b.name === boss.name).difficulty}
                            onChange={(e) => {
                              const selectedBoss = characters[selectedCharIdx].bosses.find(b => b.name === boss.name);
                              if (selectedBoss) {
                                toggleBoss(selectedCharIdx, boss.name, e.target.value);
                              }
                            }}
                          >
                            {difficulties.map((diff, idx) => (
                              <option key={idx} value={diff}>{diff}</option>
                            ))}
                          </select>
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
      <div style={{ marginTop: '2rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#222', textAlign: 'center' }}>
        Overall Total: <span style={{ color: '#a259f7' }}>{overallTotal.toLocaleString()} meso</span> <br />
        <span style={{ fontSize: '1rem', color: '#6a11cb' }}>Bosses selected: {totalBossCount()} / {TOTAL_BOSS_CAP}</span>
      </div>
    </div>
  );
}

export default App
