-- Script de Exemplo: Criando Funcionalidades Dinâmicas
-- Execute este script no SQL Editor do Supabase para criar funcionalidades de exemplo

-- ==============================================
-- EXEMPLO 1: Módulo de Relatórios
-- ==============================================

-- 1.1. Criar funcionalidade pai "Relatórios"
INSERT INTO features (id, nome, menu_label, route, descricao)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'relatorios',
  'Relatórios',
  '/relatorios',
  'Módulo de relatórios gerenciais e analíticos'
) ON CONFLICT (id) DO NOTHING;

-- 1.2. Criar relatórios filhos
INSERT INTO features (nome, menu_label, route, menu_parent_id, descricao)
VALUES
  ('relatorio-vendas', 'Vendas', '/relatorios/vendas', '22222222-2222-2222-2222-222222222222', 'Relatório de vendas por período e produto'),
  ('relatorio-estoque', 'Estoque', '/relatorios/estoque', '22222222-2222-2222-2222-222222222222', 'Níveis de estoque e movimentações'),
  ('relatorio-financeiro', 'Financeiro', '/relatorios/financeiro', '22222222-2222-2222-2222-222222222222', 'Fluxo de caixa e demonstrativos financeiros')
ON CONFLICT (nome) DO NOTHING;

-- 1.3. Dar permissão ao perfil Administrador
INSERT INTO profile_features (profile_id, feature_id, allowed)
SELECT
  p.id,
  f.id,
  true
FROM profiles p
CROSS JOIN features f
WHERE p.titulo = 'Administrador'
  AND f.nome IN ('relatorios', 'relatorio-vendas', 'relatorio-estoque', 'relatorio-financeiro')
ON CONFLICT (profile_id, feature_id) DO UPDATE SET allowed = true;

-- ==============================================
-- EXEMPLO 2: Módulo de Configurações (3 níveis)
-- ==============================================

-- 2.1. Criar funcionalidade pai "Configurações"
INSERT INTO features (id, nome, menu_label, route, descricao)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'configuracoes',
  'Configurações',
  '/configuracoes',
  'Configurações gerais do sistema'
) ON CONFLICT (id) DO NOTHING;

-- 2.2. Criar submenus de configurações
INSERT INTO features (nome, menu_label, route, menu_parent_id, descricao)
VALUES
  ('config-sistema', 'Sistema', '/configuracoes/sistema', '33333333-3333-3333-3333-333333333333', 'Configurações de sistema'),
  ('config-seguranca', 'Segurança', '/configuracoes/seguranca', '33333333-3333-3333-3333-333333333333', 'Configurações de segurança e políticas'),
  ('config-integracao', 'Integrações', '/configuracoes/integracoes', '33333333-3333-3333-3333-333333333333', 'Integrações com sistemas externos')
ON CONFLICT (nome) DO NOTHING;

-- 2.3. Criar submenus de 3º nível (configurações de sistema)
INSERT INTO features (nome, menu_label, route, menu_parent_id, descricao)
SELECT
  'config-logs',
  'Logs do Sistema',
  '/configuracoes/sistema/logs',
  id,
  'Visualizar e gerenciar logs do sistema'
FROM features WHERE nome = 'config-sistema'
ON CONFLICT (nome) DO NOTHING;

INSERT INTO features (nome, menu_label, route, menu_parent_id, descricao)
SELECT
  'config-email',
  'Servidor de Email',
  '/configuracoes/sistema/email',
  id,
  'Configurar servidor SMTP para envio de emails'
FROM features WHERE nome = 'config-sistema'
ON CONFLICT (nome) DO NOTHING;

-- 2.4. Dar permissão ao perfil Administrador
INSERT INTO profile_features (profile_id, feature_id, allowed)
SELECT
  p.id,
  f.id,
  true
FROM profiles p
CROSS JOIN features f
WHERE p.titulo = 'Administrador'
  AND f.nome LIKE 'config%'
ON CONFLICT (profile_id, feature_id) DO UPDATE SET allowed = true;

-- ==============================================
-- EXEMPLO 3: Módulo de Dashboard
-- ==============================================

-- 3.1. Criar dashboard
INSERT INTO features (nome, menu_label, route, descricao)
VALUES (
  'dashboard',
  'Dashboard',
  '/dashboard',
  'Visão geral e indicadores principais do sistema'
) ON CONFLICT (nome) DO NOTHING;

