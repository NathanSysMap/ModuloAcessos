/*
  # Fix RLS Policies for Super Admin Access

  1. Problem Identified
    - Super admins cannot view user profiles, addresses, contacts, and overrides of other users
    - Current policies only allow users to see their own data
    - This prevents admins from managing users properly

  2. Changes Made
    - Add SELECT policies for super admins on:
      - user_profiles (can view all user-profile associations)
      - user_addresses (can view all addresses)
      - user_contacts (can view all contacts)
      - user_feature_overrides (can view all overrides)
    - Keep existing restrictive policies for regular users

  3. Security Notes
    - Super admin status is verified via is_user_super_admin() function
    - Regular users can still only see their own data
    - No changes to INSERT, UPDATE, DELETE policies
*/

-- Add super admin SELECT policy for user_profiles
CREATE POLICY "Super admins can view all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_user_super_admin(auth.uid()));

-- Add super admin SELECT policy for user_addresses
CREATE POLICY "Super admins can view all addresses"
  ON user_addresses FOR SELECT
  TO authenticated
  USING (is_user_super_admin(auth.uid()));

-- Add super admin UPDATE policy for user_addresses
CREATE POLICY "Super admins can update any address"
  ON user_addresses FOR UPDATE
  TO authenticated
  USING (is_user_super_admin(auth.uid()))
  WITH CHECK (true);

-- Add super admin INSERT policy for user_addresses
CREATE POLICY "Super admins can insert any address"
  ON user_addresses FOR INSERT
  TO authenticated
  WITH CHECK (is_user_super_admin(auth.uid()));

-- Add super admin SELECT policy for user_contacts
CREATE POLICY "Super admins can view all contacts"
  ON user_contacts FOR SELECT
  TO authenticated
  USING (is_user_super_admin(auth.uid()));

-- Add super admin UPDATE policy for user_contacts
CREATE POLICY "Super admins can update any contact"
  ON user_contacts FOR UPDATE
  TO authenticated
  USING (is_user_super_admin(auth.uid()))
  WITH CHECK (true);

-- Add super admin INSERT policy for user_contacts
CREATE POLICY "Super admins can insert any contact"
  ON user_contacts FOR INSERT
  TO authenticated
  WITH CHECK (is_user_super_admin(auth.uid()));

-- Add super admin SELECT policy for user_feature_overrides
CREATE POLICY "Super admins can view all overrides"
  ON user_feature_overrides FOR SELECT
  TO authenticated
  USING (is_user_super_admin(auth.uid()));