'use strict';

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
      templateUrl: ((typeof compiled !== 'undefined' && compiled)?'':"../")+"commonFramework/angularDirectives/formField.html",
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
  filter('directOrInvitation', function() {
    return function(children) {
      var out = [];
      angular.forEach(children, function(child) {
         if (child.sType != 'requestSent' && child.sType != 'requestRefused') {
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
  filter('selectedUsersAndItems', function() {
    return function(userItems, itemsListRev, usersSelected) {
      var out = [];
      angular.forEach(userItems, function(userItem) {
         if (usersSelected[userItem.idUser] && itemsListRev[userItem.idItem] && userItem.sValidationDate) {
            out.push(userItem);
         }
      });
      return out;
    };
  });

angular.module('algorea').
  filter('userSort', function() {
    return function(groups_groups, parent, owned) {
      return _.sortBy(groups_groups, function(g_g) {
         var group = parent ? g_g.parent : g_g.child;
         var user = owned ? group.userOwned[0] : group.userSelf[0];
         return user.sFirstName;
      });
    };
  });

// one group

angular.module('algorea')
   .controller('groupAdminController', ['$scope', '$stateParams', 'itemService', '$uibModal', '$http', function ($scope, $stateParams, itemService, $uibModal, $http) {
   'use strict';
   $scope.error = null;

   $scope.groupFields = models.groups.fields;
   
   $scope.openPopup = function(group_group, item) {
      var groupId = group_group.child.ID;
      var modalInstance = $uibModal.open({
         template: 'Une belle modal',
         size: 800,
       });
   };

   $scope.getClass = function(userItem) {
      console.error(userItem);
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
         return userItem.nbHintsCached+'e. demande d\'indice';
      }
      if (type == 'answer') {
         return userItem.nbSubmissionsAttempts+'e. soumission d\'une réponse';
      }
      if (type == 'validation') {
         return 'validation';
      }
      if (type == 'newThread') {
         return 'demande d\'aide sur le forum';
      }
   };

   var insertEvent = function(userItem, type, date) {
      var eventStr = getTypeString(type, userItem);
      var userStr = userItem.user.sFirstName+' '+userItem.user.sLastName+' ('+userItem.user.sLogin+')';
      var event = {
         'date': date,
         'userStr': userStr,
         'eventStr': eventStr,
         'itemStr': userItem.item.strings[0].sTitle
      };
      // insertion in a sorted array:
      $scope.events.splice(_.sortedIndexBy($scope.events, event, function(event) {return event.date;}), 0, event);
      if ($scope.events.length >= $scope.numberOfEvents) {
         $scope.events.pop();
         $scope.oldestEventDate = $scope.events[$scope.events.length-1].date;   
      }
   };

   $scope.updateEvents = function() {
      console.error('updateEvents');
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
   $scope.showRequestTable = function() {
      var res = false;
      angular.forEach($scope.group.children, function(child) {
         if (child.sType == 'requestSent') {
            res = true;
            return false;
         }
      });
      return res;
   };
   $scope.printType = function(type) {
      return models.groups_groups.fields.sType.values[type].label;
   };
   $scope.cancelInvitation = function(group_group) {
      ModelsManager.deleted('groups_groups', group_group.ID);
   };
   $scope.acceptRequest = function(group_group) {
      return;
      group_group.sType = 'requestAccepted';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
   };
   $scope.refuseRequest = function(group_group) {
      return;
      group_group.sType = 'requestRefused';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
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
               $scope.invitationError = + "Les logins suivants n'ont pas pu être trouvés : "+postRes.loginsNotFound.join(' ')+'. ';
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
               $scope.invitationError += 'Les logins suivants ont déjà reçu une invitation ou font déjà partie du groupe : '+alreadyInvitedLogins.join(' ')+'. ';
            }
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
      $scope.adminInvitationError = '';
      $http.post('/admin/invitations.php', {action: 'getAdminGroupsFromLogins', logins: logins, idGroup: $scope.group.ID}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin invitation handler: "+postRes.error);
         } else {
            if (postRes.loginsNotFound.length) {
               $scope.adminInvitationError = + "Les logins suivants n'ont pas pu être trouvés : "+postRes.loginsNotFound.join(' ')+'. ';
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
               $scope.adminInvitationError += 'Les logins suivants ont déjà un rôle dans le groupe : '+alreadyInvitedLogins.join(' ')+'. ';
            }
            $scope.addAdminGroups(groupsToInvite);
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
      invitation.idUserInviting = $scope.loginData.ID;
      invitation.sChildLogin = childLogin;
      invitation.iChildOrder = $scope.getNextiChildOrder($scope.group);
      invitation.sType = 'invitationSent';
      invitation.sStatusDate = new Date();
      ModelsManager.insertRecord('groups_groups', invitation);
   };

   $scope.refreshPassword = function() {
      $http.post('/groupAdmin/api.php', {action: 'refreshPassword', idGroup: $scope.groupId}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            $scope.group.sPassword = postRes.newPass;   
            $scope.$evalAsync($scope.$apply);            
         }
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.addAdminGroups = function(groups) {
      $http.post('/groupAdmin/api.php', {action: 'addAdmins', idGroup: $scope.groupId, aAdminGroups: groups}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            SyncQueue.planToSend(0);
         }
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.saveGroup = function() {
      ModelsManager.updated('groups', $scope.groupId);
   };

   $scope.removeUser = function(group_group) {
      $http.post('/groupAdmin/api.php', {action: 'removeUser', idGroup: $scope.groupId, idGroupUser: group_group.idGroupChild}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            SyncQueue.planToSend(0);
         }
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.removeAdmin = function(group_group) {
      $http.post('/groupAdmin/api.php', {action: 'removeAdmin', idGroup: $scope.groupId, idGroupAdmin: group_group.idGroupParent}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            SyncQueue.planToSend(0);
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
      SyncQueue.requestSets.groupAdmin = {name: "groupAdmin", groupId: groupId, itemId: itemId, minServerVersion: 0};
      // yeah...
      SyncQueue.addSyncEndListeners('groupAdminController', function() {
         $scope.loading = false;
         SyncQueue.removeSyncEndListeners('groupAdminController');
         delete(SyncQueue.requestSets.groupAdmin.minServerVersion);
         callback();
      }, false, true);
      SyncQueue.planToSend(0);
   };

   $scope.initGroup = function() {
      $scope.group = ModelsManager.getRecord('groups', $scope.groupId);
      if (!$scope.group) {
         console.error('big problem!');
         return;
      }
      $scope.usersSelected = {};
      $scope.groupsSelected = {};
      angular.forEach($scope.group.children, function(child_group_group) {
         var child_group = child_group_group.child;
         $scope.groupsSelected[child_group.ID] = true;
         var user = child_group.userSelf[0];
         if (!user) return;
         $scope.usersSelected[user.ID] = true;
      });
   };

   $scope.getUserItem = function(group_group, item) {
      var group = group_group.child;
      if (!group.userSelf) {
         console.error('group '+group.ID+' is not an user!');
         return;
      }
      var userId = group.userSelf[0].ID;
      var userItem = itemService.getUserItem(item, userId);
      return userItem;
   }

   $scope.toggleUserRowSelection = function(group) {
      $scope.groupsSelected[group.ID] = !$scope.groupsSelected[group.ID];
      var user = group.userSelf[0];
      if (!user) return;
      $scope.usersSelected[user.ID] = !$scope.usersSelected[user.ID];
   }

   function fillItemsListWithSonsRec(itemsList, itemsListRev, item) {
      if (!item) return;
      angular.forEach(item.children, function(child_item_item) {
         var child_item = child_item_item.child;
         if (child_item.sType != 'Course' && child_item.sType != 'Presentation') {
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

   $scope.itemSelected = function(item) {
      if ($scope.rootItem == item) return;
      $scope.rootItem = item;
      $scope.itemsList = [];
      $scope.itemsListRev = {};
      fillItemsListWithSonsRec($scope.itemsList, $scope.itemsListRev, $scope.rootItem);
      $scope.startSync($scope.groupId, item.ID, function() {
         $scope.initItems();
         $scope.initGroup();
         SyncQueue.addSyncEndListeners('groupAdminUsersItems', function() {
            if (needToUpdateAtEndOfSync) {
               $scope.updateEvents();
               needToUpdateAtEndOfSync = false;
            }
         });
         $scope.updateEvents();
      });
   }

   $scope.levelSelected = function(itemId) {
      $scope.itemSelected($scope.formValues.selectedLevel);
      $scope.dropdownSelections = [];
      $scope.dropdownSelectionsIDs = [];
      $scope.dropdownSelections[0] = $scope.formValues.selectedLevel;
      $scope.dropdownSelectionsIDs[0] = $scope.formValues.selectedLevel.ID;
   }

   $scope.initItems = function() {
      var officialRootItem = ModelsManager.getRecord('items', config.domains.current.OfficialProgressItemId);
      var customRootItem = ModelsManager.getRecord('items', config.domains.current.CustomProgressItemId);
      $scope.levels = [];
      angular.forEach(officialRootItem.children, function(child) {
         $scope.levels.push(child.child);
      });
      angular.forEach(customRootItem.children, function(child) {
         $scope.levels.push(child.child);
      });
      $scope.formValues.selectedLevel = $scope.levels[0];
      $scope.levelSelected($scope.levels[0].ID);
   };

   $scope.stopSync = function() {
      delete(SyncQueue.requestSets.groupAdmin);
      SyncQueue.removeSyncEndListeners('groupAdminUsersItems');
      ModelsManager.removeListener('users_items', 'deleted', 'groupAdminDeleted');
      ModelsManager.removeListener('users_items', 'inserted', 'groupAdminInserted');
      ModelsManager.removeListener('users_items', 'updated', 'groupAdminUpdated');
   };

   $scope.allUserItems = ModelsManager.curData.users_items;

   $scope.init = function() {
      $scope.loading = true;
      $scope.progressionType = 'chronological';
      $scope.groupId = '1321383987564998144';//$stateParams.idGroup;
      $scope.error = '';
      $scope.adminInvitationError = null;
      $scope.invitationError = null;
      if (SyncQueue.requests.loginData.tempUser == 1) {
         //$scope.error = 'Vous devez être connecté pour accéder à cette interface.';
         //$scope.loading = false;
         //return;
      }
      if ($scope.groupId == '0') {
         // TODO: create group
         console.error('oops!');
      } else {
         $scope.startSync($scope.groupId, $scope.itemId, function() {
            $scope.initItems();
            $scope.initGroup();
            SyncQueue.addSyncEndListeners('groupAdminUsersItems', function() {
               if (needToUpdateAtEndOfSync) {
                  $scope.updateEvents();
                  needToUpdateAtEndOfSync = false;
               }
            });
         });
      }
   };

   $scope.$on('$destroy', function() {
      $scope.stopSync();
   });

   $scope.$on('syncResetted', function() {
      $scope.init();
   });
   
   $scope.init();

}]);
