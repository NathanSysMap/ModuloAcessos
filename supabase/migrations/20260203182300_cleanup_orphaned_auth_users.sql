/*
  # Clean up orphaned auth users
  
  ## Summary
  Removes users from auth.users that don't have a corresponding entry in the users table.
  These are incomplete user creations that failed during the RLS policy issues.
  
  ## Changes
  - Deletes orphaned users from auth.users where id not in users table
  - Keeps only the admin user and users that have complete records
  
  ## Important Notes
  - This is a one-time cleanup operation
  - Only removes users that failed to be created properly
  - The admin user (admin@example.com) is preserved
*/

-- Delete orphaned users from auth.users that don't exist in the users table
DELETE FROM auth.users
WHERE id NOT IN (
  SELECT id FROM users
);