ALTER TABLE `users_items`
ADD `bPlatformDataRemoved` tinyint NOT NULL DEFAULT '0';

ALTER TABLE `history_users_items`
ADD `bPlatformDataRemoved` tinyint NOT NULL DEFAULT '0';