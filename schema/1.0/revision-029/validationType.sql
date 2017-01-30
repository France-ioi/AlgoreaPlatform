ALTER TABLE  `items` CHANGE  `sValidationType`  `sValidationType` ENUM(  'None',  'All',  'AllButOne',  'Categories',  'One' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT  'All';
ALTER TABLE  `history_items` CHANGE  `sValidationType`  `sValidationType` ENUM(  'None',  'All',  'AllButOne',  'Categories',  'One' ) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT  'All';
