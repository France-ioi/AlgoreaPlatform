truncate table `groups_login_prefixes`;
truncate table `history_groups_login_prefixes`;
ALTER TABLE `groups_login_prefixes`
ADD UNIQUE `prefix` (`prefix`);
ALTER TABLE `history_groups_login_prefixes`
ADD UNIQUE `prefix` (`prefix`);