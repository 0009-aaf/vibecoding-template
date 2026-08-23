---
description: 实现命令：阶段0环境检测 -> 读契约 -> 写测试 -> 写实现 -> 质量闸门 -> 浏览器验证 -> 人类验收 -> 原子化合并
---

## /vibe-implement - 切片实现

$ARGUMENTS

### 会话隔离
生成 SID = `impl-{切片编号}-{今日日期}-{4位随机}`（fast 模式为 `impl-{切片编号}-{今日日期}-fast-{4位随机}`）。注册：`python ~/.claude/harness/blackboard.py register <SID> "vibe-implement (<切片编号> <切片名>)"`

### 模式门控（J-Space 门控分级）
按任务复杂度选择运行档位，**只加载任务挣得的机制**（fast 减隔离/流程成本，不减验证强度）：

- `--loop`（默认）: 多阶段/多文件/长任务 -> 现行完整 7 阶段
- `--full`: 多步但有界 -> 完整流程，但阶段3.5 浏览器验证可降级跳过（验证报告中标注）
- `--fast`: 单文件或一眼可核验 -> 轻量路径（见下）

**自动探测兜底**（未显式指定 flag 时）：
- `git diff --stat` 相对 main 的改动文件数 ≤2 且切片类型非 API 核心 ->
  提示 "此改动适合 --fast，输入 /vibe-implement <编号> --fast 跳过 worktree 直接改 main"
- 探测不强制，最终由用户选择；用户选择 loop 则按 loop 执行

#### fast 轻量路径（跳过 worktree 与 OS 锁，直接改 main）
- **不做**：切片锁/合并锁、worktree 创建、rebase、原子合并流程（阶段6）
- **仍执行**：阶段1 读契约 -> 阶段2b 写实现 -> 阶段3 全量测试 + quality-gate ->
  阶段5 人类验收 -> 直接 commit + 更新 `docs/03-STATUS.md` + 清 blackboard SID
  （`python ~/.claude/harness/blackboard.py archive <SID>`）
- **测试要求**：fast 仅适用于"无新行为"的改动（文案/样式/配置/纯机械修改）。
  若改动引入新行为 -> 不满足 fast 条件，回退 `--full`/`--loop`（需写测试满足 DoD 红→绿）。
- **阶段2b 增量验证退化为**：无新增测试，每改完一文件跑既有相关测试（如无则跳过），
  阶段3 跑全量既有测试 + quality-gate。
- **强制约束**：quality-gate 必须通过（fast 只减隔离成本，不减验证强度）
- 收尾：`dense-track.md` 写一行 `fast` 记录
- 失败/中断：直接报告用户，无 worktree 可恢复，改动在 git 历史可见

### 守卫
若 $ARGUMENTS 为空 -> 列出 `slices/` 下所有待实现的切片，让用户选择

### 依赖检查
- 读取 `slices/<编号>-<名称>/spec.md` 的"前置依赖"
- 对每个依赖切片，检查 `slices/README.md` 状态列：
  - 不是 `已完成` -> **拒绝启动**，提示"前置切片 XXX 未完成（当前状态：YYY）"
  - 全部 `已完成` -> 继续
- **依赖检查保证**：020 只在 019 合并到 main 后才能启动，因此 020 的 worktree 基于
  含 019 改动的 main 创建，代码完整
- **无依赖但有共享文件的切片**：可并行启动，但阶段6 合并前必须 rebase main，
  把其他切片已合并的共享文件改动拉入，手动解决冲突

### 切片锁（OS 级文件锁，防止同一 worktree 内竞态）
> **fast 模式跳过本步骤**（不建 worktree、不上锁，见"模式门控"）。以下仅 `--loop` / `--full` 执行。
- 读取 `slices/README.md` 的切片列表
- 检查目标切片**状态**列：`已完成` -> 跳过并提示
- 检查目标切片 `session-id` 列：非空 -> 已被其他会话占用，提示并退出
- 空 -> 在主工作区创建 OS 级锁文件（原子操作，跨平台）：
  ```
  node -e "require('fs').openSync('.slice-lock-<编号>','wx')"
  ```
  - `wx` flag = 独占创建：文件已存在则抛异常 -> 锁已被占用，提示退出
  - 创建成功 -> 获得锁，写入 SID 到 `slices/README.md` 并 `git add && git commit`
  - OS 保证 `openSync('wx')` 原子性，两个 agent 同时调用只有一个成功
