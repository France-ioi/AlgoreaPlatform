ALTER TABLE `history_groups_ancestors` ADD KEY `ID` (`ID`);
ALTER TABLE `history_items_ancestors` ADD KEY `ID` (`ID`);
ALTER TABLE `history_filters` ADD KEY `ID` (`ID`);
ALTER TABLE `history_messages` ADD KEY `ID` (`ID`);
ALTER TABLE `history_threads` ADD KEY `ID` (`ID`);
ALTER TABLE `history_users_threads` ADD KEY `ID` (`ID`);