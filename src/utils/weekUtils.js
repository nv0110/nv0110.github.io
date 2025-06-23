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
  
  // Calculate calendar week number (based on the Wednesday of the current MapleStory week)
  const currentWednesday = new Date(currentThursday);
  currentWednesday.setUTCDate(currentThursday.getUTCDate() + 6); // Wednesday is 6 days after Thursday

  // Ensure calendar week calculation considers the correct year if the week spans across year-end.
  // The currentWednesday might roll over to the next year if the MapleStory week does.
  const calendarWeek = Math.ceil((((currentWednesday - new Date(currentWednesday.getUTCFullYear(), 0, 1)) / 86400000) + new Date(currentWednesday.getUTCFullYear(), 0, 1).getUTCDay() + 1) / 7);
  
  return `${currentThursday.getUTCFullYear()}-${mapleWeek}-${calendarWeek}`;
}

// Get week key for a specific offset from current week or a baseKey
export function getWeekKeyOffset(offset = 0, baseKey = null) {
  let referenceThursday;

  if (baseKey) {
    const parsedBase = parseWeekKey(baseKey);
    if (!parsedBase) {
      console.error(`getWeekKeyOffset: Invalid baseKey '${baseKey}'. Falling back to current week's Thursday.`);
      const now = new Date();
      const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
      const dayOfWeek = utcNow.getUTCDay();
      let daysSinceThursdayFallback;
      if (dayOfWeek >= 4) { daysSinceThursdayFallback = dayOfWeek - 4; } else { daysSinceThursdayFallback = dayOfWeek + 3; }
      referenceThursday = new Date(utcNow);
      referenceThursday.setUTCDate(utcNow.getUTCDate() - daysSinceThursdayFallback);
      referenceThursday.setUTCHours(0, 0, 0, 0);
    } else {
      const baseDateRange = getWeekDateRange(baseKey);
      if (!baseDateRange || !baseDateRange.start) {
        console.error(`getWeekKeyOffset: Could not get date range for baseKey '${baseKey}'. Falling back to current week's Thursday.`);
        const now = new Date();
        const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
        const dayOfWeek = utcNow.getUTCDay();
        let daysSinceThursdayFallback;
        if (dayOfWeek >= 4) { daysSinceThursdayFallback = dayOfWeek - 4; } else { daysSinceThursdayFallback = dayOfWeek + 3; }
        referenceThursday = new Date(utcNow);
        referenceThursday.setUTCDate(utcNow.getUTCDate() - daysSinceThursdayFallback);
        referenceThursday.setUTCHours(0, 0, 0, 0);
      } else {
        referenceThursday = new Date(baseDateRange.start); // start is already UTC Thursday 00:00
      }
    }
  } else {
    const now = new Date();
    const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
    const dayOfWeek = utcNow.getUTCDay();
    let daysSinceThursday;
    if (dayOfWeek >= 4) { daysSinceThursday = dayOfWeek - 4; } else { daysSinceThursday = dayOfWeek + 3; }
    const currentThursday = new Date(utcNow);
    currentThursday.setUTCDate(utcNow.getUTCDate() - daysSinceThursday);
    currentThursday.setUTCHours(0, 0, 0, 0);
    referenceThursday = currentThursday;
  }
  
  const targetThursday = new Date(referenceThursday);
  targetThursday.setUTCDate(referenceThursday.getUTCDate() + (offset * 7));
  
  const onejan = new Date(targetThursday.getUTCFullYear(), 0, 1);
  const mapleWeek = Math.ceil((((targetThursday - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  
  const targetWednesday = new Date(targetThursday);
  targetWednesday.setUTCDate(targetThursday.getUTCDate() + 6);
  
  const calendarWeek = Math.ceil((((targetWednesday - new Date(targetWednesday.getUTCFullYear(), 0, 1)) / 86400000) + new Date(targetWednesday.getUTCFullYear(), 0, 1).getUTCDay() + 1) / 7);
  
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
export function getWeekLabel(weekKey, currentContextWeekKey = null) {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return weekKey;
  
  const effectiveCurrentWeekKey = currentContextWeekKey || getCurrentWeekKey();
  
  if (weekKey === effectiveCurrentWeekKey) {
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

// Get the offset of a week key from current week or a baseKey
export function getWeekOffset(targetWeekKey, baseWeekKey = null) {
  const effectiveBaseWeekKey = baseWeekKey || getCurrentWeekKey();

  const baseDetails = getWeekDateRange(effectiveBaseWeekKey);
  const targetDetails = getWeekDateRange(targetWeekKey);

  if (!baseDetails || !targetDetails || !baseDetails.start || !targetDetails.start) {
    // Fallback for safety, though ideally parseWeekKey and getWeekDateRange should be robust
    const parsedBase = parseWeekKey(effectiveBaseWeekKey);
    const parsedTarget = parseWeekKey(targetWeekKey);
    if (!parsedBase || !parsedTarget) return 0;
    const yearDiff = parsedTarget.year - parsedBase.year;
    const weekDiff = parsedTarget.mapleWeek - parsedBase.mapleWeek; // Using MapleStory week for consistency
    return (yearDiff * 52) + weekDiff; // Approximation
  }
  
  // Calculate difference in days from the start of the weeks (Thursdays)
  const timeDiff = targetDetails.start.getTime() - baseDetails.start.getTime();
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days
  
  // Round to the nearest whole number of weeks.
  // Since week starts are precise (Thursday 00:00 UTC), division by 7 should be clean for whole week differences.
  return Math.round(daysDiff / 7);
}

// Calculate time until next weekly reset (Thursday 00:00 UTC)
export function getTimeUntilReset() {
  const now = new Date();
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
  
  // Get next Thursday 00:00 UTC
  const daysUntilThursday = (WEEKLY_RESET_INFO.DAY - utcNow.getUTCDay() + 7) % 7;
  const nextReset = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), utcNow.getUTCDate() + daysUntilThursday));
  nextReset.setUTCHours(WEEKLY_RESET_INFO.HOUR, 0, 0, 0); // Set to reset hour specifically
  
  if (daysUntilThursday === 0 && 
      (utcNow.getUTCHours() > WEEKLY_RESET_INFO.HOUR || 
       (utcNow.getUTCHours() === WEEKLY_RESET_INFO.HOUR && utcNow.getUTCMinutes() >= 0)) // Check if current time is past reset time on reset day
     ) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 7);
  } else if (daysUntilThursday === 0 && utcNow.getUTCHours() < WEEKLY_RESET_INFO.HOUR) {
    // It's Thursday, but before reset time. nextReset is already correct for today.
  } else if (daysUntilThursday !== 0) {
    // It's not Thursday. nextReset is correct for the upcoming Thursday.
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

// Convert a date string to week key format
export function convertDateToWeekKey(dateString) {
  if (!dateString) return null;
  
  try {
    // Parse the date string (expected format: YYYY-MM-DD)
    const date = new Date(dateString + 'T00:00:00.000Z'); // Ensure UTC
    
    if (isNaN(date.getTime())) {
      console.warn(`convertDateToWeekKey: Invalid date string '${dateString}'`);
      return null;
    }
    
    // Find the Thursday that starts this MapleStory week
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 4 = Thursday
    let daysSinceThursday;
    
    if (dayOfWeek >= 4) {
      // If date is Thursday (4) or later in the week
      daysSinceThursday = dayOfWeek - 4;
    } else {
      // If date is Sunday (0), Monday (1), Tuesday (2), or Wednesday (3)
      // Go back to previous Thursday
      daysSinceThursday = dayOfWeek + 3;
    }
    
    const thursdayStart = new Date(date);
    thursdayStart.setUTCDate(date.getUTCDate() - daysSinceThursday);
    thursdayStart.setUTCHours(0, 0, 0, 0);
    
    // Calculate MapleStory week number
    const onejan = new Date(thursdayStart.getUTCFullYear(), 0, 1);
    const mapleWeek = Math.ceil((((thursdayStart - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
    
    // Calculate calendar week number (based on the Wednesday of this MapleStory week)
    const wednesdayEnd = new Date(thursdayStart);
    wednesdayEnd.setUTCDate(thursdayStart.getUTCDate() + 6);
    
    const calendarWeek = Math.ceil((((wednesdayEnd - new Date(wednesdayEnd.getUTCFullYear(), 0, 1)) / 86400000) + new Date(wednesdayEnd.getUTCFullYear(), 0, 1).getUTCDay() + 1) / 7);
    
    return `${thursdayStart.getUTCFullYear()}-${mapleWeek}-${calendarWeek}`;
    
  } catch (error) {
    console.error(`convertDateToWeekKey: Error processing date '${dateString}':`, error);
    return null;
  }
}

// Convert week key back to date (returns the Monday of that week as YYYY-MM-DD)
export function convertWeekKeyToDate(weekKey) {
  if (!weekKey) return null;
  
  try {
    const weekRange = getWeekDateRange(weekKey);
    if (!weekRange || !weekRange.start) return null;
    
    // Get the Monday of this week (3 days before Thursday start)
    const monday = new Date(weekRange.start);
    monday.setUTCDate(weekRange.start.getUTCDate() - 3);
    
    // Format as YYYY-MM-DD
    const year = monday.getUTCFullYear();
    const month = String(monday.getUTCMonth() + 1).padStart(2, '0');
    const day = String(monday.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`convertWeekKeyToDate: Error processing week key '${weekKey}':`, error);
    return null;
  }
}

// Get current year key
export function getCurrentYearKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}`;
}
