import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { IconClose } from './Icons';

/** 从底部弹出的面板 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div class="sheet-head">
          <h2 class="sheet-title">{title}</h2>
          <button type="button" class="icon-btn" aria-label="关闭" onClick={onClose}>
            <IconClose />
          </button>
        </div>
        <div class="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** 需要确认的操作 */
export function Confirm({
  title, message, confirmText, danger, onConfirm, onClose,
}: {
  title: string;
  message: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={title} onClose={onClose}>
      <p class="sheet-text">{message}</p>
      <div class="grid2">
        <button type="button" class="btn" onClick={onClose}>取消</button>
        <button
          type="button"
          class={danger ? 'btn btn-danger-solid' : 'btn btn-primary'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </button>
      </div>
    </Sheet>
  );
}
