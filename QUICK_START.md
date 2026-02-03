# Quick Start - Sistema de Funcionalidades Dinâmicas

## Início Rápido

### 1. Faça Login

**Email:** admin@sistema.com
**Senha:** admin123

### 2. Teste com Funcionalidades de Exemplo

Execute o script `example-features.sql` no SQL Editor do Supabase para criar funcionalidades de exemplo.

### 3. Veja o Menu Lateral

Após executar o script, o menu lateral exibirá:

```
🏠 Home
👥 Usuários
👤 Perfis
⚙️ Funcionalidades
📊 Dashboard
📁 Relatórios
   ├─ Vendas
   ├─ Estoque
   └─ Financeiro
⚙️ Configurações
   ├─ Sistema
   │  ├─ Logs do Sistema
   │  └─ Servidor de Email
   ├─ Segurança
   └─ Integrações
📝 Cadastros
   ├─ Clientes
   ├─ Fornecedores
   └─ Produtos
```

## Criar Sua Primeira Funcionalidade

### Opção 1: Via Interface (Recomendado)

1. Clique em "Funcionalidades" no menu
2. Clique em "Nova Funcionalidade"
3. Preencha os campos:
   - **Nome**: `minha-funcionalidade` (identificador único)
   - **Label do Menu**: `Minha Funcionalidade` (texto no menu)
   - **Rota**: `/minha-funcionalidade` (URL da página)
   - **Descrição**: Descrição opcional
   - **Parent ID**: Deixe vazio para item raiz, ou selecione um pai
4. Clique em "Salvar"

**Pronto!** A funcionalidade aparecerá automaticamente no menu.

### Opção 2: Via SQL

```sql
-- Criar funcionalidade raiz
INSERT INTO features (nome, menu_label, route, descricao)
VALUES (
  'minha-funcionalidade',
  'Minha Funcionalidade',
  '/minha-funcionalidade',
  'Descrição da minha funcionalidade'
);

-- Dar permissão ao perfil Administrador
INSERT INTO profile_features (profile_id, feature_id, allowed)
SELECT
  p.id,
  f.id,
  true
FROM profiles p
CROSS JOIN features f
WHERE p.titulo = 'Administrador'
  AND f.nome = 'minha-funcionalidade';
```

## Criar Hierarquia (Pai/Filho)

### 1. Criar Funcionalidade Pai

```sql
INSERT INTO features (id, nome, menu_label, route)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'vendas',
  'Vendas',
  '/vendas'
);
```

### 2. Criar Funcionalidades Filhas

```sql
INSERT INTO features (nome, menu_label, route, menu_parent_id)
VALUES
  ('vendas-pedidos', 'Pedidos', '/vendas/pedidos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('vendas-orcamentos', 'Orçamentos', '/vendas/orcamentos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('vendas-notas', 'Notas Fiscais', '/vendas/notas', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
```

O menu exibirá:

```
📁 Vendas
   ├─ Pedidos
   ├─ Orçamentos
   └─ Notas Fiscais
```

## Gerenciar Permissões

### Dar Acesso a um Perfil

1. Clique em "Perfis" no menu
2. Clique no perfil desejado
3. Na matriz de permissões, marque as funcionalidades permitidas
4. Clique em "Salvar"

### Dar Acesso Especial a um Usuário

1. Clique em "Usuários" no menu
2. Clique no usuário desejado
3. Na seção "Overrides de Permissões", configure permissões específicas
4. Clique em "Salvar"

**Nota:** Overrides de usuário têm prioridade sobre permissões de perfil.

## Customizar Página de uma Funcionalidade

Por padrão, funcionalidades exibem uma página em branco. Para customizar:

### 1. Criar Componente Customizado

```tsx
// src/pages/custom/MinhaFuncionalidade.tsx
export function MinhaFuncionalidade() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Minha Funcionalidade</h1>
      <p>Conteúdo customizado aqui!</p>
    </div>
  );
}
```

### 2. Registrar Rota no App.tsx

```tsx
// Importar
import { MinhaFuncionalidade } from './pages/custom/MinhaFuncionalidade';

// Adicionar na lista de rotas customizadas
const customRoutes = new Set([
  // ... rotas existentes
  '/minha-funcionalidade',
]);

// Adicionar Route
<Route
  path="/minha-funcionalidade"
  element={
    <ProtectedRoute>
      <MinhaFuncionalidade />
    </ProtectedRoute>
  }
/>
```

## Testar Permissões

### 1. Criar Perfil de Teste

```sql
-- Criar perfil com acesso limitado
INSERT INTO profiles (titulo, descricao)
VALUES ('Vendedor', 'Acesso apenas ao módulo de vendas');

-- Dar permissão apenas para vendas
INSERT INTO profile_features (profile_id, feature_id, allowed)
SELECT
  p.id,
  f.id,
  true
FROM profiles p
CROSS JOIN features f
WHERE p.titulo = 'Vendedor'
  AND f.nome LIKE 'venda%';
```

### 2. Criar Usuário de Teste

```sql
-- Ver arquivo create-admin-user.sql
-- Alterar email e senha, depois executar
```

### 3. Fazer Login

Faça login com o usuário de teste e veja que o menu exibe apenas as funcionalidades permitidas.

## Dicas

### Organização de Rotas

Use prefixos consistentes:
- `/relatorios/*` - Todos os relatórios
- `/cadastros/*` - Todos os cadastros
- `/configuracoes/*` - Todas as configurações

### Nomes Descritivos

Use nomes claros e únicos:
- ✅ `relatorio-vendas-mensal`
- ✅ `cadastro-cliente`
- ❌ `rel1`, `cad1`

### Hierarquia Lógica

Agrupe funcionalidades relacionadas:
```
Financeiro (pai)
├─ Contas a Pagar (filho)
├─ Contas a Receber (filho)
└─ Fluxo de Caixa (filho)
```

### Permissões Granulares

Crie perfis específicos:
- `Administrador` - Acesso total
- `Gerente` - Acesso a gestão
- `Operador` - Acesso a operações
- `Consulta` - Apenas visualização

## Troubleshooting

### Menu não atualiza após criar funcionalidade

- Recarregue a página (F5)
- Verifique se a funcionalidade tem permissão no perfil do usuário
- Confira se não há erros no console do navegador

### Funcionalidade não aparece no menu

1. Verifique se a funcionalidade foi criada:
```sql
SELECT * FROM features WHERE nome = 'nome-da-funcionalidade';
```

2. Verifique se há permissão:
```sql
SELECT * FROM profile_features pf
JOIN features f ON pf.feature_id = f.id
WHERE f.nome = 'nome-da-funcionalidade';
```

3. Verifique se o usuário tem o perfil correto:
```sql
SELECT * FROM user_profiles WHERE user_id = 'seu-user-id';
```

### Erro ao acessar funcionalidade

- Verifique se a rota está correta
- Confira se não há conflito com rotas existentes
- Veja o console do navegador para erros

## Próximos Passos

1. Execute `example-features.sql` para ver exemplos
2. Crie suas próprias funcionalidades
3. Customize páginas conforme necessário
4. Configure permissões por perfil
5. Teste com diferentes usuários

## Recursos Adicionais

- [DYNAMIC_FEATURES.md](DYNAMIC_FEATURES.md) - Documentação completa
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solução de problemas
- [README.md](README.md) - Visão geral do sistema
