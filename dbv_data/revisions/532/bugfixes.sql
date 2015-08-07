ALTER TABLE `users_answers` ADD `idUserGrader` INT(11) NULL AFTER `sGradingDate`;
ALTER TABLE `history_users_answers` ADD `idUserGrader` INT(11) NULL AFTER `sGradingDate`;

ALTER TABLE `users_answers` CHANGE `sAnswer` `sAnswer` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
ALTER TABLE `history_users_answers` CHANGE `sAnswer` `sAnswer` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;

ALTER TABLE `threads` DROP `sMessage`;
ALTER TABLE `history_threads` DROP `sMessage`;

ALTER TABLE `users_answers` CHANGE `sSaveDate` `sSubmissionDate` DATETIME NOT NULL;
ALTER TABLE `history_users_answers` CHANGE `sSaveDate` `sSubmissionDate` DATETIME NOT NULL;

ALTER TABLE `users_answers` CHANGE `iScore` `iScore` FLOAT(11) NULL DEFAULT NULL;
ALTER TABLE `history_users_answers` CHANGE `iScore` `iScore` FLOAT(11) NULL DEFAULT NULL;
ALTER TABLE `users_items` CHANGE `iScore` `iScore` FLOAT(11) NOT NULL DEFAULT '0';
ALTER TABLE `users_items` CHANGE `iScoreComputed` `iScoreComputed` FLOAT(11) NOT NULL DEFAULT '0';
ALTER TABLE `users_items` CHANGE `iScoreDiffManual` `iScoreDiffManual` FLOAT(11) NOT NULL DEFAULT '0';
ALTER TABLE `history_users_items` CHANGE `iScore` `iScore` FLOAT(11) NOT NULL DEFAULT '0';
ALTER TABLE `history_users_items` CHANGE `iScoreComputed` `iScoreComputed` FLOAT(11) NOT NULL DEFAULT '0';
ALTER TABLE `history_users_items` CHANGE `iScoreDiffManual` `iScoreDiffManual` FLOAT(11) NOT NULL DEFAULT '0';

ALTER TABLE `items` CHANGE `sType` `sType` ENUM('Root','Category','Level','Chapter','GenericChapter','StaticChapter','Section','Task','Course','ContestChapter','LimitedTimeChapter','Presentation') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;

ALTER TABLE `history_items` CHANGE `sType` `sType` ENUM('Root','Category','Level','Chapter','GenericChapter','StaticChapter','Section','Task','Course','ContestChapter','LimitedTimeChapter','Presentation') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;

ALTER TABLE `users` ADD `sNotificationReadDate` DATETIME NULL DEFAULT NULL AFTER `idGroupAccess`;
ALTER TABLE `history_users` ADD `sNotificationReadDate` DATETIME NULL DEFAULT NULL AFTER `idGroupAccess`;

ALTER TABLE `items` ADD `bUsesAPI` BOOLEAN NOT NULL DEFAULT TRUE AFTER `sType`;
ALTER TABLE `history_items` ADD `bUsesAPI` BOOLEAN NOT NULL DEFAULT TRUE AFTER `sType`;

ALTER TABLE `messages` ADD `bPublished` BOOLEAN NOT NULL DEFAULT TRUE AFTER `sSubmissionDate`;
ALTER TABLE `history_messages` ADD `bPublished` BOOLEAN NOT NULL DEFAULT TRUE AFTER `sSubmissionDate`;

ALTER TABLE `users_threads` CHANGE `idUser` `idUser` BIGINT(20) NOT NULL;
ALTER TABLE `history_users_threads` CHANGE `idUser` `idUser` BIGINT(20) NOT NULL;
ALTER TABLE `users_answers` CHANGE `idUser` `idUser` BIGINT(20) NOT NULL;
ALTER TABLE `history_users_answers` CHANGE `idUser` `idUser` BIGINT(20) NOT NULL;
ALTER TABLE `threads` CHANGE `idUserCreated` `idUserCreated` BIGINT(20) NOT NULL;
ALTER TABLE `history_threads` CHANGE `idUserCreated` `idUserCreated` BIGINT(20) NOT NULL;
ALTER TABLE `history_users_threads` CHANGE `ID` `ID` BIGINT(20) NOT NULL;
ALTER TABLE `history_users_threads` CHANGE `idThread` `idThread` BIGINT(20) NOT NULL;
ALTER TABLE `filters` CHANGE `idUser` `idUser` BIGINT(20) NOT NULL;
ALTER TABLE `history_filters` CHANGE `idUser` `idUser` BIGINT(20) NOT NULL;
ALTER TABLE `history_filters` CHANGE `ID` `ID` BIGINT(20) NOT NULL;
ALTER TABLE `history_filters` CHANGE `idGroup` `idGroup` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `history_filters` CHANGE `idItem` `idItem` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `filters` CHANGE `idItem` `idItem` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `messages` CHANGE `idUser` `idUser` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `history_messages` CHANGE `idUser` `idUser` BIGINT(20) NULL DEFAULT NULL;

ALTER TABLE `groups_ancestors` ADD `bIsSelf` BOOLEAN NOT NULL DEFAULT FALSE AFTER `idGroupChild`;
ALTER TABLE `history_groups_ancestors` ADD `bIsSelf` BOOLEAN NOT NULL DEFAULT FALSE AFTER `idGroupChild`;

-- adding platform id to items
ALTER TABLE `items` ADD `idPlatform` INT(11) NOT NULL AFTER `sUrl`;
ALTER TABLE `messages` CHANGE `idThread` `idThread` BIGINT(20) NULL DEFAULT NULL;

ALTER TABLE `history_threads` CHANGE `idItem` `idItem` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `threads` CHANGE `idItem` `idItem` BIGINT(20) NULL DEFAULT NULL;

ALTER TABLE `history_languages` CHANGE `historyID` `historyID` BIGINT(20) NOT NULL AUTO_INCREMENT;


ALTER TABLE `items` CHANGE `sUrl` `sUrl` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `items` CHANGE `idPlatform` `idPlatform` INT(11) NULL DEFAULT NULL;
ALTER TABLE `items` CHANGE `iValidationMin` `iValidationMin` INT(11) NULL DEFAULT NULL;
ALTER TABLE `items` CHANGE `sSupportedLangProg` `sSupportedLangProg` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_items` CHANGE `sSupportedLangProg` `sSupportedLangProg` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_items` CHANGE `sUrl` `sUrl` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_items` CHANGE `idPlatform` `idPlatform` INT(11) NULL DEFAULT NULL;
ALTER TABLE `history_items` CHANGE `iValidationMin` `iValidationMin` INT(11) NULL DEFAULT NULL;
ALTER TABLE `items` CHANGE `bShowDifficulty` `bShowDifficulty` TINYINT(1) NOT NULL DEFAULT '0';
ALTER TABLE `items` CHANGE `bHintsAllowed` `bHintsAllowed` TINYINT(1) NOT NULL DEFAULT '0';
ALTER TABLE `items` CHANGE `bShowSource` `bShowSource` TINYINT(1) NOT NULL DEFAULT '0';
