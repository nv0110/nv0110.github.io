#!/usr/bin/env node

// Debug script to check week date calculations
import { getCurrentMapleWeekStartDate, getMapleWeekStartDateWithOffset } from './utils/mapleWeekUtils.js';

console.log('=== WEEK DATE DEBUG ===');
console.log('Current week start:', getCurrentMapleWeekStartDate());
console.log('Previous week start:', getMapleWeekStartDateWithOffset(-1));
console.log('Next week start:', getMapleWeekStartDateWithOffset(1));

const now = new Date();
console.log('\n=== CURRENT TIME ===');
console.log('Current UTC time:', now.toISOString());
console.log('Current UTC day:', now.getUTCDay(), '(0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)');
console.log('Current UTC hour:', now.getUTCHours());

console.log('\n=== WEEKLY RESET LOGIC ===');
console.log('Weekly reset should occur every Thursday at 00:00 UTC');
const currentWeek = getCurrentMapleWeekStartDate();
const nextWeek = getMapleWeekStartDateWithOffset(1);

// Check if we're in a weekly reset scenario
const weeklyResetJustHappened = new Date().getTime() - new Date(currentWeek + 'T00:00:00.000Z').getTime() < 24 * 60 * 60 * 1000;
console.log('Weekly reset just happened (within 24h):', weeklyResetJustHappened); 