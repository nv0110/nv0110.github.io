import { useState, useEffect } from 'react';

function getCurrentWeekKey() {
  // Returns a string like '2024-23' for year-week, based on UTC
  const now = new Date();
  const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const onejan = new Date(utcNow.getUTCFullYear(), 0, 1);
  const week = Math.ceil((((utcNow - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${utcNow.getUTCFullYear()}-${week}`;
}

function getTimeUntilReset() {
  const now = new Date();
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
  
  // Get next Thursday 00:00 UTC
  const daysUntilThursday = (4 - utcNow.getUTCDay() + 7) % 7;
  const nextReset = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), utcNow.getUTCDate() + daysUntilThursday));
  
  const diff = nextReset - utcNow;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0')
  };
}

function ProgressFace({ progress, darkMode }) {
  let emoji = '😐';
  if (progress >= 1) emoji = '🤑';
  else if (progress >= 0.7) emoji = '😁';
  else if (progress >= 0.4) emoji = '🙂';

  return (
    <span style={{ 
      fontSize: '1.5em', 
      marginLeft: '0.5rem',
      display: 'inline-flex',
      alignItems: 'center',
      transition: 'transform 0.3s ease',
      transform: progress >= 1 ? 'scale(1.2)' : 'scale(1)'
    }}>
      {emoji}
    </span>
  );
}

function CrystalAnimation({ startPosition, endPosition, onComplete }) {
  const [position, setPosition] = useState(startPosition);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1000; // 1 second animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic bezier curve for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const newX = startPosition.x + (endPosition.x - startPosition.x) * easeOutCubic;
      const newY = startPosition.y + (endPosition.y - startPosition.y) * easeOutCubic;

      setPosition({ x: newX, y: newY });
      setOpacity(1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [startPosition, endPosition, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        opacity,
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'transform 0.1s ease'
      }}
    >
      <img
        src="/bosses/crystal.png"
        alt="Crystal"
        style={{
          width: 24,
          height: 24,
          transform: `rotate(${position.x * 0.1}deg)`,
          filter: 'drop-shadow(0 0 4px rgba(162, 89, 247, 0.6))'
        }}
      />
    </div>
  );
}

export default function WeeklyTracker({ characters, bossData, onBack }) {
  const weekKey = getCurrentWeekKey();
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilReset());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ms-darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [crystalAnimation, setCrystalAnimation] = useState(null);
  
  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Listen for dark mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('ms-darkMode');
      setDarkMode(saved ? JSON.parse(saved) : false);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Only load from localStorage on first mount
  const [checked, setChecked] = useState(() => {
    const saved = localStorage.getItem('ms-weekly-clears');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.weekKey === weekKey) {
          return parsed.checked || {};
        }
      } catch {}
    }
    return {};
  });
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);

  // Save to localStorage with weekKey
  useEffect(() => {
    localStorage.setItem('ms-weekly-clears', JSON.stringify({ weekKey, checked }));
  }, [checked, weekKey]);

  const [progressData, setProgressData] = useState(() => {
    const saved = localStorage.getItem('ms-progress');
    return saved ? JSON.parse(saved) : {
      weeklyTotal: 0,
      lastReset: new Date().toISOString(),
      history: []
    };
  });

  // Calculate total meso value for a character
  const charTotal = (char) => char.bosses.reduce((sum, b) => sum + (b.price / (b.partySize || 1)), 0);

  // Calculate total meso value for all characters
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

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!characters.length) {
    return (
      <div className={`App${darkMode ? ' dark' : ''}`} style={{ padding: '2rem', color: darkMode ? '#e6e0ff' : '#888', fontSize: '1.2rem', textAlign: 'center' }}>
        No characters found. Go back and add a character first.
        <br /><br />
        <button onClick={onBack} style={{ marginTop: 16 }}>Back to Calculator</button>
      </div>
    );
  }

  // Helper to get boss price
  const getBossPrice = (bossName, difficulty) => {
    const boss = bossData.find(b => b.name === bossName);
    if (!boss) return 0;
    const d = boss.difficulties.find(d => d.difficulty === difficulty);
    return d ? d.price : 0;
  };

  // --- 2. Total meso for all characters ---
  const totalMeso = characters.reduce((sum, char, charIndex) => {
    // Use both name and index to create a unique key for each character
    const charKey = `${char?.name || ''}-${charIndex}`;
    return sum + (char.bosses || []).reduce((s, b) =>
      checked[charKey]?.[b.name + '-' + b.difficulty] ? s + getBossPrice(b.name, b.difficulty) : s, 0
    );
  }, 0);

  // --- 2b. Total obtainable meso for all characters (goal) ---
  const obtainableMeso = characters.reduce((sum, char) =>
    sum + (char.bosses || []).reduce((s, b) => s + getBossPrice(b.name, b.difficulty), 0)
  , 0);

  // Calculate progress percentage
  const progressPercentage = obtainableMeso > 0 ? totalMeso / obtainableMeso : 0;

  // --- 3. Character summary table ---
  const charSummaries = characters.map((char, idx) => {
    const charKey = `${char?.name || ''}-${idx}`;
    const bosses = char?.bosses || [];
    const cleared = bosses.filter(b => checked[charKey]?.[b.name + '-' + b.difficulty]).length;
    const total = bosses.length;
    return {
      name: char.name,
      cleared,
      total,
      allCleared: total > 0 && cleared === total,
      left: total - cleared,
      idx,
    };
  });

  // --- 4. Custom checkbox component ---
  function CustomCheckbox({ checked, onChange }) {
    return (
      <div className="checkbox-wrapper" style={{ transform: 'scale(0.8)' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <svg viewBox="0 0 35.6 35.6">
          <circle className="background" cx="17.8" cy="17.8" r="17.8"></circle>
          <circle className="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
          <polyline className="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
        </svg>
      </div>
    );
  }

  // --- Main table for selected character ---
  const char = characters[selectedCharIdx];
  const charKey = `${char?.name || ''}-${selectedCharIdx}`;
  const charBosses = char?.bosses || [];

  // --- 3. Sort bosses by price (highest to lowest) ---
  const sortedBosses = [...charBosses].sort((a, b) => {
    const priceA = getBossPrice(a.name, a.difficulty);
    const priceB = getBossPrice(b.name, b.difficulty);
    return priceB - priceA;
  });

  const handleCheck = (boss, checkedVal, event) => {
    if (checkedVal) {
      const startPosition = {
        x: event.clientX,
        y: event.clientY
      };

      // Calculate end position (progress bar)
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        const progressBarRect = progressBar.getBoundingClientRect();
        const endPosition = {
          x: progressBarRect.left + progressBarRect.width / 2,
          y: progressBarRect.top + progressBarRect.height / 2
        };

        setCrystalAnimation({
          startPosition,
          endPosition
        });
      }
    }

    setChecked(prev => {
      const newChecked = {
        ...prev,
        [charKey]: {
          ...(prev[charKey] || {}),
          [boss.name + '-' + boss.difficulty]: checkedVal
        }
      };

      return newChecked;
    });
  };

  const handleTickAll = () => {
    const currentState = checked[charKey] || {};
    const allChecked = charBosses.every(b => currentState[b.name + '-' + b.difficulty]);
    
    setChecked(prev => ({
      ...prev,
      [charKey]: Object.fromEntries(charBosses.map(b => [b.name + '-' + b.difficulty, !allChecked]))
    }));
  };

  return (
    <div className={`App${darkMode ? ' dark' : ''}`} style={{ minHeight: '100vh', color: darkMode ? '#e6e0ff' : '#222', padding: '2rem 0' }}>
      {crystalAnimation && (
        <CrystalAnimation
          startPosition={crystalAnimation.startPosition}
          endPosition={crystalAnimation.endPosition}
          onComplete={() => setCrystalAnimation(null)}
        />
      )}
      <div style={{ position: 'absolute', top: 18, right: 32, zIndex: 10 }}>
        <button
          onClick={() => {
            const newDarkMode = !darkMode;
            setDarkMode(newDarkMode);
            localStorage.setItem('ms-darkMode', JSON.stringify(newDarkMode));
          }}
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
      <button onClick={onBack} style={{ marginBottom: 24 }}>← Back to Calculator</button>
      <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2rem', marginBottom: '0.5rem', color: darkMode ? '#a259f7' : '#222' }}>Weekly Boss Tracker</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/bluecrystal.png" alt="Blue Crystal" style={{ width: 32, height: 32 }} />
        <img src="/bosses/yellowcrystal.png" alt="Yellow Crystal" style={{ width: 32, height: 32 }} />
      </div>
      
      {/* Reset Timer */}
      <div style={{ 
        maxWidth: 700, 
        margin: '0 auto 1.5rem auto', 
        background: darkMode ? '#28204a' : '#f4f6fb', 
        borderRadius: 10, 
        padding: '1rem', 
        boxShadow: darkMode ? '0 2px 8px rgba(40, 20, 60, 0.18)' : '0 2px 8px #0001',
        textAlign: 'center',
        border: darkMode ? '1.5px solid #6a11cb' : 'none'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, color: darkMode ? '#b39ddb' : '#805ad5' }}>Next Reset</h3>
        <div style={{ 
          fontSize: '1.5rem', 
          fontFamily: 'monospace', 
          fontWeight: 600, 
          color: darkMode ? '#a259f7' : '#a259f7',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>{timeUntilReset.hours}</span>:
          <span>{timeUntilReset.minutes}</span>:
          <span>{timeUntilReset.seconds}</span>
        </div>
        <div style={{ fontSize: '0.9rem', color: darkMode ? '#8d80c4' : '#666', marginTop: '0.5rem' }}>
          Thursday 00:00 UTC
        </div>
      </div>

      {/* 3. Character summary table/list */}
      <div style={{ 
        maxWidth: 700, 
        margin: '0 auto 1.5rem auto', 
        background: darkMode ? '#28204a' : '#f4f6fb', 
        borderRadius: 10, 
        padding: '1rem', 
        boxShadow: darkMode ? '0 2px 8px rgba(40, 20, 60, 0.18)' : '0 2px 8px #0001',
        border: darkMode ? '1.5px solid #6a11cb' : 'none'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, color: darkMode ? '#b39ddb' : '#805ad5', textAlign: 'center' }}>Weekly Clear Status</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center' }}>
          {charSummaries.map(cs => (
            <div
              key={cs.name}
              onClick={() => setSelectedCharIdx(cs.idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: selectedCharIdx === cs.idx ? (darkMode ? '#3a335a' : '#e0e0ff') : (darkMode ? '#23203a' : '#fff'),
                borderRadius: 8,
                padding: '0.5rem 1.2rem',
                minWidth: 160,
                boxShadow: darkMode ? '0 1px 4px rgba(40, 20, 60, 0.18)' : '0 1px 4px #0001',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.3s',
                border: darkMode ? '1px solid #3a335a' : 'none',
                textAlign: 'center',
              }}
            >
              {cs.allCleared ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, fontSize: '1em', width: '100%' }}>
                  <span style={{ color: darkMode ? '#e6e0ff' : '#222' }}>{cs.name}</span>
                  <svg width="19" height="19" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#38a169"/><polyline points="6,12 10,16 16,7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              ) : (
                <>
                  <span style={{ color: darkMode ? '#e6e0ff' : '#222', fontWeight: 700 }}>{cs.name}</span>
                  {cs.total === 0 ? (
                    <span style={{ color: darkMode ? '#8d80c4' : '#888', fontWeight: 500, fontSize: '0.95em' }}>No bosses</span>
                  ) : (
                    <span style={{ color: darkMode ? '#a259f7' : '#a259f7', fontWeight: 700, fontSize: '1.05em' }}>{cs.left} left</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={handleTickAll} style={{ 
          padding: '0.5rem 1.2rem', 
          borderRadius: 6, 
          background: darkMode ? '#805ad5' : '#a259f7', 
          color: '#fff', 
          fontWeight: 600, 
          cursor: 'pointer',
          border: darkMode ? '1px solid #9f7aea' : 'none'
        }}>
          {charBosses.every(b => checked[`${char?.name || ''}-${selectedCharIdx}`]?.[b.name + '-' + b.difficulty]) ? 'Untick All' : 'Tick All'}
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 700, margin: '0 auto' }}>
        <thead>
          <tr style={{ background: darkMode ? '#3a2a5d' : '#444', color: '#fff' }}>
            <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', borderRadius: '6px 0 0 0', minWidth: 180 }}>Boss</th>
            <th style={{ padding: '6px 4px', textAlign: 'left', fontWeight: 600, fontSize: '0.9em', minWidth: 110 }}>Difficulty</th>
            <th style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600, fontSize: '0.9em', minWidth: 110 }}>Mesos</th>
            <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em', borderRadius: '0 6px 0 0', minWidth: 90 }}>Cleared</th>
          </tr>
        </thead>
        <tbody>
          {sortedBosses.map((b, idx) => {
            const bossObj = bossData.find(bd => bd.name === b.name);
            const isChecked = !!checked[charKey]?.[b.name + '-' + b.difficulty];
            return (
              <tr
                key={b.name + '-' + b.difficulty}
                style={{
                  background: idx % 2 === 0 ? (darkMode ? '#23203a' : '#f4f6fb') : (darkMode ? '#201c32' : '#e9e9ef'),
                  border: darkMode ? '1px solid #3a335a' : 'none',
                  transition: 'background-color 0.2s ease, transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={e => e.currentTarget.style.background = darkMode ? '#2a2540' : '#eef0f5'}
                onMouseOut={e => e.currentTarget.style.background = darkMode ? (idx % 2 === 0 ? '#23203a' : '#201c32') : (idx % 2 === 0 ? '#f4f6fb' : '#e9e9ef')}
                onClick={(e) => {
                  // Only trigger if the click wasn't on the checkbox
                  if (!e.target.closest('.checkbox-wrapper')) {
                    handleCheck(b, !isChecked, e);
                  }
                }}
              >
                <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {bossObj?.image && (
                    <img
                      src={bossObj.image}
                      alt={b.name}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: 'contain',
                        borderRadius: 6,
                        background: darkMode ? '#fff1' : '#fff2',
                        marginRight: 8,
                        transition: 'transform 0.2s ease'
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  )}
                  <span style={{ fontWeight: 600, color: darkMode ? '#e6e0ff' : '#222' }}>{b.name}</span>
                </td>
                <td style={{ padding: '8px', textAlign: 'left' }}>
                  <span style={{ color: darkMode ? '#e6e0ff' : '#222' }}>{b.difficulty}</span>
                </td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                  <span style={{ color: darkMode ? '#e6e0ff' : '#222' }}>{getBossPrice(b.name, b.difficulty).toLocaleString()}</span>
                </td>
                <td style={{ padding: '8px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <span onClick={e => e.stopPropagation()}>
                    <CustomCheckbox
                      checked={isChecked}
                      onChange={e => handleCheck(b, e.target.checked, e)}
                    />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ 
        marginTop: '2rem', 
        fontSize: '1.2rem', 
        fontWeight: 'bold', 
        color: darkMode ? '#e6e0ff' : '#222', 
        textAlign: 'center' 
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <img src="/bosses/crystal.png" alt="Crystal" style={{ width: 28, height: 28, verticalAlign: 'middle', marginRight: 4 }} />
          Total Meso This Week: <span style={{ color: darkMode ? '#b39ddb' : '#a259f7' }}>{totalMeso.toLocaleString()} meso</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ 
        maxWidth: 900, 
        margin: '2rem auto', 
        padding: '1rem',
        background: '#28204a',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(40, 20, 60, 0.18)',
        border: '1.5px solid #6a11cb'
      }}>
        <h3 style={{ color: '#a259f7', marginBottom: '1rem', textAlign: 'center' }}>Weekly Progress</h3>
        <div style={{ 
          width: '100%', 
          height: '20px', 
          background: '#3a335a',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: 12
        }}>
          <div style={{
            width: `${obtainableMeso === 0 ? 0 : Math.min(100, (totalMeso / obtainableMeso) * 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #a259f7, #6a11cb)',
            transition: 'width 0.5s ease',
            borderRadius: '10px'
          }} />
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: '#e6e0ff',
          fontSize: '1.1rem',
        }}>
          <span>{totalMeso.toLocaleString()} meso</span>
          <span style={{ fontSize: '0.95rem', color: '#b39ddb', marginTop: 2 }}>Goal: {obtainableMeso.toLocaleString()} meso</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ 
          marginBottom: '2rem', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: darkMode ? '#e6e0ff' : '#222',
            margin: 0
          }}>
            Weekly Progress Tracker
          </h1>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            fontSize: '1.2rem'
          }}>
            <span style={{ color: darkMode ? '#e6e0ff' : '#222' }}>
              Progress: {Math.round(progressPercentage * 100)}%
            </span>
            <ProgressFace progress={progressPercentage} darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
} 