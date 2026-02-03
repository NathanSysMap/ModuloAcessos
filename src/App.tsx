import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PermissionsProvider, usePermissionsContext } from './contexts/PermissionsContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Home } from './pages/Home';
import { UsersList } from './pages/users/UsersList';
import { UserForm } from './pages/users/UserForm';
import { ProfilesList } from './pages/profiles/ProfilesList';
import { ProfileForm } from './pages/profiles/ProfileForm';
import { FeaturesList } from './pages/features/FeaturesList';
import { FeatureForm } from './pages/features/FeatureForm';
import { DynamicFeaturePage } from './pages/DynamicFeaturePage';

function DynamicRoutes() {
  const { features, loading } = usePermissionsContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  const customRoutes = new Set([
    '/',
    '/home',
    '/users',
    '/users/new',
    '/users/:id',
    '/profiles',
    '/profiles/new',
    '/profiles/:id',
    '/features',
    '/features/new',
    '/features/:id',
  ]);

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/new"
          element={
            <ProtectedRoute>
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles"
          element={
            <ProtectedRoute>
              <ProfilesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles/new"
          element={
            <ProtectedRoute>
              <ProfileForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles/:id"
          element={
            <ProtectedRoute>
              <ProfileForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/features"
          element={
            <ProtectedRoute>
              <FeaturesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/features/new"
          element={
            <ProtectedRoute>
              <FeatureForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/features/:id"
          element={
            <ProtectedRoute>
              <FeatureForm />
            </ProtectedRoute>
          }
        />

        {features
          .filter(feature => !customRoutes.has(feature.route))
          .map(feature => (
            <Route
              key={feature.id}
              path={feature.route}
              element={
                <ProtectedRoute>
                  <DynamicFeaturePage />
                </ProtectedRoute>
              }
            />
          ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function AuthRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <PermissionsProvider>
      <DynamicRoutes />
    </PermissionsProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
