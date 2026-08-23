---
name: coding-standards
description: 编码规范 v1.9（通用规则 81 条编号，B/C/CM/CX/D/EN/F/M/N/P/S/T 系列）。每次编码任务开始前必读。核心底线：入口判空、精准修改、catch 必处理、异常不吞。语言专项已拆分到 coding-standards-{ts,react,vue,html,node,python,c,api,shell,wx} 子 skill（路由表见 §六）。
---

# 编码规范 v1.9

> **CRITICAL**：每次编码任务开始前，先读取本文件。本文件会从每次踩坑中自动进化。
>
> 最后更新：2026-08-23 | 通用规则：81 条编号（各系列见 §一~五、§十二） | 版本：v1.9
> 语言专项规则：见各 coding-standards-<lang> 子 skill（TS/Python/API/Vue/C/React/Node/WX）
> 经验教训：见 vault `40_Knowledge/lessons-learned.md`
>
> 参考来源：Google Style Guides、Google eng-practices、OpenAI Codex Best Practices、Conventional Commits v1.0.0

---

## 元规则（本文档自身的规则）

| # | 规则 | 触发条件 |
|---|------|---------|
| M1 | 每次编码前完整阅读本文件 | SessionStart / 编码任务开始 |
| M2 | 踩坑后**立即**追加到 §七·经验教训，并同步 vault `40_Knowledge/lessons-learned.md` | Bug 修复 / 用户纠正 |
| M3 | 新规则编号递增，标注日期和来源 | 追加规则时 |
| M4 | 同类规则累积 ≥3 条 → 提炼为正式条目升入 §一~六 | 经验教训区同类 ≥3 |
| M5 | 本文件与项目宪法 `constitution.md` 互补：宪法管不可协商行为底线（C1 判空/C2 精准修改/C3-C4 异常），本文件管具体技术规范 | 全程 |
| M6 | 语言专项规则优先于通用规则，有冲突时以专项为准 | 多语言项目 |

---

## 一、代码质量

### 1.1 命名

| # | 规则 | 示例 |
|---|------|------|
| N1 | 变量/函数名自解释，不用缩写（除公认：`id`/`url`/`req`/`res`/`ctx`） | `getUserById` 而非 `gtUsr` |
| N2 | 布尔值用 `is`/`has`/`should` 前缀 | `isActive`、`hasPermission` |
| N3 | 常量全大写蛇形 | `MAX_RETRY_COUNT` |
| N4 | 函数名动词开头 | `fetchUsers`、`calculateTotal`、`handleClick` |
| N5 | 类/组件名 PascalCase，其余 camelCase | TS/JS 项目 |

### 1.2 函数设计

| # | 规则 |
|---|------|
| F1 | 单一职责：一个函数只做一件事，≤50 行（配置/初始化除外） |
| F2 | 纯函数优先：相同输入 → 相同输出，无副作用 |
| F3 | 参数 ≤4 个，超过用对象参数 |
| F4 | 避免标志位参数 (`func(true)`)，拆成两个函数或传 options 对象 |
| F5 | 提前返回 (early return)，减少嵌套 |
| F6 | 禁止深层嵌套：≤3 层，超过用 extraction 或 guard clause |

### 1.3 注释

| # | 规则 |
|---|------|
| C1 | 解释 WHY，不是 WHAT（代码说清楚做什么，注释说清楚为什么这样做） |
| C2 | 复杂的正则/算法/业务规则必须注释 |
| C3 | TODO/FIXME/HACK 必须标注日期和负责人 |
| C4 | 不写废话注释 (`// 获取用户` 上面一行就是 `function getUser`) |

### 1.4 文件组织

| # | 规则 |
|---|------|
| D1 | 一个文件只导出一个主要模块/类/组件 |
| D2 | import 顺序：外部库 → 内部模块 → 相对路径 → 样式/资源 |
| D3 | 文件 ≤300 行，超出拆模块 |

---

## 二、边界防御

| # | 规则 | 触发点 |
|---|------|--------|
| B1 | 外部数据入口判空：API 响应、用户输入、文件读取、环境变量 | 所有 IO 边界 |
| B2 | 判空覆盖四种：`null`、`undefined`、空数组 `[]`、空字符串 `""` | 入口处 |
| B3 | `<` vs `<=`、`slice`、`substring` 开闭区间确认，尤其分页 offset/limit | 循环和切片 |
| B4 | async/await 之间数据可能已变，写操作保证幂等 | 异步操作 |
| B5 | 每个 `open`/`connect`/`lock`/`subscribe` 有对应的 `finally` 释放 | 资源操作 |
| B6 | catch 块必须处理或显式抛出新错误，禁止空 catch | 异常处理 |
| B7 | 数组/集合操作前判空，禁止 `.length`/`.map` 在 null 上调用 | 集合操作 |

