import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AppProvider, useApp } from './context/AppContext';

const ParticleField = lazy(() => import('./components/three/ParticleField'));

// Layout
import AppLayout from './components/layout/AppLayout';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';

// Public pages
import Landing   from './pages/Landing';
import About     from './pages/About';

// App pages
import Dashboard        from './pages/Dashboard';
import Challenges       from './pages/Challenges';
import ChallengeDetails from './pages/ChallengeDetails';
import Leaderboard      from './pages/Leaderboard';
import Achievements     from './pages/Achievements';
import Events           from './pages/Events';
import Profile          from './pages/Profile';
import Settings         from './pages/Settings';

// Admin
import AdminLayout       from './pages/admin/AdminLayout';
import AdminDashboard    from './pages/admin/AdminDashboard';
import ManageChallenges  from './pages/admin/ManageChallenges';
import CreateChallenge   from './pages/admin/CreateChallenge';
import AdminCategories   from './pages/admin/AdminCategories';
import AdminUsers        from './pages/admin/AdminUsers';
import AdminSubmissions  from './pages/admin/AdminSubmissions';
import AdminSettings     from './pages/admin/AdminSettings';
import AdminAuditLogs    from './pages/admin/AdminAuditLogs';
import AdminAnalytics    from './pages/admin/AdminAnalytics';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminPlaceholder  from './pages/admin/AdminPlaceholder';

// Route guards
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useApp();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function OnboardingRoute({ children }) {
  const { isAuthenticated, user, loading } = useApp();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.onboardingCompleted) return <Navigate to="/dashboard" replace />;
  return children;
}

function PrivateRoute({ children }) {
  const { isAuthenticated, user, loading } = useApp();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useApp();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth pages (no navbar layout) */}
      <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Landing + public pages (with navbar, no sidebar) */}
      <Route element={<AppLayout showSidebar={false} />}>
        <Route path="/"     element={<Landing />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* Leaderboard / Events — accessible without login */}
      <Route element={<AppLayout showSidebar={true} />}>
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/events"      element={<Events />} />
      </Route>

      {/* Authenticated app pages */}
      <Route element={<PrivateRoute><AppLayout showSidebar={true} /></PrivateRoute>}>
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route path="/challenges"        element={<Challenges />} />
        <Route path="/challenges/:id"    element={<ChallengeDetails />} />
        <Route path="/achievements"      element={<Achievements />} />
        <Route path="/profile"           element={<Profile />} />
        <Route path="/settings"          element={<Settings />} />
      </Route>

      {/* Admin pages */}
      <Route path="/admin" element={<AdminRoute><AppLayout showSidebar={false} showFooter={false} /></AdminRoute>}>
        <Route element={<AdminLayout />}>
          <Route index                      element={<AdminDashboard />} />
          <Route path="challenges"          element={<ManageChallenges />} />
          <Route path="challenges/new"      element={<CreateChallenge />} />
          <Route path="challenges/:id/edit" element={<CreateChallenge />} />
          <Route path="categories"          element={<AdminCategories />} />
          <Route path="users"               element={<AdminUsers />} />
          <Route path="submissions"         element={<AdminSubmissions />} />
          <Route path="analytics"           element={<AdminAnalytics />} />
          <Route path="announcements"       element={<AdminAnnouncements />} />
          <Route path="settings"            element={<AdminSettings />} />
          <Route path="audit-logs"          element={<AdminAuditLogs />} />
          <Route path="events"              element={<AdminPlaceholder title="Event Management" />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Suspense fallback={null}>
          <ParticleField />
        </Suspense>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3500}
          newestOnTop
          closeOnClick
          pauseOnHover
          pauseOnFocusLoss={false}
          theme="dark"
          toastStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-bright)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
          }}
        />
      </AppProvider>
    </BrowserRouter>
  );
}
