import React, { useEffect, useRef } from 'react';
import type { LeavePrompt } from '../shared/leave';

export function LeaveDialog({
  prompt,
  busy,
  error,
  onSave,
  onDiscard,
  onCancel,
}: {
  prompt: LeavePrompt;
  busy: boolean;
  error: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  useEffect(() => {
    previous.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancel.current?.focus();
    return () => {
      const element = previous.current;
      if (element && element.isConnected) element.focus();
    };
  }, []);
  const close = prompt.reason === 'close';
  const description = close
    ? '直接退出将丢失这些更改。'
    : prompt.reason === 'open'
      ? '打开其他工程前需要处理这些更改。'
      : '新建工程前需要处理这些更改。';
  function keyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (!busy) onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = Array.from(
      dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
    );
    if (!buttons.length) {
      event.preventDefault();
      dialog.current?.focus();
      return;
    }
    const first = buttons[0],
      last = buttons[buttons.length - 1],
      active = document.activeElement;
    if (event.shiftKey && (active === first || !buttons.includes(active as HTMLButtonElement))) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (active === last || !buttons.includes(active as HTMLButtonElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }
  return (
    <div className="modal-backdrop" onKeyDown={keyDown}>
      <div
        ref={dialog}
        className="modal leave-dialog"
        role="dialog"
        aria-modal="true"
        aria-busy={busy}
        aria-labelledby="leave-dialog-title"
        aria-describedby="leave-dialog-desc"
        tabIndex={-1}
      >
        <div className="modal-warning" aria-hidden="true">
          !
        </div>
        <h2 id="leave-dialog-title">{close ? '退出前保存更改？' : '继续前保存更改？'}</h2>
        <p id="leave-dialog-desc">
          “{prompt.projectName}”有尚未保存的更改。{description}
        </p>
        {busy && (
          <p className="help" role="status">
            正在保存…
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" ref={cancel} disabled={busy} onClick={onCancel}>
            取消
          </button>
          <button type="button" disabled={busy} onClick={onDiscard}>
            {close ? '不保存退出' : '不保存继续'}
          </button>
          <button type="button" className="primary" disabled={busy} onClick={onSave}>
            {close ? '保存并退出' : '保存并继续'}
          </button>
        </div>
      </div>
    </div>
  );
}
