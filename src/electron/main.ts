import { app, BrowserWindow, ipcMain, dialog, protocol, net as electronNet } from 'electron';
import { createServer } from 'node:net';
import { readFile, writeFile, mkdir, copyFile, realpath, stat } from 'node:fs/promises';
import { join, basename, extname, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import {
  CommandService,
  createProject,
  uid,
  type Command,
  type Envelope,
  type Asset,
} from '../core/project';
import { saveProject, loadProject, checkedAssetPath } from './storage';
if (process.env.STUDIO_USER_DATA) {
  if (!isAbsolute(process.env.STUDIO_USER_DATA)) throw Error('STUDIO_USER_DATA 必须是绝对路径');
  mkdirSync(process.env.STUDIO_USER_DATA, { recursive: true });
  app.setPath('userData', process.env.STUDIO_USER_DATA);
}
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'book-asset',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);
let win: BrowserWindow, decoder: BrowserWindow;
let service: CommandService | null = null,
  root = '',
  saved = '',
  approvedRoots: string[] = [];
const media = new Map<string, string>();
let queue = Promise.resolve<unknown>(null);
const flushes = new Map<string, (error?: string) => void>();
function flushRenderer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = uid();
    const timer = setTimeout(() => {
      flushes.delete(id);
      reject(Error('编辑器未响应，未执行保存或关闭'));
    }, 10000);
    flushes.set(id, (error) => {
      clearTimeout(timer);
      flushes.delete(id);
      error ? reject(Error(error)) : resolve();
    });
    win.webContents.send('flush-editor', id);
  });
}
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const p = queue.then(fn, fn);
  queue = p.catch(() => {});
  return p;
}
function active() {
  if (!service) throw Error('NO_PROJECT：请先打开工程');
  return service;
}
function dirty() {
  return !!service && JSON.stringify({ ...service.project, revision: 0 }) !== saved;
}
async function state() {
  const missing: string[] = [];
  if (service)
    for (const a of service.project.assets) {
      try {
        const path = await checkedAssetPath(root, a.path);
        media.set(`${service.project.id}/${a.id}`, path);
      } catch {
        missing.push(a.id);
      }
    }
  return {
    project: service?.snapshot() ?? null,
    root,
    dirty: dirty(),
    canUndo: service?.canUndo ?? false,
    canRedo: service?.canRedo ?? false,
    missing,
    approvedRoots,
  };
}
async function publish() {
  const s = await state();
  if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) win.webContents.send('state', s);
  return s;
}
async function save() {
  await saveProject(root, active().project);
  saved = JSON.stringify({ ...active().project, revision: 0 });
}
async function mayLeave() {
  if (!dirty()) return true;
  const r = await dialog.showMessageBox(win, {
    type: 'question',
    message: '工程有未保存修改',
    buttons: ['保存', '放弃修改', '取消'],
    defaultId: 0,
    cancelId: 2,
  });
  if (r.response === 2) return false;
  if (r.response === 0) await save();
  return true;
}
async function openDirectory(dir: string) {
  const project = await loadProject(dir);
  root = dir;
  service = new CommandService(project);
  saved = JSON.stringify({ ...project, revision: 0 });
  approvedRoots = [];
  agentReceipts.clear();
  media.clear();
}
async function importFile(source: string): Promise<Asset> {
  const sourceReal = await realpath(source),
    info = await stat(sourceReal);
  if (!info.isFile() || info.size > 50 * 1024 * 1024)
    throw Error('文件过大或不是普通文件（上限 50 MB）');
  const ext = extname(sourceReal).toLowerCase();
  const types: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
  };
  const mime = types[ext];
  if (!mime) throw Error('不支持此格式，请导入 PNG/JPEG/WebP 或 MP3/WAV/M4A');
  const bytes = await readFile(sourceReal);
  let meta: { width?: number; height?: number; duration?: number } = {};
  if (mime.startsWith('image')) {
    const signature =
      ext === '.png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : ext === '.webp'
          ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
          : bytes[0] === 255 && bytes[1] === 216;
    if (
      !signature ||
      bytes.includes(Buffer.from('acTL')) ||
      (ext === '.webp' && bytes.includes(Buffer.from('ANIM')))
    )
      throw Error('图片格式不匹配或是动画图片');
    meta = await decoder.webContents.executeJavaScript(
      `(async()=>{const image=new Image();image.src="data:${mime};base64,${bytes.toString('base64')}";await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};})()`,
    );
  } else {
    const signature =
      ext === '.wav'
        ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE'
        : ext === '.m4a'
          ? bytes.toString('ascii', 4, 8) === 'ftyp'
          : bytes.toString('ascii', 0, 3) === 'ID3' ||
            (bytes[0] === 255 && (bytes[1] & 224) === 224);
    if (!signature) throw Error('音频格式与扩展名不匹配');
    const data = bytes.toString('base64');
    meta = await decoder.webContents.executeJavaScript(
      `(async()=>{const c=new AudioContext();try{const b=Uint8Array.from(atob('${data}'),x=>x.charCodeAt(0));const a=await c.decodeAudioData(b.buffer);return {duration:a.duration};}finally{await c.close();}})()`,
    );
  }
  const asset: Asset = {
    id: uid(),
    name: basename(sourceReal),
    kind: mime.startsWith('image') ? 'image' : 'audio',
    path: '',
    mime,
    ...meta,
  };
  asset.path = `assets/${asset.id}${ext}`;
  await mkdir(join(root, 'assets'), { recursive: true });
  const assetsReal = await realpath(join(root, 'assets')),
    rootReal = await realpath(root),
    assetRel = relative(rootReal, assetsReal);
  if (assetRel.startsWith('..') || isAbsolute(assetRel)) throw Error('ASSET_OUTSIDE_PROJECT');
  await copyFile(sourceReal, join(root, asset.path));
  return asset;
}
async function importMany(paths: string[]) {
  const results = [];
  for (const path of paths) {
    try {
      const asset = await importFile(path);
      active().execute({ type: 'asset.add', asset });
      results.push({ path, assetId: asset.id, ok: true });
    } catch (e) {
      results.push({ path, ok: false, error: String(e) });
    }
  }
  return results;
}
const agentReceipts = new Map<string, { signature: string; result: unknown }>();
async function agentCall(name: string, args: any) {
  const s = active();
  if (name === 'project_get')
    return {
      ...(await state()),
      tools: [
        'project_get',
        'assets_import',
        'pages_add',
        'pages_connect',
        'layers_set_visibility',
        'project_save',
      ],
    };
  const envelope: Envelope = {
    projectId: args.projectId,
    requestId: args.requestId,
    expectedRevision: args.expectedRevision,
  };
  if (envelope.projectId !== s.project.id) throw Error('PROJECT_MISMATCH');
  if (
    typeof envelope.requestId !== 'string' ||
    !envelope.requestId ||
    envelope.requestId.length > 128
  )
    throw Error('INVALID_REQUEST_ID');
  const key = s.project.id + ':' + envelope.requestId,
    signature = JSON.stringify({ name, args }),
    receipt = agentReceipts.get(key);
  if (receipt) {
    if (receipt.signature !== signature) throw Error('REQUEST_REUSED');
    return receipt.result;
  }
  if (envelope.expectedRevision !== s.project.revision) throw Error('REVISION_CONFLICT');
  let result: unknown;
  if (name === 'assets_import') {
    if (!Array.isArray(args.paths) || args.paths.length > 50) throw Error('INVALID_PATHS');
    for (const path of args.paths) {
      const actual = await realpath(path);
      if (
        !approvedRoots.some((base) => {
          const rel = relative(base, actual);
          return !rel.startsWith('..') && !isAbsolute(rel);
        })
      )
        throw Error('SOURCE_NOT_APPROVED：请在工具中授权素材文件夹');
    }
    result = { results: await importMany(args.paths), revision: s.project.revision };
  } else if (name === 'project_save') {
    await save();
    result = { revision: s.project.revision, saved: true };
  } else {
    let command: Command;
    if (name === 'pages_add')
      command = { type: 'page.add', name: args.name, assetId: args.assetId };
    else if (name === 'pages_connect')
      command = {
        type: 'exit.add',
        pageId: args.pageId,
        label: args.label ?? '继续',
        target: args.target,
      };
    else if (name === 'layers_set_visibility')
      command = {
        type: 'layer.patch',
        pageId: args.pageId,
        layerId: args.layerId,
        patch: { visible: args.visible },
      };
    else throw Error('UNKNOWN_TOOL');
    result = s.execute(command, envelope);
  }
  agentReceipts.set(key, { signature, result });
  await publish();
  return result;
}
async function handle(action: string, payload: any) {
  switch (action) {
    case 'state':
      return state();
    case 'new': {
      if (!(await mayLeave())) return null;
      const project = createProject(payload.name, payload.width, payload.height);
      const pick = await dialog.showOpenDialog(win, {
        title: '选择空文件夹作为工程位置',
        properties: ['openDirectory', 'createDirectory'],
      });
      if (pick.canceled) return null;
      const dir = pick.filePaths[0];
      try {
        await stat(join(dir, 'project.json'));
        throw Error('此目录已有工程，请选择其他目录');
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }
      await saveProject(dir, project);
      await openDirectory(dir);
      break;
    }
    case 'open': {
      if (!(await mayLeave())) return null;
      const pick = await dialog.showOpenDialog(win, {
        title: '打开工程',
        filters: [{ name: '绘本工程', extensions: ['json'] }],
        properties: ['openFile'],
      });
      if (pick.canceled) return null;
      const path = pick.filePaths[0];
      if (basename(path) !== 'project.json') throw Error('请选择 project.json');
      await openDirectory(join(path, '..'));
      break;
    }
    case 'command':
      active().execute(payload as Command);
      break;
    case 'undo':
      active().undo();
      break;
    case 'redo':
      active().redo();
      break;
    case 'save':
      await save();
      break;
    case 'import': {
      active();
      const pick = await dialog.showOpenDialog(win, {
        title: '导入素材',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: '图片和音频', extensions: ['png', 'jpg', 'jpeg', 'webp', 'mp3', 'wav', 'm4a'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      });
      if (pick.canceled) return null;
      const results = await importMany(pick.filePaths);
      await publish();
      return { results };
    }
    case 'approve': {
      active();
      const pick = await dialog.showOpenDialog(win, {
        title: '允许外部 Agent 从此文件夹导入素材',
        properties: ['openDirectory'],
      });
      if (!pick.canceled) approvedRoots.push(await realpath(pick.filePaths[0]));
      break;
    }
    default:
      throw Error('未知操作');
  }
  return publish();
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (win && !win.isDestroyed()) {
      win.show();
      win.focus();
    }
  });
  app
    .whenReady()
    .then(async () => {
      protocol.handle('book-asset', async (request) => {
        const u = new URL(request.url),
          path = media.get(u.hostname + u.pathname);
        if (!path) return new Response('missing', { status: 404 });
        return electronNet.fetch(pathToFileURL(path).href);
      });
      decoder = new BrowserWindow({
        show: false,
        webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
      });
      await decoder.loadURL('data:text/html,<title>Media decoder</title>');
      win = new BrowserWindow({
        width: 1440,
        height: 960,
        minWidth: 1000,
        minHeight: 700,
        title: '绘境 · 交互叙事工作台',
        backgroundColor: '#f5f6f3',
        webPreferences: {
          preload: join(__dirname, 'preload.cjs'),
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
      win.on('closed', () => app.quit());
      win.removeMenu();
      win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      win.webContents.on('will-navigate', (e) => e.preventDefault());
      ipcMain.on('flush-editor-done', (event, id, error) => {
        if (event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame)
          flushes.get(id)?.(error);
      });
      ipcMain.handle('studio', async (event, action, payload) => {
        if (event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame)
          throw Error('INVALID_SENDER');
        try {
          if (['save', 'open', 'new'].includes(action)) await flushRenderer();
          return { ok: true, value: await serialize(() => handle(action, payload)) };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      });
      let closing = false;
      let closePending = false;
      win.on('close', (e) => {
        if (closing) return;
        e.preventDefault();
        if (closePending) return;
        closePending = true;
        flushRenderer()
          .then(() =>
            serialize(async () => {
              if (await mayLeave()) {
                closing = true;
                win.close();
              }
            }),
          )
          .catch((e) => dialog.showErrorBox('无法关闭工程', String(e)))
          .finally(() => {
            closePending = false;
          });
      });
      const initial = process.argv.find((x) => x.startsWith('--project='));
      if (initial) await openDirectory(initial.slice(10));
      await win.loadFile(join(__dirname, '../dist/index.html'));
      await publish();
      const pipe =
          process.platform === 'win32'
            ? `\\\\.\\pipe\\picture-book-studio-${process.pid}`
            : join(app.getPath('temp'), `picture-book-studio-${process.pid}.sock`),
        token = randomBytes(32).toString('hex');
      const server = createServer((socket) => {
        socket.setEncoding('utf8');
        let buffer = '';
        socket.setTimeout(30000, () => socket.destroy());
        socket.on('data', (chunk) => {
          buffer += chunk.toString();
          if (buffer.length > 1024 * 1024) {
            socket.destroy();
            return;
          }
          let i;
          while ((i = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, i);
            buffer = buffer.slice(i + 1);
            socket.setTimeout(0);
            void (async () => {
              try {
                const req = JSON.parse(line);
                if (req.token !== token) throw Error('UNAUTHORIZED');
                if (req.name === 'project_save') await flushRenderer();
                const result = await serialize(() => agentCall(req.name, req.args ?? {}));
                if (!socket.destroyed) socket.write(JSON.stringify({ id: req.id, result }) + '\n');
                socket.setTimeout(30000);
              } catch (e) {
                if (!socket.destroyed) socket.write(JSON.stringify({ error: String(e) }) + '\n');
                socket.setTimeout(30000);
              }
            })();
          }
        });
        socket.on('error', () => {});
      });
      server.listen(pipe, () => {
        void (async () => {
          await mkdir(app.getPath('userData'), { recursive: true });
          await writeFile(
            join(app.getPath('userData'), 'agent-endpoint.json'),
            JSON.stringify({ pipe, token }),
            { mode: 0o600 },
          );
        })().catch((e) => dialog.showErrorBox('Agent 通道不可用', String(e)));
      });
      server.on('error', (e) => console.error('Agent bridge:', e));
      app.on('before-quit', () => server.close());
    })
    .catch((e) => {
      dialog.showErrorBox('启动失败', String(e));
      app.quit();
    });
  app.on('window-all-closed', () => app.quit());
}
