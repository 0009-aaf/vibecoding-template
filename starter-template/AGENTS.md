# AGENTS.md — AI 行为约定

> 复制到新项目根目录，作为 AI 的全局上下文。

## 项目信息
- 项目名称：
- 技术栈：
- 数据库：
- 部署方式：
- Obsidian vault：`~/.config/opencode/opencode.json` 中配置（`references.vault.path`）

## 核心文档
- `docs/01-PRD.md` — 需求与验收标准
- `docs/02-ARCHITECTURE.md` — 架构方案
- `docs/03-STATUS.md` — 项目状态（每次更新）

## 全局命令
- `/vibe-plan` — 导需求 → 生成 PRD → 设计架构 + 浏览器参考站截图
- `/vibe-spec` — 拆切片
- `/vibe-implement` — 按切片实现 + 浏览器功能验证
- `/vibe-audit` — 提交前审计
- `/vibe-status` - 查看项目全貌（切片进度/活跃锁/建议下一步）
- `/vault-sync` — 同步到 Obsidian

## 截图目录
- `references/design/reference/` — 定视觉时参考站截图
- `references/design/verification/<slice>/` — 切片浏览器验证截图

## 编码规范
- 入口判空：API 响应、用户输入、文件读取、环境变量，覆盖 null/undefined/[]/"" 四种空值
- 精准修改：只改需要的代码，不顺手改邻居
- catch 必处理：禁止空 catch，要么处理要么显式 re-throw（带 cause）
- 异常不吞：每个错误路径必须追溯到处理或传播
- 密钥不进前端、不进仓库，用环境变量

## 禁止事项
- 不得修改未点名的文件
- 不得编写 AI 风味描述（"智能"、"赋能"、"助力"、"驱动"）
- 不得覆盖 Protected Region 标记的代码
- 不得在代码中硬编码密钥

## 工作流
- 每次迭代一个切片（`slices/<编号>/spec.md`）
- 每完成一个切片：跑测试 → 过 lint → 运行 `node .opencode/quality-gate.js` → 浏览器验证 → git commit
- 更新 `docs/03-STATUS.md` 上下文摘要