"use strict";

angular.module('algorea')
.controller('groupsAccountsCreateCtrl', ['$scope', '$http', function($scope, $http) {

    $scope.error = null;
    $scope.fetching = false;

    $scope.expanded = false;
    $scope.expand = function() {
        $scope.expanded = true;
    }


    $scope.users_in_ubgroups = false;
    $scope.subgroups = {
        list: '',
        users_per_subgroup: 1,
        total: 0
    }

    function getSubgroups() {
        return $scope.subgroups.list.split('\n').filter(function(l) {
            return l.trim() != '';
        })
    }

    $scope.calculateSubgoupsTotal = function() {
        $scope.subgroups.total = getSubgroups().length * $scope.subgroups.users_per_subgroup;
    }



    $scope.login = {
        prefix: '',
        example: '',
        amount: 0
    }

    $scope.refreshExampleLogin = function() {
        $scope.login.example = $scope.login.prefix + '_0123456789';
        console.log($scope.login)
    }


    $scope.accounts = []

    $scope.createUsers = function() {
        $scope.error = null;
        $scope.fetching = true;
        var params = {
            action: 'create',
            prefix: $scope.login.prefix,
            amount: $scope.login.amount
        }
        $http.post('/admin/accounts_manager.php', params, { responseType: 'json'})
            .success(function(res) {
                if(res.success) {
                    $scope.accounts = res.data;
                } else {
                    $scope.error = res.error
                }
                $scope.fetching = false;
            })
            .error(function() {
                console.error("error calling accounts_manager.php");
            });
    }

}]);