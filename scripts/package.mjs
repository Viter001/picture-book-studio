import { packager } from '@electron/packager';
import { resolve, join } from 'node:path';
import { mkdir, cp } from 'node:fs/promises';
const root = resolve('.'),
  out = join(root, 'release'),
  temp = join(root, '.agent/runs/mvp/package-temp');
await mkdir(temp, { recursive: true });
process.env.TEMP = temp;
process.env.TMP = temp;
const paths = await packager({
  dir: root,
  name: 'PictureBookStudio',
  platform: 'win32',
  arch: 'x64',
  out,
  overwrite: true,
  tmpdir: false,
  asar: false,
  prune: true,
  electronVersion: '45.1.0',
  electronZipDir: undefined,
  ignore: (path) =>
    /^\/node_modules\/\.cache(?:\/|$)/.test(path) ||
    (Boolean(path) &&
      !/^\/(dist(?:-electron)?|examples|node_modules)(?:\/|$)/.test(path) &&
      !/^\/(package\.json|README\.md)$/.test(path)),
});
for (const path of paths) {
  await cp(join(root, 'examples'), join(path, '示例工程'), { recursive: true });
  console.log(path);
}
