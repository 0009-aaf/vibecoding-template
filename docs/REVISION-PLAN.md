# 架构现代化整改方案 [vibecoding-template]

> 本方案由 2026-08 架构审查产出（对照 GitHub Spec Kit 1.0 / Anthropic 上下文工程 / Agentic Memory 综述 / 行为测试体系），
> 列出现有架构与 2026 主流实践的 3 项落后点与 2 项隐患，并给出逐项落地设计。实施时按 §8 顺序分批推进，每批独立提交。

## 1. 背景与审查结论

### 1.1 审查方法
对 `vibecoding-template` 全架构（vibe 工作流 / check-sync S1-S8 / quality-gate / 记忆系统 / 插件体系 / harness）做系统性对照审查，
学习来源：GitHub Spec Kit 1.0（2026-08）、Anthropic "Effective context engineering"（2025-09）、
Claude Cookbook "Context engineering"（2026-03）、Spec Kit Agents 论文（2604.05278）、
Agentic Memory 综述（2602.19320 / 2603.07670）、Red Hat 行为测试（2026-07）、Arthur 回归数据集（2026-06）。

### 1.2 总体结论
**架构理念不落后**——"图纸→规矩→门禁"、宪法不可协商、可执行 oracle、文档防腐（check-sync）、TDD red→green、
worktree 隔离均与 2026 已验证实践一致。但存在 **3 项落后机制** 与 **2 项隐患**：

| # | 类别 | 问题 | 2026 主流实践 |
|---|------|------|--------------|
| A | 工作流 | 缺 Converge（收敛）环节：切片实现后无"对照 spec 找差距→补任务→再迭代"闭环，vibe-audit 是一次性审查 | Spec Kit: Implement → Converge 循环直到收敛 |
| B | 记忆 | 无分层（episodic/semantic/procedural 混池）、无遗忘/过期、无矛盾处理；reflect tips 无置信度衰减（self-reinforcing error 风险） | 分层记忆 + 写路径过滤 + 过期/矛盾机制 |
| C | 评估 | 行为层缺失：无 golden queries + pass@k；生产失败→trace→回归用例闭环断裂（traces 只流向 tips 文档，不流向断言） | 行为测试 + 失败转回归用例（flywheel） |
| D | 上下文 | 无 token 预算治理：AGENTS.md（最贵 surface）+ 工具输出累积无清理策略 | 按类分配预算 + tool-result clearing |
| E | 写路径 | traces.jsonl 无信号分级，每个会话无差别记录 | 写前过滤（低信号丢弃/去重/优先级） |

### 1.3 已符合主流、无需改动的部分（确认清单）
| 实践 | 当前对应 | 结论 |
|------|----------|------|
| context files 进版本控制 + pre-commit 机械校验 | AGENTS.md 在仓库 + check-sync S8 | ✅ |
| 可执行 oracle（"done"需二进制信号） | quality-gate + DoD 双闸门 | ✅ |
| 宪法不可协商条款 | constitution.md + 4 命令守卫 | ✅ |
| TDD red→green | vibe-implement 阶段2a（测试先行） | ✅ |
| 文档防腐（"CI for docs"） | check-sync S1-S8 | ✅ |
| 工作树隔离 + 共享状态锁 | worktree + 合并锁 + blackboard 原子写 | ✅ |
| 子代理上下文隔离 | Agent Team 独立会话 + blackboard 传摘要 | ✅ |

## 2. 整改总览

| 优先级 | 编号 | 名称 | 改动文件 | 工作量 | 验收标准（可执行） |
|--------|------|------|----------|--------|---------------------|
| P0 | R-01 | Converge 收敛环节 | `global/commands/vibe-implement.md` + `slices/README.md` 模板 | 中 | 切片实现后自动扫描差距，产出"差距清单"，全部闭合或显式豁免后才能提交 |
| P1 | R-02 | 失败→回归用例闭环 | `harness/reflect.py` + `global/commands/vibe-implement.md` | 小 | reflect 输出可选写 golden-case（JSON/YAML），check-sync S8 校验 golden 目录存在 |
| P1 | R-03 | 记忆写路径信号分级 | `global/plugins/vault-sync/index.mjs` | 小 | traces.jsonl 每行含 `signal` 字段；低信号会话默认不写；矩阵测试 4 用例 |
| P2 | R-04 | tips 过期与置信度衰减 | `harness/reflect.py` + `harness/recall.py` | 小 | tips 带 confidence+date；recall 对 >90 天且低置信度条目降权 50% |
| P2 | R-05 | README badge 修正 | `README.md` | 极小 | `S1-S7` → `S1-S8`，check-sync 通过 |

