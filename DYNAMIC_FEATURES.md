# Sistema de Funcionalidades Dinâmicas

## Visão Geral

O sistema agora suporta criação dinâmica de funcionalidades através da interface administrativa. Quando um administrador cria uma nova funcionalidade, o sistema automaticamente:

1. Adiciona a funcionalidade no menu lateral
2. Respeita a hierarquia (pai/filho) com indentação visual
3. Cria uma rota automaticamente
4. Renderiza uma página em branco (template padrão)
5. Filtra o menu baseado nas permissões do perfil do usuário

## Como Funciona

### 1. Criação de Funcionalidades

Administradores podem criar funcionalidades através da tela `/features`:

- **Nome**: Nome interno da funcionalidade
- **Label do Menu**: Texto que aparece no menu lateral
- **Rota**: Caminho da URL (ex: `/relatorios/vendas`)
- **Parent ID**: ID da funcionalidade pai (para criar hierarquia)
- **Descrição**: Descrição da funcionalidade

### 2. Hierarquia no Menu

O menu lateral organiza automaticamente as funcionalidades em árvore:

- Funcionalidades sem `menu_parent_id` aparecem no nível raiz
- Funcionalidades com `menu_parent_id` aparecem indentadas abaixo do pai
- Cada nível adicional de hierarquia aumenta a indentação em 1.5rem
- Pais são renderizados como botões expansíveis
- Filhos são renderizados como links diretos

Exemplo de estrutura:
```
📁 Relatórios (pai expansível)
  📄 Vendas (filho)
  📄 Estoque (filho)
  📁 Financeiro (filho/pai)
    📄 Contas a Pagar (neto)
    📄 Contas a Receber (neto)
📁 Cadastros (pai expansível)
  📄 Clientes (filho)
  📄 Fornecedores (filho)
```

### 3. Sistema de Permissões

O sistema filtra o menu baseado em três níveis de permissão:

1. **Override de Usuário**: Permissão específica para um usuário
   - Tem prioridade sobre todas as outras
   - Configurado em `user_feature_overrides`

2. **Permissão de Perfil**: Permissão baseada no perfil do usuário
   - Configurado em `profile_features`
   - Um usuário herda permissões de todos os seus perfis

3. **Negado**: Sem permissão
   - Funcionalidade não aparece no menu
   - Rota não é acessível

### 4. Páginas Dinâmicas

Quando uma funcionalidade é acessada:

1. O sistema verifica se existe uma página customizada para aquela rota
2. Se não existir, renderiza o componente `DynamicFeaturePage`
3. A página dinâmica exibe:
   - Título da funcionalidade
   - Descrição (se houver)
   - Mensagem indicando que está em construção

### 5. Roteamento Automático

O sistema cria rotas automaticamente:

- Rotas customizadas (hardcoded) têm prioridade
- Rotas dinâmicas são criadas para todas as funcionalidades no banco
- Todas as rotas são protegidas por autenticação
- Redirecionamento automático para login se não autenticado

## Exemplos Práticos

### Exemplo 1: Criar Menu de Relatórios

```sql
-- 1. Criar funcionalidade pai "Relatórios"
INSERT INTO features (id, nome, menu_label, route, descricao)
VALUES (
  gen_random_uuid(),
  'relatorios',
  'Relatórios',
  '/relatorios',
  'Módulo de relatórios gerenciais'
);

-- 2. Criar funcionalidades filhas
INSERT INTO features (nome, menu_label, route, menu_parent_id, descricao)
SELECT
  'relatorio-vendas',
  'Relatório de Vendas',
  '/relatorios/vendas',
  id,
  'Visualizar relatório de vendas por período'
FROM features WHERE nome = 'relatorios';

INSERT INTO features (nome, menu_label, route, menu_parent_id, descricao)
SELECT
  'relatorio-estoque',
  'Relatório de Estoque',
  '/relatorios/estoque',
  id,
  'Visualizar níveis de estoque'
FROM features WHERE nome = 'relatorios';

-- 3. Dar permissão ao perfil Administrador
INSERT INTO profile_features (profile_id, feature_id, allowed)
SELECT
  p.id,
  f.id,
  true
FROM profiles p
CROSS JOIN features f
WHERE p.titulo = 'Administrador'
  AND f.nome IN ('relatorios', 'relatorio-vendas', 'relatorio-estoque');
```

