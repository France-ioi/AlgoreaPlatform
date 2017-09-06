CREATE TABLE `error_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `date` timestamp NOT NULL,
  `url` text NOT NULL,
  `browser` text NOT NULL,
  `details` text NOT NULL
) ENGINE='InnoDB' COLLATE 'utf8_unicode_ci';