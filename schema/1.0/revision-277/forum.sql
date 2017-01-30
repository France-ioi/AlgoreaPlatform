-- -----------------------------------------------------
-- Table `users_threads`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users_threads` ;

CREATE TABLE IF NOT EXISTS `users_threads` (
  `ID` BIGINT NOT NULL,
  `idUser` INT(11) NOT NULL,
  `idThread` BIGINT NOT NULL,
  `sLastReadDate` VARCHAR(45) NULL,
  `sLastWriteDate` VARCHAR(45) NULL,
  `bStarred` TINYINT(1) NULL,
  `iVersion` INT NOT NULL,
  PRIMARY KEY (`ID`),
  CONSTRAINT `users`
    FOREIGN KEY (`idUser`)
    REFERENCES `users` (`ID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE INDEX `users_idx` ON `users_threads` (`idUser` ASC);
CREATE UNIQUE INDEX `userThread` ON `users_threads` (`idUser` ASC, `idThread` ASC);
CREATE INDEX `iVersion` ON `users_threads` (`iVersion` ASC);

-- -----------------------------------------------------
-- Table `messages`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `messages` ;

CREATE TABLE IF NOT EXISTS `messages` (
  `ID` BIGINT NOT NULL,
  `idThread` BIGINT NULL,
  `idUser` INT NULL,
  `sSubmissionDate` DATETIME NULL DEFAULT NULL,
  `sTitle` VARCHAR(200) NULL DEFAULT '',
  `sBody` VARCHAR(2000) NULL DEFAULT '',
  `bTrainersOnly` TINYINT(1) NULL DEFAULT 0,
  `bArchived` TINYINT(1) NULL DEFAULT 0,
  `bPersistant` TINYINT(1) NULL,
  `bReadByCandidate` TINYINT(1) NULL,
  `iVersion` INT NOT NULL,
  PRIMARY KEY (`ID`))
ENGINE = InnoDB;

CREATE INDEX `user_idx` ON `messages` (`idUser` ASC);
CREATE INDEX `iVersion` ON `messages` (`iVersion` ASC);


-- -----------------------------------------------------
-- Table `filters`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `filters` ;

CREATE TABLE IF NOT EXISTS `filters` (
  `ID` BIGINT NOT NULL,
  `idUser` INT NOT NULL,
  `sName` VARCHAR(45) NOT NULL,
  `bStarred` TINYINT(1) NULL DEFAULT NULL,
  `sStartDate` DATETIME NULL DEFAULT NULL,
  `sEndDate` DATETIME NULL DEFAULT NULL,
  `bArchived` TINYINT(1) NULL DEFAULT NULL,
  `bParticipated` TINYINT(1) NULL DEFAULT NULL,
  `bUnread` TINYINT(1) NULL DEFAULT NULL,
  `idItem` INT NULL DEFAULT NULL,
  `idGroup` INT NULL DEFAULT NULL,
  `olderThan` INT NULL DEFAULT NULL,
  `newerThan` INT NULL DEFAULT NULL,
  `sUsersSearch` VARCHAR(200) NULL DEFAULT NULL,
  `sBodySearch` VARCHAR(100) NULL DEFAULT NULL,
  `bImportant` TINYINT(1) NULL DEFAULT NULL,
  `iVersion` INT NOT NULL,
  PRIMARY KEY (`ID`),
  CONSTRAINT `user`
    FOREIGN KEY (`idUser`)
    REFERENCES `users` (`ID`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE INDEX `user_idx` ON `filters` (`idUser` ASC);
CREATE INDEX `iVersion` ON `filters` (`iVersion` ASC);


-- -----------------------------------------------------
-- Table `history_users_threads`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `history_users_threads` ;

CREATE TABLE IF NOT EXISTS `history_users_threads` (
  `history_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `ID` BIGINT NOT NULL,
  `idUser` INT(11) NOT NULL,
  `idThread` BIGINT NOT NULL,
  `sLastReadDate` VARCHAR(45) NULL DEFAULT NULL,
  `sLastWriteDate` VARCHAR(45) NULL DEFAULT NULL,
  `bStarred` TINYINT(1) NULL,
  `iVersion` INT NOT NULL,
  `iNextVersion` INT NULL DEFAULT NULL,
  `bDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`history_ID`))
ENGINE = InnoDB;

CREATE INDEX `userThread` ON `history_users_threads` (`idUser` ASC, `idThread` ASC);
CREATE INDEX `user` ON `history_users_threads` (`idUser` ASC);
CREATE INDEX `iVersion` ON `history_users_threads` (`iVersion` ASC);
CREATE INDEX `iNextVersion` ON `history_users_threads` (`iNextVersion` ASC);
CREATE INDEX `bDeleted` ON `history_users_threads` (`bDeleted` ASC);


-- -----------------------------------------------------
-- Table `history_messages`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `history_messages` ;

CREATE TABLE IF NOT EXISTS `history_messages` (
  `history_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `ID` BIGINT NOT NULL,
  `idThread` BIGINT NOT NULL,
  `idUser` INT NOT NULL,
  `sSubmissionDate` DATETIME NULL DEFAULT NULL,
  `sTitle` VARCHAR(200) NULL DEFAULT '',
  `sBody` VARCHAR(2000) NULL DEFAULT '',
  `bTrainersOnly` TINYINT(1) NULL DEFAULT 'all',
  `bArchived` TINYINT(1) NULL DEFAULT 0,
  `bPersistant` TINYINT(1) NULL,
  `bReadByCandidate` TINYINT(1) NULL,
  `iVersion` INT NOT NULL,
  `iNextVersion` INT NULL DEFAULT NULL,
  `bDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`history_ID`))
