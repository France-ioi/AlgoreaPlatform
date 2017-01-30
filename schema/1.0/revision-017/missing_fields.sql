ALTER TABLE  `groups_items` ADD  `idGroup` BIGINT NOT NULL AFTER  `ID` , ADD  `idItem` BIGINT NOT NULL AFTER  `idGroup`;
ALTER TABLE  `history_groups_items` ADD  `idGroup` BIGINT NOT NULL AFTER  `ID` , ADD  `idItem` BIGINT NOT NULL AFTER  `idGroup`;
