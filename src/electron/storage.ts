import { readFile, writeFile, mkdir, rename, unlink, realpath } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { validateProject, type Project, uid } from '../core/project';
const ASSET_FILE = /^assets\/([a-zA-Z0-9_-]+)\.(png|jpg|jpeg|webp|mp3|wav|m4a)$/;
const WINDOWS_DEVICE = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
function within(base: string, target: string) {
  const rel = relative(base, target);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}
export function assetPath(root: string, path: string) {
  const match = ASSET_FILE.exec(path);
  if (!match || WINDOWS_DEVICE.test(match[1])) throw Error('INVALID_ASSET_PATH');
  const base = resolve(root),
    file = resolve(base, path);
  if (!within(base, file)) throw Error('INVALID_ASSET_PATH');
  return join(root, path);
}
export async function checkedAssetPath(root: string, path: string) {
  const file = assetPath(root, path),
    actual = await realpath(file),
    base = await realpath(root);
  if (!within(base, actual)) throw Error('ASSET_OUTSIDE_PROJECT');
  return actual;
}
export async function loadProject(root: string) {
  const file = join(root, 'project.json');
  return validateProject(JSON.parse(await readFile(file, 'utf8')));
}
export async function saveProject(root: string, project: Project) {
  const p = validateProject(project);
  await mkdir(root, { recursive: true });
  const temp = join(root, `.project-${uid()}.tmp`);
  try {
    await writeFile(temp, JSON.stringify(p, null, 2), 'utf8');
    await rename(temp, join(root, 'project.json'));
  } finally {
    await unlink(temp).catch(() => {});
  }
}