- 锁释放：合并完成后删除 `.slice-lock-<编号>` 文件

### 并行模式（重要：AI 不自动开并行会话）
vibe workflow 只支持两种并行模式，**AI 不会自动开多 CLI 会话**（不可控+中断即丢）：

1. **串行模式（默认）**：当前会话一次跑一个切片，完成合并后再跑下一个。
   全程用户可控，中断靠 worktree+锁恢复。
2. **用户手动多窗口模式**：用户自己开多个终端窗口，每个窗口运行 `/vibe-implement <编号>`。
   用户全程可观察可中断。worktree + OS 锁 + slices/README.md 状态保证多窗口不冲突。

**AI 不做的事**：
- ❌ 不用 task 工具开子 agent 跑切片（子 agent 无独立 worktree，非真并行）
- ❌ 不自动 spawn 多 CLI 进程（不可控，中断即丢上下文）
- ✅ 只在当前会话串行跑，或在规划阶段输出"每个切片的启动命令"供用户手动开窗口

### 分支策略（git worktree 隔离）
> **为什么用 worktree**：用户手动多窗口并行时，`git checkout` 会切换整个工作区，互相干扰。
> worktree 为每个切片创建独立工作目录，真正并行不冲突。

- worktree 路径：`../<项目名>-slice-<编号>`（项目同级目录）
- 检查 worktree 是否已存在：`git worktree list`
- 不存在 -> 从 main 创建：`git worktree add ../<项目名>-slice-<编号> -b slice/<编号>-<名称> main`
- 已存在 -> 进入阶段0 的中断恢复检测
- **所有代码变更在 worktree 目录中完成**，不碰主工作区
- worktree 中需要 `.opencode/quality-gate.js` 和 `slices/` 才能运行检查
  - quality-gate.js 在 worktree 中通过 `git` 追踪自动可用（同仓库）
  - slices/ 在 worktree 中自动可见（同分支或 main）

### 阶段0: 环境检测 + 中断恢复（新增）

#### 0.1 中断恢复检测
- 检查目标切片的 worktree 是否已存在（`git worktree list`）
- **已存在**（中断恢复场景）：
  - 进入 worktree 目录，检查 `git status`：
    - 有未提交改动 -> 用 question 工具询问用户：
      "检测到未完成的实现（N 个文件已修改），继续 or 重新开始？"
      - 继续 -> 先读 `.vibecoding/dense-track.md` 定位卡在哪一层（✗ 行，见阶段2b 稠密轨），
        再检查已实现到哪一步（看已有文件），从断点接续
      - 重新开始 -> `git checkout . && git clean -fd`（丢弃所有改动）-> 继续 0.2
    - 无未提交改动 -> 直接从阶段1 开始
- **不存在**（全新开始）：
  - 创建 worktree（见上方"分支策略"）
  - 继续 0.2

#### 0.2 环境就绪检查
在 worktree 目录中逐项检查：
- [ ] `node_modules` 存在？-> 否：`npm install`（或对应包管理器）
- [ ] `.env` 存在？-> 否：从主工作区复制 `.env.example`，提示用户填写
- [ ] `docs/04-CONTRACTS.md` 存在？-> 否：报错"缺少契约文档，先运行 /vibe-spec"
- [ ] `docs/02-ARCHITECTURE.md` 存在？-> 否：报错"缺少架构文档，先运行 /vibe-plan"
- [ ] `.opencode/quality-gate.js` 存在？-> 否：报错"缺少质量闸门，先运行 /vibe-plan"
- [ ] 数据库可连接？-> 否：提示用户启动数据库
- [ ] 所有检查通过 -> 进入阶段1

