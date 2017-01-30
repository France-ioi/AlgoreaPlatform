ALTER TABLE  `users` CHANGE  `bIsTrainer`  `bIsAdmin` TINYINT( 4 ) NOT NULL DEFAULT  '0';
ALTER TABLE  `history_users` CHANGE  `bIsTrainer`  `bIsAdmin` TINYINT( 4 ) NOT NULL DEFAULT  '0';
