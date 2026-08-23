---
name: coding-standards-api
description: REST API 设计规范（9 条）。Agent 操作 API 路由/controller 时自动加载。包含 RFC 9457 错误格式、状态码语义、幂等、结构化日志。从 coding-standards §6.3 拆出。
---

# REST API 编码规范

> 从 coding-standards v1.8 §6.3 拆出。通用规则见 `coding-standards` skill。

| # | 规则 |
|---|------|
| API1 | 错误响应统一 RFC 9457 格式：`type`/`title`/`status`/`detail`/`instance`，`Content-Type: application/problem+json` |
| API2 | HTTP 状态码语义严格：400 格式错、401 未认证、403 无权限、404 不存在、422 业务校验失败、429 限流、500+ 服务端 |
| API3 | 禁止 200 + error body 的反模式 - 客户端先判断状态码 |
| API4 | 校验失败一次性返回所有字段级错误（`errors[]` 含 `field`/`code`/`message`），不让调用方反复试错 |
| API5 | 错误码用 `domain.specific_error` 格式，机器可读 |
| API6 | 429/503 响应带 `Retry-After` 头；数据变更接口支持 `Idempotency-Key` 幂等 |
| API7 | 错误日志结构化 JSON：`timestamp`/`requestId`/`service`/`status`/`errorCode`/`latencyMs`，含 `trace_id` 全链路追踪 |
| API8 | 绝不向客户端暴露栈轨迹/内部路径/SQL 语句，生产环境错误详情只写日志 |
| API9 | 安全方法 (GET/HEAD) 可自动重试；变更方法用指数退避+抖动，不依赖客户端自觉 |

## API 自检清单（提交前过一遍）

```
□ 错误响应用了 RFC 9457 格式？            -> API1 API2
□ 一次性返回了所有字段校验错误？          -> API4
□ 没有暴露栈轨迹/内部路径？               -> API8
□ 错误码用 domain.specific_error 格式？   -> API5
```
