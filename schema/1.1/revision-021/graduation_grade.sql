ALTER TABLE `users`
ADD `iGrade` int(11) NULL AFTER `iGraduationYear`;

ALTER TABLE `history_users`
ADD `iGrade` int(11) NULL AFTER `iGraduationYear`;