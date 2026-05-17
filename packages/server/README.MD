# 简介

熔岩番剧库后端，提供番剧库的后端服务。本仓库是 pnpm Monorepo，包含后端、前端和共享类型包。

## 项目结构

```
LavaAnimeLibServerV2/
├── packages/
│   ├── server/        # @lavaanime/server   Express 后端 API
│   └── shared/        # @lavaanime/shared   共享 TypeScript 类型
├── apps/
│   └── web/           # @lavaanime/web      Nuxt 3 前端 SPA
├── compose.dev.yml / compose.test.yml
└── pnpm-workspace.yaml
```

# 主要实现
* Node.js + Express
* MariaDB
* Nuxt 3（前端）

## 第三方依赖

* 基于 [AList](https://github.com/alist-org/alist) 提供的 HTTP API 进行资源管理和链接获取。 AList 是一个使用 Go 语言编写的云存储管理工具，支持 OneDrive、S3 等各种云存储。
* 基于 [Bangumi 番组计划](http://bgm.tv/)及其 [API](https://bangumi.github.io/api/#/) 提供的番剧百科资料信息和番剧封面图。

## 主要 npm 依赖

**后端**
* Express 4
* Drizzle ORM（数据库 ORM）
* mysql2（用于连接 MariaDB）
* Zod（请求参数校验）
* Axios / lodash / TypeScript

**前端**
* Nuxt 3 / Vue 3
* TailwindCSS / NaiveUI
* Pinia / PWA

## 开发

```bash
pnpm install          # 安装所有包依赖
pnpm dev              # 启动后端（tsx watch，端口 8090）
pnpm dev:web          # 启动前端（Nuxt dev，端口 3000）
```

两个端口同时启动后，前端 `http://localhost:3000` 通过 `SERVER_BASE_URL=http://localhost:8090` 环境变量调用后端 API。

开发时复制配置模板：

```bash
cp packages/server/common/configTemplate.ts packages/server/common/config.ts
```

然后将 `packages/server/common/config.ts` 里的 MariaDB 配置改为相应值。

也可以使用 Docker Compose 只启动开发数据库：

```bash
docker compose -f compose.dev.yml up
pnpm dev
```

停止并保留数据库数据：

```bash
docker compose -f compose.dev.yml down
```

如需清空开发数据库：

```bash
docker compose -f compose.dev.yml down -v
```

## 生产构建（单端口）

Nuxt 前端构建为纯静态文件，Express 同时托管 API 和前端：

```bash
pnpm build:prod        # shared → web（nuxt generate） → server（tsc）
pnpm start             # 启动 Express :8090，同时提供 API + 前端静态文件
```

不需要设置 `SERVER_BASE_URL`，前端自动使用同源请求。

# 测试

本项目使用 [Vitest](https://vitest.dev/) 作为测试框架，测试数据库使用独立的 Docker MariaDB 实例。

## 测试结构

```
tests/
├── unit/                          # 单元测试（纯函数 + service 层）
│   ├── password.test.ts           #   密码加密与验证，零依赖
│   ├── token.test.ts              #   token 创建/保存/验证/注销
│   └── user.test.ts               #   用户 CRUD、查询
├── integration/                   # 集成测试（supertest × 完整 HTTP 请求）
│   ├── anime.test.ts              #   番剧查询、批量查询、Bangumi 查询、近期更新
│   ├── user-flow.test.ts          #   注册→登录→鉴权→登出全链路
│   ├── follow.test.ts             #   追番添加/移除/列表/统计
│   ├── history.test.ts            #   观看记录上报与查询
│   └── remaining.test.ts          #   index、search、home、drive、site、report 等
├── seed.sql                       # 测试种子数据
├── setup.ts                       # 全局 setup：mock config、重置 cache、加载种子数据
└── vitest.config.ts               # Vitest 配置
```

共 **241 个测试用例**，覆盖全部 34 个 API 端点的正常路径与异常路径。

## 运行测试

```bash
# 启动测试数据库（首次需要）
pnpm test:db:up

# 运行全部测试
pnpm test

# 监听模式（开发时使用）
pnpm test:watch

# 停止测试数据库
pnpm test:db:down

# 清空并重建测试数据库
pnpm test:db:reset
```

测试数据库使用独立的 `compose.test.yml`（仓库根目录），端口 **3307**，数据库名 `lavaanime_test`，与开发环境（3306）互不干扰。测试启动时自动执行 Drizzle 迁移、加载种子数据（`tests/seed.sql`），每次测试文件运行前自动重置全局缓存。

## 测试配置

测试使用 `common/config.test.ts` 而非 `common/config.ts`，通过 Vitest 的 `vi.mock` 在 `tests/setup.ts` 中全局替换，确保所有测试请求均指向测试数据库。

# 其他
本程序并未链接到任何资源服务，若您需要使用，请自行搭建 AList 服务并按照相应的目录结构搭建您的存储并接入。
