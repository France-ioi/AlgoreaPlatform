update items set sDuration = NULL where sDuration = '00:00:00';
ALTER TABLE `users_items` CHANGE `sAdditionalTime` `sAdditionalTime` TIME NULL DEFAULT NULL;
ALTER TABLE `history_users_items` CHANGE `sAdditionalTime` `sAdditionalTime` TIME NULL DEFAULT NULL;