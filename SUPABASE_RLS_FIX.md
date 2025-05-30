# Fix RLS Policy for INSERT Operations

The current RLS policy blocks INSERT operations. Run these commands in Supabase SQL Editor:

## 1. Drop the current policy:
```sql
DROP POLICY IF EXISTS "user_boss_data_policy" ON user_boss_data;
```

## 2. Create separate policies for different operations:

### Allow SELECT (reading own data):
```sql
CREATE POLICY "user_boss_data_select" ON user_boss_data
  FOR SELECT USING (auth.uid()::text = user_id);
```

### Allow INSERT (creating own data):
```sql
CREATE POLICY "user_boss_data_insert" ON user_boss_data
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

### Allow UPDATE (updating own data):
```sql
CREATE POLICY "user_boss_data_update" ON user_boss_data
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

### Allow DELETE (deleting own data):
```sql
CREATE POLICY "user_boss_data_delete" ON user_boss_data
  FOR DELETE USING (auth.uid()::text = user_id);
```

## 3. Ensure RLS is enabled:
```sql
ALTER TABLE user_boss_data ENABLE ROW LEVEL SECURITY;
```

## 4. Fix user_data table RLS (for pitched items security):

### Enable RLS on user_data:
```sql
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
```

### Create RLS policies for user_data:
```sql
CREATE POLICY "user_data_select" ON user_data
  FOR SELECT USING (auth.uid()::text = user_id);
```

```sql
CREATE POLICY "user_data_insert" ON user_data
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

```sql
CREATE POLICY "user_data_update" ON user_data
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

```sql
CREATE POLICY "user_data_delete" ON user_data
  FOR DELETE USING (auth.uid()::text = user_id);
```

Run these commands one by one in Supabase SQL Editor.

**Important**: user_data table MUST have RLS enabled since it stores pitched items and user preferences!