angular.module('algorea')
    .directive('displayTabs', ['$rootScope', '$state', 'tabsService', function ($rootScope, $state, globalTabsService) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: $rootScope.templatesPrefix + '/navigation/views/tabs.html',
            link: function (scope, element, attrs) {
                var tabsService = globalTabsService.getTabsService(attrs.name);
                scope.displayedTabs = tabsService.displayedTabs;
                scope.selectTab = tabsService.selectTab;
                scope.getClass = tabsService.getClass;
            }
        };
    }]);
