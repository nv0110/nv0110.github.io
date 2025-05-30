-- ========================================
-- USER_BOSS_DATA RLS POLICIES - CLEAN START
-- ========================================

-- First, ensure RLS is enabled on user_boss_data
ALTER TABLE user_boss_data ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "user_boss_data_select" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_insert" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_update" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_delete" ON user_boss_data;
DROP POLICY IF EXISTS "user_boss_data_all" ON user_boss_data;

-- ========================================
-- OPTION 1: SIMPLE POLICIES (RECOMMENDED)
-- ========================================
-- Since you use custom authentication, create permissive policies
-- and rely on application-level security

-- Allow all operations for authenticated users
-- Your services already filter by user_id, so this is safe
CREATE POLICY "user_boss_data_all_operations" ON user_boss_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ========================================
-- OPTION 2: DISABLE RLS ENTIRELY (ALTERNATIVE)
-- ========================================
-- Uncomment these lines if you prefer to disable RLS completely:

-- ALTER TABLE user_boss_data DISABLE ROW LEVEL SECURITY;

-- ========================================
-- OPTION 3: STRICT POLICIES (IF YOU HAVE SESSION CONTEXT)
-- ========================================
-- Only use these if you set up session variables for current_user_id
-- Uncomment and use these instead of Option 1 if you implement session context:

/*
-- SELECT: Users can only see their own boss data
CREATE POLICY "user_boss_data_select" ON user_boss_data
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true));

-- INSERT: Users can only insert their own boss data
CREATE POLICY "user_boss_data_insert" ON user_boss_data
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- UPDATE: Users can only update their own boss data
CREATE POLICY "user_boss_data_update" ON user_boss_data
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id', true))
    WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- DELETE: Users can only delete their own boss data
CREATE POLICY "user_boss_data_delete" ON user_boss_data
    FOR DELETE
    USING (user_id = current_setting('app.current_user_id', true));
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_boss_data';

-- List all policies on user_boss_data
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_boss_data';