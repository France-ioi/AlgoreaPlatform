angular.module('algorea')
   .controller('userController', ['$scope', '$rootScope', '$sce', '$location', '$http', 'itemService', 'loginService', '$timeout', '$i18next', function ($scope, $rootScope, $sce, $location, $http, itemService, loginService, $timeout, $i18next) {
      'use strict';
      $scope.loginModuleUrl = $sce.trustAsResourceUrl(config.loginUrl);
      $scope.innerHtml = $i18next.t('login_loading');
      $scope.loggedIn = false;
      $scope.loginStr = null;
      $scope.frameHidden = true;
      $scope.userinfoClass = 'userinfo-closed';
      $scope.loginFrameClass = 'loginFrame-login';
      $scope.infoWord = '';
      loginService.bindScope($rootScope);
      $scope.$on('login.login', function(event, data) {
         $scope.innerHtml = $i18next.t('login_disconnect');
         if (data.tempUser) {
            $scope.loginStr = null;
         } else {
            $scope.loginStr = data.login;
         }
         $scope.loggedIn = true;
         $scope.tempUser = data.tempUser;
         if (data.tempUser) {
            $scope.loginFrameClass = 'loginFrame-login';
            $scope.innerHtml = $i18next.t('login_connect');
         } else {
            $scope.infoWord = '';
            $scope.loginFrameClass = 'loginFrame-logout';
         }
         itemService.syncWithNewLogin(data.login, data.loginData);
         $scope.hideFrame();
         $timeout(function(){$scope.$apply();});
      });
      $scope.$on('login.update', function(event, data) {
            $scope.loginStr = data.login;
            $scope.hideFrame();
            $timeout(function(){$scope.$apply();});
      });
      $scope.$on('login.logout', function(event,data) {
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
      $scope.openLoginPopup = loginService.openLoginPopup;
}]);
