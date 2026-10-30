import test from 'node:test';
import assert from 'node:assert/strict';
import { globalKeyIntent, leaveReducer, type LeaveState } from '../src/ui/leave.ts';
import type { LeavePrompt } from '../src/shared/leave.ts';

const prompt: LeavePrompt = { id: 'p1', reason: 'close', projectName: '林间来信' };

test('requesting confirmation opens the dialog and cancel dismisses it', () => {
  let state: LeaveState = leaveReducer(null, { type: 'request', prompt });
  assert.equal(state?.prompt.id, 'p1');
  assert.equal(state?.busy, false);
  state = leaveReducer(state, { type: 'cancel' });
  assert.equal(state, null);
});

test('save failure keeps the dialog open with the error and re-enables its actions', () => {
  let state: LeaveState = leaveReducer(null, { type: 'request', prompt });
  state = leaveReducer(state, { type: 'responding' });
  assert.equal(state?.busy, true);
  state = leaveReducer(state, {
    type: 'result',
    result: { id: 'p1', ok: false, error: '磁盘已满' },
  });
  assert.equal(state?.busy, false);
  assert.equal(state?.error, '磁盘已满');
  assert.equal(state?.prompt.id, 'p1');
});

test('stale results cannot close a newer confirmation', () => {
  const state = leaveReducer(null, { type: 'request', prompt });
  const next = leaveReducer(state, {
    type: 'result',
    result: { id: 'older', ok: true, closed: true },
  });
  assert.equal(next, state);
});

test('a successful save or discard closes the dialog', () => {
  const state = leaveReducer(null, { type: 'request', prompt });
  assert.equal(
    leaveReducer(state, {
      type: 'result',
      result: { id: 'p1', ok: true, closed: true },
    }),
    null,
  );
  assert.equal(leaveReducer(state, { type: 'cancel' }), null);
});

test('preview Escape is ignored while the leave dialog is open, then exits preview', () => {
  let state: LeaveState = leaveReducer(null, { type: 'request', prompt });
  assert.equal(
    globalKeyIntent({ key: 'Escape' }, { preview: true, leaveOpen: state !== null }),
    'ignore',
  );
  state = leaveReducer(state, { type: 'cancel' });
  assert.equal(
    globalKeyIntent({ key: 'Escape' }, { preview: true, leaveOpen: state !== null }),
    'exit-preview',
  );
});

test('global shortcuts respect the dialog, preview mode, and focused inputs', () => {
  const closed = { preview: false, leaveOpen: false };
  const preview = { preview: true, leaveOpen: false };
  assert.equal(globalKeyIntent({ key: 's', ctrlKey: true }, closed), 'save');
  assert.equal(globalKeyIntent({ key: 's', metaKey: true }, preview), 'ignore');
  assert.equal(
    globalKeyIntent({ key: 's', ctrlKey: true }, { preview: false, leaveOpen: true }),
    'ignore',
  );
  assert.equal(globalKeyIntent({ key: 'z', ctrlKey: true, targetTag: 'INPUT' }, closed), 'ignore');
  assert.equal(globalKeyIntent({ key: 'z', ctrlKey: true, targetTag: 'BODY' }, closed), 'undo');
  assert.equal(
    globalKeyIntent({ key: 'z', ctrlKey: true, shiftKey: true, targetTag: 'BODY' }, closed),
    'redo',
  );
});
