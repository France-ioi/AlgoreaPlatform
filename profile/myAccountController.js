'use strict';

angular.module('algorea').controller('myAccountController', ['$scope', 'loginService', function ($scope, loginService) {

    $scope.$on('onUserLoaded', function(event, user) {
        $scope.user = user;
    });

    $scope.openPopup = function(action) {
        loginService.openLoginPopup(action);
    }

}]);