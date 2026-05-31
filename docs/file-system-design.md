# 文件系统与文件索引重构设计文档

## 一、背景与动机

### 现状问题

当前系统将 AList 硬编码为唯一的文件存储后端：

- `schemas/v2/admin/drive.ts` 中 `type: z.literal("alist")` 硬编码
- `services/v2/anime/file.ts` 直接调用 `axios.post("/api/fs/list", ...)` 绕过任何抽象
- `tasks/v2/updateAnimes.ts` 通过 `alistGetter` 直接依赖 AList API 响应格式
- 所有 `DriveRecord` 类型写死 `type: "alist"`
- 文件列表每次请求实时调用外部 API，无任何缓存

### 重构目标

1. **多类型文件系统支持**：通过面向对象的 Driver 抽象，使 AList 仅为一类实现，未来可扩展其他存储后端
2. **全文件索引**：在数据库内维护文件系统的完整快照（`file_index` 表），以索引为优先数据源，减少对外部 API 的依赖；已删除的文件使用软删除保留记录，支持外键关联场景
3. **扫盘与对外分离**：Drive（扫盘节点）与 Endpoint（面向用户的对外节点）分离，同一存储只需一份索引
4. **灵活路径编排**：索引不固化目录层级语义，通过 anime.index 路径匹配兼容现有番剧系统的文件列表查询

---

## 二、核心概念

### 2.1 FileSystemDriver（文件系统驱动）

每种存储后端实现统一接口，对上层透明。

```
Interface FileSystemDriver
  - type: string                          // 驱动类型标识 "alist" 等
  - list(path, options) → Entry[]         // 列出归一化路径下的条目；Driver 内部负责 prepend/strip rootPath
  - getDownloadUrl(entry, context) → URL  // 构造下载链接
```

```
Class AlistDriver implements FileSystemDriver
  // 封装 POST /api/fs/list
  // 封装路径拼接与签名处理
  // 封装 AList 特有的错误响应格式（code: 200/500 等）
```

**工厂函数**：

```
Factory.createDriver(config) → FileSystemDriver
  // 根据 config.type 实例化对应 Driver
  // 传入 config 作为连接参数（type 决定 Driver 类型，host/path/password 等作为配置）
```

### 2.2 FileSystemEntry（Driver 返回的条目类型）

```
Interface FileSystemEntry
  - name: string        // 文件名/目录名
  - path: string        // 归一化路径，由 Driver 剥离连接配置的 rootPath 前缀后返回；对索引层透明
  - type: "file"|"dir"  // 条目类型
  - size: number        // 文件大小（目录为 0）
  - modified: string    // 修改时间
  - sign?: string       // 下载签名（仅 file 类型，用于构造下载 URL）
```

**设计原则**：精简到只包含各类文件系统都能提供的通用元数据。不包含 `thumbnail`（无消费方）、`provider`（drive_id 已定位节点，不需知道 AList 底层挂载了什么）。

### 2.3 file_index（文件索引表）

全文件系统的数据库快照。不绑定任何业务语义。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT PK | 自增 |
| `drive_id` | VARCHAR FK | 所属存储节点（必须） |
| `anime_id` | INT FK NULL | 关联的番剧（可空，异步回填） |
| `path` | VARCHAR | 归一化路径，如 `/2024/TV/某番剧/ep01.mkv`（由 Driver 剥离连接配置 rootPath 前缀后存储） |
| `name` | VARCHAR | 文件/目录名 |
| `size` | BIGINT | 文件大小 |
| `type` | ENUM('file','dir') | 条目类型 |
| `deleted` | TINYINT | 软删除标记，0=有效 1=已删除，默认 0 |
| `modified` | TIMESTAMP | 源文件修改时间 |
| `sign` | VARCHAR | 下载签名（AList 等需要） |
| `indexed_at` | TIMESTAMP | 索引时间 |

**约束**：

```
UNIQUE (drive_id, path)       // 每个节点下路径唯一（软删除后记录仍占用此键）
INDEX (anime_id)              // 按番剧查询文件
INDEX (drive_id, type)        // 扫盘分析用
INDEX (deleted, indexed_at)   // TTL + 过期清理用
```

**设计原则**：

