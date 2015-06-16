ALTER TABLE  `items_items` ADD `bAlwaysVisible` BOOLEAN NOT NULL DEFAULT FALSE AFTER `sCategory`;
ALTER TABLE  `items_items` ADD `bAccessRestricted` BOOLEAN NOT NULL DEFAULT TRUE AFTER `bAlwaysVisible`;

ALTER TABLE  `items` ADD `sPreparationState` ENUM(  'NotReady','Reviewing','Ready' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'NotReady' AFTER `iValidationMin`;
ALTER TABLE  `items` DROP `sAccessType`;

ALTER TABLE  `history_items_items` ADD `bAlwaysVisible` BOOLEAN NOT NULL DEFAULT FALSE AFTER `sCategory`;
ALTER TABLE  `history_items_items` ADD `bAccessRestricted` BOOLEAN NOT NULL DEFAULT TRUE AFTER `bAlwaysVisible`;

ALTER TABLE  `history_items` ADD `sPreparationState` ENUM(  'NotReady','Reviewing','Ready' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'NotReady' AFTER `iValidationMin`;
ALTER TABLE  `history_items` DROP `sAccessType`;

ALTER TABLE  `items_items` CHANGE  `sCategory`  `sCategory` ENUM(  'Undefined',  'Discovery',  'Application',  'Validation',  'Challenge' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT  'Undefined';
ALTER TABLE  `history_items_items` CHANGE  `sCategory`  `sCategory` ENUM(  'Undefined',  'Discovery',  'Application',  'Validation',  'Challenge' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT  'Undefined';

ALTER TABLE  `items` CHANGE  `sValidationType`  `sValidationType` ENUM(  'All',  'AllButOne',  'Categories',  'One' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT  'All';
ALTER TABLE  `history_items` CHANGE  `sValidationType`  `sValidationType` ENUM(  'All',  'AllButOne',  'Categories',  'One' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT  'All';
