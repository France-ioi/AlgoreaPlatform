'use strict';

// index of groups

angular.module('algorea')
   .controller('groupAdminIndexController', ['$scope', '$state', function ($scope, $state) {
   $scope.error = '';
   $scope.loading = true;
   $scope.startSync = function(callback) {
   	console.error(SyncQueue.requestSets);
   	SyncQueue.requestSets.groupsDescenants = {name: "groupsDescendants"};
      SyncQueue.addSyncEndListeners('groupAdminIndexController', function() {
      	$scope.loading = false;
      	SyncQueue.removeSyncEndListeners('groupAdminIndexController');
      	callback();
      }, true);
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
   		console.error('big problem2!');
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
   	$scope.openGroup(0);
   };

   $scope.selfAdminGroup = null;

   $scope.init = function() {
   	$scope.loading = true;
   	$scope.error = '';
   	if (SyncQueue.requests.loginData.tempUser == 1) {
   		$scope.error = 'Vous devez être connecté pour accéder à cette interface.';
   		$scope.loading = false;
   		return;
   	}
   	$scope.startSync(function() {
   		$scope.initGroups();
   	});
   };

   $scope.$on('$destroy', function() {
   	$scope.stopSync();
   });

	$scope.$on('syncResetted', function() {
      $scope.init();
   });
   
	$scope.init();

}]);
