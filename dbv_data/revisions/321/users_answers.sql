-- -----------------------------------------------------
-- Table `users_answers`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users_answers` ;

CREATE TABLE IF NOT EXISTS `users_answers` (
`ID` bigint(20) NOT NULL,
  `idUser` int(11) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `sName` int(50) DEFAULT NULL,
  `sAnswer` varchar(2047) NOT NULL,
  `sLangProg` varchar(50) DEFAULT NULL,
  `sSaveDate` datetime NOT NULL,
  `iScore` int(11) DEFAULT NULL,
  `bValidated` tinyint(1) DEFAULT NULL,
  `sGradingDate` datetime DEFAULT NULL,
  `iVersion` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

ALTER TABLE `users_answers`
 ADD PRIMARY KEY (`ID`), ADD KEY `idUser` (`idUser`);

CREATE TABLE IF NOT EXISTS `history_users_answers` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idUser` int(11) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `sName` int(50) DEFAULT NULL,
  `sAnswer` varchar(2047) NOT NULL,
  `sLangProg` varchar(50) DEFAULT NULL,
  `sSaveDate` datetime NOT NULL,
  `iScore` int(11) DEFAULT NULL,
  `bValidated` tinyint(1) DEFAULT NULL,
  `sGradingDate` datetime DEFAULT NULL,
  `iVersion` int(11) NOT NULL,
  `iNextVersion` int(11) NOT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


ALTER TABLE `history_users_answers`
 ADD PRIMARY KEY (`historyID`), ADD KEY `idUser` (`idUser`), ADD KEY `ID` (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `iNextVersion` (`iNextVersion`);

ALTER TABLE `history_users_answers`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
