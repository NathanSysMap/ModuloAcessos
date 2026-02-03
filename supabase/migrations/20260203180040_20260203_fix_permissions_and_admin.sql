/*
  # Fix Permissions System and Admin Access

  1. Add super_admin flag to profiles
    - New column: is_super_admin (boolean, default false)
    - Admin users will have automatic access to all features

  2. Fix RLS Policies for Users table
    - Add INSERT policy to allow admins to create users
    - Add DELETE policy for admins
    - Modify SELECT and UPDATE policies to allow admins to manage all users
    - Keep restrictive policies for regular users

  3. Seed admin profile as super_admin
    - Mark existing "Administrador" profile as super admin
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Update existing Administrador profile to be super admin
UPDATE profiles 
SET is_super_admin = true 
WHERE titulo = 'Administrador';

-- Drop existing restrictive policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_user_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN profiles p ON up.profile_id = p.id
    WHERE up.user_id = user_id AND p.is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- New RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_user_super_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (is_user_super_admin(auth.uid()))
  WITH CHECK (true);

CREATE POLICY "Super admins can create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_user_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (is_user_super_admin(auth.uid()));

-- Drop overly permissive policies on profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can delete profiles" ON profiles;

-- Create stricter policies for profiles
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can create profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_user_super_admin(auth.uid()));

CREATE POLICY "Super admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_user_super_admin(auth.uid()))
  WITH CHECK (true);

CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_user_super_admin(auth.uid()));

-- Keep permissive policies for features (admin controls access via role-based system)
-- but ensure super admins can manage them
DROP POLICY IF EXISTS "Authenticated users can view features" ON features;
DROP POLICY IF EXISTS "Authenticated users can manage features" ON features;
DROP POLICY IF EXISTS "Authenticated users can update features" ON features;
DROP POLICY IF EXISTS "Authenticated users can delete features" ON features;

CREATE POLICY "Users can view features"
  ON features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage features"
  ON features FOR INSERT
  TO authenticated
  WITH CHECK (is_user_super_admin(auth.uid()));

CREATE POLICY "Super admins can update features"
  ON features FOR UPDATE
  TO authenticated
  USING (is_user_super_admin(auth.uid()))
  WITH CHECK (true);

CREATE POLICY "Super admins can delete features"
  ON features FOR DELETE
  TO authenticated
  USING (is_user_super_admin(auth.uid()));

-- Keep profile_features accessible for reading all, but restrict writes to admins
DROP POLICY IF EXISTS "Authenticated users can view profile features" ON profile_features;
DROP POLICY IF EXISTS "Authenticated users can manage profile features" ON profile_features;
DROP POLICY IF EXISTS "Authenticated users can update profile features" ON profile_features;
DROP POLICY IF EXISTS "Authenticated users can delete profile features" ON profile_features;

CREATE POLICY "Users can view profile features"
  ON profile_features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage profile features"
  ON profile_features FOR INSERT
  TO authenticated
  WITH CHECK (is_user_super_admin(auth.uid()));

CREATE POLICY "Super admins can update profile features"
  ON profile_features FOR UPDATE
  TO authenticated
  USING (is_user_super_admin(auth.uid()))
  WITH CHECK (true);

CREATE POLICY "Super admins can delete profile features"
  ON profile_features FOR DELETE
  TO authenticated
  USING (is_user_super_admin(auth.uid()));