-- 3.2. Dar permissão a todos os perfis
INSERT INTO profile_features (profile_id, feature_id, allowed)
SELECT
  p.id,
  f.id,
  true
FROM profiles p
CROSS JOIN features f
WHERE f.nome = 'dashboard'
ON CONFLICT (profile_id, feature_id) DO UPDATE SET allowed = true;

-- ==============================================
-- EXEMPLO 4: Módulo de Cadastros
-- ==============================================

-- 4.1. Criar funcionalidade pai "Cadastros"
INSERT INTO features (id, nome, menu_label, route, descricao)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'cadastros',
  'Cadastros',
  '/cadastros',
  'Gerenciamento de cadastros básicos'
) ON CONFLICT (id) DO NOTHING;

-- 4.2. Criar cadastros filhos
INSERT INTO features (nome, menu_label, route, menu_parent_id, descricao)
VALUES
  ('cadastro-clientes', 'Clientes', '/cadastros/clientes', '44444444-4444-4444-4444-444444444444', 'Gerenciar cadastro de clientes'),
  ('cadastro-fornecedores', 'Fornecedores', '/cadastros/fornecedores', '44444444-4444-4444-4444-444444444444', 'Gerenciar cadastro de fornecedores'),
  ('cadastro-produtos', 'Produtos', '/cadastros/produtos', '44444444-4444-4444-4444-444444444444', 'Gerenciar catálogo de produtos')
ON CONFLICT (nome) DO NOTHING;

-- 4.3. Dar permissão diferenciada por perfil
-- Administrador: acesso total
INSERT INTO profile_features (profile_id, feature_id, allowed)
SELECT
  p.id,
  f.id,
  true
FROM profiles p
CROSS JOIN features f
WHERE p.titulo = 'Administrador'
  AND f.nome LIKE 'cadastro%'
ON CONFLICT (profile_id, feature_id) DO UPDATE SET allowed = true;

-- Gerente: acesso apenas a clientes e produtos
INSERT INTO profile_features (profile_id, feature_id, allowed)
SELECT
  p.id,
  f.id,
  true
FROM profiles p
CROSS JOIN features f
WHERE p.titulo = 'Gerente'
  AND f.nome IN ('cadastros', 'cadastro-clientes', 'cadastro-produtos')
ON CONFLICT (profile_id, feature_id) DO UPDATE SET allowed = true;

-- ==============================================
-- VERIFICAÇÃO
-- ==============================================

-- Verificar funcionalidades criadas
SELECT
  f.menu_label,
  f.route,
  COALESCE(parent.menu_label, '(raiz)') as parent,
  f.descricao
FROM features f
LEFT JOIN features parent ON f.menu_parent_id = parent.id
ORDER BY parent.menu_label NULLS FIRST, f.menu_label;

-- Verificar permissões por perfil
SELECT
  p.titulo as perfil,
  COUNT(DISTINCT pf.feature_id) as total_funcionalidades,
  COUNT(DISTINCT CASE WHEN pf.allowed THEN pf.feature_id END) as permitidas
FROM profiles p
LEFT JOIN profile_features pf ON p.id = pf.profile_id
GROUP BY p.id, p.titulo
ORDER BY p.titulo;

-- ==============================================
-- INSTRUÇÕES DE USO
-- ==============================================

/*
1. Execute todo este script no SQL Editor do Supabase

2. Faça login no sistema com o usuário admin:
   - Email: admin@sistema.com
   - Senha: admin123

3. Observe o menu lateral:
   - As funcionalidades aparecerão organizadas hierarquicamente
   - Items com filhos têm ícone de seta expansível
   - Items sem filhos são links diretos

4. Clique em qualquer funcionalidade:
   - Será exibida uma página em branco (template padrão)
   - A página mostra o título e descrição da funcionalidade

5. Para criar suas próprias funcionalidades:
   - Acesse o menu "Funcionalidades"
   - Clique em "Nova Funcionalidade"
   - Preencha os campos
   - A funcionalidade aparecerá automaticamente no menu

6. Para gerenciar permissões:
   - Acesse "Perfis" para configurar permissões por perfil
   - Ou edite diretamente a tabela profile_features
*/
