/**
 * Maple Week Utilities
 * 
 * Utilities for calculating Maple Story week dates and handling week-related operations.
 * MapleStory weeks run Thursday 00:00 UTC to Wednesday 23:59 UTC.
 */

/**
 * Get the start date of the current Maple Story week in 'YYYY-MM-DD' format
 * @returns {string} Date string in 'YYYY-MM-DD' format representing Thursday start of current week
 */
export function getCurrentMapleWeekStartDate() {
  const now = new Date();
  const utcNow = new Date(Date.UTC(
    now.getUTCFullYear(), 
    now.getUTCMonth(), 
    now.getUTCDate(), 
    now.getUTCHours(), 
    now.getUTCMinutes(), 
    now.getUTCSeconds()
  ));
  
  // Find the most recent Thursday 00:00 UTC (start of current MapleStory week)
  const currentThursday = new Date(utcNow);
  
  // Calculate days since Thursday (Thursday = 4)
  const dayOfWeek = utcNow.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday, ..., 6 = Saturday
  let daysSinceThursday;
  
  if (dayOfWeek >= 4) {
    // If today is Thursday (4) or later in the week
    daysSinceThursday = dayOfWeek - 4;
  } else {
    // If today is Sunday (0), Monday (1), Tuesday (2), or Wednesday (3)
    // We need to go back to last Thursday
    daysSinceThursday = dayOfWeek + 3; // 0+3=3, 1+3=4, 2+3=5, 3+3=6
  }
  
  currentThursday.setUTCDate(utcNow.getUTCDate() - daysSinceThursday);
  currentThursday.setUTCHours(0, 0, 0, 0);
  
  // Format as YYYY-MM-DD
  const year = currentThursday.getUTCFullYear();
  const month = String(currentThursday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(currentThursday.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get the start date of a Maple Story week with an offset from current week
 * @param {number} weekOffset - Number of weeks to offset (positive for future, negative for past)
 * @returns {string} Date string in 'YYYY-MM-DD' format
 */
export function getMapleWeekStartDateWithOffset(weekOffset = 0) {
  const currentStart = getCurrentMapleWeekStartDate();
  const currentDate = new Date(currentStart + 'T00:00:00.000Z');
  
  // Add the week offset
  currentDate.setUTCDate(currentDate.getUTCDate() + (weekOffset * 7));
  
  // Format as YYYY-MM-DD
  const year = currentDate.getUTCFullYear();
  const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse boss config string into structured data
 * Format: "boss_code:crystal_value:party_size,boss_code:crystal_value:party_size,..."
 * @param {string} configString - Boss configuration string
 * @returns {Array<{bossCode: string, crystalValue: number, partySize: number}>}
 */
export function parseBossConfigString(configString) {
  if (!configString || typeof configString !== 'string') {
    return [];
  }
  
  return configString.split(',').map(entry => {
    const parts = entry.split(':');
    if (parts.length === 3) {
      return {
        bossCode: parts[0],
        crystalValue: parseInt(parts[1]) || 0,
        partySize: parseInt(parts[2]) || 1
      };
    }
    return null;
  }).filter(Boolean);
}

/**
 * Construct boss config string from structured data
 * @param {Array<{bossCode: string, crystalValue: number, partySize: number}>} bossConfigs
 * @returns {string} Boss configuration string
 */
export function constructBossConfigString(bossConfigs) {
  if (!Array.isArray(bossConfigs)) {
    return '';
  }
  
  return bossConfigs.map(config => 
    `${config.bossCode}:${config.crystalValue}:${config.partySize}`
  ).join(',');
}

/**
 * Validate if a date string is a valid Maple week start (Thursday)
 * @param {string} dateString - Date string in 'YYYY-MM-DD' format
 * @returns {boolean} True if the date is a Thursday
 */
export function isValidMapleWeekStart(dateString) {
  try {
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.getUTCDay() === 4; // Thursday = 4
  } catch {
    return false;
  }
}

/**
 * Get the end date of a Maple Story week (Wednesday) given the start date
 * @param {string} startDate - Start date in 'YYYY-MM-DD' format (Thursday)
 * @returns {string} End date in 'YYYY-MM-DD' format (Wednesday)
 */
export function getMapleWeekEndDate(startDate) {
  const start = new Date(startDate + 'T00:00:00.000Z');
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6); // Wednesday is 6 days after Thursday
  
  const year = end.getUTCFullYear();
  const month = String(end.getUTCMonth() + 1).padStart(2, '0');
  const day = String(end.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}