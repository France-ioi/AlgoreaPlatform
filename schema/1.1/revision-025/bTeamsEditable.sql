ALTER TABLE `items` ADD `bTeamsEditable` TINYINT(1) NOT NULL AFTER `sTeamMode`;
ALTER TABLE `history_items` ADD `bTeamsEditable` TINYINT(1) NOT NULL AFTER `sTeamMode`;
UPDATE items SET bTeamsEditable=1 WHERE sTeamMode IS NOT NULL;
