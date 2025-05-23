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