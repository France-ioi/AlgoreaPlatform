ALTER TABLE `history_items` DROP `sAncestorsComputationState`, DROP `sAncestorsAccessComputationState`;
ALTER TABLE `history_groups_attempts` DROP `sPropagationState`;
ALTER TABLE `history_messages` DROP `bReadByCandidate`;
