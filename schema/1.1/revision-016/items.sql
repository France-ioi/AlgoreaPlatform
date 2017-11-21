ALTER TABLE `items`
CHANGE `bCustomChapter` `bCustomChapter` tinyint(3) unsigned NULL DEFAULT '0' COMMENT 'true if this is a chapter where users can add their own content. access to this chapter will not be propagated to its children' AFTER `bDisplayDetailsInParent`;

ALTER TABLE `history_items`
CHANGE `bCustomChapter` `bCustomChapter` tinyint(3) unsigned NULL DEFAULT '0' COMMENT 'true if this is a chapter where users can add their own content. access to this chapter will not be propagated to its children' AFTER `bDisplayDetailsInParent`;

ALTER TABLE `items`
CHANGE `idDefaultLanguage` `idDefaultLanguage` bigint(20) NULL DEFAULT '1' AFTER `sSupportedLangProg`;

ALTER TABLE `history_items`
CHANGE `idDefaultLanguage` `idDefaultLanguage` bigint(20) NULL DEFAULT '1' AFTER `sSupportedLangProg`;
