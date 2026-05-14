-- 测试番剧
INSERT INTO `anime` (`id`, `year`, `type`, `name`, `views`, `bgmid`, `nsfw`, `title`, `deleted`, `poster`)
VALUES
  (1, '2026年', '1月冬', '测试番剧A 123456', 100, 123456, 0, '测试番剧A', 0, 'https://example.com/poster_a.jpg'),
  (2, '2026年', '1月冬', '测试番剧B 234567', 50, 234567, 0, '测试番剧B', 0, 'https://example.com/poster_b.jpg'),
  (3, '2025年', '10月秋', '测试番剧C 345678', 200, 345678, 0, '测试番剧C', 0, 'https://example.com/poster_c.jpg'),
  (4, '2026年', '1月冬', '已删除番剧D 456789', 0, 456789, 0, '已删除番剧D', 1, NULL);

-- 测试邀请码（不过期）
INSERT INTO `invite_code` (`code`, `code_creator`, `expiration_time`)
VALUES ('TESTCODE001', 1, NULL),
       ('TESTCODE002', 1, '2099-12-31 23:59:59');

-- 测试已使用的邀请码
INSERT INTO `invite_code` (`code`, `code_creator`, `code_user`, `use_time`, `expiration_time`)
VALUES ('USEDCODE001', 1, 999, NOW(), NULL);

-- 测试 Bangumi 数据
INSERT INTO `bangumi_data` (`bgmid`, `subjects`, `update_time`)
VALUES (123456, '{"title":"测试番剧A","name_cn":"测试番剧A"}', NOW());

INSERT INTO `bangumi_data` (`bgmid`, `relations_anime`, `subjects`, `characters`, `update_time`)
VALUES (234567, '[]', '{"title":"Test Anime B","name_cn":"测试番剧B"}', '[]', NOW());

-- 测试站点设置
INSERT INTO `settings` (`key`, `value`)
VALUES ('site_name', '"LavaAnime Test"');
