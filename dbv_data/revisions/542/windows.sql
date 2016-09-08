CREATE TABLE IF NOT EXISTS `cached_windows_items_access` (
  `ID` bigint(20) NOT NULL,
  `idGroupUser` bigint(20) NOT NULL, -- on passe par le GroupSelf de l’utilisateur vu qu’on l’utilise partout; ça évite une jointure inutile vers users
  `idItem` bigint(20) NOT NULL,

   -- récupéré de groups_items
  `bOwnerAccess` tinyint(4) NOT NULL, -- nécessaire ?
  `bFullAccess` tinyint(4) NOT NULL,
  `bPartialAccess` tinyint(4) NOT NULL,
  `bAccessSolutions` tinyint(4) NOT NULL,
  `bGrayedAccess` tinyint(4) NOT NULL,
  `bManagerAccess` tinyint(4) NOT NULL,

  `bValidated` tinyint(4) NOT NULL, -- récupéré de users_items
  `bRootItem` tinyint(4) NOT NULL, -- est-ce que c’est un item “root” et donc toujours accessible
  `iVersion` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `idGroupUser` (`idGroupUser`),
  KEY `iVersion` (`iVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `history_cached_windows_items_access` (
  `historyID` bigint(20) NOT NULL,
  `ID` bigint(20) NOT NULL,
  `idGroupUser` bigint(20) NOT NULL, -- on passe par le GroupSelf de l’utilisateur vu qu’on l’utilise partout; ça évite une jointure inutile vers users
  `idItem` bigint(20) NOT NULL,

   -- récupéré de groups_items
  `bOwnerAccess` tinyint(4) NOT NULL, -- nécessaire ?
  `bFullAccess` tinyint(4) NOT NULL,
  `bPartialAccess` tinyint(4) NOT NULL,
  `bAccessSolutions` tinyint(4) NOT NULL,
  `bGrayedAccess` tinyint(4) NOT NULL,
  `bManagerAccess` tinyint(4) NOT NULL,

  `bValidated` tinyint(4) NOT NULL, -- récupéré de users_items
  `bRootItem` tinyint(4) NOT NULL, -- est-ce que c’est un item “root” et donc toujours accessible
  `iVersion` int(11) NOT NULL,
  `iNextVersion` int(11) NOT NULL,
  `bDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`historyID`),
  KEY `ID` (`ID`),
  KEY `idGroupUser` (`idGroupUser`),
  KEY `iVersion` (`iVersion`),
  KEY `iNextVersion` (`iNextVersion`),
  KEY `bDeleted` (`bDeleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `windows` (
  `ID` bigint(20) NOT NULL,
  `idUser` bigint(20) NOT NULL, -- ID de l’utilisateur

  `dateLastActivity` datetime NOT NULL,

  `idMainItem` bigint(20) DEFAULT NULL, -- ID de l’item que l’on regarde

   -- vue du détail d’un groupe : groupe que l’on regarde, ID du parcours par lequel on filtre l’affichage de la progression
  `groupAdmin_idGroup` bigint(20) DEFAULT NULL,
  `groupAdmin_idMainItem` bigint(20) DEFAULT NULL,

   -- vue du détail d’un utilisateur : utilisateur que l’on regarde, ID de l’item si on regarde ses réponses
  `userActivity_idUser` bigint(20) DEFAULT NULL,
  `userActivity_idItem` bigint(20) DEFAULT NULL,

  `bOnProfile` tinyint(4) NOT NULL, -- on regarde son propre profil (inclut l’onglet groupes)

   -- forum : est-ce qu’on est en train de l’explorer; ID du filtre et du thread que l’on regarde
  `bOnForum` tinyint(4) NOT NULL,
  `idFilter` bigint(20) DEFAULT NULL,
  `idThread` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `windows_syncrequests` (
  `idWindow` bigint(20) NOT NULL,

  `itemsDescendants_items` int(11) NOT NULL DEFAULT '0',
  `itemsDescendants_items_items` int(11) NOT NULL DEFAULT '0',
  `itemsDescendants_items_strings` int(11) NOT NULL DEFAULT '0',
  `itemsDescendants_users_items` int(11) NOT NULL DEFAULT '0',
  `itemsDescendants_users_answers` int(11) NOT NULL DEFAULT '0',
  `itemsDescendants_threads` int(11) NOT NULL DEFAULT '0',

  `forumIndex_threads_general_mine` int(11) NOT NULL DEFAULT '0',
  `forumIndex_threads_others` int(11) NOT NULL DEFAULT '0',
  `forumIndex_users_threads_general_mine` int(11) NOT NULL DEFAULT '0',
  `forumIndex_users_threads_others` int(11) NOT NULL DEFAULT '0',
  `forumIndex_filters` int(11) NOT NULL DEFAULT '0',

  -- getThread à voir

  `getUserAnswersSelf` int(11) NOT NULL DEFAULT '0',

  `groupAdminThreadDescendants` int(11) NOT NULL DEFAULT '0',
  `groupAdminGroupsParents` int(11) NOT NULL DEFAULT '0',
  `groupAdminGroupsDescendants` int(11) NOT NULL DEFAULT '0',
  `groupAdminGroupsInvited` int(11) NOT NULL DEFAULT '0',
  `groupAdminGroupsGroupsParents` int(11) NOT NULL DEFAULT '0',
  `groupAdminGroupsGroupsDescendants` int(11) NOT NULL DEFAULT '0',
  `groupAdminGroupsGroupsInvited` int(11) NOT NULL DEFAULT '0',
  `groupAdminUsersAncestors` int(11) NOT NULL DEFAULT '0',
  `groupAdminUsersDescendants` int(11) NOT NULL DEFAULT '0',
  `groupAdminUsersInvited` int(11) NOT NULL DEFAULT '0',
  `groupAdminUsersItemsDescendants` int(11) NOT NULL DEFAULT '0',

  `groupsAncestors` int(11) NOT NULL DEFAULT '0',
  `groupsDescendantsAncestors` int(11) NOT NULL DEFAULT '0',
  `groupsDescendants` int(11) NOT NULL DEFAULT '0',
  `groupsGroupsDescendants` int(11) NOT NULL DEFAULT '0',
  `groupsGroupsAncestors` int(11) NOT NULL DEFAULT '0',
  `groupsGroupsDescendantsAncestors` int(11) NOT NULL DEFAULT '0',
  `groupsItemsAncestors` int(11) NOT NULL DEFAULT '0',
  `groupsItemsDescendantsAncestors` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`idWindow`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;