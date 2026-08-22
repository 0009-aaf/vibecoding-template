---
description: 查看当前活跃的 Focus 状态列表
---

## Focus 状态: /focus-status

### 步骤1: 扫描活跃 sessions
从主 blackboard 读取活跃会话表，筛选 `focus-*` SID

### 步骤2: 读取每个活跃 focus
对每个活跃 focus:
1. 读 session blackboard 的 focus 注册信息
2. 提取: target, files, function, constraints, started_at, status

### 输出
表格格式:

| SID | 目标 | 文件范围 | 已运行时间 | 状态 |
|-----|------|---------|-----------|------|
| focus-20260805-a1b2 | 实现认证模块 | auth/*,db/* | 15min | in_progress |
| focus-20260805-c3d4 | 数据库设计 | db/* | 5min | in_progress |

$ARGUMENTS: 可选 SID 查看详细状态