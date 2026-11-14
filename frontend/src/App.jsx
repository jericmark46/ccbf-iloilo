import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './components/public/PublicLayout';
import { AdminLayout, RequirePermission, RequireSuperadmin } from './components/admin/AdminLayout';
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
const SpecialAnnouncementAdmin = lazy(() => import('./pages/admin/SpecialAnnouncementAdmin'));
const BackupAdmin = lazy(() => import('./pages/admin/BackupAdmin'));
const NewsFeedPage = lazy(() => import('./pages/public/NewsFeedPage'));

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
            <Route path="feed" element={<NewsFeedPage />} />
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
            <Route
              path="posts"
              element={
                <RequirePermission section="posts">
                  <PostsAdmin />
                </RequirePermission>
              }
            />
            <Route
              path="pages"
              element={
                <RequirePermission section="pages">
                  <PagesAdmin />
                </RequirePermission>
              }
            />
            <Route
              path="media"
              element={
                <RequirePermission section="media">
                  <MediaAdmin />
                </RequirePermission>
              }
            />
            <Route
              path="comments"
              element={
                <RequirePermission section="comments">
                  <CommentsAdmin />
                </RequirePermission>
              }
            />
            <Route
              path="ministries"
              element={
                <RequirePermission section="ministries">
                  <MinistriesAdmin />
                </RequirePermission>
              }
            />
            <Route
              path="activities"
              element={
                <RequirePermission section="activities">
                  <ActivitiesAdmin />
                </RequirePermission>
              }
            />
            <Route
              path="giving"
              element={
                <RequirePermission section="giving">
                  <GivingAdmin />
                </RequirePermission>
              }
            />
            <Route
              path="messages"
              element={
                <RequirePermission section="messages">
                  <MessagesAdmin />
                </RequirePermission>
              }
            />
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
            <Route
              path="announcement"
              element={
                <RequireSuperadmin>
                  <SpecialAnnouncementAdmin />
                </RequireSuperadmin>
              }
            />
            <Route
              path="backup"
              element={
                <RequireSuperadmin>
                  <BackupAdmin />
                </RequireSuperadmin>
              }
            />
            <Route
              path="settings"
              element={
                <RequirePermission section="settings">
                  <SettingsAdmin />
                </RequirePermission>
              }
            />
            <Route path="account" element={<AccountAdmin />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
