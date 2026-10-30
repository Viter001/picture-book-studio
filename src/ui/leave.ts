import type { LeavePrompt, LeaveResult } from '../shared/leave';
export type { LeaveChoice, LeavePrompt, LeaveReason, LeaveResult } from '../shared/leave';

export type LeaveState = {
  prompt: LeavePrompt;
  busy: boolean;
  error: string;
} | null;

export type LeaveAction =
  | { type: 'request'; prompt: LeavePrompt }
  | { type: 'responding' }
  | { type: 'result'; result: LeaveResult }
  | { type: 'cancel' };

export function humanizeSaveError(error?: string) {
  if (!error) return '保存失败，请重试。';
  if (/ENOSPC|no space left/i.test(error)) return '磁盘空间不足，无法保存工程。请清理空间后重试。';
  if (/EPERM|EACCES|operation not permitted|permission denied|read-only/i.test(error))
    return '无法写入工程文件，请检查文件是否被占用或设为只读，然后重试。';
  return error;
}

export function leaveReducer(state: LeaveState, action: LeaveAction): LeaveState {
  switch (action.type) {
    case 'request':
      return { prompt: action.prompt, busy: false, error: '' };
    case 'responding':
      return state && !state.busy ? { ...state, busy: true, error: '' } : state;
    case 'result':
      if (!state || state.prompt.id !== action.result.id) return state;
      if (action.result.ok || action.result.closed) return null;
      return {
        ...state,
        busy: false,
        error: humanizeSaveError(action.result.error),
      };
    case 'cancel':
      return null;
  }
}

export type KeyIntent = 'ignore' | 'exit-preview' | 'save' | 'undo' | 'redo';

export type KeyLike = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  targetTag?: string;
};

/**
 * The leave dialog owns Escape while it is open. Preview Escape must not close
 * the player underneath the confirmation.
 */
export function globalKeyIntent(
  key: KeyLike,
  state: { preview: boolean; leaveOpen: boolean },
): KeyIntent {
  if (state.leaveOpen) return 'ignore';
  if (key.key === 'Escape') return 'exit-preview';
  if (state.preview) return 'ignore';
  const modified = !!(key.ctrlKey || key.metaKey);
  if (modified && key.key.toLowerCase() === 's') return 'save';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(key.targetTag ?? '')) return 'ignore';
  if (modified && key.key.toLowerCase() === 'z') return key.shiftKey ? 'redo' : 'undo';
  return 'ignore';
}
