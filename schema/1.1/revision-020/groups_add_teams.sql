-- adding nulls
ALTER TABLE `groups`
CHANGE `idTeamItem` `idTeamItem` bigint(20) NULL AFTER `bFreeAccess`;
ALTER TABLE `history_groups`
CHANGE `idTeamItem` `idTeamItem` bigint(20) NULL AFTER `bFreeAccess`;
