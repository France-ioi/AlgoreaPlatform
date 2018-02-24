ALTER TABLE `groups_items` ADD KEY `fullAccess` (`bCachedFullAccess`,`sCachedFullAccessDate`);
ALTER TABLE `groups_items` ADD KEY `accessSolutions` (`bCachedAccessSolutions`,`sCachedAccessSolutionsDate`);
ALTER TABLE `groups_items` ADD INDEX(`sPropagateAccess`);
