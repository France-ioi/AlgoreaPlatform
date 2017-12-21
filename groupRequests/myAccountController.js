'use strict';

angular
    .module('algorea')
    .controller('myAccountController',
        ['$scope',
        function
        ($scope) {
console.log($scope.user)
    $scope.user = $scope.$parent.user;

    $scope.openPopup = function(action) {
        loginService.openLoginPopup(action);
    }

}]);