'use strict';

angular.module('algorea')
   .controller('navigationController', ['$scope', 'itemService', 'pathService', '$state', '$filter', '$sce', function ($scope, itemService, pathService, $state, $filter, $sce) {
      $scope.domainTitle = config.domains.current.title;
      $scope.viewsBaseUrl = 'navigation/views/';
      $scope.getChildren = function() {
         return itemService.getChildren(this.item);
      };
      if (config.domains.current.additionalCssUrl) {
         $scope.additionalCssUrl = $sce.trustAsUrl(config.domains.current.additionalCssUrl);
      }
      if (config.domains.current.useForum === false) {
         $scope.useForum = false;
      } else {
         $scope.useForum = true;
      }
      $scope.item = {ID: 0};
      $scope.errorItem = {ID: -1};
      $scope.getTemplate = function(from) {
         this.layout.isOnePage(false);
         var suffix = from ? '-'+from : '';
         var type = this.item && this.item.sType ? this.item.sType.toLowerCase() : 'error';
         // exception: DiscoverRootItemId has type Root but should be displayed as a Presentation
         if (this.item && this.item.ID == config.DiscoverRootItemId) type = 'presentation';
         if (type == 'genericchapter' || type == 'staticchapter'  || type == 'contestchapter'  || type == 'limitedtimechapter') {
            type = 'chapter';
         }
         if ( ! from) {
            if (type == 'task' || type == 'course' || type == 'presentation') {
               if (this.panel == 'right') { this.layout.rightIsFullScreen(true); }
            } else {
               if (this.panel == 'right') { this.layout.rightIsFullScreen(false); }
            }
         }
         if (this.pathParams.currentItemID == -2 || (this.pathParams.sell == 0 && this.panel == 'left')) {
            type = 'blank';
            suffix = '';
         } else if (!this.item || this.item.ID == -1) {
            type = 'error';
         } else if (this.item.ID == 0) {
            type = 'loading';
         }
         return this.viewsBaseUrl+type+suffix+'.html';
      };
      $scope.getSref = function(view) {
         return pathService.getSref(this.panel, this.depth, this.pathParams, this.relativePath, view);
      };
      $scope.goToResolution = function() {
         return pathService.goToResolution(this.pathParams);
      };
      // possible status: 'not visited', 'visited', 'validated', 'validated-ol' (in another language), 'failed', 'hintasked'
      $scope.item_status = function() {
         var user_item = itemService.getUserItem(this.item);
         if (!user_item) {
            return 'not visited';
         }
         if (this.item.bGrayedAccess) {
            return 'grayed';
         }
         if (!user_item.sLastActivityDate || user_item.sLastActivityDate.getTime() == 0) {
            return 'not visited';
         }
         if (user_item.bValidated == true) {
            return 'validated';
         }
         if ( ! user_item.bValidated && user_item.nbTaskTried && this.item.sType == 'task') {
            return 'failed';
         }
         if (user_item.nbTaskWithHelp && this.item.sType == 'task') {
            return 'hint asked';
         }
         return 'visited';
      };
      $scope.item_percent_done = function() {
         var user_item = itemService.getUserItem(this.item);
         if (!user_item) {
            return 0;
         }
         var children = itemService.getChildren(this.item);
         var total = 0;
         angular.forEach(children, function(child) {
            if (child.sType != 'Course' && child.bNoScore == 0) {
               total = total + 1;
            }
         });
         if (total == 0) {
            return 100;
         } else {
            return Math.floor(user_item.nbChildrenValidated / total);
         }
         if ( ! user_item.bValidated && user_item.nbTaskTried && this.item.sType == 'task') {
            return 'failed';
         }
         if (user_item.nbTaskWithHelp && this.item.sType == 'task') {
            return 'hint asked';
         }
         return 'visited';
      };
      $scope.get_formatted_date = function(date) {
         return $filter('date')(date, 'fullDate');
      };
      $scope.selectItemItem = function(item, parentID) {
         var res = {};
         angular.forEach(item.parents, function(item_item) {
            if (item_item.idItemParent == parentID) {
               res = item_item;
            }
         });
         return res;
      };
      $scope.getItem = function(callback) {
         var that = this;
         itemService.getAsyncRecord('items', that.pathParams.currentItemID, function(item){
            if (!item) {
              that.item = that.errorItem;
              return;
            }
            that.item = item;
            that.parentItemID = item.ID;
            that.strings = itemService.getStrings(item);
            that.children = itemService.getChildren(item);
            that.user_item = itemService.getUserItem(item);
            if (that.pathParams.parentItemID && that.pathParams.parentItemID != -2) {
               that.item_item = $scope.selectItemItem(item, that.pathParams.parentItemID);
            } else {
               that.item_item = {};
            }
            itemService.onSeen(item);
            if(callback) {
               callback(item);
            }
         });
      };
}]);

