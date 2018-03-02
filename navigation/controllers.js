'use strict';

angular.module('algorea')
   .controller('navigationController', ['$rootScope', '$scope', 'itemService', 'pathService', '$state', '$filter', '$sce','$injector','$timeout', 'contestTimerService', '$http', '$i18next', function ($rootScope, $scope, itemService, pathService, $state, $filter, $sce, $injector, $timeout, contestTimerService, $http, $i18next) {
      $scope.domainTitle = config.domains.current.title;
      $scope.config = config;
      $scope.viewsBaseUrl = $rootScope.templatesPrefix+'navigation/views/';
      var mapService = null;
      if (config.domains.current.useMap) {
         mapService = $injector.get('mapService');
      }
      $scope.getChildren = function() {
         this.setPercentDone(this.item);
         return itemService.getChildren(this.item);
      };
      if (config.domains.current.additionalCssUrl) {
         $scope.additionalCssUrl = $sce.trustAsUrl(config.domains.current.additionalCssUrl);
      }
      if (config.domains.current.usesForum === false) {
         $scope.useForum = false;
      } else {
         $scope.useForum = true;
      }
      $scope.formValues = {};
      $scope.item = {ID: 0};
      $scope.errorItem = {ID: -1};
      this.firstApply = true;
      $scope.setItemOnMap = function() {
         if (this.item && config.domains.current.useMap) {
            mapService.setCurrentItem(this.item, this.pathParams);
         }
      }
      $scope.goToPath = function(path) {
         $state.go('contents', {path: path,sell:null,selr:null});
      }
      $scope.goToForum = function() {
         if (config.domains.current.ForumItemId) {
            $state.go('contents', {path: config.domains.current.ForumItemId,sell:null,selr:null});
         } else {
            $state.go('forum');
         }
      }

      $scope.getTemplate = function(from) {
         this.layout.isOnePage(false);
         var suffix = from ? '-'+from : '';

         $scope.itemType = this.item && this.item.sType ? this.item.sType : 'error';
         var type = $scope.itemType.toLowerCase();
         if(type == 'root') {
            type = 'chapter';
         }
         if ( ! from) {
            if (type == 'chapter') {
               if (config.domains.current.useMap) {
                  type = 'blank';
               }
               this.layout.hasMap('always');
            } else if (type == 'task' || type == 'course') {
               this.layout.hasMap('button', this.firstApply);
            } else {
               this.layout.hasMap('never');
            }
            $scope.setItemOnMap();
            if (this.panel == 'right') {
               if (this.item.sFullScreen != 'forceNo' && (type == 'task' || type == 'course' || this.item.sFullScreen == 'forceYes')) {
                  this.layout.rightIsFullScreen(true);
               } else {
                  this.layout.rightIsFullScreen(false);
               }
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
         this.firstApply = false;

         // haaaaaaacks
         if(suffix == '-children-list') {
            return this.viewsBaseUrl+'children-list.html';
         }

         var ts = type+suffix;
         if (ts == 'task' || ts == 'course') {
            return this.viewsBaseUrl+'taskcourse.html';
         }
         if(ts == 'task-parent' && this.item.bDisplayDetailsInParent) {
            return this.viewsBaseUrl + 'chapter-parent.html';
         }
         return this.viewsBaseUrl+ts+'.html';
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
         if (this.item.bGrayedAccess && !this.item.sDuration && !this.item.sTeamMode && !this.item.groupCodeEnter) {
            return 'grayed';
         }
         if (!user_item || !user_item.sLastActivityDate || user_item.sLastActivityDate.getTime() == 0) {
            return 'not visited';
         }
         if (user_item.bValidated == true) {
            return 'validated';
         }
         if (user_item.iScore > 0) {
            return 'partial';
         }
         if ( ! user_item.bValidated && user_item.nbTaskTried && this.item.sType == 'task') {
            return 'failed';
         }
         if (user_item.nbTaskWithHelp && this.item.sType == 'task') {
            return 'hint asked';
         }
         return 'visited';
      };
      $scope.openContest = function() {
         var idItem = this.item.ID;
         var self = this;
         $http.post('contest/api.php', {action: 'openContest', idItem: idItem}, {responseType: 'json'}).success(function(res) {
            if (!res.success) {
               alert(res.error);
               return;
            }
            config.contestData = {endTime: res.endTime, startTime: res.startTime, duration: res.duration, idItem: idItem};
            contestTimerService.startContest(idItem, res.duration);
            var user_item = itemService.getUserItem(self.item);
            if (user_item) {user_item.sContestStartDate = new Date();}
            // for some reason, sync doesn't work in this case
            SyncQueue.sentVersion = 0;
            SyncQueue.serverVersion = 0;
            SyncQueue.resetSync = true;
            SyncQueue.planToSend(0);
         });
      };
      // TODO: cleanup
      var type_iconName = {
         'Root': 'list',
         'Task': 'keyboard',
         'Chapter': 'folder',
         'Course': 'assignment'
      };
      $scope.setItemIcon = function (item) {
         // Set the main icon (visited, validated, ...)
         var user_item = itemService.getUserItem(item);
         if (item.sType == 'Task') {
            if (!user_item) {
               this.mainIconTitle = '';
               this.mainIconClass = "unvisited-item-icon";
               this.mainIconName = 'keyboard';
            } else if (user_item.bValidated) {
               this.mainIconTitle = $i18next.t('status_validated')+' '+$scope.get_formatted_date(user_item.sValidationDate);
               this.mainIconClass = "validated-item-icon";
               this.mainIconName = 'check_circle';
            } else if (user_item.iScore > 0) {
               this.mainIconTitle = $i18next.t('status_partial')+' '+$scope.get_formatted_date(user_item.sLastActivityDate);
               this.mainIconClass = "partial-item-icon";
               this.mainIconName = 'timelapse';
            } else if (user_item.nbTasksTried) {
               this.mainIconTitle = $i18next.t('status_seen')+' '+$scope.get_formatted_date(user_item.sLastActivityDate);
               this.mainIconClass = "failed-item-icon";
               this.mainIconName = 'cancel';
            } else if (user_item.sLastActivityDate) {
               this.mainIconTitle = $i18next.t('status_seen')+' '+$scope.get_formatted_date(user_item.sLastActivityDate);
               this.mainIconClass = "visited-item-icon";
               this.mainIconName = 'keyboard';
            } else {
               this.mainIconTitle = '';
               this.mainIconClass = "unvisited-item-icon";
               this.mainIconName = 'keyboard';
            }
         } else {
            this.mainIconName = type_iconName[item.sType];
            if (user_item && user_item.bValidated) {
               this.mainIconTitle = $i18next.t('status_validated')+' '+$scope.get_formatted_date(user_item.sValidationDate);
               this.mainIconClass = "validated-item-icon";
               this.mainIconName = 'check_circle';
            } else if (user_item && user_item.sLastActivityDate) {
               this.mainIconTitle = $i18next.t('status_seen')+' '+$scope.get_formatted_date(user_item.sLastActivityDate);
               this.mainIconClass = "visited-item-icon";
            } else {
               this.mainIconTitle = '';
               this.mainIconClass = "unvisited-item-icon";
            }
         }
      };
      $scope.setItemIcon($scope.item);

      $scope.setItemAccessIcon = function (item, item_item) {
         // Set the access icon on the right (locked, unlocker, ...)
         // TODO :: have it used in the template (so far there are issues on
         // item reload)
         this.accessIconClass = '';
         this.accessIcon = '';
         if(item.sDuration) {
            this.accessIcon = 'alarm';
         } else if(item.bGrayedAccess) {
            this.accessIcon = 'lock';
         } else if(item_item && item_item.sCategory == 'Challenge') {
            this.accessIcon = 'star';
         } else if(item.idItemUnlocked) {
            this.accessIcon = 'vpn_key';
            var user_item = itemService.getUserItem(item);
            if(user_item && user_item.bKeyObtained) {
               this.accessIconClass = 'validated-item-icon';
            }
         }
      };
      $scope.setItemAccessIcon($scope.item, $scope.item_item);

      $scope.setScore = function (item) {
         var user_item = itemService.getUserItem(item);
         if (user_item) {
            this.iScore = user_item.iScore;
         }
      };
      $scope.setScore($scope.item);

      $scope.setUserInfos = function() {
         $scope.userInfos = '';
         itemService.onNewLoad(function() {
            var loginData = SyncQueue.requests.loginData;
            if (loginData) {
               if (loginData.tempUser) {
                  $scope.userInfos = $i18next.t('login_not_connected');
                  return;
               }
               if (loginData.sFirstName && loginData.sLastName) {
                  $scope.userInfos = loginData.sFirstName+' '+loginData.sLastName;
               } else {
                  $scope.userInfos = loginData.sLogin;
               }
            }
         });
      }
      $scope.$on('syncResetted', function() {
         $scope.setUserInfos();
      });
      $scope.setUserInfos();

      $scope.setShowUserInfos = function(item, pathParams) {
         this.showUserInfos = false;
         var that = this;
         if (!item) return;
         if (item.bShowUserInfos) {
            this.showUserInfos = true;
            return;
         }
         angular.forEach(pathParams.path, function(itemID, idx) {
            if (itemID == item.ID || idx >= pathParams.selr-1) {
               return false;
            }
            var ancestorItem = itemService.getRecord('items',itemID);
            if (ancestorItem && ancestorItem.bShowUserInfos) {
               that.showUserInfos = true;
            }
         });
      };

      $scope.setPercentDone = function(item) {
         var user_item = itemService.getUserItem(item);
         if (!user_item) {
            this.percentDone = 0;
            return;
         }
         var children = itemService.getChildren(this.item);
         var total = 0;
         var totalScore = 0;
         angular.forEach(children, function(child) {
            if (child.sType != 'Course' && child.bNoScore == 0) {
               var childUserItem = itemService.getUserItem(child);
               if(childUserItem) {
                  if(childUserItem.bValidated) {
                     totalScore += 100;
                  } else {
                     totalScore += childUserItem.iScore;
                  }
               }
               total = total + 1;
            }
         });
         if (total > 0) {
            this.percentDone = Math.floor(totalScore / total);
            return;
         }
         this.percentDone = 0;
/*         if ( ! user_item.bValidated && user_item.nbTaskTried && this.item.sType == 'task') {
            return 'failed';
         }
         if (user_item.nbTaskWithHelp && this.item.sType == 'task') {
            return 'hint asked';
         }
         return 'visited';*/
      };
      $scope.setPercentDone($scope.item);

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
              if (callback) {callback(null);}
              return;
            }
            that.item = item;
            that.parentItemID = item.ID;
            that.strings = itemService.getStrings(item);
            that.imageUrl = (that.strings && that.strings.sImageUrl) ? that.strings.sImageUrl : 'images/default-level.png';
            //that.children = itemService.getChildren(item);
            that.user_item = itemService.getUserItem(item);
            if (!that.user_item) {
               console.error('cannot find user item for item '+item.ID);
               if(callback) {
                  callback(item);
               }
               return;
            }
            if (that.pathParams.parentItemID && that.pathParams.parentItemID != -2) {
               that.item_item = $scope.selectItemItem(item, that.pathParams.parentItemID);
            } else {
               that.item_item = {};
            }
            if (!that.user_item.sLastActivityDate && config.domains.current.useMap) {
               mapService.updateSteps();
            }
            itemService.onSeen(item);
            that.setItemIcon(item);
            that.setItemAccessIcon(item);
            that.setShowUserInfos(item, that.pathParams);
            if(callback) {
               callback(item);
            }
         });
      };
      $scope.$on('algorea.languageChanged', function() {
         if($scope.item) {
            $scope.strings = itemService.getStrings($scope.item);
         }
      });
      $scope.getTitle = function(item) {
         return item.strings[0].sTitle;
      };
}]);

