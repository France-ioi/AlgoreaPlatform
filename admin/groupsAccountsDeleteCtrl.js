"use strict";

angular.module('algorea')
.controller('groupsAccountsDeleteCtrl', ['$scope', '$http', function($scope, $http) {

    $scope.error = null;
    $scope.success = null;
    $scope.fetching = false;

    $scope.expanded = false;
    $scope.expand = function() {
        $scope.expanded = true;
    }

    $scope.login = {
        prefix: '',
        example: ''
    }

    $scope.refreshExampleLogin = function() {
        $scope.login.example = $scope.login.prefix + '_0123456789';
    }


    $scope.deleteUsers = function() {
        $scope.error = null;
        $scope.fetching = true;
        var params = {
            action: 'delete',
            prefix: $scope.login.prefix
        }
        $http.post('/admin/accounts_manager.php', params, { responseType: 'json'})
            .success(function(res) {
                $scope.success = true;
                $scope.fetching = false;
            })
            .error(function() {
                console.error("error calling accounts_manager.php");
            });
    }

}]);