### 阶段1: 读取切片规格 + 契约
- 读取 `slices/<编号>-<名称>/spec.md`
- 读取 `docs/04-CONTRACTS.md`（本切片相关的 API 契约 + 共享类型）
- 读取 `docs/02-ARCHITECTURE.md` §6 库清单（确认只能用哪些库）
- 确认验收标准
- 确认 Protected Region（不可修改的文件）
- 确认共享文件 + 追加标记位置
- 确认切片类型（API / UI / 基础设施）-> 决定测试要求等级
- 确认 spec 中的测试定义（单元/集成/E2E 用例清单）

### 阶段2a: 写测试（新增，先写测试）
- 按 spec §测试定义，先写测试代码：
  - 共享 schema：`src/shared/schemas/<feature>.schema.ts`（zod 定义）
  - 单元测试：`tests/unit/<feature>.test.ts`
  - 集成测试：`tests/integration/<feature>-api.test.ts`
  - E2E 测试（有 UI 切片）：`e2e/<feature>.spec.ts`（骨架：describe + it 占位）
  - 测试数据：`tests/fixtures/<feature>.json`
- **API 端点切片**：强制先写测试（测试来自契约，不是脑补）
- **UI 切片**：E2E 骨架先写（describe + it 占位），实现后填充断言
- 运行测试 -> 预期全部失败
- **检查失败原因**（区分类型）：
  - `Cannot find module` / `is not defined` / `ReferenceError` -> 正确（未实现，预期失败）
  - `AssertionError` / `Expected...Received` -> 测试本身有 bug，修复测试
  - `SyntaxError` -> 测试有语法错误，修复测试
- 确认所有失败都是"未实现"类型 -> 进入阶段2b

#### 反合理化表（阶段2a：写测试）
> 来源：addyosmani/agent-skills anti-rationalization 模式（MIT）。防止跳过步骤的自我合理化。
| 常见借口 | 现实 |
|---|---|
| "UI 切片先写实现，测试最后补" | 没有红→绿，你无法证明实现真的满足了契约；补测多半永远不补 |
| "这个测试太简单，写它浪费时间" | 简单测试的成本最低，恰好是防回归的地板；不写=没有证据 |
| "测试失败是环境问题，不是我的代码" | 先验证环境假设再下结论；在失败原因里找到确凿证据前，都当代码问题处理 |

### 阶段2b: 写实现（增量验证）
- **加载编码规范**（skill: coding-standards）
  - 按文件类型追加子 skill：
    - `.ts`/`.tsx` -> coding-standards-ts + coding-standards-react
    - `.vue` -> coding-standards-vue
    - `.py` -> coding-standards-python
    - `.c`/`.h` -> coding-standards-c
    - Node 后端 -> coding-standards-node
    - API 路由 -> coding-standards-api
    - `.wxml` -> coding-standards-wx
- **遵守契约**：函数签名、API 响应格式必须匹配 `docs/04-CONTRACTS.md`
- **只能用库清单中批准的库**（`docs/02-ARCHITECTURE.md` §6）
- **实现顺序（不可跳过，按依赖关系）**：
  1. `domain/schema.ts`（类型定义，无依赖）
  2. `domain/repository.ts`（依赖 schema）
  3. `api/handler.ts`（依赖 repository）
  4. `ui/`（依赖 api）
  5. 共享文件追加（routes/config，用 @slice 标记包裹）
- **逐文件实现 + 增量验证**：
  - 实现 domain/schema.ts -> 跑相关单元测试 -> 通过 -> 继续
  - 实现 domain/repository.ts -> 跑相关单元测试 -> 通过 -> 继续
  - 实现 api/handler.ts -> 跑集成测试 -> 通过 -> 继续
  - 实现 ui/ -> 跑 E2E -> 通过 -> 继续
  - 某文件测试失败 -> 立即修复该文件 -> 不继续下一个文件
- **共享文件用追加标记修改**：
  ```
  // @slice:<编号>-<名称>
  <追加内容>
  // @end-slice:<编号>-<名称>
  ```
  不同切片的标记区域在 rebase 时不冲突，quality-gate 可解析标记验证
