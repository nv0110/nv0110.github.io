import { useState, useEffect, useCallback } from 'react';
import { useAuthentication } from '../../hooks/useAuthentication';
import ViewTransitionWrapper from '../components/ViewTransitionWrapper';
import { 
  calculateStarforceCost, 
  getMvpLevelOptions,
  formatMesos 
} from '../utils/starforceUtils';
import { logger } from '../utils/logger';
import '../styles/enhancement-calculator.css';

function EnhancementCalculatorPage() {

  const { isLoggedIn } = useAuthentication();

  // Enable body scrolling for this page only
  useEffect(() => {
    // Store original overflow values
    const originalBodyOverflow = document.body.style.overflowY;
    const originalHtmlOverflow = document.documentElement.style.overflowY;
    
    // Enable scrolling
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto';
    
    // Cleanup function to restore original values
    return () => {
      document.body.style.overflowY = originalBodyOverflow;
      document.documentElement.style.overflowY = originalHtmlOverflow;
    };
  }, []);

  // Mode state - 'calculator' or 'planner'
  const [mode, setMode] = useState('calculator');

  // Form state for calculator mode
  const [equipLevel, setEquipLevel] = useState(200);
  const [currentStar, setCurrentStar] = useState(0);
  const [targetStar, setTargetStar] = useState(17);
  const [eventType, setEventType] = useState('none'); // 'none', '30off', '51015', 'ssf'
  const [mvpLevel, setMvpLevel] = useState('none');
  const [isZeroWeapon, setIsZeroWeapon] = useState(false);
  const [safeguard15to16, setSafeguard15to16] = useState(false);
  const [safeguard16to17, setSafeguard16to17] = useState(false);
  const [useStarCatch, setUseStarCatch] = useState(false);

  // Calculation results and controls for calculator mode
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Planner state
  const [plannerData, setPlannerData] = useState({
    characters: []
  });
  const [newCharacterName, setNewCharacterName] = useState('');
  const [expandedCharacters, setExpandedCharacters] = useState(new Set());

  // Load planner data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('enhancementPlannerData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setPlannerData(parsed);
        logger.info('Loaded planner data from localStorage');
      } catch (error) {
        logger.error('Failed to load planner data:', error);
      }
    }
  }, []);

  // Save planner data to localStorage whenever it changes
  useEffect(() => {
    if (plannerData.characters.length > 0) {
      localStorage.setItem('enhancementPlannerData', JSON.stringify(plannerData));
      logger.info('Saved planner data to localStorage');
    }
  }, [plannerData]);

  // Character management functions
  const addCharacter = useCallback(() => {
    if (!newCharacterName.trim()) return;
    
    const newCharacter = {
      id: Date.now().toString(),
      name: newCharacterName.trim(),
      items: []
    };
    
    setPlannerData(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter]
    }));
    
    setNewCharacterName('');
    setExpandedCharacters(prev => new Set([...prev, newCharacter.id]));
    logger.info('Added character:', newCharacter.name);
  }, [newCharacterName]);

  const removeCharacter = useCallback((characterId) => {
    setPlannerData(prev => ({
      ...prev,
      characters: prev.characters.filter(char => char.id !== characterId)
    }));
    
    setExpandedCharacters(prev => {
      const newSet = new Set(prev);
      newSet.delete(characterId);
      return newSet;
    });
    
    logger.info('Removed character:', characterId);
  }, []);

  const toggleCharacterExpanded = useCallback((characterId) => {
    setExpandedCharacters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  }, []);

  // Item management functions
  // Equipment type options (excluding totem, gem, android, medal, badge, emblem, pocket item)
  const equipmentTypes = [
    { value: 'hat', name: 'Hat', icon: '⛑️' },
    { value: 'face_accessory', name: 'Face Accessory', icon: '🎭' },
    { value: 'eye_accessory', name: 'Eye Accessory', icon: '🥽' },
    { value: 'earrings', name: 'Earrings', icon: '💎' },
    { value: 'pendant', name: 'Pendant', icon: '🏺' },
    { value: 'ring', name: 'Ring', icon: '💍' },
    { value: 'overall', name: 'Overall', icon: '🛡️' },
    { value: 'top', name: 'Top', icon: '🎽' },
    { value: 'bottom', name: 'Bottom', icon: '👖' },
    { value: 'shoes', name: 'Shoes', icon: '🥾' },
    { value: 'gloves', name: 'Gloves', icon: '🧤' },
    { value: 'cape', name: 'Cape', icon: '🧥' },
    { value: 'belt', name: 'Belt', icon: '⚜️' },
    { value: 'shoulder', name: 'Shoulder', icon: '🏛️' },
    { value: 'weapon', name: 'Weapon', icon: '⚔️' },
    { value: 'shield', name: 'Shield', icon: '🛡️' }
  ];

  // Global settings for all items
  const [globalSettings, setGlobalSettings] = useState({
    eventType: 'none',
    mvpLevel: 'none',
    useStarCatch: false
  });

  const addItem = useCallback((characterId) => {
    const newItem = {
      id: Date.now().toString(),
      type: 'weapon', // Default to weapon
      name: 'Weapon',
      equipLevel: 200,
      currentStar: 0,
      targetStar: 17,
      isZeroWeapon: false,
      useSafeguard: false, // Single safeguard setting
      calculationResult: null
    };

    setPlannerData(prev => ({
      ...prev,
      characters: prev.characters.map(char => 
        char.id === characterId 
          ? { ...char, items: [...char.items, newItem] }
          : char
      )
    }));

    logger.info('Added item to character:', characterId);
  }, []);

  const removeItem = useCallback((characterId, itemId) => {
    setPlannerData(prev => ({
      ...prev,
      characters: prev.characters.map(char => 
        char.id === characterId 
          ? { ...char, items: char.items.filter(item => item.id !== itemId) }
          : char
      )
    }));

    logger.info('Removed item:', itemId, 'from character:', characterId);
  }, []);

  const updateItem = useCallback((characterId, itemId, updates) => {
    setPlannerData(prev => {
      const newData = {
        ...prev,
        characters: prev.characters.map(char => 
          char.id === characterId 
            ? {
                ...char,
                items: char.items.map(item => 
                  item.id === itemId 
                    ? { 
                        ...item, 
                        ...updates,
                        // Only reset calculation if it's not a calculationResult update
                        ...(updates.calculationResult ? {} : { calculationResult: null })
                      }
                    : item
                )
              }
            : char
        )
      };
      return newData;
    });
  }, []);

  // Calculate all items for all characters
  const calculateAllItems = useCallback(() => {
    logger.info('Starting bulk calculation for all items');
    
    setPlannerData(currentData => {
      let updatedData = { ...currentData };
      
      currentData.characters.forEach(character => {
        character.items.forEach(item => {
          if (item.equipLevel && item.currentStar !== null && item.targetStar !== null && item.currentStar < item.targetStar) {
            // Inline calculation to avoid dependency issues
            try {
              // Determine safeguard settings based on event and star range
              const is51015Event = globalSettings.eventType === '51015' || globalSettings.eventType === 'ssf';
              const includes15to16 = item.currentStar <= 15 && item.targetStar >= 16;
              const includes16to17 = item.currentStar <= 16 && item.targetStar >= 17;
              
              // Apply safeguard logic
              const safeguard15to16 = item.useSafeguard && includes15to16 && !is51015Event; // No safeguard needed if guaranteed
              const safeguard16to17 = item.useSafeguard && includes16to17;

              const result = calculateStarforceCost(item.equipLevel, item.currentStar, item.targetStar, {
                eventType: globalSettings.eventType,
                mvpLevel: globalSettings.mvpLevel,
                hasPremium: false,
                isZeroWeapon: item.isZeroWeapon,
                safeguard15to16,
                safeguard16to17,
                useStarCatch: globalSettings.useStarCatch
              });

              // Update the item in our working copy
              updatedData = {
                ...updatedData,
                characters: updatedData.characters.map(char => 
                  char.id === character.id 
                    ? {
                        ...char,
                        items: char.items.map(i => 
                          i.id === item.id 
                            ? { ...i, calculationResult: result }
                            : i
                        )
                      }
                    : char
                )
              };
            } catch (error) {
              logger.error('Calculation failed for item:', item.name, error);
              
              // Update the item in our working copy with error
              updatedData = {
                ...updatedData,
                characters: updatedData.characters.map(char => 
                  char.id === character.id 
                    ? {
                        ...char,
                        items: char.items.map(i => 
                          i.id === item.id 
                            ? { ...i, calculationResult: { success: false, error: 'Calculation failed. Please try again.' } }
                            : i
                        )
                      }
                    : char
                )
              };
            }
          }
        });
      });
      
      return updatedData;
    });
  }, [globalSettings]);

  // Auto-calculate all items when global settings change
  useEffect(() => {
    if (plannerData.characters.length > 0) {
      // Add a delay to avoid excessive calculations during rapid changes
      const timeoutId = setTimeout(() => {
        calculateAllItems();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [globalSettings]); // Removed calculateAllItems to avoid circular dependency

  const calculateItemCost = useCallback((characterId, itemId) => {
    logger.info('calculateItemCost called with:', { characterId, itemId });
    
    // Get fresh data from current state to avoid stale closure
    setPlannerData(currentData => {
      const character = currentData.characters.find(char => char.id === characterId);
      if (!character) {
        logger.error('Character not found:', characterId);
        return currentData;
      }

      const item = character.items.find(item => item.id === itemId);
      if (!item) {
        logger.error('Item not found:', itemId);
        return currentData;
      }

      logger.info('Found item for calculation:', item);

      // Validate inputs
      if (!item.equipLevel || item.currentStar === null || item.targetStar === null || item.currentStar >= item.targetStar) {
        logger.error('Invalid item parameters:', {
          equipLevel: item.equipLevel,
          currentStar: item.currentStar,
          targetStar: item.targetStar
        });
        
        return {
          ...currentData,
          characters: currentData.characters.map(char => 
            char.id === characterId 
              ? {
                  ...char,
                  items: char.items.map(item => 
                    item.id === itemId 
                      ? { ...item, calculationResult: { success: false, error: 'Please enter valid equipment level and star range.' } }
                      : item
                  )
                }
              : char
          )
        };
      }

      try {
        // Determine safeguard settings based on event and star range
        const is51015Event = globalSettings.eventType === '51015' || globalSettings.eventType === 'ssf';
        const includes15to16 = item.currentStar <= 15 && item.targetStar >= 16;
        const includes16to17 = item.currentStar <= 16 && item.targetStar >= 17;
        
        // Apply safeguard logic
        const safeguard15to16 = item.useSafeguard && includes15to16 && !is51015Event; // No safeguard needed if guaranteed
        const safeguard16to17 = item.useSafeguard && includes16to17;

        logger.info('Calculating cost for item:', item.name, 'with params:', {
          equipLevel: item.equipLevel,
          currentStar: item.currentStar,
          targetStar: item.targetStar,
          eventType: globalSettings.eventType,
          mvpLevel: globalSettings.mvpLevel,
          isZeroWeapon: item.isZeroWeapon,
          safeguard15to16,
          safeguard16to17,
          useStarCatch: globalSettings.useStarCatch
        });

        const result = calculateStarforceCost(item.equipLevel, item.currentStar, item.targetStar, {
          eventType: globalSettings.eventType,
          mvpLevel: globalSettings.mvpLevel,
          hasPremium: false,
          isZeroWeapon: item.isZeroWeapon,
          safeguard15to16,
          safeguard16to17,
          useStarCatch: globalSettings.useStarCatch
        });

        logger.info('Calculation result:', result);
        logger.info('Calculation completed for item:', item.name);
        
        return {
          ...currentData,
          characters: currentData.characters.map(char => 
            char.id === characterId 
              ? {
                  ...char,
                  items: char.items.map(item => 
                    item.id === itemId 
                      ? { ...item, calculationResult: result }
                      : item
                  )
                }
              : char
          )
        };
      } catch (error) {
        logger.error('Calculation failed for item:', item.name, error);
        
        return {
          ...currentData,
          characters: currentData.characters.map(char => 
            char.id === characterId 
              ? {
                  ...char,
                  items: char.items.map(item => 
                    item.id === itemId 
                      ? { ...item, calculationResult: { success: false, error: 'Calculation failed. Please try again.' } }
                      : item
                  )
                }
              : char
          )
        };
      }
    });
  }, [globalSettings]);

  // Calculate total cost for a character
  const getCharacterTotalCost = useCallback((character) => {
    return character.items.reduce((total, item) => {
      if (item.calculationResult?.success) {
        return total + item.calculationResult.averageCost;
      }
      return total;
    }, 0);
  }, []);

  // Calculate overall total cost
  const getOverallTotalCost = useCallback(() => {
    return plannerData.characters.reduce((total, character) => {
      return total + getCharacterTotalCost(character);
    }, 0);
  }, [plannerData.characters, getCharacterTotalCost]);

  // Manual calculation function for calculator mode
  const handleCalculate = useCallback(() => {
    // Validate inputs
    if (!equipLevel || currentStar === null || targetStar === null || currentStar >= targetStar) {
      setCalculationResult({ success: false, error: 'Please enter valid equipment level and star range.' });
      return;
    }
    
    setIsCalculating(true);
    
    // Run calculation in next tick to allow UI to update
    setTimeout(() => {
      try {
        logger.info('Starting calculation with params:', {
          equipLevel,
          currentStar,
          targetStar,
          eventType,
          mvpLevel,
          isZeroWeapon,
          safeguard15to16,
          safeguard16to17,
          useStarCatch
        });
        
        const result = calculateStarforceCost(equipLevel, currentStar, targetStar, {
          eventType,
          mvpLevel,
          hasPremium: false, // Not needed for heroic server
          isZeroWeapon,
          safeguard15to16,
          safeguard16to17,
          useStarCatch
        });
        
        logger.info('Calculation completed:', result);
        setCalculationResult(result);
      } catch (error) {
        logger.error('Calculation failed:', error);
        setCalculationResult({ success: false, error: 'Calculation failed. Please try again.' });
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  }, [equipLevel, currentStar, targetStar, eventType, mvpLevel, isZeroWeapon, safeguard15to16, safeguard16to17, useStarCatch]);

  // Clear results when inputs change to indicate recalculation needed
  useEffect(() => {
    if (calculationResult) {
      setCalculationResult(null);
    }
  }, [equipLevel, currentStar, targetStar, eventType, mvpLevel, isZeroWeapon, safeguard15to16, safeguard16to17, useStarCatch]);

  // Redirect if not logged in - handled by ProtectedRoute in App.jsx
  if (!isLoggedIn) {
    return null;
  }

  const mvpOptions = getMvpLevelOptions();

  // Check if safeguard options should be disabled based on events
  const is51015Event = eventType === '51015' || eventType === 'ssf';
  const shouldDisableSafeguard15to16 = is51015Event; // 15→16 is guaranteed during 5/10/15 events

  // Auto-disable safeguard if event makes it unnecessary
  useEffect(() => {
    if (shouldDisableSafeguard15to16 && safeguard15to16) {
      setSafeguard15to16(false);
      logger.info('Safeguard 15→16 disabled due to 5/10/15 event (guaranteed success)');
    }
  }, [eventType, shouldDisableSafeguard15to16, safeguard15to16]);

  // Auto-cap equipment level when Zero weapon is toggled
  useEffect(() => {
    if (isZeroWeapon && equipLevel > 150) {
      setEquipLevel(150);
      logger.info('Equipment level capped at 150 due to Zero weapon setting');
    }
  }, [isZeroWeapon, equipLevel]);

  return (
    <div className="enhancement-calculator-page-wrapper">
      <div className="enhancement-calculator-page">
        <ViewTransitionWrapper>
          <div className="enhancement-calculator-main fade-in">
            <div className="enhancement-header">
              <h2 className="enhancement-title">Enhancement Calculator</h2>
              <p className="enhancement-subtitle">Calculate meso costs for starforcing equipment</p>
              
              {/* Mode Toggle */}
              <div className="mode-toggle">
                <button
                  className={`mode-button ${mode === 'calculator' ? 'active' : ''}`}
                  onClick={() => setMode('calculator')}
                >
                  Single Calculator
                </button>
                <button
                  className={`mode-button ${mode === 'planner' ? 'active' : ''}`}
                  onClick={() => setMode('planner')}
                >
                  Multi-Character Planner
                </button>
              </div>
            </div>

            {mode === 'calculator' ? (
              // Existing calculator mode
              <div className="enhancement-container">
                {/* Input Section */}
                <div className="enhancement-inputs">
                  <div className="enhancement-section">
                    <h3 className="section-title">Equipment Settings</h3>
                    
                                    {/* Equipment Level */}
                <div className="input-group">
                  <label htmlFor="equip-level">
                    Equipment Level:
                    {isZeroWeapon && <span className="level-cap-info"> (Max 150 for Zero weapons)</span>}
                  </label>
                  <input
                    id="equip-level"
                    type="number"
                    min="1"
                    max={isZeroWeapon ? "150" : "300"}
                    value={equipLevel}
                    onChange={(e) => {
                      const newLevel = parseInt(e.target.value) || 1;
                      const maxLevel = isZeroWeapon ? 150 : 300;
                      setEquipLevel(Math.min(newLevel, maxLevel));
                    }}
                    className="level-input"
                  />
                </div>
                    
                    {/* Zero Weapon Toggle */}
                    <div className="toggle-group">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={isZeroWeapon}
                          onChange={(e) => setIsZeroWeapon(e.target.checked)}
                          className="toggle-checkbox"
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">Zero Weapon (Capped at Level 150)</span>
                      </label>
                    </div>
                  </div>

                  <div className="enhancement-section">
                    <h3 className="section-title">Star Range</h3>
                    
                    {/* Star Range Inputs */}
                    <div className="star-range-inputs">
                      <div className="input-group">
                        <label htmlFor="current-star">Current Stars:</label>
                        <select
                          id="current-star"
                          value={currentStar}
                          onChange={(e) => setCurrentStar(parseInt(e.target.value))}
                          className="star-select"
                        >
                          {Array.from({ length: 25 }, (_, i) => (
                            <option 
                              key={i} 
                              value={i}
                            >
                              {i}★
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label htmlFor="target-star">Target Stars:</label>
                        <select
                          id="target-star"
                          value={targetStar}
                          onChange={(e) => setTargetStar(parseInt(e.target.value))}
                          className="star-select"
                        >
                          {Array.from({ length: 25 }, (_, i) => i + 1).map(i => (
                            <option 
                              key={i} 
                              value={i} 
                              disabled={i <= currentStar}
                            >
                              {i}★
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="enhancement-section">
                    <h3 className="section-title">Discounts & Events</h3>
                    
                    {/* MVP Level Selection */}
                    <div className="input-group">
                      <label htmlFor="mvp-level">MVP Level:</label>
                      <select
                        id="mvp-level"
                        value={mvpLevel}
                        onChange={(e) => setMvpLevel(e.target.value)}
                        className="mvp-select"
                      >
                        {mvpOptions.map((option) => (
                          <option 
                            key={option.value} 
                            value={option.value}
                          >
                            {option.name} ({option.discount})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Event Type Selection */}
                    <div className="input-group">
                      <label htmlFor="event-type">Active Event:</label>
                      <select
                        id="event-type"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="event-select"
                      >
                        <option value="none">No Event</option>
                        <option value="30off">30% Cost Reduction</option>
                        <option value="51015">5/10/15 Guaranteed Success</option>
                        <option value="ssf">Shiny Star Force (30% + 5/10/15)</option>
                      </select>
                    </div>

                    {/* Event Info */}
                    {eventType !== 'none' && (
                      <div className="event-info">
                        {eventType === '30off' && (
                          <p className="info-text">
                            <span className="event-badge">30% Off</span>
                            All starforce costs reduced by 30%
                          </p>
                        )}
                        {eventType === '51015' && (
                          <p className="info-text">
                            <span className="event-badge guaranteed">5/10/15</span>
                            Guaranteed success for 5★→6★, 10★→11★, and 15★→16★ upgrades
                          </p>
                        )}
                        {eventType === 'ssf' && (
                          <p className="info-text">
                            <span className="event-badge">SSF</span>
                            30% cost reduction + guaranteed success for 5★→6★, 10★→11★, and 15★→16★
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="enhancement-section">
                    <h3 className="section-title">Star Catch Minigame</h3>
                    
                    <div className="toggle-group">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={useStarCatch}
                          onChange={(e) => setUseStarCatch(e.target.checked)}
                          className="toggle-checkbox"
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">Use Star Catch (+5% Success Rate)</span>
                      </label>
                    </div>
                    
                    {useStarCatch && (
                      <div className="starcatch-info">
                        <p className="info-text">
                          Star Catch minigame increases success rate by 5% multiplicatively when successful.
                          Does not appear during guaranteed upgrades (5/10/15 events, Chance Time).
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="enhancement-section">
                    <h3 className="section-title">Safeguard Options</h3>
                    
                    <div className="toggle-group">
                      <label className={`toggle-label ${shouldDisableSafeguard15to16 ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={safeguard15to16}
                          onChange={(e) => setSafeguard15to16(e.target.checked)}
                          className="toggle-checkbox"
                          disabled={shouldDisableSafeguard15to16}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">
                          Safeguard 15★ → 16★
                          {shouldDisableSafeguard15to16 && <span className="disabled-reason"> (Guaranteed by event)</span>}
                        </span>
                      </label>
                    </div>
                    
                    <div className="toggle-group">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={safeguard16to17}
                          onChange={(e) => setSafeguard16to17(e.target.checked)}
                          className="toggle-checkbox"
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">Safeguard 16★ → 17★</span>
                      </label>
                    </div>
                    
                    {(safeguard15to16 || safeguard16to17) && (
                      <div className="safeguard-info">
                        <p className="info-text">
                          Safeguard doubles the cost but prevents equipment destruction.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Calculate Button Section */}
                  <div className="enhancement-section">
                    <div className="calculate-section">
                      <button
                        onClick={handleCalculate}
                        disabled={isCalculating || !equipLevel || currentStar >= targetStar}
                        className={`calculate-button ${isCalculating ? 'calculating' : ''}`}
                      >
                        {isCalculating ? (
                          <>
                            <div className="button-spinner"></div>
                            <span>Running Simulation...</span>
                          </>
                        ) : (
                          <>
                            <span>🎲</span>
                            <span>Calculate Starforce Cost</span>
                          </>
                        )}
                      </button>
                      
                      <div className="calculate-info">
                        <p className="info-text">
                          Runs 10,000 simulations to provide realistic cost estimates and risk analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results Section */}
                <div className="enhancement-results">
                  {isCalculating ? (
                    <div className="calculating-indicator">
                      <div className="spinner"></div>
                      <span>Calculating...</span>
                    </div>
                  ) : calculationResult ? (
                    calculationResult.success ? (
                      <div className="results-content">
                        <div className="simulation-header">
                          <h3 className="results-title">Simulation Results</h3>
                          <div className="simulation-info">
                            <span className="simulation-count">{calculationResult.simulationCount.toLocaleString()} simulations</span>
                            <span className="simulation-time">({calculationResult.duration.toFixed(0)}ms)</span>
                          </div>
                        </div>

                        <div className="statistics-grid">
                          <div className="stat-card primary">
                            <h4>Average Cost</h4>
                            <div className="stat-value-container">
                              <div className="stat-value">
                                {formatMesos(calculationResult.averageCost)}
                              </div>
                              <div className="stat-tooltip">
                                {calculationResult.averageCost.toLocaleString()} mesos
                              </div>
                            </div>
                            <div className="stat-unit">mesos</div>
                          </div>
                          
                          <div className="stat-card">
                            <h4>Median Cost</h4>
                            <div className="stat-value-container">
                              <div className="stat-value">
                                {formatMesos(calculationResult.medianCost)}
                              </div>
                              <div className="stat-tooltip">
                                {calculationResult.medianCost.toLocaleString()} mesos
                              </div>
                            </div>
                            <div className="stat-unit">mesos</div>
                          </div>
                          
                          <div className="stat-card">
                            <h4>Average Booms</h4>
                            <div className="stat-value">{calculationResult.averageBooms.toFixed(2)}</div>
                            <div className="stat-unit">booms</div>
                          </div>
                          
                          <div className="stat-card">
                            <h4>90th Percentile</h4>
                            <div className="stat-value-container">
                              <div className="stat-value">
                                {formatMesos(calculationResult.percentile90Cost)}
                              </div>
                              <div className="stat-tooltip">
                                {calculationResult.percentile90Cost.toLocaleString()} mesos
                              </div>
                            </div>
                            <div className="stat-unit">mesos</div>
                          </div>
                        </div>

                        <div className="risk-analysis">
                          <h4>Cost Range Analysis</h4>
                          <div className="range-stats">
                            <div className="range-item">
                              <span className="range-label">Best Case:</span>
                              <span className="range-value">{formatMesos(calculationResult.minCost)}</span>
                            </div>
                            <div className="range-item">
                              <span className="range-label">25th Percentile:</span>
                              <span className="range-value">{formatMesos(calculationResult.percentile25Cost)}</span>
                            </div>
                            <div className="range-item">
                              <span className="range-label">75th Percentile:</span>
                              <span className="range-value">{formatMesos(calculationResult.percentile75Cost)}</span>
                            </div>
                            <div className="range-item">
                              <span className="range-label">99th Percentile:</span>
                              <span className="range-value">{formatMesos(calculationResult.percentile99Cost)}</span>
                            </div>
                            <div className="range-item worst-case">
                              <span className="range-label">Worst Case:</span>
                              <span className="range-value">{formatMesos(calculationResult.maxCost)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="outcome-analysis">
                          <h4>Enhancement Outcomes</h4>
                          <div className="outcome-stats">
                            <div className="outcome-item success">
                              <span className="outcome-label">Avg Successes:</span>
                              <span className="outcome-value">{calculationResult.averageSuccesses}</span>
                            </div>
                            <div className="outcome-item decrease">
                              <span className="outcome-label">Avg Decreases:</span>
                              <span className="outcome-value">{calculationResult.averageDecreases}</span>
                            </div>
                            <div className="outcome-item boom">
                              <span className="outcome-label">Avg Booms:</span>
                              <span className="outcome-value">{calculationResult.averageBooms}</span>
                            </div>
                            <div className="outcome-item chance-time">
                              <span className="outcome-label">Chance Time Usage:</span>
                              <span className="outcome-value">{calculationResult.chanceTimeUsageRate}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="simulation-summary">
                          <h4>Simulation Parameters</h4>
                          <div className="summary-grid">
                            <div className="summary-item">
                              <span className="summary-label">Equipment Level:</span>
                              <span className="summary-value">{calculationResult.equipLevel}</span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Star Range:</span>
                              <span className="summary-value">{calculationResult.currentStar}★ → {calculationResult.targetStar}★</span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Event:</span>
                              <span className="summary-value">
                                {calculationResult.options.eventType === 'none' && 'None'}
                                {calculationResult.options.eventType === '30off' && '30% Cost Reduction'}
                                {calculationResult.options.eventType === '51015' && '5/10/15 Guaranteed'}
                                {calculationResult.options.eventType === 'ssf' && 'Shiny Star Force'}
                              </span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">MVP Level:</span>
                              <span className="summary-value">{calculationResult.options.mvpLevel === 'none' ? 'None' : calculationResult.options.mvpLevel.toUpperCase()}</span>
                            </div>
                            {calculationResult.options.useStarCatch && (
                              <div className="summary-item">
                                <span className="summary-label">Star Catch:</span>
                                <span className="summary-value">Enabled (+5% Success)</span>
                              </div>
                            )}
                            {(calculationResult.options.safeguard15to16 || calculationResult.options.safeguard16to17) && (
                              <div className="summary-item">
                                <span className="summary-label">Safeguards:</span>
                                <span className="summary-value">
                                  {calculationResult.options.safeguard15to16 && '15★→16★'}
                                  {calculationResult.options.safeguard15to16 && calculationResult.options.safeguard16to17 && ', '}
                                  {calculationResult.options.safeguard16to17 && '16★→17★'}
                                </span>
                              </div>
                            )}
                            {calculationResult.options.isZeroWeapon && (
                              <div className="summary-item">
                                <span className="summary-label">Zero Weapon:</span>
                                <span className="summary-value">Yes (Capped at 150)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        <span>{calculationResult.error}</span>
                      </div>
                    )
                  ) : (
                    <div className="no-results">
                      <span>Click the "Calculate Starforce Cost" button to run simulation</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Planner mode
              <div className="planner-container">
                {/* Global Settings Panel */}
                <div className="global-settings-panel">
                  <h3 className="section-title">Global Settings</h3>
                  <div className="global-settings-grid">
                    <div className="setting-group">
                      <label>Event Type:</label>
                      <select
                        value={globalSettings.eventType}
                        onChange={(e) => setGlobalSettings(prev => ({ ...prev, eventType: e.target.value }))}
                        className="setting-select"
                      >
                        <option value="none">No Event</option>
                        <option value="30off">30% Cost Reduction</option>
                        <option value="51015">5/10/15 Guaranteed Success</option>
                        <option value="ssf">Shiny Star Force (30% + 5/10/15)</option>
                      </select>
                    </div>

                    <div className="setting-group">
                      <label>MVP Level:</label>
                      <select
                        value={globalSettings.mvpLevel}
                        onChange={(e) => setGlobalSettings(prev => ({ ...prev, mvpLevel: e.target.value }))}
                        className="setting-select"
                      >
                        {mvpOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.name} ({option.discount})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="setting-group">
                      <button
                        type="button"
                        className={`toggle-button ${globalSettings.useStarCatch ? 'active' : ''}`}
                        onClick={() => setGlobalSettings(prev => ({ ...prev, useStarCatch: !prev.useStarCatch }))}
                      >
                        <span className="toggle-icon">⭐</span>
                        <span className="toggle-text">Star Catch (+5%)</span>
                      </button>
                    </div>

                    <div className="setting-group">
                      <button
                        onClick={calculateAllItems}
                        className="calculate-all-button"
                        disabled={plannerData.characters.length === 0}
                      >
                        <span>🎲</span>
                        <span>Re-run All Simulations</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Character Management */}
                <div className="planner-header">
                  <div className="add-character-section">
                    <h3 className="section-title">Add Character</h3>
                    <div className="add-character-form">
                      <input
                        type="text"
                        value={newCharacterName}
                        onChange={(e) => setNewCharacterName(e.target.value)}
                        placeholder="Enter character name..."
                        className="character-name-input"
                        onKeyPress={(e) => e.key === 'Enter' && addCharacter()}
                      />
                      <button
                        onClick={addCharacter}
                        disabled={!newCharacterName.trim()}
                        className="add-character-button"
                      >
                        Add Character
                      </button>
                    </div>
                  </div>

                  {/* Overall Total */}
                  {plannerData.characters.length > 0 && (
                    <div className="overall-total">
                      <h3 className="section-title">Overall Total</h3>
                      <div className="total-cost-display">
                        <span className="total-amount">{formatMesos(getOverallTotalCost())}</span>
                        <span className="total-unit">mesos</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Characters List */}
                <div className="characters-list">
                  {plannerData.characters.length === 0 ? (
                    <div className="no-characters">
                      <span>No characters added yet. Add a character to start planning!</span>
                    </div>
                  ) : (
                    plannerData.characters.map((character) => (
                      <div key={character.id} className="character-card">
                        <div className="character-header">
                          <div className="character-info">
                            <div className="character-name-row">
                              <h4 className="character-name">{character.name}</h4>
                            </div>
                            <div className="character-stats">
                              <span className="item-count">{character.items.length} items</span>
                              <span className="calculated-items">
                                {character.items.filter(item => item.calculationResult?.success).length} calculated
                              </span>
                            </div>
                          </div>
                          <span className="character-total-badge">
                            {formatMesos(getCharacterTotalCost(character))}
                          </span>
                          <div className="character-actions">
                            <button
                              onClick={() => toggleCharacterExpanded(character.id)}
                              className="expand-button"
                            >
                              {expandedCharacters.has(character.id) ? '▲' : '▼'}
                            </button>
                            <button
                              onClick={() => removeCharacter(character.id)}
                              className="remove-character-button"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {expandedCharacters.has(character.id) && (
                          <div className="character-content">
                            <div className="items-section">
                              <div className="items-header">
                                <h5>Items</h5>
                                <button
                                  onClick={() => addItem(character.id)}
                                  className="add-item-button"
                                >
                                  + Add Item
                                </button>
                              </div>

                              {character.items.length === 0 ? (
                                <div className="no-items">
                                  <span>No items added yet.</span>
                                </div>
                              ) : (
                                <div className="items-list">
                                  {character.items.map((item) => (
                                    <ItemCard
                                      key={item.id}
                                      item={item}
                                      characterId={character.id}
                                      onUpdateItem={updateItem}
                                      onRemoveItem={removeItem}
                                      onCalculate={calculateItemCost}
                                      mvpOptions={mvpOptions}
                                      equipmentTypes={equipmentTypes}
                                      globalSettings={globalSettings}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </ViewTransitionWrapper>
      </div>
    </div>
  );
}

// Item Card Component for Planner
function ItemCard({ item, characterId, onUpdateItem, onRemoveItem, onCalculate, mvpOptions, equipmentTypes, globalSettings }) {
  const handleInputChange = (field, value) => {
    // If changing equipment type, also update the name
    if (field === 'type') {
      const selectedEquip = equipmentTypes.find(eq => eq.value === value);
      onUpdateItem(characterId, item.id, { 
        [field]: value,
        name: selectedEquip ? selectedEquip.name : value
      });
    } else if (field === 'equipLevel') {
      // Cap level at 150 if Zero weapon is enabled
      const maxLevel = item.isZeroWeapon ? 150 : 300;
      const cappedValue = Math.min(value, maxLevel);
      onUpdateItem(characterId, item.id, { [field]: cappedValue });
    } else if (field === 'isZeroWeapon') {
      // If enabling Zero weapon and level > 150, cap it
      const updates = { [field]: value };
      if (value && item.equipLevel > 150) {
        updates.equipLevel = 150;
      }
      onUpdateItem(characterId, item.id, updates);
    } else {
      onUpdateItem(characterId, item.id, { [field]: value });
    }
  };

  // Auto-calculate when item settings change
  useEffect(() => {
    // Only auto-calculate if we have valid settings
    if (item.equipLevel && item.currentStar !== null && item.targetStar !== null && item.currentStar < item.targetStar) {
      // Add a small delay to avoid excessive calculations during rapid changes
      const timeoutId = setTimeout(() => {
        onCalculate(characterId, item.id);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [item.equipLevel, item.currentStar, item.targetStar, item.isZeroWeapon, item.useSafeguard, characterId, item.id, onCalculate]);

  // Check if safeguard options should be disabled based on global events
  const is51015Event = globalSettings.eventType === '51015' || globalSettings.eventType === 'ssf';
  
  // Determine what safeguard actually protects based on event and star range
  const getSafeguardTooltip = () => {
    const starRange = `${item.currentStar}★→${item.targetStar}★`;
    const includes15to16 = item.currentStar <= 15 && item.targetStar >= 16;
    const includes16to17 = item.currentStar <= 16 && item.targetStar >= 17;
    
    if (!includes15to16 && !includes16to17) {
      return "Safeguard (no dangerous upgrades in range)";
    }
    
    if (is51015Event) {
      // 15→16 is guaranteed, only 16→17 needs safeguard
      if (includes16to17) {
        return `Safeguard 16★→17★ (15★→16★ guaranteed by event)`;
      } else {
        return "Safeguard (15★→16★ guaranteed by event)";
      }
    } else {
      // Normal event or no event
      const protectedRanges = [];
      if (includes15to16) protectedRanges.push("15★→16★");
      if (includes16to17) protectedRanges.push("16★→17★");
      
      if (protectedRanges.length > 0) {
        return `Safeguard ${protectedRanges.join(" & ")}`;
      } else {
        return "Safeguard";
      }
    }
  };

  return (
    <div className="item-card">
      <div className="item-header">
        <div className="item-info">
          <div className="item-header-row-inline">
            {/* Equipment Type */}
            <div className="item-type-selector">
              <select
                value={item.type || 'weapon'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="item-type-select"
              >
                {equipmentTypes.map((equipType) => (
                  <option key={equipType.value} value={equipType.value}>
                    {equipType.icon} {equipType.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Level Input */}
            <div className="summary-control-inline">
              <label>
                Lv.
                {item.isZeroWeapon && <span className="level-cap-hint" title="Zero weapons capped at 150">(≤150)</span>}
              </label>
              <input
                type="number"
                min="1"
                max={item.isZeroWeapon ? "150" : "300"}
                value={item.equipLevel}
                onChange={(e) => handleInputChange('equipLevel', parseInt(e.target.value) || 1)}
                className="level-input-inline"
              />
            </div>
            
            {/* Star Range Controls */}
            <div className="star-range-inline">
              <select
                value={item.currentStar}
                onChange={(e) => handleInputChange('currentStar', parseInt(e.target.value))}
                className="star-select-inline"
              >
                {Array.from({ length: 25 }, (_, i) => (
                  <option key={i} value={i}>{i}★</option>
                ))}
              </select>
              <span className="star-arrow">→</span>
              <select
                value={item.targetStar}
                onChange={(e) => handleInputChange('targetStar', parseInt(e.target.value))}
                className="star-select-inline"
              >
                {Array.from({ length: 25 }, (_, i) => i + 1).map(i => (
                  <option key={i} value={i} disabled={i <= item.currentStar}>
                    {i}★
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Controls */}
            <div className="toggle-controls-inline">
              <button
                type="button"
                className={`toggle-btn-inline ${item.isZeroWeapon ? 'active' : ''}`}
                onClick={() => handleInputChange('isZeroWeapon', !item.isZeroWeapon)}
                title="Zero Weapon"
              >
                <span className="toggle-icon">⚔️</span>
                <span className="toggle-text">Zero Weapon</span>
              </button>

              <button
                type="button"
                className={`toggle-btn-inline ${item.useSafeguard ? 'active' : ''}`}
                onClick={() => handleInputChange('useSafeguard', !item.useSafeguard)}
                title={getSafeguardTooltip()}
              >
                <span className="toggle-icon">🛡️</span>
                <span className="toggle-text">Safeguard</span>
              </button>
            </div>

            {/* Cost Display */}
            {item.calculationResult?.success ? (
              <div className="item-cost-badge">
                💰 {formatMesos(item.calculationResult.averageCost)}
              </div>
            ) : (
              <div className="item-cost-pending-badge">
                {item.equipLevel && item.currentStar < item.targetStar ? 'Calculating...' : 'Not calculated'}
              </div>
            )}
          </div>
        </div>
        <div className="item-actions">
          <button
            onClick={() => onRemoveItem(characterId, item.id)}
            className="remove-item-button"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Error Display */}
      {item.calculationResult && !item.calculationResult.success && (
        <div className="item-error-inline">
          ⚠️ {item.calculationResult.error}
        </div>
      )}
    </div>
  );
}

export default EnhancementCalculatorPage; 