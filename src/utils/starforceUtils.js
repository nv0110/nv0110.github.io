import { logger } from './logger';

/**
 * Starforce success rates by star level (GMS Savior rates from MathBro's calculator)
 * Format: { success, maintain, decrease, destroy }
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
  11: { success: 45, maintain: 55, decrease: 0, destroy: 0 }, // Savior: no decrease/boom 11-14
  12: { success: 40, maintain: 60, decrease: 0, destroy: 0 }, // Savior: no decrease/boom 11-14
  13: { success: 35, maintain: 65, decrease: 0, destroy: 0 }, // Savior: no decrease/boom 11-14
  14: { success: 30, maintain: 70, decrease: 0, destroy: 0 }, // Savior: no decrease/boom 11-14
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
 * Create a meso cost function using MathBro's formula
 * Formula: 100 * round(extraMult * itemLevel^3 * (currentStar + 1)^currentStarExp / divisor + 10)
 */
function makeMesoFunction(divisor, currentStarExp = 2.7, extraMult = 1) {
  return (currentStar, itemLevel) => {
    // MathBro's exact formula implementation
    const calculation = extraMult * Math.pow(itemLevel, 3) * Math.pow(currentStar + 1, currentStarExp) / divisor + 10;
    const baseCost = 100 * Math.round(calculation);
    return baseCost;
  };
}

/**
 * Get the appropriate meso function for GMS Savior costs based on star level
 */
function getGMSMesoFunction(currentStar) {
  switch (currentStar) {
    case 11:
      return makeMesoFunction(22000); // 2.7 exponent, divisor 22000
    case 12:
      return makeMesoFunction(15000); // 2.7 exponent, divisor 15000
    case 13:
      return makeMesoFunction(11000); // 2.7 exponent, divisor 11000
    case 14:
      return makeMesoFunction(7500);  // 2.7 exponent, divisor 7500
    default:
      if (currentStar >= 0 && currentStar <= 9) {
        return makeMesoFunction(2500, 1); // Linear exponent for 0-9 stars
      } else if (currentStar === 10) {
        return makeMesoFunction(40000); // 2.7 exponent, divisor 40000
      } else if (currentStar >= 15 && currentStar <= 24) {
        return makeMesoFunction(20000); // 2.7 exponent, divisor 20000
      }
      // Fallback for any edge cases
      return makeMesoFunction(20000);
  }
}

/**
 * Calculate base starforce cost using GMS Savior formula (MathBro's implementation)
 */
function getGMSBaseCost(currentStar, itemLevel) {
  const mesoFn = getGMSMesoFunction(currentStar);
  return mesoFn(currentStar, itemLevel);
}

/**
 * Check if chance time is active (MathBro's logic)
 * @param {number} decreaseCount - Number of consecutive decreases
 * @returns {boolean} - Whether chance time is active
 */
