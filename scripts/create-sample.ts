import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createProject, CommandService, uid } from '../src/core/project';
import { saveProject } from '../src/electron/storage';
const root = resolve(process.argv[2] || 'examples/林间来信');
await mkdir(join(root, 'assets'), { recursive: true });
function crc(b: Buffer) {
  let c = 0xffffffff;
  for (const x of b) {
    c ^= x;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, b: Buffer) {
  const t = Buffer.from(type),
    n = Buffer.alloc(4),
    c = Buffer.alloc(4);
  n.writeUInt32BE(b.length);
  c.writeUInt32BE(crc(Buffer.concat([t, b])));
  return Buffer.concat([n, t, b, c]);
}
function png(index: number) {
  const w = 1280,
    h = 720,
    raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let color = [225 - index * 7, 235 - index * 5, 220 - index * 2];
      if ((x - 1010) ** 2 + (y - 160) ** 2 < 75 ** 2) color = [235, 196, 116];
      if (y > 420 + 100 * Math.sin(x / 330 + index)) color = [137, 167, 139];
      if (y > 530 + 80 * Math.cos(x / 240)) color = [79, 124, 101];
      for (const tx of [90, 180, 1100, 1190])
        if (y > 200 && y < 600 && Math.abs(x - tx) < (y - 160) / 6) color = [45, 91, 75];
      const offset = y * (w * 3 + 1) + 1 + x * 3;
      raw[offset] = color[0];
      raw[offset + 1] = color[1];
      raw[offset + 2] = color[2];
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w);
  header.writeUInt32BE(h, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
function wav(frequency: number) {
  const rate = 22050,
    duration = 2,
    bytes = Buffer.alloc(44 + rate * duration * 2);
  bytes.write('RIFF');
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(bytes.length - 44, 40);
  for (let i = 0; i < rate * duration; i++)
    bytes.writeInt16LE(
      Math.round(
        Math.sin((i / rate) * Math.PI * 2 * frequency) *
          1000 *
          Math.min(1, i / 1000, (rate * duration - i) / 1000),
      ),
      44 + i * 2,
    );
  return bytes;
}
const service = new CommandService(createProject('林间来信 · 分支示例', 1280, 720));
const names = ['林间来信', '岔路口', '追随萤火', '走向山谷', '新的旅程'];
const lines = [
  '一封未署名的信，\n把你带到了森林边缘。',
  '风吹向两条不同的小径。\n你想先去哪里？',
  '萤火绕了一圈，\n又带你回到熟悉的岔路口。',
  '沿着山谷前行，\n远方的灯火渐渐清晰。',
  '故事在此停留，\n而你的旅程才刚刚开始。',
];
const pageIds: string[] = [];
for (let i = 0; i < 5; i++) {
  const id = uid(),
    path = `assets/${id}.png`;
  await writeFile(join(root, path), png(i));
  service.execute({
    type: 'asset.add',
    asset: {
      id,
      name: `森林插画 ${i + 1}`,
      path,
      kind: 'image',
      mime: 'image/png',
      width: 1280,
      height: 720,
    },
  });
  const pageId = service.execute({ type: 'page.add', name: names[i], assetId: id }).id!;
  pageIds.push(pageId);
  service.execute({
    type: 'page.patch',
    pageId,
    patch: {
      position: { x: [60, 410, 780, 780, 1150][i], y: [180, 180, 0, 380, 380][i] },
      transition: { type: 'fade', duration: 0.4 },
    },
  });
  const layerId = service.execute({ type: 'layer.add', pageId, kind: 'text' }).id!;
  service.execute({
    type: 'layer.patch',
    pageId,
    layerId,
    patch: {
      name: '故事文字',
      text: lines[i],
      x: 260,
      y: 250,
      width: 760,
      height: 180,
      fontSize: 42,
      color: '#2c5344',
      effect: { type: 'fade', duration: 0.6 },
    },
  });
}
for (const [source, target, label] of [
  [0, 1, '展开信笺'],
  [1, 2, '追随萤火'],
  [1, 3, '走向山谷'],
  [2, 1, '回到岔路口'],
  [3, 4, '继续前行'],
] as const)
  service.execute({ type: 'exit.add', pageId: pageIds[source], target: pageIds[target], label });
for (const [name, freq, kind] of [
  ['背景示例音', 220, 'music'],
  ['配音通道示例音', 440, 'voice'],
] as const) {
  const id = uid(),
    path = `assets/${id}.wav`;
  await writeFile(join(root, path), wav(freq));
  service.execute({
    type: 'asset.add',
    asset: { id, name, kind: 'audio', path, mime: 'audio/wav', duration: 2 },
  });
  service.execute({
    type: 'page.patch',
    pageId: pageIds[0],
    patch: { [kind]: { assetId: id, volume: 0.25 } },
  });
}
await saveProject(root, service.project);
console.log(root);
