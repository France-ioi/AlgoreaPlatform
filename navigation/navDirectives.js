'use strict';

angular.module('algorea')
  .directive('displayItem', ['itemService', 'pathService', '$rootScope', function (itemService, pathService, $rootScope) {
    return {
      restrict: 'EA',
      scope: false,
      template: function(element, attrs) {
        if(attrs.from == 'main') {
           return '<div ng-include="viewsBaseUrl+\'item-header.html\'"></div>' +
                  '<div ng-show="showItem" ng-include="getTemplate()"></div>';
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
            scope.imageUrl = scope.strings && scope.strings.sImageUrl ? scope.strings.sImageUrl : 'images/default-level.png';
            scope.user_item = scope.item && scope.item.ID > 0 ? itemService.getUserItem(scope.item) : null;
            scope.item_item = scope.item && scope.item.ID > 0 ? scope.selectItemItem(scope.item, scope.parentItemID) : null;
            scope.depth = attrs.depth ? parseInt(attrs.depth) : 0;
            scope.visible = scope.item && !scope.item.bTransparentFolder;
            scope.active_tab=0;
            scope.showItem = true;
            scope.setItemIcon(scope.item);
            if (from == "parent") {
               scope.setItemAccessIcon(scope.item);
               scope.setScore(scope.item);
               scope.relativePath = (scope.relativePath === undefined ? '' : scope.relativePath)+'-'+scope.item.ID;
               scope.activityClass = (scope.item.ID == scope.pathParams.path[scope.pathParams.path.length-1]) ? 'active' : 'inactive';
            } else if (from == "children-list") {
               scope.relativePath = (scope.relativePath === undefined ? '' : scope.relativePath)+'-'+scope.item.ID;
            } else {
               scope.relativePath = '';
            }
            scope.depth = (scope.depth === undefined) ? 0 : scope.depth + 1;
         };
         scope.$watch('item.ID', function() { scope.init(attrs.from); });
         scope.$on('algorea.reloadView', function(event, viewName){
            if (viewName == 'breadcrumbs' && scope.panel=='menu' || viewName == scope.panel) {
               scope.localInit();
               scope.init(scope.panel);
            } else {
               if (scope.hasOwnProperty('getPathParams')) { // don't do it on each subscope
                  scope.getPathParams();
               }
               scope.activityClass = (scope.item.ID == scope.pathParams.path[scope.pathParams.path.length-1]) ? 'active' : 'inactive';
            }
         });
         scope.$on('algorea.itemTriggered', function(event, itemId){
            if (scope.item && itemId == scope.item.ID) {
               scope.init(attrs.from);
            }
         });
         scope.$on('algorea.languageChanged', function() {
            scope.strings = scope.item && scope.item.ID > 0 ? itemService.getStrings(scope.item) : null;
         });
      }
    };
}]);
