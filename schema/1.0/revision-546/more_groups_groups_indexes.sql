ALTER TABLE `groups_groups` ADD KEY `idGroupParent` (`idGroupParent`);
ALTER TABLE `history_groups_groups` ADD KEY `idGroupParent` (`idGroupParent`);
ALTER TABLE `history_groups_groups` ADD KEY `iNextVersion` (`iNextVersion`);
ALTER TABLE `history_groups_groups` ADD KEY `bDeleted` (`bDeleted`);
