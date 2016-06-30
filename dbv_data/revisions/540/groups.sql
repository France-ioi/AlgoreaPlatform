ALTER TABLE `groups_groups` ADD `sRole` ENUM('manager','owner','member','observer') NOT NULL DEFAULT 'member' AFTER `sType`;
ALTER TABLE `history_groups_groups` ADD `sRole` ENUM('manager','owner','member','observer') NOT NULL DEFAULT 'member' AFTER `sType`;


ALTER TABLE `users` ADD UNIQUE KEY `idGroupOwned` (`idGroupOwned`);
ALTER TABLE `history_users` ADD KEY `idGroupOwned` (`idGroupOwned`);