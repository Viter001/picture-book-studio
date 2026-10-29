# 项目协作约定

- 本项目根目录：`E:/code saving/PICTURE-BOOK-STUDIO`。遵循父级 AGENTS.md。
- 使用已安装的 `project-change-delivery` 技能（本次文档迁移依据 v0.2.0）；技能入口为 `C:/Users/gaozh/.codex/skills/project-change-delivery/SKILL.md`，后续以实际读取版本为准。
- 完成变更后执行相关验证、更新 DEVLOG.md，并创建中文标题和说明的 Git 提交；只提交本次相关文件。
- 当前为纯本地仓库。推送、远程建库与发布须有用户授权。
- 原绘本项目是参考来源，不因本项目任务自动获得修改原项目的授权。原始材料保持不动。
- GraphFlow 代码探索先检查实际可用工具；调用必须显式传入本项目 rootDir，禁止使用父级集合目录。不安装 GraphFlow 或自动 hooks，不修改 ACL 和密钥配置。
- 已实现 Electron + React + TypeScript + React Flow + 自有作品模型开发预览版。命令：npm test、npm run build、npm start、npm run test:electron、npm run test:integration、npm run package。实际验收范围及运行环境限制以 docs/acceptance.md 为准，不把受控自动化测试等同于普通桌面人工验收。
- 管理记录：QUESTIONS.md 仅管有影响的取舍、范围及规范裁决，顶部维护当前待裁决总览；FEEDBACK.md 先列未关闭整改清单，再写详情；DEVLOG.md 按阶段汇总成果；DISCUSSION-LOG.md 按实质对话轮次记录提出、回应和推进；docs/acceptance.md 管验收与证据；原始执行输出留在 .agent/runs/。
- 普通需求、整理文档、开始执行和调用工具不自动新增 Q；无新增信息的“继续”并入原讨论。旧编号不回收，迁移保留映射；已被后续裁决取代的状态明确标为历史。
- 同一事项只维护一个完整主记录，其他文档简述并链接；代理验证通过不等于用户复验关闭，提供安装步骤不等于已安装或已连接。

- 产品用途不限定绘本，可覆盖 Galgame 等交互叙事作品；绘本是首个验证场景。作品核心与导出载体应分离，多目标导出和具体剧情规则仍待逐项确定，不把用途开放理解为通用游戏引擎范围。

- 规划分层：docs/product-roadmap.md 管全局设计与发展，docs/product-plan-mvp.md 管首版候选范围与验收。全局讨论、专项建议及架构预留不自动进入 MVP；只有明确列入并确认的版本功能才成为实现与交付要求。预留扩展空间不等于提前实现所有能力。

- 全局设计只维护 docs/product-roadmap.md，技术、视觉、产物规范直接更新对应章节，不另建平行讨论草稿。MVP、裁决、开发日志与验收各司其职；历史文件名仅用于追溯，不作为现行入口。
