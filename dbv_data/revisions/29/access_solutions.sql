ALTER TABLE history_items DROP bSolutionPublic;
ALTER TABLE items DROP bSolutionPublic;

ALTER TABLE  `groups_items` ADD  `bAccessSolutions` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `sAccessOpenDate`;
ALTER TABLE  `history_groups_items` ADD  `bAccessSolutions` BOOLEAN NOT NULL DEFAULT FALSE AFTER  `sAccessOpenDate`;
