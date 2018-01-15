ALTER TABLE `users`
ADD `creatorID` bigint NULL COMMENT 'which user created a given login with the login generation tool' AFTER `loginModulePrefix`;

ALTER TABLE `history_users`
ADD `creatorID` bigint NULL COMMENT 'which user created a given login with the login generation tool' AFTER `loginModulePrefix`;

