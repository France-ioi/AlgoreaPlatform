DROP INDEX prefix ON history_groups_login_prefixes;
ALTER TABLE `groups_login_prefixes` ADD `idUserCreator` BIGINT(20) NOT NULL AFTER `idGroup`;
ALTER TABLE `history_groups_login_prefixes` ADD `idUserCreator` BIGINT(20) NOT NULL AFTER `idGroup`;