angular.module('algorea')
   .controller('rightNavigationController', ['$scope', 'pathService', function ($scope, pathService) {
      $scope.panel = 'right';
      $scope.getPathParams = function() {$scope.pathParams = pathService.getPathParams('right');}
      $scope.localInit = function() {
         $scope.getPathParams();
         $scope.item = {ID: 0};
         $scope.getItem();
      };
      $scope.localInit();
      $scope.$on('syncResetted', function() {
         $scope.localInit();
      });
}]);

angular.module('algorea')
   .controller('leftNavigationController', ['$scope', 'pathService', 'itemService', '$rootScope', function ($scope, pathService, itemService, $rootScope) {
      $scope.panel = 'left';
      $scope.getPathParams = function() {$scope.pathParams = pathService.getPathParams('left');}
      $scope.itemsList = [];
      function getLeftItems(item) {
         $scope.leftParentItemId = item.ID;
         $scope.itemList = [];
         if (item.sType == 'Presentation') {
            $scope.itemList = [item];
            return;
         }
         var children = itemService.getChildren(item);
         angular.forEach(children, function(child) {
            child.private_sref = pathService.getSref($scope.panel, 1, $scope.pathParams, '/'+child.ID);
            $scope.itemsList.push(child);
         });
         $scope.currentActiveId = $scope.pathParams.path[$scope.pathParams.selr-1];
         var strings = itemService.getStrings(item);
         if (!strings) {
            console.error('no string for item'+item.ID);
            $scope.currentLeftItemTitle = '';
         } else {
            $scope.currentLeftItemTitle = strings.sTitle;
         }
      };
      $scope.localInit = function() {
         $scope.getPathParams();
         $scope.item = {ID: 0};
         $scope.getItem(getLeftItems);
      };
      $scope.localInit();
      $scope.$on('syncResetted', function() {
         $scope.localInit();
      });
      $scope.$on('algorea.reloadView', function(event, viewName){
         if (viewName == 'right') {
            $scope.getPathParams();
            $scope.currentActiveId = $scope.pathParams.path[$scope.pathParams.selr-1];
         }
      });
}]);

