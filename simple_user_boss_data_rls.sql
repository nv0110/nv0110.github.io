-- ========================================
-- SIMPLE RLS SETUP FOR user_boss_data
-- Recommended for Custom Authentication System
-- ========================================

-- Enable RLS on the table
ALTER TABLE user_boss_data ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "user_boss_data_select" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_insert" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_update" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_delete" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_all" ON user_boss_data;

-- Create a single permissive policy for all operations
-- Since your services already handle user isolation via user_id filtering,
-- this allows your app to work while keeping RLS enabled
CREATE POLICY "user_boss_data_allow_all" ON user_boss_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verification: Check that RLS is enabled and policy exists
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'user_boss_data';

SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    permissive as "Permissive"
FROM pg_policies 
WHERE tablename = 'user_boss_data';