
CREATE TABLE IF NOT EXISTS `items_ancestors` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `idItemAncestor` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `idItemAncestor` (`idItemAncestor`,`idItemChild`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;



CREATE TABLE IF NOT EXISTS `groups_ancestors` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
  `idGroupAncestor` bigint(20) NOT NULL,
  `idGroupChild` bigint(20) NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `idGroupAncestor` (`idGroupAncestor`,`idGroupChild`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

ALTER TABLE  `items` ADD  `bAncestorsComputed` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `bNoScore` , ADD INDEX (  `bAncestorsComputed` );
ALTER TABLE  `history_items` ADD  `bAncestorsComputed` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `bNoScore`;

ALTER TABLE  `groups` ADD  `bAncestorsComputed` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `bSendEmails` , ADD INDEX (  `bAncestorsComputed` );
ALTER TABLE  `history_groups` ADD  `bAncestorsComputed` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `bSendEmails`;

ALTER TABLE  `items` CHANGE  `bAncestorsComputed`  `sAncestorsComputationState` ENUM(  'done',  'processing',  'todo' ) NOT NULL DEFAULT  'todo';
ALTER TABLE  `history_items` CHANGE  `bAncestorsComputed`  `sAncestorsComputationState` ENUM(  'done',  'processing',  'todo' ) NOT NULL DEFAULT  'todo';

ALTER TABLE  `groups` CHANGE  `bAncestorsComputed`  `sAncestorsComputationState` ENUM(  'done',  'processing',  'todo' ) NOT NULL DEFAULT  'todo';
ALTER TABLE  `history_groups` CHANGE  `bAncestorsComputed`  `sAncestorsComputationState` ENUM(  'done',  'processing',  'todo' ) NOT NULL DEFAULT  'todo';
