import { useEffect, useState } from 'react';
import { Newspaper, RefreshCw } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useSite } from '../../context/SiteContext';
import { copyValue } from '../../lib/copy';
import { PostCard } from '../../components/public/PostCard';
import { ChurchSidebar } from '../../components/public/ChurchSidebar';
import { PageHero } from '../../components/public/PageHero';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loaders';

function FeedSkeleton() {
  return (
    <div className="rounded-3xl border border-line bg-elevated p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded-full bg-ink/[0.06]" />
        <div className="space-y-2">
          <div className="h-3 w-28 animate-pulse rounded bg-ink/[0.06]" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-ink/[0.05]" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="h-3 w-full animate-pulse rounded bg-ink/[0.05]" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-ink/[0.05]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-ink/[0.05]" />
      </div>
      <div className="mt-5 aspect-[4/3] w-full animate-pulse rounded-2xl bg-ink/[0.06]" />
    </div>
  );
}

export default function NewsFeedPage() {
  const { settings } = useSite();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/public/posts', { params: { page: 1, limit: 8, feed: 1 } })
      .then(({ data }) => {
        if (!active) return;
        setItems(data.items || []);
        setPage(1);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      })
      .catch((err) => active && setError(getError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await api.get('/public/posts', {
        params: { page: page + 1, limit: 8, feed: 1 },
      });
      setItems((current) => [...current, ...(data.items || [])]);
      setPage(data.page);
      setPages(data.pages);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <PageHero
        kicker="Church life"
        title="News feed"
        subtitle="Youth camps, dedications, outreach, and the everyday moments happening in our church family."
        image={copyValue(settings, 'updates_hero_image')}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <div className="flex items-center justify-between text-[0.72rem] text-faint">
              <span>
                {loading ? 'Loading the feed…' : `${total} ${total === 1 ? 'story' : 'stories'}`}
              </span>
              {loading && <Spinner className="h-4 w-4" />}
            </div>

            {error ? (
              <div className="mt-6">
                <EmptyState
                  icon={RefreshCw}
                  title="We could not load the news feed"
                  description={error}
                  action={
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setReloadKey((key) => key + 1)}
                    >
                      Try again
                    </button>
                  }
                />
              </div>
            ) : loading ? (
              <div className="mt-6 space-y-6">
                <FeedSkeleton />
                <FeedSkeleton />
              </div>
            ) : items.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={Newspaper}
                  title="No news stories yet"
                  description="When the church shares what God is doing, the moments will appear here."
                />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {items.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {page < pages && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn btn-outline btn-sm"
                    >
                      {loadingMore && <Spinner className="h-4 w-4" />}
                      {copyValue(settings, 'updates_load_more')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <ChurchSidebar className="lg:sticky lg:top-28 lg:self-start" />
        </div>
      </section>
    </>
  );
}
