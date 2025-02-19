ALTER TABLE `items` ADD `bSoloTeams` TINYINT(1) NOT NULL DEFAULT '0' AFTER `bHasAttempts`;
ALTER TABLE `history_items` ADD `bSoloTeams` TINYINT(1) NOT NULL DEFAULT '0' AFTER `bHasAttempts`;