# 聚合文件列表与延迟 URL 解析设计文档

## 一、背景与动机

### 原有问题

文件系统重构（见 `file-system-design.md`）完成之后，系统已支持多 Drive 架构，但用户获取文件列表仍需手动选择一个存储节点：

```
GET /v2/anime/file?id={laID}&drive={driveId}
```

这带来两个体验问题：

1. **用户需要做选择**：一个番剧可能分布在多个存储节点上，用户必须先知道哪个节点包含该番剧，手动切换尝试后才能找到文件。

2. **URL 构造耦合在列表查询中**：原有 `GET /v2/anime/file` 在返回文件列表的同时，为每个文件预先构造下载 URL。URL 的构造需要确定 endpoint（`host` 可能被 `config_override` 覆写），即 URL 与"线路选择"强绑定。一旦 URL 生成后用户想切换线路，必须重新请求整个文件列表。

### 重构目标

1. **聚合视图**：用户无需选择存储节点，系统自动聚合所有启用的 Drive，去重后呈现统一的文件列表
2. **URL 延迟解析**：文件列表与下载 URL 解耦，播放时按需调用独立接口解析 URL，线路切换成本降至 O(1)
3. **偏好驱动 + 实际驱动分离**：用户选择"偏好"节点（preferredDrive），系统在可用的驱动列表中尽力匹配；播放时记录实际使用的驱动（actualDrive），支持降级回退的透明展示

---

## 二、核心概念

### 2.1 聚合文件列表（Aggregated File List）

不再要求用户指定 `drive` 参数。系统遍历所有启用的存储节点，从 `file_index` 读取各自的文件列表，按相对路径去重合并。

```
去重键：相对于番剧目录的相对路径
合并策略：
  - 同名文件 → 合并 drives[] 数组，size 取最大值
  - 不同文件 → 各自保留
  - 一个驱动失败 → 不影响其他驱动的结果（Promise.allSettled）
```

### 2.2 延迟 URL 解析（Deferred URL Resolution）

文件列表中不再包含 `url` 字段。播放时，前端调用独立接口获取下载链接：

```
GET /v2/anime/file/url?drive={driveId}&path={filePath}[&endpoint={endpointId}]
```

响应仅包含一个 URL 字符串，线路切换只需重新调用此接口。

### 2.3 preferredDrive / actualDrive 分离

| 概念 | 定义 | 来源 |
|------|------|------|
| `preferredDrive` | 用户选择的偏好节点 | 用户手动选择或记住我的选择 |
| `preferredEndpoint` | 偏好节点下的偏好线路 | 同 drive 选择逻辑 |
| `actualDrive` | 当前播放文件实际使用的节点 | `resolveFileUrl` 解析后的回写 |
| `actualEndpoint` | 当前播放文件实际使用的线路 | 同上 |
| `isFallback` | 是否为降级状态 | `actualDriveId !== preferredDriveId` |

当偏好节点下无目标文件时，系统自动 fallback 到包含该文件的第一个节点，UI 通过 `isFallback` 检测并在界面上告知用户当前播放来源。

---

## 三、API 设计

### 3.1 聚合文件列表

```
GET /v2/anime/file?id={laID}
```

请求参数：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | 是 | 番剧 laID |

