"use strict";

angular.module('algorea')
.controller('groupInvitationCtrl', ['$scope', '$http', '$i18next', function($scope, $http, $i18next) {
   $scope.error = null;
   $scope.invitationError = null;
   $scope.newInvitationOpened = false;
   $scope.formValues = {};
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
            return;
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
      group_group.sType = 'requestAccepted';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
   };
   $scope.refuseRequest = function(group_group) {
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
               $scope.invitationError += $i18next.t('groupAdmin_logins_not_found')+' '+postRes.loginsNotFound.join(' ')+'. ';
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
               $scope.invitationError += $i18next.t('groupAdmin_logins_already_members')+' '+alreadyInvitedLogins.join(' ')+'. ';
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
}]);

angular.module('algorea').
  filter('byInvitation', function() {
    return function(children) {
      var out = [];
      angular.forEach(children, function(child) {
         if (child.sType != 'direct') {
            out.push(child);
         }
      });
      return out;
    };
  });

angular.module('algorea').
  filter('manageableGroups', function() {
    return function(children) {
      var out = [];
      angular.forEach(children, function(child) {
         if (child.sType == 'direct' || child.sType == 'invitationAccepted' || child.sType == 'requestAccepted') {
            out.push(child);
         }
      });
      return out;
    };
  });