- 不存储 `depth`（目录层级由扫盘分析逻辑解释，不固化在 schema）
- 不存储 `parse_result`（文件解析器是纯 JS 函数，现场运行，无需持久化）
- 不存储 `thumbnail`（当前无消费方）
- 不存储 `provider`（`drive_id` 已定位节点，不需要知道 AList 底层挂载了什么）
- `path` 为归一化路径：Driver 负责剥离连接配置的 `rootPath` 前缀，索引层不感知物理存储路径
- `anime_id` 可为 NULL（文件可能不属于任何番剧，或番剧尚未创建）
- 使用软删除（`deleted` 标记）替代物理删除，保留记录以支持外键关联（如观看记录关联到 `file_index.id`）

### 2.4 软删除设计

**动机**：未来其他表（如观看记录）可能通过 `file_index.id` 建立外键关联。物理删除会导致外键断裂，软删除则保留记录以便展示"该文件曾存在"的信息。

**UNIQUE 键与软删除的配合**：

`(drive_id, path)` 是唯一键，但软删除的记录也占用此键。当文件被删除后重新出现时，必须**复用**原有的软删除记录而非尝试 INSERT 新行，否则会触发唯一键冲突。

扫盘时的行级逻辑：

```
// 对每个扫出的条目
existing = SELECT * FROM file_index WHERE drive_id = ? AND path = ?

if existing:
  if existing.deleted == 1:
    // 文件恢复：复用旧记录，清除软删除标记
    UPDATE SET deleted = 0, indexed_at = NOW(), size = ?, sign = ?, ...
  else:
    // 文件仍在：刷新元数据
    UPDATE SET indexed_at = NOW(), size = ?, sign = ?, ...

else:
  // 新文件
  INSERT (deleted = 0)
```

**扫盘结束后的过期标记**：

```
// 本次扫盘未覆盖到的条目 → 标记为已删除
UPDATE file_index
SET deleted = 1
WHERE drive_id = ?
  AND indexed_at < scan_start_time
  AND deleted = 0
```

**消费侧的过滤责任**：

所有对 `file_index` 的查询必须带 `WHERE deleted = 0`。此过滤应内聚在 `FileIndexService` 的方法中，调用方无需关心。

### 2.5 扫盘节点与对外节点分离

#### 问题

生产中同一套底层文件系统，常有多个对外域名（不同线路/运营商）。若将每条线路视为独立 Drive，file_index 会翻倍、扫盘任务重复运行，且用户困惑。

#### 方案：两层表结构

Drive 是存储节点的完整定义（包含连接配置），是系统扫描与索引的承载体。Endpoint 是面向用户的接入点，可覆写 Drive 的连接配置以实现灵活的网络路由。

```
drives              — 存储节点，内嵌完整连接配置（type / host / path / password）
  │
  └── drive_endpoints   (1:N)  用户用，一个 drive 有多个 endpoint
         │
         ├── drive_id → drives             (N:1)
         ├── name      线路名称
         ├── config_override (JSON NULL)  覆写 drive 连接配置中的部分字段
         ├── priority
         └── enabled
```

#### 职责分离

| 操作 | 使用的连接 | 来源 |
|------|-----------|------|
| 全量扫盘 | `drives.config` | drives |
| 按需刷新某番剧目录 | `drives.config` | drives |
| 构造下载 URL | `merge(drive.config, endpoint.config_override)` | drives + endpoint |
| 文件是否存在 | 不涉及连接 | file_index (drive_id + path) |

`file_index` 完全不受 endpoint 影响——一个 drive 只维护一份索引。

#### drives 表

保持原有字段（`type` / `host` / `path` / `password`），无需新增连接配置外键。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR PK | 存储节点 ID |
| `name` | VARCHAR(100) | 节点名称（"东京一号"） |
| `type` | VARCHAR(32) | 驱动类型（"alist"） |
| `host` | VARCHAR | AList 地址 |
| `path` | VARCHAR | 扫盘根路径 |
| `password` | VARCHAR | AList 密码 |
| `description` | VARCHAR | 描述 |
| `banNSFW` | TINYINT | 是否禁止 NSFW 内容 |
| `enabled` | TINYINT | 是否启用 |
| `isDefault` | TINYINT | 是否默认节点 |
| `sortOrder` | INT | 排序 |

`type` 决定 Factory 实例化哪个 Driver，`host/path/password` 的 JSON 结构由对应 Driver 的 Zod Schema 校验。

#### drive_endpoints 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT PK | 自增 |
| `drive_id` | VARCHAR FK | 所属存储节点 |
| `name` | VARCHAR(100) | 线路名称（"电信直连"、"本机转发"） |
| `config_override` | JSON NULL | 覆写 drive 连接配置中的部分字段，NULL = 不覆写 |
| `priority` | INT | 优先级，越小越优先，默认 0 |
| `enabled` | TINYINT | 是否启用，默认 1 |

