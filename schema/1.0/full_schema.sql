-- phpMyAdmin SQL Dump
-- version 3.5.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jul 28, 2013 at 06:25 PM
-- Server version: 5.5.24-log
-- PHP Version: 5.4.3

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `franceioi_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE IF NOT EXISTS `items` (
  `ID` bigint(20) NOT NULL,
  `url` varchar(200) NOT NULL,
  `sTextId` varchar(200) NOT NULL,
  `sType` enum('Category','Level','Chapter','GenericChapter','staticChapter','Section','Task','Course','ContestChapter','LimitedTimeChapter') NOT NULL,
  `bShowDifficulty` tinyint(1) NOT NULL,
  `bShowSource` tinyint(1) NOT NULL,
  `bHintsAllowed` tinyint(1) NOT NULL,
  `bSolutionPublic` tinyint(1) NOT NULL,
  `sValidationType` enum('All','AllButOne','Categories','One') NOT NULL,
  `iValidationMin` int(11) NOT NULL,
  `sAccessType` enum('Public','UnlockableGray','UnlockableHidden','RestrictedGray','RestrictedHidden','RestrictedHiddenNotChecked','RestrictedHiddenNotReady') NOT NULL,
  `idItemUnlocked` bigint(20) NOT NULL,
  `sSupportedLangProg` varchar(200) NOT NULL,
  `sAccessOpenDate` datetime NOT NULL,
  `sDuration` time NOT NULL,
  `sEndContestDate` datetime NOT NULL,
  `sContestPhase` enum('Running','Analysis','Closed') NOT NULL,
  `iLevel` int(11) NOT NULL,
  `bNoScore` tinyint(1) NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `items_items`
--

CREATE TABLE IF NOT EXISTS `items_items` (
  `ID` bigint(20) NOT NULL,
  `idItemParent` bigint(20) NOT NULL,
  `idItemChild` bigint(20) NOT NULL,
  `iChildOrder` int(11) NOT NULL,
  `sCategory` enum('Undefined','Discovery','Application','Validation','Challenge') NOT NULL,
  `iDifficulty` int(11) NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `idItemParent` (`idItemParent`),
  KEY `idItemChild` (`idItemChild`),
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `items_strings`
--

CREATE TABLE IF NOT EXISTS `items_strings` (
  `ID` bigint(20) NOT NULL,
  `idItem` bigint(20) NOT NULL,
  `idLanguage` bigint(20) NOT NULL,
  `sTranslator` varchar(100) NOT NULL,
  `sTitle` varchar(200) NOT NULL,
  `sSubtitle` varchar(200) NOT NULL,
  `sDescription` text NOT NULL,
  `sEduComment` text NOT NULL,
  `sRankingComment` text NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `idItem` (`idItem`,`idLanguage`),
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `languages`
--

CREATE TABLE IF NOT EXISTS `languages` (
  `ID` bigint(20) NOT NULL,
  `sName` varchar(100) NOT NULL,
  `sCode` varchar(2) NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `iVersion` (`iVersion`),
  KEY `sCode` (`sCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