响应格式（成功 200）：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "name": "[Sakurato] Dungeon Meshi - 01 [HEVC-10bit].mkv",
      "size": 524288000,
      "type": "file",
      "modified": "2024-01-15T12:00:00.000Z",
      "drives": [
        { "driveId": "hk-od1", "driveName": "东京一号", "path": "/2024年/1月冬/迷宫饭/ep01.mkv" },
        { "driveId": "tky-od1", "driveName": "东京二号", "path": "/2024年/1月冬/迷宫饭/ep01.mkv" }
      ],
      "parseResult": { /* anime-file-parser 解析结果 */ }
    }
  ]
}
```

对比原有 `drive` 模式（仍保留兼容，指定 `drive` 时走原有单驱动路径）：

```
GET /v2/anime/file?id={laID}&drive={driveId}[&endpoint={endpointId}]
```

### 3.2 文件下载 URL

```
GET /v2/anime/file/url?drive={driveId}&path={filePath}[&endpoint={endpointId}]
```

请求参数：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `drive` | string | 是 | 存储节点 ID |
| `path` | string | 是 | 文件在存储节点上的完整路径（来自 `FileDriveSource.path`） |
| `endpoint` | number | 否 | 线路 ID，不传则取该 drive 下 priority 最高的 enabled endpoint |

响应格式（成功 200）：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "url": "https://pub-hk.example.com/d/data/2024年/1月冬/迷宫饭/ep01.mkv"
  }
}
```

URL 构造使用 `endpoint` 覆写后的 `host` 作为基础域名，文件路径拼接在 AList 的 `/d/` 路由下。

---

## 四、后端架构

### 4.1 文件分层

```
apps/server/
├── schemas/v2/anime/
│   ├── file.ts              # drive 已改为 optional，支持无 drive 聚合模式
│   └── file-url.ts           # 新增：drive/path/endpoint 校验
│
├── services/v2/anime/
│   ├── file-aggregate.ts     # 新增：聚合文件列表服务
│   ├── file-url.ts            # 新增：下载 URL 解析服务
│   ├── file.ts                # 保持不变：单驱动文件列表
│   └── file-index.ts          # 保持不变：索引 CRUD
│
├── controllers/v2/anime/
│   ├── file.ts                # 修改：!drive 时走聚合分支
│   └── file-url.ts            # 新增：下载 URL 请求处理
│
├── routes/v2/anime.ts        # 修改：新增 /file/url 路由
│
└── packages/shared/src/
    └── models.ts              # 修改：新增 FileDriveSource + AggregatedFileItem 类型
```

### 4.2 getAggregatedFiles 流程

```
getAggregatedFiles(laID)
    │
    ├── 1. 验证番剧存在且未被删除
    │
    ├── 2. 从 anime.index 构造目录路径
    │     dirPath = /{year}/{type}/{name}
    │
    ├── 3. 查询所有启用的 Drive（enabled = 1，按 sortOrder 排序）
    │
    └── 4. 并行处理每个 Drive（Promise.allSettled）
          │
          for each drive:
          │
          ├── 4.1 检查 file_index 缓存是否有效（isCacheValid）
          │      └── 无效 → 实时刷新（Driver.list → upsert → softDeleteStale）
          │             └── 刷新失败 → 记录 warning，不中断整体流程
          │
          ├── 4.2 查询该 Drive 下的所有活跃索引条目（findActiveByDrive）
          │
          └── 4.3 映射为 { name, size, type, modified, driveId, driveName, path }
    │
    └── 5. 去重合并
          │
          dedupMap: Map<relativePath, AggregatedFileResult>
          │
          for each drive result:
            for each file:
              relPath = extractRelativePath(file.path, dirPath)
              │
              ├── 已存在 → existing.drives.push(...), size = max(existing, current)
              └── 不存在 → 新建条目
                    │
                    ├── type="file" → 运行 parseFileName(name) 获取 parseResult
                    └── type="dir"  → 无 parseResult
    │
    └── 6. 返回去重后的文件列表
```

### 4.3 getFileDownloadUrl 流程

