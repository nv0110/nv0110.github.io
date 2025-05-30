# SQL Commands to Run in Supabase SQL Editor

Copy and paste these commands one by one:

## 1. Add UNIQUE constraint on user_boss_data table:
```sql
ALTER TABLE user_boss_data 
ADD CONSTRAINT user_boss_data_unique_week UNIQUE (user_id, maple_week_start);
```

## 2. Fix RLS policies for user_boss_data table:
```sql
DROP POLICY IF EXISTS "user_boss_data_policy" ON user_boss_data;
```

```sql
CREATE POLICY "user_boss_data_policy" ON user_boss_data
  FOR ALL USING (auth.uid()::text = user_id);
```

## 3. Ensure RLS is enabled:
```sql
ALTER TABLE user_boss_data ENABLE ROW LEVEL SECURITY;
```

Run each command separately in the Supabase SQL Editor.