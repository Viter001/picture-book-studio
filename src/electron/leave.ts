import type { LeaveChoice, LeavePrompt, LeaveReason, LeaveResult } from '../shared/leave';
export type { LeaveChoice, LeavePrompt, LeaveReason, LeaveResult } from '../shared/leave';

export type LeaveFlow = {
  isDirty: () => boolean;
  id: () => string;
  projectName: () => string;
  request: (prompt: LeavePrompt) => void;
  nextChoice: (id: string) => Promise<LeaveChoice>;
  save: () => Promise<void>;
  notify: (result: LeaveResult) => void;
};

export function isTrustedSender(
  sender: unknown,
  frame: unknown,
  expectedSender: unknown,
  expectedFrame: unknown,
) {
  return sender === expectedSender && frame === expectedFrame;
}

/**
 * Ask before leaving a dirty project. A failed save keeps the same prompt open
 * and waits for a retry or cancel, so the project is never discarded on error.
 */
export async function confirmLeave(flow: LeaveFlow, reason: LeaveReason): Promise<boolean> {
  if (!flow.isDirty()) return true;
  const id = flow.id();
  flow.request({ id, reason, projectName: flow.projectName() });
  for (;;) {
    const choice = await flow.nextChoice(id);
    if (choice === 'cancel') return false;
    if (choice === 'discard') {
      flow.notify({ id, ok: true, closed: true });
      return true;
    }
    try {
      await flow.save();
      flow.notify({ id, ok: true, closed: true });
      return true;
    } catch (error) {
      flow.notify({
        id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