function checkChanceTime(decreaseCount) {
  return decreaseCount === 2;
}

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
      useSafeguard = false,
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
        useSafeguard,
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
      options: { eventType, mvpLevel, hasPremium, isZeroWeapon, useSafeguard, useStarCatch },
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
  let consecutiveDecreases = 0; // Track for chance time (MathBro's logic)
  let booms = 0;
  let decreases = 0;
  let successes = 0;

  const effectiveLevel = getEffectiveEquipLevel(equipLevel, options.isZeroWeapon);

  while (currentStar < targetStar) {
    attempts++;
    
    // Check for chance time BEFORE cost calculation (MathBro's order)
    const isChanceTime = checkChanceTime(consecutiveDecreases);
    
    // Get cost for this attempt
    const attemptCost = getSingleAttemptCost(effectiveLevel, currentStar, options, equipLevel, isChanceTime);
    totalCost += attemptCost;

    // MathBro's logic: If chance time is active, it's guaranteed success
    if (isChanceTime) {
      currentStar++;
      successes++;
      consecutiveDecreases = 0;
      continue;
    }

    // Determine if this upgrade is guaranteed by 5/10/15 event
    const is51015Guaranteed = (options.eventType === '51015' || options.eventType === 'ssf') && 
      (currentStar === 5 || currentStar === 10 || currentStar === 15);
    
    if (is51015Guaranteed) {
      currentStar++;
      successes++;
      consecutiveDecreases = 0;
      continue;
    }

    // Get success rates for this star level and apply modifications
    const rates = getModifiedSuccessRates(currentStar, options);
    
    // Roll for outcome
    const outcome = rollOutcome(rates);
    
    // Apply outcome (MathBro's logic)
    if (outcome === 'success') {
      currentStar++;
      successes++;
      consecutiveDecreases = 0;
    } else if (outcome === 'decrease') {
      // Decrease happens and star goes down by 1
      currentStar = Math.max(0, currentStar - 1); // Can't go below 0
      decreases++;
      consecutiveDecreases++;
    } else if (outcome === 'maintain') {
      // Stay at same star level
      consecutiveDecreases = 0;
    } else if (outcome === 'destroy') {
      // Item destroyed, reset to 12★ for normal items (MathBro's logic)
      currentStar = 12;
      booms++;
      consecutiveDecreases = 0;
    }

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
 * Get modified success rates based on options (MathBro's implementation)
 * @param {number} currentStar - Current star level
 * @param {Object} options - Enhancement options
 * @returns {Object} - Modified success rates
 */
function getModifiedSuccessRates(currentStar, options) {
  const baseRates = STARFORCE_RATES[currentStar];
  
  let successRate = baseRates.success / 100; // Convert to decimal
  let maintainRate = baseRates.maintain / 100;
  let decreaseRate = baseRates.decrease / 100;
  let destroyRate = baseRates.destroy / 100;

  // Apply safeguard FIRST (MathBro's order)
  const shouldApplySafeguard = options.useSafeguard && 
    currentStar >= 15 && currentStar <= 16;
  
  if (shouldApplySafeguard) {
    if (decreaseRate > 0) {
      // If there's a decrease chance, boom becomes decrease
      decreaseRate += destroyRate;
    } else {
      // If no decrease chance, boom becomes maintain
      maintainRate += destroyRate;
    }
    destroyRate = 0;
  }

  // Apply Star Catch SECOND (MathBro's order) - (+5% multiplicatively to success rate)
  if (options.useStarCatch) {
    successRate *= 1.05;
    const leftOver = 1 - successRate;
    
    // Redistribute the remaining probability proportionally (MathBro's exact logic)
    if (decreaseRate === 0) {
      // No decrease, redistribute between maintain and destroy
      const totalNonSuccess = maintainRate + destroyRate;
      if (totalNonSuccess > 0) {
        maintainRate = maintainRate * leftOver / totalNonSuccess;
        destroyRate = leftOver - maintainRate;
      }
    } else {
      // Has decrease, redistribute between decrease and destroy
      const totalNonSuccess = decreaseRate + destroyRate;
      if (totalNonSuccess > 0) {
        decreaseRate = decreaseRate * leftOver / totalNonSuccess;
        destroyRate = leftOver - decreaseRate;
      }
    }
  }

  return {
    success: successRate * 100, // Convert back to percentage for rollOutcome
    maintain: maintainRate * 100,
    decrease: decreaseRate * 100,
    destroy: destroyRate * 100
  };
}

/**
 * Roll for enhancement outcome based on rates
 * @param {Object} rates - Success rates (in percentages)
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
 * Get cost for a single enhancement attempt (MathBro's implementation)
 * @param {number} effectiveLevel - Effective equipment level
 * @param {number} currentStar - Current star level
 * @param {Object} options - Enhancement options
 * @param {number} originalLevel - Original equipment level
 * @param {boolean} isChanceTime - Whether chance time is active
 * @returns {number} - Cost for this attempt
 */
function getSingleAttemptCost(effectiveLevel, currentStar, options, originalLevel, isChanceTime = false) {
  let baseCost = 0;
  
  // Check for special cost caps first
  const specialCap = getSpecialCostCap(originalLevel, currentStar);
  if (specialCap !== null) {
    baseCost = specialCap;
  } else {
    // Calculate base cost using GMS Savior formula (MathBro's implementation)
    baseCost = getGMSBaseCost(currentStar, effectiveLevel);
  }
  
  // Apply all discounts and safeguard cost in one go (MathBro's way)
  let finalCost = applyDiscounts(baseCost, options, currentStar, isChanceTime);

  return finalCost;
}

/**
 * Apply discounts to base cost (MathBro's implementation)
 * @param {number} baseCost - Base cost before discounts
 * @param {Object} options - Enhancement options
 * @param {number} currentStar - Current star level
 * @param {boolean} isChanceTime - Whether chance time is active
 * @returns {number} - Cost after discounts
 */
function applyDiscounts(baseCost, options, currentStar, isChanceTime = false) {
  let multiplier = 1;

  // Apply MVP discount (up to 16★ → 17★, so applies to stars 0-16)
  if (currentStar <= 16) {
    if (options.mvpLevel === 'silver') {
      multiplier -= 0.03; // 3% discount
    } else if (options.mvpLevel === 'gold') {
      multiplier -= 0.05; // 5% discount
    } else if (options.mvpLevel === 'diamond') {
      multiplier -= 0.10; // 10% discount
    }
  }

  // Apply event discount (30% off events) - applied before safeguard costs
  const hasDiscountEvent = options.eventType === '30off' || options.eventType === 'ssf';
  if (hasDiscountEvent) {
    multiplier -= 0.3; // 30% discount
  }

  // Apply safeguard cost AFTER discounts - doubles the discounted cost
  const is51015Event = options.eventType === '51015' || options.eventType === 'ssf';
  const shouldApplySafeguard = options.useSafeguard && 
    !isChanceTime && // No safeguard cost during chance time
    !(is51015Event && currentStar === 15) && // No safeguard cost if 15→16 is guaranteed
    currentStar >= 15 && currentStar <= 16;
  
  if (shouldApplySafeguard) {
    multiplier += 1; // Additive +1 to multiplier (so 1 becomes 2, 0.7 becomes 1.7)
  }

  const finalCost = baseCost * multiplier;
  return Math.round(finalCost);
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
  
  // MathBro doesn't round equipment level - use the exact level
  return equipLevel;
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