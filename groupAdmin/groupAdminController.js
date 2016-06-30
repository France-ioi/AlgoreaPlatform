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

// one group

angular.module('algorea')
   .controller('groupAdminController', ['$scope', '$stateParams', 'itemService', function ($scope, $stateParams, itemService) {
   $scope.error = null;

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
      var logins = $scope.formValues.currentLogins.split(' ');
      $scope.adminInvitationError = '';
      $http.post('/admin/invitations.php', {action: 'inviteAdminGroupFromLogins', logins: logins, idGroup: $scope.group.ID}, {responseType: 'json'}).success(function(postRes) {
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
            angular.forEach(postRes.logins_groups, function(groupId, login) {
               if (alreadyInvitedGroupIds[groupId]) {
                  alreadyInvitedLogins.push(login);
               }
            });
            if (alreadyInvitedLogins.length) {
               $scope.adminInvitationError += 'Les logins suivants ont déjà un rôle dans le groupe : '+alreadyInvitedLogins.join(' ')+'. ';
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
      invitation.idUserInviting = $scope.loginData.ID;
      invitation.sChildLogin = childLogin;
      invitation.iChildOrder = $scope.getNextiChildOrder($scope.group);
      invitation.sType = 'invitationSent';
      invitation.sStatusDate = new Date();
      ModelsManager.insertRecord('groups_groups', invitation);
   };

   $scope.refreshPassword = function() {};

   $scope.addAdmin = function(groupId, login) {};

   $scope.saveGroup = function() {
      ModelsManager.updated('groups', $scope.groupId);
   };

   $scope.removeUser = function(group_group) {

   };

   $scope.removeAdmin = function(group_group) {};
   $scope.changeAdminRole = function(group_group, sRole) {

   };

   $scope.startSync = function(groupId, itemId, callback) {
      SyncQueue.requestSets.groupAdmin = {name: "groupAdmin", groupId: groupId, itemId: itemId, minServerVersion: 0};
      // yeah...
      console.error('debug1');
      console.error(SyncQueue.requestSets);
      SyncQueue.addSyncEndListeners('groupAdminController', function() {
         $scope.loading = false;
         SyncQueue.removeSyncEndListeners('groupAdminController');
         console.error('debug0');
         delete(SyncQueue.requestSets.groupAdmin.minServerVersion);
         callback();
      }, true);
      SyncQueue.planToSend(0);
   };
   $scope.initGroup = function() {
      $scope.group = ModelsManager.getRecord('groups', $scope.groupId);
      if (!$scope.group) {
         console.error('big problem!');
         return;
      }
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

   function fillItemsListWithSonsRec(itemsList, item) {
      angular.forEach(item.children, function(child_item_item) {
         var child_item = child_item_item.child;
         if (child_item.sType != 'Course' && child_item.sType != 'Presentation') {
            itemsList.push(child_item);
         }
         if (child_item.children) {
            fillItemsListWithSonsRec(itemsList, child_item)
         }
      });
   }

   $scope.initItems = function() {
      var rootItemId = '1384877030317901919';
      $scope.rootItem = ModelsManager.getRecord('items', rootItemId);
      $scope.itemsList = [];
      fillItemsListWithSonsRec($scope.itemsList, $scope.rootItem);
   };
   $scope.stopSync = function() {
      delete(SyncQueue.requestSets.groupAdmin);
   };

   $scope.init = function() {
      $scope.loading = true;
      $scope.progressionType = 'chronological';
      $scope.groupId = '1321383987564998144';//$stateParams.idGroup;
      $scope.itemId = '4021'; // TODO!
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
