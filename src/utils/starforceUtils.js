import { logger } from './logger';

/**
 * Starforce success rates by star level (base rates without any modifiers)
 * Based on official GMS rates from the wiki
 * Note: 🠋 symbol indicates failure results in star decrease, not maintain
 */
const STARFORCE_RATES = {
  0: { success: 95, maintain: 5, decrease: 0, destroy: 0 },
  1: { success: 90, maintain: 10, decrease: 0, destroy: 0 },
  2: { success: 85, maintain: 15, decrease: 0, destroy: 0 },
  3: { success: 85, maintain: 15, decrease: 0, destroy: 0 },
  4: { success: 80, maintain: 20, decrease: 0, destroy: 0 },
  5: { success: 75, maintain: 25, decrease: 0, destroy: 0 },
  6: { success: 70, maintain: 30, decrease: 0, destroy: 0 },
  7: { success: 65, maintain: 35, decrease: 0, destroy: 0 },
  8: { success: 60, maintain: 40, decrease: 0, destroy: 0 },
  9: { success: 55, maintain: 45, decrease: 0, destroy: 0 },
  10: { success: 50, maintain: 50, decrease: 0, destroy: 0 },
  11: { success: 45, maintain: 55, decrease: 0, destroy: 0 },
  12: { success: 40, maintain: 60, decrease: 0, destroy: 0 },
  13: { success: 35, maintain: 65, decrease: 0, destroy: 0 },
  14: { success: 30, maintain: 70, decrease: 0, destroy: 0 },
  15: { success: 30, maintain: 67.9, decrease: 0, destroy: 2.1 }, // 15→16 doesn't decrease on fail
  16: { success: 30, maintain: 0, decrease: 67.9, destroy: 2.1 }, // 16→17 decreases on fail
  17: { success: 30, maintain: 0, decrease: 67.9, destroy: 2.1 }, // 17→18 decreases on fail  
  18: { success: 30, maintain: 0, decrease: 67.2, destroy: 2.8 }, // 18→19 decreases on fail
  19: { success: 30, maintain: 0, decrease: 67.2, destroy: 2.8 }, // 19→20 decreases on fail
  20: { success: 30, maintain: 63, decrease: 0, destroy: 7 }, // 20→21 doesn't decrease on fail
  21: { success: 30, maintain: 0, decrease: 63, destroy: 7 }, // 21→22 decreases on fail
  22: { success: 3, maintain: 0, decrease: 77.6, destroy: 19.4 }, // 22→23 decreases on fail
  23: { success: 2, maintain: 0, decrease: 68.6, destroy: 29.4 }, // 23→24 decreases on fail
  24: { success: 1, maintain: 0, decrease: 59.4, destroy: 39.6 } // 24→25 decreases on fail
};

/**
 * Simulate starforce enhancement with all mechanics
 * @param {number} equipLevel - Equipment level
 * @param {number} currentStar - Current star level
 * @param {number} targetStar - Target star level
 * @param {Object} options - Enhancement options
 * @param {number} simulations - Number of simulations to run (default: 10000)
 * @returns {Object} - Simulation results with statistics
 */
export function calculateStarforceCost(equipLevel, currentStar, targetStar, options = {}, simulations = 10000) {
  try {
    logger.info('Starting starforce simulation', {
      equipLevel,
      currentStar,
      targetStar,
      options,
      simulations
    });

    // Validation
    if (!equipLevel || equipLevel < 1 || equipLevel > 300) {
      return { success: false, error: 'Invalid equipment level. Must be between 1-300.' };
    }

    if (currentStar < 0 || currentStar > 25 || targetStar < 0 || targetStar > 25) {
      return { success: false, error: 'Invalid star levels. Must be between 0-25.' };
    }

    if (currentStar >= targetStar) {
      return { success: false, error: 'Target star must be higher than current star.' };
    }

    // Extract options with defaults
    const {
      eventType = 'none',
      mvpLevel = 'none',
      hasPremium = false,
      isZeroWeapon = false,
      safeguard15to16 = false,
      safeguard16to17 = false,
      useStarCatch = false
    } = options;

    // Run simulations
    const results = [];
    const startTime = performance.now();

    for (let i = 0; i < simulations; i++) {
      const result = simulateSingleRun(equipLevel, currentStar, targetStar, {
        eventType,
        mvpLevel,
        hasPremium,
        isZeroWeapon,
        safeguard15to16,
        safeguard16to17,
        useStarCatch
      });
      results.push(result);
    }

    const endTime = performance.now();
    
    // Analyze results
    const analysis = analyzeSimulationResults(results);
    
    logger.info('Starforce simulation completed', {
      simulations,
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      averageCost: analysis.averageCost,
      averageAttempts: analysis.averageAttempts
    });

    return {
      success: true,
      ...analysis,
      equipLevel,
      currentStar,
      targetStar,
      options: { eventType, mvpLevel, hasPremium, isZeroWeapon, safeguard15to16, safeguard16to17, useStarCatch },
      simulationCount: simulations,
      duration: endTime - startTime
    };

  } catch (error) {
    logger.error('Error in starforce simulation', error);
    return { success: false, error: 'Failed to simulate starforce enhancement. Please try again.' };
  }
}

