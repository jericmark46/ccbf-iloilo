import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { api, getError } from '../../api/client';
import { PostCard } from '../../components/public/PostCard';
import { ChurchSidebar } from '../../components/public/ChurchSidebar';
import { PageHero } from '../../components/public/PageHero';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Loaders';
import { cn } from '../../lib/utils';
import { useSite } from '../../context/SiteContext';
import { copyValue } from '../../lib/copy';

const ALL_CATEGORIES = 'All';

function PostSkeleton() {
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
      <div className="mt-5 aspect-[16/9] w-full animate-pulse rounded-2xl bg-ink/[0.06]" />
    </div>
  );
}

export default function UpdatesPage() {
  const { settings, categories } = useSite();
  const copy = (key) => copyValue(settings, key);
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Only categories the church has left visible appear as filters.
  const categoryOptions = useMemo(
    () => [ALL_CATEGORIES, ...(categories || []).map((item) => item.name)],
    [categories]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/public/posts', { params: { page: 1, limit: 8, category } })
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
  }, [category]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await api.get('/public/posts', {
        params: { page: page + 1, limit: 8, category },
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
        kicker={copy('updates_hero_kicker')}
        title={copy('updates_hero_title')}
        subtitle={copy('updates_hero_subtitle')}
        image={copy('updates_hero_image')}
      />

      <section className="py-16 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.1em] transition',
                    category === item
                      ? 'border-accent bg-accent text-inverse'
                      : 'border-line bg-elevated text-soft hover:border-accent/40 hover:text-accent'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-[0.72rem] text-faint">
              <span>
                {loading ? 'Gathering updates…' : `${total} ${total === 1 ? 'update' : 'updates'}`}
              </span>
              {loading && <Spinner className="h-4 w-4" />}
            </div>

            {error ? (
              <div className="mt-8">
                <EmptyState
                  icon={RefreshCw}
                  title="We could not load the updates"
                  description={error}
                  action={
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setCategory(category)}>
                      Try again
                    </button>
                  }
                />
              </div>
            ) : loading ? (
              <div className="mt-6 space-y-6">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : items.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  icon={MessageSquare}
                  title="No updates here yet"
                  description={
                    category === 'All'
                      ? 'The church family has not posted an update yet. Please check back soon.'
                      : `There are no ${category.toLowerCase()} updates at the moment. Try another category.`
                  }
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
                      {copy('updates_load_more')}
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
