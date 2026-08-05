---
description: 切片命令：读取 PRD + 架构文档 → 拆分切片 → 输出切片规格（加载 slice-spec-writer skill）
---

## /spec — 切片规格

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

### 阶段3: 输出
- 创建 `slices/README.md` — 切片总览 + 依赖图
- 为每个切片创建 `slices/<编号>-<名称>/spec.md`

### 产出
- `slices/README.md`
- `slices/001-*/spec.md`
- `slices/002-*/spec.md`
- ...

### 收尾
- 更新 `docs/03-STATUS.md` 切片清单
- 向用户展示切片列表和依赖关系，确认后进入实现阶段