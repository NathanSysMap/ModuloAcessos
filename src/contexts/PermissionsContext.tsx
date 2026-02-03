import { createContext, useContext, ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Feature, FeatureWithChildren, PermissionCheck } from '../types';

interface PermissionsContextType {
  features: Feature[];
  menuItems: FeatureWithChildren[];
  loading: boolean;
  checkPermission: (featureId: string) => Promise<PermissionCheck>;
  hasPermission: (route: string) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const permissions = usePermissions();

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
}
