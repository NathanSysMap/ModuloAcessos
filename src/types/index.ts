export interface User {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  foto_url?: string;
  email: string;
  created_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  created_at: string;
}

export interface UserContact {
  id: string;
  user_id: string;
  telefone?: string;
  celular?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  titulo: string;
  descricao?: string;
  created_at: string;
}

export interface Feature {
  id: string;
  nome: string;
  descricao?: string;
  menu_label: string;
  menu_parent_id?: string;
  route: string;
  created_at: string;
}

export interface ProfileFeature {
  id: string;
  profile_id: string;
  feature_id: string;
  allowed: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  profile_id: string;
  created_at: string;
}

export interface UserFeatureOverride {
  id: string;
  user_id: string;
  feature_id: string;
  allowed: boolean;
  override_reason?: string;
  created_at: string;
}

export interface UserWithDetails extends User {
  address?: UserAddress;
  contact?: UserContact;
  profiles?: Profile[];
}

export interface FeatureWithChildren extends Feature {
  children?: Feature[];
}

export interface PermissionCheck {
  hasPermission: boolean;
  source: 'override' | 'profile' | 'denied';
}
