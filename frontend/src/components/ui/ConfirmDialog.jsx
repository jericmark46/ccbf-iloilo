import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Spinner } from './Loaders';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
  danger = true,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? 'btn btn-sm bg-red-600 text-white hover:bg-red-700' : 'btn btn-accent btn-sm'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner className="h-4 w-4 text-current" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={
            danger
              ? 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-500/10 text-red-500'
              : 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent'
          }
        >
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-soft">{description}</p>
        </div>
      </div>
    </Modal>
  );
}
