ALTER TABLE `groups` CHANGE `sType` `sType` ENUM('Root','Class','Team','Club','Friends','Other','UserSelf','UserAdmin','RootSelf','RootAdmin') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
ALTER TABLE `groups` ADD `idTeamItem` BIGINT NOT NULL AFTER `bFreeAccess`;

ALTER TABLE `items` ADD `sTeamMode` ENUM('All','Half','One','None') NULL DEFAULT NULL AFTER `idDefaultLanguage`, ADD `idTeamInGroup` BIGINT NULL DEFAULT NULL AFTER `sTeamMode`, ADD `iTeamMaxMembers` INT NOT NULL DEFAULT '0' AFTER `idTeamInGroup`;
