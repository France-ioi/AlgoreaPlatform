'use strict';

angular.module('algorea')
   .controller('userInfosController', ['$scope', '$rootScope', 'itemService', 'loginService', function ($scope, $rootScope, itemService, loginService) {
   $scope.layout.isOnePage(true);
   $scope.user = null;
   $scope.isLogged = (loginService.getState() == 'login');
   $scope.tempUser =(loginService.isTempUser());
   $scope.fullUser = ($scope.isLogged && !$scope.tempUser);
   itemService.getAsyncUser(function(user) {
      $scope.user = user;
      if ($scope.user.sBirthDate == '0000-00-00') {
         $scope.user.sBirthDate = '';
      }
      if ($scope.user.sTimezone == '') {
         $scope.user.sTimezone = 'Europe/Paris';
      }
      $scope.isLogged = true;
      $scope.tempUser = loginService.isTempUser();
      if (! $scope.tempUser) {
         $scope.fullUser = true;
      }
   });
   $scope.openLoginPopup = function(type) {
      window.open(loginService.loginUrl+'?mode=popup&changePass=1', "Login","menubar=no, status=no, scrollbars=no, menubar=no, width=500, height=600");
   };
   $scope.submitForm = function() {
      if ($scope.user.sBirthDate == '') {
         $scope.user.sBirthDate = '0000-00-00';
      }
      itemService.saveUser();
      window.history.back();
   };
}]);