- **Protected Region 不碰**
- **模块边界检查**（实现过程中持续检查，不是事后）：
  - 不跨 feature import（feature A 不 import feature B 内部）-> M10
  - 只通过 feature 的 index.ts 访问其他 feature -> M14
  - shared 只被多个 feature 用，不为单个 feature 创建 -> M15
- 全部文件实现完成 -> 进入阶段3

#### 反合理化表（阶段2b：写实现）
| 常见借口 | 现实 |
|---|---|
| "顺手把旁边文件也重构一下" | 混入范围外改动让 review 和回滚都变难；注意到的问题记下来，另开任务（NOTICED BUT NOT TOUCHING） |
| "这个抽象以后肯定用得上" | 为假想需求建抽象 = 过早抽象；三次使用需求出现前，用朴素实现（incremental Rule 0） |
| "实现不按契约来，反正测试会过" | 契约是团队契约，测试只证明你过了自己的测试；契约漂移是架构债（J-Space 表征漂移） |
| "逐层验证太慢，全部写完再跑" | 一个 bug 会在下游 3 层扩散，最后找不到是哪 500 行改坏的；逐层验证是省时间的 |

#### 稠密轨状态记录（每层验证后落盘 `.vibecoding/dense-track.md`）
- **归属约定**：`.vibecoding/` 应**加入 git 追踪**（同仓库），使 worktree 与主工作区共享同一份 dense-track，
  中断恢复（阶段0.1）无论从哪侧读取都一致；若项目 `.gitignore` 忽略 `.vibecoding/`，先移除该忽略规则
- 每完成一层（schema -> repository -> handler -> ui -> 共享文件）写一行，格式：
  ```
  [<SID>] <日期>
  ✓ <层>  (验证: <测试名> PASS)
  ? <层>  (实现完成，断言通过但下游未验证)
  ✗ <层>  (验证失败，证据: <测试>@<文件>:<行> 期望X实际Y)
  ```
- **稠密轨可无损展开为自然语言**：每一行都必须能解释成完整句子，仅用于内部工作；
  面向用户/验收的汇报仍回到完整自然语言
- **中断恢复定位**（配合阶段0.1）：先读 dense-track.md 看卡在哪一层（✗ 行），
  替代靠 git status 猜进度
- **回滚/重试**：该 SID 对应区块重跑前先清空，避免旧状态污染新尝试
- **fast 模式**：同样写一行 `fast` 记录（含完成层清单），格式：
  ```
  fast <日期> 完成层:<schema,repository,...> (fast 模式, 无新增测试, quality-gate 通过)
  ```
  与 `✓/?/✗` 行风格统一，`vibe-status` 可解析展示

### 阶段3: 全量测试 + 质量闸门
- 从 `docs/02-ARCHITECTURE.md` §8 读取测试命令
- 未定义时按项目类型探测：
  - Node: `npm run test:unit` / `npm run test:integration` / `npm run test:coverage`
  - Python: `pytest tests/unit/` / `pytest tests/integration/` / `pytest --cov`
  - Go: `go test ./tests/unit/` / `go test ./tests/integration/` / `go test -cover`
- 运行单元测试 -> 必须全部通过
- 运行集成测试 -> 必须全部通过
- 运行覆盖率检查 -> 覆盖率必须达标（架构 §8 定义的目标）
- 运行 lint -> 无 error
- 运行 `node .opencode/quality-gate.js` -> 必须通过
- **任一失败** -> 回到阶段2b 修复 -> 重新跑阶段3
- **修复策略（诊断携带重试）**：
  - **先写诊断再重试**，禁止无诊断原地重试：
    ```
    失败诊断: <断言类型>@<文件>:<行> — 期望<X>实际<Y>，疑似根因<一句话>
    ```
  - 第 2 轮起必须引用上轮诊断，构成证据链：`证据链: r1 -> r2 -> ...`
  - 诊断同步写入 dense-track.md 的 ✗ 行（见阶段2b 稠密轨）
  - 编译错误 -> 优先修复（阻塞其他测试）
  - 测试失败 -> 定位失败用例 -> 修复实现（不修测试，除非测试本身有 bug）
  - lint 警告 -> 修复（不阻断但必须处理）
  - quality-gate 阻断 -> 按 M-code 分类处理
