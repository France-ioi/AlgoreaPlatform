'use strict';

// index of groups

angular.module('algorea')
   .controller('groupAdminIndexController', ['$scope', '$state', '$http', 'itemService', function ($scope, $state, $http, itemService) {
   $scope.error = '';
   $scope.loading = true;
   $scope.formValues = {};
   $scope.layout.isOnePage(true);
   $scope.layout.hasMap('never');
   $scope.startSync = function(callback) {
   	SyncQueue.requestSets.groupsDescendants = {name: "groupsDescendants", minServerVersion: 0};
      SyncQueue.addSyncEndListeners('groupAdminIndexController', function() {
      	$scope.loading = false;
      	SyncQueue.removeSyncEndListeners('groupAdminIndexController');
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
         $scope.error = 'vous devez indiquer un nom pour le groupe que vous allez créer.';
         return;
      }
      $http.post('/groupAdmin/api.php', {action: 'createGroup', idGroup: $scope.groupId, sName: sName}, {responseType: 'json'}).success(function(postRes) {
         if (!postRes || !postRes.success) {
            console.error("got error from admin groupAdmin/api.php: "+postRes.error);
         } else {
            SyncQueue.planToSend(0);
            $scope.formValues.groupName = '';
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
   		$scope.error = 'Vous devez être connecté(e) pour accéder à l\'interface de gestion des groupes.';
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
