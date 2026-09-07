import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { EmployeeLayout } from './components/layout/EmployeeLayout.js';
import { AdminLayout } from './components/layout/AdminLayout.js';
import { useAuth } from './context/AuthContext.js';

// Pages
import { LoginPage } from './pages/auth/LoginPage.js';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage.js';
import { PollResultsPage } from './pages/employee/PollResultsPage.js';

import { AdminDashboardOverviewPage } from './pages/admin/AdminDashboardOverviewPage.js';
import { AdminPollsListPage } from './pages/admin/AdminPollsListPage.js';
import { AdminCreatePollPage } from './pages/admin/AdminCreatePollPage.js';
import { AdminFoodCatalogPage } from './pages/admin/AdminFoodCatalogPage.js';
import { AdminEmployeesPage } from './pages/admin/AdminEmployeesPage.js';
import { AdminAuditSecurityPage } from './pages/admin/AdminAuditSecurityPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';

const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <EmployeeDashboardPage />;
};

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Redirects /results to the active poll's results page
const ResultsRedirect: React.FC = () => {
  const [pollId, setPollId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    import('./utils/api.js').then(({ api }) => {
      api.get('/polls/active')
        .then((res) => {
          const poll = res.data?.data?.poll;
          if (poll?._id) {
            setPollId(poll._id);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pollId) {
    return <Navigate to={`/polls/${pollId}/results`} replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/login" element={<LoginPage />} />

      {/* Employee / Core Platform Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route path="dashboard" element={<DashboardRedirect />} />
        <Route path="poll/:id" element={<EmployeeDashboardPage />} />
        <Route path="polls/:id" element={<EmployeeDashboardPage />} />
        <Route path="polls/:id/results" element={<PollResultsPage />} />
        <Route path="results" element={<ResultsRedirect />} />
      </Route>

      {/* Admin Protected Console Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardOverviewPage />} />
        <Route path="today" element={<Navigate to="/admin/polls" replace />} />
        <Route path="polls" element={<AdminPollsListPage />} />
        <Route path="polls/today" element={<Navigate to="/admin/polls" replace />} />
        <Route path="polls/create" element={<AdminCreatePollPage />} />
        <Route path="polls/:id" element={<PollResultsPage />} />
        <Route path="foods" element={<AdminFoodCatalogPage />} />
        <Route path="employees" element={<AdminEmployeesPage />} />
        <Route path="security" element={<AdminAuditSecurityPage />} />
        <Route path="audit" element={<Navigate to="/admin/security" replace />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};
