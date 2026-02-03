/*
  # Fix RPC function - Remove non-existent 'ativo' column
  
  ## Summary
  Updates the create_user_with_profile function to match the actual users table schema
  
  ## Changes
  - Removes reference to non-existent 'ativo' column
  - Aligns INSERT statement with actual table structure (id, nome, email, cpf, cargo, foto_url, created_at)
*/

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
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id UUID;
  v_is_super_admin BOOLEAN;
  v_new_user_id UUID;
  v_result JSON;
BEGIN
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  SELECT is_user_super_admin(v_caller_id) INTO v_is_super_admin;
  
  IF NOT v_is_super_admin THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permission denied. Only super admins can create users.'
    );
  END IF;
  
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
  
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email already exists'
    );
  END IF;
  
  IF EXISTS (SELECT 1 FROM users WHERE cpf = p_cpf) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CPF already exists'
    );
  END IF;
  
  BEGIN
    v_new_user_id := gen_random_uuid();
    
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
  
  BEGIN
    INSERT INTO users (id, nome, email, cpf, cargo, created_at)
    VALUES (v_new_user_id, p_nome, p_email, p_cpf, p_cargo, now());
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create user record: ' || SQLERRM
    );
  END;
  
  BEGIN
    INSERT INTO user_profiles (user_id, profile_id, created_at)
    VALUES (v_new_user_id, p_profile_id, now());
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to assign profile: ' || SQLERRM
    );
  END;
  
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
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_new_user_id,
    'message', 'User created successfully'
  );
  
END;
$$;