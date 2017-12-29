'use strict';

angular.module('algorea')
    .controller('profileController', ['$scope', '$state', '$stateParams', 'loginService', 'itemService', function ($scope, $state, $stateParams, loginService, itemService) {

    $scope.layout.isOnePage(true);
    $scope.layout.hasMap('never');

    $scope.user = null;
    $scope.loading = true;

    function validateSection(section) {
        return section ? section : 'myAccount'
    }
    $scope.section = validateSection($stateParams.section);

    $scope.selectSection = function(section) {
        $scope.section = validateSection(section);
        $state.go('profile', {section: section}, {notify: false});
    }


    function loadUser() {
        $scope.loading = true;
        loginService.getLoginData(function(data) {
            $scope.tempUser = data.tempUser;
            $scope.loading = false;
            var user = ModelsManager.getRecord('users', data.ID);
            $scope.$broadcast('onUserLoaded', user);
        });
    }

    $scope.$on('login.login', function(event, data) {
        loadUser();
    });

    $scope.$on('login.update', function(event, data) {
        loadUser();
    });

    itemService.onNewLoad(loadUser);


}]);