```
getFileDownloadUrl(driveId, filePath, endpointId?)
    │
    ├── 1. 查找 Drive 记录（getDrive）
    │     └── 不存在 → "存储节点不存在"
    │
    ├── 2. 解析 Endpoint（resolveEndpoint）
    │     ├── 指定 endpointId → 精确查找，需匹配 drive_id 且 enabled
    │     └── 未指定 → 取该 drive 下 priority 最小的 enabled endpoint
    │     └── 无可用 → "没有可用的对外节点"
    │
    ├── 3. 计算生效配置
    │     effectiveConfig = endpoint.configOverride
    │       ? { ...drive.config, ...endpoint.configOverride }
    │       : drive.config
    │
    ├── 4. 创建 Driver（使用覆盖后的配置）
    │
    └── 5. driver.getDownloadUrl(entry, effectiveConfig.host)
          └── URL 构造在 AlistDriver 内完成（拼接 /d/ 路由 + 可选签名）
```

### 4.4 关键设计决策

| 决策 | 理由 |
|------|------|
| `Promise.allSettled` 而非 `Promise.all` | 某个 Drive 故障不影响其他 Drive 的结果 |
| 缓存 TTL 未命中时**不阻塞**结果 | 刷新失败只记录 warning，仍返回 findActiveByDrive 的当前数据（即使可能过期） |
| URL 接口同步返回 | `getDownloadUrl` 是纯 URL 构造，不涉及网络调用 |
| `parseResult` 在聚合时现场计算 | 不存储在 file_index 中，避免解析器升级后全量重算 |

---

## 五、前端架构

### 5.1 Store 状态变更

```
fileData 新增字段：
  actualDriveId: string | null      // 当前文件实际使用的驱动
  actualEndpointId: number | null   // 当前文件实际使用的线路

每个 file 条目新增字段：
  url: string | undefined          // 播放时按需解析，初始为 undefined
  drives: FileDriveSource[]        // 该文件可用的存储节点列表
```

### 5.2 Getter 变更

| 原名称 | 新名称 | 说明 |
|--------|--------|------|
| `activeDrive` | `preferredDrive` | 语义不变，更准确表达"用户偏好" |
| `activeEndpoint` | `preferredEndpoint` | 同上 |
| *(新增)* | `actualDrive` | 当前播放文件实际使用的驱动 |
| *(新增)* | `actualEndpoint` | 当前播放文件实际使用的线路 |
| *(新增)* | `isFallback` | `actualDriveId !== preferredDriveId` |

### 5.3 resolveFileUrl 流程

```
resolveFileUrl(fileIndex, force?)
    │
    ├── 1. 获取 fileList[fileIndex] 的 drives 列表
    │
    ├── 2. 选择目标 Drive
    │     targetDrive = drives 中匹配 preferredDrive.id 的条目
    │                  || drives[0] (fallback)
    │
    ├── 3. 确定 Endpoint
    │     endpointId = preferredEndpointId
    │               || localStorage 记住的选择
    │               || drive 下首个 endpoint.id
    │
    ├── 4. 调用 GET /v2/anime/file/url
    │     params: { drive, path, endpoint? }
    │
    ├── 5. 缓存结果
    │     file.url = resolvedUrl
    │     fileData.actualDriveId = targetDrive.driveId
    │     fileData.actualEndpointId = endpointId
    │
    └── 6. 返回 resolvedUrl
```

### 5.4 触发时机

| 场景 | 触发点 |
|------|--------|
| 页面初始加载 | `loadAnime(laID)` → `getAggregatedFileData`（获取无 URL 的文件列表） |
| 自动播放首个视频 | `firstThisAnime()` → `resolveFileUrl(0)` |
| 切换集数 | `changeEpisode()` → `findResult()` → `resolveFileUrl(bestIndex)` |
| 点击文件 | `videoButtonClick()` / `musicButtonClick()` → `resolveFileUrl(index)` |
| 切换线路 | `setPreferredEndpoint()` → `reResolveIfActiveFileOnDrive()` → `resolveFileUrl(index, true)` |

### 5.5 UI 变更

**DriveSelector** 组件从单层驱动列表重构为两部分：

