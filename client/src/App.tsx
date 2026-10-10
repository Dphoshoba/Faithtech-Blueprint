import React, { Suspense, lazy } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from './lib/auth';
import { AuthProvider } from './lib/auth';
import AppLayout from './layouts/AppLayout';
import PublicLayout from './layouts/PublicLayout';
import { ToastProvider } from './components/ui/Toast';

// Eagerly load the login page (entry point)
import HomePage from './pages/HomePage';
import AssessmentListPage from './pages/assessments/AssessmentListPage';
import AssessmentTakePage from './pages/assessments/AssessmentTakePage';
import AssessmentResultsPage from './pages/assessments/AssessmentResultsPage';
import AdminAssessmentsPage from './pages/admin/AssessmentsPage';
import AdminTemplatesPage from './pages/admin/TemplatesPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminAnalyticsPage from './pages/admin/AnalyticsPage';
import AdminLeadsPage from './pages/admin/LeadsPage';
import AdminSettingsPage from './pages/admin/SettingsPage';
import TemplateBuilderPage from './pages/templates/TemplateBuilderPage';
import TemplateDetailPage from './pages/templates/TemplateDetailPage';
import ProfilePage from './pages/ProfilePage';
import HomePageMarketing from './pages/marketing/HomePage';

// Lazy-loaded heavy pages
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AssessmentBuilderPage = lazy(
  () => import('./pages/assessments/AssessmentBuilderPage')
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing site */}
      <Route path="/" element={<HomePageMarketing />} />

      {/* Public auth + public assessments */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<HomePage />} />
        <Route path="/register" element={<HomePage />} />
      </Route>

      {/* Protected app */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/assessments" element={<AssessmentListPage />} />
        <Route path="/assessments/:id" element={<AssessmentTakePage />} />
        <Route path="/assessments/results/:responseId" element={<AssessmentResultsPage />} />
        <Route path="/assessments/build" element={<AssessmentBuilderPage />} />
        <Route path="/assessments/build/:id" element={<AssessmentBuilderPage />} />

        <Route path="/templates" element={<TemplateDetailPage />} />
        <Route path="/templates/build" element={<TemplateBuilderPage />} />
        <Route path="/templates/build/:id" element={<TemplateBuilderPage />} />

        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin-only routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/assessments" element={<AdminRoute><AdminAssessmentsPage /></AdminRoute>} />
        <Route path="/admin/templates" element={<AdminRoute><AdminTemplatesPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />
        <Route path="/admin/leads" element={<AdminRoute><AdminLeadsPage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}