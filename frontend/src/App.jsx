import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BrandingPage from './pages/BrandingPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';

// Layout
import DashboardLayout from './components/shared/DashboardLayout';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="users" element={<PrivateRoute roles={['admin', 'superadmin']}><UsersPage /></PrivateRoute>} />
      <Route path="analytics" element={<PrivateRoute roles={['admin', 'superadmin']}><AnalyticsPage /></PrivateRoute>} />
      <Route path="reports" element={<PrivateRoute roles={['admin', 'superadmin']}><ReportsPage /></PrivateRoute>} />
      <Route path="branding" element={<PrivateRoute roles={['admin', 'superadmin']}><BrandingPage /></PrivateRoute>} />
      <Route path="settings" element={<PrivateRoute roles={['admin', 'superadmin']}><SettingsPage /></PrivateRoute>} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <AppRoutes />
    </AuthProvider>
  );
}
