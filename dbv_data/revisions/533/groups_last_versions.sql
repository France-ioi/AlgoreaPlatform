CREATE TABLE IF NOT EXISTS `groups_versions` (
  `idGroup` bigint(20) NOT NULL,
  `iVersion` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `groups_versions`
 ADD PRIMARY KEY (`idGroup`);

ALTER TABLE `history_users_items` ADD `idGroup` BIGINT(20) NOT NULL AFTER `idItem`, ADD INDEX (`idGroup`) ;
ALTER TABLE `users_items` ADD `idGroup` BIGINT(20) NOT NULL AFTER `idItem`, ADD INDEX (`idGroup`) ;
