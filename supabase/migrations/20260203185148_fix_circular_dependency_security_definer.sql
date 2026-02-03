/*
  # Fix Circular Dependency in RLS with SECURITY DEFINER

  1. Problem
    - Function `is_user_super_admin()` queries `user_profiles` table
    - RLS policies on `user_profiles` call `is_user_super_admin()`
    - This creates a circular dependency causing "Database error querying schema"
    - Regular users cannot login because the function fails

  2. Solution
    - Recreate `is_user_super_admin()` with SECURITY DEFINER
    - This makes the function execute with owner privileges
    - RLS is bypassed within the function, breaking the circular dependency

  3. Security Notes
    - Function only reads data, does not modify anything
    - Logic remains the same, only execution context changes
    - This is a standard pattern for helper functions used in RLS policies
*/

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_user_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN profiles p ON up.profile_id = p.id
    WHERE up.user_id = check_user_id AND p.is_super_admin = true
  );
END;
$$;