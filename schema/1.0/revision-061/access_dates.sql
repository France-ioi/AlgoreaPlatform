ALTER TABLE  `groups_items` CHANGE  `sAccessOpenDate`  `sFullAccessDate` DATETIME NULL;
ALTER TABLE  `history_groups_items` CHANGE  `sAccessOpenDate`  `sFullAccessDate` DATETIME NULL;

ALTER TABLE  `groups_items` CHANGE  `sAccessMode`  `sPartialAccessDate` DATETIME NULL DEFAULT NULL;
ALTER TABLE  `history_groups_items` CHANGE  `sAccessMode`  `sPartialAccessDate` DATETIME NULL DEFAULT NULL;

ALTER TABLE  `groups_items` CHANGE  `sAccessOpenDateAncestors`  `sFullAccessDateAncestors` DATETIME NULL;
ALTER TABLE  `history_groups_items` CHANGE  `sAccessOpenDateAncestors`  `sFullAccessDateAncestors` DATETIME NULL;

ALTER TABLE  `groups_items` CHANGE  `sAccessModeAncestors`  `sPartialAccessDateAncestors` DATETIME NULL DEFAULT NULL;
ALTER TABLE  `history_groups_items` CHANGE  `sAccessModeAncestors`  `sPartialAccessDateAncestors` DATETIME NULL DEFAULT NULL;

ALTER TABLE  `groups_items` CHANGE  `bAccessSolutionsAncestors`  `sAccessSolutionsDateAncestors` DATETIME NULL DEFAULT NULL;
ALTER TABLE  `history_groups_items` CHANGE  `bAccessSolutionsAncestors`  `sAccessSolutionsDateAncestors` DATETIME NULL DEFAULT NULL;


ALTER TABLE  `groups_items` ADD  `bCachedFullAccessAncestors` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `sAccessReasonAncestors`, ADD  `bCachedPartialAccessAncestors` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `bCachedFullAccessAncestors`;
ALTER TABLE  `history_groups_items` ADD  `bCachedFullAccessAncestors` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `sAccessReasonAncestors`, ADD  `bCachedPartialAccessAncestors` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `bCachedFullAccessAncestors`;

ALTER TABLE  `groups_items` CHANGE  `bAccessSolutions`  `sAccessSolutionsDate` DATETIME NULL DEFAULT NULL;
ALTER TABLE  `history_groups_items` CHANGE  `bAccessSolutions`  `sAccessSolutionsDate` DATETIME NULL DEFAULT NULL;

