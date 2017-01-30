ALTER TABLE `groups` CHANGE `sDescription` `sDescription` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_groups` CHANGE `sDescription` `sDescription` TEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `groups` CHANGE `bOpened` `bOpened` TINYINT(1) NOT NULL DEFAULT '1';
ALTER TABLE `groups` CHANGE `bSendEmails` `bSendEmails` TINYINT(1) NOT NULL DEFAULT '1';
ALTER TABLE `groups` CHANGE `sType` `sType` ENUM('Root','Class','Club','Friends','Other','UserSelf','UserAdmin','RootSelf','RootAdmin') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'Other';
ALTER TABLE `groups` CHANGE `bOpened` `bOpened` TINYINT(1) NOT NULL DEFAULT '1';
ALTER TABLE `groups` CHANGE `bSendEmails` `bSendEmails` TINYINT(1) NOT NULL DEFAULT '1';
ALTER TABLE `groups` CHANGE `sType` `sType` ENUM('Root','Class','Club','Friends','Other','UserSelf','UserAdmin','RootSelf','RootAdmin') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'Other';