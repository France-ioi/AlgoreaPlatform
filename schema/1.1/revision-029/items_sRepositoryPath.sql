ALTER TABLE `items` ADD `sRepositoryPath` TEXT NULL DEFAULT NULL AFTER `sTextId`;
ALTER TABLE `history_items` ADD `sRepositoryPath` TEXT NULL DEFAULT NULL AFTER `sTextId`;
