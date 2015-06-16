ALTER TABLE  `groups` CHANGE  `sType`  `sType` ENUM(  'Root',  'Class',  'Club',  'Friends',  'Other' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
ALTER TABLE  `history_groups` CHANGE  `sType`  `sType` ENUM(  'Root',  'Class',  'Club',  'Friends',  'Other' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
