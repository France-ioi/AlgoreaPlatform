CREATE TABLE IF NOT EXISTS `groups_attempts` (
  `ID` bigint(20) NOT NULL,
  `idGroup` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `idUserCreator` bigint(20) DEFAULT NULL,
  `iOrder` int(11) NOT NULL,
  `iScore` float NOT NULL DEFAULT '0',
  `iScoreComputed` float NOT NULL DEFAULT '0',
  `iScoreReeval` float DEFAULT '0',
  `iScoreDiffManual` float NOT NULL DEFAULT '0',
  `sScoreDiffComment` varchar(200) NOT NULL DEFAULT '',
  `nbSubmissionsAttempts` int(11) NOT NULL DEFAULT '0',
  `nbTasksTried` int(11) NOT NULL DEFAULT '0',
  `nbTasksSolved` int(11) NOT NULL DEFAULT '0',
  `nbChildrenValidated` int(11) NOT NULL DEFAULT '0',
  `bValidated` tinyint(1) NOT NULL DEFAULT '0',
  `bFinished` tinyint(1) NOT NULL DEFAULT '0',
  `bKeyObtained` tinyint(1) NOT NULL DEFAULT '0',
  `nbTasksWithHelp` int(11) NOT NULL DEFAULT '0',
  `sHintsRequested` mediumtext NOT NULL,
  `nbHintsCached` int(11) NOT NULL DEFAULT '0',
  `nbCorrectionsRead` int(11) NOT NULL DEFAULT '0',
  `iPrecision` int(11) NOT NULL DEFAULT '0',
  `iAutonomy` int(11) NOT NULL DEFAULT '0',
  `sStartDate` datetime DEFAULT NULL,
  `sValidationDate` datetime DEFAULT NULL,
  `sFinishDate` datetime DEFAULT NULL,
  `sLastActivityDate` datetime DEFAULT NULL,
  `sThreadStartDate` datetime DEFAULT NULL,
  `sLastAnswerDate` datetime DEFAULT NULL,
  `sLastHintDate` datetime DEFAULT NULL,
  `sAdditionalTime` datetime DEFAULT NULL,
  `sContestStartDate` datetime DEFAULT NULL,
  `bRanked` tinyint(1) NOT NULL DEFAULT '0',
  `sAllLangProg` varchar(200) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL,
  `sAncestorsComputationState` enum('done','processing','todo','temp') NOT NULL DEFAULT 'done'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `groups_attempts`
  ADD PRIMARY KEY (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `sAncestorsComputationState` (`sAncestorsComputationState`), ADD KEY `idItem` (`idItem`), ADD KEY `idGroup` (`idGroup`), ADD KEY `GroupItem` (`idGroup`,`idItem`);

ALTER TABLE `groups_attempts`
  MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;


CREATE TABLE IF NOT EXISTS `history_groups_attempts` (
  `historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idGroup` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `idUserCreator` bigint(20) DEFAULT NULL,
  `iOrder` int(11) NOT NULL,
  `iScore` float NOT NULL DEFAULT '0',
  `iScoreComputed` float NOT NULL DEFAULT '0',
  `iScoreReeval` float DEFAULT '0',
  `iScoreDiffManual` float NOT NULL DEFAULT '0',
  `sScoreDiffComment` varchar(200) NOT NULL DEFAULT '',
  `nbSubmissionsAttempts` int(11) NOT NULL DEFAULT '0',
  `nbTasksTried` int(11) NOT NULL DEFAULT '0',
  `nbTasksSolved` int(11) NOT NULL DEFAULT '0',
  `nbChildrenValidated` int(11) NOT NULL DEFAULT '0',
  `bValidated` tinyint(1) NOT NULL DEFAULT '0',
  `bFinished` tinyint(1) NOT NULL DEFAULT '0',
  `bKeyObtained` tinyint(1) NOT NULL DEFAULT '0',
  `nbTasksWithHelp` int(11) NOT NULL DEFAULT '0',
  `sHintsRequested` mediumtext NOT NULL,
  `nbHintsCached` int(11) NOT NULL DEFAULT '0',
  `nbCorrectionsRead` int(11) NOT NULL DEFAULT '0',
  `iPrecision` int(11) NOT NULL DEFAULT '0',
  `iAutonomy` int(11) NOT NULL DEFAULT '0',
  `sStartDate` datetime DEFAULT NULL,
  `sValidationDate` datetime DEFAULT NULL,
  `sFinishDate` datetime DEFAULT NULL,
  `sLastActivityDate` datetime DEFAULT NULL,
  `sThreadStartDate` datetime DEFAULT NULL,
  `sLastAnswerDate` datetime DEFAULT NULL,
  `sLastHintDate` datetime DEFAULT NULL,
  `sAdditionalTime` datetime DEFAULT NULL,
  `sContestStartDate` datetime DEFAULT NULL,
  `bRanked` tinyint(1) NOT NULL DEFAULT '0',
  `sAllLangProg` varchar(200) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL,
  `sPropagationState` enum('done','processing','todo','temp') NOT NULL DEFAULT 'done',
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8;

ALTER TABLE `history_groups_attempts`
  ADD PRIMARY KEY (`historyID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `sAncestorsComputationState` (`sPropagationState`), ADD KEY `idItem` (`idItem`), ADD KEY `GroupItem` (`idGroup`,`idItem`), ADD KEY `idGroup` (`idGroup`);

ALTER TABLE `history_groups_attempts`
  MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;


ALTER TABLE `users_items` ADD `idAttemptActive` BIGINT(20) NULL AFTER `idItem`;
ALTER TABLE `history_users_items` ADD `idAttemptActive` BIGINT(20) NULL AFTER `idItem`;

ALTER TABLE `users_items` CHANGE `sAncestorsComputationState` `sAncestorsComputationState` ENUM('done','processing','todo','temp') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'todo';

ALTER TABLE `items` ADD `bHasAttempts` TINYINT(1) NOT NULL DEFAULT '0' AFTER `iTeamMaxMembers`;
ALTER TABLE `history_items` ADD `bHasAttempts` TINYINT(1) NOT NULL DEFAULT '0' AFTER `iTeamMaxMembers`;

ALTER TABLE `users_answers` ADD `idAttempt` BIGINT(20) NULL DEFAULT NULL AFTER `idItem`, ADD `sType` ENUM('Submission','Saved','Current') NOT NULL DEFAULT 'Submission' AFTER `sName`, ADD `sState` MEDIUMTEXT NULL DEFAULT NULL AFTER `sType`;
ALTER TABLE `history_users_answers` ADD `idAttempt` BIGINT(20) NULL DEFAULT NULL AFTER `idItem`, ADD `sType` ENUM('Submission','Saved','Current') NOT NULL DEFAULT 'Submission' AFTER `sName`, ADD `sState` MEDIUMTEXT NULL DEFAULT NULL AFTER `sType`;

ALTER TABLE `users_answers` CHANGE `sName` `sName` VARCHAR(200) NULL DEFAULT NULL;
ALTER TABLE `history_users_answers` CHANGE `sName` `sName` VARCHAR(200) NULL DEFAULT NULL;

ALTER TABLE `groups` ADD `iTeamParticipating` TINYINT(1) NOT NULL DEFAULT '0' AFTER `idTeamItem`;
ALTER TABLE `history_groups` ADD `iTeamParticipating` TINYINT(1) NOT NULL DEFAULT '0' AFTER `idTeamItem`;
