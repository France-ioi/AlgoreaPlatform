ALTER TABLE `groups_groups` ADD `sRole` ENUM('manager','owner','member','observer') NOT NULL DEFAULT 'member' AFTER `iVersion`;
ALTER TABLE `history_groups_groups` ADD `sRole` ENUM('manager','owner','member','observer') NOT NULL DEFAULT 'member' AFTER `bDeleted`;


ALTER TABLE `users` ADD UNIQUE KEY `idGroupOwned` (`idGroupOwned`);
ALTER TABLE `history_users` ADD KEY `idGroupOwned` (`idGroupOwned`);

ALTER TABLE `groups` ADD `iGrade` INT(4) NOT NULL DEFAULT '-2' AFTER `sName`, ADD `sGradeDetails` VARCHAR(50) NULL DEFAULT NULL AFTER `iGrade`;
ALTER TABLE `history_groups` ADD `iGrade` INT(4) NOT NULL DEFAULT '-2' AFTER `sName`, ADD `sGradeDetails` VARCHAR(50) NULL DEFAULT NULL AFTER `iGrade`;

ALTER TABLE `users_items` ADD `sThreadStartDate` DATETIME NULL DEFAULT NULL AFTER `sLastActivityDate`, ADD `sLastAnswerDate` DATETIME NULL DEFAULT NULL AFTER `sThreadStartDate`;
ALTER TABLE `history_users_items` ADD `sThreadStartDate` DATETIME NULL DEFAULT NULL AFTER `sLastActivityDate`, ADD `sLastAnswerDate` DATETIME NULL DEFAULT NULL AFTER `sThreadStartDate`;
ALTER TABLE `users_items` ADD `sLastHintDate` DATETIME NULL DEFAULT NULL AFTER `sLastAnswerDate`;
ALTER TABLE `history_users_items` ADD `sLastHintDate` DATETIME NULL DEFAULT NULL AFTER `sLastAnswerDate`;

ALTER TABLE `history_groups_ancestors` CHANGE `iNextVersion` `iNextVersion` INT(11) NULL DEFAULT NULL;