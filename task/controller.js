'use strict';

angular.module('algorea')
   .controller('taskController', ['$scope', '$rootScope', '$location', '$interval', '$injector', function ($scope, $rootScope, $location, $interval, $injector) {
   var itemService, $state;
   if ($injector.has('itemService')) {
      itemService = $injector.get('itemService');
   }
   if ($injector.has('$state')) {
      $state = $injector.get('$state');
   }
   $scope.resolutionViewName = 'editor';
   $scope.showForum = false;
   $scope.inTask = true;
   var defaultViewName = 'task';
   // platformView = 1 view that the platform wants
   // taskView = view avaible on the task
   // 1 platformView can be several taskViews, for instance, platform wants
   // to show help + forum (2 taskViews) in one tab (1 platformView)
   var platformViews = {
      'task': {tabString: 'Énoncé', taskViews: {'task': true}},
      'editor': {tabString: 'Résolution', taskViews: {'editor': true}},
      'hints': {tabString: 'Indices', taskViews: {'hints': true}},
   };
   $scope.showSolution = function() {
      platformViews.solution = {tabString: 'Solution', taskViews: {'solution': true}};
   };
   $scope.hideSolution = function() {
      delete platformViews.solution;
   };
   $scope.user_answer = null;
   $scope.load_answer_and_sync = function() {
      if ($scope.loadedUserItemID != $scope.user_item.ID) return;
      $scope.user_answer = itemService ? itemService.getCurrentAnswer($scope.item) : '';
      if ($scope.user_answer) {
         $scope.task.reloadAnswer($scope.user_answer.sAnswer, function() {
            if ($scope.loadedUserItemID != $scope.user_item.ID) return;
            if ($scope.user_item.sState) {
               $scope.task.reloadState($scope.user_item.sState, $scope.sync);
            } else {
               $scope.sync();
            }
         });
      } else {
         if ($scope.user_item.sState) {
            $scope.task.reloadState($scope.user_item.sState, $scope.sync);
         } else {
            $scope.sync();
         }
      }
   };
   $scope.intervals = {};
   $scope.updateHeight = function(height) {
      $scope.taskIframe.height(parseInt(height)+40);
      if ($rootScope.refreshSizes) {
         $rootScope.refreshSizes();
      }
   };
   $scope.syncHeight = function () {
      if (!$scope.intervals.syncHeight) {
         $scope.intervals.syncHeight = $interval(function() {
            $scope.task.getHeight(function(height) {
               // we set taskLoaded here to avoid scrollbar blinking at load
               $scope.updateHeight(height);
               $scope.taskLoaded = true;
            });
         }, 1000);
      }
   };
   $scope.syncState = function () {
      if (!$scope.intervals.syncState) {
         $scope.intervals.syncState = $interval(function() {
            if ($scope.canGetState) {
               $scope.task.getState(function(state) {
                  if ($scope.canGetState && state != $scope.user_item.sState) {
                     $scope.user_item.sState = state;
                     ModelsManager.updated('users_items', $scope.user_item.ID, false, true);
                  }
               });
            }
         }, 3000);
      }
   };
   $scope.sync = function() {
      if ($scope.loadedUserItemID != $scope.user_item.ID) return;
      $scope.canGetState = true;
      if (!$scope.readOnly) {
         $scope.syncState();
      }
      $scope.syncHeight();
   };
   $scope.$on('$destroy', function() {
      $scope.canGetState = false;
      angular.forEach($scope.intervals, function(interval) {
         $interval.cancel(interval);
      });
      $scope.task.unload(function(){});
   });
   $scope.$on('algorea.taskViewChange', function(event, toParams) {
      $scope.selectTab($scope.panel == 'right' ? toParams.viewr : toParams.viewl, true);
   });
   $scope.$on('task-answers.openAnswer', function(event, answer) {
      $scope.task.reloadAnswer(answer, function() {});
   });
   $scope.taskLoaded = false;
   $scope.currentView = null;
   $scope.showView = function(platformView) {
      if (!platformViews[platformView]) {return;}
      if (platformView != $scope.currentView) {
         var viewsArg = {};
         viewsArg[platformView] = true;
         if (platformView == 'forum') {
            this.showForum = true;
         } else {
            this.showForum = false;
            if (!$scope.task.unloaded) {
               this.task.showViews(platformViews[platformView].taskViews, $scope.load_answer_and_sync);
            }
         }
         $scope.currentView = platformView;
      }
   };
   // we must control views order, so using array and not object
   $scope.views= [{tabString: 'Énoncé'}];
   $scope.viewsIndex = {defaultViewName : 0};
   $scope.setViews = function(taskViews) {
      if (!taskViews.hints || taskViews.hints.requires) {
         delete platformViews.hints;
      }
      if (!taskViews.editor || taskViews.editor.requires) {
         delete platformViews.editor;
      }
   };
   $scope.setTabs = function (taskViews) {
      if (!this.inForum) {
         platformViews.forum = {tabString: 'Aide'};
      }
      if ($scope.user_item.bAccessSolutions || $scope.user_item.bValidated) {
         $scope.showSolution();
      } else {
         $scope.hideSolution();
      }
      $scope.setViews(taskViews);
      if (platformViews.editor) {
         $scope.hasEditor = true;
         delete platformViews.editor;
      }
      var scopeViews = [];
      var scopeViewsIndex = [];
      angular.forEach(platformViews, function(platformView, platformViewName) {
         scopeViewsIndex[platformViewName] = scopeViews.push({
            string:    $scope.getString(platformViewName, platformView.tabString),
            name:      platformViewName,
            active:    $scope.isActive(platformViewName),
            disabled:  $scope.isDisabled(platformViewName),
            taskViews: platformView.taskViews,
         });
      });
      $scope.views = scopeViews;
      $scope.viewsIndex = scopeViewsIndex;
      var askedView;
      if ($scope.inForum) {
         askedView = platformViews.editor ? 'editor' : 'task';
      } else {
         askedView = this.panel=='right' ? this.pathParams.viewr : this.pathParams.viewl;
      }
      if (!askedView) {
         askedView = defaultViewName;
      }
      $scope.showView(askedView);
   };
   $scope.isActive = function(view) {
     if ($scope.inForum) { return view == 'editor';}
     if (this.panel=='right' && view == this.pathParams.viewr) {
        return true;
     } else if (this.panel=='left' && view == this.pathParams.viewl) {
        return true;
     }
     return false;
   };
   // TODO: this should go to a service, along with task building functions in the directive
   $scope.getString = function(viewName, viewString) {
     if (! $scope.inForum && this.panel=='right' && ! this.pathParams.itemsOnBothSides && viewName == $scope.resolutionViewName) {
        return viewString+" >>";
     }
     return viewString;
   };
   $scope.isDisabled = function(view) {
     if (!$scope.inForum && this.panel=='left' && this.pathParams.itemsOnBothSides && view == $scope.resolutionViewName) {
        return true;
     }
     return false;
   };
   $scope.openSeparateEditor = function() {
      $scope.showEditor = true;
   }
   $scope.selectTab = function(tabname, fromURL) {
      if (!tabname) {
         return;
      }
      if (tabname == $scope.resolutionViewName && !this.pathParams.itemsOnBothSides) {
         //return this.goToResolution();
         $scope.openSeparateEditor();
         return;
      }
      if (tabname != $scope.currentView) {
         if (!$scope.inForum && !fromURL) {
            var params = {
               path:   this.pathParams.pathStr,
               sell:   this.pathParams.sell,
               selr:   this.pathParams.selr,
               viewl:  this.pathParams.viewl,
               viewr:  this.pathParams.viewr,
            };
            if (this.panel == 'right') { params.viewr = tabname; } else { params.viewl = tabname; }
            if ($state) {
               $state.go('contents', params, {notify: false});
            }
         } else {
            $scope.views[$scope.viewsIndex[tabname] -1].active = true;
         }
         $scope.showView(tabname);
      }
      if ($rootScope.refreshSizes) {
         $rootScope.refreshSizes();
      }
   };
}]);

angular.module('algorea')
   .controller('courseController', ['$scope', '$rootScope', '$interval', function ($scope, $rootScope, $interval) {
   $scope.interval = null;
   $scope.courseLoaded = /*false*/true;
   $scope.updateHeight = function(height) {
      $scope.taskIframe.height(parseInt(height)+40);
      if ($rootScope.refreshSizes) {
         $rootScope.refreshSizes();
      }
   };
   $scope.syncHeight = function () {
      if (!$scope.interval) {
         $scope.interval = $interval(function() {
            $scope.task.getHeight(function(height) {
               $scope.updateHeight(height);
               $scope.courseLoaded = true;
            });
         }, 1000);
      }
   };
   $scope.$on('$destroy', function() {
      if ($scope.interval) {
         $interval.cancel($scope.interval);
      }
      $scope.task.unload(function(){});
   });
   $scope.onCourseLoaded = function() {
      $scope.syncHeight();
   };
}]);
