import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Feature } from '../../types';

export function FeaturesList() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('nome');

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeatures = features.filter(feature =>
    feature.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.menu_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getParentName = (parentId?: string) => {
    if (!parentId) return null;
    const parent = features.find(f => f.id === parentId);
    return parent?.menu_label;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Funcionalidades</h1>
          <p className="text-slate-600">Gerencie as funcionalidades do sistema</p>
        </div>

        <Link
          to="/features/new"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Funcionalidade
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar funcionalidades..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredFeatures.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Menu
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Rota
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Menu Pai
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFeatures.map(feature => (
                  <tr key={feature.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{feature.nome}</p>
                        {feature.descricao && (
                          <p className="text-sm text-slate-600 mt-1">{feature.descricao}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{feature.menu_label}</td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {feature.route}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {getParentName(feature.menu_parent_id) || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/features/${feature.id}`}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-600">
            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>Nenhuma funcionalidade encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
