import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Shield, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';

export function ProfilesList() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o perfil "${titulo}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);

      if (error) throw error;
      await loadProfiles();
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      alert('Erro ao excluir perfil: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.descricao && profile.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Perfis</h1>
          <p className="text-slate-600">Gerencie os perfis de acesso do sistema</p>
        </div>

        <Link
          to="/profiles/new"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Perfil
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
              placeholder="Buscar perfis..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredProfiles.map(profile => (
              <div
                key={profile.id}
                className="p-6 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 mb-1">{profile.titulo}</h3>
                    {profile.descricao && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {profile.descricao}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <Link
                    to={`/profiles/${profile.id}`}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(profile.id, profile.titulo)}
                    disabled={deletingId === profile.id}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === profile.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-600">
            <Shield className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>Nenhum perfil encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
