'use strict';

// index of groups

angular.module('algorea').
  filter('groupsgroupsChildrenNameSort', function() {
    return function(groups_groups) {
      var res = _.sortBy(groups_groups, function(g_g) {
         return g_g.child.sName;
      });
      return res;
    };
  });

angular.module('algorea')
   .controller('groupsOwnerController', ['$scope', '$state', '$http', 'itemService', '$i18next', function ($scope, $state, $http, itemService, $i18next) {

   $scope.error = '';
   $scope.loading = true;
   $scope.formValues = {};

   $scope.startSync = function(callback) {
   	SyncQueue.requestSets.groupsDescendants = {name: "groupsDescendants", minServerVersion: 0};
      SyncQueue.addSyncEndListeners('groupsOwnerController', function() {
      	$scope.loading = false;
      	SyncQueue.removeSyncEndListeners('groupsOwnerController');
         delete(SyncQueue.requestSets.groupsDescendants.minServerVersion);
      	callback();
      }, false, true);
      SyncQueue.planToSend(0);
   };
   $scope.initGroups = function() {
   	var myGroupId = SyncQueue.requests.loginData.idGroupOwned;
   	if (!myGroupId) {
   		console.error('big problem!');
   		return;
   	}
   	$scope.myGroupAdmin = ModelsManager.getRecord('groups', myGroupId);
   	if (!$scope.myGroupAdmin) {
   		return;
   	}
   };
   $scope.stopSync = function() {
   	delete(SyncQueue.requestSets.groupsDescenants);
   };
   $scope.openGroup = function(idGroup) {
   	$state.go('groupAdminGroup', {idGroup: idGroup});
   };

   $scope.newGroup = function() {
      $scope.error = '';
      var sName = $scope.formValues.groupName;
      if (!sName) {
         $scope.error = $i18next.t('groupAdmin_name_required');
         return;
      }
      $http.post('/groupAdmin/api.php', {action: 'createGroup', idGroup: null, sName: sName}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            SyncQueue.planToSend(0);
            $scope.formValues.groupName = '';
            //$state.go('groupAdminGroup', {idGroup: postRes.idGroup});
         }
      })
      .error(function() {
         console.error("error calling groupAdmin/api.php");
      });
   };

   $scope.selfAdminGroup = null;

   $scope.init = function() {
   	$scope.loading = true;
   	$scope.error = '';
   	if (!SyncQueue.requests.loginData || SyncQueue.requests.loginData.tempUser == 1) {
   		$scope.error = $i18next.t('groupAdmin_login_required');
   		$scope.loading = false;
   		return;
   	}
      $scope.loginData = SyncQueue.requests.loginData;
   	$scope.startSync(function() {
   		$scope.initGroups();
   	});
   };

   $scope.$on('$destroy', function() {
   	$scope.stopSync();
   });

	$scope.loading = true;
   $scope.$on('login.logout', function(event,data) {
      $scope.loading = true;
      $scope.error = '';
   });
   itemService.onNewLoad($scope.init);

}]);
