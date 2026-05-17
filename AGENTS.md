# LavaAnimeLib Server V2 — Agent 指南

## 项目概览

熔岩番剧库后端，基于 Express + TypeScript + MariaDB + Drizzle ORM，提供番剧索引、搜索、播放、用户系统、追番、管理员等 API。

## 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Language**: TypeScript (target ES2022, module NodeNext)
- **Database**: MariaDB (via mysql2 + Drizzle ORM)
- **Validation**: Zod
- **Dev Runner**: tsx watch

## 目录结构

```
.
├── main.ts                     # Express 入口：监听端口、启动服务
├── app.ts                      # Express 应用创建：挂载中间件与路由
├── config/
│   └── index.ts                # 应用配置（纯对象，无业务逻辑）
├── common/                     # 底层工具与基础设施（禁止依赖上层）
│   ├── database/
│   │   ├── connection.ts       # 数据库连接（Drizzle ORM + mysql2 连接池 + 自动迁移）
│   │   └── schema/             # Drizzle ORM 表定义（10 张表，每表一个文件）
│   ├── api-clients/
│   │   ├── bangumi.ts          # Bangumi API 客户端
│   │   └── alist.ts            # AList API 客户端工厂函数
│   ├── response/               # 统一 HTTP 响应封装
│   │   ├── success.ts          # 200
│   │   ├── bad-request.ts      # 400
│   │   ├── unauthorized.ts     # 401
│   │   ├── forbidden.ts        # 403
│   │   ├── not-found.ts        # 404
│   │   └── server-error.ts     # 500
│   ├── cache.ts                # 内存缓存 + GC
│   └── tools/
│       └── logger.ts           # 带时间戳的彩色日志
├── middleware/                 # 横切关注点
│   ├── auth/
│   │   ├── handler.ts          # Token 解析、用户注入
│   │   └── require-auth.ts     # loginRequire / adminRequire
│   ├── logger/
│   │   └── request-logger.ts
│   └── preprocess/
│       ├── headers.ts          # CORS 头 + OPTIONS 处理
│       └── referer-checker.ts
├── schemas/                    # Zod 请求参数校验
│   └── v2/
│       ├── admin/
│       ├── anime/
│       ├── index/
│       ├── search/
│       ├── site/
│       └── user/
├── routes/                     # 路由注册层（只导入 Controller 和 Middleware）
│   └── v2/
│       ├── index.ts            # v2 总路由，挂载各子路由
│       ├── anime.ts
│       ├── user.ts
│       ├── search.ts
│       ├── index-router.ts     # 业务模块名为 index，文件避免重名
│       ├── home.ts
│       ├── drive.ts
│       ├── admin.ts
│       ├── site.ts
│       └── report.ts
├── controllers/                # HTTP 请求处理层（只处理 req/res，不直接操作 SQL）
│   └── v2/
│       ├── anime/
│       ├── user/
│       ├── search/
│       ├── index/
│       ├── home/
│       ├── drive/
│       ├── admin/
│       ├── site/
│       └── report/
├── services/                   # 业务逻辑与数据访问层（禁止操作 req/res）
│   └── v2/
│       ├── anime/
│       ├── user/
│       ├── search/
│       ├── index/
│       ├── home/
│       ├── drive/
│       ├── admin/
│       ├── site/
│       ├── report/
│       └── parser/
│           └── anime.ts        # 番剧数据解析器（关联 Bangumi Data）
├── types/                      # TypeScript 类型定义
│   ├── express.d.ts            # Express Request 扩展（req.user, req.queryStart）
│   ├── models.d.ts             # 数据库表对应的类型
│   └── ...
├── tasks/                      # 定时/手动同步脚本（复用 services/）
│   └── v2/
│       ├── main.ts             # 同步任务入口
│       ├── updateAnimes.ts     # 从 AList 刷新番剧列表
│       ├── updateBangumiData.ts
│       ├── updatePosters.ts
│       ├── bangumiAPI.ts
│       ├── bangumiDB.ts
│       └── tools/
├── drizzle/                    # Drizzle ORM 迁移文件
│   ├── 0000_*.sql              # 数据库迁移 SQL
│   └── meta/                   # 迁移元数据
├── tests/                      # 测试
│   ├── unit/                   # 单元测试（service 层纯逻辑）
│   ├── integration/            # 集成测试（supertest × 完整 HTTP 请求）
│   ├── seed.sql                # 测试种子数据
│   └── setup.ts                # 全局测试配置
├── drizzle.config.ts           # Drizzle Kit 配置
└── vitest.config.ts            # Vitest 测试配置
```

