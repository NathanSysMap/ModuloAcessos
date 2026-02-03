import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Feature } from '../../types';

export function FeatureForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [features, setFeatures] = useState<Feature[]>([]);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    menu_label: '',
    menu_parent_id: '',
    route: '',
  });

  useEffect(() => {
    loadFeatures();
    if (id) {
      loadFeature(id);
    }
  }, [id]);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('menu_label');

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Error loading features:', err);
    }
  };

  const loadFeature = async (featureId: string) => {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('id', featureId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome,
        descricao: data.descricao || '',
        menu_label: data.menu_label,
        menu_parent_id: data.menu_parent_id || '',
        route: data.route,
      });
    } catch (err: any) {
      console.error('Error loading feature:', err);
      setError('Erro ao carregar funcionalidade');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.route.startsWith('/')) {
        setError('A rota deve começar com /');
        setLoading(false);
        return;
      }

      if (id) {
        await updateFeature(id);
      } else {
        await createFeature();
      }
      navigate('/features');
    } catch (err: any) {
      console.error('Error saving feature:', err);
      setError(err.message || 'Erro ao salvar funcionalidade');
    } finally {
      setLoading(false);
    }
  };

  const createFeature = async () => {
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .insert({
        nome: formData.nome,
        descricao: formData.descricao || null,
        menu_label: formData.menu_label,
        menu_parent_id: formData.menu_parent_id || null,
        route: formData.route,
      })
      .select()
      .single();

    if (featureError) throw featureError;

    const { data: profiles } = await supabase.from('profiles').select('id');

    if (profiles && profiles.length > 0) {
      const profileFeatures = profiles.map(profile => ({
        profile_id: profile.id,
        feature_id: feature.id,
        allowed: false,
      }));

      await supabase.from('profile_features').insert(profileFeatures);
    }
  };

  const updateFeature = async (featureId: string) => {
    const { error: featureError } = await supabase
      .from('features')
      .update({
        nome: formData.nome,
        descricao: formData.descricao || null,
        menu_label: formData.menu_label,
        menu_parent_id: formData.menu_parent_id || null,
        route: formData.route,
      })
      .eq('id', featureId);

    if (featureError) throw featureError;
  };

  const parentOptions = features.filter(f => f.id !== id && !f.menu_parent_id);

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/features')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {id ? 'Editar Funcionalidade' : 'Nova Funcionalidade'}
        </h1>
        <p className="text-slate-600">
          {id
            ? 'Atualize as informações da funcionalidade'
            : 'Crie uma nova funcionalidade no sistema'}
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Informações da Funcionalidade
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                placeholder="Ex: Gestão de Usuários"
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
                placeholder="Descreva o que esta funcionalidade faz..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Label do Menu *
              </label>
              <input
                type="text"
                value={formData.menu_label}
                onChange={(e) => setFormData({ ...formData, menu_label: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                placeholder="Ex: Usuários"
              />
              <p className="text-xs text-slate-500 mt-1">
                Texto que aparecerá no menu lateral
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Menu Pai
              </label>
              <select
                value={formData.menu_parent_id}
                onChange={(e) =>
                  setFormData({ ...formData, menu_parent_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              >
                <option value="">Nenhum (Item raiz)</option>
                {parentOptions.map(feature => (
                  <option key={feature.id} value={feature.id}>
                    {feature.menu_label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Deixe vazio para criar um item de menu principal
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rota *
              </label>
              <input
                type="text"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                placeholder="/users"
              />
              <p className="text-xs text-slate-500 mt-1">
                Caminho da URL (deve começar com /)
              </p>
            </div>
          </div>
        </div>

        {!id && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Ao criar uma nova funcionalidade, ela será automaticamente:
            </p>
            <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc space-y-1">
              <li>Adicionada ao menu lateral (visível apenas para quem tiver permissão)</li>
              <li>Incluída na matriz de permissões de todos os perfis (inicialmente negada)</li>
              <li>Disponível para configuração de overrides por usuário</li>
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/features')}
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