### Exemplo 2: Criar Funcionalidade de Nível 3

```sql
-- Criar hierarquia de 3 níveis: Configurações > Sistema > Logs
INSERT INTO features (nome, menu_label, route)
VALUES ('configuracoes', 'Configurações', '/configuracoes');

INSERT INTO features (nome, menu_label, route, menu_parent_id)
SELECT 'config-sistema', 'Sistema', '/configuracoes/sistema', id
FROM features WHERE nome = 'configuracoes';

INSERT INTO features (nome, menu_label, route, menu_parent_id)
SELECT 'config-logs', 'Logs do Sistema', '/configuracoes/sistema/logs', id
FROM features WHERE nome = 'config-sistema';
```

## Estrutura de Dados

### Tabela `features`

```sql
CREATE TABLE features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  menu_label text NOT NULL,
  menu_parent_id uuid REFERENCES features(id) ON DELETE CASCADE,
  route text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### Relacionamento com Perfis

```sql
-- Dar permissão a um perfil
INSERT INTO profile_features (profile_id, feature_id, allowed)
VALUES ('PROFILE_UUID', 'FEATURE_UUID', true);

-- Remover permissão de um perfil
UPDATE profile_features
SET allowed = false
WHERE profile_id = 'PROFILE_UUID'
  AND feature_id = 'FEATURE_UUID';
```

### Override de Usuário

```sql
-- Dar permissão específica a um usuário
INSERT INTO user_feature_overrides (user_id, feature_id, allowed, override_reason)
VALUES (
  'USER_UUID',
  'FEATURE_UUID',
  true,
  'Acesso especial temporário'
);
```

## Desenvolvimento de Páginas Customizadas

Para criar uma página customizada para uma funcionalidade:

1. Crie um novo componente em `src/pages/`
2. Importe o componente no `App.tsx`
3. Adicione a rota na lista de `customRoutes`
4. Adicione um `<Route>` específico para aquela funcionalidade

Exemplo:

```tsx
// src/pages/custom/RelatorioVendas.tsx
export function RelatorioVendas() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Relatório de Vendas</h1>
      {/* Seu conteúdo customizado aqui */}
    </div>
  );
}

// src/App.tsx
import { RelatorioVendas } from './pages/custom/RelatorioVendas';

// Adicione a rota
const customRoutes = new Set([
  // ... rotas existentes
  '/relatorios/vendas',
]);

// Adicione o Route
<Route
  path="/relatorios/vendas"
  element={
    <ProtectedRoute>
      <RelatorioVendas />
    </ProtectedRoute>
  }
/>
```

## Fluxo de Funcionamento

```
1. Usuário faz login
   ↓
2. Sistema carrega perfis do usuário
   ↓
3. Sistema carrega funcionalidades permitidas
   - Verifica user_feature_overrides
   - Verifica profile_features
   ↓
4. Constrói árvore hierárquica do menu
   ↓
5. Renderiza menu lateral com funcionalidades permitidas
   ↓
6. Cria rotas dinâmicas para funcionalidades
   ↓
7. Usuário clica em funcionalidade
   ↓
8. Sistema verifica se existe página customizada
   - Sim: Renderiza página customizada
   - Não: Renderiza DynamicFeaturePage
```

## Benefícios

1. **Escalabilidade**: Adicione funcionalidades sem alterar código
2. **Segurança**: Controle fino de acesso por perfil e usuário
3. **Flexibilidade**: Crie hierarquias complexas de menu
4. **Manutenibilidade**: Funcionalidades gerenciadas via banco de dados
5. **User Experience**: Menu dinâmico e responsivo às permissões

## Próximos Passos Recomendados

1. **Ícones Personalizados**: Adicionar campo `icon` na tabela features
2. **Ordem Customizada**: Adicionar campo `order` para controlar ordem no menu
3. **Breadcrumbs**: Implementar navegação breadcrumb baseada na hierarquia
4. **Busca no Menu**: Adicionar campo de busca para filtrar funcionalidades
5. **Logs de Acesso**: Registrar acessos às funcionalidades para auditoria
6. **Templates**: Criar diferentes templates de página além do padrão
