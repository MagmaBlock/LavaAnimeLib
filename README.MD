# 简介

熔岩番剧库后端，提供番剧库的后端服务。

# 主要实现
* Node.js
* MariaDB

## 第三方依赖

* 基于 [AList](https://github.com/alist-org/alist) 提供的 HTTP API 进行资源管理和链接获取。 AList 是一个使用 Go 语言编写的云存储管理工具，支持 OneDrive、S3 等各种云存储。
* 基于 [Bangumi 番组计划](http://bgm.tv/)及其 [API](https://bangumi.github.io/api/#/) 提供的番剧百科资料信息和番剧封面图。

## 主要 npm 依赖
* Express 4
* mysql2（用于连接 MariaDB）
* Axios
* lodash
* TypeScript

## 开发与部署

本项目源码使用 TypeScript。开发环境可直接运行：

```bash
npm run dev
```

生产环境需要先编译：

```bash
npm install
npm run build
npm start
```

`npm start` 会运行编译后的 `dist/main.js`。本地配置文件为 `common/config.ts`，可从 `common/configTemplate.ts` 复制生成。

也可以使用 Docker Compose 只启动开发数据库，然后在宿主机裸机运行 app：

```bash
docker compose -f compose.dev.yml up
npm run dev
```

该配置只启动 MariaDB。首次使用时，复制配置模板：

```bash
cp common/configTemplate.ts common/config.ts
```

然后将 `common/config.ts` 里的 MariaDB 配置改为 `host: "localhost"`、`port: 3306`、`user: "LavaAnime"`、`password: "password"`、`database: "lavaanime"`。

停止并保留数据库数据：

```bash
docker compose -f compose.dev.yml down
```

如需清空开发数据库：

```bash
docker compose -f compose.dev.yml down -v
```

# 其他
本程序并未链接到任何资源服务，若您需要使用，请自行搭建 AList 服务并按照相应的目录结构搭建您的存储并接入。
