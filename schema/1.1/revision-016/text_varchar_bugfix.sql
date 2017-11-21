ALTER TABLE `groups`
CHANGE `sRedirectPath` `sRedirectPath` text NULL AFTER `sPasswordEnd`,
CHANGE `sDescription` `sDescription` text NULL AFTER `sGradeDetails`,
CHANGE `sName` `sName` varchar(200) NOT NULL DEFAULT '' AFTER `ID`;

ALTER TABLE `history_groups`
CHANGE `sRedirectPath` `sRedirectPath` text NULL AFTER `sPasswordEnd`,
CHANGE `sName` `sName` varchar(200) NOT NULL DEFAULT '' AFTER `ID`,
CHANGE `sDescription` `sDescription` text NULL AFTER `sGradeDetails`;



ALTER TABLE `items_strings`
CHANGE `sTranslator` `sTranslator` varchar(100) NULL AFTER `idLanguage`,
CHANGE `sTitle` `sTitle` varchar(200) NOT NULL DEFAULT '' AFTER `sTranslator`,
CHANGE `sSubtitle` `sSubtitle` varchar(200) NULL AFTER `sImageUrl`,
CHANGE `sDescription` `sDescription` text NULL AFTER `sSubtitle`,
CHANGE `sEduComment` `sEduComment` text NULL AFTER `sDescription`,
CHANGE `sRankingComment` `sRankingComment` text NULL AFTER `sEduComment`;

ALTER TABLE `history_items_strings`
CHANGE `sTranslator` `sTranslator` varchar(100) NULL AFTER `idLanguage`,
CHANGE `sTitle` `sTitle` varchar(200) NOT NULL DEFAULT '' AFTER `sTranslator`,
CHANGE `sSubtitle` `sSubtitle` varchar(200) NULL AFTER `sImageUrl`,
CHANGE `sDescription` `sDescription` text NULL AFTER `sSubtitle`,
CHANGE `sEduComment` `sEduComment` text NULL AFTER `sDescription`,
CHANGE `sRankingComment` `sRankingComment` text NULL AFTER `sEduComment`;



ALTER TABLE `filters`
CHANGE `sName` `sName` varchar(45) NOT NULL DEFAULT '' AFTER `idUser`;

ALTER TABLE `history_filters`
CHANGE `sName` `sName` varchar(45) NOT NULL DEFAULT '' AFTER `idUser`;



ALTER TABLE `groups_items`
CHANGE `sAccessReason` `sAccessReason` varchar(200) NULL AFTER `sPartialAccessDate`;

ALTER TABLE `history_groups_items`
CHANGE `sAccessReason` `sAccessReason` varchar(200) NULL AFTER `sPartialAccessDate`;



ALTER TABLE `languages`
CHANGE `sName` `sName` varchar(100) NOT NULL DEFAULT '' AFTER `ID`,
CHANGE `sCode` `sCode` varchar(2) NOT NULL DEFAULT '' AFTER `sName`;

ALTER TABLE `history_languages`
CHANGE `sName` `sName` varchar(100) NOT NULL DEFAULT '' AFTER `ID`,
CHANGE `sCode` `sCode` varchar(2) NOT NULL DEFAULT '' AFTER `sName`;



ALTER TABLE `users_answers`
CHANGE `sAnswer` `sAnswer` mediumtext NULL AFTER `sName`;

ALTER TABLE `history_users_answers`
CHANGE `sAnswer` `sAnswer` mediumtext NULL AFTER `sName`;



ALTER TABLE `users_items`
CHANGE `sAllLangProg` `sAllLangProg` varchar(200) NULL AFTER `bRanked`;

ALTER TABLE `history_users_items`
CHANGE `sScoreDiffComment` `sScoreDiffComment` varchar(200) NULL AFTER `iScoreDiffManual`,
CHANGE `sAllLangProg` `sAllLangProg` varchar(200) NULL AFTER `bRanked`;



ALTER TABLE `items`
CHANGE `sTextId` `sTextId` varchar(200) NULL AFTER `idPlatform`;

ALTER TABLE `history_items`
CHANGE `sTextId` `sTextId` varchar(200) NULL AFTER `idPlatform`;



ALTER TABLE `platforms`
CHANGE `sName` `sName` varchar(50) NOT NULL DEFAULT '' AFTER `ID`,
CHANGE `sPublicKey` `sPublicKey` varchar(512) NOT NULL DEFAULT '' AFTER `sName`,
CHANGE `sRegexp` `sRegexp` text NULL AFTER `bUsesTokens`;



ALTER TABLE `schema_revision`
CHANGE `file` `file` varchar(255) NOT NULL DEFAULT '' AFTER `executed_at`;



ALTER TABLE `users`
CHANGE `sLogin` `sLogin` varchar(100) COLLATE 'utf8_bin' NOT NULL DEFAULT '' AFTER `tempUser`;

ALTER TABLE `history_users`
CHANGE `sLogin` `sLogin` varchar(100) COLLATE 'utf8_bin' NOT NULL DEFAULT '' AFTER `ID`;