## 3. R-01：Converge 收敛环节（P0）

### 3.1 背景
2026 实践（Spec Kit 1.0 + Vidocq 实战）证明：**"AI 会静默漂移"**——实现结束后 spec 与代码的差距不会自己浮现，
必须有机器/结构化流程"run → find gap → fix → re-run"循环直到收敛。当前 vibe-implement 阶段 3 测试通过即进入
阶段 4 待验收，spec 中未实现的验收项不会被自动追回。

### 3.2 设计
在 `vibe-implement` 阶段 3（全量测试 + 闸门）与阶段 3.5（浏览器验证）之间，**新增阶段 3.2：Converge 差距扫描**：

```
阶段3 全量测试+闸门 → [新增]阶段3.2 Converge 差距扫描 → 阶段3.5 浏览器验证 → 阶段4 待验收
```

执行步骤（写入 vibe-implement.md）：
1. 读取 `slices/<编号>/spec.md` 的 **验收标准清单**（逐条）
2. 对每条验收标准，检查**代码证据**：对应测试存在且通过（`node/git diff` 验证），或显式声明豁免并记录理由
3. 产出 `.vibecoding/converge-<编号>.md`：差距清单（`✓ 已满足 / ✗ 未满足 / ⏸ 豁免` 三态，逐条列出证据路径）
4. **未满足项 > 0 时**：不进入阶段 4，回到阶段 2a/2b 补实现（记录一次 converge 轮次）
5. **豁免规则**：`⏸ 豁免` 必须写理由（技术债登记到 `docs/TECH-DEBT.md`），且豁免项数 ≤ 验收标准总数 20%
6. 差距清单随切片提交（`slices/README.md` 状态表新增"converge 轮次"列，默认 1，回环一次 +1）

### 3.3 验收标准
- C1：对含 5 条验收标准的切片，人为删掉 1 条对应实现 → converge 扫描必须报 `✗` 且阻断阶段 4（退出码非 0）
- C2：全部满足 → `✓` 全绿放行，converge 轮次 = 1
- C3：豁免 ≤20% 规则：6 条验收标准中豁免 2 条 → 阻断并提示登记技术债
- C4：差距清单文件随切片提交入库（git 追踪）

### 3.4 风险与缓解
| 风险 | 缓解 |
|------|------|
| 扫描逻辑依赖 AI 自觉（非机器执行） | 差距清单必须有"证据路径"列（测试文件/命令输出），vibe-audit 抽查证据真实性 |
| 豁免滥用（AI 把做不到的标豁免） | 20% 上限 + 豁免必进 TECH-DEBT + audit 对豁免项复核 |
| 增加实现耗时（约 5-10 分钟/切片） | 仅 `--loop`/`--full` 执行；`--fast` 跳过（单文件改动豁免合理） |

## 4. R-02：失败→回归用例闭环（P1）

### 4.1 背景
2026 共识（Arthur flywheel / Red Hat）：**生产失败 = 最好的测试用例来源**。失败 → trace → 分类 → 转 golden case →
加入回归集 → 每次改动跑回归。当前 traces.jsonl 已由 vault-sync 写入，但 reflect 只把失败提炼为 tips 文档
（procedural 知识），**不产出可执行断言**——同样的失败可以再次静默发生。

### 4.2 设计
`reflect.py` 的 3 类输出中，`error_pattern` 类增加可选 golden-case 落盘：

