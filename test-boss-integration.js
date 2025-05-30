/**
 * Test script for Boss Configuration Database Integration
 * 
 * This script tests the integration between the frontend boss configuration
 * and the database boss_registry system.
 */

import { 
  getBossCodeFromNameAndDifficulty,
  getNameAndDifficultyFromBossCode,
  convertBossesToConfigString,
  parseBossConfigStringToFrontend
} from './src/utils/bossCodeMapping.js';

// Test data
const testBosses = [
  { name: 'Lotus', difficulty: 'Hard', partySize: 1 },
  { name: 'Damien', difficulty: 'Normal', partySize: 2 },
  { name: 'Lucid', difficulty: 'Easy', partySize: 6 },
  { name: 'Will', difficulty: 'Hard', partySize: 1 },
  { name: 'Gloom', difficulty: 'Chaos', partySize: 3 }
];

async function testBossCodeMapping() {
  console.log('🧪 Testing Boss Code Mapping Integration...\n');

  // Test 1: Individual boss code conversion
  console.log('📋 Test 1: Individual Boss Code Conversion');
  testBosses.forEach(boss => {
    const bossCode = getBossCodeFromNameAndDifficulty(boss.name, boss.difficulty);
    console.log(`  ${boss.name} ${boss.difficulty} -> ${bossCode}`);
    
    if (bossCode) {
      const reversed = getNameAndDifficultyFromBossCode(bossCode);
      console.log(`  ${bossCode} -> ${reversed?.bossName} ${reversed?.difficulty}`);
    }
    console.log('');
  });

  // Test 2: Full boss configuration conversion
  console.log('📦 Test 2: Boss Configuration String Conversion');
  try {
    const configString = await convertBossesToConfigString(testBosses);
    console.log(`  Bosses to Config String:`);
    console.log(`  ${JSON.stringify(testBosses, null, 2)}`);
    console.log(`  -> "${configString}"`);
    console.log('');

    // Test 3: Parse config string back to frontend format
    console.log('🔄 Test 3: Config String to Bosses Conversion');
    const parsedBosses = parseBossConfigStringToFrontend(configString);
    console.log(`  Config String: "${configString}"`);
    console.log(`  -> Parsed Bosses:`);
    console.log(`  ${JSON.stringify(parsedBosses, null, 2)}`);
    console.log('');

    // Test 4: Verify round-trip consistency
    console.log('✅ Test 4: Round-trip Consistency Check');
    const originalCount = testBosses.length;
    const parsedCount = parsedBosses.length;
    
    console.log(`  Original bosses: ${originalCount}`);
    console.log(`  Parsed bosses: ${parsedCount}`);
    
    if (originalCount === parsedCount) {
      console.log('  ✅ Boss count matches!');
      
      let allMatch = true;
      for (let i = 0; i < originalCount; i++) {
        const orig = testBosses[i];
        const parsed = parsedBosses[i];
        
        if (orig.name !== parsed.name || 
            orig.difficulty !== parsed.difficulty || 
            orig.partySize !== parsed.partySize) {
          console.log(`  ❌ Mismatch at index ${i}:`);
          console.log(`    Original: ${JSON.stringify(orig)}`);
          console.log(`    Parsed: ${JSON.stringify(parsed)}`);
          allMatch = false;
        }
      }
      
      if (allMatch) {
        console.log('  ✅ All boss data matches perfectly!');
      }
    } else {
      console.log('  ❌ Boss count mismatch!');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }

  console.log('\n🎉 Boss Code Mapping Integration Test Complete!');
}

// Run the test
testBossCodeMapping().catch(console.error);