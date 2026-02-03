/*
  # Fix ambiguous user_id reference in is_user_super_admin function

  The is_user_super_admin function has an ambiguous reference to user_id.
  This migration fixes it by properly qualifying the column references.
*/

DO $$
BEGIN
  DROP FUNCTION IF EXISTS is_user_super_admin(uuid) CASCADE;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION is_user_super_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN profiles p ON up.profile_id = p.id
    WHERE up.user_id = check_user_id AND p.is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

DO $$
BEGIN
  CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can update any user"
    ON users FOR UPDATE
    TO authenticated
    USING (is_user_super_admin(auth.uid()))
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can create users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can delete users"
    ON users FOR DELETE
    TO authenticated
    USING (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can view profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can create profiles"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can update profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (is_user_super_admin(auth.uid()))
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can delete profiles"
    ON profiles FOR DELETE
    TO authenticated
    USING (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can view features"
    ON features FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can manage features"
    ON features FOR INSERT
    TO authenticated
    WITH CHECK (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can update features"
    ON features FOR UPDATE
    TO authenticated
    USING (is_user_super_admin(auth.uid()))
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can delete features"
    ON features FOR DELETE
    TO authenticated
    USING (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can view profile features"
    ON profile_features FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can manage profile features"
    ON profile_features FOR INSERT
    TO authenticated
    WITH CHECK (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can update profile features"
    ON profile_features FOR UPDATE
    TO authenticated
    USING (is_user_super_admin(auth.uid()))
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Super admins can delete profile features"
    ON profile_features FOR DELETE
    TO authenticated
    USING (is_user_super_admin(auth.uid()));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
