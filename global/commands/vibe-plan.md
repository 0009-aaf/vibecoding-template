---
description: 规划命令：导需求 → 生成 PRD → 设计架构（加载 prd-generator + architecture-designer skill）→ 定视觉（加载 ui-ux-pro-max + frontend-design + web-artifacts-builder）
---

## /vibe-plan — 项目规划

需求: $ARGUMENTS

### 会话隔离
生成 SID = `plan-{今日日期}-{4位随机}`。注册：`python ~/.claude/harness/blackboard.py register <SID> "vibe-plan (<需求摘要>)"`
> 会话异常中断时，需手动从 blackboard 清除本 SID：`python ~/.claude/harness/blackboard.py remove <SID>`

### 守卫
若 $ARGUMENTS 为空 → 先用 question 工具询问项目目标，再继续
全程约束：项目根 `constitution.md` 为最高约束，任何产出违背其条款即否决重做

### 过程播报（禁止静默连跑）
- 进入每个阶段前先输出一行：`[vibe-plan] 阶段N/5：<名称>`（共 5 个阶段）
- 每阶段收尾输出一行产出物路径（如 `docs/01-PRD.md 已生成`）
- 两行/阶段是硬性输出义务：没有播报行视为该阶段未执行；不得合并多个阶段连跑后只汇报一次

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
- **生成 `docs/07-SECURITY.md`（安全基线，与架构选型同生命周期）**：
  - 从 `~/.config/opencode/templates/SECURITY-template.md` 复制
  - 按 02-ARCHITECTURE.md §4 服务端边界与 §9 安全相关选型展开：鉴权、密钥管理、输入校验、CORS/CSRF、依赖漏洞策略
  - 小项目允许逐项标注"不适用(理由)"，但文件必须存在（G05.5 门禁校验存在性，不校验内容质量）
- 输出到 `docs/02-ARCHITECTURE.md`

### 阶段4: 定视觉 → 生成 `docs/09-DESIGN.md`（浏览器访问参考站 + CLI 降级）
- **设计源仲裁（多 skill 同载的冲突规则）**：硬约束红线 > 低保真灰阶纪律 > `ui-ux-pro-max` 数据 > `frontend-design` 审美建议；落地下文以 `docs/09-DESIGN.md` §1 令牌表为准
- **环境检测**：
  - 尝试 `playwright_navigate`（导航到 `about:blank`）
  - 成功 -> 浏览器模式，走完整流程
  - 失败 -> **CLI 降级模式**：
    - 用 `webfetch` 获取参考网站页面内容
    - 用 `doubao_analyze_image` 无法截图 -> 跳过视觉分析
    - 从 HTML 结构提取：布局结构、导航层级、CSS 类命名模式
    - 标注"CLI 降级：视觉分析不完整，需人工补充"（写入 09-DESIGN §7）
    - 不阻断流程，继续后续阶段
- 浏览器可用时的完整流程：
  - 用 playwright 访问 2-3 个参考网站（PRD §2 中列出的）
  - 实际浏览导航、点击功能、感受交互
  - 每站关键页截图 -> `references/design/reference/`
  - 用 vision 分析工具分析截图（优先 `doubao_analyze_image`，不可用时跳过，不阻塞）
  - 提取：布局 / 导航结构 / 配色 / 气质
- **生成 `docs/09-DESIGN.md`（界面设计规格）**：复制 `~/.config/opencode/templates/DESIGN-template.md`，按提取结果填充：
  - **先加载设计 skill（视觉重项目必做，纯后端项目跳过）**：
    1. 加载 `ui-ux-pro-max` → `python ~/.config/opencode/skills/ui-ux-pro-max/scripts/search.py "<产品类型> <行业> <关键词>" --design-system -p "<项目名> --output-dir <项目根>` 生成完整设计系统（pattern/style/colors/typography/effects/anti-patterns）
    2. 加载 `frontend-design` → 对照设计系统审校美学方向（防 AI 模板化：避开 cream+serif+terracotta / 黑底+acid accent / broadsheet 三类默认样）
    3. **视觉重（PRD §2 有明确页面视觉要求）→ 加载 `web-artifacts-builder`** → 用 Git bash 跑 `scripts/init-artifact.sh <tmp目录>` 产出 React 骨架，手写关键页（首页/核心功能页）→ `scripts/bundle-artifact.sh` 打包成**单文件 HTML 静态预览**输出到 `references/design/preview.html`（用户可浏览器直接打开看方向）
       - **bash 探测（机器相关）**：先 `Get-Command bash` 确认真实 Git bash 路径（如 `D:\Git\bin\bash.exe`），**禁用** `C:\Windows\system32\bash.exe`（WSL stub，WSL 未装时直接报错）——见 coding-standards-shell SH13
       - 图标一律内联 SVG（`lucide-react` / 手写 `stroke="currentColor"`），禁用位图/emoji
       - 预览仅定方向，不追求完整：用户确认后细节在 `/vibe-implement` 阶段实现
  - §1 设计令牌（颜色/字体/间距/圆角/阴影/断点，表格化——UI 切片实现的唯一视觉锚点；**来自 ui-ux-pro-max 输出的色板/字体系统**）
  - §2 页面清单（每页布局区块/路由/所属 feature）
  - §3 组件清单与复用（组件库来自 ARCH §9 D2 选型）
  - §4 交互五态规范（loading/empty/error/disabled/skeleton）
  - §4.5 动效基线（模板已内置蒸馏数值：时长/缓动/合成属性约束——生成时原样保留阈值，实现期对表执行）
  - §5 响应式策略 + §6 无障碍基线（允许逐项"不适用(理由)"）
  - §7 参考与截图索引（含 `references/design/preview.html` 引用）
  - 纯后端项目（PRD 无页面模块）：保留文件，整体标注"不适用(理由=无 UI 切片)"
  - PRD §2 收敛为一句话风格方向 + 指向 `docs/09-DESIGN.md`（视觉细节不再散落 PRD）
  - G05.6 门禁校验：有 UI 切片的项目必须存在 09-DESIGN.md（判定口径与 M18 一致）

