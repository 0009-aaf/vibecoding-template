# Runbook — [项目名称]

> 运行指南：从零启动到发布回滚。vibe-plan 收尾生成，vibe-implement 实现后按实际修正。

## 1. 环境要求

| 项 | 版本 | 说明 |
|---|---|---|
| 运行时 | （Node/Python/...） | 从 02-ARCHITECTURE.md 技术栈确认 |
| 数据库 | （PostgreSQL/...） | 版本、连接信息 |
| 缓存/队列 | （Redis/BullMQ...） | 版本、地址 |
| 其他 | | |

## 2. 环境变量

复制 `.env.example` → `.env`，必填项：

| 变量 | 用途 | 示例 |
|------|------|------|
| `DATABASE_URL` | 数据库连接 | `postgres://user:pass@localhost:5432/db` |
| `REDIS_URL` | 缓存/队列 | `redis://localhost:6379` |
| `JWT_SECRET` | 认证密钥 | （生成随机值） |
| ... | | |

> ⚠️ `.env` 永不入库；生成密钥 `openssl rand -hex 32`

## 3. 本地启动

```bash
# 1. 依赖
npm install          # 或 pip install -r requirements.txt

# 2. 基础设施（docker compose）
docker compose up -d db redis

# 3. 迁移 + 种子（如需要）
npm run migrate
npm run seed

# 4. 启动
npm run dev
# 访问 http://localhost:<port>
```

## 4. 测试

```bash
npm test          # 单元
npm run test:e2e  # e2e（基线：架构 §8 测试策略）
```

## 5. 部署（CI/CD：GitHub Actions）

- 流水线：构建 → 测试 → 镜像 → Docker Compose 部署（见 02-ARCHITECTURE.md 选型）
- 版本：git tag `v*` 触发发布
- 环境：`production` secrets 在仓库 Settings → Secrets 配置（不落 code）

## 6. 回滚

```bash
# 回滚到上一个镜像 tag
docker compose down && docker compose up -d <上一版本>
# 或 git revert <坏提交> 重新部署
```
> 数据库回滚：先恢复备份（见 §7），再回滚代码；前后端分离时先回滚后端。

## 7. 备份与恢复（灾备：3-2-1 策略）

- 备份脚本：`scripts/backup.sh`（PG dump + 静态资源，每日 + 手动）
- 存储：主份本机 + 异地副本（对象存储）+ 1 份离线磁带/冷备
- 恢复演练：每季度实测一次恢复流程，记录时间与问题到本节

## 8. 已知运维注意

- （从 10 维选型的坑 / 故障记录补充）