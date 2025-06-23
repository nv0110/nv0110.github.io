/**
 * Boss Registry Service
 * 
 * Centralized service for fetching boss data from the database boss_registry table.
 * This replaces the local bossData.js file as the single source of truth.
 */

import { logger } from '../utils/logger.js';

// Helper: get supabase client dynamically for code splitting
async function getSupabase() {
  const { supabase } = await import('../supabaseClient');
  return supabase;
}

// Cache for boss registry data to avoid repeated database calls
// Force cache clear on module load to ensure fresh data
let bossRegistryCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds - shorter cache for data consistency

/**
 * Fetch all boss registry data from database
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function fetchBossRegistry(forceRefresh = false) {
  try {
    // Check cache validity
    const now = Date.now();
    if (!forceRefresh && bossRegistryCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      return { success: true, data: bossRegistryCache };
    }

    const supabase = await getSupabase();
    
    const { data, error } = await supabase
      .from('boss_registry')
      .select('*')
      .eq('enabled', true)
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching boss registry:', error);
      return { success: false, error: 'Failed to fetch boss registry.' };
    }
    
    // Update cache
    bossRegistryCache = data || [];
    cacheTimestamp = now;
    
    return { success: true, data: bossRegistryCache };
    
  } catch (error) {
    console.error('Unexpected error fetching boss registry:', error);
    return { success: false, error: 'Failed to fetch boss registry.' };
  }
}

/**
 * Get boss data formatted for frontend use (similar to old bossData.js structure)
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getBossDataForFrontend(forceRefresh = false) {
  try {
    const registryResult = await fetchBossRegistry(forceRefresh);
    if (!registryResult.success) {
      return registryResult;
    }

    const registry = registryResult.data;
    
    // Group by boss name and structure like old bossData.js
    const bossMap = new Map();
    
    registry.forEach(entry => {
      const bossName = entry.boss_name;
      const difficulty = entry.difficulty;
      
      if (!bossMap.has(bossName)) {
        bossMap.set(bossName, {
          name: bossName,
          difficulties: [],
          image: getBossImagePath(bossName), // Helper function for image paths
          maxPrice: 0
        });
      }
      
      const boss = bossMap.get(bossName);
      boss.difficulties.push({
        difficulty: difficulty,
        price: entry.crystal_value,
        maxPartySize: entry.max_party_size
      });
      
      // Track max price for sorting
      boss.maxPrice = Math.max(boss.maxPrice, entry.crystal_value);
    });
    
    // Convert to array and sort by max price (descending)
    const bossData = Array.from(bossMap.values())
      .sort((a, b) => b.maxPrice - a.maxPrice);
    
    return { success: true, data: bossData };
    
  } catch (error) {
    console.error('Error formatting boss data for frontend:', error);
    return { success: false, error: 'Failed to format boss data.' };
  }
}

/**
 * Get specific boss information
 * @param {string} bossName - Boss name
 * @param {string} difficulty - Difficulty name
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function getBossInfo(bossName, difficulty) {
  try {
    const registryResult = await fetchBossRegistry();
    if (!registryResult.success) {
      return registryResult;
    }

    const boss = registryResult.data.find(entry =>
      entry.boss_name === bossName && entry.difficulty === difficulty
    );
    
    if (!boss) {
      return { success: false, error: `Boss not found: ${bossName} ${difficulty}` };
    }
    
    return { success: true, data: boss };
    
  } catch (error) {
    console.error('Error getting boss info:', error);
    return { success: false, error: 'Failed to get boss information.' };
  }
}

/**
 * Get available difficulties for a boss
 * @param {string} bossName - Boss name
 * @returns {Promise<{success: boolean, data?: Array<string>, error?: string}>}
 */
export async function getBossDifficulties(bossName) {
  try {
    const registryResult = await fetchBossRegistry();
    if (!registryResult.success) {
      return registryResult;
    }

    const difficulties = registryResult.data
      .filter(entry => entry.boss_name === bossName)
      .map(entry => entry.difficulty)
      .sort();
    
    return { success: true, data: difficulties };
    
  } catch (error) {
    console.error('Error getting boss difficulties:', error);
    return { success: false, error: 'Failed to get boss difficulties.' };
  }
}

/**
 * Get crystal value for a boss/difficulty combination (always fresh from database)
 * @param {string} bossName - Boss name
 * @param {string} difficulty - Difficulty name
 * @returns {Promise<number>} - Crystal value or 1 as fallback
 */
export async function getCrystalValue(bossName, difficulty) {
  try {
    // Force fresh data for crystal values to ensure accuracy
    const bossInfo = await getBossInfo(bossName, difficulty);
    if (bossInfo.success) {
      return bossInfo.data.crystal_value;
    } else {
      console.warn(`Boss not found for crystal value: ${bossName} ${difficulty}`);
      return 1;
    }
  } catch (error) {
    console.error('Error getting crystal value:', error);
    return 1;
  }
}

/**
 * Force refresh boss registry cache
 */
export async function forceRefreshBossRegistry() {
  // Check if we're in a logout scenario (no user code in localStorage)
  const userCode = localStorage.getItem('userCode');
  if (!userCode) {
    // During logout, use cached data if available instead of forcing refresh
    if (bossRegistryCache && cacheTimestamp) {
      return { success: true, data: bossRegistryCache };
    }
  }
  
  logger.debug('🔄 Refreshing boss registry cache...');
  bossRegistryCache = null;
  cacheTimestamp = null;
  const result = await fetchBossRegistry(true);
  logger.debug('✅ Boss registry cache refreshed');
  return result;
}

