---
description: 规划命令：导需求 → 生成 PRD → 设计架构（加载 prd-generator + architecture-designer skill）
---

## /vibe-plan — 项目规划

需求: $ARGUMENTS

### 会话隔离
生成 SID = `plan-{今日日期}-{4位随机}`。注册：`python C:/Users/fms/.claude/harness/blackboard.py register <SID> "vibe-plan (<需求摘要>)"`
> 会话异常中断时，需手动从 blackboard 清除本 SID：`python C:/Users/fms/.claude/harness/blackboard.py remove <SID>`

### 守卫
若 $ARGUMENTS 为空 → 先用 question 工具询问项目目标，再继续

### 阶段1: 头脑风暴
- 逐条提问收集原始需求（每次一个问题）
- 识别核心功能模块和边缘功能
- 确认项目名称和目标用户

### 阶段2: 生成 PRD（skill: prd-generator）
- 加载 `prd-generator` skill
- 将阶段1的需求转化为结构化 PRD
- 每个功能块补验收标准
- 输出到 `docs/01-PRD.md`

### 阶段3: 设计架构（skill: architecture-designer + architecture-selection）
- 加载 `architecture-designer` skill
- 读取 `docs/01-PRD.md`（含 §3.1 NFR）
- **先加载 `architecture-selection` skill**：
  - 对 NFR 适用的维度用 question 工具弹选项（含 ⭐推荐 + 优劣），用户选定
  - 每维记录为 docs/02-ARCHITECTURE.md §9 选型表一行；不适用维度显式标注
  - 每个非平凡选型写 ADR 到 `docs/05-DECISIONS.md`（Step 10）
- 锁定技术栈（须来自 architecture-selection 目录）
- 设计目录分层、数据模型、服务端边界
- 标记 Protected Region
- 输出库清单（Step 6）、命名约定（Step 7）、测试策略（Step 8）
- 初始化 `docs/04-CONTRACTS.md` 框架（库清单 + 命名约定 + 共享类型占位）
- 生成 `.opencode/quality-gate.js`：
  - 从 `~/.config/opencode/templates/quality-gate-template.js` 复制
  - 替换 `__APPROVED_LIBS_REPLACE_START__` 到 `__APPROVED_LIBS_REPLACE_END__` 之间的内容
    （包括 `const APPROVED_LIBS = [];`）为实际库清单数组
  - 用实际 Protected Region 填充 `PROTECTED_REGIONS` 数组
  - 用实际测试配置填充 `TEST_DIRS` 和 `COVERAGE_TARGETS`
- **验证 quality-gate.js 能跑**：`node .opencode/quality-gate.js` -> exit 0 -> 通过
  - 失败 -> 修复配置 -> 重新运行 -> 直到通过
- **生成 `docs/DoD.md`**（项目级完成底线，per-project 固定）：
  - 从 `~/.config/opencode/templates/DoD-template.md` 复制到 `docs/DoD.md`
  - **增量保护**：`docs/DoD.md` 已存在 -> 不覆盖（DoD 定稿后不重谈），仅提示用户
  - 按项目情况裁剪（保留五段结构：Correctness / Quality / Integration / Documentation / Ship-readiness）
  - 同步到 `docs/02-ARCHITECTURE.md`（引用 DoD.md 作为 §8 之后的完成闸门说明）
- 输出到 `docs/02-ARCHITECTURE.md`

### 阶段4: 定视觉（浏览器访问参考站 + CLI 降级）
- **环境检测**：
  - 尝试 `playwright_navigate`（导航到 `about:blank`）
  - 成功 -> 浏览器模式，走完整流程
  - 失败 -> **CLI 降级模式**：
    - 用 `webfetch` 获取参考网站页面内容
    - 用 `doubao_analyze_image` 无法截图 -> 跳过视觉分析
    - 从 HTML 结构提取：布局结构、导航层级、CSS 类命名模式
    - 标注"CLI 降级：视觉分析不完整，需人工补充"
    - 不阻断流程，继续后续阶段
- 浏览器可用时的完整流程：
  - 用 playwright 访问 2-3 个参考网站（PRD §2 中列出的）
  - 实际浏览导航、点击功能、感受交互
  - 每站关键页截图 -> `references/design/reference/`
  - 用 vision 分析工具分析截图（优先 `doubao_analyze_image`，不可用时跳过，不阻塞）
  - 提取：布局 / 导航结构 / 配色 / 气质
  - 写入 PRD §2（附参考截图路径）

### 产出
- `docs/01-PRD.md`（含 §3.1 NFR）
- `docs/02-ARCHITECTURE.md`（含库清单、命名约定、测试策略、§9 六主题选型）
- `docs/04-CONTRACTS.md`（契约框架：库清单 + 命名约定 + 共享类型占位）
- `docs/05-DECISIONS.md`（ADR 决策记录，随选型追加）
- `docs/DoD.md`（项目级 Definition of Done，五段固定清单）
- `.opencode/quality-gate.js`（根据架构配置生成，含 G05 架构完备性检查）

### 收尾
- 确保 `docs/03-STATUS.md` 存在，不存在则创建
- 更新 `docs/03-STATUS.md` 阶段状态
- 确保 `.gitignore` 不忽略 `.vibecoding/`（稠密轨需 git 追踪，worktree 与主工作区共享）
- 将项目名称、技术栈、数据库、部署方式回填到 `AGENTS.md`
- 向用户汇报文档位置、参考截图位置和关键决策
- 提示用户：可运行 `/vibe-spec` 拆分切片
- 从 blackboard 移除本会话：`python C:/Users/fms/.claude/harness/blackboard.py archive <SID>`