/**
 * Simulate a single starforce run from current to target star
 * @param {number} equipLevel - Equipment level
 * @param {number} startStar - Starting star level
 * @param {number} targetStar - Target star level
 * @param {Object} options - Enhancement options
 * @returns {Object} - Single run results
 */
function simulateSingleRun(equipLevel, startStar, targetStar, options) {
  let currentStar = startStar;
  let totalCost = 0;
  let attempts = 0;
  let chanceTimeActive = false;
  let consecutiveDecreases = 0;
  let booms = 0;
  let decreases = 0;
  let successes = 0;

  const effectiveLevel = getEffectiveEquipLevel(equipLevel, options.isZeroWeapon);

  while (currentStar < targetStar) {
    attempts++;
    
    // Get cost for this attempt
    const attemptCost = getSingleAttemptCost(effectiveLevel, currentStar, options, equipLevel);
    totalCost += attemptCost;

    // Determine if this upgrade is guaranteed
    const isGuaranteedUpgrade = chanceTimeActive || 
      ((options.eventType === '51015' || options.eventType === 'ssf') && 
       (currentStar === 5 || currentStar === 10 || currentStar === 15));

    // Get success rates for this star level
    const rates = getModifiedSuccessRates(currentStar, options, isGuaranteedUpgrade);
    
    // Roll for outcome
    const outcome = rollOutcome(rates);
    
    // Apply outcome
    if (outcome === 'success') {
      currentStar++;
      successes++;
      consecutiveDecreases = 0;
      chanceTimeActive = false;
    } else if (outcome === 'decrease') {
      // Decrease only happens at specific star levels (16+, 21+, 22+)
      // Stars can't go below 12★
      if (currentStar >= 12) {
        currentStar = Math.max(12, currentStar - 1);
        decreases++;
        consecutiveDecreases++;
        
        // Check for Chance Time (2 consecutive decreases)
        if (consecutiveDecreases >= 2) {
          chanceTimeActive = true;
          consecutiveDecreases = 0; // Reset counter
        }
      }
    } else if (outcome === 'destroy') {
      // Check if safeguarded
      const isSafeguarded = (currentStar === 15 && options.safeguard15to16) || 
                           (currentStar === 16 && options.safeguard16to17);
      
      if (!isSafeguarded) {
        currentStar = 12; // Item destroyed, reset to 12★ (trace mechanics)
        booms++;
        consecutiveDecreases = 0;
        chanceTimeActive = false;
      }
      // If safeguarded, treat as maintain (no star change, no destruction)
    }
    // 'maintain' does nothing

    // Safety check to prevent infinite loops
    if (attempts > 10000) {
      logger.warn('Simulation exceeded 10000 attempts, terminating');
      break;
    }
  }

  return {
    totalCost,
    attempts,
    successes,
    decreases,
    booms,
    chanceTimeUsed: successes > (targetStar - startStar) // Approximate
  };
}

/**
 * Get modified success rates based on options
 * @param {number} currentStar - Current star level
 * @param {Object} options - Enhancement options
 * @param {boolean} isGuaranteedUpgrade - Whether this upgrade is guaranteed
 * @returns {Object} - Modified success rates
 */
function getModifiedSuccessRates(currentStar, options, isGuaranteedUpgrade) {
  const baseRates = STARFORCE_RATES[currentStar];
  
  if (isGuaranteedUpgrade) {
    return { success: 100, maintain: 0, decrease: 0, destroy: 0 };
  }

  let successRate = baseRates.success;
  
  // Apply Star Catch bonus (+5% multiplicatively)
  if (options.useStarCatch && !isGuaranteedUpgrade) {
    successRate *= 1.05;
  }

  // Redistribute rates to maintain 100% total
  const totalNonSuccess = baseRates.maintain + baseRates.decrease + baseRates.destroy;
  const successIncrease = successRate - baseRates.success;
  const redistributionFactor = totalNonSuccess > 0 ? (100 - successRate) / totalNonSuccess : 0;

  return {
    success: successRate,
    maintain: baseRates.maintain * redistributionFactor,
    decrease: baseRates.decrease * redistributionFactor,
    destroy: baseRates.destroy * redistributionFactor
  };
}

/**
 * Roll for enhancement outcome based on rates
 * @param {Object} rates - Success rates
 * @returns {string} - Outcome ('success', 'maintain', 'decrease', 'destroy')
 */
