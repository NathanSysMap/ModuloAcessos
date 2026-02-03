import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Feature } from '../../types';

export function ProfileForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const loadedFeatures = await loadFeatures();
      if (id && loadedFeatures.length > 0) {
        await loadProfile(id, loadedFeatures);
      }
    };
    loadData();
  }, [id]);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('nome');

      if (error) throw error;

      const featuresData = data || [];
      setFeatures(featuresData);

      if (!id) {
        const initialPermissions: Record<string, boolean> = {};
        featuresData.forEach(feature => {
          initialPermissions[feature.id] = false;
        });
        setPermissions(initialPermissions);
      }

      return featuresData;
    } catch (err) {
      console.error('Error loading features:', err);
      return [];
    }
  };

  const loadProfile = async (profileId: string, featuresData: Feature[]) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;

      setFormData({
        titulo: profile.titulo,
        descricao: profile.descricao || '',
      });

      const { data: profileFeatures, error: featuresError } = await supabase
        .from('profile_features')
        .select('*')
        .eq('profile_id', profileId);

      if (featuresError) throw featuresError;

      const permissionsMap: Record<string, boolean> = {};
      featuresData.forEach(feature => {
        const pf = profileFeatures?.find(pf => pf.feature_id === feature.id);
        permissionsMap[feature.id] = pf?.allowed || false;
      });
      setPermissions(permissionsMap);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError('Erro ao carregar perfil');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (id) {
        await updateProfile(id);
      } else {
        await createProfile();
      }
      navigate('/profiles');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        titulo: formData.titulo,
        descricao: formData.descricao || null,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    const profileFeatures = Object.entries(permissions).map(([featureId, allowed]) => ({
      profile_id: profile.id,
      feature_id: featureId,
      allowed,
    }));

    const { error: featuresError } = await supabase
      .from('profile_features')
      .insert(profileFeatures);

    if (featuresError) throw featuresError;
  };

  const updateProfile = async (profileId: string) => {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        titulo: formData.titulo,
        descricao: formData.descricao || null,
      })
      .eq('id', profileId);

    if (profileError) throw profileError;

    await supabase
      .from('profile_features')
      .delete()
      .eq('profile_id', profileId);

    const profileFeatures = Object.entries(permissions).map(([featureId, allowed]) => ({
      profile_id: profileId,
      feature_id: featureId,
      allowed,
    }));

    const { error: featuresError } = await supabase
      .from('profile_features')
      .insert(profileFeatures);

    if (featuresError) throw featuresError;
  };

  const togglePermission = (featureId: string) => {
    setPermissions(prev => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/profiles')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {id ? 'Editar Perfil' : 'Novo Perfil'}
        </h1>
        <p className="text-slate-600">
          {id ? 'Atualize as informações do perfil' : 'Crie um novo perfil de acesso'}
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações Básicas</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                placeholder="Ex: Administrador, Usuário Comum, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                placeholder="Descreva as responsabilidades deste perfil..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Matriz de Permissões
          </h2>

          <p className="text-sm text-slate-600 mb-4">
            Selecione quais funcionalidades este perfil terá acesso
          </p>

          {features.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase">
                      Funcionalidade
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-600 uppercase">
                      Permitir Acesso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {features.map(feature => (
                    <tr key={feature.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{feature.nome}</p>
                          {feature.descricao && (
                            <p className="text-sm text-slate-600">{feature.descricao}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">Rota: {feature.route}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission(feature.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            permissions[feature.id]
                              ? 'bg-green-100 text-green-900 hover:bg-green-200'
                              : 'bg-red-100 text-red-900 hover:bg-red-200'
                          }`}
                        >
                          {permissions[feature.id] ? (
                            <>
                              <Check className="w-4 h-4" />
                              Permitido
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Negado
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-600">
              <p>Nenhuma funcionalidade cadastrada ainda</p>
              <p className="text-sm mt-2">
                Cadastre funcionalidades para configurar as permissões
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/profiles')}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
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
    </div>
  );
}
