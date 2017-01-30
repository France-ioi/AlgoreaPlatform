ALTER TABLE `users` CHANGE `bEmailVerified` `bEmailVerified` TINYINT(1) NOT NULL DEFAULT '0';
ALTER TABLE `users` CHANGE `sEmail` `sEmail` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `sFirstName` `sFirstName` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User''s first name';
ALTER TABLE `users` CHANGE `sLastName` `sLastName` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User''s last name';
ALTER TABLE `users` CHANGE `sPasswordMd5` `sPasswordMd5` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `users` CHANGE `sBirthDate` `sBirthDate` DATE NULL DEFAULT NULL COMMENT 'User''s birth date';
ALTER TABLE `history_users` CHANGE `bEmailVerified` `bEmailVerified` TINYINT(1) NOT NULL DEFAULT '0';
ALTER TABLE `history_users` CHANGE `sEmail` `sEmail` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `sFirstName` `sFirstName` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User''s first name';
ALTER TABLE `history_users` CHANGE `sLastName` `sLastName` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'User''s last name';
ALTER TABLE `history_users` CHANGE `sPasswordMd5` `sPasswordMd5` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL;
ALTER TABLE `history_users` CHANGE `sBirthDate` `sBirthDate` DATE NULL DEFAULT NULL COMMENT 'User''s birth date';

ALTER TABLE `users` ADD `sStudentId` TEXT NULL DEFAULT NULL AFTER `sLastName`;
ALTER TABLE `history_users` ADD `sStudentId` TEXT NULL DEFAULT NULL AFTER `sLastName`;