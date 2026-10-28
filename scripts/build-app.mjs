import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const temp = resolve('node_modules/.cache/build-temp');
await mkdir(temp, { recursive: true });
const env = { ...process.env, TEMP: temp, TMP: temp };
for (const args of [
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  ['node_modules/vite/bin/vite.js', 'build'],
  ['scripts/build.mjs'],
]) {
  const r = spawnSync(process.execPath, args, { stdio: 'inherit', env });
  if (r.status !== 0) process.exit(r.status || 1);
}