```
[reflect] --task "描述" 
   ├─ 分类 error_pattern → 写 40_Knowledge/error-patterns.md（原逻辑，保留）
   └─ 新增：同时写 {vault}/40_Knowledge/golden-cases/YYYY-MM-DD-<slug>.json（结构化）
```

golden-case JSON schema：
```json
{
  "id": "gc-2026-08-25-001",
  "title": "vision-bridge 图片识别降级后模型不卡死",
  "failure_mode": "image_passthrough_hang",
  "trigger": "向纯文本模型发送图片 FilePart",
  "expected": ["模型不卡死", "图片被替换为文字描述"],
  "unexpected": ["hang", "raw base64 in prompt"],
  "source": "session xxx | task yyy",
  "added": "2026-08-25",
  "severity": "high"
}
```

同时：
- `vibe-implement` 阶段 3 增加一句：**涉及防御/拦截/降级逻辑的切片，须引用或新增 golden case**（对应编码底线第 6 条"防御机制必测"）
- check-sync S8 清单加入 `40_Knowledge/golden-cases/` 目录存在性校验（harness 侧）

### 4.3 验收标准
- C1：`reflect.py --task "..."` 对 error_pattern 分类产出 `.json` 文件且 schema 合法（`python -c json.load` 通过）
- C2：golden-cases 目录不存在时自动创建
- C3：check-sync S8 对 golden-cases 目录缺失报阻断（反向测试：改名目录 → exit 1）
- C4：vibe-implement 文档含"防御逻辑切片须引用 golden case"条款

### 4.4 风险与缓解
| 风险 | 缓解 |
|------|------|
| golden case 无人消费（写了不跑） | 本方案只建立"产出侧"；消费侧（行为回归 runner）列为后续 roadmap，不在本期范围 |
| schema 漂移 | JSON 由 reflect.py 单一写点，schema 常量在脚本内定义 |

## 5. R-03：记忆写路径信号分级（P1）

### 5.1 背景
2026 Agentic Memory 综述共识：**写路径过滤是记忆系统第一道闸**——低信号记录（无意义会话、重复确认）
无差别写入会稀释检索精度。当前 vault-sync 在 `session.idle` 时对**所有**有 title 的会话写 traces.jsonl。

### 5.2 设计
`global/plugins/vault-sync/index.mjs` 的 `appendTrace` 增加信号分级：

```
signal = high   ← title 含关键词（决策/修复/bug/踩坑/重构/失败/error/验收/架构/ADR/切换/整改）
signal = medium ← title 非空且长度 ≥ 8 字符
signal = low    ← 其余（title 为空或极短）

写入策略：
  high/medium → 写 traces.jsonl（带 signal 字段）
  low → 不写 traces（仅写日笔记），debugLog 注明 "LOW signal skip"
```

关键词表定义在插件顶部常量 `HIGH_SIGNAL_KEYWORDS`，可维护。

### 5.3 验收标准
- C1：标题含"修复 bug"的会话 → traces.jsonl 出现 `"signal":"high"` 行
- C2：标题为 `(untitled session)` 或 3 字符 → 不写 traces，日志出现 `LOW signal skip`
- C3：矩阵回归：4 用例（high 命中 / medium 命中 / low 跳过 / 空标题跳过）用临时 traces 路径实测全绿
- C4：现有 `TRACES_ALWAYS` 常量行为保持（供测试开关）

### 5.4 风险与缓解
| 风险 | 缓解 |
|------|------|
| 关键词表误伤（真实有价值的会话被标 low） | 只影响 traces（反思数据源），日笔记始终写入不受影响；关键词表可增补 |
| 行为变化影响 reflect | reflect 读取逻辑不变（仍读最后一行），signal 字段向后兼容 |

## 6. R-04：tips 过期与置信度衰减（P2）

### 6.1 背景
综述指出 reflective memory 两大风险：**self-reinforcing error**（错误结论自我固化）与**过度泛化**。
当前 tips 无有效期、无置信度衰减——一条 3 个月前的"API X 总是失败"会永久参与召回，即使早已修复。

