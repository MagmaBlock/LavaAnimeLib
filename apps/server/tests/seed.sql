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

-- 测试存储节点（内联连接配置）
REPLACE INTO `drives`
  (`id`, `name`, `description`, `type`, `config`, `banNSFW`, `enabled`, `isDefault`, `sortOrder`)
VALUES
  ('1A', '测试存储节点', '测试用存储节点', 'alist', '{"host": "https://alist.example.com", "path": "/test/LavaAnimeLib", "password": ""}', 0, 1, 1, 0),
  ('2B', '禁用测试节点', '不应出现在公开列表', 'alist', '{"host": "https://alist.example.com", "path": "/test", "password": ""}', 0, 0, 0, 1);

-- 测试端点
REPLACE INTO `drive_endpoints` (`id`, `drive_id`, `name`, `config_override`, `priority`, `enabled`, `banNSFW`, `disableDownload`)
VALUES (1, '1A', '默认端点', NULL, 0, 1, 0, 0);

-- 测试已使用的邀请码
REPLACE INTO `invite_code` (`code`, `code_creator`, `code_user`, `use_time`, `expiration_time`)
VALUES ('USEDCODE001', 1, 999, NOW(), NULL);

-- 含标签的测试番剧（用于 parser 测试 [BDRip]/[NSFW] 过滤）
REPLACE INTO `anime` (`id`, `year`, `type`, `name`, `views`, `bgmid`, `nsfw`, `title`, `deleted`, `poster`)
VALUES
  (5, '2026年', '1月冬', '测试番剧E BDRip', 300, 123456, 0, '测试番剧E [BDRip]', 0, 'https://example.com/poster_e.jpg'),
  (6, '2026年', '1月冬', '测试番剧F NSFW', 80, 234567, 0, '测试番剧F [NSFW]', 0, 'https://example.com/poster_f.jpg'),
  (7, '2026年', '1月冬', '测试番剧G Both', 150, 345678, 1, '测试番剧G [BDRip][NSFW]', 0, 'https://example.com/poster_g.jpg'),
  (8, '2025年', '7月夏', '测试番剧H NoBgm', 60, NULL, 0, '测试番剧H', 0, 'https://example.com/poster_h.jpg');

-- 测试站点设置
REPLACE INTO `settings` (`key`, `value`)
VALUES ('site_name', '"LavaAnime Test"');

-- 结构化番剧数据（新表）
REPLACE INTO `bangumi_subjects` (`id`, `bgmid`, `type`, `name`, `name_cn`, `summary`, `nsfw`, `platform`, `date`, `eps`, `total_episodes`, `rating_score`, `rating_total`, `image_large`, `image_common`, `image_medium`, `image_small`, `image_grid`, `collect_wish`, `collect_collect`)
VALUES
  (1, 123456, 2, 'テストA', '测试番剧A', '测试番剧A简介', 0, 'TV', '2024-01', 12, 12, '8.5', 1000, 'https://example.com/large.jpg', 'https://example.com/common.jpg', 'https://example.com/medium.jpg', 'https://example.com/small.jpg', 'https://example.com/grid.jpg', 200, 500),
  (2, 234567, 2, 'Test Anime B', '测试番剧B', 'Test Anime B Summary', 0, 'TV', '2024-04', 24, 24, '7.8', 500, 'https://example.com/large_b.jpg', 'https://example.com/common_b.jpg', 'https://example.com/medium_b.jpg', 'https://example.com/small_b.jpg', 'https://example.com/grid_b.jpg', 100, 300),
  (3, 345678, 2, 'Test Anime C', '测试番剧C', 'Test Anime C Summary', 0, 'WEB', '2024-07', 13, 13, '9.0', 2000, 'https://example.com/large_c.jpg', 'https://example.com/common_c.jpg', 'https://example.com/medium_c.jpg', 'https://example.com/small_c.jpg', 'https://example.com/grid_c.jpg', 500, 1000);

-- 测试上报消息（用于 recent-update 测试）
REPLACE INTO `upload_message` (`id`, `index`, `animeID`, `bangumiID`, `fileName`, `uploadTime`, `messageSentStatus`, `messageSkiped`)
VALUES
  (1, '2026年/1月冬/测试番剧A 123456', 1, 123456, 'ep01.mp4', NOW(), 0, false),
  (2, '2026年/1月冬/测试番剧B 234567', 2, 234567, '[组] 测试番剧B - 01.mkv', NOW(), 1, false);

REPLACE INTO `bangumi_subject_aliases` (`id`, `subject_id`, `alias`) VALUES
  (1, 1, 'テストA'),
  (2, 1, '测试番剧A'),
  (3, 1, 'Test A'),
  (4, 2, 'Test Anime B'),
  (5, 2, '测试番剧B'),
  (6, 3, 'Test Anime C'),
  (7, 3, '测试番剧C');

REPLACE INTO `bangumi_subject_tags` (`id`, `subject_id`, `name`, `count`) VALUES
  (1, 1, '科幻', 50),
  (2, 1, '冒险', 30),
  (3, 2, '恋爱', 40),
  (4, 2, '喜剧', 25),
  (5, 3, '机甲', 60);

REPLACE INTO `bangumi_subject_meta_tags` (`id`, `subject_id`, `tag`) VALUES
  (1, 1, '原创'),
  (2, 2, '轻小说改编'),
  (3, 3, '漫画改编');

REPLACE INTO `bangumi_subject_rating_counts` (`subject_id`, `star`, `count`) VALUES
  (1, 1, 10), (1, 2, 5), (1, 3, 15), (1, 4, 30), (1, 5, 50), (1, 6, 100), (1, 7, 200), (1, 8, 300), (1, 9, 200), (1, 10, 90),
  (2, 1, 5), (2, 2, 10), (2, 3, 20), (2, 4, 40), (2, 5, 60), (2, 6, 100), (2, 7, 120), (2, 8, 80), (2, 9, 40), (2, 10, 25);

REPLACE INTO `bangumi_subject_infobox` (`id`, `subject_id`, `key`, `sub_key`, `value`, `sort_order`) VALUES
  (1, 1, '中文名', NULL, '测试番剧A', 0),
  (2, 1, '话数', NULL, '12', 0),
  (3, 1, '放送开始', NULL, '2024年1月', 0),
  (4, 1, '官方网站', NULL, 'https://example.com', 0),
  (5, 2, '中文名', NULL, '测试番剧B', 0),
  (6, 2, '话数', NULL, '24', 0);
