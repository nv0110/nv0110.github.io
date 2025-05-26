// Week-related utility functions

import { WEEKLY_RESET_INFO } from '../constants.js';

// Get current week key in MapleStory format (MapleStory week - Calendar week)
// MapleStory weeks run Thursday 00:00 UTC to Wednesday 23:59 UTC
export function getCurrentWeekKey() {
  const now = new Date();
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
  
  // Find the most recent Thursday 00:00 UTC (start of current MapleStory week)
  const currentThursday = new Date(utcNow);
  
  // Calculate days since Thursday (Thursday = 4, so we need to find how many days back to Thursday)
  const dayOfWeek = utcNow.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 4 = Thursday, ..., 6 = Saturday
  let daysSinceThursday;
  
  if (dayOfWeek >= 4) {
    // If today is Thursday (4) or later in the week, days since Thursday
    daysSinceThursday = dayOfWeek - 4;
  } else {
    // If today is Sunday (0), Monday (1), Tuesday (2), or Wednesday (3)
    // We need to go back to last Thursday
    daysSinceThursday = dayOfWeek + 3; // 0+3=3, 1+3=4, 2+3=5, 3+3=6
  }
  
  currentThursday.setUTCDate(utcNow.getUTCDate() - daysSinceThursday);
  currentThursday.setUTCHours(0, 0, 0, 0);
  
  // Calculate MapleStory week number (based on Thursday start)
  const onejan = new Date(currentThursday.getUTCFullYear(), 0, 1);
  const mapleWeek = Math.ceil((((currentThursday - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  
  // Calculate calendar week number (based on current date)
  const calendarOnejan = new Date(utcNow.getUTCFullYear(), 0, 1);
  const calendarWeek = Math.ceil((((utcNow - calendarOnejan) / 86400000) + calendarOnejan.getUTCDay() + 1) / 7);
  
  return `${currentThursday.getUTCFullYear()}-${mapleWeek}-${calendarWeek}`;
}

// Get week key for a specific offset from current week
export function getWeekKeyOffset(offset = 0) {
  const now = new Date();
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
  
  // Find the most recent Thursday 00:00 UTC
  const dayOfWeek = utcNow.getUTCDay();
  let daysSinceThursday;
  
  if (dayOfWeek >= 4) {
    daysSinceThursday = dayOfWeek - 4;
  } else {
    daysSinceThursday = dayOfWeek + 3;
  }
  
  const currentThursday = new Date(utcNow);
  currentThursday.setUTCDate(utcNow.getUTCDate() - daysSinceThursday);
  currentThursday.setUTCHours(0, 0, 0, 0);
  
  // Add offset weeks (7 days each)
  const targetThursday = new Date(currentThursday);
  targetThursday.setUTCDate(currentThursday.getUTCDate() + (offset * 7));
  
  // Calculate MapleStory week number
  const onejan = new Date(targetThursday.getUTCFullYear(), 0, 1);
  const mapleWeek = Math.ceil((((targetThursday - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  
  // Calculate calendar week number (for the Wednesday of that MapleStory week)
  const targetWednesday = new Date(targetThursday);
  targetWednesday.setUTCDate(targetThursday.getUTCDate() + 6); // Wednesday is 6 days after Thursday
  
  const calendarOnejan = new Date(targetWednesday.getUTCFullYear(), 0, 1);
  const calendarWeek = Math.ceil((((targetWednesday - calendarOnejan) / 86400000) + calendarOnejan.getUTCDay() + 1) / 7);
  
  return `${targetThursday.getUTCFullYear()}-${mapleWeek}-${calendarWeek}`;
}

// Parse week key to get year, MapleStory week, and calendar week
export function parseWeekKey(weekKey) {
  if (!weekKey || typeof weekKey !== 'string') return null;
  
  const parts = weekKey.split('-');
  if (parts.length === 2) {
    // Legacy format (YYYY-WW) - treat as calendar week
    const year = parseInt(parts[0]);
    const week = parseInt(parts[1]);
    if (isNaN(year) || isNaN(week)) return null;
    return { year, mapleWeek: week, calendarWeek: week, isLegacy: true };
  } else if (parts.length === 3) {
    // New format (YYYY-MW-CW)
    const year = parseInt(parts[0]);
    const mapleWeek = parseInt(parts[1]);
    const calendarWeek = parseInt(parts[2]);
    if (isNaN(year) || isNaN(mapleWeek) || isNaN(calendarWeek)) return null;
    return { year, mapleWeek, calendarWeek, isLegacy: false };
  }
  
  return null;
}

// Get human readable week label
export function getWeekLabel(weekKey) {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return weekKey;
  
  const currentWeekKey = getCurrentWeekKey();
  
  if (weekKey === currentWeekKey) {
    if (parsed.isLegacy) {
      return `Week ${parsed.mapleWeek}, ${parsed.year} (Current)`;
    } else {
      return `Week ${parsed.mapleWeek}-${parsed.calendarWeek}, ${parsed.year} (Current)`;
    }
  }
  
  if (parsed.isLegacy) {
    return `Week ${parsed.mapleWeek}, ${parsed.year}`;
  } else {
    return `Week ${parsed.mapleWeek}-${parsed.calendarWeek}, ${parsed.year}`;
  }
}

// Get date range for a week key (Thursday to Wednesday)
export function getWeekDateRange(weekKey) {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return null;
  
  if (parsed.isLegacy) {
    // Legacy format - use old calculation for backward compatibility
    const firstDayOfYear = new Date(parsed.year, 0, 1);
    const firstThursday = new Date(firstDayOfYear);
    const dayOfWeek = firstDayOfYear.getDay();
    const daysToThursday = (4 - dayOfWeek + 7) % 7;
    firstThursday.setDate(firstDayOfYear.getDate() + daysToThursday);
    
    const weekStart = new Date(firstThursday);
    weekStart.setDate(firstThursday.getDate() + ((parsed.mapleWeek - 1) * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return { start: weekStart, end: weekEnd };
  } else {
    // New format - calculate based on MapleStory week
    // Find the first Thursday of the year
    const firstDayOfYear = new Date(Date.UTC(parsed.year, 0, 1));
    const firstThursday = new Date(firstDayOfYear);
    const dayOfWeek = firstDayOfYear.getUTCDay();
    
    // Calculate days to first Thursday
    let daysToFirstThursday;
    if (dayOfWeek <= 4) {
      // If Jan 1st is Sunday(0) through Thursday(4)
      daysToFirstThursday = 4 - dayOfWeek;
    } else {
      // If Jan 1st is Friday(5) or Saturday(6), go to next Thursday
      daysToFirstThursday = 11 - dayOfWeek; // 7 + (4 - dayOfWeek)
    }
    
    firstThursday.setUTCDate(firstDayOfYear.getUTCDate() + daysToFirstThursday);
    firstThursday.setUTCHours(0, 0, 0, 0);
    
    // Calculate Thursday start of the target MapleStory week
    const weekStart = new Date(firstThursday);
    weekStart.setUTCDate(firstThursday.getUTCDate() + ((parsed.mapleWeek - 1) * 7));
    
    // Wednesday end is 6 days later at 23:59:59
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);
    
    return { start: weekStart, end: weekEnd };
  }
}

// Compare two week keys (returns -1, 0, or 1)
export function compareWeekKeys(weekKey1, weekKey2) {
  const parsed1 = parseWeekKey(weekKey1);
  const parsed2 = parseWeekKey(weekKey2);
  
  if (!parsed1 || !parsed2) return 0;
  
  if (parsed1.year !== parsed2.year) {
    return parsed1.year - parsed2.year;
  }
  
  // Compare by MapleStory week number
  return parsed1.mapleWeek - parsed2.mapleWeek;
}

// Get the offset of a week key from current week
export function getWeekOffset(weekKey) {
  const currentWeekKey = getCurrentWeekKey();
  const currentParsed = parseWeekKey(currentWeekKey);
  const targetParsed = parseWeekKey(weekKey);
  
  if (!currentParsed || !targetParsed) return 0;
  
  // Simple approximation based on MapleStory weeks
  const yearDiff = targetParsed.year - currentParsed.year;
  const weekDiff = targetParsed.mapleWeek - currentParsed.mapleWeek;
  
  return (yearDiff * 52) + weekDiff;
}

// Calculate time until next weekly reset (Thursday 00:00 UTC)
export function getTimeUntilReset() {
  const now = new Date();
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
  
  // Get next Thursday 00:00 UTC
  const daysUntilThursday = (WEEKLY_RESET_INFO.DAY - utcNow.getUTCDay() + 7) % 7;
  const nextReset = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), utcNow.getUTCDate() + daysUntilThursday));
  
  if (daysUntilThursday === 0 && utcNow.getUTCHours() >= WEEKLY_RESET_INFO.HOUR) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 7);
  }
  
  const diff = nextReset - utcNow;
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  
  return {
    days: days.toString(),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0')
  };
}

// Get current month key (YYYY-MM)
export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Get current year key
export function getCurrentYearKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}`;
} 