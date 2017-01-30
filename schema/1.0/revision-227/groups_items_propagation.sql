ALTER TABLE `groups` CHANGE `sType` `sType` ENUM( 'Root', 'Class', 'Club', 'Friends', 'Other', 'UserSelf', 'UserAdmin', 'RootAdmin' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
ALTER TABLE `groups` CHANGE `ID` `ID` BIGINT( 20 ) NOT NULL AUTO_INCREMENT;
ALTER TABLE `groups_groups` CHANGE `ID` `ID` BIGINT( 20 ) NOT NULL AUTO_INCREMENT;
ALTER TABLE `groups_items`
  DROP `sComputeAccessFromAncestors`,
  DROP `sPartialAccessDateAncestors`,
  DROP `sFullAccessDateAncestors`,
  DROP `sAccessSolutionsDateAncestors`,
  DROP `sAccessReasonAncestors`;

ALTER TABLE `groups_items` ADD `bCachedAccessSolutions` BOOLEAN NOT NULL DEFAULT '0' AFTER `bCachedPartialAccessAncestors` ,
ADD `bCachedGrayedAccess` BOOLEAN NOT NULL DEFAULT '0' AFTER `bCachedAccessSolutions`;

ALTER TABLE `groups_items` ADD `sPropagateAccess` ENUM( 'self', 'children', 'done' ) NOT NULL DEFAULT 'self' AFTER `bCachedGrayedAccess`;

ALTER TABLE `groups_items` ADD `sCachedFullAccessDate` DATETIME NULL DEFAULT NULL AFTER `sAccessSolutionsDate` ,
ADD `sCachedPartialAccessDate` DATETIME NULL DEFAULT NULL AFTER `sCachedFullAccessDate` ,
ADD `sCachedAccessSolutionsDate` DATETIME NULL DEFAULT NULL AFTER `sCachedPartialAccessDate`;

ALTER TABLE `groups_items` CHANGE `bCachedFullAccessAncestors` `bCachedFullAccess` TINYINT( 1 ) NOT NULL DEFAULT '0';
ALTER TABLE `groups_items` CHANGE `bCachedPartialAccessAncestors` `bCachedPartialAccess` TINYINT( 1 ) NOT NULL DEFAULT '0';
ALTER TABLE `groups_items` ADD `sCachedAccessReason` VARCHAR( 200 ) NOT NULL AFTER `sCachedAccessSolutionsDate`;
ALTER TABLE `groups_items` CHANGE `ID` `ID` BIGINT( 20 ) NOT NULL AUTO_INCREMENT;


ALTER TABLE `history_groups_items`
  DROP `sComputeAccessFromAncestors`,
  DROP `sPartialAccessDateAncestors`,
  DROP `sFullAccessDateAncestors`,
  DROP `sAccessSolutionsDateAncestors`,
  DROP `sAccessReasonAncestors`;

ALTER TABLE `history_groups_items` ADD `bCachedAccessSolutions` BOOLEAN NOT NULL DEFAULT '0' AFTER `bCachedPartialAccessAncestors` ,
ADD `bCachedGrayedAccess` BOOLEAN NOT NULL DEFAULT '0' AFTER `bCachedAccessSolutions`;

ALTER TABLE `history_groups_items` ADD `sPropagateAccess` ENUM( 'self', 'children', 'done' ) NOT NULL DEFAULT 'self' AFTER `bCachedGrayedAccess`;

ALTER TABLE `history_groups_items` ADD `sCachedFullAccessDate` DATETIME NULL DEFAULT NULL AFTER `sAccessSolutionsDate` ,
ADD `sCachedPartialAccessDate` DATETIME NULL DEFAULT NULL AFTER `sCachedFullAccessDate` ,
ADD `sCachedAccessSolutionsDate` DATETIME NULL DEFAULT NULL AFTER `sCachedPartialAccessDate`;

ALTER TABLE `history_groups_items` CHANGE `bCachedFullAccessAncestors` `bCachedFullAccess` TINYINT( 1 ) NOT NULL DEFAULT '0';
ALTER TABLE `history_groups_items` CHANGE `bCachedPartialAccessAncestors` `bCachedPartialAccess` TINYINT( 1 ) NOT NULL DEFAULT '0';
ALTER TABLE `history_groups_items` ADD `sCachedAccessReason` VARCHAR( 200 ) NOT NULL AFTER `sCachedAccessSolutionsDate`;

ALTER TABLE `groups_items` ADD INDEX `groupItem` ( `idItem` , `idGroup` );

ALTER TABLE `groups_items` ADD `sCachedGrayedAccessDate` DATETIME NULL DEFAULT NULL AFTER `sCachedAccessSolutionsDate`;
ALTER TABLE `history_groups_items` ADD `sCachedGrayedAccessDate` DATETIME NULL DEFAULT NULL AFTER `sCachedAccessSolutionsDate`;