### 6.2 设计
`reflect.py`：
- 写入 tips 时沿用现有 frontmatter（已有 `date`/`confidence`），**新增约定**：`confidence` < 0.5 的 insight 标注 `(draft)`
- `recall.py` 对 40_Knowledge/*-tips.md 的条目增加 **衰减系数**：
  ```
  条目 age > 90 天 且 frontmatter confidence < 0.6 → 该文档 score × 0.5
  ```
  实现：scan_vault 时对 tips 文件解析 frontmatter confidence + date，附加 `decay` 字段，search 排序时应用

### 6.3 验收标准
- C1：构造 120 天前、confidence 0.4 的 tips 条目 → 同查询下分数比无衰减版低 50%（实测对比）
- C2：30 天前、confidence 0.9 的条目 → 不受衰减影响
- C3：无 frontmatter 的旧 tips 文件 → 不报错、不衰减（向后兼容）

### 6.4 风险与缓解
| 风险 | 缓解 |
|------|------|
| 解析 frontmatter 增加复杂度 | 仅对 `*-tips.md` 文件名生效，其余文档零影响；解析失败静默跳过 |

## 7. R-05：README badge 修正（P2）

### 7.1 背景
上轮新增 S8 后 README 徽章仍写 `S1-S7`（文档漂移实例）。

### 7.2 设计
`README.md` 第 8 行 `gates-S1--S7` → `gates-S1--S8`；第 101 行 S1-S7 描述同步更新为 S1-S8。

### 7.3 验收标准
- C1：`Select-String "S7" README.md` 仅剩"历史意义"引用（若有）或无 S7 残留（S8 上下文）
- C2：check-sync 全绿

## 8. 实施顺序与验证策略

### 8.1 顺序（每批独立提交，遵守 CM11）
| 批次 | 内容 | 依赖 | 提交粒度 |
|------|------|------|----------|
| 批 1 | R-03（vault-sync 信号分级） | 无 | 模板仓库 1 commit（含矩阵回归） |
| 批 2 | R-02（reflect golden case + check-sync S8 补条目 + vibe-implement 条款） | 无 | harness 仓库 1 commit + 模板仓库 1 commit |
| 批 3 | R-01（Converge 阶段） | 批 2（条款引用） | 模板仓库 1 commit |
| 批 4 | R-04（tips 衰减）+ R-05（README） | 无 | harness 1 commit + 模板 1 commit |

### 8.2 验证矩阵（每批完成后必须跑绿）
| 检查 | 命令 |
|------|------|
| 漂移检测 | `node scripts/check-sync.mjs`（exit 0） |
| 质量闸门 | `node .opencode/quality-gate.js`（exit 0） |
| 插件行为 | 临时 vault + fake OPENCODE_CONFIG 实测（沿用 2026-08-25 已验证的隔离测试法） |
| 记忆检索 | 临时 vault + HARNESS_VAULT_PATH 实测 recall 断言 |
| 同步 | `scripts/sync-global.ps1`（自检 PASS） |

### 8.3 每批收尾
同步全局 → check-sync 全绿 → git 提交（Body 列变更文件功能）→ 更新 `docs/03-STATUS.md` 上下文摘要。

## 9. 决策点（实施前需确认）

| # | 决策 | 选项 | 建议 |
|---|------|------|------|
| D1 | R-01 阶段 3.2 是否对 `--full` 也强制？ | A. loop+full 都强制 / B. 仅 loop | A（full 有界任务也应收敛） |
| D2 | R-02 golden-case 消费侧（行为回归 runner）是否列入本期？ | A. 本期做 / B. 只做产出侧，消费侧 roadmap | B（避免范围膨胀，产出侧已闭环） |
| D3 | R-04 衰减是否也作用于 30_Decisions（ADR）？ | A. 仅 tips / B. ADR 也衰减 | A（ADR 是历史决策，不应衰减） |
| D4 | 批次顺序按 §8.1 执行？ | A. 按序 / B. 自定义 | A |

## 变更记录

| 日期 | 变更内容 | 原因 |
|------|----------|------|
| 2026-08-25 | 初版方案：3 落后项 + 2 隐患 → R-01~R-05 | 2026-08 架构审查产出 |
