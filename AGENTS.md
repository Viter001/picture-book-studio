# 项目协作约定

- 本项目根目录：`E:/code saving/PICTURE-BOOK-STUDIO`。遵循父级 AGENTS.md。
- 使用已安装的 `project-change-delivery` 技能；技能入口为 `C:/Users/gaozh/.codex/skills/project-change-delivery/SKILL.md`。
- 完成变更后执行相关验证、更新 DEVLOG.md，并创建中文标题和说明的 Git 提交；只提交本次相关文件。
- 当前为纯本地仓库。推送、远程建库与发布须有用户授权。
- 原绘本项目是参考来源，不因本项目任务自动获得修改原项目的授权。原始材料保持不动。
- GraphFlow 代码探索先检查实际可用工具；调用必须显式传入本项目 rootDir，禁止使用父级集合目录。不安装 GraphFlow 或自动 hooks，不修改 ACL 和密钥配置。
- 已确定 Electron + React + 自有绘本模型路线；配套组件、首版细项和视觉设计待确定；目前没有应用启动、构建或运行时测试命令，不得声称应用可运行。
- 管理记录：QUESTIONS.md 管需求裁决，FEEDBACK.md 管反馈整改，DEVLOG.md 管开发摘要，docs/acceptance.md 管验收与证据。

- 产品用途不限定绘本，可覆盖 Galgame 等交互叙事作品；绘本是首个验证场景。作品核心与导出载体应分离，多目标导出和具体剧情规则仍待逐项确定，不把用途开放理解为通用游戏引擎范围。

- 规划分层：docs/product-roadmap.md 管全局设计与发展，docs/product-plan-mvp.md 管首版候选范围与验收。全局讨论、专项建议及架构预留不自动进入 MVP；只有明确列入并确认的版本功能才成为实现与交付要求。预留扩展空间不等于提前实现所有能力。