/**
 * Helper function to get boss image path
 * This maintains the image mapping until images are moved to database
 * @param {string} bossName - Boss name
 * @returns {string} - Image path
 */
function getBossImagePath(bossName) {
  const imageMap = {
    'Pink Bean': '/bosses/PinkBean.png',
    'Cygnus': '/bosses/cygnus.png',
    'Zakum': '/bosses/zakum.png',
    'Crimson Queen': '/bosses/crimsonqueen.png',
    'Von Bon': '/bosses/von_bon.png',
    'Pierre': '/bosses/pierre.png',
    'Magnus': '/bosses/magnus.png',
    'Vellum': '/bosses/vellum.png',
    'Papulatus': '/bosses/Papulatus.png',
    'Aketchi': '/bosses/akechi.png',
    'Lotus': '/bosses/lotus.png',
    'Damien': '/bosses/damien.png',
    'Guardian Angel Slime': '/bosses/slime.png',
    'Lucid': '/bosses/lucid.png',
    'Will': '/bosses/will.png',
    'Gloom': '/bosses/gloom.png',
    'Darknell': '/bosses/darknell.png',
    'Verus Hilla': '/bosses/verus_hilla.png',
    'Chosen Seren': '/bosses/seren.png',
    'Watcher Kalos': '/bosses/Kalos.png',
    'Kaling': '/bosses/Kaling.png',
    'Limbo': '/bosses/Limbo.png',
    'Hilla': '/bosses/hilla.png',
    'Princess No': '/bosses/pno.png'
  };
  
  return imageMap[bossName] || '/bosses/crystal.png'; // fallback image
}

/**
 * Get pitched items for a boss (temporary until moved to database)
 * @param {string} bossName - Boss name
 * @param {string} [difficulty] - Optional difficulty to filter items
 * @returns {Array} - Array of pitched items
 */
export function getBossPitchedItems(bossName, difficulty = null) {
  const pitchedItemsMap = {
    'Lotus': [
      { name: 'Black Heart', image: '/items/blackheart.png', difficulties: ['Hard', 'Extreme'] },
      { name: 'Berserked', image: '/items/berserked.png', difficulties: ['Hard', 'Extreme'] },
      { name: 'Total Control', image: '/items/tc.png', difficulty: 'Extreme' }
    ],
    'Damien': [
      { name: 'Magic Eyepatch', image: '/items/eyepatch.webp', difficulty: 'Hard' }
    ],
    'Lucid': [
      { name: 'Dreamy Belt', image: '/items/dreamy.png', difficulty: 'Hard' }
    ],
    'Will': [
      { name: 'Cursed Spellbook', image: '/items/book.webp', difficulty: 'Hard' }
    ],
    'Gloom': [
      { name: 'Endless Terror', image: '/items/et.webp', difficulty: 'Chaos' }
    ],
    'Darknell': [
      { name: 'Commanding Force Earring', image: '/items/cfe.webp', difficulty: 'Hard' }
    ],
    'Verus Hilla': [
      { name: 'Source of Suffering', image: '/items/sos.png', difficulty: 'Hard' }
    ],
    'Limbo': [
      { name: 'Whisper of the Source', image: '/items/whisper.png', difficulty: 'Hard' }
    ],
    'Chosen Seren': [
      { name: "Mitra's Rage", image: '/items/emblem.webp', difficulties: ['Hard', 'Extreme'] },
      { name: 'Gravity Module', image: '/items/module.webp', difficulty: 'Extreme' }
    ],
    'Watcher Kalos': [
      { name: 'Mark of Destruction', image: '/items/mark.webp', difficulty: 'Extreme' },
      { name: 'Grindstone of Life', image: '/items/grindstone.webp', difficulties: ['Easy', 'Normal', 'Chaos', 'Extreme'] }
    ],
    'Kaling': [
      { name: 'Helmet of Loyalty', image: '/items/helm.webp', difficulty: 'Extreme' },
      { name: 'Grindstone of Life', image: '/items/grindstone.webp', difficulties: ['Easy', 'Normal', 'Hard', 'Extreme'] }
    ]
  };
  
  const allItems = pitchedItemsMap[bossName] || [];
  
  // If no difficulty specified, return all items (backward compatibility)
  if (!difficulty) {
    return allItems;
  }
  
  // Filter items based on difficulty
  return allItems.filter(item => {
    // If item has specific difficulty requirement, check if it matches
    if (item.difficulty) {
      return item.difficulty === difficulty;
    }
    
    // If item has multiple difficulties array, check if current difficulty is included
    if (item.difficulties && Array.isArray(item.difficulties)) {
      return item.difficulties.includes(difficulty);
    }
    
    // If item has no difficulty restrictions, show it for all difficulties
    return true;
  });
}

/**
 * Helper function compatible with old getBossPrice function
 * @param {object} boss - Boss object with difficulties array
 * @param {string} difficulty - Difficulty name
 * @returns {number} - Price/crystal value
 */
export function getBossPrice(boss, difficulty) {
  if (!boss || !boss.difficulties) return 0;
  const diff = boss.difficulties.find(d => d.difficulty === difficulty);
  return diff ? diff.price : 0;
}

/**
 * Clear the boss registry cache
 */
export function clearBossRegistryCache() {
  bossRegistryCache = null;
  cacheTimestamp = null;
}
