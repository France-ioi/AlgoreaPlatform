'use strict';

angular.module('algorea')
    .controller('profileController', ['$scope', '$state', '$stateParams', 'loginService', 'itemService', 'tabsService', function ($scope, $state, $stateParams, loginService, itemService, globalTabsService) {

    $scope.layout.isOnePage(true);
    $scope.layout.hasMap('never');

    $scope.user = null;
    $scope.loading = true;
    var tabsService = globalTabsService.getTabsService('profile');
    $scope.tabsService = tabsService;

    function validateSection(section) {
        return section ? section : 'myAccount'
    }
    $scope.section = validateSection($stateParams.section);

    tabsService.resetTabs();
    function loadUser() {
        $scope.loading = true;
        loginService.getLoginData(function(data) {
            $scope.tempUser = data.tempUser;
            $scope.loading = false;
            if(!$scope.tempUser) {
                tabsService.addTab({id: 'myAccount', 'title': 'groupRequests_title_account', order: 10});
                if(!config.domains.current.hideGroupsInterfaces) {
                    tabsService.addTab({id: 'groupsMember', 'title': 'groupRequests_title_groups', order: 11});
                    tabsService.addTab({id: 'groupsOwner', 'title': 'groupRequests_title_my_groups', order: 12});
                }
            }
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
