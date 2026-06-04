# Bangumi 数据重构文档

## 重构动机

### 旧架构问题

1. **JSON 黑洞**：`bangumi_data` 表用 3 个 `longtext` JSON 字段存储 subject/relations/characters 完整 API 响应，数据结构化程度为零，无法用 SQL 查询任何子字段。
2. **搜索受限**：全站搜索仅匹配 `anime.title` 列，完全忽略 Bangumi 日文名、中文名、别名（infobox 中），导致用户无法用常见译名搜索到番剧。
3. **剧集无元数据**：动画集数完全靠 `aniep` 从文件名正则解析，剧集标题、播出日期、SP/本篇类型等信息完全缺失，无法做剧集级交互。
4. **标签/评分不可查**：前端展示的评分和标签数据直接来自 JSON 反序列化，无法做"按评分筛选"或"按标签筛选"。
5. **杂糅渲染**：`parseAnime()` 将 Bangumi Subject 字段直接展开与 Anime 自有字段合并成 `AnimeDetail`，两层数据没有清晰边界，维护困难。
6. **角色数据不可独立查询**：角色和声优锁在 JSON 里，无法做"该声优配音了哪些番剧"等跨番剧查询。

### 目标

- 建立深度绑定 Bangumi 的结构化数据库表，字段对标其 API 响应
- 前端读取自己的表，不再直接接触原始 JSON
- 搜索覆盖别名/日文名/中文名
- 剧集元数据可用，剧集级交互可控
- 评分/标签可查询、可筛选
- 角色/声优数据独立可查询

## 表结构

### 1. `subjects` — 番剧主体（1:1）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增主键 |
| `bgmid` | INT UNIQUE | Bangumi Subject ID |
| `type` | TINYINT | Bangumi subject_type (2=动画) |
| `name` | VARCHAR(512) | 日文原名 |
| `name_cn` | VARCHAR(512) | 中文名 |
| `summary` | LONGTEXT | 简介 |
| `nsfw` | TINYINT | NSFW 标记 |
| `locked` | TINYINT | 锁定状态 |
| `platform` | VARCHAR(64) | 放送平台 (TV/Web/OVA/剧场版) |
| `air_date` | VARCHAR(32) | 首播日期 |
| `series` | TINYINT | 是否为系列 |
| `volumes` | INT | 卷数 |
| `eps` | INT | 已播出话数 |
| `total_episodes` | INT | 预计总话数 |
| `rating_score` | DECIMAL(3,1) | 综合评分 |
| `rating_rank` | INT | 评分排名 |
| `rating_total` | INT | 评分人数 |
| `collect_wish` | INT | 想看 |
| `collect_collect` | INT | 看过 |
| `collect_doing` | INT | 在看 |
| `collect_on_hold` | INT | 搁置 |
| `collect_dropped` | INT | 抛弃 |
| `image_large` | VARCHAR(1024) | 大图 |
| `image_common` | VARCHAR(1024) | 通用图 |
| `image_medium` | VARCHAR(1024) | 中图 |
| `image_small` | VARCHAR(1024) | 小图 |
| `image_grid` | VARCHAR(1024) | 网格图 |
| `updated_at` | TIMESTAMP | 更新时间 |

### 2. `subject_aliases` — 别名（1:N）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增 |
| `subject_id` | INT FK | → subjects.id |
| `alias` | VARCHAR(512) | 别名文本 |
| INDEX(alias) | | 搜索索引 |

数据来源：infobox「别名」「其他译名」「英文名」「日文名」「罗马字」+ name + name_cn

### 3. `subject_tags` — 标签（1:N）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增 |
| `subject_id` | INT FK | → subjects.id |
| `name` | VARCHAR(128) | 标签名 |
| `count` | INT | 标记次数 |
| UNIQUE(subject_id, name) | | 去重 |

### 4. `subject_meta_tags` — Meta 标签（1:N）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增 |
| `subject_id` | INT FK | → subjects.id |
| `tag` | VARCHAR(128) | 如 "原创"、"轻小说改编" |

### 5. `subject_rating_counts` — 评分分布（1:10）

| 列 | 类型 | 说明 |
|---|---|---|
| `subject_id` | INT FK | → subjects.id |
| `star` | TINYINT(1-10) | 星级 |
| `count` | INT | 投该星的人数 |
| PK(subject_id, star) | | 联合主键 |

