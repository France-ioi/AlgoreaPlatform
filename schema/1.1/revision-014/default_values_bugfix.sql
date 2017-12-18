ALTER TABLE `items_strings`
CHANGE `sTranslator` `sTranslator` varchar(100) COLLATE 'utf8_general_ci' NULL AFTER `idLanguage`,
CHANGE `sTitle` `sTitle` varchar(200) COLLATE 'utf8_general_ci' NULL AFTER `sTranslator`,
CHANGE `sSubtitle` `sSubtitle` varchar(200) COLLATE 'utf8_general_ci' NULL AFTER `sImageUrl`,
CHANGE `sDescription` `sDescription` text COLLATE 'utf8_general_ci' NULL AFTER `sSubtitle`,
CHANGE `sEduComment` `sEduComment` text COLLATE 'utf8_general_ci' NULL AFTER `sDescription`,
CHANGE `sRankingComment` `sRankingComment` text COLLATE 'utf8_general_ci' NULL AFTER `sEduComment`;

ALTER TABLE `history_items_strings`
CHANGE `sTranslator` `sTranslator` varchar(100) COLLATE 'utf8_general_ci' NULL AFTER `idLanguage`,
CHANGE `sTitle` `sTitle` varchar(200) COLLATE 'utf8_general_ci' NULL AFTER `sTranslator`,
CHANGE `sSubtitle` `sSubtitle` varchar(200) COLLATE 'utf8_general_ci' NULL AFTER `sImageUrl`,
CHANGE `sDescription` `sDescription` text COLLATE 'utf8_general_ci' NULL AFTER `sSubtitle`,
CHANGE `sEduComment` `sEduComment` text COLLATE 'utf8_general_ci' NULL AFTER `sDescription`,
CHANGE `sRankingComment` `sRankingComment` text COLLATE 'utf8_general_ci' NULL AFTER `sEduComment`;

ALTER TABLE `items`
CHANGE `sTextId` `sTextId` varchar(200) NULL AFTER `idPlatform`;

ALTER TABLE `history_items`
CHANGE `sTextId` `sTextId` varchar(200) NULL AFTER `idPlatform`;

ALTER TABLE `items`
CHANGE `bCustomChapter` `bCustomChapter` tinyint(3) unsigned NULL DEFAULT '0' COMMENT 'true if this is a chapter where users can add their own content. access to this chapter will not be propagated to its children' AFTER `bDisplayDetailsInParent`;
ALTER TABLE `history_items`
CHANGE `bCustomChapter` `bCustomChapter` tinyint(3) unsigned NULL DEFAULT '0' COMMENT 'true if this is a chapter where users can add their own content. access to this chapter will not be propagated to its children' AFTER `bDisplayDetailsInParent`;


ALTER TABLE `groups`
CHANGE `sDescription` `sDescription` text COLLATE 'utf8_general_ci' NULL AFTER `sGradeDetails`;
ALTER TABLE `history_groups`
CHANGE `sDescription` `sDescription` text COLLATE 'utf8_general_ci' NULL AFTER `sGradeDetails`;