```
┌─────────────────────────────┐
│  播放来源             3可用  │
├─────────────────────────────┤
│  东京一号 (展开)            │ ← 偏好驱动高亮
│  电信线路 ○   直连 ○ 转发   │
│  东京二号                    │
│  本机转发                    │
├─────────────────────────────┤
│  ↳ 当前由 东京二号 · 本机转发 │ ← isFallback 时显示
│  提供                       │
├─────────────────────────────┤
│  □ 记住我的选择              │
└─────────────────────────────┘
```

收起状态显示当前 `preferredDrive` 的名称和线路；出现降级时额外显示实际来源。

---

## 六、典型用户流程

### 6.1 首次访问番剧（正常流程）

```
用户打开番剧详情页
  │
  ├── 前端：GET /v2/anime/file?id=123
  │     └── 后端：聚合所有 Drive 的文件索引
  │           └── 返回去重后的文件列表（无 URL）
  │
  ├── 前端：识别集数列表，选择第一集
  │     └── resolveFileUrl(firstIndex)
  │           │
  │           ├── 在 preferredDrive 下找到该文件
  │           │   targetDrive = preferredDrive
  │           │
  │           ├── GET /v2/anime/file/url?drive=hk-od1&path=/...&endpoint=1
  │           │     └── 返回 URL
  │           │
  │           └── actualDriveId = "hk-od1", 开始播放
  │
  └── 用户看到正常播放界面，DriveSelector 显示偏好驱动
```

### 6.2 偏好驱动无该文件（降级回退）

```
用户在偏好驱动 A 下，选集后点击一个仅在驱动 B 中存在的文件
  │
  ├── resolveFileUrl(fileIndex)
  │     ├── drives = [{ driveId: "B", path: "..." }]  // 仅在 B 中有
  │     ├── 查找 drives 中匹配 preferredDrive 的条目 → 无
  │     └── targetDrive = drives[0] = "B"  // fallback
  │
  ├── GET /v2/anime/file/url?drive=B&path=/...
  │     └── actualDriveId = "B", actualEndpointId = 2
  │
  └── isFallback = true
        └── UI 显示 "↳ 当前文件由 驱动B · 线路2 提供"
```

### 6.3 切换线路（无重新拉取文件列表）

```
用户从 驱动A-电信 切换到 驱动A-直连
  │
  ├── setPreferredEndpoint(newEndpointId)
  │     └── reResolveIfActiveFileOnDrive("A")
  │           ├── activeFile.drives 中有 "A" ✓
  │           └── resolveFileUrl(activeIndex, force=true)
  │                 └── GET /v2/anime/file/url?drive=A&path=/...&endpoint=newId
  │                       └── 返回新 URL，播放器切换源
```

---

## 七、API 变更汇总

| 方法 | 路径 | 变更 |
|------|------|------|
| GET | `/v2/anime/file` | `drive` 参数改为 optional；不传时走聚合模式，传时走原有单驱动路径 |
| GET | `/v2/anime/file/url` | **新增**，按 drive + path 解析下载 URL |
| — | `packages/shared` | 新增 `FileDriveSource`、`AggregatedFileItem` 类型 |

---

## 八、与 file-system-design 的关系

本文档是 `file-system-design.md` 的**上层扩展**，两者并行工作：

| 概念 | 定义位置 | 说明 |
|------|----------|------|
| Driver 抽象 | file-system-design | AlistDriver implements FileSystemDriver |
| file_index 表 | file-system-design | 全文件系统数据库快照 |
| Drive / Endpoint 分离 | file-system-design | 扫盘与对外两条线 |
| 聚合查询 | **本文档** | 跨 Drive 查询 file_index 并去重 |
| 延迟 URL 解析 | **本文档** | URL 构造从列表查询解耦 |
| preferredDrive/actualDrive | **本文档** | 前端偏好-实际驱动分离 |

聚合模式依赖 file_index 表提供的缓存数据，底层仍使用 Driver 抽象进行按需刷新。延迟 URL 解析依赖 Endpoint 的 `config_override` 机制构造正确的对外链接。
