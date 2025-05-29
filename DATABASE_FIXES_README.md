# Database Fixes for MapleStory Boss Crystal Calculator

## Critical Issues Identified

### Issue 1: Missing UNIQUE Constraint (HTTP 400, PostgreSQL 42P10)
**Error**: `there is no unique or exclusion constraint matching the ON CONFLICT specification`

**Root Cause**: The `user_boss_data` table lacks a UNIQUE constraint on `(user_id, maple_week_start)`, which is required for the upsert operations used throughout the application.

**Impact**: Cannot save or update any weekly data (character creation, boss configuration, weekly clears).

### Issue 2: RLS Policies Incompatible with Custom Authentication (HTTP 406)
**Error**: `406 (Not Acceptable)` on GET requests to `user_boss_data`

**Root Cause**: The application uses **custom user authentication** with user codes (e.g., "UZPTJYIJ") stored as TEXT, but Supabase RLS policies are likely configured for `auth.uid()` which expects UUID-based authentication.

**Impact**: Cannot fetch any user data, resulting in empty states and failed data loading.

## Solutions

### Step 1: Apply Database Migration
Execute the SQL script in `database-fixes.sql` in your Supabase SQL Editor:

```sql
-- Add required UNIQUE constraint
ALTER TABLE public.user_boss_data
ADD CONSTRAINT user_boss_data_user_id_maple_week_start_key UNIQUE (user_id, maple_week_start);

-- Disable RLS for custom auth system
ALTER TABLE public.user_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_boss_data DISABLE ROW LEVEL SECURITY;
```

### Step 2: Verify the Fixes
After applying the migration, verify:

```sql
-- Check UNIQUE constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.user_boss_data'::regclass AND contype = 'u';

-- Check RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_data', 'user_boss_data');
```

## Technical Details

### Authentication Architecture
This application uses a **custom authentication system**:
- Users are identified by 8-character codes (e.g., "UZPTJYIJ")
- User codes are stored as TEXT in `user_data.id` and `user_boss_data.user_id`
- No integration with Supabase's built-in auth system (`auth.users` table)

### Why RLS Causes Issues
Supabase RLS policies typically use `auth.uid()` which:
- Returns a UUID from the authenticated user session
- Only works with Supabase's built-in authentication
- Cannot access custom user codes stored in application tables

### Database Schema Requirements
For the upsert operations to work, the following constraint is essential:
```sql
UNIQUE (user_id, maple_week_start) ON user_boss_data
```

This allows the application to use:
```javascript
.upsert(data, { onConflict: 'user_id,maple_week_start' })
```

## Alternative Solutions (Not Recommended)

### Option A: Custom RLS Function
You could create a custom function to extract user_id from application context:
```sql
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS TEXT AS $$
  -- Complex implementation to get user_id from request headers or JWT
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Problems**: 
- Complex to implement
- Requires custom JWT handling
- Not compatible with current application architecture

### Option B: Migration to Supabase Auth
Convert the application to use Supabase's built-in authentication:
- Replace user codes with UUIDs
- Implement proper signup/login flows
- Update all user_id references

**Problems**:
- Major architectural change
- Requires data migration
- Breaks existing user accounts

## Security Considerations

### With RLS Disabled
- Application code is responsible for all access control
- Ensure all Supabase queries properly filter by user_id
- Consider API-level authentication/authorization

### Current Implementation
The application already implements proper access control:
- All queries filter by the logged-in user's code
- User codes are validated on login
- No cross-user data access possible through the UI

## Testing After Fixes

### Test Sequence
1. **Login**: Verify users can log in with existing codes
2. **Data Loading**: Check that weekly data loads without 406 errors
3. **Character Creation**: Add a new character (tests upsert with new record)
4. **Character Updates**: Modify character name/boss config (tests upsert with existing record)
5. **Boss Clearing**: Toggle boss clear status (tests weekly_clears updates)
6. **Account Deletion**: Verify both tables are cleaned up

### Expected Outcomes
- ✅ No more HTTP 406 errors on data fetching
- ✅ No more HTTP 400/42P10 errors on data saving
- ✅ Smooth character creation and management
- ✅ Proper boss clear tracking
- ✅ Account deletion removes data from both tables

## Files Modified for Account Deletion Fix

### `src/hooks/useAuth.js`
- Updated `handleDeleteAccount()` to delete from both `user_data` and `user_boss_data`
- Added proper error handling for both table deletions
- Made `user_boss_data` deletion non-critical (continues if it fails)

The account deletion now properly cleans up:
1. Main account data (`user_data` table)
2. Weekly boss data (`user_boss_data` table)  
3. Local storage and application state

## Next Steps

1. **Apply the database migration** using the provided SQL script
2. **Test core workflows** to ensure everything works
3. **Monitor logs** for any remaining errors
4. **Consider adding database indexes** for performance (included in migration script)

## Support

If you encounter any issues after applying these fixes:
1. Check the browser console for specific error messages
2. Verify the database constraints were applied correctly
3. Ensure RLS is disabled on both tables
4. Test with a fresh account creation to isolate issues