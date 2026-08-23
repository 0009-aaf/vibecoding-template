# Changelog

本仓库的变更记录（由 /vibe-implement 阶段6 维护，Keep a Changelog 格式，
按 Conventional Commits type 分组：feat→Added / fix→Fixed / refactor→Changed）。

## [Unreleased]

### Added
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
- **提交历史统一 CM11 格式**：34 个历史提交的 Body 全量改写为文件功能清单（git filter-branch 消息改写 + force push；本地保留备份分支 backup/pre-cm11-rewrite，Protected Region 豁免段与 BREAKING CHANGE 等合规 footer 原样保留）
- **提交历史 subject 去 type 化**：36 个历史提交的 subject 全部去掉 `feat:/fix:/docs:/chore:` 前缀、移除 CM11 字样（git commit-tree 消息重建 + force push，tree 哈希 36/36 一致仅 message 变化；备份分支 backup/pre-no-type）
- vibe-plan 阶段4 定视觉产出升级：从"写入 PRD §2"改为生成 09-DESIGN.md（PRD §2 收敛为方向 + 指向）
- quality-gate G05 增 G05.6 界面设计存在性（isUiFile 提升为模块级，M18/G05.6 同口径）

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
