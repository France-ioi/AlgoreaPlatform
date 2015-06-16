ALTER TABLE  `users` CHANGE  `iNotify`  `sNotify` ENUM(  'Never',  'Answers',  'Concerned' ) NOT NULL DEFAULT  'Answers';
ALTER TABLE  `history_users` CHANGE  `iNotify`  `sNotify` ENUM(  'Never',  'Answers',  'Concerned' ) NOT NULL DEFAULT  'Answers';
