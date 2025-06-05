/**
 * Debug helpers for testing weekly data migration
 * These functions can be called from the browser console for debugging
 */

import { logger } from './logger.js';

/**
 * Test weekly data migration for the current user
 * Usage in browser console: window.testWeeklyMigration()
 */
async function testWeeklyMigration() {
  try {
    // Get current user code from localStorage
    const userCode = localStorage.getItem('ms-user-code');
    if (!userCode) {
      console.error('No user logged in');
      return;
    }

    console.log('Testing weekly data migration for user:', userCode);

    // Import the debug functions
    const { debugWeeklyDataTransition, forceMigrationTest, debugAllUserData } = await import('../../services/userWeeklyDataService.js');

    // First, check the current state
    console.log('1. Checking current weekly data state...');
    const debugResult = await debugWeeklyDataTransition(userCode);
    console.log('Debug result:', debugResult);

    // Then check all user data
    console.log('2. Checking all user data in database...');
    const allDataResult = await debugAllUserData(userCode);
    console.log('All data result:', allDataResult);

    // Then force a migration test
    console.log('3. Testing migration...');
    const migrationResult = await forceMigrationTest(userCode);
    console.log('Migration result:', migrationResult);

    return {
      debugResult,
      allDataResult,
      migrationResult
    };

  } catch (error) {
    console.error('Error testing weekly migration:', error);
    logger.error('testWeeklyMigration: Error:', error);
  }
}

/**
 * Check current week data for debugging
 */
async function checkCurrentWeekData() {
  try {
    const userCode = localStorage.getItem('ms-user-code');
    if (!userCode) {
      console.error('No user logged in');
      return;
    }

    const { fetchCurrentWeekData, debugAllUserData } = await import('../../services/userWeeklyDataService.js');
    
    console.log('Checking all user data first...');
    const allData = await debugAllUserData(userCode);
    console.log('All user data:', allData);
    
    console.log('Checking current week data...');
    const result = await fetchCurrentWeekData(userCode);
    console.log('Current week data:', result);
    
    return { allData, currentWeek: result };

  } catch (error) {
    console.error('Error checking current week data:', error);
    logger.error('checkCurrentWeekData: Error:', error);
  }
}

/**
 * Refresh app data manually
 */
async function refreshAppData() {
  try {
    console.log('Refreshing app data...');
    
    // Trigger a custom event to refresh app data
    window.dispatchEvent(new CustomEvent('forceAppDataRefresh'));
    
    console.log('App data refresh triggered');

  } catch (error) {
    console.error('Error refreshing app data:', error);
    logger.error('refreshAppData: Error:', error);
  }
}

/**
 * Quick debug function to check all user data
 */
async function debugAllData() {
  try {
    const userCode = localStorage.getItem('ms-user-code');
    if (!userCode) {
      console.error('No user logged in');
      return;
    }

    const { debugAllUserData } = await import('../../services/userWeeklyDataService.js');
    const result = await debugAllUserData(userCode);
    
    console.log('All user data in database:', result);
    return result;

  } catch (error) {
    console.error('Error checking all user data:', error);
    logger.error('debugAllData: Error:', error);
  }
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  window.testWeeklyMigration = testWeeklyMigration;
  window.checkCurrentWeekData = checkCurrentWeekData;
  window.debugAllData = debugAllData;
  window.refreshAppData = refreshAppData;
  
  // New function to verify weekly reset readiness
  window.verifyWeeklyResetReadiness = async () => {
    console.log('🛡️ Verifying weekly reset readiness...');
    
    try {
      const userCode = localStorage.getItem('ms-user-code');
      if (!userCode) {
        console.error('❌ No user code found');
        return;
      }

      const { getCurrentMapleWeekStartDate, getMapleWeekStartDateWithOffset } = await import('../../utils/mapleWeekUtils.js');
      const { fetchUserWeeklyData } = await import('../../services/userWeeklyDataService.js');
      
      const currentWeek = getCurrentMapleWeekStartDate();
      const previousWeek = getMapleWeekStartDateWithOffset(-1);
      const nextWeek = getMapleWeekStartDateWithOffset(1);
      
      console.log('📅 Week analysis:');
      console.log(`  Previous: ${previousWeek}`);
      console.log(`  Current:  ${currentWeek}`);
      console.log(`  Next:     ${nextWeek}`);
      
      // Check each week's data
      const [prevData, currData, nextData] = await Promise.all([
        fetchUserWeeklyData(userCode, previousWeek),
        fetchUserWeeklyData(userCode, currentWeek),
        fetchUserWeeklyData(userCode, nextWeek)
      ]);
      
      console.log('📊 Data status:');
      console.log(`  Previous week: ${prevData.success ? (prevData.data ? '✅ Has data' : '❌ No data') : '❌ Error'}`);
      console.log(`  Current week:  ${currData.success ? (currData.data ? '✅ Has data' : '❌ No data') : '❌ Error'}`);
      console.log(`  Next week:     ${nextData.success ? (nextData.data ? '⚠️ Unexpected data' : '✅ No data (expected)') : '❌ Error'}`);
      
      // Check if we're ready for next reset
      const isReady = currData.success && currData.data && Object.keys(currData.data.char_map || {}).length > 0;
      
      console.log(`🛡️ Reset readiness: ${isReady ? '✅ READY' : '❌ NOT READY'}`);
      
      if (isReady) {
        const charCount = Object.keys(currData.data.char_map).length;
        console.log(`✅ ${charCount} characters ready for next weekly reset`);
        console.log('✅ Migration system operational');
      } else {
        console.log('❌ Current week has no character data - reset migration may fail');
      }
      
      return isReady;
      
    } catch (error) {
      console.error('❌ Error verifying reset readiness:', error);
      return false;
    }
  };

  console.log('Debug helpers loaded. Available functions:');
  console.log('- window.testWeeklyMigration()');
  console.log('- window.checkCurrentWeekData()');
  console.log('- window.debugAllData()');
  console.log('- window.refreshAppData()');
  console.log('- window.verifyWeeklyResetReadiness()');
}

export {
  testWeeklyMigration,
  checkCurrentWeekData,
  debugAllData,
  refreshAppData
}; 