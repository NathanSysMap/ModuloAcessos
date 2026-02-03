/*
  # Popular Banco com Dados de Exemplo

  1. Perfis Criados
    - Administrador - Acesso total ao sistema
    - Gestor - Acesso a gestão de usuários e perfis
    - Usuário Comum - Acesso básico

  2. Funcionalidades Criadas
    - Home/Dashboard
    - Gestão de Usuários (listagem e formulário)
    - Gestão de Perfis (listagem e formulário)
    - Gestão de Funcionalidades (listagem e formulário)

  3. Permissões Configuradas
    - Administrador: todas as permissões
    - Gestor: usuários, perfis e home
    - Usuário Comum: apenas home

  4. Notas
    - As funcionalidades são criadas de acordo com as rotas do sistema
    - Os perfis são configurados com suas respectivas permissões
    - Pronto para ser utilizado após criação de usuário via interface
*/

-- Inserir Perfis
INSERT INTO profiles (id, titulo, descricao) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Administrador', 'Acesso completo a todas as funcionalidades do sistema'),
  ('22222222-2222-2222-2222-222222222222', 'Gestor', 'Acesso à gestão de usuários e perfis'),
  ('33333333-3333-3333-3333-333333333333', 'Usuário Comum', 'Acesso básico ao sistema')
ON CONFLICT (id) DO NOTHING;

-- Inserir Funcionalidades
INSERT INTO features (id, nome, descricao, menu_label, menu_parent_id, route) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Home', 'Dashboard principal do sistema', 'Home', NULL, '/home'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Gestão de Usuários', 'Módulo para gerenciar usuários do sistema', 'Usuários', NULL, '/users'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Criar/Editar Usuário', 'Formulário para criar ou editar usuários', 'Novo Usuário', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '/users/new'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Gestão de Perfis', 'Módulo para gerenciar perfis de acesso', 'Perfis', NULL, '/profiles'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Criar/Editar Perfil', 'Formulário para criar ou editar perfis', 'Novo Perfil', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '/profiles/new'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Gestão de Funcionalidades', 'Módulo para gerenciar funcionalidades do sistema', 'Funcionalidades', NULL, '/features'),
  ('99999999-9999-9999-9999-999999999999', 'Criar/Editar Funcionalidade', 'Formulário para criar ou editar funcionalidades', 'Nova Funcionalidade', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '/features/new')
ON CONFLICT (id) DO NOTHING;

-- Configurar Permissões do Administrador (todas permitidas)
INSERT INTO profile_features (profile_id, feature_id, allowed) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true),
  ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true),
  ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', true),
  ('11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', true)
ON CONFLICT (profile_id, feature_id) DO UPDATE SET allowed = EXCLUDED.allowed;

-- Configurar Permissões do Gestor (usuários, perfis e home)
INSERT INTO profile_features (profile_id, feature_id, allowed) VALUES
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true),
  ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true),
  ('22222222-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', false),
  ('22222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', false)
ON CONFLICT (profile_id, feature_id) DO UPDATE SET allowed = EXCLUDED.allowed;

-- Configurar Permissões do Usuário Comum (apenas home)
INSERT INTO profile_features (profile_id, feature_id, allowed) VALUES
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', false),
  ('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', false),
  ('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', false),
  ('33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', false),
  ('33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', false)
ON CONFLICT (profile_id, feature_id) DO UPDATE SET allowed = EXCLUDED.allowed;