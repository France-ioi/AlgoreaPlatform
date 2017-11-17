ALTER TABLE `users` CHANGE `sSalt` `sSalt` VARCHAR(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sRecover` `sRecover` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sTimeZone` `sTimeZone` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sAddress` `sAddress` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s address',
CHANGE `sZipcode` `sZipcode` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s postal code',
CHANGE `sCity` `sCity` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s city',
CHANGE `sLandLineNumber` `sLandLineNumber` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s phone number',
CHANGE `sCellPhoneNumber` `sCellPhoneNumber` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s mobil phone number',
CHANGE `bPublicFirstName` `bPublicFirstName` TINYINT(4) NOT NULL DEFAULT '0' COMMENT 'Publicly show user\'s first name',
CHANGE `bPublicLastName` `bPublicLastName` TINYINT(4) NOT NULL DEFAULT '0' COMMENT 'Publicly show user\'s first name',
CHANGE `sFreeText` `sFreeText` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sWebSite` `sWebSite` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sLastIP` `sLastIP` VARCHAR(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `iStepLevelInSite` `iStepLevelInSite` INT(11) NOT NULL DEFAULT '0' COMMENT 'User''s level',
CHANGE `nbHelpGiven` `nbHelpGiven` INT(11) NOT NULL DEFAULT '0' COMMENT 'TODO',
CHANGE `idGroupSelf` `idGroupSelf` BIGINT(20) NULL DEFAULT NULL,
CHANGE `idGroupAccess` `idGroupAccess` BIGINT(20) NULL DEFAULT NULL,
CHANGE `sLastLoginDate` `sLastLoginDate` DATETIME NULL DEFAULT NULL;


ALTER TABLE `history_users` CHANGE `sSalt` `sSalt` VARCHAR(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sRecover` `sRecover` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sTimeZone` `sTimeZone` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sAddress` `sAddress` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s address',
CHANGE `sZipcode` `sZipcode` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s postal code',
CHANGE `sCity` `sCity` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s city',
CHANGE `sLandLineNumber` `sLandLineNumber` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s phone number',
CHANGE `sCellPhoneNumber` `sCellPhoneNumber` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User\'s mobil phone number',
CHANGE `bPublicFirstName` `bPublicFirstName` TINYINT(4) NOT NULL DEFAULT '0' COMMENT 'Publicly show user\'s first name',
CHANGE `bPublicLastName` `bPublicLastName` TINYINT(4) NOT NULL DEFAULT '0' COMMENT 'Publicly show user\'s first name',
CHANGE `sFreeText` `sFreeText` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sWebSite` `sWebSite` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `sLastIP` `sLastIP` VARCHAR(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
CHANGE `iStepLevelInSite` `iStepLevelInSite` INT(11) NOT NULL DEFAULT '0' COMMENT 'User''s level',
CHANGE `nbHelpGiven` `nbHelpGiven` INT(11) NOT NULL DEFAULT '0' COMMENT 'TODO',
CHANGE `idGroupSelf` `idGroupSelf` BIGINT(20) NULL DEFAULT NULL,
CHANGE `idGroupAccess` `idGroupAccess` BIGINT(20) NULL DEFAULT NULL,
CHANGE `sLastLoginDate` `sLastLoginDate` DATETIME NULL DEFAULT NULL;

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
