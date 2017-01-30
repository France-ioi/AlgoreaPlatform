ALTER TABLE `users_items` ADD `sAncestorsComputationState` ENUM( 'done', 'processing', 'todo' ) NOT NULL DEFAULT 'todo' AFTER `sAllLangProg`;
