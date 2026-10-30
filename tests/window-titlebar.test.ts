import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WINDOW_TITLE, WindowTitleBar, showsWindowTitleBar } from '../src/ui/WindowTitleBar.tsx';

test('the custom title bar is a Windows-only affordance', () => {
  assert.equal(showsWindowTitleBar('win32'), true);
  for (const platform of ['darwin', 'linux', 'freebsd', 'aix', '', undefined, null])
    assert.equal(showsWindowTitleBar(platform), false);
});

test('Windows renders a single drag strip with the workspace title', () => {
  const html = renderToStaticMarkup(React.createElement(WindowTitleBar, { platform: 'win32' }));
  assert.match(html, /<div class="window-titlebar">/);
  assert.match(html, /<span class="window-title">/);
  assert.ok(html.includes(WINDOW_TITLE));
  assert.equal(WINDOW_TITLE, '绘境 · 交互叙事工作台');
  assert.equal((html.match(/<button/g) ?? []).length, 0, 'no hand-made window buttons');
});

test('other platforms keep the native frame and render nothing', () => {
  for (const platform of ['darwin', 'linux']) {
    assert.equal(renderToStaticMarkup(React.createElement(WindowTitleBar, { platform })), '');
  }
});
