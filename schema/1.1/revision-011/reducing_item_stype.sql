ALTER TABLE `items` ADD `bTitleBarVisible` tinyint unsigned NOT NULL DEFAULT '1' AFTER `sType`;
ALTER TABLE `history_items` ADD `bTitleBarVisible` tinyint unsigned NOT NULL DEFAULT '1' AFTER `sType`;
update `items` set bTitleBarVisible = 0, sType = 'Course' where sType = 'Presentation';

ALTER TABLE `items` ADD `bTransparentFolder` tinyint unsigned NOT NULL DEFAULT '0' AFTER `bTitleBarVisible`;
ALTER TABLE `history_items` ADD `bTransparentFolder` tinyint unsigned NOT NULL DEFAULT '0' AFTER `bTitleBarVisible`;
update `items` set bTransparentFolder =1 where sType = 'Section';

ALTER TABLE `items` ADD `bDisplayDetailsInParent` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'when true, display a large icon, the subtitle, and more within the parent chapter' AFTER `bTransparentFolder`;
ALTER TABLE `history_items` ADD `bDisplayDetailsInParent` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'when true, display a large icon, the subtitle, and more within the parent chapter' AFTER `bTransparentFolder`;
update `items` set bDisplayDetailsInParent = 1 where sType = 'Level';


update `items` set sType = 'Chapter'
where
    sType = 'Level' OR
    sType = 'Section' OR
    sType = 'Category' OR
    sType = 'GenericChapter' OR
    sType = 'StaticChapter' OR
    sType = 'ContestChapter' OR
    sType = 'LimitedTimeChapter';



ALTER TABLE `items` ADD `bCustomChapter` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'true if this is a chapter where users can add their own content. access to this chapter will not be propagated to its children' AFTER `bDisplayDetailsInParent`;
ALTER TABLE `history_items` ADD `bCustomChapter` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'true if this is a chapter where users can add their own content. access to this chapter will not be propagated to its children' AFTER `bDisplayDetailsInParent`;
ALTER TABLE `items` ADD `bDisplayChildrenAsTabs` tinyint unsigned NOT NULL DEFAULT '0'  AFTER `bCustomChapter`;
ALTER TABLE `history_items` ADD `bDisplayChildrenAsTabs` tinyint unsigned NOT NULL DEFAULT '0'  AFTER `bCustomChapter`;


update `items` set bCustomChapter =1
where
    sType = 'CustomProgressRoot' OR
    sType = 'CustomContestRoot';

update `items` set sType = 'Chapter', bDisplayChildrenAsTabs = 1
where
    sType = 'CustomProgressRoot' OR
    sType = 'OfficialProgressRoot' OR
    sType = 'CustomContestRoot' OR
    sType = 'OfficialContestRoot' OR
    sType = 'DomainRoot';



ALTER TABLE `items` CHANGE `sType` `sType` enum('Root','Category','Chapter','Task','Course') COLLATE 'utf8_general_ci' NOT NULL AFTER `sTextId`;