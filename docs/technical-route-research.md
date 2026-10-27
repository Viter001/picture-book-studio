# MVP 技术路线调研与建议

> 文档层级更新（2026-10-27）：本文为全局设计的专项讨论资料，不定义首版交付。发展方向见 [全局规划](product-roadmap.md)，首版范围见 [MVP 规划](product-plan-mvp.md)。以下历史首版建议仅作候选参考，不自动成为实现或验收要求。

日期：2026-10-27。状态：用户已于 2026-10-27 选定 Electron + React + 自有绘本模型。下文保留选型依据，具体组件与模块边界仍为建议；不是已批准的正式设计或实施计划。
依据：已确认的六个产品方向、MVP 草案、原绘本定向代码阅读及下列官方仓库/文档。未下载或运行第三方项目，未做性能与格式兼容实测。

## 1. 建议结论

建议首版采用本地桌面路线：Electron + React + TypeScript，以 React Flow 实现页面流程图，以 HTML/CSS 页面渲染配合 Moveable 实现页面编辑，Web Animations API 实现动画预设，HTMLMediaElement / Web Audio 实现音频播放与音量控制；通过本地 MCP 工具桥接外部 AI agent。

产品工程使用自有的版本化 JSON 数据及项目素材目录。界面和 AI 共用命令处理、校验和撤销机制；编辑与播放共用页面渲染模块。保留后续 Web 化的模块边界，但不把多平台同时交付作为 MVP 前提。

用户已选定上述 Electron + React + 自有绘本模型主路线；其他配套组件及细节继续讨论。

## 2. 原绘本当前基础（本轮定向核对）

原项目为原生 HTML/CSS/JavaScript 静态应用，无 npm 依赖和构建步骤；页面数据集中在 ink/story.js。其页面对象已有 img、video、layers、audio、exits 等信息。证据见原项目 README.md 与 ink/story.js:31 起。

| 已有能力 | 核对入口 | 对新工具的意义 |
| --- | --- | --- |
| 页面与出口数据 | ink/story.js | 可以设计导入适配映射，避免照搬特定作品的整套数据 |
| HTML 页面与图层渲染 | ink/engine.js:63、ink/fx.js:170 | 现有渲染以 DOM 为主，不必为了编辑器整体改成 Canvas |
| 图层动画与转场 | ink/fx.js:80、ink/trans.js:68 | 已有 Web Animations / CSS 思路，可提炼为通用动作注册表 |
| 音频、视频 | ink/audio.js、ink/video.js | 已处理背景、旁白、媒体播放等行为；具体作品规则需要解耦 |
| 可视化调参台 | scripts/tune/serve.mjs；README“启动与调参” | 已能调整文字/部件位置与尺寸，但草稿不自动写回正式剧情，不是完整制作工具 |

不直接把原引擎整体嵌进新编辑器作为唯一基础：其全局状态、具体 DOM 结构、页号迁移及作品特定行为需要解耦。建议保留原工程，通过适配器和小样本逐步迁移通用能力；不执行任意导入的 story.js 来获取数据。

另一个产品提醒：原项目大量使用文字图层，实际素材包含 WebP、M4A 与 MP4。MVP 草案目前主要列 PNG/JPEG、MP3/WAV，应在确认范围时补议基础文字图层，并把 WebP/M4A 纳入格式验证样本，不能默认兼容全部旧素材。

## 3. 可参考的项目与组件

