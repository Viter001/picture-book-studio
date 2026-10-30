export type StateSync = { ok: boolean; error?: string };

/**
 * Blur the focused editor so its blur handler commits the pending edit before
 * the following state read acts as a queue barrier.
 */
export async function flushFocusedEditor(
  active: { blur(): void } | null,
  sync: () => Promise<StateSync>,
): Promise<string | null> {
  active?.blur();
  const result = await sync();
  return result.ok ? null : result.error || '状态同步失败';
}
