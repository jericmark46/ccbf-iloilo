import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { api, getError } from '../../api/client';
import { PostCard } from '../../components/public/PostCard';
import { ChurchSidebar } from '../../components/public/ChurchSidebar';
import { PageHero } from '../../components/public/PageHero';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader } from '../../components/ui/Loaders';
import { useSite } from '../../context/SiteContext';
import { copyValue } from '../../lib/copy';

export default function UpdateDetailPage() {
  const { settings } = useSite();
  const copy = (key) => copyValue(settings, key);
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(`/public/posts/${id}`)
      .then(({ data }) => active && setPost(data.post))
      .catch((err) => active && setError(getError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <div className="pt-40"><InlineLoader label="Loading update…" /></div>;

  if (error || !post) {
    return (
      <div className="container-x py-44">
        <EmptyState
          icon={MessageSquare}
          title="We could not find that update"
          description={error || 'It may have been removed or is no longer published.'}
          action={
            <Link to="/updates" className="btn btn-accent btn-sm">
              Back to updates
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <PageHero
        kicker={copy('update_detail_kicker')}
        title={post.title || copy('update_detail_fallback_title')}
        subtitle={`${post.category} · ${post.authorName || 'Church Admin'}`}
        image={post.coverImage || '/images/worship.png'}
        compact
      />

      <section className="py-14 sm:py-16">
        <div className="container-x grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <Link
              to="/updates"
              className="mb-5 inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-faint transition hover:text-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {copy('update_detail_back')}
            </Link>
            <PostCard post={post} initialCommentsOpen />
          </div>
          <ChurchSidebar className="lg:sticky lg:top-28 lg:self-start" />
        </div>
      </section>
    </>
  );
}
