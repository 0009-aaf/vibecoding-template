---
description: 实现命令：按切片 spec 实现代码 → 跑测试 → 过 lint → 更新状态 → 人类验收（加载 slice-spec-writer skill 辅助）
---

## /implement — 切片实现

$ARGUMENTS

### 守卫
若 $ARGUMENTS 为空 → 列出 `slices/` 下所有待实现的切片，让用户选择

### 阶段1: 读取切片规格
- 读取 `slices/<编号>-<名称>/spec.md`
- 确认验收标准
- 确认 Protected Region（不可修改的文件）

### 阶段2: 实现代码
- 按规格实现切片代码
- 遵守 Protected Region 限制（不修改标记文件）
- 只修改 spec 中列出的涉及文件

### 阶段3: 测试 + 质量闸门
- 运行单元测试
- 运行集成测试
- 运行 lint 检查
- 所有测试必须通过
- 运行 `node .opencode/quality-gate.js`
- 质量闸门阻断则修复后重新运行

### 阶段4: 更新状态
- 更新 `docs/03-STATUS.md` 上下文摘要
- 标记切片状态

### 阶段5: 人类验收
- 展示实现摘要
- 等待人类确认

### 失败处理
- 测试失败 → 修复后重新运行
- 两次尝试没有新证据 → 停止并报告
- Protected Region 被修改 → 立即回滚