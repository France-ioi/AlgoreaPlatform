"use strict";

var models = {
   filters: {
      fields: {
         idUser: {type: "int", label: "models_filters_fields_idUser_label"},
         sName: {type: "text", label: "models_filters_fields_sName_label"},
         bSelected: {type: "boolean", label: "models_filters_fields_bSelected_label"},
         bStarred: {type: "boolean", label: "models_filters_fields_bStarred_label"},
         sStartDate: {type: "jsdate", label: "models_filters_fields_sStartDate_label"},
         sEndDate: {type: "jsdate", label: "models_filters_fields_sEndDate_label"},
         bArchived: {type: "boolean", label: "models_filters_fields_bArchived_label"},
         bParticipated: {type: "boolean", label: "models_filters_fields_bParticipated_label"},
         bUnread: {type: "boolean", label: "models_filters_fields_bUnread_label"},
         idItem: {type: "key", label: "models_filters_fields_idItem_label"},
         idGroup: {type: "key", label: "models_filters_fields_idGroup_label"},
         olderThan: {type: "int", label: "models_filters_fields_olderThan_label"},
         newerThan: {type: "int", label: "models_filters_fields_newerThan_label"},
         sUsersSearch: {type: "text", label: "models_filters_fields_sUsersSearch_label"},
         sBodySearch: {type: "text", label: "models_filters_fields_sBodySearch_label"},
         bImportant: {type: "boolean", label: "models_filters_fields_bImportant_label"}
      }
   },
   groups: {
      fields: {
         sName: {type: "string", label: "models_groups_fields_sName_label"},
         iGrade: {type: "enum", label: "models_groups_fields_iGrade_label", defaultValue: -2, nullInvalid: true,
            values: {
               "-4": {label: "models_groups_fields_iGrade_values_-4_label"},
               "-2": {label: "models_groups_fields_iGrade_values_-2_label"},
               "-1": {label: "models_groups_fields_iGrade_values_-1_label", hidden: true},
               "4": {label: "models_groups_fields_iGrade_values_4_label"},
               "5": {label: "models_groups_fields_iGrade_values_5_label"},
               "6": {label: "models_groups_fields_iGrade_values_6_label"},
               "7": {label: "models_groups_fields_iGrade_values_7_label"},
               "8": {label: "models_groups_fields_iGrade_values_8_label"},
               "9": {label: "models_groups_fields_iGrade_values_9_label"},
               "10": {label: "models_groups_fields_iGrade_values_10_label"},
               "13": {label: "models_groups_fields_iGrade_values_13_label"},
               "11": {label: "models_groups_fields_iGrade_values_11_label"},
               "14": {label: "models_groups_fields_iGrade_values_14_label"},
               "12": {label: "models_groups_fields_iGrade_values_12_label"},
               "15": {label: "models_groups_fields_iGrade_values_15_label"}
            }
         },
         sGradeDetails: {type: "string", label: "models_groups_fields_sGradeDetails_label"},
         idUser: {type: "key", label: "models_groups_fields_idUser_label"},
         sDescription: {type: "text", label: "models_groups_fields_sDescription_label"},
         sDateCreated: {type: "jsdate", label: "models_groups_fields_sDateCreated_label"},
         bOpened: {type: "boolean", label: "models_groups_fields_bOpened_label", defaultValue: true},
         bFreeAccess: {type: "boolean", label: "models_groups_fields_bFreeAccess_label"},
         idTeamItem: {type: "int", label: "models_groups_fields_idTeamItem_label", defaultValue: null},
         iTeamParticipating: {type: "boolean", label: "models_groups_fields_iTeamParticipating_label", defaultValue: false},
         sPassword: {type: "string", label: "models_groups_fields_sPassword_label", defaultValue: ''},
         sPasswordTimer: {type: "duration", label: "models_groups_fields_sPasswordTimer_label", defaultValue: null},
         sPasswordEnd: {type: "string", label: "models_groups_fields_sPasswordEnd_label", defaultValue: null},
         sRedirectPath: {type: "string", label: "models_groups_fields_sRedirectPath_label", defaultValue: null},
         bOpenContest: {type: "boolean", label: "models_groups_fields_bOpenContest_label"},
         sType: {
            type: "enum",
            values: {
               Root: {label: "models_groups_fields_sType_values_Root_label", hidden: true},
               Class: {label: "models_groups_fields_sType_values_Class_label"},
               Team: {label: "models_groups_fields_sType_values_Team_label"},
               Club: {label: "models_groups_fields_sType_values_Club_label"},
               Friends: {label: "models_groups_fields_sType_values_Friends_label"},
               Other: {label:"models_groups_fields_sType_values_Other_label"},
               UserSelf: {label:"models_groups_fields_sType_values_UserSelf_label", hidden: true},
               UserAdmin: {label:"models_groups_fields_sType_values_UserAdmin_label", hidden: true},
               RootAdmin: {label:"models_groups_fields_sType_values_RootAdmin_label", hidden: true},
               RootSelf: {label:"models_groups_fields_sType_values_RootSelf_label", hidden: true}
            },
            label: "models_groups_fields_sType_label",
            defaultValue: "Class",
            nullInvalid: true
         },
         bSendEmails: {type: "boolean", label: "models_groups_fields_bSendEmails_label"}
      },
      links: {
         children: {refModel: "groups_groups", key: "idGroupParent", type: "array"}, // array better ?
         parents: {refModel: "groups_groups", key: "idGroupChild", type: "object"},
         userSelf: {refModel: "users", key: "idGroupSelf", type: "direct"},
         userOwned: {refModel: "users", key: "idGroupOwned", type: "direct"},
         userAccess: {refModel: "users", key: "idGroupAccess", type: "direct"},
         login_prefixes: {refModel: "groups_login_prefixes", key: "idGroup", type: "array"}
      }
   },

   groups_attempts: {
      fields: {
          idGroup: {type: "key", label: "models_groups_attempts_fields_idGroup_label", refModel: "groups", link: "group"},
          idItem: {type: "key", label: "models_groups_attempts_fields_idItem_label", refModel: "items", link: "item", invLink: "groups_attempts"},
          idUserCreator: {type: "key", label: "models_groups_attempts_fields_idUserCreator_label", refModel: "users", link: "user"},
          iOrder: {type: "int", label: "models_groups_attempts_fields_iOrder_label"},
          iScore: {type: "float", label: "", readOnly: true},
          iScoreComputed: {type: "float", label: "", readOnly: true},
          iScoreReeval: {type: "float", label: "", readOnly: true},
          iScoreDiffManual: {type: "float", label: "", readOnly: true},
          sScoreDiffComment: {type: "string", label: "", readOnly: true},
          nbSubmissionsAttempts: {type: "int", label: "", readOnly: true},
          nbTasksTried: {type: "int", label: "", readOnly: true},
          nbChildrenValidated: {type: "int", label: "", readOnly: true},
          bValidated: {type: "boolean", label: "", readOnly: true},
          bFinished: {type: "boolean", label: "", readOnly: true},
          bKeyObtained: {type: "boolean", label: "", readOnly: true},
          nbTasksWithHelp: {type: "int", label: "", readOnly: true},
          sHintsRequested: {type: "string", label: "", readOnly: true},
          nbHintsCached: {type: "int", label: "", readOnly: true},
          nbCorrectionsRead: {type: "int", label: "", readOnly: true},
          iPrecision: {type: "int", label: "", readOnly: true},
          iAutonomy: {type: "int", label: "", readOnly: true},
          sStartDate: {type: "jsdate", label: ""},
          sValidationDate: {type: "jsdate", label: "", readOnly: true},
          sLastAnswerDate: {type: "jsdate", label: "", readOnly: true},
          sThreadStartDate: {type: "jsdate", label: "", readOnly: true},
          sLastHintDate: {type: "jsdate", label: "", readOnly: true},
          sFinishDate: {type: "jsdate", label: "", readOnly: true},
          sLastActivityDate: {type: "jsdate", label: ""},
          sContestStartDate: {type: "jsdate", label: "", readOnly: true},
          bRanked: {type: "boolean", label: "", readOnly: true},
          sAllLangProg: {type: "string", label: ""},
          sState: {type: "string", label: ""},
          sAnswer: {type: "string", label: ""},
          sToken: {type: "string", label: "", readOnly: true}
      },
      links: {
         user_answers: {refModel: "users_answers", key: "idItem", type: "array"}
      }
   },

   groups_login_prefixes: {
      fields: {
        idGroup: {type: "key", label: "models_groups_login_prefixes_fields_idGroup_label", refModel: "groups", link: "parent", invLink: "login_prefixes"},
        prefix: {type: "string", label: "models_groups_login_prefixes_fields_prefix_label"}
      }
   },

   groups_groups: {
      fields: {
         idGroupParent: {type: "key", label: "models_groups_groups_fields_idGroupParent_label", refModel: "groups", link: "parent", invLink: "children"},
         idGroupChild: {type: "key", label: "models_groups_groups_fields_idGroupChild_label", refModel: "groups", link: "child", invLink: "parents"},
         iChildOrder: {type: "int", label: "models_groups_groups_fields_iChildOrder_label", indexForLinks: [{refModel: "groups", key:"idGroupParent", invLink: "children"}]}, // Add automatically
         sChildLogin: {type: "string", label: "models_groups_groups_fields_sChildLogin_label", readOnly: true},
         sType: {
            type: 'enum',
            values: {
               invitationSent: {label: "models_groups_groups_fields_sType_values_invitationSent_label"},
               requestSent: {label: "models_groups_groups_fields_sType_values_requestSent_label"},
               invitationAccepted: {label: "models_groups_groups_fields_sType_values_invitationAccepted_label"},
               requestAccepted: {label: "models_groups_groups_fields_sType_values_requestAccepted_label"},
               invitationRefused: {label: "models_groups_groups_fields_sType_values_invitationRefused_label"},
               requestRefused: {label: "models_groups_groups_fields_sType_values_requestRefused_label"},
               removed: {label: "models_groups_groups_fields_sType_values_removed_label"},
               left: {label: "models_groups_groups_fields_sType_values_left_label"},
               direct: {label: "models_groups_groups_fields_sType_values_direct_label"}
            },
            defaultValue: 'direct',
            label: "models_groups_groups_fields_sType_label",
            nullInvalid: true
         },
         sRole: {
            type: 'enum',
            values: {
               owner: {label: "models_groups_groups_fields_sRole_values_owner_label", hidden: true},
               manager: {label: "models_groups_groups_fields_sRole_values_manager_label"},
               observer: {label: "models_groups_groups_fields_sRole_values_observer_label"},
               member: {label: "models_groups_groups_fields_sRole_values_member_label"}
            },
            defaultValue: 'member',
            label: "models_groups_groups_fields_sRole_label",
            nullInvalid: true
         },
         sStatusDate: {type: "jsdate", label: "models_groups_groups_fields_sStatusDate_label"},
         idUserInviting: {type: "key", label: "models_groups_groups_fields_idUserInviting_label", refModel: "users", link: "userInviting"},
         sUserInvitingLogin: {type: "string", label: "models_groups_groups_fields_sUserInvitingLogin_label", readOnly: true}
      }
   },

   items: {
      fields: {
         sUrl: {type: "string", label: "models_items_fields_sUrl_label"},
         idPlatform: {type: "int", label: "models_items_fields_idPlatform_label", defaultValue: 0},
         sTextId: {type: "string", label: "models_items_fields_sTextId_label", defaultValue: ''},
         sType: {
            type: "enum",
            values: {
               Root: {label: "models_items_fields_sType_values_Root_label"},
               Chapter: {label: "models_items_fields_sType_values_Chapter_label"},
               Task: {label: "models_items_fields_sType_values_Task_label"},
               Course: {label: "models_items_fields_sType_values_Course_label"}
            },
            label: "models_items_fields_sType_label",
            defaultValue: "Chapter",
            nullInvalid: true
         },
         bUsesAPI: {type: "boolean", label: "models_items_fields_bUsesAPI_label", defaultValue: true},
         bReadOnly: {type: "boolean", label: "models_items_fields_bReadOnly_label", defaultValue: false},
         sFullScreen: {
            type: "enum",
            values: {
               forceYes: {label: "models_items_fields_sFullScreen_values_forceYes_label"},
               forceNo: {label: "models_items_fields_sFullScreen_values_forceNo_label"},
               default: {label: "models_items_fields_sFullScreen_values_default_label"}
            },
            label: "models_items_fields_sFullScreen_label",
            defaultValue: "default",
            nullInvalid: true
         },
         bShowDifficulty: {type: "boolean", label: "models_items_fields_bShowDifficulty_label", defaultValue: false},
         bShowSource: {type: "boolean", label: "models_items_fields_bShowSource_label", defaultValue: false},
         bHintsAllowed: {type: "boolean", label: "models_items_fields_bHintsAllowed_label", defaultValue: false},
         bFixedRanks: {type: "boolean", label: "models_items_fields_bFixedRanks_label", defaultValue: false},
         sValidationType: {
            type: "enum",
            widget: "radio",
            values: {
               None: {label: "models_items_fields_sValidationType_values_None_label"},
               Categories: {label: "models_items_fields_sValidationType_values_Categories_label"},
               All: {label: "models_items_fields_sValidationType_values_All_label"},
               AllButOne: {label: "models_items_fields_sValidationType_values_AllButOne_label"},
               One: {label: "models_items_fields_sValidationType_values_One_label"},
               Manual: {label: "models_items_fields_sValidationType_values_Manual_label"}
            },
            label: "models_items_fields_sValidationType_label",
            defaultValue : 'All',
            nullInvalid: true
         },
         iValidationMin: {type: "int", label: "models_items_fields_iValidationMin_label"},
         sPreparationState: {
            type: "enum",
            widget: "radio-buttons",
            values: {
               NotReady: {label: "models_items_fields_sPreparationState_values_NotReady_label"},
               Reviewing: {label: "models_items_fields_sPreparationState_values_Reviewing_label"},
               Ready: {label: "models_items_fields_sPreparationState_values_Ready_label"}
            },
            label: "models_items_fields_sPreparationState_label",
            defaultValue : 'Ready',
            nullInvalid: true
         },
         idItemUnlocked: {type: "string", label: "models_items_fields_idItemUnlocked_label"},
         iScoreMinUnlock: {type: "int", label: "models_items_fields_iScoreMinUnlock_label"},
         sSupportedLangProg: {type: "string", label: "models_items_fields_sSupportedLangProg_label", defaultValue: '*'},
         idDefaultLanguage: {type: "key", label: "models_items_fields_idDefaultLanguage_label", refModel: "languages", link: "defaultLanguage"},
         sTeamMode: {
            type: "enum",
            widget: "radio-buttons",
            values: {
               All: {label: "models_items_fields_sTeamMode_values_All_label"},
               Half: {label: "models_items_fields_sTeamMode_values_Half_label"},
               One: {label: "models_items_fields_sTeamMode_values_One_label"},
               None: {label: "models_items_fields_sTeamMode_values_None_label"}
            },
            label: "models_items_fields_sTeamMode_label",
            defaultValue: null
         },
         bTeamsEditable: {type: "boolean", label: "models_items_fields_bTeamsEditable_label"},
         idTeamInGroup: {type: "int", label: "models_items_fields_idTeamInGroup_label", refModel: "groups", link: "teamInGroup", defaultValue: null},
         iTeamMaxMembers: {type: "int", label: "models_items_fields_iTeamMaxMembers_label"},
         bHasAttempts: {type: "boolean", label: "models_items_fields_bHasAttempts_label", defaultValue: false},
         sAccessOpenDate: {type: "jsdate", label: "models_items_fields_sAccessOpenDate_label"},
         sDuration: {type: "duration", label: "models_items_fields_sDuration_label", defaultValue: null},
         sEndContestDate: {type: "jsdate", label: "models_items_fields_sEndContestDate_label"},
         bShowUserInfos: {type: "boolean", label: "models_items_fields_bShowUserInfos_label"},
         sContestPhase: {
            type: "enum",
            values: {
               Running: {label: "models_items_fields_sContestPhase_values_Running_label"},
               Analysis: {label: "models_items_fields_sContestPhase_values_Analysis_label"},
               Closed: {label: "models_items_fields_sContestPhase_values_Closed_label"}
            },
            label: "models_items_fields_sContestPhase_label",
            defaultValue: "Running",
            nullInvalid: true
         },
         iLevel: {type: "int", label: "models_items_fields_iLevel_label"},
         bNoScore: {type: "boolean", label: "models_items_fields_bNoScore_label", defaultValue: false},
         bGrayedAccess: {type: "boolean", label: "models_items_fields_bGrayedAccess_label", defaultValue: false, readOnly: true},
         bOwnerAccess: {type: "boolean", label: "models_items_fields_bOwnerAccess_label", defaultValue: false, readOnly: true},
         bManagerAccess: {type: "boolean", label: "models_items_fields_bManagerAccess_label", defaultValue: false, readOnly: true},
         bAccessSolutions: {type: "boolean", label: "models_items_fields_bAccessSolutions_label", defaultValue: false, readOnly: true},
         bTitleBarVisible: {type: "boolean", label: "models_items_fields_bTitleBarVisible_label", defaultValue: 1},
         bTransparentFolder: {type: "boolean", label: "models_items_fields_bTransparentFolder_label", defaultValue: 0},
         bDisplayChildrenAsTabs: {type: "boolean", label: "models_items_fields_bDisplayChildrenAsTabs_label", defaultValue: 0},
         bCustomChapter: {type: "boolean", label: null, defaultValue: 0, readOnly: true},
         bDisplayDetailsInParent: {type: "boolean", label: "models_items_fields_bDisplayDetailsInParent_label", defaultValue: 0},
         groupCodeEnter: {type: "boolean", label: "models_items_fields_groupCodeEnter_label", defaultValue: 0}
      },
      links: {
         children: {refModel: "items_items", key: "idItemParent", type: "array", orderBy: "iChildOrder"},
         parents: {refModel: "items_items", key: "idItemChild", type: "object"},
         strings: {refModel: "items_strings", key: "idItem", type: "array"},
         user_answers: {refModel: "users_answers", key: "idItem", type: "array"},
         user_item: {refModel: "users_items", key: "idItem", type: "object"},
         groups_attempts: {refModel: "groups_attempts", key: "idItem", type: "object"},
         threads: {refModel: "threads", key: "idItem", type: "object"},
         group_items: {refModel: "groups_items", key: "idItem", type: "array"} // array better ?
         //descendants: {refModel: "items_ancestors", key: "idItemAncestor", type: "object"}, // array better ?
      },
      indexes: [
         {name: "sTextId", keys: ["sTextId"]}
      ]
   },

   items_items: {
      fields: {
         idItemParent: {type: "key", label: "models_items_items_fields_idItemParent_label", refModel: "items", link: "parent", invLink: "children"},
         idItemChild: {type: "key", label: "models_items_items_fields_idItemChild_label", refModel: "items", link: "child", invLink: "parents"},
         iChildOrder: {type: "int", label: "models_items_items_fields_iChildOrder_label", indexForLinks: [{refModel: "items", key:"idItemParent", invLink: "children"}]}, // Add automatically
         sCategory: {
            type: "enum",
            widget: "radio",
            values: {
               Undefined: {label: "models_items_items_fields_sCategory_values_Undefined_label"},
               Course: {label: "models_items_items_fields_sCategory_values_Course_label"},
               Discovery: {label: "models_items_items_fields_sCategory_values_Discovery_label"},
               Application: {label: "models_items_items_fields_sCategory_values_Application_label"},
               Validation: {label: "models_items_items_fields_sCategory_values_Validation_label"},
               Challenge: {label: "models_items_items_fields_sCategory_values_Challenge_label"}
            },
            label: "models_items_items_fields_sCategory_label",
            defaultValue : 'Undefined'
         },
         bAccessRestricted: {
            type: "int",
            widget: "radio",
            values: {
               0: {label: "models_items_items_fields_bAccessRestricted_values_0_label"},
               1: {label: "models_items_items_fields_bAccessRestricted_values_1_label"}
            },
            label: "models_items_items_fields_bAccessRestricted_label",
            defaultValue: 1
         },
         bAlwaysVisible: {
            type: "int",
            widget: "radio",
            values: {
               0: {label: "models_items_items_fields_bAlwaysVisible_values_0_label"},
               1: {label: "models_items_items_fields_bAlwaysVisible_values_1_label"}
            },
            label: "models_items_items_fields_bAlwaysVisible_label",
            defaultValue: 0
         },
         iDifficulty: {type: "int", label: "models_items_items_fields_iDifficulty_label", defaultValue: 0}
      }
   },

   items_strings: {
      fields: {
         idItem: {type: "key", label: "models_items_strings_fields_idItem_label", refModel: "items", link: "item", invLink: "strings"},
         idLanguage: {type: "key", label: "models_items_strings_fields_idLanguage_label", refModel: "languages", link: "language"},
         sTranslator: {type: "string", label: "models_items_strings_fields_sTranslator_label", defaultValue: ''},
         sTitle: {type: "string", label: "models_items_strings_fields_sTitle_label", defaultValue: ''},
         sImageUrl: {type: "string", label: "models_items_strings_fields_sImageUrl_label", defaultValue: null},
         sSubtitle: {type: "string", label: "models_items_strings_fields_sSubtitle_label", defaultValue: ''},
         sDescription: {type: "text", label: "models_items_strings_fields_sDescription_label", defaultValue: ''},
         sEduComment: {type: "text", label: "models_items_strings_fields_sEduComment_label", defaultValue: ''},
         sRankingComment: {type: "text", label: "models_items_strings_fields_sRankingComment_label", defaultValue: ''}
      }
   },

   items_ancestors: {
      fields: {
         idItemAncestor: {type: "key", label: "models_items_ancestors_fields_idItemAncestor_label", refModel: "items", link: "itemAncestor"/*, invLink: "descendants"*/},
         idItemChild: {type: "key", label: "models_items_ancestors_fields_idItemChild_label", refModel: "items", link: "itemDescendant"}
      },
      indexes: [
         {name: "idItemAncestor", keys: ["idItemAncestor"], values: "idItemChild"}
      ]
   },

   groups_items: {
      fields: {
         idGroup: {type: "key", label: "models_groups_items_fields_idGroup_label", refModel: "groups", link: "group"},
         idItem: {type: "key", label: "models_groups_items_fields_idItem_label", refModel: "items", link: "item", invLink: 'group_items'},
         idUserCreated: {type: "key", label: "models_groups_items_fields_idUserCreated_label" /*, refModel: "users", link: "userCreated"*/},
         sPartialAccessDate: {type: "jsdate", label: "models_groups_items_fields_sPartialAccessDate_label"},
         sFullAccessDate: {type: "jsdate", label: "models_groups_items_fields_sFullAccessDate_label"},
         sAccessReason: {type: "string", label: "models_groups_items_fields_sAccessReason_label", defaultValue: ''},
         sAccessSolutionsDate: {type: "jsdate", label: "models_groups_items_fields_sAccessSolutionsDate_label"},
         bOwnerAccess: {type: "boolean", label: "models_groups_items_fields_bOwnerAccess_label", defaultValue: false},
         bManagerAccess: {type: "boolean", label: "models_groups_items_fields_bManagerAccess_label", defaultValue: false},
         sCachedPartialAccessDate: {type: "jsdate", label: "models_groups_items_fields_sCachedPartialAccessDate_label"},
         sCachedFullAccessDate: {type: "jsdate", label: "models_groups_items_fields_sCachedFullAccessDate_label"},
         sCachedAccessSolutionsDate: {type: "jsdate", label: "models_groups_items_fields_sCachedAccessSolutionsDate_label"},
         sCachedGrayedAccessDate: {type: "jsdate", label: "models_groups_items_fields_sCachedGrayedAccessDate_label"},
         bCachedFullAccess: {type: "boolean", label: "models_groups_items_fields_bCachedFullAccess_label", defaultValue: false},
         bCachedPartialAccess: {type: "boolean", label: "models_groups_items_fields_bCachedPartialAccess_label", defaultValue: false},
         bCachedAccessSolutions: {type: "boolean", label: "models_groups_items_fields_bCachedAccessSolutions_label", defaultValue: false},
         bCachedGrayedAccess: {type: "boolean", label: "models_groups_items_fields_bCachedGrayedAccess_label", defaultValue: false},
         bCachedManagerAccess: {type:"boolean", label: "models_groups_items_fields_bCachedManagerAccess_label", defaultValue: false},
         sPropagateAccess: {type: "string", label: "", defaultValue: 'self'}
      },
      indexes: [
         {name: "groupItem", keys: ["idGroup", "idItem"]}
      ]
   },

   languages: {
      fields: {
          sName: {type: "string", label: "models_languages_fields_sName_label"},
          sCode: {type: "string", label: "models_languages_fields_sCode_label"}
      }
   },

   messages: {
      fields: {
          idThread: {type: "key", label: "models_messages_fields_idThread_label", refModel: "threads", link: "thread", invLink: "messages"},
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
             values: {Help: {label: "models_threads_fields_sType_values_Help_label"}, General: {label: "models_threads_fields_sType_values_General_label"}, Bug: {label: "models_threads_fields_sType_values_Bug_label"}},
             label: "models_threads_fields_sType_label"
          },
          sLastActivityDate: {type: "jsdate", label: ""},
          sSubmissionDate: {type: "jsdate", label: ""},
          idUserCreated: {type: "key", label: "", refModel: "users", link: "user", invLink: "threads"},
          sUserCreatedLogin: {type: "string", label: ""},
          idItem: {type: "key", label: "models_threads_fields_idItem_label", refModel: "items", link: "item", invLink: "threads"},
          sTitle: {type: "text", label: "models_threads_fields_sTitle_label"},
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
          sLogin: {type: "string", label: "models_users_fields_sLogin_label"},
          sOpenIdIdentity: {type: "string", label: "models_users_fields_sOpenIdIdentity_label"},
          sPasswordMd5: {type: "string", label: "models_users_fields_sPasswordMd5_label"},
          sSalt: {type: "string", label: "models_users_fields_sSalt_label"},
          sRecover: {type: "string", label: "models_users_fields_sRecover_label"},
          sRegistrationDate: {type: "jsdate", label: "models_users_fields_sRegistrationDate_label"},
          sEmail: {type: "string", label: "models_users_fields_sEmail_label"},
          bEmailVerified: {type: "boolean", label: "models_users_fields_bEmailVerified_label"},
          sFirstName: {type: "string", label: "models_users_fields_sFirstName_label"},
          sLastName: {type: "string", label: "models_users_fields_sLastName_label"},
          sCountryCode: {type: "string", label: "models_users_fields_sCountryCode_label"},
          sTimeZone: {type: "string", label: "models_users_fields_sTimeZone_label"},
          sBirthDate: {type: "string", label: "models_users_fields_sBirthDate_label"},
          iGraduationYear: {type: "int", label: "models_users_fields_iGraduationYear_label"},
          iGrade: {
            type: "enum",
            label: "models_users_fields_iGrade_label",
            defaultValue: null,
            values: {
                "-1": {label: "models_users_fields_iGrade_values_-1_label"},
                "-2": {label: "models_users_fields_iGrade_values_-2_label", hidden: true},
                "0" : {label: "models_users_fields_iGrade_values_0_label"},
                "1" : {label: "models_users_fields_iGrade_values_1_label"},
                "2" : {label: "models_users_fields_iGrade_values_2_label"},
                "3" : {label: "models_users_fields_iGrade_values_3_label"},
                "4" : {label: "models_users_fields_iGrade_values_4_label"},
                "5" : {label: "models_users_fields_iGrade_values_5_label"},
                "6" : {label: "models_users_fields_iGrade_values_6_label"},
                "7" : {label: "models_users_fields_iGrade_values_7_label"},
                "8" : {label: "models_users_fields_iGrade_values_8_label"},
                "9" : {label: "models_users_fields_iGrade_values_9_label"},
                "10": {label: "models_users_fields_iGrade_values_10_label"},
                "11": {label: "models_users_fields_iGrade_values_11_label"}
            }
          },
          sStudentId: {type: "string", label: "models_users_fields_sStudentId_label"},
          sSex: {
             type: "enum",
             values: {Male: {label: "models_users_fields_sSex_values_Male_label"}, Female: {label: "models_users_fields_sSex_values_Female_label"}},
             label: "models_users_fields_sSex_label"
          },
          sAddress: {type: "string", label: "models_users_fields_sAddress_label"},
          sZipcode: {type: "string", label: "models_users_fields_sZipcode_label"},
          sCity: {type: "string", label: "models_users_fields_sCity_label"},
          sLandLineNumber: {type: "string", label: "models_users_fields_sLandLineNumber_label"},
          sCellPhoneNumber: {type: "string", label: "models_users_fields_sCellPhoneNumber_label"},
          sDefaultLanguage: {
             type: "enum",
             values: {fr: {label: "models_users_fields_sDefaultLanguage_values_fr_label"}, en: {label: "models_users_fields_sDefaultLanguage_values_en_label"}},
             label: "models_users_fields_sDefaultLanguage_label"
          },
          bNotifyNews: {type: "boolean", label: "models_users_fields_bNotifyNews_label"},
          sNotify: {
             type: "enum",
             values: {Never: {label: "models_users_fields_sNotify_values_Never_label"}, Answers: {label: "models_users_fields_sNotify_values_Answers_label"}, Concerned: {label: "models_users_fields_sNotify_values_Concerned_label"}},
             label: "models_users_fields_sNotify_label"
          },
          bPublicFirstName: {type: "boolean", label: "models_users_fields_bPublicFirstName_label"},
          bPublicLastName: {type: "boolean", label: "models_users_fields_bPublicLastName_label"},
          sFreeText: {type: "string", label: "models_users_fields_sFreeText_label"},
          sWebSite: {type: "string", label: "models_users_fields_sWebSite_label"},
          bPhotoAutoload: {type: "boolean", label: "models_users_fields_bPhotoAutoload_label"},
          sLangProg: {type: "string", label: "models_users_fields_sLangProg_label"},
          sLastLoginDate: {type: "jsdate", label: "models_users_fields_sLastLoginDate_label"},
          sLastActivityDate: {type: "jsdate", label: "models_users_fields_sLastActivityDate_label"},
          sLastIP: {type: "string", label: "models_users_fields_sLastIP_label"},
          bBasicEditorMode: {type: "boolean", label: "models_users_fields_bBasicEditorMode_label"},
          nbSpacesForTab: {type: "int", label: "models_users_fields_nbSpacesForTab_label"},
          iMemberState: {type: "int", label: "models_users_fields_iMemberState_label"},
          idUserGodfather: {type: "key", label: "models_users_fields_idUserGodfather_label"},
          iStepLevelInSite: {type: "int", label: "models_users_fields_iStepLevelInSite_label"},
          bIsAdmin: {type: "boolean", label: "models_users_fields_bIsAdmin_label"},
          bNoRanking: {type: "boolean", label: "models_users_fields_bNoRanking_label"},
          nbHelpGiven: {type: "int", label: "models_users_fields_nbHelpGiven_label"},
          idGroupSelf: {type: "key", label: "models_users_fields_idGroupSelf_label", link: "groupSelf", refModel: "groups", invLink: "userSelf"},
          idGroupOwned: {type: "key", label: "models_users_fields_idGroupOwned_label", link: "groupOwned", refModel: "groups", invLink: "userOwned"},
          idGroupAccess: {type: "key", label: "models_users_fields_idGroupAccess_label", link: "groupAccess", refModel: "groups", invLink: "userAccess"},
          sNotificationReadDate: {type: "jsdate", label: "models_users_fields_sNotificationReadDate_label"},
          loginModulePrefix: {type: "string", label: "models_users_fields_loginModulePrefix_label"},
          allowSubgroups: {type: "boolean", label: ""}
      },
      links: {
         threads: {refModel: "threads", key: "idUserCreated", type: "object"}
      }
   },

   users_answers: {
      fields: {
          idUser: {type: "key", label: "models_users_answers_fields_idUser_label", refModel: "users", link: "user"},
          idItem: {type: "key", label: "models_users_answers_fields_idItem_label", refModel: "items", link: "item", invLink: "user_answers"},
          idAttempt: {type: "key", label: "models_users_answers_fields_idAttempt_label", refModel: "groups_attempts", link: "attempt", invLink: "user_answers"},
          sName: {type: "string", label: ""},
          sType: {
             type: "enum",
             values: {
                Submission: {label: "models_items_fields_sType_values_Submission_label"},
                Saved: {label: "models_items_fields_sType_values_Saved_label"},
                Current: {label: "models_items_fields_sType_values_Current_label"}
             },
             label: "models_items_fields_sType_label",
             defaultValue: "Submission",
             nullInvalid: true
          },
          sState: {type: "string", label: ""},
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
          idUser: {type: "key", label: "models_users_items_fields_idUser_label", refModel: "users", link: "user"},
          idItem: {type: "key", label: "models_users_items_fields_idItem_label", refModel: "items", link: "item", invLink: "user_item"},
          idAttemptActive: {type: "key", label: "models_users_items_fields_idAttemptActive_label", refModel: "groups_attempts", link: "attempt"},
          iScore: {type: "float", label: "", readOnly: true},
          iScoreComputed: {type: "float", label: "", readOnly: true},
          iScoreReeval: {type: "float", label: "", readOnly: true},
          iScoreDiffManual: {type: "float", label: "", readOnly: true},
          sScoreDiffComment: {type: "string", label: "", readOnly: true},
          nbSubmissionsAttempts: {type: "int", label: "", readOnly: true},
          nbTasksTried: {type: "int", label: "", readOnly: true},
          nbChildrenValidated: {type: "int", label: "", readOnly: true},
          bValidated: {type: "boolean", label: "", readOnly: true},
          bFinished: {type: "boolean", label: "", readOnly: true},
          bKeyObtained: {type: "boolean", label: "", readOnly: true},
          nbTasksWithHelp: {type: "int", label: "", readOnly: true},
          sHintsRequested: {type: "string", label: "", readOnly: true},
          nbHintsCached: {type: "int", label: "", readOnly: true},
          nbCorrectionsRead: {type: "int", label: "", readOnly: true},
          iPrecision: {type: "int", label: "", readOnly: true},
          iAutonomy: {type: "int", label: "", readOnly: true},
          sStartDate: {type: "jsdate", label: ""},
          sValidationDate: {type: "jsdate", label: "", readOnly: true},
          sLastAnswerDate: {type: "jsdate", label: "", readOnly: true},
          sThreadStartDate: {type: "jsdate", label: "", readOnly: true},
          sLastHintDate: {type: "jsdate", label: "", readOnly: true},
          sFinishDate: {type: "jsdate", label: "", readOnly: true},
          sLastActivityDate: {type: "jsdate", label: ""},
          sContestStartDate: {type: "jsdate", label: "", readOnly: true},
          bRanked: {type: "boolean", label: "", readOnly: true},
          sAllLangProg: {type: "string", label: ""},
          sState: {type: "string", label: ""},
          sAnswer: {type: "string", label: ""},
          sToken: {type: "string", label: "", readOnly: true}
      },
//      indexes: [
//         {name: "userItem", keys: ["idUser", "idItem"]}
//      ]
   },

   users_threads: {
      fields: {
          idUser: {type: "key", label: "models_users_threads_fields_idUser_label"},
          idThread: {type: "key", label: "models_users_threads_fields_idThread_label", refModel: "threads", link: "thread", invLink: "user_thread"},
          sLastReadDate: {type: "jsdate", label: "models_users_threads_fields_sLastReadDate_label"},
          sLastWriteDate: {type: "jsdate", label: "models_users_threads_fields_sLastWriteDate_label"},
          bStarred: {type: "int", label: "models_users_threads_fields_bStarred_label"}
      }
   }
};

models.my_groups_items = models.groups_items;
