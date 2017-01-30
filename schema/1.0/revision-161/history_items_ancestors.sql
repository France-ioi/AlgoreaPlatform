CREATE TABLE IF NOT EXISTS `history_items_ancestors` (
  `historyID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ID` bigint(20) NOT NULL,
  `idItemAncestor` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `sAccessComputationState` ENUM( 'todo', 'done' ) NOT NULL DEFAULT 'todo',
  `iVersion` int(11) NOT NULL,
  `iNextVersion` int(11) NOT NULL,
  `bDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`historyID`),
  KEY `iVersion` (`iVersion`),
  UNIQUE KEY `idItemAncestor` (`idItemAncestor`,`idItemChild`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
