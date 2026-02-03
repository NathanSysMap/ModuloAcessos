-- Script para criar usuário administrador
-- INSTRUÇÕES:
-- 1. Altere o email e senha abaixo
-- 2. Execute este script no SQL Editor do Supabase
-- 3. Faça login com as credenciais criadas

DO $$
DECLARE
  user_id uuid := gen_random_uuid();
  user_email text := 'admin@example.com';  -- ALTERE AQUI
  user_password text := 'admin123';        -- ALTERE AQUI
  user_name text := 'Administrador';       -- ALTERE AQUI
  user_cpf text := '00000000000';          -- ALTERE AQUI
BEGIN
  -- Criar usuário de autenticação
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false
  );

  -- Criar identidade (OBRIGATÓRIO para login funcionar)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    user_id::text,
    format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', user_id::text, user_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  );

  -- Criar dados do usuário
  INSERT INTO users (id, nome, cpf, cargo, email, foto_url) VALUES
    (user_id, user_name, user_cpf, 'Administrador', user_email, null);

  -- Vincular perfil de Administrador
  INSERT INTO user_profiles (user_id, profile_id) VALUES
    (user_id, '11111111-1111-1111-1111-111111111111');

  -- Mensagem de sucesso
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Usuário criado com sucesso!';
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'Senha: %', user_password;
  RAISE NOTICE 'Perfil: Administrador';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Agora você pode fazer login na aplicação!';
END $$;
