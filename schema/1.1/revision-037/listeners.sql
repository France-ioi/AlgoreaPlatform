CREATE TABLE IF NOT EXISTS `listeners` (
  `name` enum('computeAllAccess') NOT NULL DEFAULT 'computeAllAccess',
  `increment` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

ALTER TABLE `listeners` ADD PRIMARY KEY (`name`);

INSERT INTO `listeners` (`name`, `increment`) VALUES ('computeAllAccess', 0);