ENGINE = InnoDB;

CREATE INDEX `thread` ON `history_messages` (`idThread` ASC);
CREATE INDEX `iVersion` ON `history_messages` (`iVersion` ASC);
CREATE INDEX `iNextVersion` ON `history_messages` (`iNextVersion` ASC);
CREATE INDEX `bDeleted` ON `history_messages` (`bDeleted` ASC);


-- -----------------------------------------------------
-- Table `threads`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `threads` ;

CREATE TABLE IF NOT EXISTS `threads` (
  `ID` BIGINT NOT NULL,
  `sType` ENUM('Help','Bug','General') NOT NULL,
  `idUserCreated` INT(11) NOT NULL,
  `idItem` INT UNSIGNED NULL DEFAULT NULL,
  `sTitle` VARCHAR(200) NULL,
  `bAdminHelpAsked` TINYINT(1) NOT NULL DEFAULT 0,
  `bHidden` TINYINT(1) NOT NULL DEFAULT 0,
  `iVersion` INT NOT NULL,
  PRIMARY KEY (`ID`))
ENGINE = InnoDB;

CREATE INDEX `iVersion` ON `threads` (`iVersion` ASC);


-- -----------------------------------------------------
-- Table `history_threads`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `history_threads` ;

CREATE TABLE IF NOT EXISTS `history_threads` (
  `history_ID` BIGINT NOT NULL AUTO_INCREMENT,
  `ID` BIGINT NOT NULL,
  `sType` ENUM('Help','Bug','General') NOT NULL,
  `idUserCreated` INT(11) NOT NULL,
  `idItem` INT UNSIGNED NULL DEFAULT NULL,
  `sTitle` VARCHAR(200) NULL,
  `bAdminHelpAsked` TINYINT(1) NOT NULL DEFAULT 0,
  `bHidden` TINYINT(1) NOT NULL DEFAULT 0,
  `iVersion` INT NOT NULL,
  `iNextVersion` INT NULL DEFAULT NULL,
  `bDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`history_ID`))
ENGINE = InnoDB;

CREATE INDEX `iVersion` ON `history_threads` (`iVersion` ASC);
CREATE INDEX `iNextVersion` ON `history_threads` (`iNextVersion` ASC);
CREATE INDEX `bDeleted` ON `history_threads` (`bDeleted` ASC);
