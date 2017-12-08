SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;


CREATE TABLE IF NOT EXISTS `filters` (
  `ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `sName` varchar(45) NOT NULL,
  `bSelected` tinyint(1) NOT NULL DEFAULT '0',
  `bStarred` tinyint(1) DEFAULT NULL,
  `sStartDate` datetime DEFAULT NULL,
  `sEndDate` datetime DEFAULT NULL,
  `bArchived` tinyint(1) DEFAULT NULL,
  `bParticipated` tinyint(1) DEFAULT NULL,
  `bUnread` tinyint(1) DEFAULT NULL,
  `idItem` bigint(20) DEFAULT NULL,
  `idGroup` int(11) DEFAULT NULL,
  `olderThan` int(11) DEFAULT NULL,
  `newerThan` int(11) DEFAULT NULL,
  `sUsersSearch` varchar(200) DEFAULT NULL,
  `sBodySearch` varchar(100) DEFAULT NULL,
  `bImportant` tinyint(1) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `groups` (
  `ID` bigint(20) NOT NULL,
  `sName` varchar(200) NOT NULL,
  `iGrade` int(4) NOT NULL DEFAULT '-2',
  `sGradeDetails` varchar(50) DEFAULT NULL,
  `sDescription` text NOT NULL,
  `sDateCreated` datetime NOT NULL,
  `bOpened` tinyint(1) NOT NULL,
  `bFreeAccess` tinyint(1) NOT NULL DEFAULT '0',
  `sPassword` varchar(50) DEFAULT NULL,
  `sType` enum('Root','Class','Club','Friends','Other','UserSelf','UserAdmin','RootSelf','RootAdmin') NOT NULL,
  `bSendEmails` tinyint(1) NOT NULL,
  `sAncestorsComputationState` enum('done','processing','todo') NOT NULL DEFAULT 'todo',
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `groups_ancestors` (
`ID` bigint(20) NOT NULL,
  `idGroupAncestor` bigint(20) NOT NULL,
  `idGroupChild` bigint(20) NOT NULL,
  `bIsSelf` tinyint(1) NOT NULL DEFAULT '0',
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `groups_groups` (
`ID` bigint(20) NOT NULL,
  `idGroupParent` bigint(20) NOT NULL,
  `idGroupChild` bigint(20) NOT NULL,
  `iChildOrder` int(11) NOT NULL,
  `sType` enum('invitationSent','requestSent','invitationAccepted','requestAccepted','invitationRefused','requestRefused','removed','left','direct') NOT NULL DEFAULT 'direct',
  `sRole` enum('manager','owner','member','observer') NOT NULL DEFAULT 'member',
  `idUserInviting` int(11) DEFAULT NULL,
  `sStatusDate` datetime DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `groups_items` (
  `ID` bigint(20) NOT NULL,
  `idGroup` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `idUserCreated` bigint(20) NOT NULL,
  `sPartialAccessDate` datetime DEFAULT NULL,
  `sAccessReason` varchar(200) NOT NULL,
  `sFullAccessDate` datetime DEFAULT NULL,
  `sAccessSolutionsDate` datetime DEFAULT NULL,
  `bOwnerAccess` tinyint(1) NOT NULL DEFAULT '0',
  `bManagerAccess` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'not for inherited access',
  `sCachedFullAccessDate` datetime DEFAULT NULL,
  `sCachedPartialAccessDate` datetime DEFAULT NULL,
  `sCachedAccessSolutionsDate` datetime DEFAULT NULL,
  `sCachedGrayedAccessDate` datetime DEFAULT NULL,
  `sCachedAccessReason` varchar(200) NOT NULL,
  `bCachedFullAccess` tinyint(1) NOT NULL DEFAULT '0',
  `bCachedPartialAccess` tinyint(1) NOT NULL DEFAULT '0',
  `bCachedAccessSolutions` tinyint(1) NOT NULL DEFAULT '0',
  `bCachedGrayedAccess` tinyint(1) NOT NULL DEFAULT '0',
  `bCachedManagerAccess` tinyint(1) NOT NULL DEFAULT '0',
  `sPropagateAccess` enum('self','children','done') NOT NULL DEFAULT 'self',
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `groups_items_propagate` (
  `ID` bigint(20) NOT NULL,
  `sPropagateAccess` enum('self','children','done') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `groups_propagate` (
  `ID` bigint(20) NOT NULL,
  `sAncestorsComputationState` enum('todo','done','processing','') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_filters` (
`history_ID` int(11) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `sName` varchar(45) NOT NULL,
  `bSelected` tinyint(1) NOT NULL DEFAULT '0',
  `bStarred` tinyint(1) DEFAULT NULL,
  `sStartDate` datetime DEFAULT NULL,
  `sEndDate` datetime DEFAULT NULL,
  `bArchived` tinyint(1) DEFAULT NULL,
  `bParticipated` tinyint(1) DEFAULT NULL,
  `bUnread` tinyint(1) DEFAULT NULL,
  `idItem` bigint(20) DEFAULT NULL,
  `idGroup` bigint(20) DEFAULT NULL,
  `olderThan` int(11) DEFAULT NULL,
  `newerThan` int(11) DEFAULT NULL,
  `sUsersSearch` varchar(200) DEFAULT NULL,
  `sBodySearch` varchar(100) DEFAULT NULL,
  `bImportant` tinyint(1) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_groups` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `sName` varchar(200) NOT NULL,
  `iGrade` int(4) NOT NULL DEFAULT '-2',
  `sGradeDetails` varchar(50) DEFAULT NULL,
  `sDescription` text NOT NULL,
  `sDateCreated` datetime NOT NULL,
  `bOpened` tinyint(1) NOT NULL,
  `bFreeAccess` tinyint(1) NOT NULL,
  `sPassword` varchar(50) DEFAULT NULL,
  `sType` enum('Root','Class','Club','Friends','Other') NOT NULL,
  `bSendEmails` tinyint(1) NOT NULL,
  `bAncestorsComputed` tinyint(1) NOT NULL DEFAULT '0',
  `sAncestorsComputationState` enum('done','processing','todo') NOT NULL DEFAULT 'todo',
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_groups_ancestors` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idGroupAncestor` bigint(20) NOT NULL,
  `idGroupChild` bigint(20) NOT NULL,
  `bIsSelf` tinyint(1) NOT NULL DEFAULT '0',
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_groups_groups` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idGroupParent` bigint(20) NOT NULL,
  `idGroupChild` bigint(20) NOT NULL,
  `iChildOrder` int(11) NOT NULL,
  `sType` enum('invitationSent','requestSent','invitationAccepted','requestAccepted','invitationRefused','requestRefused','removed','left','direct') NOT NULL DEFAULT 'direct',
  `sRole` enum('manager','owner','member','observer') NOT NULL DEFAULT 'member',
  `idUserInviting` int(11) DEFAULT NULL,
  `sStatusDate` datetime DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_groups_items` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idGroup` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `idUserCreated` bigint(20) NOT NULL,
  `sPartialAccessDate` datetime DEFAULT NULL,
  `sAccessReason` varchar(200) NOT NULL,
  `sFullAccessDate` datetime DEFAULT NULL,
  `sAccessSolutionsDate` datetime DEFAULT NULL,
  `bOwnerAccess` tinyint(1) NOT NULL DEFAULT '0',
  `bManagerAccess` tinyint(1) NOT NULL DEFAULT '0',
  `sCachedFullAccessDate` datetime DEFAULT NULL,
  `sCachedPartialAccessDate` datetime DEFAULT NULL,
  `sCachedAccessSolutionsDate` datetime DEFAULT NULL,
  `sCachedGrayedAccessDate` datetime DEFAULT NULL,
  `sCachedAccessReason` varchar(200) NOT NULL,
  `bCachedFullAccess` tinyint(1) NOT NULL DEFAULT '0',
  `bCachedPartialAccess` tinyint(1) NOT NULL DEFAULT '0',
  `bCachedAccessSolutions` tinyint(1) NOT NULL DEFAULT '0',
  `bCachedGrayedAccess` tinyint(1) NOT NULL DEFAULT '0',
  `bCachedManagerAccess` tinyint(1) NOT NULL DEFAULT '0',
  `sPropagateAccess` enum('self','children','done') NOT NULL DEFAULT 'self',
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_items` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `sUrl` varchar(200) DEFAULT NULL,
  `idPlatform` int(11) DEFAULT NULL,
  `sTextId` varchar(200) NOT NULL,
  `sType` enum('Root','CustomProgressRoot','OfficialProgressRoot','CustomContestRoot','OfficialContestRoot','DomainRoot','Category','Level','Chapter','GenericChapter','StaticChapter','Section','Task','Course','ContestChapter','LimitedTimeChapter','Presentation') NOT NULL,
  `bUsesAPI` tinyint(1) NOT NULL DEFAULT '1',
  `sFullScreen` enum('forceYes','forceNo','default','') NOT NULL DEFAULT 'default',
  `bShowDifficulty` tinyint(1) NOT NULL,
  `bShowSource` tinyint(1) NOT NULL,
  `bHintsAllowed` tinyint(1) NOT NULL,
  `sValidationType` enum('None','All','AllButOne','Categories','One') NOT NULL DEFAULT 'All',
  `iValidationMin` int(11) DEFAULT NULL,
  `sPreparationState` enum('NotReady','Reviewing','Ready') NOT NULL DEFAULT 'NotReady',
  `idItemUnlocked` bigint(20) DEFAULT NULL,
  `sSupportedLangProg` varchar(200) DEFAULT NULL,
  `sAccessOpenDate` datetime DEFAULT NULL,
  `sDuration` time DEFAULT NULL,
  `sEndContestDate` datetime DEFAULT NULL,
  `bShowUserInfos` tinyint(1) NOT NULL DEFAULT '0',
  `sContestPhase` enum('Running','Analysis','Closed') NOT NULL,
  `iLevel` int(11) DEFAULT NULL,
  `bNoScore` tinyint(1) NOT NULL,
  `sAncestorsComputationState` enum('done','processing','todo') NOT NULL DEFAULT 'todo',
  `sAncestorsAccessComputationState` enum('todo','processing','done') NOT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_items_ancestors` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idItemAncestor` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_items_items` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idItemParent` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `iChildOrder` int(11) NOT NULL,
  `sCategory` enum('Undefined','Discovery','Application','Validation','Challenge') NOT NULL DEFAULT 'Undefined',
  `bAlwaysVisible` tinyint(1) NOT NULL DEFAULT '0',
  `bAccessRestricted` tinyint(1) NOT NULL DEFAULT '1',
  `iDifficulty` int(11) NOT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_items_strings` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `idLanguage` bigint(20) NOT NULL,
  `sTranslator` varchar(100) NOT NULL,
  `sTitle` varchar(200) NOT NULL,
  `sImageUrl` varchar(100) DEFAULT NULL,
  `sSubtitle` varchar(200) NOT NULL,
  `sDescription` text NOT NULL,
  `sEduComment` text NOT NULL,
  `sRankingComment` text NOT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_languages` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `sName` varchar(100) NOT NULL,
  `sCode` varchar(2) NOT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_messages` (
`history_ID` int(11) NOT NULL,
  `ID` int(11) NOT NULL,
  `idThread` int(11) NOT NULL,
  `idUser` bigint(20) DEFAULT NULL,
  `sSubmissionDate` datetime DEFAULT NULL,
  `bPublished` tinyint(1) NOT NULL DEFAULT '1',
  `sTitle` varchar(200) DEFAULT '',
  `sBody` varchar(2000) DEFAULT '',
  `bTrainersOnly` tinyint(1) NOT NULL DEFAULT '0',
  `bArchived` tinyint(1) DEFAULT '0',
  `bPersistant` tinyint(1) DEFAULT NULL,
  `bReadByCandidate` tinyint(1) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_threads` (
`history_ID` int(11) NOT NULL,
  `ID` int(11) NOT NULL,
  `sType` enum('Help','Bug','General') NOT NULL,
  `idUserCreated` bigint(20) NOT NULL,
  `idItem` bigint(20) DEFAULT NULL,
  `sLastActivityDate` datetime NOT NULL,
  `sTitle` varchar(200) DEFAULT NULL,
  `bAdminHelpAsked` tinyint(1) NOT NULL DEFAULT '0',
  `bHidden` tinyint(1) NOT NULL DEFAULT '0',
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_users` (
`historyID` bigint(20) NOT NULL,
  `ID` int(11) NOT NULL,
  `sLogin` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `sOpenIdIdentity` varchar(255) DEFAULT NULL COMMENT 'User''s Open Id Identity',
  `sPasswordMd5` varchar(100) DEFAULT NULL,
  `sSalt` varchar(32) NOT NULL,
  `sRecover` varchar(50) NOT NULL,
  `sRegistrationDate` datetime DEFAULT NULL,
  `sEmail` varchar(100) DEFAULT NULL,
  `bEmailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `sFirstName` varchar(100) DEFAULT NULL COMMENT 'User''s first name',
  `sLastName` varchar(100) DEFAULT NULL COMMENT 'User''s last name',
  `sStudentId` text,
  `sCountryCode` char(3) NOT NULL DEFAULT '',
  `sTimeZone` varchar(100) NOT NULL,
  `sBirthDate` date DEFAULT NULL COMMENT 'User''s birth date',
  `iGraduationYear` int(11) NOT NULL DEFAULT '0' COMMENT 'User''s high school graduation year',
  `sSex` enum('Male','Female') DEFAULT NULL,
  `sAddress` mediumtext NOT NULL COMMENT 'User''s address',
  `sZipcode` longtext NOT NULL COMMENT 'User''s postal code',
  `sCity` longtext NOT NULL COMMENT 'User''s city',
  `sLandLineNumber` longtext NOT NULL COMMENT 'User''s phone number',
  `sCellPhoneNumber` longtext NOT NULL COMMENT 'User''s mobil phone number',
  `sDefaultLanguage` char(3) NOT NULL DEFAULT 'fr' COMMENT 'User''s default language',
  `bNotifyNews` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'TODO',
  `sNotify` enum('Never','Answers','Concerned') NOT NULL DEFAULT 'Answers',
  `bPublicFirstName` tinyint(4) NOT NULL COMMENT 'Publicly show user''s first name',
  `bPublicLastName` tinyint(4) NOT NULL COMMENT 'Publicly show user''s first name',
  `sFreeText` mediumtext NOT NULL,
  `sWebSite` varchar(100) NOT NULL,
  `bPhotoAutoload` tinyint(1) NOT NULL DEFAULT '0',
  `sLangProg` varchar(30) DEFAULT 'Python',
  `sLastLoginDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `sLastActivityDate` datetime DEFAULT NULL COMMENT 'User''s last activity time on the website',
  `sLastIP` varchar(16) NOT NULL,
  `bBasicEditorMode` tinyint(4) NOT NULL DEFAULT '1',
  `nbSpacesForTab` int(11) NOT NULL DEFAULT '3',
  `iMemberState` tinyint(4) NOT NULL DEFAULT '0',
  `idUserGodfather` int(11) DEFAULT NULL,
  `iStepLevelInSite` int(11) NOT NULL COMMENT 'User''s level',
  `bIsAdmin` tinyint(4) NOT NULL DEFAULT '0',
  `bNoRanking` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'TODO',
  `nbHelpGiven` int(11) NOT NULL COMMENT 'TODO',
  `idGroupSelf` bigint(20) NOT NULL,
  `idGroupOwned` bigint(20) DEFAULT NULL,
  `idGroupAccess` bigint(20) NOT NULL,
  `sNotificationReadDate` datetime DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_users_answers` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `sName` int(50) DEFAULT NULL,
  `sAnswer` mediumtext NOT NULL,
  `sLangProg` varchar(50) DEFAULT NULL,
  `sSubmissionDate` datetime NOT NULL,
  `iScore` float DEFAULT NULL,
  `bValidated` tinyint(1) DEFAULT NULL,
  `sGradingDate` datetime DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_users_items` (
`historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `iScore` float NOT NULL DEFAULT '0',
  `iScoreComputed` float NOT NULL DEFAULT '0',
  `iScoreDiffManual` float NOT NULL DEFAULT '0',
  `sScoreDiffComment` varchar(200) NOT NULL,
  `nbSubmissionsAttempts` int(11) NOT NULL,
  `nbTasksTried` int(11) NOT NULL,
  `nbTasksSolved` int(11) NOT NULL,
  `nbChildrenValidated` int(11) NOT NULL,
  `bValidated` int(11) NOT NULL,
  `bFinished` int(11) NOT NULL,
  `nbTasksWithHelp` int(11) NOT NULL,
  `nbHintsCached` int(11) NOT NULL,
  `nbCorrectionsRead` int(11) NOT NULL,
  `iPrecision` int(11) NOT NULL,
  `iAutonomy` int(11) NOT NULL,
  `sStartDate` datetime DEFAULT NULL,
  `sValidationDate` datetime DEFAULT NULL,
  `sFinishDate` datetime DEFAULT NULL,
  `sLastActivityDate` datetime DEFAULT NULL,
  `sThreadStartDate` datetime DEFAULT NULL,
  `sLastAnswerDate` datetime DEFAULT NULL,
  `sLastHintDate` datetime DEFAULT NULL,
  `sAdditionalTime` datetime DEFAULT NULL,
  `sContestStartDate` datetime DEFAULT NULL,
  `bRanked` tinyint(1) NOT NULL,
  `sAllLangProg` varchar(200) NOT NULL,
  `sState` mediumtext,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_users_threads` (
`history_ID` int(11) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `idThread` bigint(20) NOT NULL,
  `sLastReadDate` datetime DEFAULT NULL,
  `bParticipated` tinyint(1) NOT NULL DEFAULT '0',
  `sLastWriteDate` datetime DEFAULT NULL,
  `bStarred` tinyint(1) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL,
  `iNextVersion` bigint(20) DEFAULT NULL,
  `bDeleted` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `items` (
  `ID` bigint(20) NOT NULL,
  `sUrl` varchar(200) DEFAULT NULL,
  `idPlatform` int(11) DEFAULT NULL,
  `sTextId` varchar(200) NOT NULL,
  `sType` enum('Root','CustomProgressRoot','OfficialProgressRoot','CustomContestRoot','OfficialContestRoot','DomainRoot','Category','Level','Chapter','GenericChapter','StaticChapter','Section','Task','Course','ContestChapter','LimitedTimeChapter','Presentation') NOT NULL,
  `bUsesAPI` tinyint(1) NOT NULL DEFAULT '1',
  `sFullScreen` enum('forceYes','forceNo','default','') NOT NULL DEFAULT 'default',
  `bShowDifficulty` tinyint(1) NOT NULL DEFAULT '0',
  `bShowSource` tinyint(1) NOT NULL DEFAULT '0',
  `bHintsAllowed` tinyint(1) NOT NULL DEFAULT '0',
  `sValidationType` enum('None','All','AllButOne','Categories','One','Manual') NOT NULL DEFAULT 'All',
  `iValidationMin` int(11) DEFAULT NULL,
  `sPreparationState` enum('NotReady','Reviewing','Ready') NOT NULL DEFAULT 'NotReady',
  `idItemUnlocked` bigint(20) DEFAULT NULL,
  `sSupportedLangProg` varchar(200) DEFAULT NULL,
  `sAccessOpenDate` datetime DEFAULT NULL,
  `sDuration` time DEFAULT NULL,
  `sEndContestDate` datetime DEFAULT NULL,
  `bShowUserInfos` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'always show user infos in title bar of all descendants',
  `sContestPhase` enum('Running','Analysis','Closed') NOT NULL,
  `iLevel` int(11) DEFAULT NULL,
  `bNoScore` tinyint(1) NOT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `items_ancestors` (
`ID` bigint(20) NOT NULL,
  `idItemAncestor` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `items_items` (
  `ID` bigint(20) NOT NULL,
  `idItemParent` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `iChildOrder` int(11) NOT NULL,
  `sCategory` enum('Undefined','Discovery','Application','Validation','Challenge') NOT NULL DEFAULT 'Undefined',
  `bAlwaysVisible` tinyint(1) NOT NULL DEFAULT '0',
  `bAccessRestricted` tinyint(1) NOT NULL DEFAULT '1',
  `iDifficulty` int(11) NOT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `items_propagate` (
  `ID` bigint(20) NOT NULL,
  `sAncestorsComputationState` enum('todo','done','processing','') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `items_strings` (
  `ID` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `idLanguage` bigint(20) NOT NULL,
  `sTranslator` varchar(100) NOT NULL,
  `sTitle` varchar(200) NOT NULL,
  `sImageUrl` varchar(100) DEFAULT NULL,
  `sSubtitle` varchar(200) NOT NULL,
  `sDescription` text NOT NULL,
  `sEduComment` text NOT NULL,
  `sRankingComment` text NOT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `languages` (
  `ID` bigint(20) NOT NULL,
  `sName` varchar(100) NOT NULL,
  `sCode` varchar(2) NOT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `messages` (
  `ID` bigint(20) NOT NULL,
  `idThread` bigint(20) DEFAULT NULL,
  `idUser` bigint(20) DEFAULT NULL,
  `sSubmissionDate` datetime DEFAULT NULL,
  `bPublished` tinyint(1) NOT NULL DEFAULT '1',
  `sTitle` varchar(200) DEFAULT '',
  `sBody` varchar(2000) DEFAULT '',
  `bTrainersOnly` tinyint(1) NOT NULL DEFAULT '0',
  `bArchived` tinyint(1) DEFAULT '0',
  `bPersistant` tinyint(1) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `platforms` (
`ID` int(11) NOT NULL,
  `sUri` varchar(50) NOT NULL,
  `sPublicKey` varchar(512) NOT NULL,
  `bUsesTokens` tinyint(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `synchro_version` (
  `ID` tinyint(1) NOT NULL,
  `iVersion` int(11) NOT NULL,
  `iLastServerVersion` int(11) NOT NULL,
  `iLastClientVersion` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `test_items_ancestors` (
`ID` bigint(20) NOT NULL,
  `idItemAncestor` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `test_items_propagate` (
  `ID` bigint(20) NOT NULL,
  `sAncestorsComputationState` enum('todo','done','processing') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `threads` (
  `ID` bigint(20) NOT NULL,
  `sType` enum('Help','Bug','General') NOT NULL,
  `sLastActivityDate` datetime DEFAULT NULL,
  `idUserCreated` bigint(20) NOT NULL,
  `idItem` bigint(20) DEFAULT NULL,
  `sTitle` varchar(200) DEFAULT NULL,
  `bAdminHelpAsked` tinyint(1) NOT NULL DEFAULT '0',
  `bHidden` tinyint(1) NOT NULL DEFAULT '0',
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `tmp__tm_submissions` (
  `iScore` int(11) NOT NULL DEFAULT '0',
  `idUserAnswer` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `users` (
  `ID` bigint(20) NOT NULL,
  `loginID` bigint(20) DEFAULT NULL COMMENT 'the ''userId'' returned by login platform',
  `tempUser` tinyint(1) NOT NULL,
  `sLogin` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `sOpenIdIdentity` varchar(255) DEFAULT NULL COMMENT 'User''s Open Id Identity',
  `sPasswordMd5` varchar(100) DEFAULT NULL,
  `sSalt` varchar(32) NOT NULL,
  `sRecover` varchar(50) NOT NULL,
  `sRegistrationDate` datetime DEFAULT NULL,
  `sEmail` varchar(100) DEFAULT NULL,
  `bEmailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `sFirstName` varchar(100) DEFAULT NULL COMMENT 'User''s first name',
  `sLastName` varchar(100) DEFAULT NULL COMMENT 'User''s last name',
  `sStudentId` text,
  `sCountryCode` char(3) NOT NULL DEFAULT '',
  `sTimeZone` varchar(100) NOT NULL,
  `sBirthDate` date DEFAULT NULL COMMENT 'User''s birth date',
  `iGraduationYear` int(11) NOT NULL DEFAULT '0' COMMENT 'User''s high school graduation year',
  `sSex` enum('Male','Female') DEFAULT NULL,
  `sAddress` mediumtext NOT NULL COMMENT 'User''s address',
  `sZipcode` longtext NOT NULL COMMENT 'User''s postal code',
  `sCity` longtext NOT NULL COMMENT 'User''s city',
  `sLandLineNumber` longtext NOT NULL COMMENT 'User''s phone number',
  `sCellPhoneNumber` longtext NOT NULL COMMENT 'User''s mobil phone number',
  `sDefaultLanguage` char(3) NOT NULL DEFAULT 'fr' COMMENT 'User''s default language',
  `bNotifyNews` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'TODO',
  `sNotify` enum('Never','Answers','Concerned') NOT NULL DEFAULT 'Answers',
  `bPublicFirstName` tinyint(4) NOT NULL COMMENT 'Publicly show user''s first name',
  `bPublicLastName` tinyint(4) NOT NULL COMMENT 'Publicly show user''s first name',
  `sFreeText` mediumtext NOT NULL,
  `sWebSite` varchar(100) NOT NULL,
  `bPhotoAutoload` tinyint(1) NOT NULL DEFAULT '0',
  `sLangProg` varchar(30) DEFAULT 'Python',
  `sLastLoginDate` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `sLastActivityDate` datetime DEFAULT NULL COMMENT 'User''s last activity time on the website',
  `sLastIP` varchar(16) NOT NULL,
  `bBasicEditorMode` tinyint(4) NOT NULL DEFAULT '1',
  `nbSpacesForTab` int(11) NOT NULL DEFAULT '3',
  `iMemberState` tinyint(4) NOT NULL DEFAULT '0',
  `idUserGodfather` int(11) DEFAULT NULL,
  `iStepLevelInSite` int(11) NOT NULL COMMENT 'User''s level',
  `bIsAdmin` tinyint(4) NOT NULL DEFAULT '0',
  `bNoRanking` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'TODO',
  `nbHelpGiven` int(11) NOT NULL COMMENT 'TODO',
  `idGroupSelf` bigint(20) NOT NULL,
  `idGroupOwned` bigint(20) DEFAULT NULL,
  `idGroupAccess` bigint(20) NOT NULL,
  `sNotificationReadDate` datetime DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `users_answers` (
`ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `sName` int(50) DEFAULT NULL,
  `sAnswer` mediumtext NOT NULL,
  `sLangProg` varchar(50) DEFAULT NULL,
  `sSubmissionDate` datetime NOT NULL,
  `iScore` float DEFAULT NULL,
  `bValidated` tinyint(1) DEFAULT NULL,
  `sGradingDate` datetime DEFAULT NULL,
  `idUserGrader` int(11) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `users_items` (
`ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `iScore` float NOT NULL DEFAULT '0',
  `iScoreComputed` float NOT NULL DEFAULT '0',
  `iScoreDiffManual` float NOT NULL DEFAULT '0',
  `sScoreDiffComment` varchar(200) NOT NULL DEFAULT '',
  `nbSubmissionsAttempts` int(11) NOT NULL DEFAULT '0',
  `nbTasksTried` int(11) NOT NULL DEFAULT '0',
  `nbTasksSolved` int(11) NOT NULL DEFAULT '0',
  `nbChildrenValidated` int(11) NOT NULL DEFAULT '0',
  `bValidated` tinyint(1) NOT NULL DEFAULT '0',
  `bFinished` tinyint(1) NOT NULL DEFAULT '0',
  `nbTasksWithHelp` int(11) NOT NULL DEFAULT '0',
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
  `sAllLangProg` varchar(200) NOT NULL,
  `iVersion` bigint(20) NOT NULL,
  `sAncestorsComputationState` enum('done','processing','todo','temp') NOT NULL DEFAULT 'done',
  `sState` mediumtext,
  `sToken` varchar(1) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `users_threads` (
  `ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `idThread` bigint(20) NOT NULL,
  `sLastReadDate` datetime DEFAULT NULL,
  `bParticipated` tinyint(1) NOT NULL DEFAULT '0',
  `sLastWriteDate` datetime DEFAULT NULL,
  `bStarred` tinyint(1) DEFAULT NULL,
  `iVersion` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `schema_revision` (
  `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `executed_at` timestamp NOT NULL,
  `file` varchar(255) NOT NULL
) ENGINE='InnoDB' DEFAULT CHARSET=utf8;


ALTER TABLE `filters`
 ADD PRIMARY KEY (`ID`), ADD KEY `user_idx` (`idUser`), ADD KEY `iVersion` (`iVersion`);

ALTER TABLE `groups`
 ADD PRIMARY KEY (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `bAncestorsComputed` (`sAncestorsComputationState`);

ALTER TABLE `groups_ancestors`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `idGroupAncestor` (`idGroupAncestor`,`idGroupChild`), ADD KEY `ancestor` (`idGroupAncestor`), ADD KEY `descendant` (`idGroupChild`);

ALTER TABLE `groups_groups`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `parentchild` (`idGroupParent`,`idGroupChild`), ADD KEY `iVersion` (`iVersion`), ADD KEY `idGroupChild` (`idGroupChild`), ADD KEY `idGroupParent` (`idGroupParent`);

ALTER TABLE `groups_items`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `idItem` (`idItem`,`idGroup`), ADD KEY `iVersion` (`iVersion`), ADD KEY `idGroup` (`idGroup`) COMMENT 'idGroup', ADD KEY `idItemtem` (`idItem`);

ALTER TABLE `groups_items_propagate`
 ADD PRIMARY KEY (`ID`), ADD KEY `sPropagateAccess` (`sPropagateAccess`);

ALTER TABLE `groups_propagate`
 ADD PRIMARY KEY (`ID`), ADD KEY `sAncestorsComputationState` (`sAncestorsComputationState`);

ALTER TABLE `history_filters`
 ADD PRIMARY KEY (`history_ID`), ADD KEY `user_idx` (`idUser`), ADD KEY `iVersion` (`iVersion`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `ID` (`ID`);

ALTER TABLE `history_groups`
 ADD PRIMARY KEY (`historyID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `ID` (`ID`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`);

ALTER TABLE `history_groups_ancestors`
 ADD PRIMARY KEY (`historyID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `idGroupAncestor` (`idGroupAncestor`,`idGroupChild`), ADD KEY `ancestor` (`idGroupAncestor`), ADD KEY `descendant` (`idGroupChild`), ADD KEY `ID` (`ID`);

ALTER TABLE `history_groups_groups`
 ADD PRIMARY KEY (`historyID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `ID` (`ID`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`);

ALTER TABLE `history_groups_items`
 ADD PRIMARY KEY (`historyID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `ID` (`ID`), ADD KEY `itemGroup` (`idItem`,`idGroup`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `idItem` (`idItem`), ADD KEY `idGroup` (`idGroup`);

ALTER TABLE `history_items`
 ADD PRIMARY KEY (`historyID`), ADD KEY `ID` (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`);

ALTER TABLE `history_items_ancestors`
 ADD PRIMARY KEY (`historyID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `idItemAncestor` (`idItemAncestor`,`idItemChild`), ADD KEY `idItemAncestortor` (`idItemAncestor`), ADD KEY `idItemChild` (`idItemChild`), ADD KEY `ID` (`ID`);

ALTER TABLE `history_items_items`
 ADD PRIMARY KEY (`historyID`), ADD KEY `ID` (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `idItemParent` (`idItemParent`), ADD KEY `idItemChild` (`idItemChild`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `parentChild` (`idItemParent`,`idItemChild`);

ALTER TABLE `history_items_strings`
 ADD PRIMARY KEY (`historyID`), ADD KEY `ID` (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `itemLanguage` (`idItem`,`idLanguage`), ADD KEY `idItem` (`idItem`);

ALTER TABLE `history_languages`
 ADD PRIMARY KEY (`historyID`), ADD KEY `ID` (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `sCode` (`sCode`);

ALTER TABLE `history_messages`
 ADD PRIMARY KEY (`history_ID`), ADD KEY `thread` (`idThread`), ADD KEY `iVersion` (`iVersion`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `ID` (`ID`);

ALTER TABLE `history_threads`
 ADD PRIMARY KEY (`history_ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `ID` (`ID`);

ALTER TABLE `history_users`
 ADD PRIMARY KEY (`historyID`), ADD KEY `ID` (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `sCountryCode` (`sCountryCode`), ADD KEY `idUserGodfather` (`idUserGodfather`), ADD KEY `sLangProg` (`sLangProg`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `idGroupSelf` (`idGroupSelf`), ADD KEY `idGroupOwned` (`idGroupOwned`);

ALTER TABLE `history_users_answers`
 ADD PRIMARY KEY (`historyID`), ADD KEY `idUser` (`idUser`), ADD KEY `ID` (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `iNextVersion` (`iNextVersion`);

ALTER TABLE `history_users_items`
 ADD PRIMARY KEY (`historyID`), ADD KEY `ID` (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `itemUser` (`idItem`,`idUser`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `idItem` (`idItem`), ADD KEY `idUser` (`idUser`);

ALTER TABLE `history_users_threads`
 ADD PRIMARY KEY (`history_ID`), ADD KEY `userThread` (`idUser`,`idThread`), ADD KEY `user` (`idUser`), ADD KEY `iVersion` (`iVersion`), ADD KEY `iNextVersion` (`iNextVersion`), ADD KEY `bDeleted` (`bDeleted`), ADD KEY `ID` (`ID`);

ALTER TABLE `items`
 ADD PRIMARY KEY (`ID`), ADD KEY `iVersion` (`iVersion`);

ALTER TABLE `items_ancestors`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `idItemAncestor` (`idItemAncestor`,`idItemChild`), ADD KEY `idItemAncestortor` (`idItemAncestor`), ADD KEY `idItemChild` (`idItemChild`);

ALTER TABLE `items_items`
 ADD PRIMARY KEY (`ID`), ADD KEY `idItemParent` (`idItemParent`), ADD KEY `idItemChild` (`idItemChild`), ADD KEY `iVersion` (`iVersion`), ADD KEY `parentChild` (`idItemParent`,`idItemChild`), ADD KEY `parentVersion` (`idItemParent`,`iVersion`);

ALTER TABLE `items_propagate`
 ADD PRIMARY KEY (`ID`), ADD KEY `sAncestorsComputationDate` (`sAncestorsComputationState`);

ALTER TABLE `items_strings`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `idItem` (`idItem`,`idLanguage`), ADD KEY `iVersion` (`iVersion`), ADD KEY `idItemAlone` (`idItem`);

ALTER TABLE `languages`
 ADD PRIMARY KEY (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `sCode` (`sCode`);

ALTER TABLE `messages`
 ADD PRIMARY KEY (`ID`), ADD KEY `iVersion` (`iVersion`), ADD KEY `idThread` (`idThread`);

ALTER TABLE `platforms`
 ADD PRIMARY KEY (`ID`);

ALTER TABLE `synchro_version`
 ADD PRIMARY KEY (`ID`), ADD KEY `iVersion` (`iVersion`);

ALTER TABLE `test_items_ancestors`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `idItemAncestor` (`idItemAncestor`,`idItemChild`), ADD KEY `idItemAncestortor` (`idItemAncestor`), ADD KEY `idItemChild` (`idItemChild`);

ALTER TABLE `test_items_propagate`
 ADD PRIMARY KEY (`ID`), ADD KEY `sAncestorsComputationDate` (`sAncestorsComputationState`);

ALTER TABLE `threads`
 ADD PRIMARY KEY (`ID`), ADD KEY `iVersion` (`iVersion`);

ALTER TABLE `tmp__tm_submissions`
 ADD KEY `idUserAnswer` (`idUserAnswer`);

ALTER TABLE `users`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `sLogin` (`sLogin`), ADD UNIQUE KEY `idGroupSelf` (`idGroupSelf`), ADD UNIQUE KEY `idGroupOwned` (`idGroupOwned`), ADD KEY `iVersion` (`iVersion`), ADD KEY `sCountryCode` (`sCountryCode`), ADD KEY `idUserGodfather` (`idUserGodfather`), ADD KEY `sLangProg` (`sLangProg`);

ALTER TABLE `users_answers`
 ADD PRIMARY KEY (`ID`), ADD KEY `idUser` (`idUser`);

ALTER TABLE `users_items`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `UserItem` (`idUser`,`idItem`), ADD KEY `iVersion` (`iVersion`), ADD KEY `sAncestorsComputationState` (`sAncestorsComputationState`), ADD KEY `idItem` (`idItem`), ADD KEY `idUser` (`idUser`);

ALTER TABLE `users_threads`
 ADD PRIMARY KEY (`ID`), ADD UNIQUE KEY `userThread` (`idUser`,`idThread`), ADD KEY `users_idx` (`idUser`), ADD KEY `iVersion` (`iVersion`);


ALTER TABLE `groups_ancestors`
MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `groups_groups`
MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_filters`
MODIFY `history_ID` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_groups`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_groups_ancestors`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_groups_groups`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_groups_items`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_items`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_items_ancestors`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_items_items`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_items_strings`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_languages`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_messages`
MODIFY `history_ID` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_threads`
MODIFY `history_ID` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_users`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_users_answers`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_users_items`
MODIFY `historyID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `history_users_threads`
MODIFY `history_ID` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `items_ancestors`
MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `platforms`
MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `test_items_ancestors`
MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_answers`
MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;
ALTER TABLE `users_items`
MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;