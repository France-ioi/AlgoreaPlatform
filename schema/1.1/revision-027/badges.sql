CREATE TABLE IF NOT EXISTS `badges` (
  `ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL,
  `name` text,
  `code` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `badges` ADD PRIMARY KEY (`ID`);
ALTER TABLE `badges` MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT;
