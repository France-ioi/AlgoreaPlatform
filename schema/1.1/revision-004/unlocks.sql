ALTER TABLE `items` CHANGE `idItemUnlocked` `idItemUnlocked` TEXT NULL DEFAULT NULL;
ALTER TABLE `items` ADD `iScoreMinUnlock` INT NOT NULL DEFAULT '100' AFTER `idItemUnlocked`;
ALTER TABLE `history_items` CHANGE `idItemUnlocked` `idItemUnlocked` TEXT NULL DEFAULT NULL;
ALTER TABLE `history_items` ADD `iScoreMinUnlock` INT NOT NULL DEFAULT '100' AFTER `idItemUnlocked`;

ALTER TABLE `users_items` ADD `bKeyObtained` TINYINT(1) NOT NULL DEFAULT '0' AFTER `bFinished`;
ALTER TABLE `history_users_items` ADD `bKeyObtained` TINYINT(1) NOT NULL DEFAULT '0' AFTER `bFinished`;
