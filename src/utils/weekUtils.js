// Week-related utility functions

import { WEEKLY_RESET_INFO } from '../constants';

// Get current week key (YYYY-WW) - moved from pitched-data-service for better organization
export function getCurrentWeekKey() {
  const now = new Date();
  const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const onejan = new Date(utcNow.getUTCFullYear(), 0, 1);
  const week = Math.ceil((((utcNow - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${utcNow.getUTCFullYear()}-${week}`;
}

// Get week key for a specific offset from current week
export function getWeekKeyOffset(offset = 0) {
  const now = new Date();
  const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  
  // Add offset weeks (7 days each)
  utcNow.setUTCDate(utcNow.getUTCDate() + (offset * 7));
  
  const onejan = new Date(utcNow.getUTCFullYear(), 0, 1);
  const week = Math.ceil((((utcNow - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${utcNow.getUTCFullYear()}-${week}`;
}

// Parse week key to get year and week number
export function parseWeekKey(weekKey) {
  if (!weekKey || typeof weekKey !== 'string') return null;
  
  const parts = weekKey.split('-');
  if (parts.length !== 2) return null;
  
  const year = parseInt(parts[0]);
  const week = parseInt(parts[1]);
  
  if (isNaN(year) || isNaN(week)) return null;
  
  return { year, week };
}

// Get human readable week label
export function getWeekLabel(weekKey) {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return weekKey;
  
  const currentWeekKey = getCurrentWeekKey();
  
  if (weekKey === currentWeekKey) {
    return `Week ${parsed.week}, ${parsed.year} (Current)`;
  }
  
  return `Week ${parsed.week}, ${parsed.year}`;
}

// Get date range for a week key
export function getWeekDateRange(weekKey) {
  const parsed = parseWeekKey(weekKey);
  if (!parsed) return null;
  
  // Get first day of the year
  const firstDayOfYear = new Date(parsed.year, 0, 1);
  
  // Calculate the start of the week (Thursday to Wednesday cycle)
  // Week 1 starts on the first Thursday of the year
  const firstThursday = new Date(firstDayOfYear);
  const dayOfWeek = firstDayOfYear.getDay();
  const daysToThursday = (4 - dayOfWeek + 7) % 7;
  firstThursday.setDate(firstDayOfYear.getDate() + daysToThursday);
  
  // Calculate start of target week
  const weekStart = new Date(firstThursday);
  weekStart.setDate(firstThursday.getDate() + ((parsed.week - 1) * 7));
  
  // Week end is 6 days after start (Wednesday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    start: weekStart,
    end: weekEnd
  };
}

// Compare two week keys (returns -1, 0, or 1)
export function compareWeekKeys(weekKey1, weekKey2) {
  const parsed1 = parseWeekKey(weekKey1);
  const parsed2 = parseWeekKey(weekKey2);
  
  if (!parsed1 || !parsed2) return 0;
  
  if (parsed1.year !== parsed2.year) {
    return parsed1.year - parsed2.year;
  }
  
  return parsed1.week - parsed2.week;
}

// Get the offset of a week key from current week
export function getWeekOffset(weekKey) {
  const currentWeekKey = getCurrentWeekKey();
  const currentParsed = parseWeekKey(currentWeekKey);
  const targetParsed = parseWeekKey(weekKey);
  
  if (!currentParsed || !targetParsed) return 0;
  
  // Simple approximation - could be more precise but this works for our use case
  const yearDiff = targetParsed.year - currentParsed.year;
  const weekDiff = targetParsed.week - currentParsed.week;
  
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