ALTER TABLE `items`
ADD `groupCodeEnter` tinyint(1) NULL DEFAULT '0' COMMENT 'Offer users to enter through a group code' AFTER `bNoScore`;

ALTER TABLE `history_items`
ADD `groupCodeEnter` tinyint(1) NULL DEFAULT '0' COMMENT 'Offer users to enter through a group code' AFTER `bNoScore`;