**Endpoint 生效配置** = `{ ...drive.config, ...endpoint.config_override }`，常见的覆写字段为 `host`（换域名走 CDN）或 `path`（同一 AList 不同挂载点）。不覆写时 `config_override` 为 NULL，直接沿用 drive 配置。

#### 典型场景

两台 AList 服务器，每台各挂 3 个存储（OD1 直连、OD1 转发、GD1 转发）：

```
drives (4 行)
  hk-od1   alist  /od1-direct  host: hk-alist.example.com
  hk-gd1   alist  /gd1-forward host: hk-alist.example.com
  tky-od1  alist  /od1-direct  host: tky-alist.example.com
  tky-gd1  alist  /gd1-forward host: tky-alist.example.com

drive_endpoints (6 行)
  hk-od1 → name:"直连"     config_override: NULL
  hk-od1 → name:"本机转发" config_override: { path: "/od1-proxy" }
  hk-gd1 → name:"转发"     config_override: NULL
  tky-od1 → name:"直连"    config_override: NULL
  tky-od1 → name:"本机转发" config_override: { path: "/od1-proxy" }
  tky-gd1 → name:"转发"    config_override: NULL
```

扫盘 4 次，索引 4 份，对外 6 个 endpoint。host 在同一台 AList 的多个 drive 间虽然重复，但避免了引入独立的连接配置抽象层。未来若确需复用（如多 drive 共享同一 S3 bucket），届时再抽取不迟。

#### 对 API 的影响

**公开 Drive 列表**（`GET /v2/drive/all`）多一层 endpoints：

```
{
  "default": "tky1",
  "list": [{
    "id": "tky1",
    "name": "东京一号",
    "banNSFW": false,
    "endpoints": [
      { "id": 1, "name": "电信", "priority": 0 },
      { "id": 2, "name": "海外", "priority": 1 }
    ]
  }]
}
```

**文件请求** 增加 `endpoint` 参数：

```
GET /v2/anime/file?id=1&drive=tky1&endpoint=1
// 不传 endpoint → 默认取该 drive 下 priority 最高的 enabled endpoint
```

**管理员 Drive CRUD**：

- 创建 Drive 时内联提供 `type` + `host` + `path` + `password` 等连接配置
- 管理 Endpoints 需要独立的 CRUD 接口（或嵌入 Drive 编辑界面）

---

## 三、核心流程

### 3.1 扫盘任务（仅管理 file_index 生命周期）

扫盘不负责番剧发现或创建。番剧创建是手动操作（由管理员选择目录关联），不在本设计范围内。扫盘只维护 file_index 与真实文件系统的一致性。

```
┌─────────────────────────────────────────────────────────────┐
│                      扫盘任务 (scan task)                    │
│                                                             │
│  1. 获取所有启用状态的 drive 记录                             │
│     for each drive:                                         │
│       driver = Factory.createDriver(drive)  // drive 内嵌完整连接配置 │
│       scanStart = NOW()                                     │
│       recursiveScan(driver, drive.path)  // rootPath 来自 drive │
│                                                             │
│  2. recursiveScan(driver, path):                            │
│     entries = driver.list(path)                             │
│     for each entry:                                         │
│       existing = SELECT * FROM file_index                   │
│                   WHERE drive_id = ? AND path = ?           │
│       if existing:                                          │
│         if existing.deleted == 1:                           │
│           UPDATE SET deleted=0, ... // 文件恢复，复用记录      │
│         else:                                               │
│           UPDATE SET indexed_at=NOW(), ... // 刷新元数据      │
│       else:                                                 │
│         INSERT (deleted=0, ...)     // 新文件               │
│       if entry.type == 'dir':                               │
│         recursiveScan(driver, entry.path)                   │
│                                                             │
│  3. 标记已删除条目 (软删除)                                   │
│     UPDATE file_index                                       │
│     SET deleted = 1                                         │
│     WHERE drive_id = ?                                      │
│       AND indexed_at < scanStart                            │
│       AND deleted = 0                                       │
│     // 本次扫盘未覆盖的条目，说明文件系统上已不存在              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 用户请求文件列表（兼容现有 anime 表）

与当前系统一致：通过 `anime.index {year, type, name}` 拼接路径，查询 file_index 获取该目录下的文件。`anime_id` 字段暂不用于查询，预留给未来手动关联。

```
GET /v2/anime/file?id={laID}&drive={driveId}&endpoint={endpointId}
     │
     ▼