- **反合理化表（阶段3：全量测试）**：
  | 常见借口 | 现实 |
  |---|---|
  | "改动太小，跑一次测试够了" | 重复跑未变代码不增加信息（incremental 明确禁止）；不跑则无证据，两者不同 |
  | "测试刚通过过，这次只改了一行" | 这一行可能就是回归来源；改动后必须重跑受影响命令 |
  | "跳过 lint，回头一起修" | 回头不会修；lint 阻塞合并，越早修越便宜 |
  | "质量闸门是老配置，先绕过去" | quality-gate 是架构阶段定的项目底线，绕过 = 假装完成（DoD 红旗） |
- **doubt 循环（同一失败 2 轮无定论时强制触发，替换盲猜）**：
  > 来源：addyosmani/agent-skills `doubt-driven-development`（MIT）。核心：自信 ≠ 正确，
  > 反证比自证更可靠。触发条件 = 同一测试失败 2 轮且诊断无法定位根因（证据链停滞）。
  - **Step 1 CLAIM**：用 2-3 行命名"问题是什么 + 为什么重要"。写不出来 = 还没定位，先回去缩小范围。
  - **Step 2 EXTRACT**：构造最小复现 + 契约（spec 中该层要求）。**只把工件+契约交给审查者，不给你的推理和结论** —— 交出结论只会得到对结论的验证。
  - **Step 3 DOUBT**：调用反证审查（对抗式 prompt，biased to disprove）：
    ```
    对抗式审查：找出这个工件的问题。假设作者过度自信。检查：
    未声明的假设 / 未处理的边界情况 / 隐藏耦合或共享状态 / 契约被违背的方式 /
    打破的既有约定 / 意外输入下的失败模式。不要验证，不要总结。找出问题。
    ARTIFACT: <最小复现>   CONTRACT: <契约>
    ```
    - 复用已有 reviewer/tester 角色，但**剥离结论只传工件**（避免印证偏差）
    - 可跨模型二审（gemini/codex CLI）：交互会话必须显式询问用户是否要，不可静默跳过
    - CLI 不可用 -> 显式报告，不可静默降级
  - **Step 4 RECONCILE**：逐条分类（按优先级）：
    1. 契约误读 -> 先修契约，下轮重分类
    2. 可行动 -> 改工件，重跑循环
    3. 权衡 -> 记录权衡，让用户看到
    4. 噪音 -> 记下，判断是否该补充契约上下文
    - 分类必须对照工件文本，不能无脑照单全收
  - **Step 5 STOP**：满足任一即停 —— 只剩噪音/已考虑项、或 3 轮完成、或用户说"ship it"。3 轮仍有实质问题 = 工件没准备好，上报用户。
  - **Doubt Theater 检测**：2 轮以上审查返回实质发现但 0 条被分类为"可行动" -> 你在表演审查而非真审查，停止并上报。
  - **落盘**：doubt 循环结束（无论 3 轮完成还是 STOP 早停）后，在 dense-track.md 该层 ✗ 行追加 doubt 记录：
    ```
    ✗ <层>  (doubt: <日期> <N>轮 结论:<可行动/噪音/契约误读/权衡> 是否跨模型:<是/否>)
    ```
    供 `/vibe-audit` 检查项7 核对"失败是否已走 doubt 循环"。
- **停止条件**：连续 3 次修复后仍失败（含 doubt 循环后）-> 停止，向用户报告失败详情

### 阶段3.5: 浏览器验证（有 UI 的切片）
- 加载 `e2e-verifier` skill
- **环境检测**：
  - 尝试 `playwright_navigate` -> 成功 = 浏览器可用 -> 走完整 e2e-verifier 流程
  - 失败 = CLI 环境，浏览器不可用 -> **降级模式**：
    - API 切片：用 `curl` / `node fetch` 验证 HTTP 响应码和 JSON body
    - 纯 UI 切片：跳过浏览器验证，标记"CLI 环境无法自动验证，需人工确认"
    - 不阻断提交，但在验证报告中明确标注"CLI 降级"
