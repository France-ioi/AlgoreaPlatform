"use strict";

var models = {
   filters: {
      fields: {
         idUser: {type: "int", label: "id de l'utilisateur"},
         sName: {type: "text", label: "Nom du filtre"},
         bSelected: {type: "boolean", label: "Sélectionné"},
         bStarred: {type: "boolean", label: "Dans les favoris"},
         sStartDate: {type: "jsdate", label: "Date de départ"},
         sEndDate: {type: "jsdate", label: "Date de fin"},
         bArchived: {type: "boolean", label: "Inclure les archivés"},
         bParticipated: {type: "boolean", label: "Ceux auxquels j'ai participé"},
         bUnread: {type: "boolean", label: "Non-lus"},
         idItem: {type: "key", label: "Liés à un item ou ses descendants"},
         idGroup: {type: "key", label: "Liés à un groupe ou ses descendants"},
         olderThan: {type: "int", label: "Ayant au moins X jours"},
         newerThan: {type: "int", label: "Ayant moins de X jours"},
         sUsersSearch: {type: "text", label: "Liés aux utilisateurs dans cette liste"},
         sBodySearch: {type: "text", label: "Dont le contenu inclut cette chaîne"},
         bImportant: {type: "boolean", label: "Dont le statut est classé comme important pour moi"}
      }
   },

   groups: {
      fields: {
         sName: {type: "string", label: "Nom"},
         idUser: {type: "key", label: "id de l'utilisateur"},
         sDescription: {type: "text", label: "Description"},
         sDateCreated: {type: "jsdate", label: "Date de création"},
         bOpened: {type: "boolean", label: "Ouvert (les utilisateurs peuvent faire la requête de rejoindre le groupe)", defaultValue: true},
         bFreeAccess: {type: "boolean", label: "Accès libre (pas de modération des requêtes)"},
         sPassword: {type: "string", label: "Mot de passe (si vide, pas de mot de passe demandé)", defaultValue: ''},
         sType: {
            type: "enum",
            values: {Root: {label: "Racine"}, Class: {label: "Classe"}, Club: {label: "Club"}, Friends: {label: "Amis"}, Other: {label:"Autre"}, UserSelf: {label:"Utilisateur"}, UserAdmin: {label:"Utilisateur (groupes administrés)"}, RootAdmin: {label:"Racine groupes administrés"}, RootSelf: {label:"Racine groupes utilisateurs"}},
            label: "Type",
            defaultValue: "Class",
            nullInvalid: true
         },
         bSendEmails: {type: "boolean", label: "Envoi d'emails"}
      },
      links: {
         children: {refModel: "groups_groups", key: "idGroupParent", type: "array"}, // array better ?
         parents: {refModel: "groups_groups", key: "idGroupChild", type: "object"},
         userSelf: {refModel: "users", key: "idGroupSelf", type: "object"},
         userOwned: {refModel: "users", key: "idGroupOwned", type: "object"},
         userAccess: {refModel: "users", key: "idGroupAccess", type: "object"}
      }
   },

   groups_groups: {
      fields: {
         idGroupParent: {type: "key", label: "Groupe parent", refModel: "groups", link: "parent", invLink: "children"},
         idGroupChild: {type: "key", label: "Groupe fils", refModel: "groups", link: "child", invLink: "parents"},
         iChildOrder: {type: "int", label: "Rang", indexForLinks: [{refModel: "groups", key:"idGroupParent", invLink: "children"}]}, // Add automatically
         sChildLogin: {type: "string", label: "login de l'utilisateur invité", readOnly: true},
         sType: {
            type: 'enum',
            values: {
               invitationSent: {label: "invitation envoyée"},
               requestSent: {label: "requête envoyée"},
               invitationAccepted: {label: "invitation acceptée"},
               requestAccepted: {label: "requête acceptée"},
               invitationRefused: {label: "invitation refusée"},
               requestRefused: {label: "requête refusée"},
               removed: {label: "renvoyé du groupe"},
               left: {label: "parti du groupe"},
               direct: {label: "membre direct"}
            },
            defaultValue: 'direct',
            label: "Type",
            nullInvalid: true
         },
         sStatusDate: {type: "jsdate", label: "date du dernier changement de statut"},
         idUserInviting: {type: "key", label: "Utilisateur invitant", refModel: "users", link: "userInviting"},
         sUserInvitingLogin: {type: "string", label: "login de l'invitant", readOnly: true},
      }
   },

   items: {
      fields: {
         sUrl: {type: "string", label: "Url"},
         idPlatform: {type: "int", label: "Plateforme", defaultValue: 0},
         sTextId: {type: "string", label: "TextID", defaultValue: ''},
         sType: {
            type: "enum",
            values: {
               Root: {label: "Racine"},
               Category: {label: "Catégorie"},
               Level: {label: "Niveau"},
               GenericChapter: {label: "Chapitre générique"},
               Chapter: {label: "Chapitre"},
               StaticChapter: {label: "Chapitre statique"},
               ContestChapter: {label: "Chapitre de concours"},
               LimitedTimeChapter: {label: "Chapitre en temps limité"},
               Section: {label: "Section"},
               Task: {label: "Sujet"},
               Course: {label: "Cours"},
               Presentation: {label: "Présentation"}
            },
            label: "Type",
            defaultValue: "Chapter",
            nullInvalid: true
         },
         bUsesAPI: {type: "boolean", label: "Utilise l'API", defaultValue: true},
         bShowDifficulty: {type: "boolean", label: "Afficher la difficulté", defaultValue: false},
         bShowSource: {type: "boolean", label: "Afficher la source", defaultValue: false},
         bHintsAllowed: {type: "boolean", label: "Autoriser les conseils", defaultValue: false},
         sValidationType: {
            type: "enum",
            widget: "radio",
            values: {
               None: {label: "Aucune : ses fils contribuent à la validation de son parent."},
               Categories: {label: "Catégories : valider tous les fils marqués <span class='CategoryValidation'>Validation</span>."},
               All: {label: "Tous : valider tous ses fils."},
               AllButOne: {label: "Tous sauf un : valider tous ses fils sauf un."},
               One: {label: "Au moins un : valider au moins un de ses fils."},
               Manual: {label: "La validation se fait à la main uniquement."}
            },
            label: "Condition pour valider cet item",
            defaultValue : 'All',
            nullInvalid: true
         },
         iValidationMin: {type: "int", label: "Minimum de fils à valider"},
         sPreparationState: {
            type: "enum",
            widget: "radio",
            values: {
               NotReady: {label: "<span class='PreparationNotReady'>Pas encore prêt</span>"},
               Reviewing: {label: "<span class='PreparationReviewing'>À vérifier</span>"},
               Ready: {label: "<span class='PreparationReady'>Prêt</span>"}
            },
            label: "État de la préparation",
            defaultValue : 'Ready',
            nullInvalid: true
         },
         idItemUnlocked: {type: "key", label: "Item débloqué", refModel:"items"},
         sSupportedLangProg: {type: "string", label: "Langages de programmation supportés", defaultValue: '*'},
         sAccessOpenDate: {type: "jsdate", label: "Date d'ouverture de l'accès"},
         sDuration: {type: "string", label: "Durée de l'épreuve"},
         sEndContestDate: {type: "jsdate", label: "Date de fermeture du concours"},
         sContestPhase: {
            type: "enum",
            values: {
               Running: {label: "En cours"},
               Analysis: {label: "Mode analyse (accès aux résultats, non finaux)"},
               Closed: {label: "Concours terminé"}},
            label: "Phase du concours",
            defaultValue: "Running",
            nullInvalid: true
         },
         iLevel: {type: "int", label: "Niveau sur le site"},
         bNoScore: {type: "boolean", label: "Ne pas prendre en compte le score", defaultValue: false},
         bGrayedAccess: {type: "boolean", label: "Grisé", defaultValue: false, readOnly: true},
         bOwnerAccess: {type: "boolean", label: "Grisé", defaultValue: false, readOnly: true},
         bManagerAccess: {type: "boolean", label: "Grisé", defaultValue: false, readOnly: true},
         bAccessSolutions: {type: "boolean", label: "Accès possible aux solutions", defaultValue: false, readOnly: true}
      },
      links: {
         children: {refModel: "items_items", key: "idItemParent", type: "object", index: "iChildOrder"}, // array better ?
         parents: {refModel: "items_items", key: "idItemChild", type: "object"},
         strings: {refModel: "items_strings", key: "idItem", type: "array"},
         user_answers: {refModel: "users_answers", key: "idItem", type: "array"},
         user_item: {refModel: "users_items", key: "idItem", type: "object"},
         threads: {refModel: "threads", key: "idItem", type: "object"},
         group_items: {refModel: "groups_items", key: "idItem", type: "array"}, // array better ?
         //descendants: {refModel: "items_ancestors", key: "idItemAncestor", type: "object"}, // array better ?
      },
      indexes: [
         {name: "sTextId", keys: ["sTextId"]}
      ]
   },

   items_items: {
      fields: {
         idItemParent: {type: "key", label: "Parent", refModel: "items", link: "parent", invLink: "children"},
         idItemChild: {type: "key", label: "Fils", refModel: "items", link: "child", invLink: "parents"},
         iChildOrder: {type: "int", label: "Rang", indexForLinks: [{refModel: "items", key:"idItemParent", invLink: "children"}]}, // Add automatically
         sCategory: {
            type: "enum",
            widget: "radio",
            values: {
               Undefined: {label: "<span class='CategoryUndefined'>Indéfini</span> : cas où parent ne gère pas la validation par catégorie"},
               Course: {label: "<span class='CategoryCourse'>Cours</span> : simple cours, pas de résolution"},
               Discovery: {label: "<span class='CategoryDiscovery'>Découverte</span> : permet de découvrir une nouvelle notion"},
               Application: {label: "<span class='CategoryApplication'>Application</span> : permet de mettre en application une notion"},
               Validation: {label: "<span class='CategoryValidation'>Validation</span> : à résoudre pour valider le parent"},
               Challenge: {label: "<span class='CategoryChallenge'>Challenge</span> : pour ceux qui aiment les défis"}
            },
            label: "Mode de validation",
            defaultValue : 'Undefined'
         },
         bAccessRestricted: {
            type: "iny",
            widget: "radio",
            values: {
               0: {label: "<a href='#' class='btn btn-mini btn-success'><i class='glyphicon glyphicon-ok'></i></a> Accessible directement si un parent est accessible"},
               1: {label: "<a href='#' class='btn btn-mini btn-danger'><i class='glyphicon glyphicon-lock'></i></a> Déblocable par un entraîneur ou par la validation d'autres contenus"}
            },
            label: "Mode d'accès",
            defaultValue: 1
         },
         bAlwaysVisible: {
            type: "int",
            widget: "radio",
            values: {
               0: {label: "<a href='#' class='btn btn-mini btn-danger'><i class='glyphicon glyphicon-eye-close'></i></a> Caché si inaccessible"},
               1: {label: "<a href='#' class='btn btn-mini btn-success'><i class='glyphicon glyphicon-eye-open'></i></a> Visible en grisé si inaccessible"}
            },
            label: "Visibilité",
            defaultValue: 1
         },
         iDifficulty: {type: "int", label: "Difficulté", defaultValue: 0}
      }
   },

   items_strings: {
      fields: {
         idItem: {type: "key", label: "Item", refModel: "items", link: "item", invLink: "strings"},
         idLanguage: {type: "key", label: "Langue", refModel: "languages", link: "language"},
         sTranslator: {type: "string", label: "Traducteur", defaultValue: ''},
         sTitle: {type: "string", label: "Titre", defaultValue: ''},
         sSubtitle: {type: "string", label: "Sous-titre", defaultValue: ''},
         sDescription: {type: "text", label: "Description", defaultValue: ''},
         sEduComment: {type: "text", label: "Commentaire pédagogique", defaultValue: ''},
         sRankingComment: {type: "text", label: "Commentaire classement", defaultValue: ''}
      }
   },

   items_ancestors: {
      fields: {
         idItemAncestor: {type: "key", label: "Item ancêtre", refModel: "items", link: "itemAncestor"/*, invLink: "descendants"*/},
         idItemChild: {type: "key", label: "Item descendant", refModel: "items", link: "itemDescendant"},
      },
      indexes: [
         {name: "idItemAncestor", keys: ["idItemAncestor"], values: "idItemChild"}
      ]
   },

   groups_items: {
      fields: {
         idGroup: {type: "key", label: "Groupe", refModel: "groups", link: "group"},
         idItem: {type: "key", label: "Item", refModel: "items", link: "item", invLink: 'group_items'},
         idUserCreated: {type: "key", label: "Créateur" /*, refModel: "users", link: "userCreated"*/},
         sPartialAccessDate: {type: "jsdate", label: "Accès partiel donné à partir de :"},
         sFullAccessDate: {type: "jsdate", label: "Accès complet donné à partir de :"},
         sAccessReason: {type: "string", label: "Commentaire sur l'accès", defaultValue: ''},
         sAccessSolutionsDate: {type: "jsdate", label: "Accès aux solutions"},
         bOwnerAccess: {type: "boolean", label: "Accès propriétaire", defaultValue: false},
         bManagerAccess: {type: "boolean", label: "Accès manager", defaultValue: false},
         sCachedPartialAccessDate: {type: "jsdate", label: "Accès partiel ancêtres"},
         sCachedFullAccessDate: {type: "jsdate", label: "Accès complet ancêtres"},
         sCachedAccessSolutionsDate: {type: "jsdate", label: "Accès aux solutions ancêtres"},
         sCachedGrayedAccessDate: {type: "jsdate", label: "Accès grisé"},
         bCachedFullAccess: {type: "boolean", label: "Accès à tous les descendants", defaultValue: false},
         bCachedPartialAccess: {type: "boolean", label: "Accès partiel", defaultValue: false},
         bCachedAccessSolutions: {type: "boolean", label: "Accès aux solutions", defaultValue: false},
         bCachedGrayedAccess: {type: "boolean", label: "Accès grisé", defaultValue: false},
         bCachedManagerAccess: {type:"boolean", label: "Accès manager", defaultValue: false},
         sPropagateAccess: {type: "string", label: "", defaultValue: 'self'}
      },
      indexes: [
         {name: "groupItem", keys: ["idGroup", "idItem"]}
      ]
   },

   languages: {
      fields: {
          sName: {type: "string", label: "Nom"},
          sCode: {type: "string", label: "Code"}
      }
   },

   messages: {
      fields: {
          idThread: {type: "key", label: "Thread", refModel: "threads", link: "thread", invLink: "messages"},
          idUser: {type: "key", label: ""},
          sLogin: {type: "string", label: "", readOnly: true},
          sSubmissionDate: {type: "jsdate", label: "", defaultValue : null},
          bPublished: {type: "boolean", label: "", defaultValue : false},
          sTitle: {type: "string", label: "", defaultValue : ''},
          sBody: {type: "string", label: "", defaultValue : ''},
          bTrainersOnly: {type: "boolean", label: "", defaultValue : false},
          bArchived: {type: "boolean", label: "", defaultValue : false},
          bPersistant: {type: "boolean", label: "", defaultValue : false}
      },
   },

   threads: {
      fields: {
          sType: {
             type: "enum",
             values: {Help: {label: "Demande d'aide"}, General: {label: "Sujet général"}, Bug: {label: "Rapport de bogue"}},
             label: "Type de discussion"
          },
          sLastActivityDate: {type: "jsdate", label: ""},
          sSubmissionDate: {type: "jsdate", label: ""},
          idUserCreated: {type: "key", label: "", refModel: "users", link: "user", invLink: "threads"},
          sUserCreatedLogin: {type: "string", label: ""},
          idItem: {type: "key", label: "Item", refModel: "items", link: "item", invLink: "threads"},
          sTitle: {type: "text", label: "Titre"},
          bArchived: {type: "boolean", label: ""},
          bPersistant: {type: "boolean", label: ""}
      },
      links: {
         messages: {refModel: "messages", key: "idThread", type: "array"},
         user_thread: {refModel: "users_threads", key: "idThread", type: "object"},
         user: {refModel: "users", key: "ID", type: "object"}
      }
   },

   users: {
      fields: {
          sLogin: {type: "string", label: "Login"},
          sOpenIdIdentity: {type: "string", label: "OpenID"},
          sPasswordMd5: {type: "string", label: "MD5 du mot de passe"},
          sSalt: {type: "string", label: "Sel"},
          sRecover: {type: "string", label: "Récupération de mot de passe"},
          sRegistrationDate: {type: "jsdate", label: "Date d'inscription"},
          sEmail: {type: "string", label: "Adresse email"},
          bEmailVerified: {type: "boolean", label: "Email vérifié"},
          sFirstName: {type: "string", label: "Prénom"},
          sLastName: {type: "string", label: "Nom de famille"},
          sCountryCode: {type: "string", label: "Code de pays"},
          sTimeZone: {type: "string", label: "Fuseau horaire"},
          sBirthDate: {type: "string", label: "Date de naissance"},
          iGraduationYear: {type: "int", label: "Année du bac"},
          sSex: {
             type: "enum",
             values: {Male: {label: "Masculin"}, Female: {label: "Féminin"}},
             label: "Genre"
          },
          sAddress: {type: "string", label: "Adresse"},
          sZipcode: {type: "string", label: "Code postal"},
          sCity: {type: "string", label: "Ville"},
          sLandLineNumber: {type: "string", label: "Numéro de téléphone fixe"},
          sCellPhoneNumber: {type: "string", label: "Numéro de téléphone portable"},
          sDefaultLanguage: {
             type: "enum",
             values: {fr: {label: "Français"}, en: {label: "English"}},
             label: "Langue par défaut"
          },
          bNotifyNews: {type: "boolean", label: "Réception des emails de news"},
          sNotify: {
             type: "enum",
             values: {Never: {label: "Jamais"}, Answers: {label: "En cas de réponse"}, Concerned: {label: "Concerned (?)"}},
             label: "Envoi d'emails depuis le forum"
          },
          bPublicFirstName: {type: "boolean", label: "Publier son prénom sur le profil"},
          bPublicLastName: {type: "boolean", label: "Publier son nom sur le profil"},
          sFreeText: {type: "string", label: "Texte libre du profil"},
          sWebSite: {type: "string", label: "Site web sur le profil"},
          bPhotoAutoload: {type: "boolean", label: "Autoload de la photo (?)"},
          sLangProg: {type: "string", label: "Langage de programmation"},
          sLastLoginDate: {type: "jsdate", label: "Date de la dernière connexion"},
          sLastActivityDate: {type: "jsdate", label: "Date de la dernière activité"},
          sLastIP: {type: "string", label: "Dernière adresse IP"},
          bBasicEditorMode: {type: "boolean", label: "Éditeur en mode basique"},
          nbSpacesForTab: {type: "int", label: "Nombre d'espaces d'une tabulation"},
          iMemberState: {type: "int", label: "Statut de membre"},
          idUserGodfather: {type: "key", label: "Parrain"},
          iStepLevelInSite: {type: "int", label: "Niveau sur le site"},
          bIsAdmin: {type: "boolean", label: "Administrateur"},
          bNoRanking: {type: "boolean", label: "Hors classement"},
          nbHelpGiven: {type: "int", label: "Nombre d'aides données sur le forum"},
          idGroupSelf: {type: "key", label: "Groupe (droits d'accès)", link: "groupSelf", refModel: "groups", invLink: "userSelf"},
          idGroupOwned: {type: "key", label: "Groupe possédés (droits d'accès)", link: "groupOwned", refModel: "groups", invLink: "userOwned"},
          idGroupAccess: {type: "key", label: "Groupe (droits d'accès)", link: "groupAccess", refModel: "groups", invLink: "userAccess"},
          sNotificationReadDate: {type: "jsdate", label: "Date de dernière lecture des notifications"}
      },
      links: {
         threads: {refModel: "threads", key: "idUserCreated", type: "object"}
      }
   },

   users_answers: {
      fields: {
          idUser: {type: "key", label: "User"},
          idItem: {type: "key", label: "Item", refModel: "items", link: "item", invLink: "user_answers"},
          sName: {type: "string", label: ""},
          sAnswer: {type: "string", label: ""},
          sSubmissionDate: {type: "jsdate", label: "", defaultValue: null},
          iScore: {type: "float", label: ""},
          idUserGrader: {type: "key", label: "", refModel: "users", link: "user_grader"},
          bValidated: {type: "boolean", label: "", defaultValue: false},
          sGradingDate: {type: "jsdate", label: "", defaultValue: null}
      }
   },

   users_items: {
      fields: {
          idUser: {type: "key", label: "User"},
          idItem: {type: "key", label: "Item", refModel: "items", link: "item", invLink: "user_item"},
          iScore: {type: "float", label: "", readOnly: true},
          iScoreComputed: {type: "float", label: "", readOnly: true},
          iScoreDiffManual: {type: "float", label: "", readOnly: true},
          sScoreDiffComment: {type: "string", label: "", readOnly: true},
          nbSubmissionsAttempts: {type: "int", label: "", readOnly: true},
          nbTasksTried: {type: "int", label: "", readOnly: true},
          nbChildrenValidated: {type: "int", label: "", readOnly: true},
          bValidated: {type: "boolean", label: "", readOnly: true},
          bFinished: {type: "boolean", label: "", readOnly: true},
          nbTasksWithHelp: {type: "int", label: "", readOnly: true},
          nbHintsCached: {type: "int", label: "", readOnly: true},
          nbCorrectionsRead: {type: "int", label: "", readOnly: true},
          iPrecision: {type: "int", label: ""},
          iAutonomy: {type: "int", label: ""},
          sStartDate: {type: "jsdate", label: ""},
          sValidationDate: {type: "jsdate", label: "", readOnly: true},
          sFinishDate: {type: "jsdate", label: ""},
          sLastActivityDate: {type: "jsdate", label: ""},
          bRanked: {type: "boolean", label: ""},
          sAllLangProg: {type: "string", label: ""},
          sState: {type: "string", label: ""},
          sToken: {type: "string", label: "", readOnly: true}
      },
//      indexes: [
//         {name: "userItem", keys: ["idUser", "idItem"]}
//      ]
   },

   users_threads: {
      fields: {
          idUser: {type: "key", label: "User"},
          idThread: {type: "key", label: "Thread", refModel: "threads", link: "thread", invLink: "user_thread"},
          sLastReadDate: {type: "jsdate", label: "Date de la dernière lecture"},
          sLastWriteDate: {type: "jsdate", label: "Date du dernier message"},
          bStarred: {type: "int", label: "Favori"},
      }
   }
};

models.my_groups_items = models.groups_items;
