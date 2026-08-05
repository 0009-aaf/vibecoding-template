# AGENTS.md — AI 行为约定

> 本项目是 Vibecoding 开发架构的模板项目，用于生成新项目的脚手架和 Skill。

## 核心文档
- `docs/01-PRD.md` — 本架构的 PRD
- `docs/02-ARCHITECTURE.md` — 本架构的架构说明
- `docs/03-STATUS.md` — 项目状态

## 编码规范
- 入口判空：覆盖 null/undefined/[]/"" 四种空值
- 精准修改：只改需要的代码，不顺手改邻居
- catch 必处理：禁止空 catch
- 异常不吞：每个错误路径追溯到处理或传播
- 密钥不进前端、不进仓库，用环境变量

## 禁止事项
- 不得修改未点名的文件
- 不得覆盖 Protected Region 标记的代码（`.vibecoding/quality-gate.js`、`.vibecoding/templates/`、`starter-template/AGENTS.md`）
- 不得在代码中硬编码密钥

## 工作流
- 每次迭代一个切片（`slices/<编号>/spec.md`）
- 每完成一个切片：跑测试 → 过 lint → 运行 `node .vibecoding/quality-gate.js` → git commit
- 更新 `docs/03-STATUS.md` 上下文摘要