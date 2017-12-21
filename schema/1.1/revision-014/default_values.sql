ALTER TABLE `groups`
CHANGE `bOpened` `bOpened` tinyint(1) NOT NULL DEFAULT '0' AFTER `sDateCreated`,
CHANGE `bSendEmails` `bSendEmails` tinyint(1) NOT NULL DEFAULT '0' AFTER `sType`;

ALTER TABLE `groups_groups`
CHANGE `iChildOrder` `iChildOrder` int(11) NOT NULL DEFAULT '0' AFTER `idGroupChild`;