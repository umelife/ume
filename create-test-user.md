# Create Test User for Stripe Testing

## Option A: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard
2. Select your RECLAIM project
3. Click "Authentication" in sidebar
4. Click "Add user" → "Create new user"
5. Fill in:
   - Email: `buyer@test.com`
   - Password: `TestPass123!`
   - Confirm password: `TestPass123!`
6. Click "Create user"

7. Then add to users table:
   - Go to "Table Editor" → "users"
   - Click "Insert" → "Insert row"
   - Fill in:
     - `id`: Copy the user ID from Authentication page
     - `email`: `buyer@test.com`
     - `display_name`: `Test Buyer`
     - `university_domain`: `test.com`
     - `created_at`: (auto-filled)
   - Click "Save"

## Option B: Via SQL (Quick)

Run this in Supabase SQL Editor:

```sql
-- Insert test user into users table
-- First, create the auth user in Authentication UI, then run this:
INSERT INTO public.users (id, email, display_name, university_domain)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',  -- Get from Authentication > Users
  'buyer@test.com',
  'Test Buyer',
  'test.com'
);
```

## Test Credentials

**Email:** `buyer@test.com`
**Password:** `TestPass123!`

Use these to login and test Stripe payments!
