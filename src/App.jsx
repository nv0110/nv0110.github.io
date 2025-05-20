import { useState, useRef, useMemo } from 'react'
import './App.css'

// Boss data, grouped by boss name with difficulties as array
const bossData = [
  {
    name: 'Limbo',
    difficulties: [
      { difficulty: 'Normal', price: 2100000000 },
      { difficulty: 'Hard', price: 3745000000 },
    ],
    image: '/bosses/Limbo.png',
  },
  {
    name: 'Pink Bean',
    difficulties: [
      { difficulty: 'Chaos', price: 64000000 },
    ],
    image: '/bosses/PinkBean.png',
  },
  {
    name: 'Cygnus',
    difficulties: [
      { difficulty: 'Normal', price: 72250000 },
    ],
    image: '/bosses/cygnus.png',
  },
  {
    name: 'Zakum',
    difficulties: [
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/zakum.png',
  },
  {
    name: 'Crimson Queen',
    difficulties: [
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/crimsonqueen.png',
  },
  {
    name: 'Von Bon',
    difficulties: [
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/von_bon.png',
  },
  {
    name: 'Pierre',
    difficulties: [
      { difficulty: 'Chaos', price: 81000000 },
    ],
    image: '/bosses/pierre.png',
  },
  {
    name: 'Magnus',
    difficulties: [
      { difficulty: 'Hard', price: 95062500 },
    ],
    image: '/bosses/magnus.png',
  },
  {
    name: 'Vellum',
    difficulties: [
      { difficulty: 'Chaos', price: 105062500 },
    ],
    image: '/bosses/vellum.png',
  },
  {
    name: 'Papulatus',
    difficulties: [
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
      { difficulty: 'Hard', price: 600578125 },
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
    ],
    image: '/bosses/Kalos.png',
  },
  {
    name: 'Kaling',
    difficulties: [
      { difficulty: 'Easy', price: 1031250000 },
      { difficulty: 'Normal', price: 1506500000 },
      { difficulty: 'Hard', price: 2990000000 },
    ],
    image: '/bosses/Kaling.png',
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
  const [editingNameIdx, setEditingNameIdx] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  // For hover delay on char action buttons
  const [visibleCharAction, setVisibleCharAction] = useState(null);
  const actionHoverTimeout = useRef(null);
  // For character selection
  const [selectedCharIdx, setSelectedCharIdx] = useState(null);

  // Dynamic sorting based on first character's selections
  const dynamicSortedBossData = useMemo(() => {
    return [...bossData].sort((a, b) => {
      // Get first character's selections
      const firstChar = characters[0];
      
      // Get values for comparison
      const getBossValue = (boss) => {
        if (!firstChar) return Math.max(...boss.difficulties.map(d => d.price));
        
        const selected = firstChar.bosses.find(b => b.name === boss.name);
        if (selected) {
          return selected.price / selected.partySize;
        }
        // If not selected by first character, use max possible value
        return Math.max(...boss.difficulties.map(d => d.price));
      };

      const valueA = getBossValue(a);
      const valueB = getBossValue(b);
      
      return valueB - valueA; // Descending order
    });
  }, [characters]); // Re-sort when characters change

  // Add a new character
  const addCharacter = () => {
    if (!newCharName.trim()) return;
    setCharacters([
      ...characters,
      { name: newCharName.trim(), bosses: [] }
    ]);
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
  const applyPreset = (idx, preset) => {
    setCharacters(chars => chars.map((char, i) => {
      if (i !== idx) return char;
      // Remove any existing of these bosses
      let filtered = char.bosses.filter(b => !preset.some(cb => cb.name === b.name));
      // Add all preset bosses
      let newBosses = preset.map(cb => {
        const bossObj = bossData.find(b => b.name === cb.name);
        return {
          name: cb.name,
          difficulty: cb.difficulty,
          price: getBossPrice(bossObj, cb.difficulty),
          partySize: 1
        };
      });
      // Cap at 14
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
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#222', fontSize: '1.05em' }}>
            <thead>
              <tr style={{ background: '#a259f7', color: '#fff' }}>
                <th style={{ padding: '8px', borderRadius: '6px 0 0 6px', textAlign: 'left' }}>Boss</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Difficulty</th>
                <th style={{ padding: '8px', borderRadius: '0 6px 6px 0', textAlign: 'right' }}>Crystal Price</th>
              </tr>
            </thead>
            <tbody>
              {dynamicSortedBossData.map((boss, bidx) => (
                boss.difficulties.map((dif, didx) => (
                  <tr key={bidx + '-' + didx} style={{ background: didx % 2 === 0 ? '#f4f6fb' : '#fff' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#6a11cb', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {boss.image && (
                        <img src={boss.image} alt={boss.name} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#fff2', marginRight: 6 }} />
                      )}
                      {boss.name}
                    </td>
                    <td style={{ padding: '8px', color: '#a259f7', fontWeight: 500 }}>{dif.difficulty}</td>
                    <td style={{ padding: '8px', color: '#222', textAlign: 'right' }}>{dif.price.toLocaleString()} meso</td>
                  </tr>
                ))
              ))}
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
      <div className="table-container" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1rem 0.5rem', paddingTop: '4.5rem', position: 'relative' }}>
        {/* Action buttons just above the table header, centered horizontally */}
        {selectedCharIdx !== null && (
          <div style={{ position: 'absolute', top: '2.25rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, zIndex: 20, pointerEvents: 'auto' }}>
            <button
              onClick={() => cloneCharacter(selectedCharIdx)}
              className="copy"
              title="Clone character"
              tabIndex={0}
              style={{ background: '#232323', color: '#fff' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button
              onClick={() => applyPreset(selectedCharIdx, cteneBosses)}
              className="ctene"
              style={{ background: '#a259f7', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85em', cursor: 'pointer', boxShadow: '0 1px 3px #0002', padding: '4px 8px', borderRadius: 4 }}
              title="CTene preset"
            >
              CTene
            </button>
            <button
              onClick={() => applyPreset(selectedCharIdx, hlomBosses)}
              className="hlom"
              style={{ background: '#4285f4', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85em', cursor: 'pointer', boxShadow: '0 1px 3px #0002', padding: '4px 8px', borderRadius: 4 }}
              title="Hlom preset"
            >
              Hlom
            </button>
            <button
              onClick={() => removeCharacter(selectedCharIdx)}
              className="bin-button"
              title="Delete character"
            >
              <svg
                className="bin-top"
                viewBox="0 0 39 7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line y1="5" x2="39" y2="5" stroke="white" strokeWidth="4"></line>
                <line
                  x1="12"
                  y1="1.5"
                  x2="26.0357"
                  y2="1.5"
                  stroke="white"
                  strokeWidth="3"
                ></line>
              </svg>
              <svg
                className="bin-bottom"
                viewBox="0 0 33 39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <mask id="path-1-inside-1_8_19" fill="white">
                  <path
                    d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
                  ></path>
                </mask>
                <path
                  d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                  fill="white"
                  mask="url(#path-1-inside-1_8_19)"
                ></path>
                <path d="M12 6L12 29" stroke="white" strokeWidth="4"></path>
                <path d="M21 6V29" stroke="white" strokeWidth="4"></path>
              </svg>
            </button>
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#444', color: '#fff' }}>
              <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', borderRadius: '6px 0 0 0', minWidth: 150, verticalAlign: 'bottom' }}>Boss</th>
              <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600, fontSize: '0.9em', minWidth: 90, borderRadius: characters.length === 0 ? '0 6px 0 0' : undefined }}>Mesos</th>
              {characters.map((char, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: '6px 4px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: '0.9em',
                    minWidth: 100,
                    borderRadius: idx === characters.length - 1 ? '0 6px 0 0' : undefined,
                    verticalAlign: 'middle',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div className="char-header-hover" style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => {
                            if (actionHoverTimeout.current) clearTimeout(actionHoverTimeout.current);
                            setVisibleCharAction(idx);
                          }}
                          onMouseLeave={() => {
                            if (actionHoverTimeout.current) clearTimeout(actionHoverTimeout.current);
                            actionHoverTimeout.current = setTimeout(() => setVisibleCharAction(null), 1000);
                          }}>
                      {editingNameIdx === idx ? (
                        <input
                          type="text"
                          value={editingNameValue}
                          autoFocus
                          onChange={e => setEditingNameValue(e.target.value)}
                          onBlur={() => { updateCharacterName(idx, editingNameValue); setEditingNameIdx(null); }}
                          onKeyDown={e => { if (e.key === 'Enter') { updateCharacterName(idx, editingNameValue); setEditingNameIdx(null); }}}
                          style={{ fontWeight: 600, fontSize: '0.9em', textAlign: 'center', borderRadius: 3, border: '1px solid #a259f7', padding: '2px 3px', minWidth: 50 }}
                          onMouseEnter={() => {
                            if (actionHoverTimeout.current) clearTimeout(actionHoverTimeout.current);
                            setVisibleCharAction(idx);
                          }}
                          onMouseLeave={() => {
                            if (actionHoverTimeout.current) clearTimeout(actionHoverTimeout.current);
                            actionHoverTimeout.current = setTimeout(() => setVisibleCharAction(null), 1000);
                          }}
                          onClick={() => setSelectedCharIdx(idx)}
                        />
                      ) : (
                        <span
                          className={selectedCharIdx === idx ? 'char-glow' : ''}
                          style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9em', textAlign: 'center', display: 'inline-block', color: selectedCharIdx === idx ? '#a259f7' : undefined, padding: '2px 6px', transition: 'color 0.2s, text-shadow 0.2s' }}
                          onClick={() => setSelectedCharIdx(selectedCharIdx === idx ? null : idx)}
                          title="Click to select character"
                        >
                          {char.name}
                        </span>
                      )}
                    </div>
                  </div>
                </th>
              ))}
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
                    {/* Per character, show sum of selected difficulties for this boss */}
                    {characters.some(char => {
                      const selectedBoss = char.bosses.find(b => b.name === boss.name);
                      return selectedBoss && selectedBoss.difficulty && selectedBoss.partySize;
                    }) &&
                      characters.reduce((sum, char) => {
                        const selectedBoss = char.bosses.find(b => b.name === boss.name);
                        if (selectedBoss && selectedBoss.difficulty && selectedBoss.partySize) {
                          return sum + Math.floor(getBossPrice(boss, selectedBoss.difficulty) / selectedBoss.partySize);
                        }
                        return sum;
                      }, 0).toLocaleString()
                    }
                  </td>
                  {characters.map((char, cidx) => {
                    const selectedBoss = char.bosses.find(b => b.name === boss.name);
                    const selectedDifficulty = selectedBoss ? selectedBoss.difficulty : '';
                    const isChecked = !!selectedBoss;
                    let maxParty = 6;
                    if (boss.name === 'Limbo' && selectedDifficulty) maxParty = 3;
                    if (boss.name === 'Lotus' && selectedDifficulty === 'Extreme') maxParty = 2;
                    const capReached = char.bosses.length >= CHARACTER_BOSS_CAP && !isChecked;
                    return (
                      <td key={cidx} style={{ padding: '8px', textAlign: 'center', minWidth: 120, background: 'inherit' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <select
                            value={selectedDifficulty || ''}
                            onChange={e => {
                              const value = e.target.value;
                              if (value === '') {
                                toggleBoss(cidx, boss.name, selectedDifficulty);
                              } else {
                                toggleBoss(cidx, boss.name, value);
                              }
                            }}
                            style={{ borderRadius: 4, border: '1px solid #ccc', padding: '2px 6px', fontSize: '1em', background: isChecked ? '#fff' : '#eee', minWidth: 70, color: '#222' }}
                            disabled={capReached}
                          >
                            <option value=''>None</option>
                            {difficulties.map(dif => (
                              <option key={dif} value={dif}>{dif}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={maxParty}
                            value={selectedBoss ? selectedBoss.partySize : 1}
                            disabled={!isChecked}
                            onChange={e => updatePartySize(cidx, boss.name, selectedDifficulty, Math.max(1, Math.min(maxParty, Number(e.target.value))))}
                            style={{ width: 32, borderRadius: 4, border: '1px solid #ccc', padding: '2px 4px', background: isChecked ? '#fff' : '#eee', marginLeft: 4, color: '#222' }}
                          />
                          <label style={{
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            cursor: 'pointer',
                            marginLeft: 4,
                            padding: 0
                          }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={
                                (char.bosses.length >= CHARACTER_BOSS_CAP || totalBossCount() >= TOTAL_BOSS_CAP) && !isChecked
                              }
                              onChange={() => {
                                if (isChecked) {
                                  // Always allow unticking
                                  toggleBoss(cidx, boss.name, '');
                                } else {
                                  toggleBoss(cidx, boss.name, difficulties[0]);
                                }
                              }}
                              style={{
                                width: 20,
                                height: 20,
                                marginTop: 2,
                                cursor: 'pointer',
                                accentColor: '#a259f7'
                              }}
                            />
                          </label>
                        </div>
                      </td>
                    );
                  })}
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
