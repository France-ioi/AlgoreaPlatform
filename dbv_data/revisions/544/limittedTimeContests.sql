ALTER TABLE `users_items` ADD `sContestStartDate` DATETIME NULL DEFAULT NULL AFTER `sLastHintDate`;
ALTER TABLE `history_users_items` ADD `sContestStartDate` DATETIME NULL DEFAULT NULL AFTER `sLastHintDate`;
ALTER TABLE `users_items` ADD `sAdditionalTime` DATETIME NULL DEFAULT NULL AFTER `sLastHintDate`;
ALTER TABLE `history_users_items` ADD `sAdditionalTime` DATETIME NULL DEFAULT NULL AFTER `sLastHintDate`;