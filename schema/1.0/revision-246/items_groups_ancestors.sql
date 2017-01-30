CREATE TABLE IF NOT EXISTS `history_groups_ancestors` (
  `historyID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ID` bigint(20) NOT NULL,
  `idGroupAncestor` bigint(20) NOT NULL,
  `idGroupChild` bigint(20) NOT NULL,
  `iVersion` int(11) NOT NULL,
  `iNextVersion` int(11) NOT NULL,
  `bDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`historyID`),
  KEY `iVersion` (`iVersion`),
  UNIQUE KEY `idGroupAncestor` (`idGroupAncestor`,`idGroupChild`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

ALTER TABLE `items_ancestors` DROP `sAccessComputationState` ,
DROP `bAccessRestricted` ;

ALTER TABLE `history_items_ancestors` DROP `sAccessComputationState`;
