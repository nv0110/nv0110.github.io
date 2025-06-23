/**
 * Boss Code Mapping Utilities
 * 
 * Maps between frontend bossData.js structure and database boss_registry format
 * The database uses boss_code-difficulty_code format (e.g., "LT-H" for "Lotus-Hard")
 */

// Mapping from boss names to boss codes (matched to actual database boss_registry)
const BOSS_NAME_TO_CODE = {
  'Pink Bean': 'PB',
  'Cygnus': 'CY',
  'Zakum': 'ZK',
  'Crimson Queen': 'CQ',
  'Von Bon': 'VB',
  'Pierre': 'PR',
  'Magnus': 'MG',
  'Vellum': 'VL',
  'Papulatus': 'PP',
  'Aketchi': 'AK',
  'Lotus': 'LT',
  'Damien': 'DM',
  'Guardian Angel Slime': 'GA',
  'Lucid': 'LC',
  'Will': 'WL',
  'Gloom': 'GL',
  'Darknell': 'DN',
  'Verus Hilla': 'VH',
  'Chosen Seren': 'CS',
  'Watcher Kalos': 'WK',
  'Kaling': 'KL',
  'Limbo': 'LB',
  'Hilla': 'HI',
  'Princess No': 'PN'
};

// Mapping from difficulty names to difficulty codes (matched to actual database boss_registry)
const DIFFICULTY_NAME_TO_CODE = {
  'Easy': 'E',
  'Normal': 'N',
  'Hard': 'H',
  'Chaos': 'C',
  'Extreme': 'X'
};

// Reverse mappings
const BOSS_CODE_TO_NAME = Object.fromEntries(
  Object.entries(BOSS_NAME_TO_CODE).map(([name, code]) => [code, name])
);

const DIFFICULTY_CODE_TO_NAME = Object.fromEntries(
  Object.entries(DIFFICULTY_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/**
 * Convert boss name and difficulty to boss code format
 * @param {string} bossName - Boss name from bossData.js
 * @param {string} difficulty - Difficulty name from bossData.js
 * @returns {string|null} - Boss code in format "BOSS_CODE-DIFFICULTY_CODE" or null if not found
 */
export function getBossCodeFromNameAndDifficulty(bossName, difficulty) {
  const bossCode = BOSS_NAME_TO_CODE[bossName];
  const difficultyCode = DIFFICULTY_NAME_TO_CODE[difficulty];
  
  if (!bossCode || !difficultyCode) {
    console.warn(`Unknown boss mapping: ${bossName} ${difficulty}`);
    return null;
  }
  
  return `${bossCode}-${difficultyCode}`;
}

/**
 * Convert boss code format back to boss name and difficulty
 * @param {string} bossCode - Boss code in format "BOSS_CODE-DIFFICULTY_CODE"
 * @returns {object|null} - {bossName, difficulty} or null if not found
 */
export function getNameAndDifficultyFromBossCode(bossCode) {
  if (!bossCode || typeof bossCode !== 'string') {
    return null;
  }
  
  const [code, diffCode] = bossCode.split('-');
  const bossName = BOSS_CODE_TO_NAME[code];
  const difficulty = DIFFICULTY_CODE_TO_NAME[diffCode];
  
  if (!bossName || !difficulty) {
    console.warn(`Unknown boss code mapping: ${bossCode}`);
    return null;
  }
  
  return { bossName, difficulty };
}

/**
 * Get crystal value for a boss from database
 * @param {string} bossName - Boss name
 * @param {string} difficulty - Difficulty name
 * @returns {Promise<number>} - Crystal value (price)
 */
export async function getCrystalValue(bossName, difficulty) {
  try {
    const { getCrystalValue: getRegistryCrystalValue } = await import('../services/bossRegistryService.js');
    return await getRegistryCrystalValue(bossName, difficulty);
  } catch (error) {
    console.error('Error getting crystal value from registry:', error);
    return 1;
  }
}

/**
 * Convert character bosses array to boss config string format for database
 * @param {Array} bosses - Array of boss objects with {name, difficulty, partySize}
 * @returns {Promise<string>} - Boss config string in format "bossCode:crystalValue:partySize,..."
 */
export async function convertBossesToConfigString(bosses) {
  if (!Array.isArray(bosses) || bosses.length === 0) {
    return '';
  }
  
  const bossEntries = await Promise.all(
    bosses.map(async boss => {
      const bossCode = getBossCodeFromNameAndDifficulty(boss.name, boss.difficulty);
      if (!bossCode) {
        console.warn(`Skipping unknown boss: ${boss.name} ${boss.difficulty}`);
        return null;
      }
      
      const crystalValue = await getCrystalValue(boss.name, boss.difficulty);
      const partySize = boss.partySize || 1;
      
      return `${bossCode}:${crystalValue}:${partySize}`;
    })
  );
  
  return bossEntries
    .filter(entry => entry !== null)
    .join(',');
}

/**
 * Parse boss config string from database to bosses array for frontend
 * @param {string} configString - Boss config string from database
 * @returns {Array} - Array of boss objects with {name, difficulty, partySize, price}
 */
export function parseBossConfigStringToFrontend(configString) {
  if (!configString || typeof configString !== 'string') {
    return [];
  }
  
  return configString
    .split(',')
    .map(entry => {
      const parts = entry.split(':');
      if (parts.length !== 3) {
        console.warn(`Invalid boss config entry: ${entry}`);
        return null;
      }
      
      const [bossCode, crystalValue, partySize] = parts;
      const mapping = getNameAndDifficultyFromBossCode(bossCode);
      
      if (!mapping) {
        console.warn(`Unknown boss code: ${bossCode}`);
        return null;
      }
      
      return {
        name: mapping.bossName,
        difficulty: mapping.difficulty,
        partySize: parseInt(partySize) || 1,
        price: parseInt(crystalValue) || 1
      };
    })
    .filter(boss => boss !== null);
}

/**
 * Get boss registry ID for a boss name and difficulty combination
 * @param {string} bossName - Boss name from bossData.js
 * @param {string} difficulty - Difficulty name from bossData.js
 * @returns {Promise<number|null>} - Boss registry ID or null if not found
 */
export async function getBossRegistryId(bossName, difficulty) {
  try {
    const { fetchBossRegistry } = await import('../services/bossRegistryService.js');
    const registryResult = await fetchBossRegistry();
    
    if (!registryResult.success) {
      console.error('Failed to fetch boss registry:', registryResult.error);
      return null;
    }
    
    const boss = registryResult.data.find(entry =>
      entry.boss_name === bossName && entry.difficulty === difficulty
    );
    
    if (!boss) {
      console.warn(`Boss not found in registry: ${bossName} ${difficulty}`);
      return null;
    }
    
    return boss.id;
    
  } catch (error) {
    console.error('Error getting boss registry ID:', error);
    return null;
  }
}

// Export mappings for external use if needed
export {
  BOSS_NAME_TO_CODE,
  DIFFICULTY_NAME_TO_CODE,
  BOSS_CODE_TO_NAME,
  DIFFICULTY_CODE_TO_NAME
};
