/*
  # Fix Circular Dependency in RLS and Super Admin Visibility

  ## Problem Summary
  1. Circular dependency: users RLS -> is_user_super_admin() -> user_profiles RLS
  2. Super admins cannot view other users' profiles due to restrictive RLS policies

  ## Solution Overview
  Add a cached `is_super_admin` column to the users table to eliminate circular dependency
  and optimize permission checks. Automatic triggers keep the cache synchronized.

  ## Changes Made

  ### 1. Schema Changes
  - Add `is_super_admin` column to `public.users` table (boolean, default false)
  - This serves as a performance cache to avoid cascading queries

  ### 2. Function Updates
  - Rewrite `is_user_super_admin()` to query only `users.is_super_admin`
  - Create `sync_user_super_admin_status()` to maintain cache consistency
  - Eliminates JOIN operations that trigger nested RLS policies

  ### 3. Triggers
  - Auto-sync trigger on `user_profiles` (INSERT, UPDATE, DELETE)
  - Auto-sync trigger on `profiles` (UPDATE of is_super_admin column)
  - Ensures cache remains accurate when profile assignments change

  ### 4. RLS Policies
  - Add "Super admins can view all user profiles" policy to user_profiles table
  - Allows super admins to see profile assignments when editing other users

  ### 5. Data Migration
  - Populate `is_super_admin` for existing users based on current profile assignments

  ## Benefits
  - Eliminates circular dependency and potential race conditions
  - Significantly improves performance (no JOINs in RLS checks)
  - Automatically synchronized via triggers
  - Super admins can now view and edit all user profiles
*/

-- =====================================================
-- 1. Add is_super_admin column to users table
-- =====================================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_super_admin 
ON public.users(is_super_admin) 
WHERE is_super_admin = true;

-- =====================================================
-- 2. Rewrite is_user_super_admin function (optimized)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_user_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple cache lookup - no JOINs, no circular dependency
  RETURN (
    SELECT is_super_admin 
    FROM users 
    WHERE id = check_user_id
  ) = true;
END;
$$;

-- =====================================================
-- 3. Create sync function to maintain cache
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_user_super_admin_status(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_super_admin boolean;
BEGIN
  -- Check if user has any profile with is_super_admin = true
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles up
    JOIN profiles p ON up.profile_id = p.id
    WHERE up.user_id = target_user_id 
      AND p.is_super_admin = true
  ) INTO has_super_admin;
  
  -- Update the cache column
  UPDATE users 
  SET is_super_admin = has_super_admin
  WHERE id = target_user_id;
END;
$$;

-- =====================================================
-- 4. Create triggers for automatic synchronization
-- =====================================================

-- Trigger function for user_profiles changes
CREATE OR REPLACE FUNCTION public.trigger_sync_user_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Sync for affected user(s)
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_user_super_admin_status(OLD.user_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM sync_user_super_admin_status(NEW.user_id);
  ELSIF TG_OP = 'UPDATE' THEN
    -- If user_id or profile_id changed, sync both old and new users
    IF OLD.user_id != NEW.user_id THEN
      PERFORM sync_user_super_admin_status(OLD.user_id);
      PERFORM sync_user_super_admin_status(NEW.user_id);
    ELSE
      PERFORM sync_user_super_admin_status(NEW.user_id);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to user_profiles table
DROP TRIGGER IF EXISTS sync_user_super_admin_on_user_profiles ON user_profiles;
CREATE TRIGGER sync_user_super_admin_on_user_profiles
AFTER INSERT OR UPDATE OR DELETE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_user_super_admin();

-- Trigger function for profiles changes (when is_super_admin changes)
CREATE OR REPLACE FUNCTION public.trigger_sync_all_users_for_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only sync if is_super_admin status changed
  IF TG_OP = 'UPDATE' AND OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
    -- Sync all users that have this profile
    PERFORM sync_user_super_admin_status(up.user_id)
    FROM user_profiles up
    WHERE up.profile_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS sync_users_when_profile_changes ON profiles;
CREATE TRIGGER sync_users_when_profile_changes
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_all_users_for_profile();

-- =====================================================
-- 5. Add RLS policy for super admins to view all user_profiles
-- =====================================================

-- Drop existing restrictive SELECT policy if it blocks admins
DROP POLICY IF EXISTS "Super admins can view all user profiles" ON user_profiles;

CREATE POLICY "Super admins can view all user profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  is_user_super_admin(auth.uid())
);

-- Also add UPDATE policy for super admins
DROP POLICY IF EXISTS "Super admins can update all user profiles" ON user_profiles;

CREATE POLICY "Super admins can update all user profiles"
ON user_profiles
FOR UPDATE
TO authenticated
USING (is_user_super_admin(auth.uid()))
WITH CHECK (is_user_super_admin(auth.uid()));

-- =====================================================
-- 6. Migrate existing data
-- =====================================================

-- Populate is_super_admin for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    PERFORM sync_user_super_admin_status(user_record.id);
  END LOOP;
  
  RAISE NOTICE 'Successfully synced is_super_admin status for all users';
END;
$$;