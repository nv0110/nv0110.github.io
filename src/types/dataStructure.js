/**
 * MAPLESTORY BOSS CRYSTAL CALCULATOR - DATA STRUCTURE DOCUMENTATION
 * 
 * This file documents the improved data structure for weekly boss tracking.
 * The goal is to make the data clear, extensible, and preserve historical records.
 */

/**
 * USER DATA STRUCTURE (stored in database 'data' column)
 * 
 * {
 *   // Character data - list of user's characters and their selected bosses
 *   characters: [
 *     {
 *       name: "CharacterName",
 *       bosses: [
 *         {
 *           name: "BossName",
 *           difficulty: "Normal|Hard|Chaos|Extreme",
 *           price: 123456789,
 *           partySize: 1-6
 *         }
 *       ]
 *     }
 *   ],
 * 
 *   // IMPROVED: Weekly boss clear tracking - each week preserved separately
 *   weeklyBossClearHistory: {
 *     "2024-51": {
 *       weekKey: "2024-51",
 *       weekStartDate: "2024-12-19T00:00:00.000Z",
 *       weekEndDate: "2024-12-26T00:00:00.000Z",
 *       bossClearStatus: {
 *         "CharacterName-0": {
 *           "BossName-Difficulty": true|false
 *         }
 *       },
 *       lastUpdated: "2024-12-23T10:30:00.000Z"
 *     },
 *     "2024-52": {
 *       // ... next week's data
 *     }
 *   },
 * 
 *   // Current active week for quick access
 *   currentWeekKey: "2024-52",
 * 
 *   // Weekly progress history (for statistics)
 *   weeklyProgressHistory: [
 *     {
 *       weekKey: "2024-51", 
 *       totalMesos: 15000000000,
 *       completedBosses: 28,
 *       totalBosses: 35,
 *       completionDate: "2024-12-25T23:59:59.000Z"
 *     }
 *   ],
 * 
 *   // Account metadata
 *   accountCreatedDate: "2024-01-15T10:30:00.000Z",
 *   lastActiveDate: "2024-12-23T10:30:00.000Z"
 * }
 */

/**
 * PITCHED ITEMS STRUCTURE (stored in database 'pitched_items' column)
 * 
 * [
 *   {
 *     id: "unique-item-id-12345",
 *     character: "CharacterName",
 *     characterIndex: 0,
 *     bossName: "BossName", 
 *     bossDifficulty: "Hard",
 *     itemName: "Rare Drop",
 *     itemImage: "/items/rare-drop.png",
 *     weekKey: "2024-52",
 *     obtainedDate: "2024-12-23T10:30:00.000Z",
 *     isCleared: true
 *   }
 * ]
 * 
 * NOTE: Pitched item metadata (totalItemsTracked, weeksTracked, lastUpdated) 
 * can be calculated on-demand from this array using helper functions.
 */

/**
 * WEEK KEY FORMAT
 * 
 * Format: "YYYY-WW" where WW is the week number of the year
 * Examples: "2024-52", "2025-01", "2025-02"
 * 
 * Week boundaries: Thursday 00:00 UTC to Wednesday 23:59 UTC
 * This aligns with MapleStory's weekly reset schedule
 */

/**
 * MIGRATION STRATEGY
 * 
 * To maintain backward compatibility:
 * 1. Keep existing 'checked' field temporarily
 * 2. Create new 'weeklyBossClearHistory' structure
 * 3. Migrate current 'checked' data to appropriate week in new structure
 * 4. Update all code to use new structure
 * 5. Remove old 'checked' field after migration is complete
 */

export const DATA_STRUCTURE_VERSION = "2.0.0";

/**
 * Helper function to get current week's boss clear status
 */
export function getCurrentWeekBossClearStatus(userData, weekKey) {
  return userData?.weeklyBossClearHistory?.[weekKey]?.bossClearStatus || {};
}

/**
 * Helper function to get all historical boss clear data
 */
export function getAllWeeklyBossClearHistory(userData) {
  return userData?.weeklyBossClearHistory || {};
}

/**
 * Helper function to create a new week entry
 */
export function createNewWeekEntry(weekKey) {
  const weekDate = getWeekStartDate(weekKey);
  const weekEndDate = new Date(weekDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  
  return {
    weekKey,
    weekStartDate: weekDate.toISOString(),
    weekEndDate: weekEndDate.toISOString(),
    bossClearStatus: {},
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Helper function to get week start date from week key
 */
function getWeekStartDate(weekKey) {
  const [year, week] = weekKey.split('-').map(Number);
  const jan1 = new Date(year, 0, 1);
  const daysToFirstThursday = (4 - jan1.getDay() + 7) % 7;
  const firstThursday = new Date(year, 0, 1 + daysToFirstThursday);
  const weekStart = new Date(firstThursday);
  weekStart.setDate(firstThursday.getDate() + (week - 1) * 7);
  return weekStart;
} 