┌──────────────────────────────────────────────┐
│  1. 验证 anime 存在且未被删除                    │
│  2. 验证 NSFW 兼容性                           │
│     (anime.nsfw && drive.banNSFW → 拒绝)       │
├──────────────────────────────────────────────┤
│  3. 根据 anime.index 构造归一化目录路径            │
│     dirPath = year/type/name                   │
├──────────────────────────────────────────────┤
│  4. 查询 file_index                           │
│     WHERE drive_id = {driveId}                │
│       AND path LIKE '{dirPath}/%'             │
│       AND type = 'file'                       │
│       AND deleted = 0                         │
│     │                                         │
│     ├── 有数据 && MAX(indexed_at) 在 TTL 内     │
│     │      └── 直接返回缓存数据                   │
│     │                                         │
│     └── 无数据 || TTL 过期                      │
│            └── 5. 实时刷新                      │
├──────────────────────────────────────────────┤
│  5. 实时刷新 (按需拉取该目录)                    │
│     5.1 Driver.list(dirPath)                │
│     5.2 UPSERT 所有条目到 file_index           │
│     5.3 返回数据                               │
├──────────────────────────────────────────────┤
│  6. 组装 API 响应                              │
│     endpoint = resolveEndpoint(driveId,         │
│                 endpointId)  // 默认取优先级最高  │
│     driver = createDriver(                       │
│       merge(drive, endpoint.config_override))  // 用 endpoint 覆写后的配置│
│     for each file_index record:                  │
│       if type='file' → parseResult =             │
│           parseFileName(name)    // 现场解析      │
│       if type='file' → url =                     │
│           driver.getDownloadUrl(...) // 用endpoint│
│     return FileItem[]                            │
└──────────────────────────────────────────────┘
```

### 3.3 手动刷新 API

```
POST /v2/anime/file/refresh
Body: { id: laID, drive: driveId }

  1. 查找 anime 记录
  2. 查找 drive 记录（drive 内嵌完整连接配置）
  3. 根据 anime.index 构造该番剧的目录路径
  4. 创建 Driver 并调用 Driver.list()
  5. UPSERT 到 file_index
  6. 返回 { count: updatedEntries }
```

### 3.4 Admin 索引管理 API

管理员对 file_index 的查询和刷新操作，不依赖 anime 表。

**列出索引内容**：

```
GET /v2/admin/file-index/list?drive={driveId}&path={path}&type={file|dir}&deleted={0|1}&page={n}
  // 按指定路径列出目录内容
  // path 为空时列出 drive root
  // 返回分页结果：{ list: FileIndexRow[], total, page, pageSize }
```

**搜索索引**：

```
GET /v2/admin/file-index/search?drive={driveId}&q={keyword}
  // 按文件名搜索，返回匹配的分页结果
```

**刷新指定目录**：

```
POST /v2/admin/file-index/refresh-dir
Body: { driveId, path }
  // 调用 Driver.list(path)，UPSERT 到 file_index
  // 返回 { count: updatedEntries }
```

**刷新整个 drive**：

```
POST /v2/admin/file-index/refresh-drive
Body: { driveId }
  // 等同于对该 drive 执行扫盘任务（异步）
  // 返回 { message: "任务已启动" }
```

**获取索引统计**：

```
GET /v2/admin/file-index/stats?drive={driveId}
  // 返回 { totalFiles, totalDirs, deletedFiles, lastIndexedAt, ... }
```

---

## 四、文件索引的缓存语义

### 4.1 TTL 策略

| 场景 | 行为 |
|------|------|
| 索引不存在（首次访问） | 触发实时刷新，写入 file_index |
| indexed_at 距今 < 1h 且 deleted=0 | 直接返回缓存 |
| indexed_at 距今 > 1h 或 deleted=1 | 触发实时刷新，更新 file_index |
| 手动调用 refresh API | 无条件强制刷新，重置 indexed_at |
| 扫盘任务运行 | 全量重写，更新 indexed_at |

### 4.2 索引与真实文件系统的关系

```
                        ┌──────────────────┐
                        │  真实文件系统      │
                        │  (AList 等)      │
                        └────────┬─────────┘
                                 │
                 扫盘 / 按需刷新  │  手动刷新
                                 │
                        ┌────────▼─────────┐
                        │    file_index     │
                        │   (数据库缓存)    │
                        │  deleted=0 可见   │
                        │  deleted=1 保留    │
                        └────────┬─────────┘
                                 │
                          读取优先
                                 │
                        ┌────────▼─────────┐
                        │    API 响应       │
                        │  + parseResult    │
                        │  + downloadUrl    │
                        │  (现场拼装)        │
                        └──────────────────┘
