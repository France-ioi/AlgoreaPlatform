-- done by default
ALTER TABLE `users_items` CHANGE `sAncestorsComputationState` `sAncestorsComputationState` ENUM('done','processing','todo','temp') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'done';

-- this index actually gets used
ALTER TABLE `users_items` ADD KEY `idUser` (`idUser`);
ALTER TABLE `history_users_items` ADD KEY `idItem` (`idItem`), ADD KEY `idUser` (`idUser`);
