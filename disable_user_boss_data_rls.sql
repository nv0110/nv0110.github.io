-- ========================================
-- DISABLE RLS ON user_boss_data TABLE
-- Cleanest Solution for Custom Authentication
-- ========================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "user_boss_data_select" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_insert" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_update" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_delete" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_all" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_allow_all" ON user_boss_data;

-- Disable RLS completely on user_boss_data
ALTER TABLE user_boss_data DISABLE ROW LEVEL SECURITY;

-- Verification: Confirm RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled (should be false)"
FROM pg_tables 
WHERE tablename = 'user_boss_data';

-- Check that no policies remain
SELECT 
    policyname as "Policy Name (should be empty)",
    cmd as "Command"
FROM pg_policies 
WHERE tablename = 'user_boss_data';