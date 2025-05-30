-- Database Schema Fixes for Supabase Errors
-- Run these commands in Supabase SQL Editor

-- 1. Fix UNIQUE constraint on user_boss_data table (for 42P10 error)
ALTER TABLE user_boss_data 
ADD CONSTRAINT user_boss_data_unique_week UNIQUE (user_id, maple_week_start);

-- 2. Fix RLS policies for user_boss_data table (for 406 error)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_boss_data_policy" ON user_boss_data;

-- Create proper RLS policy
CREATE POLICY "user_boss_data_policy" ON user_boss_data
  FOR ALL USING (auth.uid()::text = user_id);

-- Ensure RLS is enabled
ALTER TABLE user_boss_data ENABLE ROW LEVEL SECURITY;

-- 3. Verify user_id column type consistency
-- If user_id is TEXT and we're comparing with auth.uid() (UUID), update the policy:
-- CREATE POLICY "user_boss_data_policy" ON user_boss_data
--   FOR ALL USING (auth.uid()::text = user_id);

-- 4. Check boss_registry table structure
-- Ensure the id column contains boss codes in format: "BOSSCODE-DIFFCODE"
-- Examples: "LOT-HARD", "DAM-NORM", "CSER-HARD", etc.

-- 5. Sample boss_registry data verification query
-- Run this to see what boss codes are actually in the database:
-- SELECT id, boss_name, difficulty_name FROM boss_registry WHERE enabled = true ORDER BY id;