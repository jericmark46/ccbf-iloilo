import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './components/public/PublicLayout';
import { AdminLayout, RequireSuperadmin } from './components/admin/AdminLayout';
import { FullPageLoader } from './components/ui/Loaders';
import HomePage from './pages/public/HomePage';
import UpdatesPage from './pages/public/UpdatesPage';
import UpdateDetailPage from './pages/public/UpdateDetailPage';
import MinistriesPage from './pages/public/MinistriesPage';
import MinistryDetailPage from './pages/public/MinistryDetailPage';
import ActivitiesPage from './pages/public/ActivitiesPage';
import ContactPage from './pages/public/ContactPage';
import PageView from './pages/public/PageView';
import NotFoundPage from './pages/public/NotFoundPage';
import { useSite } from './context/SiteContext';
import { useTheme } from './context/ThemeContext';

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const PostsAdmin = lazy(() => import('./pages/admin/PostsAdmin'));
const PagesAdmin = lazy(() => import('./pages/admin/PagesAdmin'));
const MinistriesAdmin = lazy(() => import('./pages/admin/MinistriesAdmin'));
const ActivitiesAdmin = lazy(() => import('./pages/admin/ActivitiesAdmin'));
const GivingAdmin = lazy(() => import('./pages/admin/GivingAdmin'));
const MediaAdmin = lazy(() => import('./pages/admin/MediaAdmin'));
const CommentsAdmin = lazy(() => import('./pages/admin/CommentsAdmin'));
const MessagesAdmin = lazy(() => import('./pages/admin/MessagesAdmin'));
const NavigationAdmin = lazy(() => import('./pages/admin/NavigationAdmin'));
const UsersAdmin = lazy(() => import('./pages/admin/UsersAdmin'));
const ActivityLogAdmin = lazy(() => import('./pages/admin/ActivityLogAdmin'));
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'));
const AccountAdmin = lazy(() => import('./pages/admin/AccountAdmin'));

function ScrollManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const frame = requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo(0, 0);
      });
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, key]);

  return null;
}

/** Applies the church's preferred theme until the visitor chooses their own. */
function ThemeDefaults() {
  const { settings } = useSite();
  const { setMode, setAccent } = useTheme();

  useEffect(() => {
    const theme = settings?.theme;
    if (!theme) return;
    if (!localStorage.getItem('cc_theme_mode') && theme.defaultMode) setMode(theme.defaultMode);
    if (!localStorage.getItem('cc_theme_accent') && theme.accent) setAccent(theme.accent);
  }, [settings, setMode, setAccent]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <ThemeDefaults />
      <Suspense fallback={<FullPageLoader label="Loading…" />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="updates" element={<UpdatesPage />} />
            <Route path="updates/:id" element={<UpdateDetailPage />} />
            <Route path="ministries" element={<MinistriesPage />} />
            <Route path="ministries/:slug" element={<MinistryDetailPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="pages/:slug" element={<PageView />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="posts" element={<PostsAdmin />} />
            <Route path="pages" element={<PagesAdmin />} />
            <Route path="media" element={<MediaAdmin />} />
            <Route path="comments" element={<CommentsAdmin />} />
            <Route path="ministries" element={<MinistriesAdmin />} />
            <Route path="activities" element={<ActivitiesAdmin />} />
            <Route path="giving" element={<GivingAdmin />} />
            <Route path="messages" element={<MessagesAdmin />} />
            <Route
              path="navigation"
              element={
                <RequireSuperadmin>
                  <NavigationAdmin />
                </RequireSuperadmin>
              }
            />
            <Route
              path="users"
              element={
                <RequireSuperadmin>
                  <UsersAdmin />
                </RequireSuperadmin>
              }
            />
            <Route
              path="logs"
              element={
                <RequireSuperadmin>
                  <ActivityLogAdmin />
                </RequireSuperadmin>
              }
            />
            <Route path="settings" element={<SettingsAdmin />} />
            <Route path="account" element={<AccountAdmin />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
