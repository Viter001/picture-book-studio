export type LeaveChoice = 'save' | 'discard' | 'cancel';
export type LeaveReason = 'close' | 'open' | 'new';
export type LeavePrompt = {
  id: string;
  reason: LeaveReason;
  projectName: string;
};
export type LeaveResult = {
  id: string;
  ok: boolean;
  error?: string;
  closed?: boolean;
};