---

## 三、安全

| # | 规则 |
|---|------|
| S1 | 用户输入永远不可信：SQL/HTML/Shell/URL 拼接前必须参数化或转义 |
| S2 | 密钥/Token/密码不入代码、不入 git、不入日志 |
| S3 | 环境变量读取失败必须报错，禁止静默降级到默认值（除非有安全兜底） |
| S4 | 敏感操作（删除/支付/权限变更）需要二次确认 |
| S5 | 依赖版本定期审查，已知漏洞包立即升级 |
| S6 | 禁止 `eval`、`new Function`、用户可控的动态执行 |

---

## 四、测试

| # | 规则 |
|---|------|
| T1 | 新功能先写测试再实现；修 bug 先写复现脚本 |
| T2 | 测试覆盖：正常路径 + null/空值 + 边界值 (0/-1/MAX/首尾元素) |
| T3 | 测试独立：单测不依赖网络/数据库/文件系统/执行顺序 |
| T4 | 关键业务逻辑覆盖率 ≥80% |

---

## 五、性能

| # | 规则 |
|---|------|
| P1 | 循环内不做数据库查询/HTTP 请求/文件 IO |
| P2 | 大数据量分批处理，避免一次性加载到内存 |
| P3 | 高频事件（scroll/resize/input）必须节流/防抖 |
| P4 | 图片/静态资源压缩 + 懒加载 |

---

## 六、语言专项（按需加载）

> 通用规则在本文件 §一~五。语言专项规则拆分到独立 skill，按文件类型自动加载。

| 语言/场景 | Skill | 触发条件 | 条数 |
|-----------|-------|----------|------|
| TypeScript | `coding-standards-ts` | `.ts` 文件（`.tsx` 优先加载 react） | 10 |
| React | `coding-standards-react` | `.jsx`/`.tsx` 组件 | 3 |
| Vue 3 | `coding-standards-vue` | `.vue` 文件 | 10 |
| HTML/CSS | `coding-standards-html` | `.html`/`.css` 静态页 | 3 |
| Node.js 后端 | `coding-standards-node` | Express/Koa/Fastify 入口 | 24 |
| Python | `coding-standards-python` | `.py` 文件 | 9 |
| C 语言 | `coding-standards-c` | `.c`/`.h` 文件 | 8 |
| REST API | `coding-standards-api` | API 路由/controller | 9 |
| Shell/PowerShell | `coding-standards-shell` | `.sh`/`.ps1` 脚本 | 12 |
| 微信小程序 | `coding-standards-wx` | `.wxml` 文件 | 16 |

> 触发：Agent 检测到对应文件类型时自动 `skill("coding-standards-<lang>")`

---

## 七、经验教训

> 踩坑记录已移至 vault `40_Knowledge/lessons-learned.md`，按日期追加。
> 格式：日期 | 来源 | 问题 | 规则编号
> 踩坑后**立即**追加到 vault，并同步更新对应语言 skill 或本文件规则。

---

## 八、自检清单（每次提交前过一遍）

```
□ 外部输入都判空了？                     → B1 B2
□ 开闭区间确认了？                        → B3
□ 异步操作有竞态窗口吗？                  → B4
□ 资源都 finally 释放了？                 → B5
□ catch 块没有空的？                      → B6
□ 正常+边界+空值有测试？                  → T2
□ 敏感信息没硬编码/没打日志？             → S2 S3
□ 循环里没 IO 调用？                      → P1
□ 改动最小化，没顺手改邻居代码？          → F1（精准修改）
□ Commit 带了 type 前缀？                 → CM1
□ Commit subject ≤50 字符？               → CM2
□ 一个 commit 只做一件事？                → CM8
□ Body 列了文件功能清单？                 → CM11
□ 没提交密钥/.env/构建产物？              → CM10
□ 源文件 UTF-8 / 编译器声明了字符集？     → EN1 EN2
□ 模块边界：没跨 feature import？           -> M10 M14
□ shared 只被多个 feature 用？              -> M15 M16
□ 函数名描述没用"和"？                      -> M20 M3
```

