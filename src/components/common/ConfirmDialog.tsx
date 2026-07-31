interface Props {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Xác nhận',
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg bg-surface p-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="mt-2 text-sm text-text-muted">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded bg-surface-alt px-4 py-2 text-sm hover:text-text"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-primary px-4 py-2 text-sm font-medium hover:bg-primary-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
