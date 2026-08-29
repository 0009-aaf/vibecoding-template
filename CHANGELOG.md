# Changelog

本仓库的变更记录（由 /vibe-implement 阶段6 维护，Keep a Changelog 格式，
按 Conventional Commits type 分组：feat→Added / fix→Fixed / refactor→Changed）。

## [Unreleased]

### Added
- **opencode + DeepSeek V4 专属适配·可见性与知识层四件套**：① vibe-plan/spec/implement/audit 四命令新增「过程播报」节（每阶段 ≥2 行 `[vibe-*] 阶段X：<名称>` + 收尾证据行，禁止静默连跑）+ 文件尾「执行锚」（RECENCY ANCHOR：宪法/编码底线/UI 红线/停等义务/下一步，prompt 三明治固化，专治长命令中段规则遗忘）；② DESIGN-template 新增 §0 设计源仲裁序（硬约束红线 > 低保真灰阶 > ui-ux-pro-max 数据 > frontend-design 审美建议）与 §4.5 动效基线（时长/缓动曲线/合成属性/stagger/reduced-motion 数值表，蒸馏自 Emil Kowalski 设计工程实践与 Material Design 3 motion 规范），随 vibe-plan 阶段4 进入每个新项目的 docs/09-DESIGN.md
- **quality-gate G05.7 UI 素材红线门禁**：三副本同步新增检查——扫描 `references/design/*.html` 预览的零 emoji/零位图违规（`<img>` 标签、SVG 内 `<image>`、background-image 位图 url、base64 位图、Extended_Pictographic 表情；©®™ 排版字符先剔除防误报）；无预览产物项目直接通过不误伤纯后端；`scanUiRedlines`/`uiRedlinePatterns` 模块级导出（require.main 守卫，沿 secretPatterns 先例）；新增 `scripts/ui-redline-matrix.mjs` 误报/漏报矩阵（10 合法 + 8 违规，真实文件 IO 全路径，实测含"CJS 动态 import 不出新实例导致假绿"的自纠案例）
- **根 AGENTS.md 整篇重写对齐**（销 TECH-DEBT 登记项）：补 constitution 最高约束引用、核心文档清单对齐实际 docs 结构（含 04-CONTRACTS 本仓缺席说明）、切片路径口径统一 `<编号>-<名称>`、工作流补浏览器验证与播报义务、"UI 红线"独立成节并指向 G05.7
- **CM11 提交消息文件功能清单**：Body 每个变更文件一行 `<文件>: <该文件的功能>`——全部文件都列、纯功能描述（描述文件本身是干什么的，不描述本次改动，改动内容看 diff），读提交历史不查目录即知涉及文件职责；subject 保留 type 前缀、同为名词性功能描述（不用"新增/修复/改为"类变更动词）；落点：总纲 CM11 规则 + 自检清单行（v1.9）、vibe-implement 阶段 6.0、CODING-STANDARDS 模板 §5
- **README 丰富**（对照公开 README 最佳实践重构）：badges / 这是什么总览 / 特性一览 / mermaid 工作流图 / Skills 一览 / 质量防线表 / 文档导航 / FAQ / Roadmap / 贡献与项目状态
- **文档规范体系**（ADR-004）：`docs/00-DOC-STANDARD.md`（编号白名单/必备四件/内容规范/反臃肿）+ 模板；check-sync 新增 S6 文档结构校验（野编号/四件缺失即阻断，实测拦截）
- **check-sync S7：skill 路由完整性 + 引用存在性机器校验**——S7a 总纲路由表（含 description 花括号枚举）与 `global/skills/` 实际目录双向比对（悬空/孤儿均阻断）；S7b 全仓 markdown 的 `` `X` skill`` / `skill("X")` 引用必须真实存在（与 S3 命令引用同构）。已注入自测：孤儿目录与悬空引用均检出、参数化写法无误报。同步清理 3 处历史悬空引用（coding-standards M5 改指 constitution、§九改自引用 RV1-RV4、DoD-template 改指宪法 C2）
- **项目宪法** `constitution.md`（ADR-005）：13 条不可协商条款自既有约定提炼；starter AGENTS 顶部引用 + vibe-plan/spec/implement/audit 四命令守卫注入"违背即否决"；变更须 ADR
- **界面设计文档体系**（ADR-005）：DESIGN-template（设计令牌/页面清单/组件复用/交互五态/响应式/无障碍基线 8 章）→ vibe-plan 阶段4 生成 `docs/09-DESIGN.md`；G05.6 门禁（判定与 M18 共用 isUiFile）；audit 视觉走查清单；UI 切片 spec 强制引用 09-DESIGN 条目
- **04-CONTRACTS 独立模板**：补结构性欠账（此前结构仅内嵌命令文本）；含全局错误码注册表（`<域>-<三位数>`，禁私造/禁复用语义）+ 端点契约含错误码与性能预算
- **数据库迁移规范**（architecture-designer Step 3 + ARCH-template，双源 sync-hash 3→4）：命名/可回滚/destructive 须 ADR+备份先行
- **RUNBOOK §9 日志与追踪**（可观测性：日志格式/级别/requestId 贯穿/健康检查）+ **§10 环境晋升与灰度**
- **feature flag 规范**（CODING-STANDARDS §4：命名/登记 TECH-DEBT/禁遮蔽契约变更）
- **D5 缓存失效策略必答**（architecture-designer Step 9 + ARCH §9 注）
- vibe-plan 阶段5 新增生成 00-DOC-STANDARD 与 constitution（均增量保护）

