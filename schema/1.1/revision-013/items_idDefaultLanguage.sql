ALTER TABLE `items` ADD `idDefaultLanguage` BIGINT NOT NULL DEFAULT '1' AFTER `sSupportedLangProg`;
ALTER TABLE `history_items` ADD `idDefaultLanguage` BIGINT NOT NULL DEFAULT '1' AFTER `sSupportedLangProg`;
