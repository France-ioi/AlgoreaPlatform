--
-- Table structure for table `platforms`
--

CREATE TABLE IF NOT EXISTS `platforms` (
`ID` int(11) NOT NULL,
  `sUri` varchar(50) NOT NULL,
  `sPublicKey` varchar(255) NOT NULL,
  `bUsesTokens` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `platforms`
 ADD PRIMARY KEY (`ID`);

ALTER TABLE `platforms`
MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

-- for coherence:
ALTER TABLE `items` CHANGE `url` `sUrl` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
ALTER TABLE `history_items` CHANGE `url` `sUrl` VARCHAR(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL;