angular.module('algorea')
   .controller('leftNavItemController', ['$scope', 'pathService', 'itemService', function ($scope, pathService, itemService) {
   function init() {
      var item = $scope.item;
      $scope.item_item = $scope.selectItemItem(item, $scope.leftParentItemId);
      var type_iconName = {
         'Root': 'list',
         'Task': 'keyboard',
         'Chapter': 'folder',
         'Course': 'assignment',
         'Presentation': 'speaker_notes',
         'Level': 'folder',
         'Section': 'folder',
      };
      var user_item = itemService.getUserItem(item);
      if (item.sType == 'Task') {
         if (!user_item) {
            $scope.mainIconTitle = '';
            $scope.mainIconClass = "unvisited-item-icon";
            $scope.mainIconName = 'keyboard';
         } else if (user_item.bValidated) {
            $scope.mainIconTitle = 'validé le '+$scope.get_formatted_date(user_item.sValidationDate);
            $scope.mainIconClass = "validated-item-icon";
            $scope.mainIconName = 'check_circle';
         } else if (user_item.nbTasksTried) {
            $scope.mainIconTitle = 'vu le '+$scope.get_formatted_date(user_item.sLastActivityDate);
            $scope.mainIconClass = "failed-item-icon";
            $scope.mainIconName = 'cancel';
         } else if (user_item.sLastActivityDate) {
            $scope.mainIconTitle = 'vu le '+$scope.get_formatted_date(user_item.sLastActivityDate);
            $scope.mainIconClass = "visited-item-icon";
            $scope.mainIconName = 'keyboard';
         } else {
            $scope.mainIconTitle = '';
            $scope.mainIconClass = "unvisited-item-icon";
            $scope.mainIconName = 'keyboard';
         }
      } else {
         $scope.mainIconName = type_iconName[item.sType];
         if (user_item && user_item.sLastActivityDate) {
            $scope.mainIconTitle = 'vu le '+$scope.get_formatted_date(user_item.sLastActivityDate);
            $scope.mainIconClass = "visited-item-icon";
         } else {
            $scope.mainIconTitle = '';
            $scope.mainIconClass = "unvisited-item-icon";
         }
      }
      if (item.ID == $scope.currentActiveId) {
         $scope.mainIconClass = "active-item-icon";
         $scope.linkClass = "active-item-link";
         $scope.backgroundClass = "active-item-background";
      } else {
         $scope.backgroundClass = "inactive-item-background";
         if (user_item && user_item.sLastActivityDate) {
            $scope.linkClass = "visited-item-link";
         } else {
            $scope.linkClass = "unvisited-item-link";
         }
      }
   }
   init();
   $scope.$on('algorea.reloadView', function(event, viewName){
      if (viewName == 'right') {
         init();
      }
   });
   $scope.$on('algorea.itemTriggered', function(event, itemId){
      if (itemId == $scope.item.ID) {
         init();
      }
   });
}]);

angular.module('algorea')
   .controller('superBreadCrumbsController', ['$scope', 'itemService', 'pathService', function ($scope, itemService, pathService) {
      $scope.panel = 'menu';
      $scope.getItems = function() {
         angular.forEach($scope.pathParams.path, function(ID, index) {
            $scope.items.push({ID: 0});
            itemService.getAsyncRecord('items', ID, function(item) {
               $scope.items[index] = item;
            });
         });
      };
      $scope.getPathParams = function() {$scope.pathParams = pathService.getPathParams('menu');}
      $scope.localInit = function() {
         $scope.getPathParams();
         $scope.items = [];
         $scope.getItems();
      };
      $scope.localInit();
      $scope.$on('syncResetted', function() {
         $scope.localInit();
      });
}]);

angular.module('algorea')
   .controller('navbarController', ['$scope', '$rootScope', '$state', function ($scope, $rootScope, $state) {
      $scope.gotoIndex = function() {$state.go('contents', {path: config.domains.current.DiscoverRootItemId+'/'+config.domains.current.DiscoverRootSonItemId,sell:1,selr:2});}
      $scope.gotoProgress = function() {$state.go('contents', {path: config.domains.current.ProgressRootItemId+'/'+config.domains.current.OfficialProgressItemId,sell:1,selr:2});}
      $scope.gotoForum = function() {$state.go('forum');}
      $scope.activated = '';
      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams) {
         $scope.activated = '';
         if (toState.name == 'forum' || toState.name == 'thread' || toState.name == 'newThread') {
            $scope.activated = 'forum';
         } else if (toState.name == 'contents') {
            if (toParams && toParams.path && toParams.path.indexOf(config.domains.current.DiscoverRootItemId) !== -1) {
               $scope.activated = 'index';
            } else {
               $scope.activated = 'contents';
            }
         }
      });
}]);
