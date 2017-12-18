ALTER TABLE `users`
ADD `loginModulePrefix` varchar(100) NULL COMMENT 'Set to enable login module accounts manager';

ALTER TABLE `history_users`
ADD `loginModulePrefix` varchar(100) NULL;