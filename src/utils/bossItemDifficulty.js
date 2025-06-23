/**
 * Utility to determine boss difficulty based on dropped items
 * This helps reconstruct boss configurations from historical pitched items
 */

import { getBossPitchedItems, fetchBossRegistry } from '../services/bossRegistryService';

/**
 * Get available difficulties for a boss from the actual boss registry
 * @param {string} bossName - Boss name
 * @returns {Promise<string[]>} - Array of available difficulties from database
 */
async function getActualBossDifficulties(bossName) {
  try {
    const registryResult = await fetchBossRegistry();
    if (!registryResult.success) {
      console.error('Failed to fetch boss registry for difficulties:', registryResult.error);
      return [];
    }

    const difficulties = registryResult.data
      .filter(entry => entry.boss_name === bossName && entry.enabled)
      .map(entry => entry.difficulty)
      .sort();
    
    // Debug: Found difficulties for ${bossName}
    
    return difficulties;
  } catch (error) {
    console.error('Error getting actual boss difficulties:', error);
    return [];
  }
}

/**
 * Get the most likely difficulty for a boss based on a dropped item
 * @param {string} bossName - Boss name
 * @param {string} itemName - Item name that was dropped
 * @returns {Promise<string|null>} - Most likely difficulty or null if not found
 */
export async function getDifficultyForBossItem(bossName, itemName) {
  const allPossibleItems = getBossPitchedItems(bossName) || [];
  
  // Find the item in the boss's possible items
  const matchingItem = allPossibleItems.find(item => item.name === itemName);
  
  if (!matchingItem) {
    return null; // Item doesn't exist for this boss
  }
  
  // If item has a specific difficulty, return it
  if (matchingItem.difficulty) {
    return matchingItem.difficulty;
  }
  
  // If item has multiple difficulties, return the most common/highest one
  if (matchingItem.difficulties && matchingItem.difficulties.length > 0) {
    // Priority order for difficulties (highest to lowest)
    const difficultyPriority = ['Extreme', 'Hell', 'Chaos', 'Hard', 'Normal', 'Easy'];
    
    for (const difficulty of difficultyPriority) {
      if (matchingItem.difficulties.includes(difficulty)) {
        return difficulty;
      }
    }
    
    // Fallback to first available difficulty
    return matchingItem.difficulties[0];
  }
  
  // No specific difficulty restriction - need to pick from actual available difficulties
  const availableDifficulties = await getActualBossDifficulties(bossName);
  return getDefaultDifficultyFromAvailable(availableDifficulties);
}

/**
 * Get all possible difficulties for a boss based on its items and registry
 * @param {string} bossName - Boss name
 * @returns {Promise<string[]>} - Array of possible difficulties
 */
export async function getPossibleDifficultiesForBoss(bossName) {
  const allPossibleItems = getBossPitchedItems(bossName) || [];
  const difficulties = new Set();
  
  // Collect all possible difficulties from all items
  allPossibleItems.forEach(item => {
    if (item.difficulty) {
      difficulties.add(item.difficulty);
    } else if (item.difficulties) {
      item.difficulties.forEach(diff => difficulties.add(diff));
    }
  });
  
  // If no specific difficulties found, use all available from registry
  if (difficulties.size === 0) {
    const availableDifficulties = await getActualBossDifficulties(bossName);
    availableDifficulties.forEach(diff => difficulties.add(diff));
  }
  
  return Array.from(difficulties);
}

/**
 * Get default difficulty from available difficulties list (prefer highest tier)
 * @param {string[]} availableDifficulties - Array of available difficulties
 * @returns {string} - Default difficulty
 */
function getDefaultDifficultyFromAvailable(availableDifficulties) {
  if (!availableDifficulties.length) {
    return 'Hard'; // Ultimate fallback
  }
  
  // Priority order for difficulties (highest to lowest)
  const difficultyPriority = ['Extreme', 'Hell', 'Chaos', 'Hard', 'Normal', 'Easy'];
  
  for (const difficulty of difficultyPriority) {
    if (availableDifficulties.includes(difficulty)) {
      return difficulty;
    }
  }
  
  // Return first available if none match priority order
  return availableDifficulties[0];
}

/**
 * Enhanced function to get the best matching boss configuration for historical pitched items
 * @param {string} bossName - Boss name
 * @param {string[]} itemNames - Array of item names that were obtained
 * @returns {Promise<Object>} - Best matching boss configuration
 */
export async function getBestBossConfigForItems(bossName, itemNames) {
  console.log(`getBestBossConfigForItems: Processing ${bossName} with items:`, itemNames);
  
  if (!itemNames.length) {
    // No items - use first available difficulty from registry
    const availableDifficulties = await getActualBossDifficulties(bossName);
    const defaultDifficulty = getDefaultDifficultyFromAvailable(availableDifficulties);
    
    console.log(`getBestBossConfigForItems: No items for ${bossName}, using default difficulty:`, defaultDifficulty);
    
    return {
      name: bossName,
      difficulty: defaultDifficulty,
      partySize: 1,
      price: 0
    };
  }
  
  // Get difficulty for the first item (most reliable indicator)
  const primaryDifficulty = await getDifficultyForBossItem(bossName, itemNames[0]);
  console.log(`getBestBossConfigForItems: Primary difficulty for ${bossName}:${itemNames[0]} =`, primaryDifficulty);
  
  // Verify other items are compatible with this difficulty
  const isCompatible = await Promise.all(
    itemNames.map(async itemName => {
      const itemDifficulty = await getDifficultyForBossItem(bossName, itemName);
      const compatible = !itemDifficulty || itemDifficulty === primaryDifficulty;
      console.log(`getBestBossConfigForItems: Item ${itemName} compatibility with ${primaryDifficulty}:`, compatible);
      return compatible;
    })
  );
  
  let finalDifficulty = primaryDifficulty;
  
  // If not all items compatible or no primary difficulty found, fall back to registry default
  if (!isCompatible.every(Boolean) || !primaryDifficulty) {
    const availableDifficulties = await getActualBossDifficulties(bossName);
    finalDifficulty = getDefaultDifficultyFromAvailable(availableDifficulties);
    console.log(`getBestBossConfigForItems: Falling back to registry default for ${bossName}:`, finalDifficulty);
  } else {
    console.log(`getBestBossConfigForItems: Using primary difficulty for ${bossName}:`, finalDifficulty);
  }
  
  const result = {
    name: bossName,
    difficulty: finalDifficulty,
    partySize: 1,
    price: 0 // Will be filled in by the caller
  };
  
  console.log(`getBestBossConfigForItems: Final result for ${bossName}:`, result);
  return result;
} 
