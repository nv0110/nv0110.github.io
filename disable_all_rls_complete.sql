-- ========================================
-- DISABLE RLS ON ALL TABLES - COMPLETE FIX
-- ========================================

-- Drop all existing policies from user_boss_data
DROP POLICY IF EXISTS "user_boss_data_select" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_insert" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_update" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_delete" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_all" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_allow_all" ON user_boss_data;

-- Drop all existing policies from user_data
DROP POLICY IF EXISTS "user_data_select" ON user_data;
DROP POLICY IF EXISTS "user_data_insert" ON user_data;
DROP POLICY IF EXISTS "user_data_update" ON user_data;
DROP POLICY IF EXISTS "user_data_delete" ON user_data;
DROP POLICY IF EXISTS "user_data_all" ON user_data;
DROP POLICY IF EXISTS "user_data_allow_all" ON user_data;

-- Disable RLS completely on both tables
ALTER TABLE user_boss_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_data DISABLE ROW LEVEL SECURITY;

-- Also check boss_registry (might need RLS disabled too)
DROP POLICY IF EXISTS "boss_registry_select" ON boss_registry;
DROP POLICY IF EXISTS "boss_registry_insert" ON boss_registry;
DROP POLICY IF EXISTS "boss_registry_update" ON boss_registry;
DROP POLICY IF EXISTS "boss_registry_delete" ON boss_registry;
DROP POLICY IF EXISTS "boss_registry_all" ON boss_registry;
ALTER TABLE boss_registry DISABLE ROW LEVEL SECURITY;

-- Verification: Check RLS status on all tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled (should be false)"
FROM pg_tables 
WHERE tablename IN ('user_boss_data', 'user_data', 'boss_registry')
ORDER BY tablename;

-- Check that no policies remain on any table
SELECT 
    tablename,
    policyname as "Policy Name (should be empty)",
    cmd as "Command"
FROM pg_policies 
WHERE tablename IN ('user_boss_data', 'user_data', 'boss_registry')
ORDER BY tablename, policyname;

-- Check table permissions (should show all tables are accessible)
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('user_boss_data', 'user_data', 'boss_registry')
AND grantee = 'anon'
ORDER BY table_name, privilege_type;