 ALTER TABLE `users` ADD `loginID` INT( 11 ) NULL DEFAULT NULL ,
ADD `tempUser` TINYINT( 1 ) NOT NULL;

ALTER TABLE `items` DROP `bAlwaysVisible` ,
DROP `bAccessRestricted` ;
