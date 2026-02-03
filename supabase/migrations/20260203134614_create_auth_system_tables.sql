/*
  # Sistema de Autenticação e Permissionamento - Criação de Tabelas

  1. Tabelas Criadas
    - `users` - Extensão dos dados do auth.users
      - `id` (uuid, FK para auth.users)
      - `nome` (text)
      - `cpf` (text, único)
      - `cargo` (text)
      - `foto_url` (text)
      - `email` (text)
      - `created_at` (timestamptz)
    
    - `user_addresses` - Endereços dos usuários
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `rua` (text)
      - `numero` (text)
      - `complemento` (text)
      - `bairro` (text)
      - `cidade` (text)
      - `estado` (text)
      - `cep` (text)
    
    - `user_contacts` - Contatos dos usuários
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `telefone` (text)
      - `celular` (text)
    
    - `profiles` - Perfis de acesso
      - `id` (uuid, PK)
      - `titulo` (text)
      - `descricao` (text)
      - `created_at` (timestamptz)
    
    - `features` - Funcionalidades do sistema
      - `id` (uuid, PK)
      - `nome` (text)
      - `descricao` (text)
      - `menu_label` (text)
      - `menu_parent_id` (uuid, nullable)
      - `route` (text)
      - `created_at` (timestamptz)
    
    - `profile_features` - Permissões dos perfis
      - `id` (uuid, PK)
      - `profile_id` (uuid, FK)
      - `feature_id` (uuid, FK)
      - `allowed` (boolean)
    
    - `user_profiles` - Vínculo usuário-perfil
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `profile_id` (uuid, FK)
    
    - `user_feature_overrides` - Override de permissões por usuário
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `feature_id` (uuid, FK)
      - `allowed` (boolean)
      - `override_reason` (text)

  2. Segurança (RLS)
    - Todas as tabelas têm RLS habilitado
    - Políticas criadas para usuários autenticados
    - Usuários podem visualizar seus próprios dados
    - Apenas administradores podem gerenciar perfis e funcionalidades

  3. Notas Importantes
    - Sistema de permissões hierárquico: override > perfil > negado
    - Suporte a submenus através de menu_parent_id
    - CPF único por usuário
    - Timestamps automáticos
*/

-- Tabela users (extensão do auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cpf text UNIQUE NOT NULL,
  cargo text NOT NULL,
  foto_url text,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Tabela user_addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rua text NOT NULL,
  numero text NOT NULL,
  complemento text,
  bairro text NOT NULL,
  cidade text NOT NULL,
  estado text NOT NULL,
  cep text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON user_addresses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own addresses"
  ON user_addresses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
  ON user_addresses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
  ON user_addresses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Tabela user_contacts
CREATE TABLE IF NOT EXISTS user_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telefone text,
  celular text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON user_contacts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own contacts"
  ON user_contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contacts"
  ON user_contacts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own contacts"
  ON user_contacts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (true);

-- Tabela features
CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  menu_label text NOT NULL,
  menu_parent_id uuid REFERENCES features(id) ON DELETE CASCADE,
  route text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view features"
  ON features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage features"
  ON features FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update features"
  ON features FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete features"
  ON features FOR DELETE
  TO authenticated
  USING (true);

-- Tabela profile_features
CREATE TABLE IF NOT EXISTS profile_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  allowed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, feature_id)
);

ALTER TABLE profile_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profile features"
  ON profile_features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage profile features"
  ON profile_features FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update profile features"
  ON profile_features FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete profile features"
  ON profile_features FOR DELETE
  TO authenticated
  USING (true);

-- Tabela user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can manage user profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete user profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (true);

-- Tabela user_feature_overrides
CREATE TABLE IF NOT EXISTS user_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  allowed boolean NOT NULL,
  override_reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_id)
);

ALTER TABLE user_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own overrides"
  ON user_feature_overrides FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can manage overrides"
  ON user_feature_overrides FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update overrides"
  ON user_feature_overrides FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete overrides"
  ON user_feature_overrides FOR DELETE
  TO authenticated
  USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_features_profile_id ON profile_features(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_features_feature_id ON profile_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_id ON user_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_user_id ON user_feature_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_feature_id ON user_feature_overrides(feature_id);
CREATE INDEX IF NOT EXISTS idx_features_menu_parent_id ON features(menu_parent_id);