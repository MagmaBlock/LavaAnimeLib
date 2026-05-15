# 初始化教程

## 1. 环境要求

- Node.js >= 18
- npm
- MariaDB >= 10.10.1（需要支持 `utf8mb4_uca1400_as_ci` collation）

## 2. 克隆 & 安装依赖

```bash
git clone <仓库地址>
cd LavaAnimeLibServerV2
npm install
```

## 3. 配置

复制配置模板：

```bash
cp common/configTemplate.ts common/config.ts
```

编辑 `common/config.ts`，修改 MariaDB 配置部分：

```ts
mysql: {
    host: "localhost",
    port: 3306,
    user: "root",          // 改为你的 MariaDB 用户名
    database: "lavaanime", // 库名，可自定义
    password: "your_pwd",  // 改为你的密码
},
```

> 配置中的 `drive`（AList 存储）、`bangumi`（番组计划 API）等可后续再配，不影响数据库初始化测试。

## 4. 启动 & 验证自动建表

先编译 TypeScript：

```bash
npm run build
```

再启动生产服务：

```bash
npm start
```

`npm start` 实际运行的是编译产物 `dist/main.js`。如果是开发环境，可以使用：

```bash
npm run dev
```

启动后，程序会自动执行以下操作：
1. **创建数据库** `CREATE DATABASE IF NOT EXISTS lavaanime`
2. **设置数据库默认字符集和排序规则** `utf8mb4` / `utf8mb4_uca1400_as_ci`
3. **执行 Drizzle ORM 迁移**（读取 `drizzle/` 目录下的迁移文件，自动创建 10 张表）
4. **连接健康检查**

看到以下日志表示成功：

```
数据库迁移完成
成功连接到数据库
服务器已在 :::8090 上启动.
```

进入 MariaDB 验证：

```bash
mysql -u root -p lavaanime -e "SHOW TABLES;"
```

应输出 10 张表：

```
anime
bangumi_data
follow
invite_code
settings
token
user
view_history
views
upload_message
```

## 5. 遇到问题？

| 现象 | 原因 | 解决 |
|---|---|---|
| `Access denied` | 用户名或密码错误 | 检查 `config.mysql.user` 和 `config.mysql.password` |
| 数据库迁移失败 | 用户没有 CREATE DATABASE 权限 | `GRANT ALL ON *.* TO 'your_user'@'localhost';` |
| `Unknown collation: 'utf8mb4_uca1400_as_ci'` | MariaDB 版本过旧，或正在连接 MySQL | 使用支持 UCA 14.0 collation 的 MariaDB 版本 |

## 6. 数据库迁移

修改 `common/database/schema/` 下的表定义后，需要生成新的迁移文件：

```bash
npm run db:generate
```

生成后可通过以下方式执行迁移：
- 重启应用（启动时自动执行迁移）
- 手动执行：`npm run db:migrate`

也可以直接推送 schema 到数据库（跳过生成迁移文件）：

```bash
npm run db:push
```

## 7. 同步任务

需要刷新番剧、Bangumi 数据等任务时运行：

```bash
npm run sync
```

该命令使用 `tsx` 直接执行 `tasks/v2/main.ts`，因此需要保留 devDependencies。若生产环境使用 `npm install --omit=dev`，请先把同步脚本改为运行编译后的 `dist/tasks/v2/main.js`，或在生产环境安装 devDependencies。

## 8. Docker Compose 开发调试

开发调试可以用 Docker Compose 只启动 MariaDB，并在宿主机裸机运行 Node.js 服务：

```bash
docker compose -f compose.dev.yml up
npm run dev
```

服务地址：

```text
http://localhost:8090
```

将 `common/config.ts` 里的 MariaDB 配置改为：

```ts
mysql: {
  host: "localhost",
  port: 3306,
  user: "LavaAnime",
  database: "lavaanime",
  password: "password",
},
```

该 Compose 只负责 MariaDB，不运行 app。停止数据库服务：

```bash
docker compose -f compose.dev.yml down
```

如需同时删除开发数据库 volume：

```bash
docker compose -f compose.dev.yml down -v
```
