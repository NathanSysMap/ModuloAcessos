/*
  # Remove Circular Dependency Policy from user_profiles

  1. Problem
    - Policy "Super admins can view all user profiles" uses `is_user_super_admin()`
    - Function `is_user_super_admin()` queries `user_profiles` table
    - Even with SECURITY DEFINER, RLS policies are still checked
    - This creates an infinite loop causing login failures

  2. Solution
    - Remove the problematic policy from user_profiles
    - Keep only "Users can view own profiles" policy
    - Super admin access will be handled at application level
    - Other tables (users, features, etc.) can still use the function safely

  3. Impact
    - Regular users: Can view only their own user_profiles (unchanged)
    - Super admins: Application code will handle elevated access
    - Fixes "Database error querying schema" on login
*/

-- Remove the circular dependency policy
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON user_profiles;