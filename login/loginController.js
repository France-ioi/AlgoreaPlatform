angular.module('algorea')
   .controller('userController', ['$scope', '$rootScope', '$sce', '$location', '$http', 'itemService', 'loginService', '$timeout', function ($scope, $rootScope, $sce, $location, $http, itemService, loginService, $timeout) {
      'use strict';
      $scope.loginModuleUrl = $sce.trustAsResourceUrl(config.loginUrl);
      $scope.innerHtml = 'login_loading';
      $scope.loggedIn = false;
      $scope.loginStr = null;
      $scope.frameHidden = true;
      $scope.userinfoClass = 'userinfo-closed';
      $scope.loginFrameClass = 'loginFrame-login';
      loginService.bindScope($rootScope);

      function loadLoginData(data, mustSync) {
         $scope.innerHtml = 'login_disconnect';
         if (data.tempUser) {
            $scope.loginStr = null;
         } else {
            $scope.loginStr = data.sLogin;
         }
         $scope.loggedIn = true;
         $scope.tempUser = data.tempUser;
         if (data.tempUser) {
            $scope.loginFrameClass = 'loginFrame-login';
            $scope.innerHtml = 'login_connect';
         } else {
            $scope.loginFrameClass = 'loginFrame-logout';
         }
         if(mustSync) {
            itemService.syncWithNewLogin(data.sLogin, data.loginData);
         }
         $scope.hideFrame();
         $timeout(function(){$scope.$apply();});
      };

      $scope.$on('login.login', function(event, data) {
         data.sLogin = data.login;
         loadLoginData(data, true);
      });
      $scope.$on('login.update', function(event, data) {
            $scope.loginStr = data.login;
            $scope.hideFrame();
            $timeout(function(){$scope.$apply();});
      });
      $scope.$on('login.logout', function(event, data) {
         $scope.loginStr = null;
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
      loginService.init();
      loginService.getLoginData(loadLoginData);
      $scope.openLoginPopup = loginService.openLoginPopup;
}]);
