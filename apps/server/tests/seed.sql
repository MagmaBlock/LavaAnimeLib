-- 测试番剧
REPLACE INTO `anime` (`id`, `year`, `type`, `name`, `views`, `bgmid`, `nsfw`, `title`, `deleted`, `poster`)
VALUES
  (1, '2026年', '1月冬', '测试番剧A 123456', 100, 123456, 0, '测试番剧A', 0, 'https://example.com/poster_a.jpg'),
  (2, '2026年', '1月冬', '测试番剧B 234567', 50, 234567, 0, '测试番剧B', 0, 'https://example.com/poster_b.jpg'),
  (3, '2025年', '10月秋', '测试番剧C 345678', 200, 345678, 0, '测试番剧C', 0, 'https://example.com/poster_c.jpg'),
  (4, '2026年', '1月冬', '已删除番剧D 456789', 0, 456789, 0, '已删除番剧D', 1, NULL);

-- 测试邀请码（不过期）
REPLACE INTO `invite_code` (`code`, `code_creator`, `expiration_time`)
VALUES ('TESTCODE001', 1, NULL),
       ('TESTCODE002', 1, '2027-12-31 23:59:59');

-- 测试存储节点
REPLACE INTO `drives`
  (`id`, `name`, `description`, `type`, `host`, `path`, `password`, `banNSFW`, `disableDownload`, `enabled`, `isDefault`, `sortOrder`)
VALUES
  ('1A', '测试存储节点', '测试用存储节点', 'alist', 'https://alist.example.com', '/test/LavaAnimeLib', '', 0, 0, 1, 1, 0),
  ('2B', '禁用测试节点', '不应出现在公开列表', 'alist', 'https://disabled.example.com', '/disabled', '', 0, 1, 0, 0, 1);

-- 测试已使用的邀请码
REPLACE INTO `invite_code` (`code`, `code_creator`, `code_user`, `use_time`, `expiration_time`)
VALUES ('USEDCODE001', 1, 999, NOW(), NULL);

-- 测试 Bangumi 数据（subjects 需包含 images 字段，与 Bangumi API 响应格式一致）
REPLACE INTO `bangumi_data` (`bgmid`, `relations_anime`, `subjects`, `characters`, `update_time`)
VALUES (123456, '[]', '{"title":"测试番剧A","name_cn":"测试番剧A","images":{"large":"https://example.com/large.jpg","common":"https://example.com/common.jpg","medium":"https://example.com/medium.jpg","small":"https://example.com/small.jpg","grid":"https://example.com/grid.jpg"}}', '[]', NOW());

REPLACE INTO `bangumi_data` (`bgmid`, `relations_anime`, `subjects`, `characters`, `update_time`)
VALUES (234567, '[]', '{"title":"Test Anime B","name_cn":"测试番剧B","images":{"large":"https://example.com/large_b.jpg","common":"https://example.com/common_b.jpg","medium":"https://example.com/medium_b.jpg","small":"https://example.com/small_b.jpg","grid":"https://example.com/grid_b.jpg"}}', '[]', NOW());

REPLACE INTO `bangumi_data` (`bgmid`, `relations_anime`, `subjects`, `characters`, `update_time`)
VALUES (345678, '[]', '{"title":"Test Anime C","name_cn":"测试番剧C","images":{"large":"https://example.com/large_c.jpg","common":"https://example.com/common_c.jpg","medium":"https://example.com/medium_c.jpg","small":"https://example.com/small_c.jpg","grid":"https://example.com/grid_c.jpg"}}', '[]', NOW());

-- 含标签的测试番剧（用于 parser 测试 [BDRip]/[NSFW] 过滤）
REPLACE INTO `anime` (`id`, `year`, `type`, `name`, `views`, `bgmid`, `nsfw`, `title`, `deleted`, `poster`)
VALUES
  (5, '2026年', '1月冬', '测试番剧E BDRip', 300, 123456, 0, '测试番剧E [BDRip]', 0, 'https://example.com/poster_e.jpg'),
  (6, '2026年', '1月冬', '测试番剧F NSFW', 80, 234567, 0, '测试番剧F [NSFW]', 0, 'https://example.com/poster_f.jpg'),
  (7, '2026年', '1月冬', '测试番剧G Both', 150, 345678, 1, '测试番剧G [BDRip][NSFW]', 0, 'https://example.com/poster_g.jpg'),
  (8, '2025年', '7月夏', '测试番剧H NoBgm', 60, NULL, 0, '测试番剧H', 0, 'https://example.com/poster_h.jpg');

-- 测试上报消息（用于 recent-update 测试）
REPLACE INTO `upload_message` (`id`, `index`, `animeID`, `bangumiID`, `fileName`, `uploadTime`, `messageSentStatus`, `messageSkiped`)
VALUES
  (1, '2026年/1月冬/测试番剧A 123456', 1, 123456, 'ep01.mp4', NOW(), 0, false),
  (2, '2026年/1月冬/测试番剧B 234567', 2, 234567, '[组] 测试番剧B - 01.mkv', NOW(), 1, false);

-- 测试站点设置
REPLACE INTO `settings` (`key`, `value`)
VALUES ('site_name', '"LavaAnime Test"');
