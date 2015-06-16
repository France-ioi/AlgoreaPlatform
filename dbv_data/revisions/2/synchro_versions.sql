CREATE TABLE IF NOT EXISTS `synchro_version` (
  `iVersion` int(11) NOT NULL,
  `iLastServerVersion` int(11) NOT NULL,
  `iLastClientVersion` int(11) NOT NULL,
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `synchro_version`
--

INSERT INTO `synchro_version` (`iVersion`, `iLastServerVersion`, `iLastClientVersion`) VALUES
(0, 0, 0);