- 浏览器可用时的完整流程：
  - 启动应用（自动探测启动命令 + 端口隔离 + PID 追踪）
  - 用 playwright 实际操控：点击、填表、走该切片的成功/失败/边界路径
  - **功能断言**（核心）：跳转 URL / 提示文本 / 元素出现是否匹配验收标准
  - 截图存证：`references/design/verification/slice-<编号>/`
  - **UI 视觉核对**（可选）：用 vision 分析工具分析截图，超时则跳过，不阻塞
  - **验证完成后关闭应用进程**（读取 PID，SIGTERM -> 等待 5s -> SIGKILL）
- 输出验证报告
- **功能断言未通过** -> 回到阶段2b 修复 -> 重跑阶段3 + 阶段3.5
- **循环路径明确**：修复后必须重新跑阶段3（全量测试）+ 阶段3.5（浏览器验证）

### 阶段4: 更新状态为"待验收"（调整）
- 更新 `docs/03-STATUS.md`：
  - 切片状态改为 `待验收`
  - 记录实现摘要（修改了哪些文件、测试覆盖率、验证结果）
- 如果 `docs/03-STATUS.md` 不存在，先创建再写入

### 阶段5: 人类验收（调整）
- **DoD 自检（进入验收前必须完成）**：
  - 读取 `docs/DoD.md`（由 /vibe-plan 生成），逐项自检五段清单
  - DoD 未全勾选 -> 先补齐（缺文档/缺回滚/未人类评审等）再提交验收
  - `docs/DoD.md` 不存在 -> 提示用户先运行 /vibe-plan 生成
- **反合理化表（阶段5：人类验收）**：
  | 常见借口 | 现实 |
  |---|---|
  | "测试都过了，直接合并吧" | 测试过 ≠ DoD 过；运行时行为/文档/回滚/人类评审未核（DoD Correctness + Ship-readiness） |
  | "验收标准满足就够了" | AC 是 per-task，DoD 是 per-project 固定底线，缺一不可（definition-of-done） |
  | "文档回头补" | 回头不会补；公共接口/决策记录必须在合并前就位（DoD Documentation） |
  | "人类评审就是走个过场" | 未评审就合并 = 放弃最后防线（DoD 红旗） |
- 展示实现摘要：
  - 修改文件清单
  - 测试覆盖率
  - quality-gate 结果
  - DoD 自检结果
  - 浏览器验证报告（或 CLI 降级报告）
  - 截图路径（如有）
- 等待人类确认
- **验收通过** -> 更新 `docs/03-STATUS.md` 为 `已完成` -> 进入阶段6
- **验收不通过** -> 记录反馈 -> 回到阶段2b 修复 -> 重跑阶段3 + 3.5 + 4 + 5

### 阶段6: 原子化合并（重构）
> **fast 模式跳过本阶段**：无 worktree/分支/锁，验收通过后直接在主工作区 `git commit`
> （见"模式门控"），然后更新 `docs/03-STATUS.md` 为已完成并清 blackboard SID
> （`python ~/.claude/harness/blackboard.py archive <SID>`）。
> 以下仅 `--loop` / `--full` 执行。

#### 6.1 合并准备（在 worktree 内）
- `git rebase main`（拉取其他切片已合并的改动）
  - 冲突 -> 手动解决：
    - 共享文件标记区域冲突 -> 保留双方标记区域（不同切片不重叠）
    - 非标记区域冲突 -> 用 question 工具询问用户选择
  - `git rebase --continue`
- rebase 后重新跑 `node .opencode/quality-gate.js` -> 必须通过
- quality-gate 失败 -> 修复 -> 重新 rebase 检查 -> 通过后继续

