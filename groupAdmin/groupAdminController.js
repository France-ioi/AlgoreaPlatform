angular.module('algorea').directive('field', function() {
   return {
      restrict: 'E',
      scope: {
         model: '=',
         readonly: '@',
         onchange: '&'
      },
      link: function(scope, elem, attrs) {
         var parts = attrs.field.split(".");
         scope.field = models[parts[0]].fields[parts[1]];
         scope.fieldname = parts[1];
         if (!scope.onchange) {
            scope.onchange = function() {};
         }
      },
      controller: ['$scope', function($scope) {
         $scope.clear = function() {
            if ($scope.field.type == "jsdate") {
               $scope.model[$scope.fieldname] = null;
            }
         };
      }],
      templateUrl: "commonFramework/angularDirectives/formField.html",
      replace: true
   };
});

angular.module('algorea').
  filter('byRequest', function() {
    return function(children) {
      var out = [];
      angular.forEach(children, function(child) {
         if (child.sType == 'requestSent') {
            out.push(child);
         }
      });
      return out;
    };
  });

angular.module('algorea').
  filter('invitation', function() {
    return function(children) {
      var out = [];
      angular.forEach(children, function(child) {
         if (child.sType == 'invitationSent' || child.sType == 'invitationRefused') {
            out.push(child);
         }
      });
      return out;
    };
  });

angular.module('algorea').
  filter('confirmed', function() {
    return function(children) {
      var out = [];
      angular.forEach(children, function(child) {
         if (child.sType == 'direct' || child.sType == 'requestAccepted' || child.sType == 'invitationAccepted') {
            out.push(child);
         }
      });
      return out;
    };
  });

angular.module('algorea').
  filter('userSort', function() {
    return function(groups_groups, parent, owned) {
      var res = _.sortBy(groups_groups, function(g_g) {
         var group = parent ? g_g.parent : g_g.child;
         var user = owned ? group.userOwned : group.userSelf;
         return user ? user.sLogin : '';
      });
      return res;
    };
  });

angular.module('algorea').
  filter('usersOnly', function() {
    return function(groups_groups) {
      var r = _.filter(groups_groups, function(g) {
        return g.child.sType == 'UserSelf';
      })
      return r;
    };
  });

angular.module('algorea')
   .controller('groupAdminBreadCrumbsController', ['$scope', '$stateParams', '$i18next', function ($scope, $stateParams, $i18next) {
   'use strict';
   $scope.groupName = $i18next.t('groupAdmin_loading');
   if ($stateParams.idGroup == 'new') {
      $scope.groupName = $i18next.t('groupAdmin_new_group');
   }
   $scope.$on('algorea.groupSynced', function() {
      var groupId = $stateParams.idGroup;
      $scope.group = ModelsManager.getRecord('groups', groupId);
      if (!$scope.group) {
         $scope.group = {sName: 'error!'};
         return;
      }
   });
}]);

angular.module('algorea')
   .controller('groupAdminPopupController', ['$scope', '$uibModalInstance', 'popupData', function ($scope, $uibModalInstance, popupData) {
   'use strict';
   if (popupData) {
      $scope.user_item = popupData.user_item;
      $scope.item = popupData.item;
      $scope.thread = popupData.thread;
   }
   $scope.inPopup = true;
   $scope.close = function () {
      $uibModalInstance.close();
   };
}]);

