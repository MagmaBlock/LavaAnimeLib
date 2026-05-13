# 初始化教程

## 1. 环境要求

- Node.js >= 18
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
cp common/configTemplate.js common/config.js
```

编辑 `common/config.js`，修改 MySQL 配置部分：

```js
mysql: {
    host: "localhost",
    port: 3306,
    user: "root",          // 改为你的 MySQL 用户名
    database: "lavaanime", // 库名，可自定义
    password: "your_pwd",  // 改为你的密码
},
```

> 配置中的 `drive`（AList 存储）、`bangumi`（番组计划 API）、`oneBot`（QQ 机器人）等可后续再配，不影响数据库初始化测试。

## 4. 启动 & 验证自动建表

```bash
npm start
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
