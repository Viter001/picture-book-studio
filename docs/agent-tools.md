# 外部 Agent 工具说明

本工具不内置 AI。外部支持 MCP 的宿主通过 Node.js 启动 bridge，再连接当前桌面应用；作品编辑与人工操作共用命令服务和撤销栈。

## 本地 MCP 配置

先启动应用并打开工程；导入素材前，在流程右侧点击“授权素材文件夹”。仅明确授权的目录及其子目录可供 Agent 导入。

配置示意（路径替换成实际绝对路径；配置项名称按宿主适配）：

```json
{
  "mcpServers": {
    "picture_book_studio": {
      "command": "node",
      "args": ["E:/code saving/PICTURE-BOOK-STUDIO/dist-electron/bridge.mjs"]
    }
  }
}
```

源码构建后 bridge 在 `dist-electron/bridge.mjs`；打包版在 `resources/app/dist-electron/bridge.mjs`。打包版 bridge 旁的 `resources/app/node_modules` 必须保留。bridge 需要宿主可用的 Node.js 24。

默认 endpoint 是 `%APPDATA%/picture-book-studio/agent-endpoint.json`。自定义应用数据目录时，应用和 bridge 共用 `STUDIO_USER_DATA`，或在 bridge 环境中用 `STUDIO_ENDPOINT` 指定 endpoint 文件绝对路径。此文件含本地连接令牌，不要复制进工程、提示词或 Git。

Codex 可用单次 `-c` 覆盖临时配置，不必修改全局配置；实际验收使用此方法。参见 [官方 CLI 文档](https://developers.openai.com/codex/cli/reference/)。可执行验证见 `scripts/agent-host.mjs`，仅针对脚本创建的一次性工程。

## 六个工具

| 工具 | 作用 | 业务参数 |
| --- | --- | --- |
| `project_get` | 读取当前工程、素材、页面、出口、revision 与缺失素材 | 无 |
| `assets_import` | 从授权目录逐个导入素材 | `paths`，最多 50 个文件 |
| `pages_add` | 创建页面，可附背景图片图层 | `name`、可选 `assetId` |
| `pages_connect` | 添加具名出口，支持分支及回连 | `pageId`、`target`、`label` |
| `layers_set_visibility` | 显示或隐藏图层 | `pageId`、`layerId`、`visible` |
| `project_save` | 保存工程 | 无额外业务参数 |

所有写工具都需 `projectId`、`requestId`、`expectedRevision`。先 `project_get`，然后使用每次成功写入返回的新 revision。新操作使用新 requestId；同一操作重试复用完全相同的参数及 requestId。遇到 `REVISION_CONFLICT` 重新读取，不覆盖其他人的修改。

回执只对本次打开有效；用户撤销不抹去“请求曾经成功”的历史回执，重试不会重复执行已撤销的操作。重开工程会重置回执和撤销栈，宿主应重新读取并开始新的请求序列。保存时会先提交编辑器焦点字段；因此人工刚提交的输入可能使 Agent 的旧 revision 冲突，这是预期保护。

预览使用启动快照。Agent 修改时会显示“工程已更新，重新预览后生效”，当前阅读不改变。退出再预览才使用新内容。

## 工程规范

`project.json` 的 `schemaVersion=1`，包含稳定 ID、revision、尺寸、页面/图层/出口、素材和音画配置。素材使用 `assets/` 下相对路径；读取工程不执行脚本。未知版本、未知字段或无效引用拒绝编辑，缺失实体文件保留引用并显示占位。

单文件最大 50 MB；当前目标格式是 PNG/JPEG/静态 WebP、MP3/PCM WAV/AAC M4A，不承诺所有编码变体。图片和音频必须通过解码才进入素材列表。替换使用新素材引用，不覆盖或自动删除旧文件，保证撤销与预览快照可用。
