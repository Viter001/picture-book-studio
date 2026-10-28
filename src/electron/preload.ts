import { contextBridge, ipcRenderer } from 'electron';
// Flush the focused DOM editor before the main process saves or closes.
// The state request is a queue barrier after the blur-triggered edit command.
ipcRenderer.on('flush-editor', async (_, requestId: string) => {
  try {
    const element = document.activeElement;
    if (element instanceof HTMLElement) element.blur();
    const result = await ipcRenderer.invoke('studio', 'state');
    ipcRenderer.send('flush-editor-done', requestId, result.ok ? null : result.error);
  } catch (error) {
    ipcRenderer.send('flush-editor-done', requestId, String(error));
  }
});
contextBridge.exposeInMainWorld('studio', {
  invoke: (action: string, payload?: unknown) => ipcRenderer.invoke('studio', action, payload),
  subscribe: (callback: (state: unknown) => void) => {
    const handler = (_: unknown, state: unknown) => callback(state);
    ipcRenderer.on('state', handler);
    return () => ipcRenderer.removeListener('state', handler);
  },
});
