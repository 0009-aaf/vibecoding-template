---
name: coding-standards-node
description: Node.js 后端编码规范。Agent 操作 Express/Koa/Fastify/Next.js 后端代码时自动加载。检测到 express/koa/fastify/next 依赖或 app.ts/server.ts 文件结构时触发。
---

# Node.js 后端编码规范

## 触发条件

Agent 操作 Express/Koa/Fastify/Next.js 后端代码时自动加载。检测到 `express`/`koa`/`fastify`/`next` 依赖或 `app.ts`/`server.ts` 文件结构时触发。

## Node.js 后端 (24 条)

| # | 规则 |
|---|------|
| ND1 | 按领域(Function)分组，不按文件类型分组；app.ts与server.ts分离 |
| ND2 | 自定义错误类 + `isOperational` 标志；区分操作错误 vs 程序错误 |
| ND3 | 集中错误处理中间件最后注册；生产环境隐藏 stack trace |
| ND4 | Express 4用asyncHandler包装；Express 5原生支持async |
| ND5 | async/await与.then()统一用其一；catch必处理；fire-and-forget async需显式标记 |
| ND6 | 环境变量Zod schema验证启动即失败；封装env访问层 |
| ND7 | Pino JSON结构化日志；生产输出NDJSON；日志级别按环境切换 |
| ND8 | 请求级别注入requestId(AsyncLocalStorage)；日志自动携带 |
| ND9 | 手动DI + 组合根(composition root)；模块通过参数接收依赖 |
| ND10 | 优雅关闭：处理SIGTERM/SIGINT/uncaughtException；硬超时30s |
| ND11 | RESTful命名：集合复数名词，小写连字符；嵌套≤2层；版本化 |
| ND12 | 数据库连接池单例；连接池大小=(numCPUs*2+1)/实例数；Serverless用connection_limit=1 |
| ND13 | 输入校验：路由层用Zod schema验证body/query/params；校验失败返回422 |
| ND14 |Helmet安全头：CSP/HSTS/X-Frame-Options/X-Content-Type-Options；CORS白名单配置 |
| ND15 | 速率限制：express-rate-limit；按IP+用户ID双维度；429带Retry-After头 |
| ND16 | 密码处理：bcrypt(成本因子12+)或argon2；密码哈希存储；JWT用RS256非对称 |
| ND17 | 文件上传：限制MIME类型+大小+扩展名；存储路径校验防目录穿越；病毒扫描 |
| ND18 | 缓存策略：Redis cache-aside；缓存键带版本号；TTL+主动失效双保险 |
| ND19 | 测试：单元测试覆盖纯函数；集成测试用Testcontainers跑真实DB；E2E测试最小集 |
| ND20 | 事务管理：显式事务边界；Repository方法暴露事务接口；长事务拆分 |
| ND21 | API版本化：URL路径版本(/v1/)或Header版本；废弃版本给sunset头 |
| ND22 | 分页：cursor-based优于offset；默认page_size=20；最大page_size=100 |
| ND23 | 健康检查：/health(轻量)和/ready(检查依赖)；K8s探针用各自端点 |
| ND24 | 配置分层：默认值<环境变量<配置文件<启动参数；配置变更需重启 |
