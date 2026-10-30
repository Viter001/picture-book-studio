# 绘境 · 交互叙事工作台

Electron + React + 自有作品模型的本地创作工具。当前为 **0.1.0 开发预览版**：可以制作、预览、保存互动绘本，外部 Agent 通过 MCP 协助编辑。生产界面已接入终端优先的深色主题、文件／开始／插入／视图命令分组和同风格退出确认；作品画面本身不套用编辑器主题。

## 直接试用

1. 将 `release/PictureBookStudio-0.1.0-win32-x64.zip` 完整解压到普通应用目录（例如 `E:/Apps`），再打开其中的 `PictureBookStudio.exe`，保留同目录其他文件。本机 2026-10-30 已验证的试用副本位于 `E:/PictureBookStudio-terminal-ui-20261030/PictureBookStudio-win32-x64/PictureBookStudio.exe`。
2. 点击“打开”，选择同目录 `示例工程/林间来信/project.json`。
3. 双击页面卡片编辑图片、文字、图层和声音；返回流程配置出口；点击“从头预览”。
4. 新建工程时选择名称、画布尺寸和空文件夹。导入的素材会复制到工程 `assets/`；搬移作品时复制整个工程文件夹。

当前支持图片 PNG/JPEG/静态 WebP，以及 MP3、PCM WAV、AAC M4A 样本；单文件导入上限 50 MB。每页背景音频循环、人物配音播放一次；图层淡入和页面交叉淡化可选。示例音频为测试音，用于区分两条音轨。

**不要直接运行本机受隔离的开发工作区中的 EXE。** 本机工作区会让产物继承 Windows 低完整性标签，导致 Electron 沙箱初始化或 GPU 进程失败，表现为无窗口、退出码 `0x80000003`；管理员启动也不能修正该标签。将便携包解压到普通目录，不要解压回该工作区。无需关闭 Windows 防护、修改工作区 ACL 或使用 `--no-sandbox`。

撤销/重做只在本次打开期间有效。保存使用 Ctrl+S，撤销 Ctrl+Z，重做 Ctrl+Shift+Z。常用操作位于“开始”功能区，顶部可切换流程／页面工作区。隐藏图层可在左侧列表恢复；页面删除可连同关联出口撤销。工程草稿可以没有起点或保留未连接出口，界面会提示。

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
- `npm run test:electron`：真实 Electron 编辑与分支循环预览。工作区受低完整性标签影响时，可用 `STUDIO_EXECUTABLE=<普通目录中的 EXE>` 指向已解压副本。
- `npm run test:integration`：六种媒体样本、MCP 协议、冲突、撤销及快照验证；同样支持 `STUDIO_EXECUTABLE`。
- `npm run test:agent`：调用本机已登录的真实 Codex CLI，仅操作临时测试工程；会使用模型额度，不是普通单元测试。
- `node scripts/ui-acceptance.mjs`、`playback-acceptance.mjs`、`flush-acceptance.mjs`：完整制作、音画生命周期/异常、未失焦输入保存回归。

## Agent 接入

不内置聊天或模型。见 [外部 Agent 工具说明](docs/agent-tools.md)。先在桌面工具打开工程，按需授权素材目录，再让外部宿主连接本地 MCP bridge。

## 状态与边界

Windows x64 应用包已生成；功能证据、环境限制和未完成验收项见 [验收记录](docs/acceptance.md)。2026-10-29 已定位工作区低完整性标签造成的启动问题；同一程序部署到普通目录后，默认 GPU/沙箱的真实 Electron 编辑和分支预览回归通过。此前“需关闭沙箱才能自动化”的记录是受影响目录下的历史结果，不再作为交付方式。真实系统 DPI 与用户体验仍待人工验收。

本版不包含视频、隐藏数值/条件系统、云同步、作品独立网页或游戏发布。没有上传远程仓库或发布安装包。

## 项目文档

- [全局设计与发展规划](docs/product-roadmap.md)
- [MVP 实施基线 v0.7](docs/product-plan-mvp.md)
- [实施计划](docs/superpowers/plans/2026-10-28-mvp-first-run.md)
- [项目约定](AGENTS.md)、[当前裁决与历史决定](QUESTIONS.md)、[反馈整改清单](FEEDBACK.md)
- [阶段开发记录](DEVLOG.md)、[逐轮讨论与旧记录映射](DISCUSSION-LOG.md)

当前未关闭事项以反馈清单为准。DSH 已提供接入步骤，尚无已安装或连接成功的实测记录；参见 [DSH 接入](docs/agent-tools.md#dsh)。

原绘本 `E:/code saving/INTERACTIVE-NARRATIVE-SYSTEM/` 只作参考，本次未修改。项目使用已安装的 project-change-delivery 技能，纯本地 Git 管理。
