'use strict';

angular.module('algorea')
   .controller('groupRequestsController', ['$scope', '$http', 'loginService', '$rootScope', 'itemService', 'contestTimerService', '$state', '$filter', '$timeout', '$i18next', function ($scope, $http, loginService, $rootScope, itemService, contestTimerService, $state, $filter, $timeout, $i18next) {
   $scope.layout.isOnePage(true);
   $scope.layout.hasMap('never');
   $scope.loading = true;
   $scope.groupsLoading = false;
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

   // involved sync design pattern: call updateGroups if a group_group when necessary
   var needToUpdateAtEndOfSync = false;
   var callbackfun = function(group_group) {
      if (!$scope.myGroup || group_group.idGroupParent == $scope.myGroup.ID || group_group.idGroupChild == $scope.myGroup.ID) {
         needToUpdateAtEndOfSync = true;
      }
   };
   ModelsManager.addListener('groups_groups', 'deleted', 'groupRequestsDeleted', callbackfun);
   ModelsManager.addListener('groups_groups', 'inserted', 'groupRequestsInserted', callbackfun);
   ModelsManager.addListener('groups_groups', 'updated', 'groupRequestsUpdated', callbackfun);
   SyncQueue.addSyncEndListeners('groupRequests', function() {
      if (needToUpdateAtEndOfSync) {
         $scope.updateGroups();
         needToUpdateAtEndOfSync = false;
      }
   });

   $scope.updateGroups = function() {
      $scope.myGroupParents = $scope.getMyGroupParents();
      $scope.myUnreadGroupParents = $scope.getMyUnreadGroupParents();
   }

   $scope.fullResetSync = function(callback) {
      // TODO; this is a temporary solution until the sync system is redone
      // fixes item access not updating properly after joining/leaving a group
      // by doing a full resync...
      SyncQueue.resetSync = true;
      SyncQueue.sync(function () {
         SyncQueue.sentVersion = 0;
         ModelsManager.reinit();
         SyncQueue.init(ModelsManager);

         var otherReq = SyncQueue.requests.algorea;
         SyncQueue.requests.algorea = {type: 'getItemsFromAncestors', ancestors: itemService.getIdsToSync(true)};
         SyncQueue.sync(function () {
            SyncQueue.requests.algorea = otherReq;
            $scope.groupsLoading = false;
            if(callback) { callback(); }
         });
      });
   }

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
      $scope.groupsLoading = true;
      group_group.sType = 'left';
      group_group.sStatusDate = new Date();
      ModelsManager.updated('groups_groups', group_group.ID);
      $scope.updateResults(group_group);
      $scope.fullResetSync();
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
      $scope.groups_error = null;
      $http.post('/groupRequests/groupRequests.php', {action: 'getGroupsMatching', lookupString: $scope.pageData.lookupString}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from groupRequests handler: "+postRes.error);
            $scope.groups_error = postRes.error;
         } else {
            if (!postRes.results.length) {
               $scope.resultError = $i18next.t('groupRequests_no_group_found');
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
      $scope.passwordInfo = null;
      $scope.lastJoinRequest = {
         action: 'joinGroup',
         ID: result.ID,
         password: result.password};
      $scope.sendJoinRequest($scope.lastJoinRequest);
   }

   $scope.joinConfirm = function() {
      if(!$scope.lastJoinRequest) { return; }
      $scope.lastJoinRequest['confirm'] = true;
      $scope.sendJoinRequest($scope.lastJoinRequest);
   };

   $scope.sendJoinRequest = function(request) {
      $scope.groupsLoading = true;
      $scope.groupRequestInfo = '';
      $scope.groupRequestConfirm = false;
      $http.post('/groupRequests/groupRequests.php', request, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            if(postRes && postRes.confirmNeeded) {
               $scope.groupRequestConfirm = true;
               $scope.groupRequestConfirmOpen = !!postRes.openContest;
            } else {
               var error = (postRes && postRes.error) ? postRes.error : $i18next.t('groupRequests_error_please_contact');
               console.error("got error from groupRequests handler: "+error);
               $scope.groupRequestInfo = error;
               $scope.groupRequestInfoClass = "alert-danger";
            }
            $scope.groupsLoading = false;
         } else {
            if (request.password) {
               $scope.groupRequestInfo = $i18next.t('groupRequests_join_success')+postRes.groupName;
               $scope.groupRequestInfoClass = "alert-success";
            }
            //request.relationType = postRes.type;
            var record = ModelsManager.getRecord('groups_groups', postRes.ID);
            if (record) {
               record.sType = postRes.type;
            }

            if(postRes.contestData) {
               // A contest was automatically opened upon entering the group
               var data = postRes.contestData;
               config.data = {endTime: data.endTime, startTime: data.startTime, duration: data.duration, idItem: data.idItem};
               contestTimerService.startContest(data.idItem, data.duration);
               var user_item = itemService.getUserItem(itemService.getItem((data.idItem)));
               if (user_item) {user_item.sContestStartDate = new Date();}
            }

            var callback = null;
            if(postRes.redirectPath) {
               var sell = postRes.redirectPath.split('/').length-1;
               callback = function () { 
                  $state.go('contents', {path: postRes.redirectPath, sell: sell, selr: sell+1});
               }
            }

            $scope.fullResetSync(callback);
         }
      })
      .error(function() {
         console.error("error calling groupRequests.php");
         $scope.groupsLoading = false;
      });
   };


    // user profile

    $scope.openPopup = function(action) {
        loginService.openLoginPopup(action);
    }

    $scope.refreshUser = function() {
    }


   $scope.init = function() {
      $scope.updateGroups();
      loginService.getLoginData(function(res) {
         $scope.loginLoading = false;
         //console.log('>>>>', res);
         $scope.tempUser = res.tempUser;
         if(res.tempUser) {
            $scope.loading = false;
            $scope.groups_error = $i18next.t('groupRequests_not_logged');
            return;
         }
         SyncQueue.addSyncEndListeners('groupRequestsInit', function() {
            itemService.getAsyncRecord('groups', res.idGroupSelf, function(myGroup) {
               $scope.loading = false;
               $scope.myGroup = myGroup;
               $scope.user = ModelsManager.getRecord('users', res.ID);
               $scope.updateGroups();
            });
            SyncQueue.removeSyncEndListeners('groupRequestsInit');
         });
      });
   };

   itemService.onNewLoad($scope.init);
   $scope.$on('login.login', function(event, data) {
      $scope.tempUser = data.tempUser;
      $scope.loading = true;
      $scope.loginLoading = true;
      $scope.groups_error = null;
      $scope.myGroup = null;
      $scope.user = null;
      $scope.results = null;
      $scope.myGroupParents = [];
      $scope.init();
   });

   $scope.$on('login.update', function(event, data) {
      $scope.tempUser = data.tempUser;
      $scope.loginLoading = true;
      loginService.getLoginData(function(res) {
        $scope.loginLoading = false;
        $scope.user = ModelsManager.getRecord('users', res.ID);
      });
   });

   $scope.stopSync = function() {
      SyncQueue.removeSyncEndListeners('groupRequests');
      SyncQueue.removeSyncEndListeners('groupRequestsInit');
      ModelsManager.removeListener('groups_groups', 'deleted', 'groupRequestsDeleted');
      ModelsManager.removeListener('groups_groups', 'inserted', 'groupRequestsInserted');
      ModelsManager.removeListener('groups_groups', 'updated', 'groupRequestsUpdated');
   };

   $scope.$on('$destroy', function() {
      $scope.stopSync();
   });

}]);
