CREATE TABLE `groups_login_prefixes` (
  `ID` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `idGroup` bigint NOT NULL,
  `prefix` varchar(100) NOT NULL,
  `iVersion` bigint NOT NULL
) ENGINE='InnoDB' COLLATE 'utf8_unicode_ci';

ALTER TABLE `groups_login_prefixes`
ADD INDEX `idGroup` (`idGroup`);

CREATE TABLE `history_groups_login_prefixes` (
  `historyID` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ID` bigint NOT NULL,
  `idGroup` bigint NOT NULL,
  `prefix` varchar(100) NOT NULL,
  `iVersion` bigint NOT NULL,
  `iNextVersion` bigint NULL,
  `bDeleted` tinyint NOT NULL DEFAULT '0'
) ENGINE='InnoDB' COLLATE 'utf8_unicode_ci';