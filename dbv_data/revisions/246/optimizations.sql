ALTER TABLE `users_items` ADD INDEX ( `sAncestorsComputationState` );
ALTER TABLE `users_items` DROP INDEX `UserItem` , ADD UNIQUE `UserItem` ( `idUser` , `idItem` );
ALTER TABLE `groups_items` DROP INDEX `idItem` , ADD UNIQUE `idItem` ( `idItem` , `idGroup` );
ALTER TABLE `history_groups_items` ADD INDEX `itemGroup` ( `idItem` , `idGroup` );

ALTER TABLE `history_items_strings` ADD INDEX `itemLanguage` ( `idItem` , `idLanguage` );
ALTER TABLE `history_users_items` ADD INDEX `itemUser` ( `idItem` , `idUser` ) ;

ALTER TABLE `history_users_items` ADD INDEX ( `iNextVersion` );
ALTER TABLE `history_users_items` ADD INDEX ( `bDeleted` ) ;
ALTER TABLE `history_groups_items` ADD INDEX ( `iNextVersion` );
ALTER TABLE `history_groups_items` ADD INDEX ( `bDeleted` ) ;

ALTER TABLE `history_users` ADD INDEX ( `iNextVersion` );
ALTER TABLE `history_users` ADD INDEX ( `bDeleted` ) ;
ALTER TABLE `history_groups` ADD INDEX ( `iNextVersion` );
ALTER TABLE `history_groups` ADD INDEX ( `bDeleted` ) ;
ALTER TABLE `history_items` ADD INDEX ( `iNextVersion` );
ALTER TABLE `history_items` ADD INDEX ( `bDeleted` ) ;
ALTER TABLE `history_items_items` ADD INDEX ( `iNextVersion` );
ALTER TABLE `history_items_items` ADD INDEX ( `bDeleted` ) ;
ALTER TABLE `history_items_ancestors` ADD INDEX ( `iNextVersion` );
ALTER TABLE `history_items_ancestors` ADD INDEX ( `bDeleted` ) ;
ALTER TABLE `history_groups_ancestors` ADD INDEX ( `iNextVersion` );
ALTER TABLE `history_groups_ancestors` ADD INDEX ( `bDeleted` ) ;
