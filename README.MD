# 简介

熔岩番剧库后端，提供番剧库的后端服务。

# 主要实现
* Node.js
* MySQL

## 第三方依赖

* 基于 [AList](https://github.com/alist-org/alist) 提供的 HTTP API 进行资源管理和链接获取。 AList 是一个使用 Go 语言编写的云存储管理工具，支持 OneDrive、S3 等各种云存储。
* 基于 [Bangumi 番组计划](http://bgm.tv/)及其 [API](https://bangumi.github.io/api/#/) 提供的番剧百科资料信息和番剧封面图。

## 主要 npm 依赖
* Express 4
* mysql2
* Axios
* lodash

# 其他
本程序并未链接到任何资源服务，若您需要使用，请自行搭建 AList 服务并按照相应的目录结构搭建您的存储并接入。