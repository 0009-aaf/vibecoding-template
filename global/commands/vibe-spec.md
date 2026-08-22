---
description: 切片命令：读取 PRD + 架构文档 → 拆分切片 → 输出切片规格（加载 slice-spec-writer skill）
---

## /vibe-spec — 切片规格

### 会话隔离
生成 SID = `spec-{今日日期}-{4位随机}`。注册：`python C:/Users/fms/.claude/harness/blackboard.py register <SID> "vibe-spec (<需求摘要>)"`
> 会话异常中断时，需手动从 blackboard 清除本 SID：`python C:/Users/fms/.claude/harness/blackboard.py remove <SID>`

### 前置条件
- `docs/01-PRD.md` 必须存在
- `docs/02-ARCHITECTURE.md` 必须存在

### 阶段1: 分析文档
- 读取 `docs/01-PRD.md` 获取功能清单
- 读取 `docs/02-ARCHITECTURE.md` 获取目录结构

### 阶段2: 拆切片（skill: slice-spec-writer）
- 加载 `slice-spec-writer` skill
- 将功能拆分为垂直端到端切片
- 识别切片间依赖关系
- 绘制依赖图
- 切片列表包含 `session-id` 列（初始为空）
- 为每个切片标注类型（API / UI / 基础设施），并标注推荐实现档位：
  - **API 切片** -> 默认 `full`（契约 + 集成测试强制，不可 fast）
  - **基础设施切片**（配置/CI/Docker）-> 默认 `full`，微调可 `fast`
  - **UI 微调切片**（文案/样式/单一组件）-> 可 `fast`
- 为每个切片定义接口契约（Step 4）：API 端点、导出类型、共享 schema
- 为每个切片定义测试要求（Step 4）：按类型决定测试等级
- 将接口契约同步写入 `docs/04-CONTRACTS.md`

### 阶段3: 输出 + 增量保护
- **增量保护**：如果 `slices/README.md` 已存在：
  - 读取已有切片状态（已完成/进行中/待开始）和 session-id
  - 新切片追加到列表末尾，不修改已有切片状态
  - 如果 PRD 变更导致已有切片需修改：
    - **已合并到 main 的切片（状态为"已完成"）**：不允许重写，只能追加新切片
      -> 提示用户"切片 XXX 已合并到 main，无法重写，请创建新切片处理新需求"
    - **未合并的切片（状态为"待开始"/"进行中"）**：用 question 工具询问用户：保留 or 重写
      - 保留 -> 只更新验收标准，不改状态和 session-id
      - 重写 -> 状态改回"待开始"，清空 session-id，提示用户
- 创建/更新 `slices/README.md` - 切片总览 + 依赖图 + 锁状态
- 为每个新切片创建 `slices/<编号>-<名称>/spec.md`
- **依赖环验证**：绘制依赖图后检查是否有环
  - 发现环 -> 报错"检测到循环依赖：A -> B -> A"，提示用户修正
- 更新 `docs/04-CONTRACTS.md` 补充各切片 API 契约（每个切片用 `<!-- @slice:<编号> -->` 标记包裹）

### 产出
- `slices/README.md`（增量更新，保护已有状态）
- `slices/001-*/spec.md`
- `slices/002-*/spec.md`
- ...
- `docs/04-CONTRACTS.md`（补充各切片 API 契约 + 导出类型）

### 收尾
- 确保 `docs/03-STATUS.md` 存在，不存在则创建
- 更新 `docs/03-STATUS.md` 切片清单
- 向用户展示切片列表、依赖关系和接口契约摘要
- 确认后提示用户：可运行 `/vibe-implement <编号>` 开始实现
- 从 blackboard 移除本会话：`python C:/Users/fms/.claude/harness/blackboard.py archive <SID>`