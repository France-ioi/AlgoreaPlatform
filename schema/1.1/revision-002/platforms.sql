ALTER TABLE `platforms` CHANGE `sUri` `sName` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
ALTER TABLE `platforms` ADD `sRegexp` TEXT NOT NULL , ADD `iPriority` INT NOT NULL DEFAULT '0' ;

UPDATE `platforms` SET `sRegexp`=CONCAT('^', `sName`);
