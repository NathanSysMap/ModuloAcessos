import { useEffect, useState } from 'react';
import { User, Briefcase, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export function Home() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfiles();
    }
  }, [user]);

  const loadUserProfiles = async () => {
    if (!user) return;

    try {
      const { data: userProfiles, error } = await supabase
        .from('user_profiles')
        .select('profile_id, profiles(id, titulo, descricao)')
        .eq('user_id', user.id);

      if (error) throw error;

      const profilesList = userProfiles
        ?.map(up => up.profiles)
        .filter(Boolean) as unknown as Profile[];

      setProfiles(profilesList || []);
    } catch (error) {
      console.error('Error loading user profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Bem-vindo ao sistema de gestão</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Nome</p>
              <p className="text-lg font-semibold text-slate-900">{user.nome}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Cargo</p>
              <p className="text-lg font-semibold text-slate-900">{user.cargo}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Perfis</p>
              <p className="text-lg font-semibold text-slate-900">{profiles.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Meus Perfis</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : profiles.length > 0 ? (
          <div className="space-y-3">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <h3 className="font-semibold text-slate-900 mb-1">{profile.titulo}</h3>
                {profile.descricao && (
                  <p className="text-sm text-slate-600">{profile.descricao}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600">
            <Shield className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>Você ainda não possui perfis vinculados</p>
          </div>
        )}
      </div>
    </div>
  );
}
