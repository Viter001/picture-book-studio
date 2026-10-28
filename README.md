# 绘境 · 交互叙事工作台

Electron + React + 自有作品模型的本地创作工具。当前为 **0.1.0 开发预览版**：可以制作、预览、保存互动绘本，外部 Agent 通过 MCP 协助编辑。

## 直接试用

1. 打开 `release/PictureBookStudio-win32-x64/PictureBookStudio.exe`，保留同目录其他文件。
2. 点击“打开”，选择同目录 `示例工程/林间来信/project.json`。
3. 双击页面卡片编辑图片、文字、图层和声音；返回流程配置出口；点击“从头预览”。
4. 新建工程时选择名称、画布尺寸和空文件夹。导入的素材会复制到工程 `assets/`；搬移作品时复制整个工程文件夹。

当前支持图片 PNG/JPEG/静态 WebP，以及 MP3、PCM WAV、AAC M4A 样本；单文件导入上限 50 MB。每页背景音频循环、人物配音播放一次；图层淡入和页面交叉淡化可选。示例音频为测试音，用于区分两条音轨。

撤销/重做只在本次打开期间有效。保存使用 Ctrl+S，撤销 Ctrl+Z，重做 Ctrl+Shift+Z。隐藏图层可在左侧列表恢复；页面删除可连同关联出口撤销。工程草稿可以没有起点或保留未连接出口，界面会提示。

## 开发运行

需要 Node.js 24 和 npm。依赖版本以 `package-lock.json` 为准。

```powershell
npm ci
npm run build
npm start
npm test
npm run test:electron
npm run test:integration
npm run package
```

- `npm run build`：类型检查、React 生产构建、Electron 和 MCP bridge 构建。
- `npm run test:electron`：真实 Electron 编辑与分支循环预览。
- `npm run test:integration`：六种媒体样本、MCP 协议、冲突、撤销及快照验证。
- `npm run test:agent`：调用本机已登录的真实 Codex CLI，仅操作临时测试工程；会使用模型额度，不是普通单元测试。
- `node scripts/ui-acceptance.mjs`、`playback-acceptance.mjs`、`flush-acceptance.mjs`：完整制作、音画生命周期/异常、未失焦输入保存回归。

## Agent 接入

不内置聊天或模型。见 [外部 Agent 工具说明](docs/agent-tools.md)。先在桌面工具打开工程，按需授权素材目录，再让外部宿主连接本地 MCP bridge。

## 状态与边界

Windows x64 应用包已生成；功能证据、环境限制和未完成验收项见 [验收记录](docs/acceptance.md)。当前自动化宿主需显式测试参数才能启动 Chromium；打包版已在该受控条件下验证，普通用户桌面默认启动与真实系统 DPI 尚待人工验收。应用代码保留 `sandbox`、`contextIsolation`；默认启动不加入诊断参数。

本版不包含视频、隐藏数值/条件系统、云同步、作品独立网页或游戏发布。没有上传远程仓库或发布安装包。

## 项目文档

- [全局设计与发展规划](docs/product-roadmap.md)
- [MVP 实施基线 v0.7](docs/product-plan-mvp.md)
- [实施计划](docs/superpowers/plans/2026-10-28-mvp-first-run.md)
- [项目约定](AGENTS.md)、[需求裁决](QUESTIONS.md)、[反馈](FEEDBACK.md)、[开发记录](DEVLOG.md)

原绘本 `E:/code saving/INTERACTIVE-NARRATIVE-SYSTEM/` 只作参考，本次未修改。项目使用已安装的 project-change-delivery 技能，纯本地 Git 管理。
