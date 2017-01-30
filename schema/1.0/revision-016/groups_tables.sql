-- phpMyAdmin SQL Dump
-- version 3.5.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Aug 14, 2013 at 05:01 PM
-- Server version: 5.5.24-log
-- PHP Version: 5.4.3

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `franceioi_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE IF NOT EXISTS `groups` (
  `ID` bigint(20) NOT NULL,
  `sName` varchar(200) NOT NULL,
  `sDescription` text NOT NULL,
  `sDateCreated` datetime NOT NULL,
  `bOpened` tinyint(1) NOT NULL,
  `bFreeAccess` tinyint(1) NOT NULL,
  `sPassword` varchar(50) NOT NULL,
  `sType` enum('Class','Club','Friends','Other') NOT NULL,
  `bSendEmails` tinyint(1) NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `groups_groups`
--

CREATE TABLE IF NOT EXISTS `groups_groups` (
  `ID` bigint(20) NOT NULL,
  `idGroupParent` bigint(20) NOT NULL,
  `idGroupChild` bigint(20) NOT NULL,
  `iChildOrder` int(11) NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `groups_items`
--

CREATE TABLE IF NOT EXISTS `groups_items` (
  `ID` bigint(20) NOT NULL,
  `idUserCreated` bigint(20) NOT NULL,
  `sAccessMode` enum('Default','Full','Partial') NOT NULL,
  `sAccessReason` varchar(200) NOT NULL,
  `sAccessOpenDate` datetime NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `groups_owners`
--

CREATE TABLE IF NOT EXISTS `groups_owners` (
  `ID` bigint(20) NOT NULL,
  `idGroup` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `sDateAdded` datetime NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `history_groups`
--

CREATE TABLE IF NOT EXISTS `history_groups` (
  `historyID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ID` bigint(20) NOT NULL,
  `sName` varchar(200) NOT NULL,
  `sDescription` text NOT NULL,
  `sDateCreated` datetime NOT NULL,
  `bOpened` tinyint(1) NOT NULL,
  `bFreeAccess` tinyint(1) NOT NULL,
  `sPassword` varchar(50) NOT NULL,
  `sType` enum('Class','Club','Friends','Other') NOT NULL,
  `bSendEmails` tinyint(1) NOT NULL,
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`historyID`),
  KEY `iVersion` (`iVersion`),
  KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `history_groups_groups`
--

CREATE TABLE IF NOT EXISTS `history_groups_groups` (
  `historyID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ID` bigint(20) NOT NULL,
  `idGroupParent` bigint(20) NOT NULL,
  `idGroupChild` bigint(20) NOT NULL,
  `iChildOrder` int(11) NOT NULL,
  `iVersion` int(11) NOT NULL,
  `iNextVersion` int(11) NOT NULL,
  `bDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`historyID`),
  KEY `iVersion` (`iVersion`),
  KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `history_groups_items`
--

CREATE TABLE IF NOT EXISTS `history_groups_items` (
  `historyID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ID` bigint(20) NOT NULL,
  `idUserCreated` bigint(20) NOT NULL,
  `sAccessMode` enum('Default','Full','Partial') NOT NULL,
  `sAccessReason` varchar(200) NOT NULL,
  `sAccessOpenDate` datetime NOT NULL,
  `iVersion` int(11) NOT NULL,
  `iNextVersion` int(11) NOT NULL,
  `bDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`historyID`),
  KEY `iVersion` (`iVersion`),
  KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `history_groups_owners`
--

CREATE TABLE IF NOT EXISTS `history_groups_owners` (
  `historyID` bigint(20) NOT NULL AUTO_INCREMENT,
  `ID` bigint(20) NOT NULL,
  `idGroup` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `sDateAdded` datetime NOT NULL,
  `iVersion` int(11) NOT NULL,
  `iNextVersion` int(11) NOT NULL,
  `bDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`historyID`),
  KEY `iVersion` (`iVersion`),
  KEY `ID` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