| 项目 | 官方核实内容 | 建议用途与限制 |
| --- | --- | --- |
| [PPTist](https://github.com/pipipi-pikachu/PPTist) | Vue 3 + TypeScript；页面编辑、翻页动画、元素动画、选择面板、音视频；当前 AGPL-3.0 | 与产品交互最接近，优先参考页面/图层/动画体验。直接采用代码需先决定授权路线；不默认并入新工程 |
| [React Flow](https://reactflow.dev/) | 节点、边、连接点、自定义节点；MIT；有官方幻灯片教程 | 建议作为页面连接编辑组件；不负责页面内部排版或绘本播放引擎 |
| [Moveable](https://github.com/daybrush/moveable) | 拖动、缩放、旋转、吸附等元素操作；MIT | 建议用于 HTML 页面上的元素操作控件；项目存储和撤销需自己实现 |
| [OpenCut](https://github.com/OpenCut-app/OpenCut) | 当前 MIT；主仓库声明从头重写，将 Editor API、插件、MCP、无界面模式列为建设目标 | 参考媒体编辑与外部 agent 接口方向；不将计划能力当作成熟现成功能 |
| [OpenCut Classic](https://github.com/opencut-app/opencut-classic) | README 标明旧版已归档、不再维护 | 可研究旧媒体编辑架构，不建议承担新项目核心依赖 |
| [wavesurfer.js](https://wavesurfer.xyz/) | 波形可视化、Regions、Envelope 等插件；BSD-3-Clause | 后续需要波形/区间编辑时引入；不是完整音频工作站或转码器 |
| [Konva](https://konvajs.org/docs/sandbox/Video_On_Canvas.html) | Canvas 编辑能力；官方视频示例通过 video 元素并持续重绘图层 | Canvas 路线备选。视频可做，但本项目采用原生媒体元素可减少额外渲染层 |

许可证按本轮官方页面记录；实际引入时锁定版本、核对该版本许可证与依赖。这里只区分参考与采用，不作完整法律结论。

## 4. 三种可行路线

| 路线 | 优势 | 成本 | 判断 |
| --- | --- | --- | --- |
| Electron + React + 自有绘本模型 | 复用现有 Web 技能与播放思路；本地文件与 Node 工具桥接方便；打包自带 Chromium | 安装体积较大，需维护桌面进程与资源隔离 | 推荐 MVP |
| Tauri + Web 前端 | 使用系统 WebView，应用壳可更轻 | 需要 Rust/前端边界；不同平台 WebView 与媒体表现需要分别验证 | 重视体积时可选，不作为当前首选 |
| 基于 PPTist 二次开发 | 现成页面编辑、图层与动画功能较多 | Vue 路线与 AGPL 授权需要接受或另行解决；仍需自建流程图、外部 AI 和绘本音频模型 | 若明确愿意沿用其授权及模型，可重新评估 |

Electron 换取统一浏览器版本与 Node 集成，不能因此保证所有媒体格式可播放。Tauri 的平台 WebView 差异由官方文档说明；本项目的实际性能差异尚未测试。

## 5. 代码模块如何划分（建议）

以下是规划目录，不是已创建的代码：

- apps/desktop：Electron 主进程、preload、文件对话框、工程读写和本地连接管理。
- apps/editor：React 编辑界面、React Flow 节点图、图层列表和属性面板。
- packages/project-core：工程数据类型、校验、命令、撤销记录、版本号和迁移规则；不依赖界面。
- packages/player：页面渲染、媒体生命周期、动画执行与翻页；编辑预览使用同一实现。
- packages/agent-bridge：MCP 工具定义与桌面应用通信，只转发命令，不维护另一份可写工程。
- packages/legacy-import：后续原绘本数据适配，按字段报告支持情况；不静默丢弃未支持内容。

首版保持一个仓库，模块边界可以先用普通目录表达，无需立刻引入复杂 monorepo 调度系统。

## 6. 数据与命令是实现的核心

工程建议包含 schemaVersion、projectId、revision、素材表、页面表、连接表。页面具有稳定 ID、画布尺寸、图层、音轨引用、动画与转场配置；页码只作展示，不作为容易变化的引用标识。
图层和素材用稳定 ID 关联；页面节点在流程图中的位置与页面内元素的位置分别存储。选择状态、正在播放的时间等临时状态不混入作品内容。

工程建议保存为 project.json + assets/，素材用项目相对路径引用。导入复制原文件；生成缩略图等缓存放到独立缓存目录。写入使用临时文件与替换机制，并验证在 Windows 上失败时旧文件仍然可打开。

所有编辑走统一命令，例如 AddPage、ConnectPages、ImportAsset、SetLayerVisibility、SetAudio、SetAnimation。命令包含 requestId 和 expectedRevision；提交前校验引用与参数，成功后生成新 revision、撤销信息和变更事件。界面收到事件更新，避免 AI 修改磁盘而界面仍持有旧状态。
拖拽过程可在界面临时展示，结束时合并为一次命令；动画变换作用于内部元素，编辑定位作用于外层容器，避免两者同时覆盖 transform。

## 7. 外部 AI 如何真正操作

建议首版采用 MCP stdio 工具进程，由支持 MCP 的外部 agent 宿主启动；工具进程通过本地 IPC 连接正在运行的桌面应用。Windows 可用命名管道，其他平台后续适配本地域套接字。

调用路径：用户界面 → preload/IPC → 主进程命令服务；外部 agent → MCP 工具进程 → 本地 IPC → 同一主进程命令服务。主进程是当前工程的唯一写入者；bridge 不直接写 project.json。

最小工具集建议为 project_get、assets_import、pages_add、pages_connect、layers_set_visibility、project_save。接口返回稳定对象 ID、revision 与结构化错误。应用未打开、版本冲突、路径无效时明确返回失败，不隐式启动另一个工程写入者。
导入路径需限定为用户选定或已授权的素材范围；本地连接校验会话与目标工程。renderer 不直接获得 Node 文件读写能力，preload 只开放白名单接口。
MCP 协议可提供工具调用能力；“某个模型”本身并不保证具有 MCP 接入能力，需实测用户实际使用的 agent 宿主。首版至少验证一个宿主，不能据协议选型声称所有客户端都已兼容。

## 8. 动画、音轨与媒体实现

- 动画列表来自统一预设注册表：效果 ID、名称、可调参数、默认值、适用对象及执行函数。界面和 AI 共享该定义，工程只存效果 ID 和参数。
- 页面转场作用于页面容器；页内动画作用于图层内容；离页时取消动画和相关计时器。首版采用 Web Animations API / CSS，无需先引入完整动画时间轴框架。
- HTML video/audio 负责媒体解码和基础播放，Web Audio 可用于按背景/人物分类的增益控制。全局调度统一处理进页、离页、暂停、重播和资源释放，避免每个面板自行播放一套音频。
- 基础音轨仍保留角色类型、素材引用、时间与音量字段，首版界面可限制数量，后续扩展不必重写数据结构。
- 支持清单必须同时描述容器和编码，例如 MP4 不等于任意 MP4 都能播放。先用目标 Electron 版本验证 WebP/JPEG/PNG、MP3/WAV/M4A、H.264/AAC MP4 的样本组合；不支持项给出原因。
- FFmpeg 可作为后续可选转码工具，首版不默认打包或运行转码；如引入需核对具体构建许可证、体积和分发方式。本轮 FFmpeg 许可证页面抓取超时，未完成核验。

## 9. 定路线前的最小技术验证（待执行）

1. 一个本地工程，保存并重开两页、素材和连接，验证素材原件移动后仍可用。
2. 同一页面呈现图片、文字与视频，拖动和缩放后再播放淡入，检查编辑/预览一致以及 transform 不冲突。
3. 页面音频与视频在翻页、暂停、重播后没有残留播放，格式失败能定位原因。
4. 一个外部 agent 经 MCP 添加页面；界面立即看到变更，用户可撤销；重复 requestId 不重复创建，过期 revision 不覆盖新编辑。
5. 从原绘本挑选静态、音频、视频三个代表页面，评估适配成本；旧项目只作为读取来源。

通过这组验证后再锁依赖版本、确定格式清单并拆实施任务。本轮未执行上述验证，未安装依赖，未开发功能。

## 10. 官方资料与本轮核验范围

- [PPTist 功能列表](https://github.com/pipipi-pikachu/PPTist/blob/master/README_zh.md)、[许可证](https://github.com/pipipi-pikachu/PPTist/blob/master/LICENSE)
- [React Flow 幻灯片教程](https://reactflow.dev/learn/tutorials/slide-shows-with-react-flow)、[MIT 许可证](https://github.com/xyflow/xyflow/blob/main/LICENSE)
- [Moveable 仓库](https://github.com/daybrush/moveable)
- [OpenCut 当前重写状态](https://github.com/OpenCut-app/OpenCut)、[旧版归档状态](https://github.com/opencut-app/opencut-classic)
- [wavesurfer.js 功能与插件](https://wavesurfer.xyz/)
- [Electron 选型说明](https://www.electronjs.org/docs/latest/why-electron)、[进程隔离建议](https://www.electronjs.org/docs/latest/tutorial/security)
- [Tauri 进程模型](https://v2.tauri.app/concept/process-model/)、[WebView 差异](https://v2.tauri.app/reference/webview-versions/)
- [MCP 服务端开发](https://modelcontextprotocol.io/docs/develop/build-server)、[传输规范示例版本](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)、[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Konva 视频绘制示例](https://konvajs.org/docs/sandbox/Video_On_Canvas.html)

已验证的是官方资料表述和原项目局部实现，不是第三方软件实机运行、完整许可证审查或本项目可行性测试。正式接入时再按选定版本复核。
