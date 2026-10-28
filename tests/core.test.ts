import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, CommandService } from '../src/core/project.ts';
test('branches and back edges survive delete/undo, direct self edge is rejected', () => {
  const s = new CommandService(createProject('故事', 1280, 720));
  const a = s.execute({ type: 'page.add', name: 'A' }).id!;
  const b = s.execute({ type: 'page.add', name: 'B' }).id!;
  s.execute({ type: 'exit.add', pageId: a, label: '去 B', target: b });
  s.execute({ type: 'exit.add', pageId: b, label: '返回', target: a });
  assert.throws(() => s.execute({ type: 'exit.add', pageId: a, label: '自身', target: a }));
  s.execute({ type: 'page.delete', pageId: a });
  assert.equal(s.project.pages.length, 1);
  assert.equal(s.project.pages[0].exits.length, 0);
  assert.equal(s.project.startPageId, null);
  s.undo();
  assert.equal(s.project.pages.length, 2);
  assert.equal(s.project.pages[1].exits[0].target, a);
  assert.equal(s.project.startPageId, a);
});
test('retries do not duplicate edits; stale edits fail; snapshot stays immutable', () => {
  const s = new CommandService(createProject('故事', 1280, 720));
  const envelope = { projectId: s.project.id, requestId: 'one', expectedRevision: 0 };
  const first = s.execute({ type: 'page.add', name: 'A' }, envelope);
  const snapshot = s.snapshot();
  assert.deepEqual(s.execute({ type: 'page.add', name: 'A' }, envelope), first);
  assert.equal(s.project.pages.length, 1);
  assert.throws(
    () => s.execute({ type: 'page.add', name: 'B' }, { ...envelope, requestId: 'two' }),
    /REVISION/,
  );
  s.execute({ type: 'page.delete', pageId: first.id! });
  assert.equal(snapshot.pages.length, 1);
  assert.equal(s.project.pages.length, 0);
  s.undo();
  assert.equal(s.project.pages.length, 1);
  s.redo();
  assert.equal(s.project.pages.length, 0);
});
