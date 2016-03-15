'use strict';

angular.module('algorea')
  .directive('displayItem', ['itemService', 'pathService', '$rootScope', function (itemService, pathService, $rootScope) {
    return {
      restrict: 'EA',
      scope: false,
      template: function(element, attrs) {
        if (attrs.from == 'menu') {
           return '<span class="breadcrumbs-item-{{activityClass}} breadcrumbs-{{activityClass}}-{{lastClass}} breadcrumbs-{{distanceClass}}">' +
                  '  <span ng-if="active" ng-include="getTemplate(\'menu\')"></span>' +
                  '  <a ng-if="!active" ui-sref="{{getSref()}}" ng-include="getTemplate(\'menu\')"></a></span>';
        } else {
           /* This introduces an additional div in the DOM, it woud be good to make it differently,
            * but Angular doesn't provide a way to select a templateUrl based on scope:
            * templateUrl is evaluated at compile time, not at linking time.
            */
           return '<div ng-include="getTemplate('+(attrs.from ? "'"+attrs.from+"'": '')+')"></div>';
        }
      },
      link:function(scope, elem, attrs){
         scope.init = function(from) {
            scope.strings = scope.item && scope.item.ID > 0 ? itemService.getStrings(scope.item) : null;
            scope.user_item = scope.item && scope.item.ID > 0 ? itemService.getUserItem(scope.item) : null;
            scope.item_item = scope.item && scope.item.ID > 0 ? scope.selectItemItem(scope.item, scope.parentItemID) : null;
            scope.depth = scope.item && scope.item.breadCrumbsDepth ? scope.item.breadCrumbsDepth : 0;
            if (from == 'menu') {
               scope.lastClass = (scope.depth+1 == scope.pathParams.path.length) ? 'last' : 'not-last'; // IE8 doesn't support the :not(:last-child) selector...
               scope.active = (scope.depth+1 == scope.pathParams.selr);
               scope.activityClass = scope.active ? "active" : "inactive";
               scope.distanceClass = 'before-selected';
               if (scope.depth+1 > scope.pathParams.selr) {
                  scope.distanceClass = 'after-selected';
               }
            } else {
               if (from == "parent") {
                  scope.setItemIcon(scope.item);
                  scope.relativePath = (scope.relativePath === undefined ? '' : scope.relativePath)+'/'+scope.item.ID;
                  scope.activityClass = (scope.pathParams.selr != 'r' && scope.item.ID == scope.pathParams.path[scope.pathParams.selr-1]) ? 'active' : 'inactive';
               } else {
                  scope.relativePath = '';
               }
               scope.depth = (scope.depth === undefined) ? 0 : scope.depth + 1;
               scope.children = scope.getChildren();
            }
         };
         scope.init(attrs.from);
         scope.$on('algorea.reloadView', function(event, viewName){
            if (viewName == 'breadcrumbs' && scope.panel=='menu' || viewName == scope.panel) {
               scope.localInit();
               scope.init(scope.panel);
            } else {
               if (scope.hasOwnProperty('getPathParams')) { // don't do it on each subscope
                  scope.getPathParams();
               }
               scope.activityClass = (scope.pathParams.selr != 'r' && scope.item.ID == scope.pathParams.path[scope.pathParams.selr-1]) ? 'active' : 'inactive';
            }
         });
      }
    };
}]);
