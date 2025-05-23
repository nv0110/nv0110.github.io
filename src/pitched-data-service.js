import { supabase } from './supabaseClient';

// Function to save a pitched item to the cloud database
export async function savePitchedItem(userCode, data) {
  try {
    const { character, bossName, itemName, itemImage, date } = data;
    
    // Create a record with all the necessary information
    const pitchedItem = {
      user_id: userCode,
      character_name: character,
      boss_name: bossName,
      item_name: itemName,
      item_image: itemImage,
      obtained_date: date || new Date().toISOString(),
      year: new Date(date || Date.now()).getUTCFullYear(),
      week_key: getCurrentWeekKey(),
      month_key: getCurrentMonthKey()
    };
    
    // Insert the pitched item into Supabase
    const { error } = await supabase
      .from('pitched_items')
      .insert([pitchedItem]);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving pitched item:', error);
    return { success: false, error };
  }
}

// Function to get all pitched items for a user
export async function getPitchedItems(userCode) {
  try {
    const { data, error } = await supabase
      .from('pitched_items')
      .select('*')
      .eq('user_id', userCode)
      .order('obtained_date', { ascending: false });
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching pitched items:', error);
    return { success: false, error, data: [] };
  }
}

// Function to get yearly stats for pitched items
export async function getYearlyPitchedStats(userCode, year = null) {
  try {
    let query = supabase
      .from('pitched_items')
      .select('*')
      .eq('user_id', userCode);
      
    // Filter by year if provided
    if (year) {
      query = query.eq('year', year);
    }
    
    const { data, error } = await query.order('obtained_date', { ascending: false });
      
    if (error) throw error;
    
    // Process data to get yearly stats
    const yearlyStats = {};
    
    data.forEach(item => {
      const year = item.year;
      
      if (!yearlyStats[year]) {
        yearlyStats[year] = {
          total: 0,
          characters: new Set(),
          items: []
        };
      }
      
      yearlyStats[year].total += 1;
      yearlyStats[year].characters.add(item.character_name);
      yearlyStats[year].items.push({
        character: item.character_name,
        boss: item.boss_name,
        item: item.item_name,
        image: item.item_image,
        date: item.obtained_date
      });
    });
    
    // Convert Sets to Arrays for easier handling in the frontend
    Object.keys(yearlyStats).forEach(year => {
      yearlyStats[year].characters = Array.from(yearlyStats[year].characters);
    });
    
    return { success: true, data: yearlyStats };
  } catch (error) {
    console.error('Error fetching yearly pitched stats:', error);
    return { success: false, error, data: {} };
  }
}

// Helper function to get current week key (YYYY-WW)
function getCurrentWeekKey() {
  const now = new Date();
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const onejan = new Date(utcNow.getUTCFullYear(), 0, 1);
  const week = Math.ceil((((utcNow - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
  return `${utcNow.getUTCFullYear()}-${week}`;
}

// Helper function to get current month key (YYYY-MM)
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Function to delete pitched items for a user (used when deleting account)
export async function deletePitchedItems(userCode) {
  try {
    const { error } = await supabase
      .from('pitched_items')
      .delete()
      .eq('user_id', userCode);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting pitched items:', error);
    return { success: false, error };
  }
}
