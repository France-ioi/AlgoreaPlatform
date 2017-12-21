ALTER TABLE `items`
CHANGE `idDefaultLanguage` `idDefaultLanguage` bigint(20) NULL DEFAULT '1' AFTER `sSupportedLangProg`;

ALTER TABLE `history_items`
CHANGE `idDefaultLanguage` `idDefaultLanguage` bigint(20) NULL DEFAULT '1' AFTER `sSupportedLangProg`;

ALTER TABLE `groups_items`
CHANGE `sAccessReason` `sAccessReason` varchar(200) COLLATE 'utf8_general_ci' NULL AFTER `sPartialAccessDate`;

ALTER TABLE `history_groups_items`
CHANGE `sAccessReason` `sAccessReason` varchar(200) COLLATE 'utf8_general_ci' NULL AFTER `sPartialAccessDate`;