angular.module('algorea')
   .controller('rightNavigationController', ['$scope', 'pathService', 'itemService', '$timeout', '$injector', function ($scope, pathService, itemService, $timeout, $injector) {
      var mapService = null;
      if (config.domains.current.useMap) {
         mapService = $injector.get('mapService');
      }
      $scope.panel = 'right';
      $scope.getPathParams = function() {$scope.pathParams = pathService.getPathParams('right');};
      $scope.setArrowLinks = function() {
         var brothers = itemService.getBrothersFromParent(this.pathParams.parentItemID);
         var nextID, previousID;
         for (var i = 0 ; i < brothers.length ; i++) {
            if ($scope.item && brothers[i].ID == $scope.item.ID) {
               nextID = (i+1<brothers.length) ? brothers[i+1].ID : null;
               break;
            }
            previousID = brothers[i].ID;
         }
         var basePath = $scope.pathParams.path.slice(0, $scope.pathParams.selr-1).join('/');

         // Top link - find first non-transparent parent
         var newSelr = $scope.pathParams.selr-1;
         while(newSelr > 0) {
            var curParentItem = itemService.getItem($scope.pathParams.path[newSelr-1]);
            if(!curParentItem || !curParentItem.bTransparentFolder) { break; }
            newSelr -= 1;
         }
         if(newSelr > 0) {
            var topPath = $scope.pathParams.path.slice(0, newSelr).join('/');
            $scope.topLink = {sref: pathService.getSrefFunction(topPath, newSelr-1, null, null, null), stateName: 'contents', stateParams: {path: topPath, sell: newSelr-1, selr: null, viewr: null}};
         } else {
            $scope.topLink = null;
         }

         // Right link
         if (nextID) {
            $scope.rightImmediateLink = {sref: pathService.getSrefFunction(basePath+'/'+nextID, null, null, null), stateName: 'contents', stateParams: {path: basePath+'/'+nextID, selr: null, viewr: null}};
            $scope.rightLink = $scope.rightImmediateLink;
         } else {
            $scope.rightImmediateLink = null;
            $scope.rightLink = null;
/* Old code to go to the next cousin
            if ($scope.pathParams.selr > 4) {
               var grandParentId = $scope.pathParams.path[$scope.pathParams.selr-3];
               if (grandParentId) {
                  var uncles = itemService.getBrothersFromParent(grandParentId);
                  var grandParentPath = $scope.pathParams.path.slice(0, $scope.pathParams.selr-2).join('/');
                  for (i = 0 ; i < uncles.length ; i++) {
                     if (uncles[i].ID == this.pathParams.parentItemID) {
                        nextID = (i+1<uncles.length) ? uncles[i+1].ID : null;
                        break;
                     }
                  }
                  if (nextID) {
                     $scope.rightLink = {sref: pathService.getSrefFunction(grandParentPath+'/'+nextID, $scope.pathParams.path.length-2, null, null, null), stateName: 'contents', stateParams: {path: basePath, sell: $scope.pathParams.path.length-2, selr: null, viewr: null}};
                  }
               }
            }*/
         }

         // Left link
         if (previousID) {
            $scope.leftLink = {sref: pathService.getSrefFunction(basePath+'/'+previousID, null, null, null), stateName: 'contents', stateParams: {path: basePath+'/'+previousID, selr: null, viewr: null}};
         } else {
            $scope.leftLink = null;
         }
         // setting map link. Some additional logic could be added here
         if (this.pathParams.parentItemID > 0) {// for some forgotten logic, value is -2 when there is no parent item
            $scope.hasMap = true;
         } else {
            $scope.hasMap = false;
         }
      }
      $scope.goLeftLink = function() {
         if ($scope.leftLink) {
            $scope.leftLink.sref();
         }
      };
      $scope.goRightLink = function() {
         // Next item, even if in another chapter
         if ($scope.rightLink) {
            $scope.rightLink.sref();
         }
      };
      $scope.goTopLink = function() {
         if ($scope.topLink) {
            $scope.topLink.sref();
         }
      };
      $scope.goRightImmediateLink = function() {
         // Next item, only in same chapter
         if ($scope.rightImmediateLink) {
            $scope.rightImmediateLink.sref();
         }
      };

      $scope.localInit = function() {
         $scope.getPathParams();
         $scope.firstApply = true;
         $scope.item = {ID: 0};
         $scope.getItem(function() {
            $scope.setArrowLinks();
            $scope.setItemOnMap();
            if (config.domains.current.useMap) {
               mapService.updateSteps();
            }
         });
      };
      $scope.localInit();
      $scope.$on('syncResetted', function() {
         $scope.localInit();
      });
      $scope.$on('algorea.reloadView', function(event, viewName){
         if (viewName == 'right') {
            $scope.getPathParams();
            $scope.setArrowLinks();
            $scope.setItemOnMap();
         }
      });
}]);