angular.module('algorea')
   .controller('groupAdminController', ['$scope', '$stateParams', 'itemService', '$uibModal', '$http', '$rootScope', '$state', '$timeout', '$filter', '$i18next', function ($scope, $stateParams, itemService, $uibModal, $http, $rootScope, $state, $timeout, $filter, $i18next) {
   'use strict';
   $scope.error = null;


    function validateSection(section) {
     return section ? section : 'description'
    }
    $scope.section = validateSection($stateParams.section ? $stateParams.section : 'description');

    $scope.selectSection = function(section) {
      $scope.section = validateSection(section);
      $state.go('groupAdminGroup', {section: section}, {notify: false});
    }

   $scope.layout.isOnePage(true);
   $scope.layout.hasMap('never');
   $scope.groupFields = models.groups.fields;

   function getThread(user_item) {
      if (!user_item.item) {
         return null;
      }
      var res = null;
      angular.forEach(user_item.item.threads, function(thread) {
         if (thread.idUser == user_item.idUser) {
            res = thread;
            return false;
         }
      });
      return res;
   }

   $scope.openPopup = function(user_item) {
      var thread = getThread(user_item);
      var my_user_item = itemService.getUserItem(user_item.item);
      var item = user_item.item;
      if (my_user_item && (my_user_item.bValidated || item.bAccessSolutions || item.bOwnerAccess || item.bManagerAccess)) {
         var popupData = {
               user_item: user_item,
               thread: thread,
               readOnlyIfNoThread: true,
               item: user_item.item
            };
         $uibModal.open({
            template: '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" ng-click="close();" style="padding-right:5px;">&times;</button><div ng-include="\'forum/thread.html\'" ng-controller="forumThreadController" class="forum-in-task" id="forum-in-task"></div>',
            controller: 'groupAdminPopupController',
            resolve: {popupData: function () { return popupData; }},
            windowClass: 'groupAdmin-modal'
          });
      } else {
         $uibModal.open({
            template: '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" ng-click="close();" style="padding-right:5px;">&times;</button>'+$i18next.t('groupAdmin_solve_required'),
            controller: 'groupAdminPopupController',
            resolve: {popupData: function () {}},
          });
      }
   };

   $scope.getClass = function(userItem) {
      if (!userItem || !userItem.sLastActivityDate) {
         return 'unread';
      }
      if (userItem.bValidated) {
         if (userItem.iScore != 100 && userItem.item.sType == 'Task') {
            return 'validated_partial';
         }
         return 'validated';
      } else {
         if (userItem.nbSubmissionsAttempts && userItem.item.sType == 'Task') {
            return 'failed';
         }
         return 'read';
      }

   }

   $scope.numberOfEvents = 10;

   var getTypeString = function(type, userItem) {
      if (type == 'hint') {
         return userItem.nbHintsCached+$i18next.t('groupAdmin_type_hint');
      }
      if (type == 'answer') {
         return userItem.nbSubmissionsAttempts+$i18next.t('groupAdmin_type_answer');
      }
      if (type == 'validation') {
         return $i18next.t('groupAdmin_type_validation');
      }
      if (type == 'newThread') {
         return $i18next.t('groupAdmin_type_newThread');
      }
   };

   var durationToStr = function(date1, date2) {
      if (!date2 || !date1) return '-';
      var timeDiffMs = Math.abs(date2.getTime() - date1.getTime());
      var diffHours = Math.floor(timeDiffMs / (1000 * 3600));
      if (diffHours < 24) {
         var diffMinutes = Math.floor(timeDiffMs / (1000 * 60));
         if (diffMinutes < 60) {
            return diffMinutes+'mn';
         }
         diffMinutes = diffMinutes - 60*diffHours;
         return diffHours+'h '+diffMinutes+'mn';
      }
      var diffDays = Math.floor(timeDiffMs / (1000 * 3600 * 24));
      if (diffDays < 90) {
         return '> '+diffDays+' '+$i18next.t('days');
      }
      var diffMonth = Math.floor(timeDiffMs / (1000 * 3600 * 24 * 30));
      if (diffMonth < 24) {
         return '> '+diffMonth+' '+$i18next.t('months');
      }
      var diffYear = Math.floor(timeDiffMs / (1000 * 3600 * 24 * 365));
      return '> '+diffYear+' '+$i18next.t('years');
   }

   $scope.getDuration = function(user_item) {
      if (!user_item || !user_item.sStartDate || user_item.sStartDate.getYear() < 100) {
         return '-';
      }
      if (user_item.bValidated) {
         return durationToStr(user_item.sStartDate, user_item.sValidationDate);
      }
      var now = new Date();
      return durationToStr(user_item.sStartDate, now);
   }

   $scope.getDate = function(user_item) {
      if (!user_item || !user_item.sStartDate || user_item.sStartDate.getYear() < 100) {
         return '-';
      }
      if (user_item.sValidationDate) {
         return $filter('date')(new Date(user_item.sValidationDate), 'dd/MM/yyyy');
      }
      if (user_item.sLastActivityDate) {
         return $filter('date')(new Date(user_item.sLastActivityDate), 'dd/MM/yyyy');
      }
      return '-';
   }

   function getUserStr(user) {
      if (!user) {
         return $i18next.t('groupAdmin_unkonwn_user');
      }
      var res = user.sLogin;
      if (user.sFirstName || user.sLastName) {
         res += ' (';
      }
      if (user.sFirstName) {
         res += user.sFirstName + (user.sLastName ? ' ' : '');
      }
      if (user.sLastName) {
         res += user.sLastName;
      }
      if (user.sFirstName || user.sLastName) {
         res += ')';
      }
      return res;
   }

   var insertEvent = function(userItem, type, date) {
      var eventStr = getTypeString(type, userItem);
      var userStr = getUserStr(userItem.user);
      var event = {
         'date': date,
         'userStr': userStr,
         'eventStr': eventStr,
         'itemStr': userItem.item.strings[0].sTitle,
         'user_item': userItem
      };
      // insertion in a sorted array:
      $scope.events.splice(_.sortedIndexBy($scope.events, event, function(event) {return event.date;}), 0, event);
      if ($scope.events.length > $scope.numberOfEvents) {
         $scope.events.shift();
         $scope.oldestEventDate = $scope.events[$scope.events.length-1].date;
      }
   };

   $scope.updateEvents = function() {
      $scope.events = [];
      $scope.oldestEventDate = new Date("2012-01-15");
      var usersItems = ModelsManager.curData.users_items;
      angular.forEach(usersItems, function(userItem) {
         if (!$scope.usersSelected[userItem.idUser] || !$scope.itemsListRev[userItem.idItem]) {
            return;
         }
         if (userItem.sValidationDate > $scope.oldestEventDate) {
            insertEvent(userItem, 'validation', userItem.sValidationDate);
         }
         if (userItem.sLastAnswerDate > $scope.oldestEventDate && userItem.sLastAnswerDate != userItem.sValidationDate) {
            insertEvent(userItem, 'answer', userItem.sLastAnswerDate);
         }
         if (userItem.item.sType == 'task' && userItem.sLastHintDate > $scope.oldestEventDate) {
            insertEvent(userItem, 'hint', userItem.sLastHintDate);
         }
         if (userItem.sThreadStartDate > $scope.oldestEventDate) {
            insertEvent(userItem, 'newThread', userItem.sThreadStartDate);
         }
      });
      _.reverse($scope.events);
   };

   var needToUpdateAtEndOfSync = false;
   ModelsManager.addListener('users_items', 'deleted', 'groupAdminDeleted', function() {needToUpdateAtEndOfSync = true;});
   ModelsManager.addListener('users_items', 'inserted', 'groupAdminInserted', function() {needToUpdateAtEndOfSync = true;});
   ModelsManager.addListener('users_items', 'updated', 'groupAdminUpdated', function() {needToUpdateAtEndOfSync = true;});

   $scope.invitationError = null;
   $scope.newInvitationOpened = false;
   $scope.formValues = {};
   $scope.hasObjectChanged = function(modelName, record) {
      if (!record) {
         return false;
      }
      return ModelsManager.hasRecordChanged(modelName, record.ID);
   };
   $scope.newInvitation = function() {
      $scope.newInvitationOpened = true;
   };
   $scope.confirmInvitation = function() {
      $scope.newInvitationOpened = false;
   };
   $scope.showTable = function() {
      var res = false;
      angular.forEach($scope.group.children, function(child) {
         if (child.sType != 'direct') {
            res = true;
            return false;
         }
      });
      return res;
   };

   $scope.updateGroupsGroups = function() {
      $scope.showRequestTable = false;
      $scope.showInvitationTable = false;
      angular.forEach($scope.group.children, function(child) {
         if (child.sType == 'requestSent') {
            $scope.showRequestTable = true;
            return;
         }
         if (child.sType == 'invitationSent' || child.sType == 'invitationRefused') {
            $scope.showInvitationTable = true;
         }
      });
   }

   var needToUpdateGroupsGroupsAtEndOfSync = false;
   ModelsManager.addListener('groups_groups', 'updated', 'groupAdminGpsGpsDeleted', function() {needToUpdateGroupsGroupsAtEndOfSync = true;}, true);
   ModelsManager.addListener('groups_groups', 'inserted', 'groupAdminGpsGpsInserted', function() {needToUpdateGroupsGroupsAtEndOfSync = true;}, true);
   ModelsManager.addListener('groups_groups', 'deleted', 'groupAdminGpsGpsDeleted', function() {needToUpdateGroupsGroupsAtEndOfSync = true;}, true);

   $scope.printType = function(type) {
      return models.groups_groups.fields.sType.values[type].label;
   };
   $scope.cancelInvitation = function(group_group) {
      ModelsManager.deleted('groups_groups', group_group.ID);
      $scope.updateGroupsGroups();
   };
   $scope.acceptRequest = function(group_group) {
      group_group.sType = 'requestAccepted';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
      $scope.updateGroupsGroups();
   };
   $scope.refuseRequest = function(group_group) {
      group_group.sType = 'requestRefused';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
      $scope.updateGroupsGroups();
   };
   $scope.inviteLogins = function() {
      if (!$scope.formValues.currentLogins) {
         return;
      }
      var logins = $scope.formValues.currentLogins.split(' ');
      $scope.invitationError = '';
      $http.post('/admin/invitations.php', {action: 'getGroupsFromLogins', logins: logins}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from invitation handler: "+postRes.error);
         } else {
            if (postRes.loginsNotFound.length) {
               $scope.invitationError = $i18next.t('groupAdmin_logins_not_found')+postRes.loginsNotFound.join(' ')+'. ';
            }
            var alreadyInvitedLogins = [];
            var alreadyInvitedGroupIds = {};
            angular.forEach($scope.group.children, function(child, ID) {
               alreadyInvitedGroupIds[child.idGroupChild] = ID;
            });
            angular.forEach(postRes.logins_groups, function(groupId, login) {
               if (alreadyInvitedGroupIds[groupId]) {
                  var child = $scope.group.children[alreadyInvitedGroupIds[groupId]];
                  if (child.sType == 'invitationSent' || child.sType == 'invitationAccepted' || child.sType == 'requestSent' || child.sType == 'requestAccepted' || child.sType == 'direct') {
                     alreadyInvitedLogins.push(login);
                  } else {
                     child.sType = 'invitationSent';
                     child.sStatusDate = new Date();
                     ModelsManager.updated('groups_groups', child.ID);
                  }
               } else {
                  $scope.createInvitation(groupId, login);
               }
            });
            if (alreadyInvitedLogins.length) {
               $scope.invitationError += $i18next.t('groupAdmin_logins_already_invited')+alreadyInvitedLogins.join(' ')+'. ';
            }
            $scope.formValues.currentLogins = '';
         }
      })
      .error(function() {
         console.error("error calling invitations.php");
      });
   };

   $scope.inviteAdminLogins = function() {
      if (!$scope.formValues.adminLogins) {
         return;
      }
      var logins = $scope.formValues.adminLogins.split(' ');
      $scope.adminLoading = true;
      $http.post('/admin/invitations.php', {action: 'getAdminGroupsFromLogins', logins: logins, idGroup: $scope.group.ID}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin invitation handler: "+postRes.error);
         } else {
            if (postRes.loginsNotFound.length) {
               $scope.adminInvitationError = $i18next.t('groupAdmin_logins_not_found')+postRes.loginsNotFound.join(' ')+'. ';
            }
            var alreadyInvitedLogins = [];
            var alreadyInvitedGroupIds = {};
            angular.forEach($scope.group.parents, function(parent, ID) {
               alreadyInvitedGroupIds[parent.idGroupParent] = ID;
            });
            var groupsToInvite = [];
            angular.forEach(postRes.logins_groups, function(groupId, login) {
               if (alreadyInvitedGroupIds[groupId]) {
                  alreadyInvitedLogins.push(login);
               } else {
                  groupsToInvite.push(groupId);
               }
            });
            if (alreadyInvitedLogins.length) {
               $scope.adminInvitationError += $i18next.t('groupAdmin_logins_have_roles')+alreadyInvitedLogins.join(' ')+'. ';
            }
            if (groupsToInvite.length) {
               $scope.addAdminGroups(groupsToInvite);
            } else {
               $scope.adminLoading = false;
            }
         }
      })
      .error(function() {
         console.error("error calling invitations.php");
      });
   };

   $scope.getNextiChildOrder = function(group) {
      var res = 0;
      angular.forEach(group.children, function(child, ID) {
         var idInt = parseInt(ID);
         if (idInt >= res) {
            res = idInt+1;
         }
      });
      return res;
   };

   $scope.createInvitation = function(groupId, childLogin) {
      var invitation = ModelsManager.createRecord('groups_groups');
      invitation.idGroupParent = $scope.group.ID;
      invitation.idGroupChild = groupId;
      invitation.idGroupParent = $scope.group.ID;
      invitation.idUserInviting = SyncQueue.requests.loginData.ID;
      invitation.sChildLogin = childLogin;
      invitation.iChildOrder = $scope.getNextiChildOrder($scope.group);
      invitation.sType = 'invitationSent';
      invitation.sStatusDate = new Date();
      ModelsManager.insertRecord('groups_groups', invitation);
   };

   $scope.generatePassword = function() {
      var string = '';
      var stringOfAllowedChars = '3456789abcdefghijkmnpqrstuvwxy';
      for (var i = 0; i < 10;  i++) {
         string += stringOfAllowedChars.charAt(Math.floor(Math.random()*stringOfAllowedChars.length));
      }
      return string;
   }

   $scope.passwordChecked = function() {
      if ($scope.formValues.hasPassword) {
         if ($scope.oldPassword) {
            $scope.group.sPassword = $scope.oldPassword;
            $scope.saveGroup();
         } else {
            $scope.refreshPassword();
         }
      } else {
         $scope.oldPassword = $scope.group.sPassword;
         $scope.group.sPassword = null;
         $scope.saveGroup();
      }
   }

   $scope.refreshPassword = function(callback) {
      $scope.group.sPassword = $scope.generatePassword();
      $scope.saveGroup();
   };

   $scope.changeExpiration = function() {
      if($scope.formValues.expirationTimer) {
         $scope.group.sPasswordTimer = '01:00:00';
      } else {
         $scope.group.sPasswordTimer = null;
      }
      $scope.saveGroup();
   };

   $scope.refreshExpiration = function() {
      $scope.group.sPasswordEnd = null;
      $scope.saveGroup();
   };

   $scope.changeRedirect = function() {
      if($scope.formValues.hasRedirect) {
         $scope.group.sRedirectPath = $scope.levels[0].ID;
      } else {
         $scope.group.sRedirectPath = null;
         $scope.group.bOpenContest = false;
         $scope.formValues.hasContest = false;
      }
      $scope.saveGroup();
   };

   $scope.addAdminGroups = function(groups) {
      $http.post('/groupAdmin/api.php', {action: 'addAdmins', idGroup: $scope.groupId, aAdminGroups: groups}, {responseType: 'json'}).success(function(postRes) {
         $scope.formValues.adminLogins = '';
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            SyncQueue.planToSend(0);
         }
         $scope.adminLoading = false;
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.saveGroup = function() {
      ModelsManager.updated('groups', $scope.groupId);
   };

   $scope.deleteGroup = function() {
      $http.post('/groupAdmin/api.php', {action: 'deleteGroup', idGroup: $scope.groupId}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            // deleting on the js side due to limitations of the requestSet deletion algorithm
            angular.forEach($scope.group.parents, function(parent) {
               ModelsManager.deleted('groups_groups', parent.ID);
            });
            ModelsManager.deleted('groups', $scope.group.ID);
            SyncQueue.planToSend(0);
            $state.go('profile', { section: 'groupsOwner'});
         }
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.removeUser = function(group_group, $event) {
      if ($event) {
         $event.stopPropagation();
      }
      group_group.sType = 'removed';
      ModelsManager.updated('groups_groups', group_group.ID);
   };

   $scope.removeAdmin = function(group_group) {
      $scope.adminLoading = true;
      $http.post('/groupAdmin/api.php', {action: 'removeAdmin', idGroup: $scope.groupId, idGroupAdmin: group_group.idGroupParent}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            // this synchro is very hazardous but seems to work...
            SyncQueue.planToSend(0);
            $scope.adminLoading = false;
         }
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.changeAdminRole = function(group_group, sRole) {
      $http.post('/groupAdmin/api.php', {action: 'changeAdminRole', idGroup: $scope.groupId, idGroupAdmin: group_group.idGroupParent, sRole: sRole}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            group_group.sRole = sRole;
         }
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.startSync = function(groupId, itemId, callback) {
      SyncQueue.requestSets.groupAdmin = {name: "groupAdmin", groupId: groupId, itemId: itemId, minVersion: 0};
      // yeah...
      SyncQueue.addSyncEndListeners('groupAdminController', function() {
         $scope.loading = false;
         SyncQueue.removeSyncEndListeners('groupAdminController');
         delete(SyncQueue.requestSets.groupAdmin.minVersion);
         callback();
         $rootScope.$broadcast('algorea.groupSynced');
      }, true);
      SyncQueue.planToSend(0);
   };

   $scope.initGroup = function() {
      $scope.group = ModelsManager.getRecord('groups', $scope.groupId);
      if (!$scope.group) {
         console.error('Group not found!');
         $state.go('groupRequests');
         return;
      }
      if($scope.group.sType == 'Team') {
         $scope.error = 'groupAdmin_team_not_editable';
      }
      $scope.formValues.hasPassword = !!$scope.group.sPassword;
      $scope.formValues.expirationTimer = !!$scope.group.sPasswordTimer;
      $scope.formValues.hasRedirect = !!$scope.group.sRedirectPath;
      if($scope.formValues.hasRedirect) {
         var pathIDs = $scope.group.sRedirectPath.split('/');
         $scope.redirectionSelections = [];
         $scope.redirectionSelectionsIDs = [];
         for(var i=0; i < pathIDs.length; i++) {
            $scope.redirectionSelections[i] = ModelsManager.getRecord('items', pathIDs[i]);
            $scope.redirectionSelectionsIDs[i] = pathIDs[i];
         }
         $scope.formValues.hasContest = !!$scope.redirectionSelections[$scope.redirectionSelections.length-1].sDuration;
         $scope.formValues.selectedBaseRedirection = $scope.redirectionSelections[0];
      }
      $scope.usersSelected = {};
      $scope.groupsSelected = {};
      $scope.groupChildren = [];
      angular.forEach($scope.group.children, function(child_group_group) {
         var child_group = child_group_group.child;
         $scope.groupsSelected[child_group.ID] = true;
         var user = child_group.userSelf;
         if (!user) return;
         $scope.usersSelected[user.ID] = true;
         $scope.groupChildren.push(child_group_group);
      });
      $scope.adminOnGroup = false;
      angular.forEach($scope.group.parents, function(parent_group_group) {
         var parent = parent_group_group.parent;
         if (parent.ID == SyncQueue.requests.loginData.idGroupOwned) {
            if (parent_group_group.sRole == 'manager' || parent_group_group.sRole == 'owner') {
               $scope.adminOnGroup = true;
            }
            return false;
         }
      });
   };

   $scope.getUserItem = function(group_group, item) {
      var group = group_group.child;
      if (!group.userSelf) {
         console.error('group '+group.ID+' is not an user!');
         return;
      }
      var userId = group.userSelf.ID;
      var userItem = itemService.getUserItem(item, userId);
      return userItem;
   }

   $scope.toggleUserRowSelection = function(group) {
      $scope.groupsSelected[group.ID] = !$scope.groupsSelected[group.ID];
      var user = group.userSelf;
      if (!user) return;
      $scope.usersSelected[user.ID] = !$scope.usersSelected[user.ID];
      $scope.updateEvents();
   }

   $scope.selectAllUsers = function() {
      angular.forEach($scope.groupsSelected, function(sel, groupID) {
         $scope.groupsSelected[groupID] = true;
         var group = ModelsManager.getRecord('groups', groupID);
         if (!group) return;
         var user = group.userSelf;
         if (!user) return;
         $scope.usersSelected[user.ID] = true;
         $scope.updateEvents();
      });
   };

   $scope.selectNoUser = function() {
      angular.forEach($scope.groupsSelected, function(sel, groupID) {
         $scope.groupsSelected[groupID] = false;
         var group = ModelsManager.getRecord('groups', groupID);
         if (!group) return;
         var user = group.userSelf;
         if (!user) return;
         $scope.usersSelected[user.ID] = false;
         $scope.updateEvents();
      });
   }

   $scope.userClickedInMembers = function(group) {
      angular.forEach($scope.groupsSelected, function(val, ID) {
         $scope.groupsSelected[ID] = false;
      });
      $scope.groupsSelected[group.ID] = true;
      var user = group.userSelf;
      if (!user) return;
      angular.forEach($scope.usersSelected, function(val, ID) {
         $scope.usersSelected[ID] = false;
      });
      $scope.usersSelected[user.ID] = true;
      $scope.updateEvents();
      $scope.section = 'progress'; // formValues.activeTab = 2; // selects members tab
   }

   function fillItemsListWithSonsRec(itemsList, itemsListRev, item) {
      if (!item) return;
      angular.forEach(item.children, function(child_item_item) {
         var child_item = child_item_item.child;
         if (child_item.sType != 'Course') {
            itemsList.push(child_item);
            itemsListRev[child_item.ID] = true;
         }
         if (child_item.children) {
            fillItemsListWithSonsRec(itemsList, itemsListRev, child_item)
         }
      });
   }

   $scope.selectedItemId = 0;
   $scope.dropdownSelections = [];

   $scope.dropdownSelected = function(depth) {
      if (depth === 0) { // final dropdown
         depth = $scope.dropdownSelections.length;
      }
      var itemId = $scope.dropdownSelectionsIDs[depth];
      if (itemId == 0) {
         depth=depth-1;
         itemId = $scope.dropdownSelections[depth].ID;
      }
      var newSelections = [];
      var newSelectionsIDs = [];
      for (var i = 0; i < depth; i++) {
         newSelections[i] = $scope.dropdownSelections[i];
         newSelectionsIDs[i] = $scope.dropdownSelections[i].ID;
      }
      var newRootItem = ModelsManager.getRecord('items', itemId);
      newSelections[depth] = newRootItem;
      newSelectionsIDs[depth] = newRootItem.ID;
      $scope.dropdownSelections = newSelections;
      $scope.dropdownSelectionsIDs = newSelectionsIDs;
      $scope.itemSelected(newRootItem);
   }

   // TODO :: put that in a controller to avoid having duplicate code
   $scope.redirectionSelections = [];
   $scope.redirectionSelectionsIDs = [];
   $scope.redirectionSelected = function(depth) {
      if (depth === 0) { // final dropdown
         depth = $scope.redirectionSelections.length;
      }
      var itemId = $scope.redirectionSelectionsIDs[depth];
      if (itemId == 0) {
         depth=depth-1;
         itemId = $scope.redirectionSelections[depth].ID;
      }
      var newSelections = [];
      var newSelectionsIDs = [];
      for (var i = 0; i < depth; i++) {
         newSelections[i] = $scope.redirectionSelections[i];
         newSelectionsIDs[i] = $scope.redirectionSelections[i].ID;
      }
      var newRootItem = ModelsManager.getRecord('items', itemId);
      newSelections[depth] = newRootItem;
      newSelectionsIDs[depth] = newRootItem.ID;
      $scope.redirectionSelections = newSelections;
      $scope.redirectionSelectionsIDs = newSelectionsIDs;
      $scope.updateRedirection();
   }

   $scope.redirectionBaseSelected = function() {
      $scope.redirectionSelections = [$scope.formValues.selectedLevel];
      $scope.redirectionSelectionsIDs = [$scope.formValues.selectedLevel.ID];
      $scope.updateRedirection();
   }

   $scope.updateRedirection = function() {
      $scope.group.sRedirectPath = $scope.redirectionSelectionsIDs.join('/');
      $scope.formValues.hasContest = !!$scope.redirectionSelections[$scope.redirectionSelections.length-1].sDuration;
      $scope.group.bOpenContest = $scope.group.bOpenContest && $scope.hasContest;
      $scope.saveGroup();
   }

   $scope.itemSelected = function(item) {
      if ($scope.rootItem == item) return;
      $scope.rootItem = item;

      // Force angular to regenerate the grid; no good way to make it better
      $scope.itemsList = [];
      $timeout(function() {
         $scope.itemsList = [item];
         $scope.itemsListRev = {};
         $scope.itemsListRev[item.ID] = true;
         fillItemsListWithSonsRec($scope.itemsList, $scope.itemsListRev, $scope.rootItem);
      }, 0);

      $scope.startSync($scope.groupId, item.ID, function() {
         $scope.initItems();
         $scope.initGroup();
         SyncQueue.addSyncEndListeners('groupAdminUsersItems', function() {
            if (needToUpdateAtEndOfSync) {
               $scope.updateEvents();
               needToUpdateAtEndOfSync = false;
            }
            if (needToUpdateGroupsGroupsAtEndOfSync) {
               $scope.updateGroupsGroups();
               needToUpdateGroupsGroupsAtEndOfSync = false;
            }
         });
         $scope.updateEvents();
      });
   }

   $scope.levelSelected = function() {
      $scope.zip_message = null;
      $scope.zip_url = null;
      $scope.itemSelected($scope.formValues.selectedLevel);
      $scope.dropdownSelections = [$scope.formValues.selectedLevel];
      $scope.dropdownSelectionsIDs = [$scope.formValues.selectedLevel.ID];
   }

   $scope.initItems = function() {
      var rootItemsIds = [
         config.domains.current.OfficialProgressItemId,
         config.domains.current.CustomProgressItemId,
         config.domains.current.ContestRootItemId,
         config.domains.current.CustomContestRootItemId];
      $scope.levels = [];
      rootItemsIds.forEach(function (itemId) {
         if(!itemId) { return; }
         var rootItem = ModelsManager.getRecord('items', itemId);
         if(rootItem) {
            angular.forEach(rootItem.children, function(child) {
               $scope.levels.push(child.child);
            });
         }
      });
      if (!$scope.formValues.selectedLevel && $scope.levels.length) {
         $scope.formValues.selectedLevel = $scope.levels[0];
         $scope.levelSelected($scope.levels[0].ID);
      }
   };

   $scope.stopSync = function() {
      delete(SyncQueue.requestSets.groupAdmin);
      SyncQueue.removeSyncEndListeners('groupAdminController');
      SyncQueue.removeSyncEndListeners('groupAdminUsersItems');
      ModelsManager.removeListener('users_items', 'deleted', 'groupAdminDeleted');
      ModelsManager.removeListener('users_items', 'inserted', 'groupAdminInserted');
      ModelsManager.removeListener('users_items', 'updated', 'groupAdminUpdated');
      ModelsManager.removeListener('groups_groups', 'deleted', 'groupAdminGpsGpsDeleted');
      ModelsManager.removeListener('groups_groups', 'inserted', 'groupAdminGpsGpsInserted');
      ModelsManager.removeListener('groups_groups', 'updated', 'groupAdminGpsGpsUpdated');
   };

   $scope.allUserItems = ModelsManager.curData.users_items;

   // not used, maybe later
   $scope.newGroup = function (callback) {
      if (!SyncQueue.requests.loginData || SyncQueue.requests.loginData.tempUser) {
         $scope.error = $i18next.t('groupAdmin_login_required_create');
         return;
      }
      $scope.group = ModelsManager.createRecord('groups');
      $scope.group.idUser = SyncQueue.requests.loginData.ID;
      $scope.group.sDateCreated = new Date();
      $scope.groupId = $scope.group.ID;
      $scope.group.sName = 'Noueau groupe';
      $http.post('/groupAdmin/api.php', {action: 'createGroup', idGroup: $scope.groupId}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            $state.go('groupAdminGroup', {idGroup: $scope.group.ID}).then(function(){$stateParams.idGroup = $scope.group.ID;});
         }
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.zip_btn_disabled = false;
   $scope.zip_message = false;
   $scope.zipExport = function(itemId, groupId) {
      $scope.zip_btn_disabled = true;
      $scope.zip_message = 'Please wait...';
      $scope.zip_url = null;
      $.ajax({
         type: 'GET',
         url: '/admin/zip_export.php',
         data: {
            itemId: itemId,
            groupId: groupId
         },
         success: function(res) {
            $scope.zip_btn_disabled = false;
            if(res && res.file) {
               $scope.zip_message = '';
               $scope.zip_url = res.file;
            } else {
               $scope.zip_message = res;
            }
         },
         error: function(request, status, err) {
            $scope.zip_btn_disabled = false;
            $scope.zip_message = err;
         }
      });
   }

   $scope.zipDownload = function() {
      if($scope.zip_url) { window.location = $scope.zip_url; }
   };

   $scope.init = function() {
      $scope.loading = true;
      $scope.formValues.progressionType = 'chronological';
      $scope.formValues.progressionTypeStr = $i18next.t('groupAdmin_chronological');
      $scope.groupId = $stateParams.idGroup;
      $scope.error = '';
      $scope.adminInvitationError = null;
      $scope.invitationError = null;
      if (SyncQueue.requests.loginData.tempUser == 1) {
         $scope.error = $i18next.t('groupAdmin_login_required');
         $scope.loading = false;
         return;
      }
      if (!$scope.groupId || $scope.groupId == 'new') {
         $scope.newGroup();
         return;
      }
      $scope.startSync($scope.groupId, $scope.itemId, function() {
         $scope.initItems();
         $scope.initGroup();
         SyncQueue.addSyncEndListeners('groupAdminUsersItems', function() {
            if (needToUpdateAtEndOfSync) {
               $scope.updateEvents();
               needToUpdateAtEndOfSync = false;
            }
            if (needToUpdateGroupsGroupsAtEndOfSync) {
               $scope.updateGroupsGroups();
               needToUpdateGroupsGroupsAtEndOfSync = false;
            }
         });
      });
   };

   $scope.$on('$destroy', function() {
      $scope.stopSync();
   });


   $scope.$on('login.login', function(event, data) {
    if (data.tempUser) {
       $state.go('profile');
    } else {
       $state.go('profile', { section: 'groupsOwner'});
    }
 });

   $scope.loading = true;
   itemService.onNewLoad($scope.init);

}]);
