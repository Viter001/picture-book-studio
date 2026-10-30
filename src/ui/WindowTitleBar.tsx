import React from 'react';

export const WINDOW_TITLE = '绘境 · 交互叙事工作台';

/**
 * The custom title bar exists only on Windows, where the main process hides the
 * system title bar and paints the native caption buttons as an overlay.
 * Every other platform keeps the native window frame, so nothing is rendered.
 */
export function showsWindowTitleBar(platform: string | null | undefined): boolean {
  return platform === 'win32';
}

export function WindowTitleBar({ platform }: { platform?: string }) {
  const host = platform ?? (typeof window !== 'undefined' ? window.studio?.platform : undefined);
  if (!showsWindowTitleBar(host)) return null;
  return (
    <div className="window-titlebar">
      <span className="window-title">{WINDOW_TITLE}</span>
    </div>
  );
}