> 语言专项自检（按需加载各子 skill）：
> TS / Python / API / Vue / C / React / Node / WX 各有独立自检清单

---

## 九、代码审查策略

> 审查输出格式见本文件 §九 RV1-RV4；方法论细节见 [[2026-06-12-代码阅读与审查方法论]]（vault）

### OpenAI Codex 最佳实践

| # | 规则 |
|---|------|
| CX1 | 每个仓库根目录放 `AGENTS.md`：描述项目结构、构建/测试命令、编码约定、禁止操作、完成标准 |
| CX2 | 复杂任务先 plan 再 code：`/plan` 让 Agent 探索仓库、提追问、生成执行计划，确认后再动手 |
| CX3 | Test-first 验证循环：先写失败测试 → 提交测试 → Agent 实现直到全绿 → 人工重跑确认 |
| CX4 | 任务描述用 Goal-Context-Constraints-Done 四要素格式，不用步骤式指令 |

---

## 十、Commit 规范 (Conventional Commits v1.0.0)

> 参考：conventionalcommits.org / Google eng-practices / 50/72 Rule

### 10.1 消息格式

```
<type>(<optional scope>): <short description>

<optional body>

<optional footer(s)>
```

### 10.2 Type 枚举

| Type | 用途 | SemVer |
|------|------|--------|
| `feat` | 新功能 | MINOR |
| `fix` | Bug 修复 | PATCH |
| `docs` | 文档变更 | — |
| `style` | 格式/空格/分号，非代码逻辑 | — |
| `refactor` | 重构，不改变行为 | — |
| `perf` | 性能优化 | PATCH |
| `test` | 添加或修改测试 | — |
| `build` | 构建系统或依赖变更 | — |
| `ci` | CI 配置变更 | — |
| `chore` | 其他杂务（不影响 src/test） | — |

### 10.3 规则

| # | 规则 |
|---|------|
| CM1 | 所有 commit 必须带 type 前缀：`feat:` / `fix:` / `refactor:` 等 |
| CM2 | Subject line ≤50 字符，英文用 imperative mood（"Add" 而非 "Added"） |
| CM3 | Subject 用中文时以动词开头："新增用户登录"、"修复密码重置" |
| CM4 | Body 与 subject 之间空一行，Body 每行 ≤72 字符 |
| CM5 | Body 解释 WHY 和 WHAT，不解释 HOW（代码自解释） |
| CM6 | 破坏性变更：type 后加 `!`（`feat!:`）或在 footer 加 `BREAKING CHANGE:` |
| CM7 | 关联 issue：footer 中 `Closes #123` / `Refs #456` |
| CM8 | 一个 commit 只做一件事（原子提交），避免"改 A + 顺手改 B"混在一起 |
| CM9 | Commit 前确认编译通过 + 测试通过 + lint 无新增告警 |
| CM10 | 禁止提交：密钥/Token/`.env`（含真实值）/构建产物/IDE 个人配置 |
| CM11 | Body 含文件功能清单：每个非琐碎变更文件一行 `<文件>: <功能> + <本次变更>`（例：`quality-gate.js`: M02 命令注入修复，staged 文件名改 execFileSync 参数数组），让提交历史可按文件功能阅读，不读 diff 也能看懂改了什么 |

---

## 十一、文件编码与国际化

| # | 规则 |
|---|------|
| EN1 | 所有源文件统一 **UTF-8 without BOM**，不接受 GBK/Shift_JIS/Latin-1 |
| EN2 | 编译器显式声明字符集：GCC `-finput-charset=UTF-8 -fexec-charset=UTF-8`，MSVC `/utf-8` |
| EN3 | Windows 控制台输出中文前执行 `system("chcp 65001 > nul")` 或用 `SetConsoleOutputCP(CP_UTF8)` |
| EN4 | 用户可见字符串集中管理（i18n key / 资源文件），禁止代码中散落硬编码文案 |

---

## 十二、模块拆分与边界

> 来源：Parnas 1972（信息隐藏）、Martin Fowler（变更耦合）、Sam Newman（耦合分类）、GitLab 2026（AI 友好模块化）、arc42（内聚）、Feature-Sliced Design（Public API）、Nx（shared 提升规则）

### 12.1 何时拆模块（4 条）

