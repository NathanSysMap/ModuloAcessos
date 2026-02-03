# Sistema de Autenticação e Permissionamento

Sistema completo e modular de gestão de usuários, perfis e permissões, desenvolvido com React, TailwindCSS e Supabase.

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: TailwindCSS
- **Backend/DB/Auth**: Supabase
- **Roteamento**: React Router v6
- **Ícones**: Lucide React

## Funcionalidades Principais

### Autenticação

- Login com email e senha
- Login com Google SSO
- Recuperação de senha por email
- Redefinição de senha
- Proteção de rotas baseada em permissões
- Persistência de sessão

### Gestão de Usuários

- Listagem de usuários
- Criar/editar usuários com:
  - Dados básicos (nome, CPF, cargo, email, foto)
  - Endereço completo
  - Contatos (telefone, celular)
- Vincular perfis aos usuários
- Override manual de permissões individuais
- Matriz de permissões com destaque visual para overrides

### Gestão de Perfis

- Criar/editar perfis de acesso
- Matriz de permissões interativa
- Alterações em perfis refletem automaticamente nos usuários vinculados
- Permissões herdadas com possibilidade de override por usuário

### Gestão de Funcionalidades

- Criar/editar funcionalidades do sistema
- Configuração de menu (item raiz ou submenu)
- Rota automática no sistema
- Integração automática com matriz de permissões
- Menu lateral dinâmico baseado em permissões

### Sistema de Funcionalidades Dinâmicas

- **Criação Automática de Rotas**: Ao criar uma funcionalidade, a rota é automaticamente registrada
- **Menu Hierárquico**: Suporte a múltiplos níveis de hierarquia (pai/filho/neto)
- **Indentação Visual**: Cada nível de hierarquia é visualmente indentado
- **Páginas Automáticas**: Funcionalidades sem página customizada exibem template padrão
- **Filtragem por Permissões**: Menu exibe apenas funcionalidades permitidas ao usuário
- **Expansão/Colapso**: Itens pai podem ser expandidos/colapsados para mostrar filhos

Para mais detalhes, consulte [DYNAMIC_FEATURES.md](DYNAMIC_FEATURES.md)

## Estrutura do Banco de Dados

### Tabelas

- **users**: Dados dos usuários (estende auth.users do Supabase)
- **user_addresses**: Endereços dos usuários
- **user_contacts**: Contatos dos usuários
- **profiles**: Perfis de acesso
- **features**: Funcionalidades do sistema
- **profile_features**: Permissões dos perfis
- **user_profiles**: Vínculo usuário-perfil
- **user_feature_overrides**: Overrides de permissões por usuário

### Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de segurança configuradas
- Permissões baseadas em autenticação do Supabase

## Sistema de Permissões

### Hierarquia

A permissão efetiva de um usuário segue a ordem:

1. **Override do usuário** (se existir)
2. **Permissões do perfil** (herança)
3. **Negado por padrão** (sem acesso)

### Proteção de Rotas

- Usuário não autenticado → Redirecionado para login
- Usuário sem permissão → Não vê menu e não acessa rota
- Menu dinâmico → Exibe apenas funcionalidades permitidas

## Como Usar

### 1. Primeiro Acesso

1. Acesse a tela de login
2. Não há usuários cadastrados inicialmente
3. Você precisa criar um usuário via código ou Supabase Dashboard

### 2. Primeiro Usuário (Administrador)

O sistema já vem com um usuário administrador pré-configurado:

**Email:** admin@sistema.com
**Senha:** admin123

Para criar usuários adicionais:
- Use o arquivo `create-admin-user.sql` (edite email/senha)
- Ou após login, acesse "Usuários" → "Novo Usuário"

**Importante:** O arquivo `create-admin-user.sql` foi corrigido para criar usuários com todas as tabelas necessárias (incluindo `auth.identities`).

### 3. Navegação

Após login:

- **Home**: Dashboard com informações do usuário
- **Usuários**: Gerenciar usuários do sistema
- **Perfis**: Gerenciar perfis de acesso
- **Funcionalidades**: Gerenciar funcionalidades

### 4. Criar Novo Usuário (via Interface)

1. Acesse "Usuários" → "Novo Usuário"
2. Preencha dados básicos, endereço e contato
3. Clique em "Salvar"
4. Na tela de edição, vincule um ou mais perfis
5. Configure overrides de permissões se necessário

### 5. Criar Novo Perfil

1. Acesse "Perfis" → "Novo Perfil"
2. Defina título e descrição
3. Configure a matriz de permissões
4. Clique em "Salvar"

### 6. Criar Nova Funcionalidade

1. Acesse "Funcionalidades" → "Nova Funcionalidade"
2. Defina nome, descrição e rota
3. Configure se é item de menu raiz ou submenu
4. Ao salvar, a funcionalidade é automaticamente:
   - Adicionada ao menu lateral
   - Incluída na matriz de permissões de todos os perfis
   - Disponível para overrides por usuário

## Dados de Exemplo

O sistema vem com dados de exemplo pré-configurados:

### Perfis

- **Administrador**: Acesso completo
- **Gestor**: Acesso a usuários e perfis
- **Usuário Comum**: Acesso apenas ao dashboard

### Funcionalidades

- Home
- Gestão de Usuários
- Gestão de Perfis
- Gestão de Funcionalidades

## Plugar em Outra Aplicação

Este módulo é desacoplado e pode ser integrado em qualquer aplicação React:

### 1. Copiar Arquivos

```bash
# Copiar estrutura de pastas
src/
├── components/       # Layout, Sidebar, Header, ProtectedRoute
├── contexts/         # AuthContext, PermissionsContext
├── hooks/           # usePermissions
├── lib/             # supabase.ts
├── pages/           # Todas as páginas
└── types/           # TypeScript types
```

### 2. Configurar Supabase

```env
VITE_SUPABASE_URL=sua-url
VITE_SUPABASE_ANON_KEY=sua-key
```

### 3. Executar Migrations

Execute as migrations na ordem:
1. `create_auth_system_tables`
2. `seed_sample_data`

### 4. Integrar no App.tsx

```tsx
import { AuthProvider } from './contexts/AuthContext';
import { PermissionsProvider } from './contexts/PermissionsContext';

function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        {/* Seu app aqui */}
      </PermissionsProvider>
    </AuthProvider>
  );
}
```

### 5. Adicionar Novas Funcionalidades

Para adicionar uma nova funcionalidade à sua aplicação:

1. Crie a nova página/componente
2. Acesse "Funcionalidades" → "Nova Funcionalidade"
3. Configure a rota e menu
4. Configure as permissões nos perfis
5. A funcionalidade estará automaticamente protegida

## Customização

### Cores e Tema

O sistema usa tons de cinza (slate) por padrão. Para customizar:

```css
/* Em index.css ou tailwind.config.js */
/* Substitua slate por outra cor do Tailwind */
```

### Adicionar Campos ao Usuário

1. Adicione coluna na tabela `users`
2. Atualize o type `User` em `src/types/index.ts`
3. Atualize o formulário em `src/pages/users/UserForm.tsx`

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Segurança

- Todas as senhas são criptografadas pelo Supabase Auth
- RLS habilitado em todas as tabelas
- Tokens JWT gerenciados automaticamente
- Sessões persistidas com segurança
- Proteção contra acesso não autorizado

## Suporte

Este é um módulo genérico e reutilizável. Para questões específicas:

1. Verifique a documentação do Supabase
2. Revise as policies RLS no banco
3. Verifique os logs do navegador para erros

## Licença

MIT
