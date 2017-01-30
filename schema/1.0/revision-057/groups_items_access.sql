ALTER TABLE  `groups_items` ADD  `sAccessModeAncestors` ENUM(  'None',  'Full' ) NOT NULL DEFAULT  'None' AFTER  `bAccessSolutions` ,
ADD  `sAccessOpenDateAncestors` DATETIME NULL DEFAULT NULL AFTER  `sAccessModeAncestors` ,
ADD  `bAccessSolutionsAncestors` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `sAccessOpenDateAncestors`;
ALTER TABLE  `groups_items` ADD  `bComputeAccessFromAncestors` BOOLEAN NOT NULL DEFAULT TRUE AFTER  `bAccessSolutions`;

ALTER TABLE  `history_groups_items` ADD  `sAccessModeAncestors` ENUM(  'None',  'Full' ) NOT NULL DEFAULT  'None' AFTER  `bAccessSolutions` ,
ADD  `sAccessOpenDateAncestors` DATETIME NULL DEFAULT NULL AFTER  `sAccessModeAncestors` ,
ADD  `bAccessSolutionsAncestors` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `sAccessOpenDateAncestors`;
ALTER TABLE  `history_groups_items` ADD  `bComputeAccessFromAncestors` BOOLEAN NOT NULL DEFAULT TRUE AFTER  `bAccessSolutions`;


ALTER TABLE  `groups_items` CHANGE  `bComputeAccessFromAncestors`  `sComputeAccessFromAncestors` ENUM(  'done',  'self',  'descendants' ) NOT NULL DEFAULT  'descendants';
ALTER TABLE  `history_groups_items` CHANGE  `bComputeAccessFromAncestors`  `sComputeAccessFromAncestors` ENUM(  'done',  'self',  'descendants' ) NOT NULL DEFAULT  'descendants';

ALTER TABLE  `groups_items` CHANGE  `sAccessModeAncestors`  `sAccessModeAncestors` ENUM(  'Default',  'Full',  'Partial' ) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE  `history_groups_items` CHANGE  `sAccessModeAncestors`  `sAccessModeAncestors` ENUM(  'Default',  'Full',  'Partial' ) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;

ALTER TABLE  `groups_items` ADD  `sAccessReasonAncestors` VARCHAR( 200 ) NOT NULL AFTER  `bAccessSolutionsAncestors`;
ALTER TABLE  `history_groups_items` ADD  `sAccessReasonAncestors` VARCHAR( 200 ) NOT NULL AFTER  `bAccessSolutionsAncestors`;

ALTER TABLE  `items_ancestors` ADD  `bAccessRestricted` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `sAccessComputationState;
