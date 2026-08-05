---
description: 规划命令：导需求 → 生成 PRD → 设计架构（加载 prd-generator + architecture-designer skill）
---

## /plan — 项目规划

需求: $ARGUMENTS

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

### 阶段3: 设计架构（skill: architecture-designer）
- 加载 `architecture-designer` skill
- 读取 `docs/01-PRD.md`
- 锁定技术栈
- 设计目录分层、数据模型、服务端边界
- 标记 Protected Region
- 输出到 `docs/02-ARCHITECTURE.md`

### 产出
- `docs/01-PRD.md`
- `docs/02-ARCHITECTURE.md`

### 收尾
- 更新 `docs/03-STATUS.md` 阶段状态
- 向用户汇报文档位置和关键决策