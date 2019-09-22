ALTER TABLE `groups_items` ADD KEY `partialAccess` (`bCachedPartialAccess`,`sCachedPartialAccessDate`);
ALTER TABLE `history_groups_attempts` ADD KEY `ID` (`ID`);
ALTER TABLE `users_answers` ADD KEY `idAttempt` (`idAttempt`);
ALTER TABLE `users_items` ADD KEY `idAttemptActive` (`idAttemptActive`);
