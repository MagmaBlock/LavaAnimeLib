# `class` 文件夹简介

本文件夹存放业务相关的类。

对于需要存储到数据库的相关类，通常以 `XXXTool` 命名，其中 `XXX` 是 Prisma 的模型名称。
`XXXTool` 通常直接存储了一份 `XXX` 在其成员中。构造 `XXXTool` 时，一般也需要传入对应的 Prisma 模型类。
