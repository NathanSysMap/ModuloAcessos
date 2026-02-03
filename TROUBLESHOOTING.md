# Troubleshooting - Sistema de Gerenciamento

## Problema: Database error querying schema / Login falhando

### Causa Raiz
O erro ocorria porque usuários criados no sistema estavam sem a entrada correspondente na tabela `auth.identities` do Supabase. Esta tabela é OBRIGATÓRIA para que o processo de autenticação funcione corretamente.

### Sintomas
- Erro "Database error querying schema" no console
- Erro 500 ao tentar fazer login
- Erro "unexpected_failure" nas requisições do Supabase
- Login aparentemente aceita as credenciais mas falha

### Solução Aplicada

1. **Limpeza de políticas duplicadas**
   - Removidas políticas RLS conflitantes
   - Simplificadas políticas para permitir acesso autenticado

2. **Correção da estrutura do usuário admin**
   - Criada entrada na tabela `auth.identities` com todos os campos obrigatórios:
     - `provider_id`: ID único do usuário
     - `identity_data`: JSON com dados do usuário
     - `provider`: tipo de provider (email)

3. **Atualização do script de criação de usuários**
   - Arquivo `create-admin-user.sql` atualizado com criação correta da identidade

## Credenciais Atualizadas

**Email:** admin@sistema.com
**Senha:** admin123

## Como Verificar se um Usuário Está Completo

Execute esta query no SQL Editor do Supabase:

```sql
SELECT
  au.id,
  au.email,
  au.encrypted_password IS NOT NULL as has_password,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  EXISTS(SELECT 1 FROM auth.identities WHERE user_id = au.id) as has_identity,
  u.id IS NOT NULL as has_user_record,
  up.id IS NOT NULL as has_profile
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE au.email = 'SEU_EMAIL@AQUI.COM';
```

Todos os campos devem retornar `true` para o login funcionar.

## Políticas RLS Atualizadas

As seguintes políticas foram aplicadas para garantir funcionamento correto:

### Tabela `users`
- SELECT: Todos usuários autenticados podem visualizar
- INSERT: Todos usuários autenticados podem inserir
- UPDATE: Todos usuários autenticados podem atualizar
- DELETE: Todos usuários autenticados podem deletar

### Tabelas `user_addresses` e `user_contacts`
- Mesmas permissões da tabela users

### Tabela `user_profiles`
- SELECT: Todos usuários autenticados podem visualizar
- INSERT: Todos usuários autenticados podem inserir
- DELETE: Todos usuários autenticados podem deletar

## Próximos Passos Recomendados

1. **Revisar políticas RLS**: As políticas atuais são permissivas demais para produção. Devem ser restringidas baseadas em perfis e permissões.

2. **Implementar controle de acesso baseado em perfis**: Usar a tabela `profile_features` para controlar o que cada perfil pode fazer.

3. **Adicionar auditoria**: Criar triggers para rastrear alterações em tabelas sensíveis.

4. **Validação de dados**: Adicionar constraints e validações no frontend e backend.
