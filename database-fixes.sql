-- Database Migration Script for MapleStory Boss Calculator
-- Fixes for RLS and UNIQUE constraint issues

-- =====================================================
-- STEP 1: Add missing UNIQUE constraint for upsert operations
-- =====================================================

-- Add UNIQUE constraint on user_boss_data for (user_id, maple_week_start)
-- This is required for the ON CONFLICT clause in upsert operations
ALTER TABLE public.user_boss_data
ADD CONSTRAINT user_boss_data_user_id_maple_week_start_key UNIQUE (user_id, maple_week_start);

-- =====================================================
-- STEP 2: Fix RLS policies for custom authentication system
-- =====================================================

-- The application uses custom user codes (TEXT) instead of Supabase's auth.uid() (UUID)
-- We need to disable RLS or create policies that work with the custom auth system

-- Option A: Disable RLS entirely (RECOMMENDED for custom auth)
-- This is the simplest solution since the app handles its own authentication
ALTER TABLE public.user_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_boss_data DISABLE ROW LEVEL SECURITY;

-- Option B: If you prefer to keep RLS enabled, you would need to:
-- 1. Create a custom function to get the current user from your session/context
-- 2. Update policies to use that function instead of auth.uid()
-- However, this is complex and not recommended for this custom auth system

-- =====================================================
-- STEP 3: Verify table structure and constraints
-- =====================================================

-- Verify the UNIQUE constraint was added
SELECT conname, contype, confkey 
FROM pg_constraint 
WHERE conrelid = 'public.user_boss_data'::regclass 
AND contype = 'u';

-- Verify RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_data', 'user_boss_data');

-- =====================================================
-- STEP 4: Optional - Add indexes for performance
-- =====================================================

-- Add index on user_id for faster queries (if not already exists)
CREATE INDEX IF NOT EXISTS idx_user_boss_data_user_id ON public.user_boss_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_boss_data_maple_week_start ON public.user_boss_data(maple_week_start);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test that the constraint works by checking for conflicts
-- This should show the constraint name if it exists
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_boss_data' 
    AND tc.constraint_type = 'UNIQUE';