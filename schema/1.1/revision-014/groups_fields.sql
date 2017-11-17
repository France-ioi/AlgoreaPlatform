ALTER TABLE `groups`
    ADD `sPasswordTimer` TIME NULL DEFAULT NULL AFTER `sPassword`,
    ADD `sPasswordEnd` DATETIME NULL DEFAULT NULL AFTER `sPasswordTimer`,
    ADD `sRedirectPath` TEXT NOT NULL AFTER `sPasswordEnd`,
    ADD `bOpenContest` TINYINT(1) NOT NULL DEFAULT '0' AFTER `sRedirectPath`;
ALTER TABLE `history_groups`
    ADD `sPasswordTimer` TIME NULL DEFAULT NULL AFTER `sPassword`,
    ADD `sPasswordEnd` DATETIME NULL DEFAULT NULL AFTER `sPasswordTimer`,
    ADD `sRedirectPath` TEXT NOT NULL AFTER `sPasswordEnd`,
    ADD `bOpenContest` TINYINT(1) NOT NULL DEFAULT '0' AFTER `sRedirectPath`;
