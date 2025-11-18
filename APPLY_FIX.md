# Fix for User Profile Creation Error

## Problem
The application was throwing RLS (Row Level Security) policy violations when trying to create user profiles:
```
"new row violates row-level security policy for table \"users\""
```

## Solution
Created a database trigger that automatically creates user profiles when a new user signs up through Supabase Auth.

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're logged in to Supabase
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open and run the file: `supabase/migrations/20250116000000_fix_user_creation.sql`

### Option 3: Manual SQL Execution
Copy and paste the contents of `supabase/migrations/20250116000000_fix_user_creation.sql` into your Supabase SQL editor and execute it.

## What Changed

### 1. Database Trigger
- Added a `handle_new_user()` function that automatically creates user profiles
- Trigger executes on `auth.users` INSERT events
- Uses `SECURITY DEFINER` to bypass RLS policies during automatic creation

### 2. Code Simplification
- Removed manual profile creation logic from `signIn()` function
- Simplified `getUser()` to rely on the trigger with retry logic
- Reduced potential race conditions and RLS conflicts

## Testing the Fix

After applying the migration:

1. **Test New User Registration**:
   - Sign up with a new email
   - Verify the profile is created automatically
   - Check that no errors appear in the console

2. **Test Existing User Login**:
   - Sign in with an existing account
   - Verify profile loads correctly
   - Ensure no RLS errors

3. **Verify in Database**:
   ```sql
   SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;
   ```

## Rollback (if needed)

If you need to rollback this change:

```sql
-- Drop the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

Then restore the previous version of `lib/auth/actions.ts` from git history.
