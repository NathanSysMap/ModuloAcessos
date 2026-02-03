import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { UserProfilesManager } from '../../components/UserProfilesManager';

export function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cargo: '',
    email: '',
    password: '',
    foto_url: '',
  });

  const [addressData, setAddressData] = useState({
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  const [contactData, setContactData] = useState({
    telefone: '',
    celular: '',
  });

  useEffect(() => {
    loadProfiles();
    if (id) {
      loadUser(id);
    }
  }, [id]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('titulo');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadUser = async (userId: string) => {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      setFormData({
        nome: user.nome,
        cpf: user.cpf,
        cargo: user.cargo,
        email: user.email,
        password: '',
        foto_url: user.foto_url || '',
      });

      const { data: address } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (address) {
        setAddressData({
          rua: address.rua,
          numero: address.numero,
          complemento: address.complemento || '',
          bairro: address.bairro,
          cidade: address.cidade,
          estado: address.estado,
          cep: address.cep,
        });
      }

      const { data: contact } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (contact) {
        setContactData({
          telefone: contact.telefone || '',
          celular: contact.celular || '',
        });
      }

      setShowProfileManager(true);
    } catch (err: any) {
      console.error('Error loading user:', err);
      setError('Erro ao carregar usuário');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (id) {
        await updateUser(id);
      } else {
        await createUser();
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!selectedProfileId) {
      throw new Error('Por favor, selecione um perfil para o usuário');
    }

    const { data, error } = await supabase.rpc('create_user_with_profile', {
      p_nome: formData.nome,
      p_email: formData.email,
      p_password: formData.password,
      p_cpf: formData.cpf,
      p_cargo: formData.cargo,
      p_profile_id: selectedProfileId,
      p_rua: addressData.rua || null,
      p_numero: addressData.numero || null,
      p_complemento: addressData.complemento || null,
      p_bairro: addressData.bairro || null,
      p_cidade: addressData.cidade || null,
      p_estado: addressData.estado || null,
      p_cep: addressData.cep || null,
      p_telefone: contactData.telefone || null,
      p_celular: contactData.celular || null,
    });

    if (error) {
      console.error('RPC error:', error);
      throw new Error(error.message || 'Erro ao criar usuário');
    }

    if (!data) {
      throw new Error('Nenhum dado retornado da função');
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido ao criar usuário');
    }

    navigate('/users');
  };

  const updateUser = async (userId: string) => {
    const { error: userError } = await supabase
      .from('users')
      .update({
        nome: formData.nome,
        cpf: formData.cpf,
        cargo: formData.cargo,
        email: formData.email,
        foto_url: formData.foto_url || null,
      })
      .eq('id', userId);

    if (userError) throw userError;

    const { data: existingAddress } = await supabase
      .from('user_addresses')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (addressData.rua && addressData.numero) {
      if (existingAddress) {
        await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('user_id', userId);
      } else {
        await supabase.from('user_addresses').insert({
          user_id: userId,
          ...addressData,
        });
      }
    }

    const { data: existingContact } = await supabase
      .from('user_contacts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (contactData.telefone || contactData.celular) {
      if (existingContact) {
        await supabase
          .from('user_contacts')
          .update(contactData)
          .eq('user_id', userId);
      } else {
        await supabase.from('user_contacts').insert({
          user_id: userId,
          ...contactData,
        });
      }
    }

    navigate('/users');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/users')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {id ? 'Editar Usuário' : 'Novo Usuário'}
        </h1>
        <p className="text-slate-600">
          {id ? 'Atualize as informações do usuário' : 'Preencha os dados para criar um novo usuário'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Dados Básicos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">CPF *</label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cargo *</label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!id}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none disabled:bg-slate-100"
              />
            </div>

            {!id && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Senha *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Perfil *
                  </label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                  >
                    <option value="">Selecione um perfil</option>
                    {profiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.titulo}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-slate-500 mt-1">
                    Você poderá adicionar mais perfis e gerenciar permissões após salvar
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL da Foto
              </label>
              <input
                type="url"
                value={formData.foto_url}
                onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Endereço</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rua</label>
              <input
                type="text"
                value={addressData.rua}
                onChange={(e) => setAddressData({ ...addressData, rua: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Número</label>
              <input
                type="text"
                value={addressData.numero}
                onChange={(e) => setAddressData({ ...addressData, numero: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                value={addressData.complemento}
                onChange={(e) =>
                  setAddressData({ ...addressData, complemento: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bairro</label>
              <input
                type="text"
                value={addressData.bairro}
                onChange={(e) => setAddressData({ ...addressData, bairro: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cidade</label>
              <input
                type="text"
                value={addressData.cidade}
                onChange={(e) => setAddressData({ ...addressData, cidade: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
              <input
                type="text"
                value={addressData.estado}
                onChange={(e) => setAddressData({ ...addressData, estado: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">CEP</label>
              <input
                type="text"
                value={addressData.cep}
                onChange={(e) => setAddressData({ ...addressData, cep: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Contato</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
              <input
                type="text"
                value={contactData.telefone}
                onChange={(e) => setContactData({ ...contactData, telefone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Celular</label>
              <input
                type="text"
                value={contactData.celular}
                onChange={(e) => setContactData({ ...contactData, celular: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      {showProfileManager && id && (
        <div className="mt-6">
          <UserProfilesManager userId={id} />
        </div>
      )}
    </div>
  );
}
