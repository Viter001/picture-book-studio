# MVP 首版实施计划

> **For agentic workers:** 使用 executing-plans 在当前会话执行，最终进行独立代码审阅。

**Goal:** 实现 MVP v0.7 的 Windows 本地制作与预览闭环，并如实记录 A1—A10 的验收证据。

**Architecture:** Electron 主进程持有工程、撤销栈和文件权限；受限 preload 连接 React；独立核心执行命令与校验；MCP bridge 复用命令服务。工程定义与播放器快照分离。

**Tech Stack:** TypeScript、React、React Flow、Vite、Electron；Node 测试与 Playwright Electron 集成验证。版本由安装锁文件固定。

**Spec:** docs/product-plan-mvp.md v0.7；用户于 2026-10-28 授权开工。

## Global Constraints

- 具体项目 GraphFlow 上下文先行；不修改原绘本，不推送远程。
- 视频、规则数值、独立作品发布延期；避免添加未使用的扩展模块。
- 文档历史审阅状态由本次授权取代，验收状态仍以实际证据为准。
- 在 feat/mvp-first-run 分支原地实施；保留用户改动。

## Review Focus

工程校验和文件边界、失败保存保全、撤销的连接一致性、revision 并发与幂等、预览快照及音画清理、Electron 隔离。

## 1. 工程核心与基础构建

- [x] 建立 package.json、TypeScript/Vite 配置及 src/core。
- [x] 先写 tests/core.test.ts，验证分支回连、自环拒绝、删除撤销、过期 revision 和请求重试，观察失败。
- [x] 实现稳定 ID、工程校验、命令服务、快照及撤销重做，测试转绿。
- [x] 记录并提交。

## 2. 桌面文件服务与 Agent 通路

- [x] tests/storage.test.ts 先验证保存重开、移动、未知版本及越界路径拒绝。
- [x] 实现 electron/main、preload、存储服务、媒体导入和有限 IPC。
- [x] 实现 MCP 六工具桥接，同命令服务与 UI 通知，记录实际宿主验证条件。
- [x] 运行测试，记录并提交。

## 3. 两个编辑工作区及预览

- [x] 实现 React Flow 页面卡片、出口编辑和流程视口保留。
- [x] 实现图片文字画布、图层列表、属性、撤销保存及未保存提示。
- [x] 实现快照预览、分支循环、音轨、淡入与交叉淡化。
- [x] 用 Electron 集成测试实际操作创建、连线、排版、保存重开与预览；检查截图后修正。
- [x] 记录并提交。

## 4. 示例与交付验收

- [x] 生成五页分支循环示例及媒体格式样本，附使用和 Agent 接入说明。
- [x] 构建 Windows 应用目录，实际启动包完成样本路径。
- [x] 按 A1—A10 更新验收，不用协议模拟冒充真实宿主。
- [x] 最终独立审阅，修复问题后运行相关检查，更新 DEVLOG 和中文提交。

## 当前交付口径

实施与首跑验证已执行，正式 A1—A10 仍保留人工体验/默认桌面环境验收项，详见 docs/acceptance.md。没有把这些项勾成全部通过。分支保留 feat/mvp-first-run，尚未合入 main 或推送。