### 阶段5: 交接文档（README 填充 + 规范与运行文档生成）
- **填充 `README.md`**（原为占位，必须替换）：
  - 项目名：取自 PRD §0 标题
  - 一句话定位：取自 PRD §0"要解决的问题"
  - 技术栈徽章/一行：从 02-ARCHITECTURE.md 选型摘要（Modular Monolith / Next.js / ...）
  - 快速开始：3 条命令（安装/启动/测试），细节指向 `docs/06-RUNBOOK.md`
  - 保留 vibe 命令表与项目结构说明（starter-template 已有）
- **生成 `docs/00-DOC-STANDARD.md`**：复制 `~/.config/opencode/templates/DOC-STANDARD-template.md` 填入项目名（文档链自身的元规范；本命令生成任何 docs/ 文档须遵守）
- **生成 `constitution.md`（项目根，项目宪法）**：复制 `~/.config/opencode/templates/CONSTITUTION-template.md`
  - **增量保护**：已存在 -> 不覆盖（宪法变更须 ADR，C13），仅提示用户
  - 按项目情况裁剪示例列（条款本体不改；删除不适用的条款须记 ADR 说明）
- **生成 `docs/06-RUNBOOK.md`**：复制 `~/.config/opencode/templates/RUNBOOK-template.md`
  - 按选型填充：环境要求（版本）、环境变量清单、启动/测试命令、部署方式、回滚、备份恢复
  - 从 02-ARCHITECTURE.md §9 选型值与 §8 测试策略取实际内容
  - `.env.example`：从 Runbook §2 的变量表生成（只含占位值，无真实密钥）
- **生成 `docs/08-CODING-STANDARDS.md`**：复制 `~/.config/opencode/templates/CODING-STANDARDS-template.md`
  - 按 02-ARCHITECTURE.md 技术栈选型裁剪 §3 技术栈专项：只保留主栈对应 coding-standards-<lang> 的 ≤15 条
  - 通用命名/文件组织/Commit 规范从模板直接带入（N1-N6、F1-F5、Conventional Commits）
  - 保留 §6 引用（全量规范指向 skill，不复制规则全文）
  - 反臃肿原则：文档 ≤35 条约束，超出部分指向 skill 层
- **PRD 确认含 §0 项目背景**（Why/用户/成功标志/排除项/约束）；缺则补齐

### 产出
- `docs/00-DOC-STANDARD.md`（文档元规范——阶段5）
- `constitution.md`（项目根，13 条不可协商条款——阶段5，增量保护）
- `docs/01-PRD.md`（含 §0 项目背景 + §3.1 NFR）
- `docs/02-ARCHITECTURE.md`（含库清单、命名约定、测试策略、§9 十维度选型）
- `docs/04-CONTRACTS.md`（契约框架：库清单 + 命名约定 + 错误码注册表占位 + 共享类型占位）
- `docs/05-DECISIONS.md`（ADR 决策记录，随选型追加）
- `docs/DoD.md`（项目级 Definition of Done，五段固定清单）
- `docs/06-RUNBOOK.md`（运行/环境/部署/回滚/备份——阶段5）
- `docs/07-SECURITY.md`（安全基线：鉴权/密钥/输入校验/CORS/依赖漏洞——阶段3，与架构同生命周期）
- `docs/08-CODING-STANDARDS.md`（项目级代码规范：命名/文件组织/技术栈专项/Commit——阶段5）
- `docs/09-DESIGN.md`（界面设计：令牌/页面/组件/五态/响应式/无障碍——阶段4）
- `README.md`（已填充：定位 + 快速开始 + vibe 命令表）
- `.env.example`（环境变量占位样例）
- `.opencode/quality-gate.js`（根据架构配置生成，含 G05 架构完备性[含 G05.5 安全基线/G05.6 界面设计] + G06 文档完备性检查）

### 收尾
- 确保 `docs/03-STATUS.md` 存在，不存在则创建
- 更新 `docs/03-STATUS.md` 阶段状态
- 确保 `.gitignore` 不忽略 `.vibecoding/`（稠密轨需 git 追踪，worktree 与主工作区共享）
- 将项目名称、技术栈、数据库、部署方式回填到 `AGENTS.md`
- 向用户汇报文档位置、参考截图位置和关键决策
- 提示用户：可运行 `/vibe-spec` 拆分切片
- 从 blackboard 移除本会话：`python ~/.claude/harness/blackboard.py archive <SID>`

---

## 执行锚（RECENCY ANCHOR —— 正文任何一条与本节冲突，以本节为准）

1. 项目根 `constitution.md` 为最高约束，产出违背任意条款即否决重做。
2. 编码底线：入口判空 · 精准修改 · catch 必处理 · 异常不吞 · 遇 bug 先定位根因再动手 · 防御机制必测（误报/漏报矩阵）。
3. UI 红线：零 emoji、零位图图片；图标一律内联 SVG 或 CSS 几何形；素材位灰阶占位盒 + `TODO(asset)`。机器校验 = quality-gate G05.7。
4. 设计源冲突裁决：硬约束红线 > 低保真纪律 > ui-ux-pro-max 数据 > frontend-design 建议；落地以 `docs/09-DESIGN.md` §1 令牌表为准。
5. 凡标注"用户选定/确认后再继续"处必须真实停下等待输入，禁止代答抢跑。
6. 过程播报（每阶段 ≥2 行）是硬性输出义务；完成后下一步 = `/vibe-spec`。