### Fixed
- **G05.7 门禁漏报修复（2026-08-27 审查）**：`bg-bitmap` 正则只匹配 `background-image:`，漏检 CSS 简写 `background:url()`（实测 `background:url(img.png)` 不命中，位图可绕过红线）——正则改 `(?:background|background-image)\s*:` 三副本同步，矩阵补 V9 违规用例（10 合法 + 9 违规）；e2e-verifier SKILL.md:12 与 vibe-implement 阶段3.2 切片路径口径统一 `<编号>-<名称>`；vibe-implement 阶段3.5/3.2 顺序校正（3.2 在前）+ 播报节阶段号列表同步；09-DESIGN §8 补模板 §0/§4.5 新增说明留档
- **G05.7 门禁漏报二修（2026-08-29 审查 C-1）**：上一版正则仍漏检简写**前置值/逗号分隔**形态（`background:#fff url(...)` / `background: linear-gradient(...), url(...)` 实测不命中）——正则改 `background(?:-image)?\s*:\s*(?:(?!;)[^;])*?url\(...` 三副本同步，矩阵补 V10 用例（10 合法 + 10 违规全绿，换行/var/大写扩展名边界实测零漏检零误报）；**vibe-implement 文档一致性二修**（R-1/R-2）：阶段2a 补 fast/solo 跳过标注（消"先写测试"矛盾）、solo 补 dense-track 收尾记录（同 fast 格式，修中断恢复盲点）
- **审查修复（2026-08-24 工作流多维度审查）**：
  - **ui-ux-pro-max 测试套件入库不完整**：2 个依赖上游私有脚本的测试（`test_catalog_refresh.py` / `test_relevance_evaluator.py`）加 SkipTest 防护（模板镜像缺失 refresh/evaluate 脚本时自动跳过，不再收集崩溃）；`catalog-summary.json` 快照哈希失配根因 = Windows autocrlf 漂移 → `validate_data.py` 哈希前 LF 归一化 + 新增 `.gitattributes` 强制 `global/skills/ui-ux-pro-max/data/**` 与 `web-artifacts-builder/scripts/*.sh` eol=lf；SKILL.md 补测试运行说明。回归：130 passed + 2 skipped + 7923 subtests 全绿
  - **ARCH Skill 计数漂移**：02-ARCHITECTURE §2 目录树 16→19，补 frontend-design / ui-ux-pro-max / web-artifacts-builder 三行（vibe-README skills 清单同步补设计类 3 个）
  - **README badge 锚点悬空**：`#skills-一览16-个` → `#skills-一览19-个`
  - **vibe-plan 硬编码 Git bash 路径语义化**：`D:\Git\bin\bash.exe` 改为 Get-Command 探测提示（禁 WSL stub，见 coding-standards-shell SH13）
