ALTER TABLE `users` CHANGE `sSalt` `sSalt` VARCHAR(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `sRecover` `sRecover` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `sTimeZone` `sTimeZone` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `sAddress` `sAddress` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s address';
ALTER TABLE `users` CHANGE `sZipcode` `sZipcode` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s postal code';
ALTER TABLE `users` CHANGE `sCity` `sCity` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s city';
ALTER TABLE `users` CHANGE `sLandLineNumber` `sLandLineNumber` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s phone number';
ALTER TABLE `users` CHANGE `sCellPhoneNumber` `sCellPhoneNumber` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s mobil phone number';
ALTER TABLE `users` CHANGE `bPublicFirstName` `bPublicFirstName` TINYINT(4) NOT NULL DEFAULT '0' COMMENT 'Publicly show user\'s first name';
ALTER TABLE `users` CHANGE `bPublicLastName` `bPublicLastName` TINYINT(4) NOT NULL DEFAULT '0' COMMENT 'Publicly show user\'s first name';
ALTER TABLE `users` CHANGE `sFreeText` `sFreeText` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `sWebSite` `sWebSite` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `sLastIP` `sLastIP` VARCHAR(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `iStepLevelInSite` `iStepLevelInSite` INT(11) NOT NULL DEFAULT '0' COMMENT 'User''s level';
ALTER TABLE `users` CHANGE `nbHelpGiven` `nbHelpGiven` INT(11) NOT NULL DEFAULT '0' COMMENT 'TODO';
ALTER TABLE `users` CHANGE `idGroupSelf` `idGroupSelf` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `idGroupAccess` `idGroupAccess` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `sLastLoginDate` `sLastLoginDate` DATETIME NULL DEFAULT NULL;


ALTER TABLE `history_users` CHANGE `sSalt` `sSalt` VARCHAR(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `sRecover` `sRecover` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `sTimeZone` `sTimeZone` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `sAddress` `sAddress` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s address';
ALTER TABLE `history_users` CHANGE `sZipcode` `sZipcode` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s postal code';
ALTER TABLE `history_users` CHANGE `sCity` `sCity` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s city';
ALTER TABLE `history_users` CHANGE `sLandLineNumber` `sLandLineNumber` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s phone number';
ALTER TABLE `history_users` CHANGE `sCellPhoneNumber` `sCellPhoneNumber` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s mobil phone number';
ALTER TABLE `history_users` CHANGE `bPublicFirstName` `bPublicFirstName` TINYINT(4) NOT NULL DEFAULT '0' COMMENT 'Publicly show user\'s first name';
ALTER TABLE `history_users` CHANGE `bPublicLastName` `bPublicLastName` TINYINT(4) NOT NULL DEFAULT '0' COMMENT 'Publicly show user\'s first name';
ALTER TABLE `history_users` CHANGE `sFreeText` `sFreeText` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `sWebSite` `sWebSite` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `sLastIP` `sLastIP` VARCHAR(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `iStepLevelInSite` `iStepLevelInSite` INT(11) NOT NULL DEFAULT '0' COMMENT 'User''s level';
ALTER TABLE `history_users` CHANGE `nbHelpGiven` `nbHelpGiven` INT(11) NOT NULL DEFAULT '0' COMMENT 'TODO';
ALTER TABLE `history_users` CHANGE `idGroupSelf` `idGroupSelf` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `idGroupAccess` `idGroupAccess` BIGINT(20) NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `sLastLoginDate` `sLastLoginDate` DATETIME NULL DEFAULT NULL;

ALTER TABLE `history_users_items` CHANGE `nbTasksSolved` `nbTasksSolved` INT(11) NOT NULL DEFAULT '0';

# We need to set all the datetime fields that contain '0000-00-00 00:00:00' to NULL;
UPDATE users_items SET sValidationDate = NULL, sStartDate = NULL, sFinishDate = NULL, sLastActivityDate = NULL WHERE sValidationDate = 0 AND sStartDate = 0 AND sFinishDate = 0 AND sLastActivityDate = 0;
UPDATE users_items SET sValidationDate = NULL, sStartDate = NULL, sFinishDate = NULL WHERE sValidationDate = 0 AND sStartDate = 0 AND sFinishDate = 0;
UPDATE users_items SET sValidationDate = NULL, sStartDate = NULL WHERE sValidationDate = 0 AND sStartDate = 0;
UPDATE users_items SET sValidationDate = NULL, sLastActivityDate = NULL WHERE sValidationDate = 0 AND sLastActivityDate = 0;
UPDATE users_items SET sValidationDate = NULL, sFinishDate = NULL WHERE sValidationDate = 0 AND sFinishDate = 0;
UPDATE users_items SET sValidationDate = NULL WHERE sValidationDate = 0;
UPDATE users_items SET sStartDate = NULL WHERE sStartDate = 0;
UPDATE users_items SET sFinishDate = NULL WHERE sFinishDate = 0;
UPDATE users_items SET sLastActivityDate = NULL WHERE sLastActivityDate = 0;

ALTER TABLE `users_items` DROP COLUMN `sToken`;