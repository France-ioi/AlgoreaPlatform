'use strict';

angular.module('algorea')
   .controller('taskController', ['$scope', '$rootScope', '$window', '$location', '$interval', '$injector', '$i18next', function ($scope, $rootScope, $window, $location, $interval, $injector, $i18next) {
   var itemService, $state;
   if ($injector.has('itemService')) {
      itemService = $injector.get('itemService');
   }
   if ($injector.has('$state')) {
      $state = $injector.get('$state');
   }
   $scope.resolutionViewName = 'editor';
   $scope.showForum = false;
   var defaultViewName = 'task';
   if ($scope.inTask) {
      // task inside forum inside task!
      $scope.taskInsideForumInsideTask = true;
      defaultViewName = 'editor';
   }
   $scope.inTask = true;
   // platformView = 1 view that the platform wants
   // taskView = view avaible on the task
   // 1 platformView can be several taskViews, for instance, platform wants
   // to show help + forum (2 taskViews) in one tab (1 platformView)
   var platformViews = {};
   var initPlatformViews = function() {
      platformViews = {
         'task': {tabString: $i18next.t('task_statement'), taskViews: {'task': true}},
         'editor': {tabString: $i18next.t('task_solve'), taskViews: {'editor': true}},
         'hints': {tabString: $i18next.t('task_hints'), taskViews: {'hints': true}},
      };
   };
   initPlatformViews();
   if ($scope.taskInsideForumInsideTask) {
      delete(platformViews.task);
   }
   $scope.showSolution = function() {
      platformViews.solution = {tabString: $i18next.t('task_solution'), taskViews: {'solution': true}};
   };
   $scope.hideSolution = function() {
      delete platformViews.solution;
   };
   $scope.user_answer = null;
   $scope.load_answer_and_sync = function() {
      if ($scope.loadedUserItemID != $scope.user_item.ID) {
         return;
      }
      $scope.firstViewLoaded = true;
      $scope.user_answer = itemService ? itemService.getCurrentAnswer($scope.item, $scope.user_item.idUser) : '';
      // Default states and answer are the empty strings
      var state = $scope.user_item.sState ? $scope.user_item.sState : '';
      var answer = $scope.user_item.sAnswer ? $scope.user_item.sAnswer : '';
      if ($scope.loadedUserItemID == $scope.user_item.ID && $scope.taskName != 'task-answer') {
         $scope.task.reloadState(state, function () {
             $scope.task.reloadAnswer(answer, $scope.sync);
         });
      } else {
         $scope.task.reloadAnswer(answer, $scope.sync);
      }
   };
   $scope.intervals = {};
   $scope.updateHeight = function(height) {
      $scope.taskIframe.css('height', parseInt(height)+40);
      if ($rootScope.refreshSizes) {
         $rootScope.refreshSizes();
      }
   };
   $scope.syncHeight = function () {
      if ($scope.metaData.autoHeight)
         return;
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
                  $scope.task.getAnswer(function(answer) {
                     if ($scope.canGetState && (state != $scope.user_item.sState || answer != $scope.user_item.sAnswer)) {
                        $scope.user_item.sState = state;
                        $scope.user_item.sAnswer = answer;
                        ModelsManager.updated('users_items', $scope.user_item.ID, false, true);
                     }
                  });
               });
            }
         }, 3000);
      }
   };
   $scope.sync = function() {
      if ($scope.loadedUserItemID != $scope.user_item.ID) {
         return;
      }
      $scope.canGetState = true;
      if (!$scope.readOnly) {
         $scope.syncState();
      }
      $scope.syncHeight();
   };
   $scope.saveStateAnswer = function(callback) {
      // Save the state and the answer
      $scope.task.getState(function(state) {
         $scope.task.getAnswer(function(answer) {
            if ($scope.canGetState) {
               $scope.user_item.sState = state;
               $scope.user_item.sAnswer = answer;
               ModelsManager.updated('users_items', $scope.user_item.ID);
            }
            callback();
         });
      });
   };

   $scope.$on('$destroy', function() {
      if ($scope.task) {
         $scope.saveStateAnswer(function() {
            $scope.canGetState = false;
            var task = $scope.task;
            if (task) {
               $scope.task.unload(function(){
                  task.chan.destroy();
               }, function(){});
            }
         });
         angular.forEach($scope.intervals, function(interval) {
            $interval.cancel(interval);
         });
         $scope.intervals = {};
      }
   });
   $scope.$on('algorea.taskViewChange', function(event, toParams) {
      if ($scope.taskName != 'task-editor' && !$scope.inForum) {
         $scope.selectTab($scope.panel == 'right' ? toParams.viewr : toParams.viewl, true);
      }
   });
   $scope.$on('task-answers.openAnswer', function(event, answer) {
      $scope.task.reloadAnswer(answer, function() {});
   });
   $scope.taskLoaded = false;
   $scope.currentView = null;
   $scope.showView = function(platformView) {
      if (!platformViews[platformView]) {
         return;
      }
      if (platformView != $scope.currentView) {
         var viewsArg = {};
         viewsArg[platformView] = true;
         if (platformView == 'forum') {
            this.showForum = true;
         } else {
            this.showForum = false;
            if ($scope.task && !$scope.task.unloaded) {
               var callbackFun = $scope.firstViewLoaded ? function() {} : $scope.load_answer_and_sync;
               $scope.task.showViews(platformViews[platformView].taskViews, callbackFun, function(){});
            }
         }
         $scope.currentView = platformView;
      }
   };
   // we must control views order, so using array and not object
   $scope.views= [{tabString: 'Énoncé'}];
   $scope.viewsIndex = {defaultViewName : 0};
   $scope.setViews = function(taskViews) {
      // TODO :: better handling of task views
      if (taskViews.task && taskViews.task.includes && taskViews.task.includes.indexOf['editor'] != -1) {
         platformViews.task = {
            tabString: $i18next.t('task_statement') + ' & ' + $i18next.t('task_solve'),
            taskViews: {'task': true, 'editor': true}};
         delete platformViews.editor;
         if($scope.currentView == 'editor') { $scope.currentView = 'task'; }
      } else {
         platformViews.task = {tabString: $i18next.t('task_statement'), taskViews: {'task': true}};
         if (taskViews.editor && !taskViews.editor.requires) {
            platformViews.editor = {tabString: $i18next.t('task_solve'), taskViews: {'editor': true}};
         } else {
            delete platformViews.editor;
         }
      }
      if (!taskViews.hints || taskViews.hints.requires) {
         delete platformViews.hints;
      }
      if (!taskViews.solution || taskViews.solution.requires) {
         delete platformViews.solution;
      }
   };
   $scope.setTabs = function (taskViews) {
      $scope.firstViewLoaded = false;
      initPlatformViews();
      if (!this.inForum && this.useForum) {
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
//         delete platformViews.editor;
      } else {
         $scope.hasEditor = false;
      }
      var scopeViews = [];
      var scopeViewsIndex = [];
      $scope.askedView = $scope.currentView;
      angular.forEach(platformViews, function(platformView, platformViewName) {
         if (!$scope.currentView && $scope.isActive(platformViewName)) {
            $scope.askedView = platformViewName;
         }
         scopeViewsIndex[platformViewName] = scopeViews.push({
            string:    platformView.tabString,
            name:      platformViewName,
            id:        $scope.taskName+'-'+platformViewName,
            active:    platformViewName == $scope.askedView,
            disabled:  $scope.isDisabled(platformViewName),
            taskViews: platformView.taskViews,
         });
      });
      $scope.views = scopeViews;
      $scope.viewsIndex = scopeViewsIndex;
      if (!$scope.askedView) {
         $scope.askedView = 'task';
      }
      $scope.views[$scope.viewsIndex[$scope.askedView] -1].active = true;
      $scope.showView($scope.askedView);
   };
   $scope.isActive = function(view) {
     if ($scope.inForum || $scope.taskName == 'task-editor') { 
         return (view == 'editor'); 
     }
     return (view == this.pathParams.viewr);
   };
   $scope.isDisabled = function(view) {
     if (!$scope.inForum && this.panel=='left' && this.pathParams.itemsOnBothSides && view == $scope.resolutionViewName) {
        return true;
     }
     return false;
   };
   $scope.openSeparateEditor = function() {
      $scope.showEditor = true;
   };
   $scope.selectTab = function(tabname, fromURL) {
      if (!tabname) {
         return;
      }
//      if (tabname == $scope.resolutionViewName && !this.pathParams.itemsOnBothSides) {
//         //return this.goToResolution();
//         $scope.openSeparateEditor();
//         return;
//      }
      if (tabname != $scope.currentView) {
         if (!$scope.inForum && $scope.taskName != 'task-editor' && !fromURL) {
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
         }
         if($scope.currentView && $scope.viewsIndex[$scope.currentView]) {
            $scope.views[$scope.viewsIndex[$scope.currentView]-1].active = false;
         }
         $scope.views[$scope.viewsIndex[tabname] -1].active = true;
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
      $scope.taskIframe.css('height', parseInt(height));
      if ($rootScope.refreshSizes) {
         $rootScope.refreshSizes();
      }
   };
   var lastheight = 0;
   $scope.syncHeight = function () {
      if (!$scope.interval) {
         $scope.interval = $interval(function() {
            $scope.task.getHeight(function(height) {
               if (height == lastheight) {
                  return;
               }
               $scope.updateHeight(height);
               $scope.courseLoaded = true;
               height = lastheight;
            });
         }, 1000);
      }
   };
   $scope.$on('$destroy', function() {
      if ($scope.interval) {
         $interval.cancel($scope.interval);
      }
      if (!$scope.item.bUsesAPI) {
         return;
      }
      if ($scope.task) {
         $scope.task.unload(function(){});
      }
   });
   $scope.onCourseLoaded = function() {
      $scope.syncHeight();
   };
}]);
