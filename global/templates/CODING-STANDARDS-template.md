# Coding Standards — [项目名称]

> 项目级代码规范（plan 阶段按技术栈裁剪生成）。只含本项目要用的子集（≤35 条）；
> 全量规范见全局 `coding-standards` skill 族（58 条 + 语言专项），冲突时以本项目文档为准（项目可覆盖全局）。

## 1. 命名规范

| # | 规则 | 示例 |
|---|------|------|
| N1 | 变量/函数：可读性优先，禁止缩写（`id`/`url`/`req`/`res`/`ctx` 除外） | `getUserById` 而非 `gtUsr` |
| N2 | 布尔值：`is`/`has`/`should` 前缀 | `isActive` / `hasPermission` |
| N3 | 常量：全大写 + 下划线 | `MAX_RETRY_COUNT` |
| N4 | 函数：动词开头 | `fetchUsers` / `calculateTotal` / `handleClick` |
| N5 | 类/组件/类型：PascalCase；变量/函数/字段：camelCase | `UserService` / `userService` |
| N6 | API 字段：camelCase；DB 列：snake_case；统一时间字段 | `userId` / `user_id` / `createdAt`→`user.created_at` |

## 2. 文件命名与组织

| # | 规则 |
|---|------|
| F1 | 目录：kebab-case（feature 目录） |
| F2 | 组件文件：PascalCase（`UserCard.tsx`）；逻辑模块：camelCase/kebab-case（`auth.ts`） |
| F3 | 测试文件：`<name>.spec.<ext>` / `<name>.test.<ext>` 与被测文件同目录或指定测试目录 |
| F4 | 单文件 ≤300 行，超了拆模块；单函数 ≤50 行（函数式或初始化除外） |
| F5 | 一个文件只放一个主要模块/类/组件 |

## 3. 技术栈专项

> 从 02-ARCHITECTURE.md 选型裁剪（只留主栈对应专项）。

### 3.x [主语言/框架]

（由 vibe-plan 按技术栈生成，例如 TS/React/Node/Python/Vue 等——从全局 coding-standards-<lang> 摘取 ≤15 条）

## 4. 契约级约定（与 04-CONTRACTS.md 对齐）

- API 路由：`/api/v1/<资源名>`（复数）
- API 请求/响应：JSON；错误格式 RFC 9457（`type/title/detail`），错误码须在 `docs/04-CONTRACTS.md` §4 注册表登记
- 版本控制：接口变更提供 `v1`/`v2`，不做 silent breaking change
- feature flag：命名 `<域>_<功能>_<日期>`（如 `auth_new_login_20260901`）；每个 flag 创建时登记 `docs/TECH-DEBT.md`（建议处理时机=下个迭代/日期），到期未清理会被 audit 提醒；禁止用 flag 遮蔽未完成的契约变更（该走 ADR + v2）

## 5. Commit 规范（Conventional Commits）

- 格式：`<type>(<scope>): <subject>`，type ∈ `feat / fix / docs / refactor / test / chore`
- scope：feature 名（如 `feat(auth): 增加登录`）
- Body：每个非琐碎变更文件一行 `<文件>: <该文件的功能>`（CM11——只描述文件职责，不描述本次改动）
- 禁止裸 commit message（空/泛义），禁止 `wip` 提交到 main

## 6. 引用

| 需求 | 位置 |
|------|------|
| 全量通用规范（58 条） | skill: `coding-standards` |
| 语言专项 | skill: `coding-standards-{ts,react,node,python,vue,c,api,html,shell,wx}` |
| 补充阅读 | vault `40_Knowledge/lessons-learned.md`（本机踩坑教训） |

## 变更记录

| 日期 | 变更 | 原因 |
|---|---|---|