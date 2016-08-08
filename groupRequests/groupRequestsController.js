'use strict';

angular.module('algorea')
   .controller('groupRequestsController', ['$scope', '$http', 'loginService', '$rootScope', 'itemService', '$filter', '$timeout', function ($scope, $http, loginService, $rootScope, itemService, $filter, $timeout) {
   $scope.layout.isOnePage(true);
   $scope.loading = true;
   $scope.loginLoading = true;
   $scope.results = null;
   $scope.pageData = {lookupString: ''}; // prototypal inheritance
   $scope.historyLimit = 10;
   $scope.addHistoryLimit = function() {
      $scope.historyLimit = $scope.historyLimit + 10;
   };
   $scope.markAllAsRead = function() {
      $scope.user.sNotificationReadDate = new Date();
      ModelsManager.updated('users', $scope.user.ID);
   };
   $scope.init = function() {
      loginService.getLoginData(function(res) {
         if (res.tempUser) {
            $scope.error = "Vous n'êtes pas identifié et ne pouvez pas accéder aux groupes. Les groupes permettent à un enseignant ou animateur de gérer un ensemble d'utilisateurs pour leur donner accès à du contenu personnalisé, et suivre leur progression.";
            return;
         }
         $scope.loginLoading = false;
         SyncQueue.addSyncEndListeners('getGroups', function() {
            itemService.getAsyncRecord('groups', res.idGroupSelf, function(myGroup) {
               $scope.loading = false;
               $scope.myGroup = myGroup;
               $scope.user = ModelsManager.getRecord('users', res.ID);
            });
            SyncQueue.removeSyncEndListeners('getGroups');
         });
      });
   };
   $scope.loading = true;
   itemService.onNewLoad($scope.init);
   $scope.$on('login.login', function(event, data) {
      $scope.loading = true;
      $scope.loginLoading = true;
      $scope.error = null;
      $scope.myGroup = null;
      $scope.user = null;
      $scope.results = null;
      $scope.init();
   });
   $scope.getMyGroupParents = function() {
      if (!$scope.user || !$scope.myGroup) {
         return [];
      }
      var sNotificationReadDate = $scope.user.sNotificationReadDate;
      $scope.unreadParentsLength = 0;
      var orderedParents = [];
      angular.forEach($scope.myGroup.parents, function(parent) {
         orderedParents.push(parent);
         if (parent.sStatusDate > sNotificationReadDate) {
            $scope.unreadParentsLength = $scope.unreadParentsLength + 1;
         }
      });
      $scope.parentsLength = orderedParents.length;
      return orderedParents;
   };
   $scope.getMyUnreadGroupParents = function() {
      if (!$scope.user || !$scope.myGroup) {
         return [];
      }
      var sNotificationReadDate = $scope.user.sNotificationReadDate;
      var orderedParents = [];
      angular.forEach($scope.myGroup.parents, function(parent) {
         if ((!sNotificationReadDate || parent.sStatusDate > sNotificationReadDate) && parent.idGroupParent != config.RootSelfGroupId) {
            orderedParents.push(parent);
         }
      });
      $scope.unreadParentsLength = orderedParents.length;
      return orderedParents;
   };
   $scope.getGroupDate = function(groupgroup) {
      return groupgroup.sStatusDate;
   };
   $scope.showTable = function() {
      if (!$scope.myGroup) return false;
      var res = false;
      angular.forEach($scope.myGroup.parents, function(parent) {
         if (parent.sType !== 'left' && parent.sType != 'removed' && parent.sType !== 'invitationRefused' && parent.sType !== 'requestRefused') {
            res = true;
            return;
         }
      });
      return res;
   };
   $scope.printType = function(type) {
      return models.groups_groups.fields.sType.values[type].label;
   };
   $scope.cancelRequest = function(group_group) {
      ModelsManager.deleted('groups_groups', group_group.ID);
      $scope.updateResults(group_group);
   };
   $scope.acceptInvitation = function(group_group) {
      group_group.sType = 'invitationAccepted';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
      $scope.updateResults(group_group);
      return false;
   };
   $scope.refuseInvitation = function(group_group) {
      group_group.sType = 'invitationRefused';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
      $scope.updateResults(group_group);
      return false;
   };
   $scope.leaveGroup = function(group_group) {
      group_group.sType = 'left';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
      $scope.updateResults(group_group);
   };
   $scope.groupGroups = ModelsManager.curData['groups_groups'];
   $scope.toggleExpanded = function() {
      this.expanded = !this.expanded;
   };
   $scope.updateResults = function(group_group) {
      angular.forEach($scope.results, function(result) {
         if (result.ID == group_group.idGroupParent) {
            result.relationType = group_group.sType;
         }
      });
   };
   $scope.lookup = function() {
      $scope.error = null;
      $http.post('/groupRequests/groupRequests.php', {action: 'getGroupsMatching', lookupString: $scope.pageData.lookupString}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from groupRequests handler: "+postRes.error);
            $scope.error = postRes.error;
         } else {
            if (!postRes.results.length) {
               $scope.resultError = "Aucun groupe correspondant à votre recherche n'a été trouvé.";
               $scope.results = null;
            } else {
               $scope.results = postRes.results;
            }
         }
      })
      .error(function() {
         console.error("error calling groupRequests.php");
      });
   };

   $scope.joinWithPassword = function() {
      $scope.joinGroup({password: $scope.pageData.askedPassword});
   };

   $scope.joinGroup = function(result) {
      result.joinLog = "chargement...";
      $http.post('/groupRequests/groupRequests.php', {action: 'joinGroup', ID: result.ID, password: result.password}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            var error = (postRes && postRes.error) ? postRes.error : 'Une erreur est survenue, merci de contacter un administrateur.';
            console.error("got error from groupRequests handler: "+error);
            result.joinLog = error;
         } else {
            result.relationType = postRes.type;
            var record = ModelsManager.getRecord('groups_groups', postRes.ID);
            if (record) {
               record.sType = postRes.type;
               result.joinLog = null;
            } else {
               SyncQueue.planToSend(0);
            }
         }
      })
      .error(function() {
         console.error("error calling groupRequests.php");
      });
   };
}]);