function rollOutcome(rates) {
  const roll = Math.random() * 100;
  
  if (roll < rates.success) {
    return 'success';
  } else if (roll < rates.success + rates.maintain) {
    return 'maintain';
  } else if (roll < rates.success + rates.maintain + rates.decrease) {
    return 'decrease';
  } else {
    return 'destroy';
  }
}

/**
 * Get cost for a single enhancement attempt
 * @param {number} effectiveLevel - Effective equipment level
 * @param {number} currentStar - Current star level
 * @param {Object} options - Enhancement options
 * @param {number} originalLevel - Original equipment level
 * @returns {number} - Cost for this attempt
 */
function getSingleAttemptCost(effectiveLevel, currentStar, options, originalLevel) {
  let baseCost = 0;
  
  // Check for special cost caps first
  const specialCap = getSpecialCostCap(originalLevel, currentStar);
  if (specialCap !== null) {
    baseCost = specialCap;
  } else {
    // Calculate base cost using GMS formula
    const equipLevelCubed = Math.round(Math.pow(effectiveLevel, 3));
    const starPlusOne = currentStar + 1;

    // Apply GMS formula based on star level
    if (currentStar >= 0 && currentStar <= 9) {
      baseCost = (100 * equipLevelCubed * starPlusOne) / (2500 + 10);
    } else if (currentStar === 10) {
      baseCost = (100 * equipLevelCubed * Math.pow(starPlusOne, 2.7)) / (40000 + 10);
    } else if (currentStar === 11) {
      baseCost = (100 * equipLevelCubed * Math.pow(starPlusOne, 2.7)) / (22000 + 10);
    } else if (currentStar === 12) {
      baseCost = (100 * equipLevelCubed * Math.pow(starPlusOne, 2.7)) / (15000 + 10);
    } else if (currentStar === 13) {
      baseCost = (100 * equipLevelCubed * Math.pow(starPlusOne, 2.7)) / (11000 + 10);
    } else if (currentStar === 14) {
      baseCost = (100 * equipLevelCubed * Math.pow(starPlusOne, 2.7)) / (7500 + 10);
    } else if (currentStar >= 15 && currentStar <= 24) {
      baseCost = (100 * equipLevelCubed * Math.pow(starPlusOne, 2.7)) / (20000 + 10);
    }

    baseCost = roundToNearestHundreds(baseCost);
  }
  
  let finalCost = applyDiscounts(baseCost, options, currentStar);

  // Apply safeguard cost (doubles the cost)
  const isSafeguarded = (currentStar === 15 && options.safeguard15to16) || 
                       (currentStar === 16 && options.safeguard16to17);
  
  if (isSafeguarded) {
    finalCost *= 2; // Safeguard doubles the cost
  }

  return finalCost;
}

/**
 * Apply discounts to base cost
 * @param {number} baseCost - Base cost before discounts
 * @param {Object} options - Enhancement options
 * @param {number} currentStar - Current star level
 * @returns {number} - Cost after discounts
 */
function applyDiscounts(baseCost, options, currentStar) {
  let finalCost = baseCost;

  // Apply MVP discount (only up to 16★→17★)
  if (currentStar <= 16) {
    const mvpMultiplier = getMvpDiscountMultiplier(options.mvpLevel, options.hasPremium);
    finalCost *= mvpMultiplier;
  }

  // Apply event discount
  const hasDiscountEvent = options.eventType === '30off' || options.eventType === 'ssf';
  if (hasDiscountEvent) {
    finalCost *= 0.7;
  }

  return roundToNearestHundreds(finalCost);
}

/**
 * Analyze simulation results and provide statistics
 * @param {Array} results - Array of simulation results
 * @returns {Object} - Statistical analysis
 */
function analyzeSimulationResults(results) {
  const costs = results.map(r => r.totalCost).sort((a, b) => a - b);
  const attempts = results.map(r => r.attempts).sort((a, b) => a - b);
  
  const totalSuccesses = results.reduce((sum, r) => sum + r.successes, 0);
  const totalDecreases = results.reduce((sum, r) => sum + r.decreases, 0);
  const totalBooms = results.reduce((sum, r) => sum + r.booms, 0);
  
  return {
    // Cost statistics
    averageCost: Math.round(costs.reduce((sum, cost) => sum + cost, 0) / costs.length),
    medianCost: costs[Math.floor(costs.length * 0.5)],
    percentile25Cost: costs[Math.floor(costs.length * 0.25)],
    percentile75Cost: costs[Math.floor(costs.length * 0.75)],
    percentile90Cost: costs[Math.floor(costs.length * 0.9)],
    percentile99Cost: costs[Math.floor(costs.length * 0.99)],
    minCost: costs[0],
    maxCost: costs[costs.length - 1],
    
    // Attempt statistics
    averageAttempts: Math.round(attempts.reduce((sum, att) => sum + att, 0) / attempts.length),
    medianAttempts: attempts[Math.floor(attempts.length * 0.5)],
    percentile90Attempts: attempts[Math.floor(attempts.length * 0.9)],
    minAttempts: attempts[0],
    maxAttempts: attempts[attempts.length - 1],
    
    // Outcome statistics
    averageSuccesses: Math.round(totalSuccesses / results.length),
    averageDecreases: Math.round(totalDecreases / results.length),
    averageBooms: totalBooms / results.length,
    
    // Success rates
    chanceTimeUsageRate: Math.round((results.filter(r => r.chanceTimeUsed).length / results.length) * 100),
    
    // Cost distribution for charts
    costDistribution: generateCostDistribution(costs)
  };
}