- 存量文档合规整改：01-PRD/02-ARCHITECTURE 补引言 blockquote、03-STATUS 补引言、06-RUNBOOK/08-CODING-STANDARDS 补变更记录、RUNBOOK/CODING-STANDARDS 模板补变更记录占位（S6 上线即发现）
- **安全（P1）**：quality-gate M02/M17 命令注入修复——staged 文件名与 npm 脚本键名全部改 `execFileSync` 参数数组（不经 shell），三副本同步；M01 密钥扫描补 `.env*` 前缀文件（`.env.local` 等此前漏扫）；`secretPatterns` 提升为模块级导出（`require.main` 守卫，import 不执行主流程）
- **安全（P1）**：clawd-bridge 权限转发 token 先发后验证 → verify-before-send——含 `bridge_token` 的 `/permission` 请求仅在端口已通过 Clawd 身份验证后发送（冷启动先发无 token 探针），state 广播维持先发后验证（无敏感内容）
- **安全**：guard 补三类日常写法漏拦——`rm -r -f /`（flag 分写/`--recursive --force` 长选项组合）、`sudo/doas` 前缀关机命令、`format /FS:NTFS D:`（开关前置变体）；矩阵扩容至 16 合法 + 22 危险全绿，并改为 import 单一真源 `isDangerous`（删除本地重写副本）
- **文档对齐**：README 快速开始路径修正（`scripts/sync-global.ps1`）与计数口径统一（16 Skill）；02-ARCHITECTURE §2 目录树刷新为实际结构、§6/§7/§8 重排对齐 ARCH-template（新增库清单/命名约定含术语表/测试策略，原浏览器验证/并行安全/验证降级收编为 §8 子节）——constitution C6、00-DOC-STANDARD X3、vibe-implement §6/§8、07-SECURITY 引用全部落地；00-DOC-STANDARD 补 04-CONTRACTS 与 DoD 缺席规则（与 09 缺席同构）；starter AGENTS 标注 constitution 的 /vibe-plan 生成来源
- **命令/skill 对齐**：vibe-implement 清除已删除门禁 M14/M15 悬空引用（改为 M16 库清单边界）；coding-standards 路由表补 shell/html 两个孤儿子 skill + 全部条数修正（react 15→3、node 12→24、wx 4→16、总纲 58→80 编号）；architecture-designer/selection 触发词互斥（"技术选型"归 selection，designer 改文档产出类触发词）；vibe-README 补 frontmatter description（满足 08 D1）
- **跨平台**：check-sync S4 改 `os.homedir()`（原 `USERPROFILE` 在非 Windows 退化为相对路径、检查静默失效）
- **可观测**：vibe-gate gate 执行加 10 分钟超时（防脚本挂起阻塞 commit）；成功时回显输出尾部（check-sync 警告/quality-gate 警告项此前不可见）
- **单一真源**：secret-matrix 改为 import quality-gate 导出的 `secretPatterns`（消除正则手工双源——正是该矩阵注释自己警告的"假验证"模式）

