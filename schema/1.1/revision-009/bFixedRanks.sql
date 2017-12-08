ALTER TABLE `items` ADD `bFixedRanks` TINYINT(1) NOT NULL DEFAULT '0' AFTER `bHintsAllowed`;
ALTER TABLE `history_items` ADD `bFixedRanks` TINYINT(1) NOT NULL DEFAULT '0' AFTER `bHintsAllowed`; 