| # | 规则 |
|---|------|
| M1 | **信息隐藏**：模块边界隐藏设计决策，不按流程图步骤拆（Parnas） |
| M2 | **一起变的放一起**：代码变更耦合度决定归属，不按文件大小拆（Fowler） |
| M3 | **单一职责**：一个模块只有一个变更理由，描述时不用"和"（SRP/arc42） |
| M4 | **不过度拆**：拆出来的模块间耦合 > 内聚增益时，不该拆（arc42/TypeRoof） |

### 12.2 耦合分类（4 条）

| # | 规则 |
|---|------|
| M5 | **Domain 耦合 ✅**：A 调 B 因为需要 B 的能力，可接受但需最小化 |
| M6 | **Pass-through 耦合 ⚠️**：A 把数据透传给 C 自己不用，应重构为 C 直接调源 |
| M7 | **Common 耦合 ❌**：模块共享数据库表/资源，必须修：每个模块拥有自己的数据 |
| M8 | **Content 耦合 ❌**：直接读另一模块内部状态/数据结构，绝对禁止 |

### 12.3 依赖方向（4 条）

| # | 规则 |
|---|------|
| M9 | Feature -> Shared ✅ 允许 |
| M10 | Feature -> Feature ❌ 禁止（走 shared 或事件通信） |
| M11 | Shared -> Feature ❌ 禁止（shared 不依赖任何 feature） |
| M12 | App -> Feature ✅ 允许（App 只做 wiring，不写业务逻辑） |

### 12.4 Public API（2 条）

| # | 规则 |
|---|------|
| M13 | 每个 feature 有 `index.ts`，只导出必要的接口，内部用 private/internal 隐藏 |
| M14 | 外部不 import feature 内部文件，只通过 `index.ts` 访问 |

### 12.5 shared 提升规则（2 条）

| # | 规则 |
|---|------|
| M15 | 第二个 feature 需要时才提升到 shared，不提前抽象 |
| M16 | 不为单个 feature 创建 shared 模块 |

### 12.6 数据所有权（3 条）

| # | 规则 |
|---|------|
| M17 | 不共享数据库表，每个模块拥有自己的数据（Newman） |
| M18 | 模块间传 ID 不传对象，保持低耦合（Android） |
| M19 | 跨上下文用防腐层翻译，不直接暴露内部模型（Evans） |

### 12.7 函数拆分触发（3 条）

| # | 规则 |
|---|------|
| M20 | 函数名描述需要"和"连接 -> 拆（SRP） |
| M21 | 复制粘贴 >2 行 或 1 分钟内读不懂 -> 拆（Stanford/StackExchange） |
| M22 | 超过 25 行 或需要 >20 个测试用例覆盖 -> 考虑拆（Stanford/StackExchange） |

### 12.8 AI 友好模块化（1 条）

| # | 规则 |
|---|------|
| M23 | 小模块 + 明确接口 = AI 可推理；边界清晰 = 变更局部化（GitLab 2026） |

---

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-06-11 | 初版：20 条规则，涵盖质量/边界/安全/测试/性能/TS/Python/前端 |
| v1.1 | 2026-06-11 | 新增 15 条：TS 编译标志+运行时校验+CI 阻断、Python Mypy+Bandit+配置规范、API 错误处理 9 条 |
| v1.2 | 2026-06-11 | 新增 Vue3(10条)+React(15条)+Node.js(12条) 语言专项规则 |
| v1.3 | 2026-06-12 | 新增微信小程序专项规则(WX1-4) + ledger-miniapp 审查经验教训 4 条 |
| v1.4 | 2026-06-27 | 新增 C 语言专项规则(C1-C8) |
| v1.5 | 2026-06-27 | 新增 Commit 规范 10 条(CM1-CM10)、编码与国际化 4 条(EN1-EN4) |
| v1.6 | 2026-06-27 | 新增 OpenAI Codex 最佳实践 4 条(CX1-CX4)、审查输出格式 4 条(RV1-RV4)；C 语言专项；Google Nit 约定 |
| v1.7 | 2026-08-09 | 新增 §十二 模块拆分与边界 23 条(M1-M23)，来源：Parnas/Fowler/Newman/GitLab/arc42/Feature-Sliced/Nx |
| v1.8 | 2026-08-09 | 拆分语言专项到独立 skill（ts/python/api/vue/c）；§七经验教训移至 vault `40_Knowledge/lessons-learned.md`；§六改为路由表；§八自检清单移除语言专项条目 |
| v1.9 | 2026-08-23 | 新增 CM11（提交 Body 文件功能清单：每文件一行"功能+变更"，提交历史可按功能阅读）；路由表补 shell/html 并修正全部条数 |
