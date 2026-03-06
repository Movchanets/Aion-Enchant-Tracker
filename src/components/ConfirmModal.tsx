import { useEffect, useId } from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  cancelLabel = 'Скасувати',
  confirmLabel = 'Підтвердити',
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overscroll-contain"
      onClick={onCancel}
    >
      <div
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-modal="true"
        className="bg-aion-card border border-aion-border rounded-xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h3 id={titleId} className="text-lg font-bold text-aion-gold mb-3 text-balance">{title}</h3>
        <p id={descriptionId} className="text-aion-text/80 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-aion-border text-aion-text hover:bg-white/10 transition-colors text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-aion-danger/20 border border-aion-danger text-aion-danger hover:bg-aion-danger/30 transition-colors text-sm font-medium"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