#### 6.2 合并锁（串行化，防止并发合并竞态）
- 在主工作区创建合并锁文件（原子操作，跨平台）：
  ```
  node -e "require('fs').openSync('<主工作区>/.merge-lock-<编号>','wx')"
  ```
  - 创建成功 -> 获得合并锁，继续 6.3
  - 创建失败（文件已存在）-> 等待 10 秒重试，最多 3 次
  - 3 次失败 -> 提示"其他切片正在合并，请稍后重试"-> 退出（锁和分支保留，可重跑 /vibe-implement）

#### 6.3 合并 + 清理（原子化，失败可恢复）
> **不切回主工作区**，全程在 worktree 内用 `git -C <主工作区>` 远程操作主仓库。
> 合并锁已保证同一时刻只有一个切片在合并，不需要 checkout main。

按顺序执行，每步成功后继续，失败则记录并继续后续步骤：

1. **合并**：`git -C <主工作区> merge slice/<编号>-<名称>`（rebase 后应为 fast-forward）
   - 失败 -> 手动合并 -> 仍失败 -> 删除合并锁文件，退出
2. **删除 worktree**：`git -C <主工作区> worktree remove ../<项目名>-slice-<编号>`
   - 失败（有未提交文件）-> `git -C <主工作区> worktree remove --force` -> 仍失败 -> 记录警告，继续
3. **删除分支**：`git -C <主工作区> branch -d slice/<编号>-<名称>`
   - 失败 -> 记录警告，继续（分支残留不影响功能）
4. **清空锁**：编辑 `slices/README.md` 清空本切片 `session-id` -> `git -C <主工作区> add slices/README.md && git -C <主工作区> commit -m "unlock: <编号>"`
5. **更新状态**：`docs/03-STATUS.md` 标记切片为 `已完成` -> `git -C <主工作区> add docs/03-STATUS.md && git -C <主工作区> commit -m "done: <编号>"`
6. **删除锁文件**：
   ```
   node -e "require('fs').unlinkSync('<主工作区>/.merge-lock-<编号>'); require('fs').unlinkSync('<主工作区>/.slice-lock-<编号>')"
   ```
   - 文件不存在 -> 忽略（可能已被清理）
7. **从 blackboard 移除本会话**：`python ~/.claude/harness/blackboard.py archive <SID>`

> 如果步骤 4-5 失败（代码已合并但状态未更新）：
> 下次 `/vibe-status` 检测到 main 已包含该切片 commit 但状态仍为"待验收"，
> 会提示运行 `/vibe-clean --fix-status` 自动补做步骤 4-5。

### 失败处理
- **编译错误** -> 立即修复，不继续其他工作
- **测试失败** -> 定位失败用例 -> 修复实现（不修测试，除非测试本身有 bug）
- **连续 3 次修复后仍失败** -> 停止，向用户报告失败详情和建议
- **Protected Region 被修改** -> 立即 `git checkout -- <文件>` 回滚该文件
- **契约不匹配** -> 停止实现，报告"实现与契约不符"，询问用户：更新契约 or 修改实现
- **环境检查失败** -> 提示用户修复环境，不进入实现阶段

### 回滚流程（切片彻底失败时）
1. 回到主工作区
2. 删除锁文件（如存在）：
   ```
   node -e "try{require('fs').unlinkSync('.merge-lock-<编号>')}catch(e){}; try{require('fs').unlinkSync('.slice-lock-<编号>')}catch(e){}"
   ```
3. 删除 worktree：`git -C <主工作区> worktree remove --force ../<项目名>-slice-<编号>`
4. 删除切片分支：`git -C <主工作区> branch -D slice/<编号>-<名称>`
5. 编辑 `slices/README.md`：清空 `session-id`，状态改回 `待开始`（或 `阻塞` 并注明原因）-> `git -C <主工作区> add && commit`
6. 从 blackboard 移除本会话：`python ~/.claude/harness/blackboard.py remove <SID>`
7. **保留半成品代码**（可选）：
   - 如果部分代码有价值 -> 创建 backup 分支：`git -C <主工作区> branch backup/<编号>-<日期>`
   - 提示用户"已创建备份分支 backup/<编号>-<日期>，可稍后参考"
8. 向用户报告：失败原因 + 已回滚 + 建议下一步