### Changed
- **机制成本-收益审计落地（2026-08-29）**：全仓机制盘点，硬层（宪法/底线/门禁/漂移检测）全部保留；软层降级——vibe-implement 播报加 `--fast` 档（fast 只播 1 行收尾证据）；三矩阵（guard/secret/ui-redline）头部加**饱和线**注释（覆盖已见+高频即停，禁"每次审查加用例"式膨胀）；审计报告落盘 `docs/reports/audit-mechanism-20260829.md`
- **强制 preview.html 最小集（2026-08-29）**：vibe-plan 阶段4 从"视觉重项目"改为"**有 UI 项目（PRD §2 页面模块非空）强制产出** `references/design/preview.html`"，补降级链（浏览器不可用仍生成 / Git bash 不可用降级手写单文件并标注 / 全不可用阻断）；不新增 G05.8 门禁，靠既有 G05.7 兜底；DESIGN-template 措辞同步、vibe-implement 兜底产出逻辑对齐
- **开发者视角架构评估 + P0 最小模式（2026-08-29）**：评估落盘 `docs/reports/dev-perspective-20260829.md`；vibe-implement 新增 `--solo` 档（单人临时/实验性改动：跳过 worktree/锁/合并 + 播报/STATUS/CHANGELOG/blackboard 文档链义务，仍必过 quality-gate + DoD 红→绿；收尾必须 question 询问补文档——C10 由人类豁免不静默跳过）；vibe-README 档位表/触发点/示例同步；P1/P2 遗留登记 TECH-DEBT
- **提交历史统一 CM11 格式**：34 个历史提交的 Body 全量改写为文件功能清单（git filter-branch 消息改写 + force push；本地保留备份分支 backup/pre-cm11-rewrite，Protected Region 豁免段与 BREAKING CHANGE 等合规 footer 原样保留）
- **提交历史 subject 去 type 化**：36 个历史提交的 subject 全部去掉 `feat:/fix:/docs:/chore:` 前缀、移除 CM11 字样（git commit-tree 消息重建 + force push，tree 哈希 36/36 一致仅 message 变化；备份分支 backup/pre-no-type）
- vibe-plan 阶段4 定视觉产出升级：从"写入 PRD §2"改为生成 09-DESIGN.md（PRD §2 收敛为方向 + 指向）
- quality-gate G05 增 G05.6 界面设计存在性（isUiFile 提升为模块级，M18/G05.6 同口径）
- **vibe-implement 注意力优化试点（2026-08-29）**：①执行锚（RECENCY ANCHOR）从文末前置到文件头部 frontmatter 后——最高约束首屏可见（prompt sandwich），治长命令中段规则遗忘；②文末"失败处理"段上移合并到阶段3 修复策略前——全局失败兜底就近可读，消除约 180 行注意力跳跃，并删除与"停止条件"重复的"连续 3 次修复"条目；③反合理化表下沉受 `vibe-command-structure/checks.py` C4 机制检查约束（4 个标题必须保留），故收敛为"执行锚前置 + 重复段落合并"。机器校验全绿（quality-gate 9/0/0、check-sync S1-S8、checks.py C1-C5 PASS），已 sync-global.ps1 部署
- **优化第一批落地（2026-08-29）**：①vibe-implement 执行锚加第 7 条"文档读取纪律"（只读任务点名章节/单文件 ≤80 行/超出用 grep 定位——防注意力稀释 + 保 V4 缓存命中）；②vibe-spec 阶段3 新增"并行命令清单"（依赖图确定后输出无依赖切片组的并行启动命令，利用模型高并发，用户手动多窗口执行）；③RUNBOOK 新增 §4.1 缓存友好约定（V4 前缀缓存：稳定真源批改省钱、易变文件放注入末尾、禁无效改动致缓存失效）
- **优化第二批落地（2026-08-29）**：①新增 `scripts/gen-status.mjs` 文档同步草稿生成器（从 dense-track/converge 自动生成 STATUS/CHANGELOG/TECH-DEBT 三段草稿：完成层提取/Converge 三态统计/--debt 技术债行；只出草稿不写盘，减宪法 C10 人的时间税）；②check-sync.mjs SKIP 分支补逃生阀留痕提醒（O9 调研：vibe-gate 为 tool.execute.before 钩子、commit message 不可读，阻断式校验仅覆盖 -m 形式，降级为覆盖全形式的提示）；③RUNBOOK §3 补 gen-status 用法
- **优化第三批落地（2026-08-29）**：①vibe-implement/vibe-spec/vibe-audit 三命令执行锚各加"模型档位"条（深度推理→`deepseek-v4-flash-high`、常规→`deepseek-v4-flash`、fast/solo→`flash-fast`；opencode.json 已有变体配置经 extra_body 透传 thinking.type + reasoning_effort，用户手动切换）；②RUNBOOK §4.1 修正 active-context 注入现状（vault-sync 实际注入 messages 头部，flash 极低价下缓存优化收益≈0，撤销"放末尾"错误表述、不改插件）
- **优化第四批落地（2026-08-29，O10 空 catch 门禁）**：①quality-gate 新增 **M21 空 catch 扫描**（宪法 C3：catch 必处理或 re-throw；JS/TS 家族源码；**掩码法**替换字符串/注释/正则字面量为等长空格防误报——初版逐字符词法不理解正则内引号、误判 M10 正则场景，经矩阵发现后重构；模块级导出 `findEmptyCatch` 供矩阵单一真源回归）；②新增 `scripts/empty-catch-matrix.mjs` 误报/漏报矩阵（12 合法 + 7 违规：字符串/注释/标识符/正则含引号边界，全绿）；③**上线即拦截仓库自身 6 处存量空 catch**（clawd-bridge×3、vision-bridge×2、check-sync×1），按 C3 修复：console.error 可观测化 / 复用 debug() / 循环内 continue 语义化；④三副本同步 + sync-global 部署。quality-gate 通过项 9→10（新增 M21）

