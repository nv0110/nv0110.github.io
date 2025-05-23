// localStorage Cleanup Script
// Copy and paste this into your browser console (F12) on the app page

console.log('🧹 Starting localStorage cleanup...');

// First, preserve the user's current page preference
const currentShowTable = localStorage.getItem('ms-show-table') === 'true';
const currentShowWeekly = localStorage.getItem('ms-show-weekly') === 'true';
let newActivePage = 'calculator';
if (currentShowTable) newActivePage = 'table';
else if (currentShowWeekly) newActivePage = 'weekly';

const redundantKeys = [
  'ms-weekly-pitched-week-key',  // -> Cloud currentWeekKey
  'ms-weekly-week-key',          // -> Cloud currentWeekKey  
  'ms-weekly-clears',            // -> Cloud weeklyBossClearHistory
  'ms-weekly-pitched',           // -> Cloud pitched_items
  'ms-progress',                 // -> Cloud weeklyProgressHistory
  'ms-stats-panel',              // -> Calculated from cloud data
  'ms-stats-tracking-started',   // -> Unnecessary flag
  'ms-show-table',               // -> Use ACTIVE_PAGE instead
  'ms-show-weekly',              // -> Use ACTIVE_PAGE instead
];

let removedCount = 0;
redundantKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value !== null) {
    localStorage.removeItem(key);
    removedCount++;
    console.log(`🗑️  Removed: ${key} (was: ${value})`);
  }
});

// Set the new active page preference
localStorage.setItem('ms-active-page', newActivePage);
console.log(`📄 Set active page to: ${newActivePage}`);

if (removedCount > 0) {
  console.log(`✅ Cleaned up ${removedCount} redundant localStorage keys`);
  console.log('💡 These are now handled by cloud storage or are unnecessary');
  console.log('🔄 Refresh the page to see changes');
} else {
  console.log(`✅ No redundant localStorage keys found - already clean!`);
}

console.log('\n📊 Current localStorage keys:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('ms-')) {
    console.log(`  ${key}: ${localStorage.getItem(key)}`);
  }
} 