angular.module('algorea')
   .controller('userController', ['$scope', '$rootScope', '$sce', '$location', '$http', 'itemService', 'loginService', '$timeout', function ($scope, $rootScope, $sce, $location, $http, itemService, loginService, $timeout) {
      'use strict';
      $scope.loginModuleUrl = $sce.trustAsResourceUrl(config.loginUrl);
      $scope.innerHtml = i18nt('login_loading');
      $scope.loggedIn = false;
      $scope.loginStr = null;
      $scope.frameHidden = true;
      $scope.userinfoClass = 'userinfo-closed';
      $scope.loginFrameClass = 'loginFrame-login';
      $scope.infoWord = '';
      loginService.bindScope($rootScope);
      $scope.$on('login.login', function(event, data) {
         $scope.innerHtml = i18nt('login_disconnect');
         if (data.tempUser) {
            $scope.loginStr = null;   
         } else {
            $scope.loginStr = data.login;
         }
         $scope.loggedIn = true;
         $scope.tempUser = data.tempUser;
         if (data.tempUser) {
            $scope.loginFrameClass = 'loginFrame-login';
            $scope.innerHtml = i18nt('login_connect');
         } else {
            $scope.infoWord = '';
            $scope.loginFrameClass = 'loginFrame-logout';
         }
         itemService.syncWithNewLogin(data.login, data.loginData);
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
      $scope.openLoginPopup = function() {
         var additionalArgs = '';
         if (config.domains.current.additionalLoginArgs) {
           additionalArgs = '&'+config.domains.current.additionalLoginArgs; 
         } 
         if ($scope.loggedIn && !$scope.tempUser) {
            additionalArgs += '&autoLogout=1';
         }
         additionalArgs += '&fallbackReturnUrl='+encodeURIComponent(config.domains.current.baseUrl+'login/loginModule-fallback.php');
         var popup = window.open($scope.loginModuleUrl+'?mode=popup'+additionalArgs,"Login","menubar=no, status=no, scrollbars=no, menubar=no, width=500, height=600");
         if (!$scope.loggedIn || $scope.tempUser) {
            loginService.connectToPopup(popup);
         } else {
            loginService.onLogout();
         }
      };
}]);
