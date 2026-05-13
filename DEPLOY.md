# 初始化教程

## 1. 环境要求

- Node.js >= 18
- npm
- MySQL >= 8.0（需开启 `mysql_native_password` 认证插件，或创建使用该插件的用户）

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

编辑 `common/config.ts`，修改 MySQL 配置部分：

```ts
mysql: {
    host: "localhost",
    port: 3306,
    user: "root",          // 改为你的 MySQL 用户名
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
2. **创建 9 张表**（读取 `sql/init.sql`）
3. **连接健康检查** `SELECT * FROM anime LIMIT 10`

看到以下日志表示成功：

```
数据库表初始化完成
成功连接到数据库
服务器已在 :::8090 上启动.
```

进入 MySQL 验证：

```bash
mysql -u root -p lavaanime -e "SHOW TABLES;"
```

应输出 9 张表：

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
| `ER_NOT_SUPPORTED_AUTH_MODE` | MySQL 8 默认使用 `caching_sha2_password` | `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_pwd';` |
| `Access denied` | 用户名或密码错误 | 检查 `config.mysql.user` 和 `config.mysql.password` |
| 数据库表初始化失败 | 用户没有 CREATE DATABASE 权限 | `GRANT ALL ON *.* TO 'your_user'@'localhost';` |

## 6. 同步任务

需要刷新番剧、Bangumi 数据等任务时运行：

```bash
npm run sync
```

该命令使用 `tsx` 直接执行 `tasks/v2/main.ts`，因此需要保留 devDependencies。若生产环境使用 `npm install --omit=dev`，请先把同步脚本改为运行编译后的 `dist/tasks/v2/main.js`，或在生产环境安装 devDependencies。
