ALTER TABLE `groups_attempts`
CHANGE `sHintsRequested` `sHintsRequested` mediumtext COLLATE 'utf8_general_ci' NULL AFTER `nbTasksWithHelp`;

ALTER TABLE `history_groups_attempts`
CHANGE `sHintsRequested` `sHintsRequested` mediumtext COLLATE 'utf8_general_ci' NULL AFTER `nbTasksWithHelp`;

ALTER TABLE `users_items`
CHANGE `sHintsRequested` `sHintsRequested` mediumtext COLLATE 'utf8_general_ci' NULL AFTER `nbTasksWithHelp`;

ALTER TABLE `history_users_items`
CHANGE `sHintsRequested` `sHintsRequested` mediumtext COLLATE 'utf8_general_ci' NULL AFTER `nbTasksWithHelp`;