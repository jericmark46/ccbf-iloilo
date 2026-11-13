import { useCallback, useEffect, useState } from 'react';
import { History, RotateCw } from 'lucide-react';
import { api, getError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useDebounced } from '../../hooks/useUi';
import { PageHeader, Panel, SearchInput, Toolbar } from '../../components/admin/AdminUI';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineLoader } from '../../components/ui/Loaders';
import { formatDateTime, relativeTime } from '../../lib/dates';
import { actionTone, actionTileTone, entityMeta } from '../../lib/audit';
import { cn } from '../../lib/utils';

const PAGE_SIZE = 25;

export default function ActivityLogAdmin() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [facets, setFacets] = useState({ entities: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState('all');
  const [action, setAction] = useState('all');
  const debouncedQuery = useDebounced(query, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (entity !== 'all') params.entity = entity;
      if (action !== 'all') params.action = action;
      const { data } = await api.get('/admin/logs', { params });
      setItems(data.items || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      if (data.facets) setFacets(data.facets);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, entity, action, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, entity, action]);

  const filtered = debouncedQuery.trim() || entity !== 'all' || action !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Activity log"
        description="Every change made to the website, newest first — who made it, what changed, and when. Entries are permanent and cannot be edited."
        actions={
          <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
            <RotateCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
          </button>
        }
      />

      <Panel>
        <div className="border-b border-line/70 px-4 py-4 sm:px-5">
          <Toolbar>
            <SearchInput value={query} onChange={setQuery} placeholder="Search changes, names, or emails…" />
            <select
              className="field w-auto py-2.5"
              value={entity}
              onChange={(event) => setEntity(event.target.value)}
              aria-label="Filter by area"
            >
              <option value="all">All areas</option>
              {facets.entities.map((key) => (
                <option key={key} value={key}>
                  {entityMeta(key).label}
                </option>
              ))}
            </select>
            <select
              className="field w-auto py-2.5"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              aria-label="Filter by action"
            >
              <option value="all">All actions</option>
              {facets.actions.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </Toolbar>
        </div>

        {loading ? (
          <InlineLoader label="Reading the log…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={History}
            title={filtered ? 'No matching entries' : 'No changes recorded yet'}
            description={
              filtered
                ? 'Try a different search term or clear the filters.'
                : 'As soon as someone edits the website, it will show up here.'
            }
            className="m-5"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {items.map((entry) => {
              const meta = entityMeta(entry.entity);
              const Icon = meta.icon;
              return (
                <div key={entry.id} className="flex gap-3.5 px-4 py-3.5 sm:px-5">
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                      actionTileTone(entry.action)
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-soft">
                      <span className="font-semibold text-ink">{entry.actorName}</span>{' '}
                      <span className="text-ink/80">{entry.summary}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <Badge variant={actionTone(entry.action)}>{entry.action}</Badge>
                      <span className="text-[0.68rem] text-faint" title={entry.path}>
                        {meta.label}
                      </span>
                      <span
                        className="text-[0.68rem] text-faint"
                        title={formatDateTime(entry.createdAt)}
                      >
                        {relativeTime(entry.createdAt)}
                      </span>
                      {entry.fields?.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                          {entry.fields.map((field) => (
                            <span
                              key={field}
                              className="rounded border border-line px-1.5 py-0.5 text-[0.6rem] text-faint"
                            >
                              {field}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line/70 px-5 py-3">
            <p className="text-[0.7rem] text-faint">
              Page {page} of {pages} · {total} entries
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page >= pages}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
