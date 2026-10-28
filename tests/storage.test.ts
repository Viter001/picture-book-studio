import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  readFile,
  writeFile,
  rm,
  mkdir,
  cp,
  readdir,
  realpath,
  access,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProject, type Project } from '../src/core/project.ts';
import { saveProject, loadProject, assetPath, checkedAssetPath } from '../src/electron/storage.ts';

test('save/load and relocation preserve project; unsupported version cannot replace valid save', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'book-test-'));
  try {
    const p = createProject('可移动工程', 1280, 720);
    await saveProject(dir, p);
    assert.deepEqual(await loadProject(dir), p);
    const moved = join(dir, 'moved');
    await mkdir(moved);
    await cp(join(dir, 'project.json'), join(moved, 'project.json'));
    assert.deepEqual(await loadProject(moved), p);
    await assert.rejects(saveProject(dir, { ...p, schemaVersion: 999 } as any));
    assert.deepEqual(JSON.parse(await readFile(join(dir, 'project.json'), 'utf8')), p);
    await writeFile(join(moved, 'project.json'), JSON.stringify({ ...p, schemaVersion: 999 }));
    await assert.rejects(loadProject(moved));
    assert.throws(() => assetPath(dir, '../secret'));
    assert.throws(() => assetPath(dir, 'assets/../../secret'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('asset paths stay project-relative and reject traversal, nesting, and Windows device names', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'book-test-'));
  try {
    await mkdir(join(dir, 'assets'), { recursive: true });
    const file = join(dir, 'assets', 'cover_01.png');
    await writeFile(file, 'not-a-real-image');
    assert.equal(assetPath(dir, 'assets/cover_01.png'), file);
    assert.equal(await checkedAssetPath(dir, 'assets/cover_01.png'), await realpath(file));
    for (const bad of [
      '../secret.png',
      'assets/../../secret.png',
      'assets\\cover.png',
      'C:/secret.png',
      'assets/nested/cover.png',
      'assets/cover.png?x',
      'assets/CON.png',
      'assets/com1.jpg',
    ]) {
      assert.throws(() => assetPath(dir, bad), /INVALID_ASSET_PATH/);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('checkedAssetPath rejects an assets directory linked outside the project root', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'book-test-')),
    outside = await mkdtemp(join(tmpdir(), 'book-outside-'));
  try {
    await writeFile(join(outside, 'escape.png'), 'outside');
    try {
      await symlink(
        outside,
        join(dir, 'assets'),
        process.platform === 'win32' ? 'junction' : 'dir',
      );
    } catch (e) {
      if (
        ['EPERM', 'EACCES', 'ENOSYS', 'UNKNOWN'].includes((e as NodeJS.ErrnoException).code ?? '')
      ) {
        t.skip('当前环境不允许创建目录链接');
        return;
      }
      throw e;
    }
    await assert.rejects(checkedAssetPath(dir, 'assets/escape.png'), /ASSET_OUTSIDE_PROJECT/);
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test('a failed atomic replace cleans its temp file and leaves no project file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'book-test-'));
  try {
    await mkdir(join(dir, 'project.json'));
    await assert.rejects(saveProject(dir, createProject('保存失败', 1280, 720)));
    assert.deepEqual(await readdir(dir), ['project.json']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('invalid projects are rejected before creating the storage root', async () => {
  const base = await mkdtemp(join(tmpdir(), 'book-test-'));
  const root = join(base, 'new-project');
  try {
    const invalid = {
      ...createProject('无效工程', 1280, 720),
      assets: [{ id: 'bad', name: 'bad', kind: 'image', path: '../bad.png', mime: 'image/png' }],
    } as unknown as Project;
    await assert.rejects(saveProject(root, invalid));
    await assert.rejects(access(root));
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test('load rejects malformed JSON without rewriting the damaged file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'book-test-'));
  try {
    await saveProject(dir, createProject('损坏工程', 1280, 720));
    const file = join(dir, 'project.json');
    await writeFile(file, '{broken json');
    await assert.rejects(loadProject(dir));
    assert.equal(await readFile(file, 'utf8'), '{broken json');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
