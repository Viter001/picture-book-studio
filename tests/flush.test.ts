import test from 'node:test';
import assert from 'node:assert/strict';
import { flushFocusedEditor } from '../src/electron/flush.ts';

test('blurs the focused editor before syncing state', async () => {
  const order: string[] = [];
  const error = await flushFocusedEditor(
    {
      blur() {
        order.push('blur');
      },
    },
    async () => {
      assert.deepEqual(order, ['blur']);
      order.push('state');
      return { ok: true };
    },
  );
  assert.equal(error, null);
  assert.deepEqual(order, ['blur', 'state']);
});

test('returns the state sync error so the main process can abort', async () => {
  const error = await flushFocusedEditor(null, async () => ({ ok: false, error: '状态失败' }));
  assert.equal(error, '状态失败');
});

test('uses a readable fallback when the bridge gives no error text', async () => {
  assert.equal(await flushFocusedEditor(null, async () => ({ ok: false })), '状态同步失败');
});
