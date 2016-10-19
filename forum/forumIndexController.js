'use strict';

angular.module('algorea')
   .controller('forumIndexController', ['$scope', 'itemService', 'loginService', '$state', '$timeout', '$rootScope', function ($scope, itemService, loginService, $state, $timeout, $rootScope) {
   $scope.layout.isOnePage(true);
   $scope.loading = true;
   $scope.threads = {};
   $scope.currentFilter = null;
   $scope.globalFilters = {
      all: {filter: null, description: 'Tous'},
      favorites: {filter: {bStarred: true}, description: 'Favoris'},
      unread: {filter: {bUnread: true}, description: 'Non-lus'},
      participated: {filter: {bParticipated: true}, description: 'Où j\'ai participé'}
   };
   $scope.selectGlobalFilter = function(filter) {
      $scope.currentGlobalFilter = filter;
   };
   $scope.currentGlobalFilter = $scope.globalFilters.all;
   $scope.init = function() {
      $scope.myUserID = $rootScope.myUserID;
      $scope.threads = ModelsManager.getRecords('threads');
      $scope.loading = false;
      $timeout($scope.$apply);
   }
   itemService.onNewLoad(function() {
      $scope.init();
   });
   $scope.$on('syncResetted', function() {
      $scope.loading = true;
      itemService.onNewLoad(function() {
         $scope.init();
      });
   });
   $scope.tabs = {
      'helpOthers': {active: true, length: 0},
      'getHelp': {active: false, length: 0},
      'general': {active: false, length: 0},
      'technicalSupport': {active: false, length: 0}
   };
   $scope.setGlobalFilter = function(filterField) {
      $scope.globalFilter = {};
      if (!filterField) {
         return;
      }
      $scope.globalFilter[filterField] = true;
   };
   $scope.goToUser = function(userID) {
      console.log('goToUser('+userID+');');
   };
   $scope.newThread = function() {
      $state.go('newThread');
   };
}]);

angular.module('algorea')
   .controller('forumIndexThreadController', ['$scope', '$state', 'itemService', function ($scope, $state, itemService) {
   function getUserThread(thread) {
      var result_user_thread = null;
      angular.forEach(thread.user_thread, function(user_thread) {
         result_user_thread = user_thread;
         return;
      });
      return result_user_thread;
   };
   // we don't want users_threads for all users and all threads, only meaningful
   // ones, so we create them only when relevant
   $scope.user_thread = getUserThread($scope.thread);
   $scope.accessible = false;
   if (!$scope.thread.idItem) {
      $scope.accessible = true;
   }

   if ($scope.thread.idItem && $scope.thread.item) {
      $scope.user_item = itemService.getUserItem($scope.thread.item);
      if (($scope.user_item && $scope.user_item.bValidated == 1) || $scope.thread.idUserCreated == $scope.myUserID) {
         $scope.accessible = true;
      }
   }
   $scope.goToThread = function(idThread) {
      if ($scope.accessible) {
         $state.go('thread', {idThread: idThread});
      }
   };
   if (!$scope.accessible) {
      $scope.accessibiltyMessage = "Vous devez résoudre l'exercice avant de pouvoir consulter les demandes d'aide des autres utilisateurs";
   }
   $scope.isUserThreadTmp = false;
   if (! $scope.user_thread) {
      $scope.isUserThreadTmp = true;
      $scope.user_thread = ModelsManager.createRecord('users_threads');
      $scope.user_thread.idUser = $scope.myUserID;
      $scope.user_thread.idThread = $scope.thread.ID;
   }
   $scope.saveUserThread = function(event) {
      if (! $scope.isUserThreadTmp) {
         ModelsManager.updated('users_threads', $scope.user_thread.ID);
      } else {
         // TODO: handle case where a user_thread has been created in the
         // meantime
         ModelsManager.insertRecord('users_threads', $scope.user_thread);
      }
      event.stopPropagation();
   };
}]);


