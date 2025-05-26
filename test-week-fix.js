// Test the fixed week key format
import { getCurrentWeekKey, getWeekLabel, getWeekDateRange, parseWeekKey } from './src/utils/weekUtils.js';

console.log('=== Fixed MapleStory Week Key Test ===');

const currentWeek = getCurrentWeekKey();
console.log('Current week key:', currentWeek);
console.log('Current week label:', getWeekLabel(currentWeek));

const parsed = parseWeekKey(currentWeek);
console.log('Parsed week key:', parsed);

const dateRange = getWeekDateRange(currentWeek);
if (dateRange) {
  console.log('Week date range (Thursday to Wednesday):');
  console.log('  Start (Thursday):', dateRange.start.toISOString());
  console.log('  Start day of week:', dateRange.start.getUTCDay(), '(should be 4 for Thursday)');
  console.log('  End (Wednesday):', dateRange.end.toISOString());
  console.log('  End day of week:', new Date(dateRange.end.getTime() - 1000).getUTCDay(), '(should be 3 for Wednesday)');
  
  // Check if today is within the range
  const now = new Date();
  const isInRange = now >= dateRange.start && now <= dateRange.end;
  console.log('  Current time is in range:', isInRange);
  
  // Show the actual dates in a readable format
  console.log('  Readable range:', 
    dateRange.start.toISOString().split('T')[0], 
    'to', 
    dateRange.end.toISOString().split('T')[0]
  );
}

// Test what day of week we're currently on
const now = new Date();
console.log('\n=== Current Date Info ===');
console.log('Current UTC date:', now.toISOString());
console.log('Current UTC day of week:', now.getUTCDay(), '(0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)');

// Test a few different week offsets
console.log('\n=== Week Offset Tests ===');
for (let offset = -1; offset <= 1; offset++) {
  const { getWeekKeyOffset } = await import('./src/utils/weekUtils.js');
  const weekKey = getWeekKeyOffset(offset);
  const range = getWeekDateRange(weekKey);
  if (range) {
    console.log(`Week ${offset}: ${weekKey} -> ${range.start.toISOString().split('T')[0]} to ${range.end.toISOString().split('T')[0]}`);
  }
} 