/**
 * Generate cost distribution for visualization
 * @param {Array} costs - Sorted array of costs
 * @returns {Array} - Distribution data
 */
function generateCostDistribution(costs) {
  const buckets = 20;
  const min = costs[0];
  const max = costs[costs.length - 1];
  const bucketSize = (max - min) / buckets;
  
  const distribution = [];
  for (let i = 0; i < buckets; i++) {
    const bucketStart = min + (i * bucketSize);
    const bucketEnd = min + ((i + 1) * bucketSize);
    const count = costs.filter(cost => cost >= bucketStart && cost < bucketEnd).length;
    
    distribution.push({
      range: `${formatMesos(bucketStart)} - ${formatMesos(bucketEnd)}`,
      count,
      percentage: Math.round((count / costs.length) * 100)
    });
  }
  
  return distribution;
}

/**
 * Get effective equipment level with rounding and capping rules
 * @param {number} equipLevel - Original equipment level
 * @param {boolean} isZeroWeapon - Whether this is a Zero weapon
 * @returns {number} - Effective level for calculations
 */
function getEffectiveEquipLevel(equipLevel, isZeroWeapon = false) {
  // Zero weapons are capped at level 150
  if (isZeroWeapon && equipLevel > 150) {
    return 150;
  }
  
  // Round down to nearest 10 levels
  return Math.floor(equipLevel / 10) * 10;
}

/**
 * Get MVP discount multiplier
 * @param {string} mvpLevel - MVP level ('none', 'silver', 'gold', 'diamond')
 * @param {boolean} hasPremium - Whether Premium Service is active
 * @returns {number} - Discount multiplier (0.9 = 10% discount)
 */
function getMvpDiscountMultiplier(mvpLevel, hasPremium = false) {
  let discount = 0;
  
  switch (mvpLevel) {
    case 'silver':
      discount += 0.03; // 3%
      break;
    case 'gold':
      discount += 0.05; // 5%
      break;
    case 'diamond':
      discount += 0.10; // 10%
      break;
  }
  
  if (hasPremium) {
    discount += 0.05; // Additional 5%
  }
  
  return 1 - discount;
}

/**
 * Check if equipment level has special cost caps
 * @param {number} originalLevel - Original equipment level
 * @param {number} currentStar - Current star level
 * @returns {number|null} - Capped cost or null if no cap applies
 */
function getSpecialCostCap(originalLevel, currentStar) {
  // Level 108-109 equipment: capped at 7→8 stars (321,000 mesos)
  if ((originalLevel === 108 || originalLevel === 109) && currentStar === 7) {
    return 321000;
  }
  
  // Level 118-119 equipment: capped at 9→10 stars (533,400 mesos)
  if ((originalLevel === 118 || originalLevel === 119) && currentStar === 9) {
    return 533400;
  }
  
  // Level 128-129 equipment: capped at 14→15 stars (6,471,400 mesos)
  if ((originalLevel === 128 || originalLevel === 129) && currentStar === 14) {
    return 6471400;
  }
  
  return null;
}

/**
 * Round meso cost to nearest hundreds
 * @param {number} cost - Original cost
 * @returns {number} - Rounded cost
 */
function roundToNearestHundreds(cost) {
  return Math.round(cost / 100) * 100;
}

/**
 * Get MVP level options for selection
 * @returns {Array} - Array of MVP level options
 */
export function getMvpLevelOptions() {
  return [
    { value: 'none', name: 'None', discount: '0%' },
    { value: 'silver', name: 'Silver', discount: '3%' },
    { value: 'gold', name: 'Gold', discount: '5%' },
    { value: 'diamond', name: 'Diamond', discount: '10%' }
  ];
}

/**
 * Format meso amount with proper commas and units
 * @param {number} amount - Meso amount
 * @returns {string} - Formatted string
 */
export function formatMesos(amount) {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)}B`;
  } else if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return amount.toLocaleString();
} 