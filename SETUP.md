# Guia de Configuração Inicial

## Passo 1: Criar Primeiro Usuário Administrador

Para começar a usar o sistema, você precisa criar um usuário administrador. Existem duas formas:

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em "Authentication" → "Users"
3. Clique em "Add User"
4. Preencha:
   - **Email**: admin@example.com (ou seu email)
   - **Password**: sua senha segura
   - Marque "Auto Confirm User"
5. Clique em "Create User"
6. Copie o UUID do usuário criado
7. Vá em "SQL Editor" e execute:

```sql
-- Substituir 'USER_ID_AQUI' pelo UUID copiado acima
-- Substituir os dados conforme necessário

INSERT INTO users (id, nome, cpf, cargo, email) VALUES
  ('USER_ID_AQUI', 'Administrador', '00000000000', 'Administrador', 'admin@example.com');

INSERT INTO user_profiles (user_id, profile_id) VALUES
  ('USER_ID_AQUI', '11111111-1111-1111-1111-111111111111');
```

### Opção 2: Via SQL Direto (Avançado)

Execute no SQL Editor do Supabase:

```sql
-- ATENÇÃO: Altere o email e senha conforme necessário
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
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
    'admin@example.com',  -- ALTERE AQUI
    crypt('admin123', gen_salt('bf')),  -- ALTERE A SENHA AQUI
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false
  );

  -- Criar identidade
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    format('{"sub":"%s","email":"%s"}', user_id::text, 'admin@example.com')::jsonb,
    'email',
    now(),
    now(),
    now()
  );

  -- Criar dados do usuário
  INSERT INTO users (id, nome, cpf, cargo, email, foto_url) VALUES
    (user_id, 'Administrador', '00000000000', 'Administrador', 'admin@example.com', null);

  -- Vincular perfil de Administrador
  INSERT INTO user_profiles (user_id, profile_id) VALUES
    (user_id, '11111111-1111-1111-1111-111111111111');

  RAISE NOTICE 'Usuário criado com sucesso! Email: admin@example.com';
END $$;
```

## Passo 2: Fazer Login

1. Acesse a aplicação
2. Faça login com o email e senha criados
3. Você terá acesso completo como Administrador

## Passo 3: Criar Outros Usuários

Agora que você está logado como administrador:

1. Acesse "Usuários" no menu lateral
2. Clique em "Novo Usuário"
3. Preencha os dados do formulário
4. Clique em "Salvar"
5. Na tela seguinte, vincule um perfil ao usuário
6. Configure overrides de permissões se necessário

## Estrutura de Perfis Pré-configurados

O sistema vem com 3 perfis:

### Administrador
- Acesso completo a todas as funcionalidades
- Pode gerenciar usuários, perfis e funcionalidades

### Gestor
- Pode gerenciar usuários e perfis
- Não tem acesso à gestão de funcionalidades

### Usuário Comum
- Acesso apenas ao dashboard/home
- Visualização de suas próprias informações

## Próximos Passos

### Criar Novos Perfis

1. Acesse "Perfis" → "Novo Perfil"
2. Defina o título e descrição
3. Configure as permissões na matriz
4. Salve

### Criar Novas Funcionalidades

1. Acesse "Funcionalidades" → "Nova Funcionalidade"
2. Defina nome, descrição e rota
3. Configure o item de menu (raiz ou submenu)
4. Salve
5. A funcionalidade aparecerá automaticamente:
   - No menu lateral (para quem tiver permissão)
   - Na matriz de permissões de todos os perfis
   - Disponível para overrides

### Configurar Permissões

#### Por Perfil
1. Acesse "Perfis"
2. Edite um perfil existente
3. Na matriz de permissões, marque/desmarque funcionalidades
4. As alterações refletirão em todos os usuários com este perfil

#### Por Usuário (Override)
1. Acesse "Usuários"
2. Edite um usuário
3. Role até "Matriz de Permissões"
4. Clique em uma permissão para sobrescrever
5. Permissões sobrescritas ficam destacadas em amarelo

## Solução de Problemas

### Não consigo fazer login
- Verifique se o usuário foi criado no Supabase Auth
- Verifique se existe registro na tabela `users`
- Verifique se o email foi confirmado

### Menu lateral vazio
- Verifique se o usuário tem perfis vinculados
- Verifique se os perfis têm permissões configuradas
- Verifique a tabela `user_profiles`

### Erro ao acessar uma rota
- Verifique se a funcionalidade existe na tabela `features`
- Verifique se o usuário tem permissão (via perfil ou override)
- Verifique as policies RLS no Supabase

### Permissões não funcionam
- Verifique a hierarquia: Override > Perfil > Negado
- Verifique a tabela `profile_features`
- Verifique a tabela `user_feature_overrides`

## Suporte Técnico

Para mais informações:
- Documentação do Supabase: https://supabase.com/docs
- React Router: https://reactrouter.com
- TailwindCSS: https://tailwindcss.com

## Segurança

Lembre-se:
- Sempre use senhas fortes
- Não compartilhe credenciais
- Revise as policies RLS periodicamente
- Mantenha o Supabase atualizado
- Use HTTPS em produção
