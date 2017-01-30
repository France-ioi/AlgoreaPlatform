ALTER TABLE `users` ADD UNIQUE KEY `idGroupSelf` (`idGroupSelf`);
ALTER TABLE `history_users` ADD KEY `idGroupSelf` (`idGroupSelf`);

ALTER TABLE `messages` ADD KEY `idThread` (`idThread`);

ALTER TABLE `synchro_version` ADD `ID` TINYINT(1) NOT NULL FIRST, ADD PRIMARY KEY (`ID`) ;

ALTER TABLE `items`
  DROP `sAncestorsComputationState`,
  DROP `sAncestorsAccessComputationState`;