```

**一致性保证**：

- `(drive_id, path)` 唯一键确保不会重复；软删除记录也占用此键，文件恢复时复用旧行
- 扫盘时：新条目 INSERT，已有条目 UPDATE，未覆盖条目 SET deleted = 1
- 用户侧：查询均过滤 `deleted = 0`，TTL 保证不会长期读取过期数据
- 管理侧：refresh API 提供强制同步能力

### 4.3 为什么不存 parse_result 和 downloadUrl

- **parse_result**：解析器 `anime-file-parser` 是纯 JS 函数，输入文件名字符串，CPU 开销可忽略。存储会产生一致性问题——修改解析逻辑后需全量重算，且需要管理解析结果的过期。
- **downloadUrl**：AList 的 sign 可能过期、host 可能变更。URL 应在请求时由 Driver 实时构造，确保有效。

---

## 五、API 变更

| 方法 | 路径 | 变更 |
|------|------|------|
| GET | `/v2/anime/file` | 新增 `endpoint` 参数；内部改为索引优先 + TTL 刷新 |
| POST | `/v2/anime/file/refresh` | **新增**，强制刷新某番剧的文件索引 |
| POST | `/v2/admin/drive/new` | body 保持原有 `{type, host, path, password, name, ...}` |
| POST | `/v2/admin/drive/update` | 同上 |
| GET | `/v2/admin/drive/all` | 响应增加 `type/host/path/password` 供编辑 |
| POST | `/v2/admin/drive/endpoint/new` | **新增**，为 drive 新增 endpoint |
| POST | `/v2/admin/drive/endpoint/update` | **新增**，更新 endpoint |
| POST | `/v2/admin/drive/endpoint/delete` | **新增**，删除 endpoint |
| GET | `/v2/admin/drive/endpoint/list` | **新增**，列出某 drive 所有 endpoint |
| GET | `/v2/drive/all` | 响应中每项增加 `endpoints` 列表 |
| GET | `/v2/admin/file-index/list` | **新增**，分页列出索引内容 |
| GET | `/v2/admin/file-index/search` | **新增**，按文件名搜索索引 |
| POST | `/v2/admin/file-index/refresh-dir` | **新增**，刷新指定目录的索引 |
| POST | `/v2/admin/file-index/refresh-drive` | **新增**，异步刷新整个 drive 的索引 |
| GET | `/v2/admin/file-index/stats` | **新增**，索引统计信息 |

---

## 六、目录结构与分层职责

```
apps/server/
├── common/
│   ├── filesystem/                    # 新增
│   │   ├── types.ts                   # FileSystemDriver 接口 + FileSystemEntry + ListOptions
│   │   ├── alist-driver.ts            # AlistDriver implements FileSystemDriver
│   │   ├── factory.ts                 # createDriver(config) → FileSystemDriver（接受完整连接配置）
│   │   └── index.ts                   # barrel export
│   ├── database/schema/
│   │   ├── drive.ts                    # 保持原有字段（type/host/path/password 不变）
│   │   ├── drive-endpoint.ts           # 新增：drive_endpoints 表（含 config_override JSON 字段）
│   │   └── file-index.ts               # 新增：file_index 表
│   └── api-clients/
│       └── alist.ts                   # 保留（AlistDriver 内部使用，不再对外暴露）
│
├── services/v2/
│   ├── admin/
│   │   ├── drive.ts                    # 无需改造（保持原有字段）
│   │   ├── drive-endpoint.ts           # 新增：endpoint CRUD
│   │   └── file-index-admin.ts         # 新增：admin 索引查询 + 按路径刷新
│   ├── anime/
│   │   ├── file.ts                     # 重写：使用 FileIndexService + Driver + endpoint 路由
│   │   └── file-index.ts               # 新增：索引 CRUD + TTL 检查 + refresh
│   ├── drive.ts                        # 修改：增加 endpoint 查询
│
├── controllers/v2/
│   ├── anime/file.ts                   # 修改：新增 refresh 入口，处理 endpoint 参数
│   ├── admin/drive.ts                  # 不变
│   ├── admin/drive-endpoint/*.ts       # 新增：endpoint CRUD
│   └── admin/file-index/*.ts           # 新增：索引管理（list/search/refresh-dir/stats）
│
├── schemas/v2/
│   ├── anime/file.ts                   # 修改：新增 endpoint 参数、refreshIdSchema
│   ├── admin/drive.ts                  # 不变（已有字段）
│   ├── admin/drive-endpoint.ts         # 新增：endpoint 校验（含 config_override）
│   └── admin/file-index.ts             # 新增：索引查询/刷新参数校验
│
├── routes/v2/
│   ├── anime.ts                       # 修改：新增 /file/refresh 路由
│   └── admin.ts                       # 修改：新增 drive-endpoint + file-index 路由组
│
├── tasks/v2/
│   ├── scan.ts                        # 重写（替代 updateAnimes.ts）
│   ├── main.ts                        # 修改：调用 scan 替代 updateAnimes
│   └── tools/alistGetter.ts           # 删除
│
└── tests/
    ├── unit/
    │   ├── alist-driver.test.ts        # 新增
    │   ├── file-index.test.ts          # 新增
    │   ├── file-service.test.ts        # 重写
    │   ├── drive.test.ts               # 不变
    │   └── drive-endpoint.test.ts      # 新增
    └── integration/
        └── remaining.test.ts           # 修改：适配新 API

packages/shared/src/
└── models.ts                           # 修改：新增 EndpointRecord 类型
```

---

## 七、数据迁移

### drives 表

无需改造——`type` / `host` / `path` / `password` 字段保持不变。

### drive_endpoints 表创建

```
CREATE TABLE drive_endpoints (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  drive_id          VARCHAR(100) NOT NULL,
  name              VARCHAR(100) NOT NULL,
  config_override   JSON NULL,
  priority          INT NOT NULL DEFAULT 0,
  enabled           TINYINT NOT NULL DEFAULT 1,

  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
);

-- 对每个已有 drive，创建一条默认 endpoint（无覆写）
INSERT INTO drive_endpoints (drive_id, name, config_override, priority)
SELECT id, name, NULL, 0 FROM drives;
```

### file_index 表创建

```
CREATE TABLE file_index (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  drive_id     VARCHAR(100) NOT NULL,
  anime_id     INT NULL,
  path         VARCHAR(1024) NOT NULL,
  name         VARCHAR(512) NOT NULL,
  size         BIGINT NOT NULL DEFAULT 0,
  type         ENUM('file', 'dir') NOT NULL,
  deleted      TINYINT NOT NULL DEFAULT 0,
  modified     TIMESTAMP NULL,
  sign         VARCHAR(512) NULL,
  indexed_at   TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE KEY uk_drive_path (drive_id, path),
  INDEX idx_anime_id (anime_id),
  INDEX idx_drive_type (drive_id, type),
  INDEX idx_deleted_indexed (deleted, indexed_at)
);
```

---

## 八、实施顺序

| 步骤 | 内容 | 影响范围 |
|------|------|----------|
| 1 | 新增 `drive_endpoints` + `file_index` 二张表 Drizzle schema | schema |
| 2 | 实现 FileSystemDriver 接口 + AlistDriver + Factory（接受完整连接配置） | common |
| 3 | 实现 FileIndexService（CRUD + TTL + deleted 过滤 + 按路径查询） | services |
| 4 | 新增 endpoint 管理（CRUD 服务 + Controller + Schema + 路由） | services + controllers |
| 5 | 实现 Admin 索引管理（list/search/refresh-dir/stats 服务 + Controller） | services + controllers |
| 6 | 重写扫盘任务（全量递归，仅维护 file_index 一致性，直接读取 drive 配置） | tasks |
| 7 | 重写文件服务（通过 anime.index 路径匹配查询 file_index + endpoint 路由 + merge 覆写配置 + 现场解析 + 现场构造 URL） | services |
| 8 | 更新 Controller + Route + 新增 refresh + admin index API | controllers + routes |
| 9 | 适配前端 Vue 管理界面（endpoint 列表管理） | web |
| 10 | 更新 shared 包类型 | packages/shared |
| 11 | 更新测试 + 删除废弃代码 | tests |

---

## 九、未来扩展方向

- **手动番剧关联**：管理员可选择某目录关联到 anime 条目，SET file_index.anime_id = ? WHERE path LIKE '{dirPath}/%'
- **异步索引预热**：关联番剧后，通过任务队列异步拉取其文件列表预热 file_index
- **文件变更检测**：`file_index` 增加 `checksum` 列，对比检测文件内容变更（非仅时间戳）
- **增量扫描**：记录 per-drive 的 `last_scan_cursor`，仅扫描变更部分，减少全量扫盘开销
