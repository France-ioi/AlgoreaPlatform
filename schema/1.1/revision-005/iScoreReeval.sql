ALTER TABLE `users_items` ADD `iScoreReeval` FLOAT NULL DEFAULT '0' AFTER `iScoreComputed`;
ALTER TABLE `history_users_items` ADD `iScoreReeval` FLOAT NULL DEFAULT '0' AFTER `iScoreComputed`;

ALTER TABLE `users_answers` ADD INDEX(`idItem`);
