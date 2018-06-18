'use strict';

angular.module('algorea').controller('myAccountController', ['$scope', 'loginService', function ($scope, loginService) {

    function loadUser() {
        loginService.getLoginData(function(data) {
            $scope.tempUser = data.tempUser;
            $scope.user = ModelsManager.getRecord('users', data.ID);
        });
    }
    loadUser();

    $scope.openPopup = function(action) {
        loginService.openLoginPopup(action);
    }
}]);