### Added
- **UI/前端设计 skill 补齐（3 个入库）**：`frontend-design`（Anthropic 官方，美学方向/反 AI 模板化）、`ui-ux-pro-max` v2.0（nextlevelbuilder 源，79 样式/192 色板/74 字体/22 栈 + 设计系统生成器 `scripts/search.py --design-system`）、`web-artifacts-builder`（官方 HTML 预览构建器，React+Tailwind+shadcn → 单文件 HTML；scripts 依赖 node/pnpm/tar，Git bash 运行）；本机 `~/.claude/skills/ui-ux-pro-max` 残缺 v1（data/scripts 空目录）移入 `_archived/ui-ux-pro-max-v1`
- **路由登记**：check-sync 仓库侧 AUTHORITATIVE_SKILLS 补 3 项；sync-routing-table 排除 opencode 侧 coding-standards 家族镜像（主登记在 map.skills 段，opencode 不重复登记），路由表 v3.0 零漂移
- **shell 环境陷阱记录**：`bash` 命令解析到 `C:\Windows\system32\bash.exe`（WSL stub，WSL 已删后报错）→ 须用 `D:\Git\bin\bash.exe`（见 shell-strategy）
- **设计 skill 接入 vibe 工作流**：vibe-plan 阶段4 显式调用 `ui-ux-pro-max`（`--design-system` 定令牌）+ `frontend-design`（美学审校）+ `web-artifacts-builder`（视觉重项目产出 `references/design/preview.html` 单文件 HTML 预览，内联 SVG 图标，无位图/emoji）；vibe-implement 阶段2b UI 切片先读 09-DESIGN §1 令牌 + 对照 preview 实现（阶段3.5 浏览器验证打开 preview 核对）；DESIGN-template §1 注明令牌来源

## [2026-08-23] 文档生命周期补强 + 防漂移机器校验

### Added（首批）
- `docs/07-SECURITY.md` 安全基线（vibe-plan 阶段3 产出，G05.5 门禁校验）与 SECURITY-template.md 模板
- `scripts/check-sync.mjs` 漂移检测器：S1 quality-gate 三份一致（强制注册 ID + 配置区剥离哈希）、S2 过期引用归零、S3 悬空命令引用、S4 全局部署滞后（警告）、S5 双源 sync-hash；vibe-gate 插件 commit 前强制执行
- `/vibe-implement` 阶段4：CHANGELOG 追加 + `docs/TECH-DEBT.md` 技术债登记（NOTICED BUT NOT TOUCHING 的落点）
- `/vibe-audit` 三个独立检查项：安全基线对照、技术债对账（TBD/FIXME 与 TECH-DEBT 对账）、漂移检测
- coding-standards skill 族 11 个收编进 `global/skills/`（原在 ~/.claude/skills/，opencode 读不到）
- vibe-README 决策表补充 plan-design/execution-plan 与 vibe-plan 的边界说明

### Fixed（首批）
- G06 文档完备性门禁从模板源同步到两份 quality-gate 副本（此前复制 starter-template 的新项目缺失该检查）
- docs 编号冲突：06-RUNBOOK 与 06-CODING-STANDARDS 同号 → CODING-STANDARDS 改为 08

### Changed（首批）
- 文档生命周期分配（ADR-002）：安全基线归 plan，CHANGELOG/技术债归 implement，API 文档由 04-CONTRACTS 既有机制覆盖
- quality-gate 同步约定从"双份 MD5 人工约定"升级为"三份一致 + check-sync 机器强制"（ADR-003）
