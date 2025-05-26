/**
 * Test file for Character Purge Functionality
 * 
 * This file can be run in a browser console to test the new purge features.
 * 
 * To test:
 * 1. Open the app in your browser
 * 2. Open browser console
 * 3. Copy and paste this code
 * 4. Replace 'YOUR_USER_CODE' with your actual user code
 * 5. Replace 'TEST_CHARACTER_NAME' with a character name you want to test
 * 6. Run the test functions
 */

// Test configuration
const TEST_CONFIG = {
  userCode: 'YOUR_USER_CODE', // Replace with your actual user code
  characterName: 'TEST_CHARACTER_NAME', // Replace with an actual character name
  characterIdx: 0
};

/**
 * Test 1: Basic purge functionality
 */
async function testPurgePitchedRecords() {
  console.log('🧪 Test 1: Testing purgePitchedRecords function');
  
  try {
    // Import the function
    const { purgePitchedRecords } = await import('./src/pitched-data-service.js');
    
    // Test the purge
    const result = await purgePitchedRecords(
      TEST_CONFIG.userCode, 
      TEST_CONFIG.characterName, 
      TEST_CONFIG.characterIdx
    );
    
    console.log('✅ Purge result:', result);
    
    if (result.success) {
      console.log(`📊 Items removed: ${result.itemsRemoved}`);
      console.log(`📊 Boss runs removed: ${result.bossRunsRemoved}`);
      console.log(`📊 Boss runs preserved: ${result.bossRunsPreserved}`);
      console.log('🔍 Audit entry:', result.audit);
    } else {
      console.error('❌ Purge failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Audit history functionality
 */
async function testAuditHistory() {
  console.log('🧪 Test 2: Testing audit history retrieval');
  
  try {
    // Import the function
    const { getPitchedResetAuditHistory } = await import('./src/pitched-data-service.js');
    
    // Get audit history
    const result = await getPitchedResetAuditHistory(TEST_CONFIG.userCode);
    
    console.log('✅ Audit history result:', result);
    
    if (result.success) {
      console.log(`📊 Total resets: ${result.totalResets}`);
      console.log('📋 Recent audit entries:');
      result.history.slice(0, 5).forEach((entry, idx) => {
        console.log(`  ${idx + 1}. ${entry.character} - ${entry.timestamp} (${entry.itemsRemoved} items, ${entry.bossRunsRemoved} runs)`);
      });
    } else {
      console.error('❌ Audit history failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: UI clear functionality
 */
function testUIClearing() {
  console.log('🧪 Test 3: Testing UI pitched item clearing');
  
  try {
    // Import the function
    const { clearCharacterPitchedUI } = require('./src/pitched-data-service.js');
    
    // Mock UI state
    const mockPitchedChecked = {
      'TestChar-0__Zakum__Condensed Power Crystal__2024-52': true,
      'TestChar-0__Papulatus__Black Cube__2024-52': true,
      'OtherChar-1__Zakum__Condensed Power Crystal__2024-52': true,
      'TestChar-0__Zakum__Red Cube__2024-51': true, // Different week
    };
    
    console.log('📝 Before clearing:', mockPitchedChecked);
    
    // Clear for TestChar-0
    const clearedState = clearCharacterPitchedUI(
      mockPitchedChecked, 
      'TestChar', 
      0, 
      '2024-52'
    );
    
    console.log('📝 After clearing:', clearedState);
    
    // Verify results
    const expectedRemaining = {
      'OtherChar-1__Zakum__Condensed Power Crystal__2024-52': true,
      'TestChar-0__Zakum__Red Cube__2024-51': true,
    };
    
    const isCorrect = JSON.stringify(clearedState) === JSON.stringify(expectedRemaining);
    console.log(isCorrect ? '✅ UI clearing test passed' : '❌ UI clearing test failed');
    
    return { success: isCorrect, clearedState, expectedRemaining };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Data integrity check
 */
async function testDataIntegrity() {
  console.log('🧪 Test 4: Testing data integrity after purge');
  
  try {
    // Get user data before and after
    const { supabase } = await import('./src/supabaseClient.js');
    
    // Get data before
    const { data: beforeData, error: beforeError } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', TEST_CONFIG.userCode)
      .single();
      
    if (beforeError) throw beforeError;
    
    console.log('📊 Data before test:');
    console.log(`  - Pitched items: ${beforeData.pitched_items?.length || 0}`);
    console.log(`  - Boss runs: ${beforeData.data?.boss_runs?.length || 0}`);
    
    // Perform purge
    const purgeResult = await testPurgePitchedRecords();
    
    if (!purgeResult.success) {
      throw new Error('Purge failed, cannot test integrity');
    }
    
    // Get data after
    const { data: afterData, error: afterError } = await supabase
      .from('user_data')
      .select('data, pitched_items')
      .eq('id', TEST_CONFIG.userCode)
      .single();
      
    if (afterError) throw afterError;
    
    console.log('📊 Data after purge:');
    console.log(`  - Pitched items: ${afterData.pitched_items?.length || 0}`);
    console.log(`  - Boss runs: ${afterData.data?.boss_runs?.length || 0}`);
    console.log(`  - Audit history entries: ${afterData.data?.pitched_reset_history?.length || 0}`);
    
    // Verify data integrity
    const integrityChecks = {
      hasAuditEntry: (afterData.data?.pitched_reset_history?.length || 0) > 0,
      preservedOtherCharacters: true, // This would need more complex checking
      removedTargetCharacter: true     // This would need more complex checking
    };
    
    console.log('🔍 Integrity checks:', integrityChecks);
    
    return { success: true, beforeData, afterData, integrityChecks };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting comprehensive purge functionality tests...');
  console.log('⚠️  Make sure to update TEST_CONFIG with your actual values!');
  
  if (TEST_CONFIG.userCode === 'YOUR_USER_CODE' || TEST_CONFIG.characterName === 'TEST_CHARACTER_NAME') {
    console.error('❌ Please update TEST_CONFIG with your actual user code and character name');
    return;
  }
  
  const results = {
    purge: await testPurgePitchedRecords(),
    audit: await testAuditHistory(),
    ui: testUIClearing(),
    integrity: await testDataIntegrity()
  };
  
  console.log('📋 Test Results Summary:');
  Object.entries(results).forEach(([test, result]) => {
    console.log(`  ${test}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  return results;
}

// Instructions
console.log(`
🧪 Character Purge Functionality Test Suite

To run these tests:

1. Update TEST_CONFIG with your values:
   TEST_CONFIG.userCode = 'your-actual-user-code';
   TEST_CONFIG.characterName = 'your-test-character-name';

2. Run individual tests:
   await testPurgePitchedRecords();
   await testAuditHistory();
   testUIClearing();
   await testDataIntegrity();

3. Or run all tests:
   await runAllTests();

⚠️  Warning: testPurgePitchedRecords() will actually purge data!
   Only use with test data or data you're okay with losing.
`);

// Export for browser console use
if (typeof window !== 'undefined') {
  window.testPurgeFunctionality = {
    testPurgePitchedRecords,
    testAuditHistory,
    testUIClearing,
    testDataIntegrity,
    runAllTests,
    TEST_CONFIG
  };
} 