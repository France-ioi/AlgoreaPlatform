ALTER TABLE  `items` ADD  `sAncestorsAccessComputationState` ENUM(  'todo',  'processing',  'done' ) NOT NULL  DEFAULT  'todo' AFTER  `sAncestorsComputationState`;
ALTER TABLE  `history_items` ADD  `sAncestorsAccessComputationState` ENUM(  'todo',  'processing',  'done' ) NOT NULL AFTER  `sAncestorsComputationState`;


ALTER TABLE  `items_ancestors` ADD  `sAccessComputationState` ENUM(  'todo',  'done' ) NOT NULL  DEFAULT  'todo' AFTER  `idItemChild`;
