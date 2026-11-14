import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  Camera,
  HandCoins,
  HeartHandshake,
  Image,
  Inbox,
  MessageCircle,
  NotebookPen,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { api, getError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Panel, PanelHeader, StatCard } from '../../components/admin/AdminUI';
import { VisitsChart } from '../../components/admin/VisitsChart';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Loaders';
import { formatDate, formatShortDate, relativeTime } from '../../lib/dates';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const quickActions = [
  { label: 'Write an update', hint: 'Share news with the church', to: '/admin/posts?compose=1', icon: NotebookPen, section: 'posts' },
  { label: 'Upload media', hint: 'Photos, videos, and files', to: '/admin/media', icon: Camera, section: 'media' },
  { label: 'Edit home background', hint: 'Image or video hero', to: '/admin/settings?tab=background', icon: Image, section: 'settings' },
  { label: 'Add an activity', hint: 'Gatherings and events', to: '/admin/activities?compose=1', icon: CalendarDays, section: 'activities' },
];

export default function Dashboard() {
  const { user, canAccess } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/admin/stats')
      .then(({ data: payload }) => active && setData(payload))
      .catch((err) => active && toast.error(getError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [toast]);

  // Traffic is a nice-to-have: a failure here should never block the dashboard.
  useEffect(() => {
    let active = true;
    api
      .get('/admin/visits')
      .then(({ data: payload }) => active && setVisits(payload))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const totals = data?.totals || {};

  const previousViews = visits?.previous?.totalViews || 0;
  const visitDelta =
    visits && previousViews > 0
      ? Math.round(((visits.totalViews - previousViews) / previousViews) * 100)
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        title={`${greeting()}.`}
        description="Here is the pulse of Calvary Chapel Iloilo — what is being published, who is reaching out, and what is coming up."
        actions={
          <>
            {canAccess('posts') && (
              <Link to="/admin/posts?compose=1" className="btn btn-accent btn-sm">
                <Plus className="h-3.5 w-3.5" /> New update
              </Link>
            )}
            <Link to="/" className="btn btn-outline btn-sm">
              View website
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[6.5rem]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={NotebookPen}
              label="Updates"
              value={totals.posts ?? 0}
              hint={`${totals.publishedPosts ?? 0} published`}
              tone="accent"
            />
            <StatCard
              icon={Inbox}
              label="Unread messages"
              value={totals.unreadMessages ?? 0}
              hint="From the contact form"
              tone={totals.unreadMessages ? 'amber' : 'sky'}
            />
            <StatCard
              icon={MessageCircle}
              label="Comments"
              value={totals.comments ?? 0}
              hint="Across all updates"
              tone="violet"
            />
            <StatCard
              icon={Image}
              label="Media files"
              value={totals.media ?? 0}
              hint="Images and videos"
              tone="emerald"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={HeartHandshake} label="Ministries" value={totals.ministries ?? 0} tone="rose" />
            <StatCard icon={CalendarDays} label="Activities" value={totals.activities ?? 0} tone="sky" />
            <StatCard icon={HandCoins} label="Giving options" value="Live" hint="Managed under Giving" tone="amber" />
            {user?.role === 'superadmin' ? (
              <StatCard icon={Users} label="Staff accounts" value={totals.users ?? 0} tone="violet" />
            ) : (
              <StatCard icon={Sparkles} label="Role" value="Admin" hint="Content & media steward" tone="accent" />
            )}
          </div>

          {visits && (
            <Panel>
              <PanelHeader
                title="Site visits"
                description={`${visits.label} · page views recorded on the public website`}
                actions={<Badge variant="accent">{visits.isCurrentMonth ? 'This month' : visits.label}</Badge>}
              />
              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-center">
                <div className="min-w-0">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-faint">
                    Page views
                  </p>
                  <p className="mt-1.5 font-display text-[2.6rem] font-semibold leading-none text-ink">
                    {visits.totalViews}
                  </p>
                  <p className="mt-2 text-xs text-soft">
                    {visits.uniqueVisitors}{' '}
                    {visits.uniqueVisitors === 1 ? 'unique visitor' : 'unique visitors'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {visitDelta !== null && (
                      <Badge variant={visitDelta >= 0 ? 'success' : 'warning'}>
                        {visitDelta >= 0 ? '+' : ''}
                        {visitDelta}% vs last month
                      </Badge>
                    )}
                    {visits.peakDay && <Badge>Busiest {formatShortDate(visits.peakDay.day)}</Badge>}
                  </div>
                </div>
                <div className="min-w-0">
                  <VisitsChart days={visits.days} />
                </div>
              </div>
              {visits.topPages?.length > 0 && (
                <div className="border-t border-line/70 px-5 py-4 sm:px-6">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-faint">
                    Most visited pages
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visits.topPages.map((page) => (
                      <span
                        key={page.path}
                        className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-[0.7rem]"
                      >
                        <span className="truncate font-medium text-ink">{page.path}</span>
                        <span className="shrink-0 text-faint">{page.views}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          )}

          <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
            <Panel>
              <PanelHeader
                title="Recent updates"
                description="The latest posts from the church."
                actions={
                  canAccess('posts') && (
                    <Link
                      to="/admin/posts"
                      className="inline-flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent hover:underline"
                    >
                      Manage <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )
                }
              />
              <div className="divide-y divide-line/70">
                {(data?.recentPosts || []).map((post) => (
                  <div key={post.id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{post.title || 'Untitled update'}</p>
                      <p className="mt-0.5 text-[0.7rem] text-faint">
                        {post.category} · {relativeTime(post.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {post.pinned && <Badge variant="accent">Pinned</Badge>}
                      <Badge variant={post.published ? 'success' : 'warning'}>
                        {post.published ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!data?.recentPosts?.length && (
                  <p className="px-6 py-10 text-center text-sm text-soft">No updates yet.</p>
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Latest comments"
                description="Engagement from the church family."
                actions={
                  canAccess('comments') && (
                    <Link
                      to="/admin/comments"
                      className="inline-flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent hover:underline"
                    >
                      Moderate <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )
                }
              />
              <div className="divide-y divide-line/70">
                {(data?.recentComments || []).map((comment) => (
                  <div key={comment.id} className="px-5 py-3.5 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-accent">
                        {comment.name}
                      </p>
                      <span className="text-[0.65rem] text-faint">{relativeTime(comment.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-soft">{comment.body}</p>
                  </div>
                ))}
                {!data?.recentComments?.length && (
                  <p className="px-6 py-10 text-center text-sm text-soft">No comments to review.</p>
                )}
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">
            <Panel>
              <PanelHeader title="Quick actions" description="Jump straight into the work." />
              <div className="grid gap-2 p-4 sm:grid-cols-2">
                {quickActions.filter((action) => canAccess(action.section)).map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="group flex items-start gap-3 rounded-2xl border border-line/70 bg-surface/50 p-3.5 transition hover:border-accent/40 hover:bg-accent/[0.04]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-ink">{action.label}</span>
                        <span className="mt-0.5 block text-[0.68rem] text-faint">{action.hint}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Upcoming activities"
                description="Gatherings on the calendar."
                actions={
                  canAccess('activities') && (
                    <Link
                      to="/admin/activities"
                      className="inline-flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent hover:underline"
                    >
                      Calendar <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )
                }
              />
              <div className="divide-y divide-line/70">
                {(data?.upcomingActivities || []).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-center text-accent">
                      <span className="font-display text-sm font-semibold leading-none">
                        {activity.startAt ? new Date(activity.startAt).getDate() : '—'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{activity.title}</p>
                      <p className="mt-0.5 text-[0.7rem] text-faint">
                        {formatDate(activity.startAt)} {activity.location ? `· ${activity.location}` : ''}
                      </p>
                    </div>
                    <Badge variant="accent">{activity.category || 'Gathering'}</Badge>
                  </div>
                ))}
                {!data?.upcomingActivities?.length && (
                  <EmptyState
                    icon={CalendarDays}
                    title="No activities scheduled"
                    description="Add the next gathering so the church can plan ahead."
                    className="border-0 bg-transparent py-8"
                  />
                )}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
