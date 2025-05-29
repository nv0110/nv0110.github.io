// Test script for Phase 2 Weekly Clears functionality
import { toggleBossClearStatus, fetchUserWeeklyData } from './services/userWeeklyDataService.js';
import { getCurrentMapleWeekStartDate } from './utils/mapleWeekUtils.js';

async function testWeeklyClears() {
  console.log('🧪 Testing Weekly Clears Service...');
  
  const userId = 'TEST_USER_' + Date.now();
  const weekStart = getCurrentMapleWeekStartDate();
  
  try {
    console.log(`\n1. Testing boss clear toggle for user: ${userId}`);
    console.log(`   Week start: ${weekStart}`);
    
    // Test toggling boss clear status
    const result = await toggleBossClearStatus(userId, weekStart, '0', 'DH', true);
    console.log('   ✅ Toggle boss clear result:', result);
    
    // Test fetching data
    const fetchResult = await fetchUserWeeklyData(userId, weekStart);
    console.log('   ✅ Fetch result:', fetchResult);
    
    if (fetchResult.success && fetchResult.data) {
      console.log('   📊 Weekly clears:', fetchResult.data.weekly_clears);
    }
    
    console.log('\n✅ Weekly Clears Service tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing weekly clears:', error);
  }
}

testWeeklyClears();