angular.module('algorea')
   .controller('leftNavigationController', ['$scope', 'pathService', 'itemService', '$rootScope', function ($scope, pathService, itemService, $rootScope) {
      $scope.panel = 'left';
      $scope.getPathParams = function() {$scope.pathParams = pathService.getPathParams('left');}
      $scope.itemsList = [];
      function getLeftItems(item) {
         if (!item) {
            return;
         }
         $scope.leftParentItemId = item.ID;
         $scope.itemsList = [];
         /*
         if (item.sType == 'Presentation') {
            $scope.itemsList = [item];
            return;
         }
         */
         var children = itemService.getChildren(item);
         angular.forEach(children, function(child) {
            child.private_sref = pathService.getSref($scope.panel, 1, $scope.pathParams, '/'+child.ID);
            child.private_go_func = pathService.getStateGo($scope.panel, 1, $scope.pathParams, '/'+child.ID);
            child.private_go = function () {
               if(!child.bGrayedAccess) {
                  child.private_go_func();
               }
               if ($rootScope.isMobileLayout) {
                  $scope.layout.closeSidebarLeft();
                  $scope.layout.closeSidebarLeftOverlay();
                  $scope.layout.closeMobileNavTop();
               }
            };
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
      $scope.$on('algorea.languageChanged', function() {
         if($scope.item) {
            var strings = itemService.getStrings($scope.item);
            if(strings) {
               $scope.currentLeftItemTitle = strings.sTitle;
            }
         }
      });
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
      var user_item = itemService.getUserItem(item);
      $scope.setItemIcon(item);
      $scope.setItemAccessIcon(item, $scope.item_item);
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
      $scope.strings = itemService.getStrings($scope.item);
      $scope.$applyAsync();
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
   $scope.$on('algorea.languageChanged', function() {
      $scope.strings = itemService.getStrings($scope.item);
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
               if (item) {
                  item.breadCrumbsDepth = index;
               }
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
   .controller('navbarController', ['$scope', '$rootScope', '$state', '$i18next', function ($scope, $rootScope, $state, $i18next) {

      // First line
      $scope.siteTitle = config.domains.current.title;
      $scope.tagline = config.domains.current.taglineHtml;

      function initTabs() {
         // Initialize tabs at the top, adding special tabs not specified in
         // config (only login so far)
         var tabs = [];
         var specials = [];
         for(var i in config.domains.current.tabs) {
            tabs.push(config.domains.current.tabs[i]);
            if(config.domains.current.tabs[i].special) {
               specials.push(config.domains.current.tabs[i].special);
            }
         }
         if(specials.indexOf('login') == -1) {
            tabs.push({special: 'login', path: 'profile'});
         }
         return tabs;
      };
      $scope.siteTabs = initTabs();

      $scope.gotoMenuItem = function(i, tabPath, special) {
         if(special) { return; }
         $scope.activated = i;
         if (tabPath == 'forum'){
            $state.go('forum');
         }
         else if (tabPath == 'profile'){
            $state.go('profile');
         } else {
            if (tabPath.indexOf('/') !== -1) {
               $state.go('contents', {path: tabPath,sell:1,selr:2});
            } else {
               $state.go('contents', {path: tabPath,sell:0,selr:1});
            }
         }
         if ($rootScope.isMobileLayout) {
            $scope.layout.closeMobileNavTop();
         }
      };
      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams) {
         $scope.activated = null;
         var toSearch = toState.name;
         if (toState.name == 'thread' || toState.name == 'newThread') {
            toSearch = 'forum';
         } else if (toState.name == 'contents') {
            toSearch = toParams.path
         }
         angular.forEach($scope.siteTabs, function(tab, i) {
            if (toSearch.indexOf(tab.path) !== -1) {
               $scope.activated = i;
            }
         });
      });
}]);
angular.module('algorea')
   .controller('localeController', ['$scope', '$rootScope', '$i18next', function ($scope, $rootScope, $i18next) {
      // Base locales
      $scope.locales = [
         {id: 'fr', label: 'Français'},
         {id: 'en', label: 'English'}
         ];

      // Fetch available locales
      $scope.updateLocales = function(noApply) {
         var newLocales = [];
         var dbLocales = ModelsManager.getRecords('languages');
         _.forEach(dbLocales, function(curLang) {
            if(!curLang.sCode || !curLang.sName) { return; }
            if(!_.find(newLocales, function(l) { return l.id == curLang.sCode; })) {
               var newLang = {id: curLang.sCode, label: curLang.sName};
               newLocales.push(newLang);
               if(newLang.id == $scope.curLocale.id) { $scope.curLocale = newLang; }
            }
         });
         if(newLocales.length) { $scope.locales = newLocales; }
         $scope.filterLocales(noApply === true);
         if(noApply !== true) {
            $scope.$apply();
         }
      }
      ModelsManager.addListener('languages', 'inserted', 'LocaleController', $scope.updateLocales, true);
      ModelsManager.addListener('languages', 'updated', 'LocaleController', $scope.updateLocales, true);

      $scope.changeLocale = function(newLocale, force) {
         // Select a new locale
         if(!force && $scope.curLocale.id == newLocale.id) { return; }

         $scope.curLocale = newLocale;
         $rootScope.sLocale = $scope.curLocale.id;
         $i18next.changeLanguage($scope.curLocale.id);
         $rootScope.$broadcast('algorea.languageChanged');
      };

      // Handle locales
      $scope.filterLocales = function(noApply) {
         for(var i = $scope.locales.length - 1; i > -1; i--) {
            var locale = $scope.locales[i];
            if(config.domains.current.availableLanguages && config.domains.current.availableLanguages.split(',').indexOf(locale.id) == -1) {
               // Filter locales depending on the config
               $scope.locales.splice(i, 1);
            }
            if($scope.init && locale.id == config.domains.current.defaultLanguage) {
               if(noApply === true) {
                  $scope.curLocale = locale;
               } else {
                  $scope.changeLocale(locale);
               }
               $scope.init = false;
            }
         };
      };

      $scope.curLocale = $scope.locales[0];
      $scope.init = true; // Did we find the defaultLanguage yet?

      $scope.updateLocales(true);
      $scope.changeLocale($scope.curLocale, true);
   }]);
