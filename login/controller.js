'use strict';

angular.module('algorea')
   .controller('userController', ['$scope', '$rootScope', '$sce', '$location', '$http', 'itemService', 'loginService', '$timeout', function ($scope, $rootScope, $sce, $location, $http, itemService, loginService, $timeout) {
      $scope.loginModuleUrl = $sce.trustAsResourceUrl('https://loginaws.algorea.org/login.html#'+$location.absUrl());
      $scope.innerHtml = "chargement...";
      $scope.loggedIn = false;
      $scope.frameHidden = true;
      $scope.userinfoClass = 'userinfo-closed';
      $scope.loginFrameClass = 'loginFrame-login';
      $scope.infoWord = '';
      loginService.bindScope($rootScope);
      $scope.$on('login.login', function(event, data) {
         $scope.innerHtml = data.login;
         $scope.loggedIn = true;
         $scope.tempUser = data.tempUser;
         if (data.tempUser) {
            $scope.loginFrameClass = 'loginFrame-login';
            $scope.innerHtml = "Se connecter";
         } else {
            $scope.infoWord = '(infos)';
            $scope.loginFrameClass = 'loginFrame-logout';
         }
         itemService.syncWithNewLogin(data.login, data.loginData);
         $scope.hideFrame();
         $timeout(function(){$scope.$apply();});
      });
      $scope.showFrame = function() {
         $scope.frameHidden = false;
         $scope.userinfoClass = 'userinfo-opened'+ ($scope.loggedIn && ! $scope.tempUser ? '-loggedin' : '');
      };
      $scope.hideFrame = function() {
         $scope.frameHidden = true;
         $scope.userinfoClass = 'userinfo-closed';
      };
      $scope.toggleFrame = function() {
         if ($scope.frameHidden) {
            $scope.showFrame();
         } else {
            $scope.hideFrame();
         }
      };
      // for compatibility with messages sent by tasks:
      angular.forEach(loginService.getCallbacks(), function(callback, event) {
         PmInterface.addEventListener('loginModule', event, callback);
      });
      PmInterface.init();
}]);