### 6. `subject_episodes` — 剧集（1:N）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增 |
| `subject_id` | INT FK | → subjects.id |
| `bgm_ep_id` | INT UNIQUE | Bangumi Episode ID (sync 去重用) |
| `type` | TINYINT | 0=本篇 1=SP 2=OP 3=ED |
| `sort` | DECIMAL(5,1) | 序号 |
| `ep` | INT | 集数 |
| `name` | VARCHAR(512) | 标题(日) |
| `name_cn` | VARCHAR(512) | 标题(中) |
| `airdate` | VARCHAR(32) | 首播日 |
| `duration` | VARCHAR(32) | 时长 |
| `desc` | LONGTEXT | 简介 |
| `status` | VARCHAR(32) | Air / NA |

### 7. `subject_infobox` — Infobox 归一化（1:N）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增 |
| `subject_id` | INT FK | → subjects.id |
| `key` | VARCHAR(128) | 分组标题 "话数"/"制作人员"/"别名" |
| `sub_key` | VARCHAR(255) | 子键，简单值时为 NULL |
| `value` | TEXT | 值 |
| `sort_order` | INT | 组内排序 |

### 8. `persons` — 人物（声优/演员）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | Bangumi Person ID |
| `name` | VARCHAR(255) | 姓名 |
| `type` | TINYINT | 1=个人 2=公司 3=组合 |
| `short_summary` | LONGTEXT | 简介 |
| `locked` | TINYINT | 锁定状态 |
| `image_large/medium/small/grid` | VARCHAR(1024) | 头像图 |
| `updated_at` | TIMESTAMP | 更新时间 |

### 9. `person_careers` — 人物职业（1:N）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增 |
| `person_id` | INT FK | → persons.id |
| `career` | VARCHAR(128) | "声优"/"制作人员" 等 |

### 10. `characters` — 角色

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | Bangumi Character ID |
| `name` | VARCHAR(255) | 角色名 |
| `name_cn` | VARCHAR(255) | 中文名 |
| `type` | TINYINT | 1=角色 2=机体 3=舰船 4=组织 |
| `summary` | LONGTEXT | 角色简介 |
| `image_large/medium/small/grid` | VARCHAR(1024) | 角色图 |
| `updated_at` | TIMESTAMP | 更新时间 |

### 11. `subject_characters` — 番剧 × 角色（M:N）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增 |
| `subject_id` | INT FK | → subjects.id |
| `character_id` | INT FK | → characters.id |
| `relation` | VARCHAR(128) | "主角"/"配角"/"客串" |
| UNIQUE(subject_id, character_id) | | 去重 |

### 12. `character_persons` — 角色 × 声优（M:N）

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增 |
| `character_id` | INT FK | → characters.id |
| `person_id` | INT FK | → persons.id |
| UNIQUE(character_id, person_id) | | 去重 |

## 同步策略

```
refreshBangumiCache(bgmID)
  ├─ 拉取 Bangumi API → bangumi_data (JSON 备份)
  ├─ syncSubject(bgmID) → subjects + aliases + tags + meta_tags + rating_counts + infobox
  ├─ syncCharacters(bgmID) → persons + careers + characters + subject_characters + character_persons
  └─ syncEpisodes(bgmID) → subject_episodes
```

- **subject 相关表**：每次 refresh 全量覆盖（DELETE + INSERT），简单可靠
- **persons/characters**：upsert by Bangumi ID，跨番剧共享
- **episodes**：upsert by bgm_ep_id，支持剧集数据变更
- **定时调度**：继承现有 6 小时一次 refresh 机制

## 兼容性

- `bangumi_data` 表保留不动，继续存储原始 JSON，作为保底备份
- `parseAnime()` 优先读取新结构化表；无数据时 fallback 到旧 JSON 逻辑
- `anime` 表完全不动，`bgmid` 继续作为关联键
- API 返回格式（`AnimeDetail`）向前兼容，前端渐进式接入新字段

## 搜索扩展

搜索同时匹配：
- `anime.title`（原有）
- `subjects.name`（日文名）
- `subjects.name_cn`（中文名）
- `subject_aliases.alias`（别名/其他译名）
