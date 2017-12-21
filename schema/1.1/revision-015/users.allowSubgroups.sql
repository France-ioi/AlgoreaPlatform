ALTER TABLE `users`
ADD `allowSubgroups` tinyint NULL COMMENT 'Allow to create subgroups';

ALTER TABLE `history_users`
ADD `allowSubgroups` tinyint NULL COMMENT 'Allow to create subgroups';