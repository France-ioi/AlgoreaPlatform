-- This table is now automatically created by the migration tool, but is left
-- here as convenience
CREATE TABLE IF NOT EXISTS `schema_revision` (
  `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `executed_at` timestamp NOT NULL,
  `file` varchar(255) NOT NULL
) ENGINE='InnoDB' DEFAULT CHARSET=utf8;