## 分层职责与依赖规则

```
routes → controllers → services → common
routes → controllers → schemas
middleware → services / common
tasks → services / common
```

- **Common 层绝对不允许**出现指向 `controllers` / `services` / `routes` / `middleware` / `tasks` 的 import。
- Controller 禁止直接执行 SQL 或调用外部 HTTP API。
- Service 禁止操作 `req` / `res`。
- 路由层只导入 Controller 和 Middleware。
- Controller 应在调用 Service 前使用 `schemas/v2/` 下的 Zod schema 校验输入参数。

## 命名规范

| 层级 | 文件命名 | 函数/变量命名 |
|------|----------|--------------|
| 路由 | `routes/v2/user.ts` | `userRouter` |
| Controller | `controllers/v2/user/login.ts` | `userLogin`（不加 `API` 后缀） |
| Service | `services/v2/user/auth.ts` | `verifyPassword` |
| Middleware | `middleware/auth/require-auth.ts` | `requireLogin` |
| Schema | `schemas/v2/user/login.ts` | Zod schema 对象 |
| 工具/响应 | `common/response/not-found.ts` | `notFound` |

## 关键命令

```bash
pnpm dev         # 开发模式（tsx watch）
pnpm build       # 编译 TypeScript → dist/
pnpm typecheck   # 仅类型检查
pnpm start       # 运行编译产物 dist/main.js
pnpm sync        # 运行同步任务（tasks/v2/main.ts）
pnpm db:generate # 生成 Drizzle 迁移文件
pnpm db:push     # 直接推送 schema 到数据库
pnpm db:migrate  # 执行 Drizzle 迁移
pnpm test        # 运行全部测试（vitest run）
pnpm test:watch  # 测试监听模式
```

## 配置文件

复制 `common/configTemplate.ts` 为 `common/config.ts`，然后修改其中的数据库、AList、Bangumi 等配置。

测试环境使用 `common/config.test.ts`，启动测试数据库后自动生效。

## 数据库

程序启动时会自动：
1. `CREATE DATABASE IF NOT EXISTS`（如数据库不存在）
2. 执行 Drizzle ORM 迁移（读取 `drizzle/` 目录下的迁移文件）
3. 执行连接健康检查

开发环境可用 `docker compose -f compose.dev.yml up` 启动 MariaDB。

Drizzle 表定义位于 `common/database/schema/`，每张表一个文件。数据库迁移由 `drizzle-kit` 管理：
- 修改 schema 后运行 `pnpm db:generate` 生成迁移文件
- 运行 `pnpm db:migrate` 执行迁移（或重启应用自动执行）

## 请求参数校验

Controller 应在调用 Service 前使用 Zod schema 校验输入。Schema 文件统一放在 `schemas/v2/` 下，按业务模块分目录。校验通过 `common/tools/validate.ts` 中的中间件执行。

## 注意事项

- 所有 API 响应使用 `common/response/` 的统一函数，格式为 `{ code, message, data? }`。
- 外部 API 调用统一封装在 `common/api-clients/` 下。
- `tasks/` 中的脚本应尽量复用 `services/` 的逻辑，避免直接写 SQL。
- 测试共 **101 个用例**，覆盖全部 API 端点的正常与异常路径。
