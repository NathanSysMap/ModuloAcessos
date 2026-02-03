import { useEffect, useState } from 'react';
import { Shield, Plus, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, Feature } from '../types';

interface UserProfilesManagerProps {
  userId: string;
}

interface PermissionRow extends Feature {
  profileAllowed: boolean;
  overrideAllowed: boolean | null;
  hasOverride: boolean;
  overrideId?: string;
}

export function UserProfilesManager({ userId }: UserProfilesManagerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userProfiles, setUserProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [profilesRes, userProfilesRes, featuresRes] = await Promise.all([
        supabase.from('profiles').select('*').order('titulo'),
        supabase
          .from('user_profiles')
          .select('profile_id, profiles(id, titulo, descricao)')
          .eq('user_id', userId),
        supabase.from('features').select('*').order('nome'),
      ]);

      setProfiles(profilesRes.data || []);
      const userProfilesList = (userProfilesRes.data || [])
        .map(up => up.profiles)
        .filter(Boolean) as unknown as Profile[];
      setUserProfiles(userProfilesList);

      await loadPermissions(userProfilesList, featuresRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (userProfiles: Profile[], features: Feature[]) => {
    if (userProfiles.length === 0 || features.length === 0) {
      setPermissions([]);
      return;
    }

    const profileIds = userProfiles.map(p => p.id);

    const [profileFeaturesRes, overridesRes] = await Promise.all([
      supabase
        .from('profile_features')
        .select('*')
        .in('profile_id', profileIds),
      supabase
        .from('user_feature_overrides')
        .select('*')
        .eq('user_id', userId),
    ]);

    const profileFeatures = profileFeaturesRes.data || [];
    const overrides = overridesRes.data || [];

    const permissionRows: PermissionRow[] = features.map(feature => {
      const profileFeature = profileFeatures.find(pf => pf.feature_id === feature.id);
      const override = overrides.find(o => o.feature_id === feature.id);

      return {
        ...feature,
        profileAllowed: profileFeature?.allowed || false,
        overrideAllowed: override ? override.allowed : null,
        hasOverride: !!override,
        overrideId: override?.id,
      };
    });

    setPermissions(permissionRows);
  };

  const handleAddProfile = async (profileId: string) => {
    try {
      const { error } = await supabase.from('user_profiles').insert({
        user_id: userId,
        profile_id: profileId,
      });

      if (error) throw error;
      await loadData();
      setShowAddProfile(false);
    } catch (error) {
      console.error('Error adding profile:', error);
    }
  };

  const handleRemoveProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)
        .eq('profile_id', profileId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error removing profile:', error);
    }
  };

  const handleToggleOverride = async (featureId: string, currentValue: boolean | null) => {
    try {
      const permission = permissions.find(p => p.id === featureId);
      if (!permission) return;

      if (permission.hasOverride) {
        if (currentValue === permission.profileAllowed) {
          await supabase
            .from('user_feature_overrides')
            .delete()
            .eq('id', permission.overrideId!);
        } else {
          await supabase
            .from('user_feature_overrides')
            .update({ allowed: !currentValue })
            .eq('id', permission.overrideId!);
        }
      } else {
        await supabase.from('user_feature_overrides').insert({
          user_id: userId,
          feature_id: featureId,
          allowed: !permission.profileAllowed,
        });
      }

      await loadData();
    } catch (error) {
      console.error('Error toggling override:', error);
    }
  };

  const availableProfiles = profiles.filter(
    p => !userProfiles.some(up => up.id === p.id)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Perfis do Usuário</h2>
          <button
            onClick={() => setShowAddProfile(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Perfil
          </button>
        </div>

        {showAddProfile && availableProfiles.length > 0 && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
            <div className="space-y-2">
              {availableProfiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => handleAddProfile(profile.id)}
                  className="w-full text-left p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <p className="font-medium text-slate-900">{profile.titulo}</p>
                  {profile.descricao && (
                    <p className="text-sm text-slate-600 mt-1">{profile.descricao}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {userProfiles.length > 0 ? (
          <div className="space-y-2">
            {userProfiles.map(profile => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900">{profile.titulo}</p>
                  {profile.descricao && (
                    <p className="text-sm text-slate-600">{profile.descricao}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveProfile(profile.id)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-600">
            <Shield className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">Nenhum perfil vinculado</p>
          </div>
        )}
      </div>

      {userProfiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Matriz de Permissões
          </h2>

          <div className="text-sm text-slate-600 mb-4">
            <p>
              Permissões herdadas dos perfis vinculados. Clique para sobrescrever individualmente.
            </p>
            <p className="mt-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-green-600 rounded"></span>
                Permitido
              </span>
              <span className="inline-flex items-center gap-1 ml-4">
                <span className="w-3 h-3 bg-red-600 rounded"></span>
                Negado
              </span>
              <span className="inline-flex items-center gap-1 ml-4">
                <span className="w-3 h-3 bg-amber-500 rounded"></span>
                Override ativo
              </span>
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-600 uppercase">
                      Funcionalidade
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-600 uppercase">
                      Permissão
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {permissions.map(permission => {
                    const effectivePermission = permission.hasOverride
                      ? permission.overrideAllowed
                      : permission.profileAllowed;

                    return (
                      <tr key={permission.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">{permission.nome}</p>
                            {permission.descricao && (
                              <p className="text-sm text-slate-600">{permission.descricao}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              handleToggleOverride(permission.id, effectivePermission)
                            }
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                              permission.hasOverride
                                ? 'bg-amber-100 text-amber-900 border-2 border-amber-500'
                                : effectivePermission
                                ? 'bg-green-100 text-green-900 border-2 border-transparent hover:border-green-300'
                                : 'bg-red-100 text-red-900 border-2 border-transparent hover:border-red-300'
                            }`}
                          >
                            {effectivePermission ? (
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
