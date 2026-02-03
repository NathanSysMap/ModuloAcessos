/*
  # Update RPC function to include cargo field
  
  ## Summary
  Updates the create_user_with_profile function to include the cargo (position/role) field
  
  ## Changes
  - Adds p_cargo parameter to the function signature
  - Includes cargo in the users table insert
  - Updates validation to require cargo field
*/

-- Drop and recreate the function with cargo field
DROP FUNCTION IF EXISTS create_user_with_profile;

CREATE OR REPLACE FUNCTION create_user_with_profile(
  p_nome TEXT,
  p_email TEXT,
  p_password TEXT,
  p_cpf TEXT,
  p_cargo TEXT,
  p_profile_id UUID,
  p_rua TEXT DEFAULT NULL,
  p_numero TEXT DEFAULT NULL,
  p_complemento TEXT DEFAULT NULL,
  p_bairro TEXT DEFAULT NULL,
  p_cidade TEXT DEFAULT NULL,
  p_estado TEXT DEFAULT NULL,
  p_cep TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_celular TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_is_super_admin BOOLEAN;
  v_new_user_id UUID;
  v_result JSON;
BEGIN
  -- Get the caller's ID
  v_caller_id := auth.uid();
  
  -- Check if caller exists and is super admin
  IF v_caller_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Check if caller is super admin
  SELECT is_user_super_admin(v_caller_id) INTO v_is_super_admin;
  
  IF NOT v_is_super_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permission denied. Only super admins can create users.'
    );
  END IF;
  
  -- Validate required fields
  IF p_nome IS NULL OR p_nome = '' THEN
    RETURN json_build_object('success', false, 'error', 'Nome is required');
  END IF;
  
  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Email is required');
  END IF;
  
  IF p_password IS NULL OR p_password = '' THEN
    RETURN json_build_object('success', false, 'error', 'Password is required');
  END IF;
  
  IF p_cpf IS NULL OR p_cpf = '' THEN
    RETURN json_build_object('success', false, 'error', 'CPF is required');
  END IF;
  
  IF p_cargo IS NULL OR p_cargo = '' THEN
    RETURN json_build_object('success', false, 'error', 'Cargo is required');
  END IF;
  
  IF p_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile is required');
  END IF;
  
  -- Check if email already exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email already exists'
    );
  END IF;
  
  -- Check if CPF already exists
  IF EXISTS (SELECT 1 FROM users WHERE cpf = p_cpf) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CPF already exists'
    );
  END IF;
  
  -- Create user in auth.users using the admin API
  BEGIN
    -- Generate a new UUID for the user
    v_new_user_id := gen_random_uuid();
    
    -- Insert into auth.users (this requires admin privileges via SECURITY DEFINER)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      v_new_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create auth user: ' || SQLERRM
    );
  END;
  
  -- Insert into users table
  BEGIN
    INSERT INTO users (id, nome, email, cpf, cargo, ativo, created_at)
    VALUES (v_new_user_id, p_nome, p_email, p_cpf, p_cargo, true, now());
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create user record: ' || SQLERRM
    );
  END;
  
  -- Insert into user_profiles
  BEGIN
    INSERT INTO user_profiles (user_id, profile_id, created_at)
    VALUES (v_new_user_id, p_profile_id, now());
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to assign profile: ' || SQLERRM
    );
  END;
  
  -- Insert address if provided
  IF p_rua IS NOT NULL THEN
    BEGIN
      INSERT INTO user_addresses (
        user_id, rua, numero, complemento, bairro, cidade, estado, cep, created_at
      ) VALUES (
        v_new_user_id, p_rua, p_numero, p_complemento, p_bairro, p_cidade, p_estado, p_cep, now()
      );
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Failed to create address: ' || SQLERRM
      );
    END;
  END IF;
  
  -- Insert contacts if provided
  IF p_telefone IS NOT NULL OR p_celular IS NOT NULL THEN
    BEGIN
      INSERT INTO user_contacts (user_id, telefone, celular, created_at)
      VALUES (v_new_user_id, p_telefone, p_celular, now());
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Failed to create contacts: ' || SQLERRM
      );
    END;
  END IF;
  
  -- Return success with user data
  RETURN json_build_object(
    'success', true,
    'user_id', v_new_user_id,
    'message', 'User created successfully'
  );
  
END;
$$;