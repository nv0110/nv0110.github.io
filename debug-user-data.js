#!/usr/bin/env node

// Debug script to check user_boss_data contents
import { supabase } from './src/supabaseClient.js';
import { getCurrentMapleWeekStartDate, getMapleWeekStartDateWithOffset } from './utils/mapleWeekUtils.js';

const USER_CODE = process.argv[2];

if (!USER_CODE) {
  console.log('Usage: node debug-user-data.js <USER_CODE>');
  console.log('Please provide your user code as an argument');
  process.exit(1);
}

console.log('=== USER DATA DEBUG ===');
console.log('User Code:', USER_CODE);
console.log('Current week start:', getCurrentMapleWeekStartDate());
console.log('Previous week start:', getMapleWeekStartDateWithOffset(-1));

async function debugUserData() {
  try {
    // Check user_boss_data table
    const { data: userBossData, error: bossError } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', USER_CODE)
      .order('maple_week_start', { ascending: false });

    if (bossError) {
      console.error('❌ Error fetching user_boss_data:', bossError);
      return;
    }

    console.log('\n=== USER_BOSS_DATA RECORDS ===');
    if (!userBossData || userBossData.length === 0) {
      console.log('❌ No user_boss_data records found');
    } else {
      console.log(`✅ Found ${userBossData.length} user_boss_data records:`);
      userBossData.forEach((record, index) => {
        console.log(`\n--- Record ${index + 1} ---`);
        console.log('Week start:', record.maple_week_start);
        console.log('Character map:', JSON.stringify(record.char_map, null, 2));
        console.log('Boss config:', JSON.stringify(record.boss_config, null, 2));
        console.log('Weekly clears:', JSON.stringify(record.weekly_clears, null, 2));
        console.log('Created at:', record.created_at);
      });
    }

    // Check specific week data
    const currentWeek = getCurrentMapleWeekStartDate();
    const previousWeek = getMapleWeekStartDateWithOffset(-1);

    console.log('\n=== SPECIFIC WEEK CHECKS ===');
    
    // Check current week
    const { data: currentWeekData, error: currentError } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', USER_CODE)
      .eq('maple_week_start', currentWeek)
      .single();

    if (currentError && currentError.code !== 'PGRST116') {
      console.error('❌ Error fetching current week data:', currentError);
    } else if (currentWeekData) {
      console.log('✅ Current week data exists:', currentWeek);
      console.log('   Character map keys:', Object.keys(currentWeekData.char_map || {}));
      console.log('   Boss config keys:', Object.keys(currentWeekData.boss_config || {}));
    } else {
      console.log('❌ No current week data found for:', currentWeek);
    }

    // Check previous week
    const { data: previousWeekData, error: previousError } = await supabase
      .from('user_boss_data')
      .select('*')
      .eq('user_id', USER_CODE)
      .eq('maple_week_start', previousWeek)
      .single();

    if (previousError && previousError.code !== 'PGRST116') {
      console.error('❌ Error fetching previous week data:', previousError);
    } else if (previousWeekData) {
      console.log('✅ Previous week data exists:', previousWeek);
      console.log('   Character map keys:', Object.keys(previousWeekData.char_map || {}));
      console.log('   Boss config keys:', Object.keys(previousWeekData.boss_config || {}));
    } else {
      console.log('❌ No previous week data found for:', previousWeek);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUserData(); 