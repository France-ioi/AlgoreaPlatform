ALTER TABLE `groups_attempts` ADD `sBestAnswerDate` DATETIME NULL AFTER `sThreadStartDate`;
ALTER TABLE `history_groups_attempts` ADD `sBestAnswerDate` DATETIME NULL AFTER `sThreadStartDate`;

ALTER TABLE `users_items` ADD `sBestAnswerDate` DATETIME NULL AFTER `sThreadStartDate`;
ALTER TABLE `history_users_items` ADD `sBestAnswerDate` DATETIME NULL AFTER `sThreadStartDate`;
