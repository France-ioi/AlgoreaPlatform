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
    $scope.exportData = function() {

    }


    function deleteAccountRequest() {
        $.ajax({
            type: 'POST',
            url: '/profile/account.php',
            data: {
               'action': 'delete'
            },
            timeout: 60000,
            success: function(res) {
                location.href = res.redirect;
            },
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
                    return deleteAccountRequest;
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