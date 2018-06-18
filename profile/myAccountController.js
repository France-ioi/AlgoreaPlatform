'use strict';

angular.module('algorea').controller('myAccountController', [
    '$scope', 'loginService', '$uibModal',
    function ($scope, loginService, $uibModal) {

    $scope.$on('onUserLoaded', function(event, user) {
        $scope.user = user;
    });

    $scope.openPopup = function(action) {
        loginService.openLoginPopup(action);
    }


    $scope.collected_data_controls = window.location.hash === '#collected_data_controls';
    if($scope.collected_data_controls) {
        $scope.loading = true;
        $scope.delete_locks = [];
        $scope.linked_platforms = [];
        request({
            action: 'get_account_data_info'
        }, function(res) {
            $scope.loading = false;
            $scope.delete_locks = res.locks;
            $scope.linked_platforms = res.platforms;
        });
    }


    $scope.deleteAccountAvailable = function() {
        return $scope.collected_data_controls &&
            !$scope.loading &&
            $scope.delete_locks.length === 0 &&
            $scope.linked_platforms.length === 0;
    }


    $scope.platformUrl = function(platform) {
        return platform.sBaseUrl.replace(/\/$/g, '') + '/profile/account.php';
    }


    function request(data, callback) {
        $.ajax({
            type: 'POST',
            url: '/profile/account.php',
            data: data,
            timeout: 60000,
            success: callback,
            error: function(request, status, err) {
                console.error(err)
            }
        });
    }



    $scope.deleteAccount = function() {
        $uibModal.open({
            templateUrl: '/profile/deleteAccountConfirmation.html',
            controller: 'deleteAccountConfirmationController',
            resolve: {
                callback: function() {
                    return function() {
                        request({
                            action: 'delete'
                        }, function(res) {
                            location.href = res.redirect;
                        });
                    }
                }
            },
            backdrop: 'static',
            keyboard: false
        });
    }

}]);



angular.module('algorea')
.controller('deleteAccountConfirmationController', [
    '$scope', '$uibModalInstance', 'callback',
    function($scope, $uibModalInstance, callback) {

        $scope.checked = {
            cb1: false,
            cb2: false
        }


        $scope.close = function() {
            $uibModalInstance.dismiss('cancel');
        }


        $scope.confirm = function() {
            callback();
        }

    }
]);