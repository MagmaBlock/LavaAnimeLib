# LavaAnimeLib Server V2 — Agent 指南

## 项目概览

熔岩番剧库 Monorepo，基于 pnpm Workspace。包含 Express 后端、Nuxt 前端和共享类型包。

## 技术栈

- **Runtime**: Node.js 18+
- **Frontend**: Nuxt 3 + Vue 3 + TailwindCSS
- **Backend**: Express 4 + TypeScript (ES2022, NodeNext)
- **Database**: MariaDB (via mysql2 + Drizzle ORM)
- **Validation**: Zod
- **Package Manager**: pnpm 10+ (Workspace Monorepo)
- **Dev Runner**: tsx watch (server), Vite (web)

## Monorepo 目录结构

```
.
├── package.json                # 根：workspace 脚本
├── pnpm-workspace.yaml         # packages/* + apps/*
├── compose.dev.yml              # 开发数据库
├── compose.test.yml             # 测试数据库
├── .gitignore
│
├── packages/
│   └── shared/                  # @lavaanime/shared  前后端共享类型
│       ├── src/
│       │   ├── api.ts           # ApiResponse<T>, PaginatedData<T>
│       │   ├── models.ts        # AnimeItem, UserInfo, BangumiData, etc.
│       │   └── index.ts         # barrel export
│       └── tsconfig.json
│
└── apps/
    ├── server/                 # @lavaanime/server  Express 后端
    │   ├── main.ts             # Express 入口：监听端口、启动服务
    │   ├── app.ts              # Express 应用创建：挂载中间件、路由、生产态静态文件
    │   ├── common/             # 底层工具与基础设施（禁止依赖上层）
    │   │   ├── database/
    │   │   │   ├── connection.ts   # DB 连接（Drizzle ORM + mysql2 + 自动迁移）
    │   │   │   └── schema/         # Drizzle ORM 表定义（10 张表）
    │   │   ├── api-clients/        # Bangumi / AList API 客户端
    │   │   ├── response/           # 统一 HTTP 响应封装 (200/400/401/403/404/500)
    │   │   ├── cache.ts            # 内存缓存 + GC
    │   │   └── tools/              # logger, validate 等
    │   ├── middleware/             # auth, logger, preprocess, validate
    │   ├── routes/v2/              # 路由注册（只导入 Controller + Middleware）
    │   ├── controllers/v2/         # HTTP 请求处理（不直接操作 SQL）
    │   ├── services/v2/            # 业务逻辑与数据访问（禁止操作 req/res）
    │   ├── schemas/v2/             # Zod 请求参数校验
    │   ├── tasks/v2/               # 定时/手动同步脚本
    │   ├── tests/                  # Vitest 测试（241 用例）
    │   ├── drizzle/                # Drizzle ORM 迁移文件
    │   └── drizzle.config.ts
    │
    └── web/                     # @lavaanime/web      Nuxt 3 前端 SPA (ssr: false)
        ├── nuxt.config.ts
        ├── app.vue
        ├── pages/ / components/ / composables/
        └── package.json
```

## 分层职责与依赖规则（server 包内部）

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

## 命名规范（server 包内部）

| 层级 | 文件命名 | 函数/变量命名 |
|------|----------|--------------|
| 路由 | `routes/v2/user.ts` | `userRouter` |
| Controller | `controllers/v2/user/login.ts` | `userLogin`（不加 `API` 后缀） |
| Service | `services/v2/user/auth.ts` | `verifyPassword` |
| Middleware | `middleware/auth/require-auth.ts` | `requireLogin` |
| Schema | `schemas/v2/user/login.ts` | Zod schema 对象 |
| 工具/响应 | `common/response/not-found.ts` | `notFound` |

## 关键命令

所有命令在仓库根目录执行：

```bash
# 开发
pnpm dev              # 并行启动前后端（Server tsx watch :8090 + Web Nuxt :3000）

# 构建
pnpm build            # 全量构建（shared → web → server），构建后 pnpm start 即可启动

# 类型 / 测试
pnpm typecheck        # 所有包类型检查
pnpm start            # 生产启动（:8090，自动托管前端静态文件）
pnpm test             # 运行全部测试
pnpm test:full        # 全流程测试（启动 test db → 运行测试 → 停止清理）

# 数据库
pnpm db:generate      # 生成 Drizzle 迁移文件
pnpm db:push          # 直接推送 schema
pnpm db:migrate       # 执行 Drizzle 迁移

# 同步
pnpm sync             # 刷新番剧/Bangumi 数据
```

## 生产部署

Nuxt 前端构建为纯静态文件（`ssr: false`），Express 自动托管：

```bash
pnpm build             # 一次性构建所有包
pnpm start             # Express :8090 → API + 前端静态文件（同端口）
```

前端 API 调用使用同源相对路径，无需配置 `SERVER_BASE_URL`。

## 配置文件

复制配置模板：

```bash
cp apps/server/common/configTemplate.ts apps/server/common/config.ts
```

编辑其中的数据库、AList、Bangumi 等配置。

测试环境使用 `apps/server/common/config.test.ts`。

## 数据库

程序启动时会自动：
1. `CREATE DATABASE IF NOT EXISTS`（如数据库不存在）
2. 执行 Drizzle ORM 迁移（读取 `drizzle/` 目录下的迁移文件）
3. 执行连接健康检查

开发环境可用 `docker compose -f compose.dev.yml up` 启动 MariaDB。

## 注意事项

- 所有 API 响应使用 `common/response/` 的统一函数，格式为 `{ code, message, data? }`。
- 外部 API 调用统一封装在 `common/api-clients/` 下。
- `tasks/` 中的脚本应尽量复用 `services/` 的逻辑，避免直接写 SQL。
- 前端通过 `@lavaanime/shared` 包引用后端类型，修改 schema 时同步更新 shared 包类型。
