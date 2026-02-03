import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Feature, FeatureWithChildren, PermissionCheck } from '../types';

export function usePermissions() {
  const { user } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [menuItems, setMenuItems] = useState<FeatureWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkSuperAdmin();
      loadPermissions();
    }
  }, [user]);

  const checkSuperAdmin = async () => {
    if (!user) return;

    try {
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('profile_id')
        .eq('user_id', user.id);

      if (!userProfiles || userProfiles.length === 0) {
        setIsSuperAdmin(false);
        return;
      }

      const profileIds = userProfiles.map(up => up.profile_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .in('id', profileIds);

      const hasSuperAdmin = profiles?.some(p => p.is_super_admin) || false;
      setIsSuperAdmin(hasSuperAdmin);
    } catch (error) {
      console.error('Error checking super admin status:', error);
      setIsSuperAdmin(false);
    }
  };

  const loadPermissions = async () => {
    if (!user) return;

    try {
      const { data: allFeatures, error: featuresError } = await supabase
        .from('features')
        .select('*')
        .order('menu_label');

      if (featuresError) throw featuresError;

      const allowedFeatures: Feature[] = [];

      for (const feature of allFeatures || []) {
        const hasPermission = await checkPermission(feature.id);
        if (hasPermission.hasPermission) {
          allowedFeatures.push(feature);
        }
      }

      setFeatures(allowedFeatures);
      setMenuItems(buildMenuTree(allowedFeatures));
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = async (featureId: string): Promise<PermissionCheck> => {
    if (!user) return { hasPermission: false, source: 'denied' };

    if (isSuperAdmin) {
      return { hasPermission: true, source: 'super_admin' };
    }

    try {
      const { data: override } = await supabase
        .from('user_feature_overrides')
        .select('allowed')
        .eq('user_id', user.id)
        .eq('feature_id', featureId)
        .maybeSingle();

      if (override !== null) {
        return {
          hasPermission: override.allowed,
          source: 'override',
        };
      }

      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('profile_id')
        .eq('user_id', user.id);

      if (!userProfiles || userProfiles.length === 0) {
        return { hasPermission: false, source: 'denied' };
      }

      const profileIds = userProfiles.map(up => up.profile_id);

      const { data: profileFeatures } = await supabase
        .from('profile_features')
        .select('allowed')
        .in('profile_id', profileIds)
        .eq('feature_id', featureId);

      if (profileFeatures && profileFeatures.some(pf => pf.allowed)) {
        return { hasPermission: true, source: 'profile' };
      }

      return { hasPermission: false, source: 'denied' };
    } catch (error) {
      console.error('Error checking permission:', error);
      return { hasPermission: false, source: 'denied' };
    }
  };

  const buildMenuTree = (features: Feature[]): FeatureWithChildren[] => {
    const featureMap = new Map<string, FeatureWithChildren>();
    const rootItems: FeatureWithChildren[] = [];

    features.forEach(feature => {
      featureMap.set(feature.id, { ...feature, children: [] });
    });

    features.forEach(feature => {
      const item = featureMap.get(feature.id)!;

      if (feature.menu_parent_id) {
        const parent = featureMap.get(feature.menu_parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(item);
        }
      } else {
        rootItems.push(item);
      }
    });

    return rootItems;
  };

  const hasPermission = async (route: string): Promise<boolean> => {
    if (isSuperAdmin) return true;

    let feature = features.find(f => f.route === route);

    if (!feature) {
      const routeParts = route.split('/').filter(Boolean);

      if (routeParts.length > 1 && routeParts[routeParts.length - 1].match(/^[a-f0-9-]+$/)) {
        const basePath = '/' + routeParts.slice(0, -1).join('/');
        feature = features.find(f => f.route === basePath);
      }

      if (!feature) {
        const parentPath = route.split('/').slice(0, -1).join('/') || '/';
        feature = features.find(f => f.route === parentPath);
      }
    }

    if (!feature) return false;

    const permission = await checkPermission(feature.id);
    return permission.hasPermission;
  };

  return {
    features,
    menuItems,
    loading,
    isSuperAdmin,
    checkPermission,
    hasPermission,
    refreshPermissions: loadPermissions,
  };
}
