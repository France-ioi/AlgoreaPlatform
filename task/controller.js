'use strict';

angular.module('algorea')
   .controller('taskController', ['$scope', '$rootScope', '$window', '$location', '$interval', '$injector', '$http', '$timeout', '$i18next', function ($scope, $rootScope, $window, $location, $interval, $injector, $http, $timeout, $i18next) {
   var itemService, $state;
   if ($injector.has('itemService')) {
      itemService = $injector.get('itemService');
   }
   if ($injector.has('$state')) {
      $state = $injector.get('$state');
   }
   $scope.resolutionViewName = 'editor';
   $scope.showForum = false;
   $scope.showTask = true;
   var defaultViewName = 'task';
   if ($scope.inTask) {
      // task inside forum inside task!
      $scope.taskInsideForumInsideTask = true;
      defaultViewName = 'editor';
   }
   $scope.inTask = true;

   // Last saved state/answer
   $scope.lastSave = {sState: '', sAnswer: ''};

   // platformView = 1 view that the platform wants
   // taskView = view avaible on the task
   // 1 platformView can be several taskViews, for instance, platform wants
   // to show help + forum (2 taskViews) in one tab (1 platformView)
   var platformViews = {};
   var initPlatformViews = function() {
      platformViews = {
         'attempts': {tabString: 'task_attempts'},
         'task': {tabString: 'task_statement', taskViews: {'task': true}},
         'editor': {tabString: 'task_solve', taskViews: {'editor': true}},
         'hints': {tabString: 'task_hints', taskViews: {'hints': true}},
         'history': {tabString: 'task_history'},
      };
      if(!$scope.item.bHasAttempts) {
         delete(platformViews.attempts);
         delete(platformViews.history);
      }
   };
   initPlatformViews();
   if ($scope.taskInsideForumInsideTask) {
      delete(platformViews.task);
   }
   $scope.showSolution = function() {
      platformViews.solution = {tabString: 'task_solution', taskViews: {'solution': true}};
   };
   $scope.hideSolution = function() {
      delete platformViews.solution;
   };
   $scope.load_answer_and_sync = function() {
      if ($scope.loadedUserItemID != $scope.user_item.ID) {
         return;
      }
      $scope.firstViewLoaded = true;
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
         $scope.syncCounter = 0;
         $scope.intervals.syncState = $interval(function() {
            if ($scope.canGetState) {
               var user_item = $scope.user_item;
               $scope.task.getState(function(state) {
                  $scope.task.getAnswer(function(answer) {
                     if ($scope.canGetState && $scope.user_item === user_item && (state != $scope.user_item.sState || answer != $scope.user_item.sAnswer)) {
                        $scope.user_item.sState = state;
                        $scope.user_item.sAnswer = answer;
                        ModelsManager.updated('users_items', $scope.user_item.ID, false, true);
                     }

                     // Save current state to users_answers
                     // TODO :: proper system
                     // (note we do it even if the state hasn't changed, to update the timestamp)
                     $scope.syncCounter -= 1;
                     if($scope.syncCounter <= 0) {
                        $scope.keepState(false, true);
                        $scope.syncCounter = 100;
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
      var user_item = $scope.user_item;
      $scope.task.getState(function(state) {
         $scope.task.getAnswer(function(answer) {
            if ($scope.canGetState && user_item === $scope.user_item) {
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
         this.showTask = !!platformViews[platformView].taskViews;
         // Views offered by the platform
         // TODO :: simplify
         this.showForum = (platformView == 'forum');
         this.showAttempts = (platformView == 'attempts');
         this.showHistory = (platformView == 'history');
         if(this.showHistory) {
            $scope.getHistory();
         }
         if(this.showTask) {
            // View offered by the task
            var callbackFun = $scope.firstViewLoaded ? function() {} : $scope.load_answer_and_sync;
            $scope.task.showViews(platformViews[platformView].taskViews, callbackFun, function(){});
         }
         $scope.currentView = platformView;
      }
   };

   // we must control views order, so using array and not object
   $scope.views= [{tabString: 'task_statement'}];
   $scope.viewsIndex = {defaultViewName : 0};
   $scope.setViews = function(taskViews) {
      // TODO :: better handling of task views
      if (taskViews.task && taskViews.task.includes && taskViews.task.includes.indexOf['editor'] != -1) {
         platformViews.task = {
            tabString: $i18next.t('task_statement') + ' & ' + $i18next.t('task_solve'), // TODO find a way to send the translation keys
            taskViews: {'task': true, 'editor': true}};
         delete platformViews.editor;
         if($scope.currentView == 'editor') { $scope.currentView = 'task'; }
      } else {
         platformViews.task = {tabString: 'task_statement', taskViews: {'task': true}};
         if (taskViews.editor && !taskViews.editor.requires) {
            platformViews.editor = {tabString: 'task_solve', taskViews: {'editor': true}};
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
         platformViews.forum = {tabString: 'task_help'};
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
         // Set default view
         if($scope.attemptAutoSelected || ($scope.item.bHasAttempts && $scope.user_item && !$scope.user_item.idAttemptActive)) {
            // Show attempts view if it's our first time on this task
            $scope.askedView = 'attempts';
            $scope.attemptAutoSelected = false;
         } else {
            $scope.askedView = 'task';
         }
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

   $scope.apiRequest = function(action, parameters, callback, syncAfter, errorVar) {
      // Send a request to the task API
      if(!errorVar) { errorVar = 'answersError'; }
      $scope[errorVar] = '';

      if(!$scope.item) {
         $scope[errorVar] = "No item selected.";
         return;
      }

      if(!parameters) { parameters = {}; }
      parameters['action'] = action;
      parameters['idItem'] = $scope.item.ID;

      $http.post('/task/task.php', parameters).success(function(res) {
         if(!res.result) {
            $scope[errorVar] = res.error;
            return;
         }
         if(callback) {
            callback(res);
         }
         if(syncAfter) {
            SyncQueue.planToSend(0);
         }
      });
   };

   // Attempts handling
   $scope.createAttempt = function(callback, auto) {
      $scope.apiRequest('createAttempt', {}, function(res) {
         $scope.selectAttempt(res.attemptId);
         if(callback) { callback(); }
         });
   };

   $scope.userCreateAttempt = function() {
      $scope.selectTab('task');
      $scope.createAttempt();
   };

   $scope.selectAttempt = function(attemptId, loadingState) {
      if(!$scope.user_item) {
         console.error('no user_item');
         return;
      }
      if(!loadingState && ($scope.user_item.sState || $scope.user_item.sAnswer)) {
         if(!$scope.user_item.idAttemptActive) {
            // Use the new attempt ID
            $scope.user_item.idAttemptActive = attemptId;
         }
         $scope.keepState();
      }
      if(!loadingState) {
         $scope.user_item.sState = '';
         $scope.user_item.sAnswer = '';
      }
      $scope.user_item.idAttemptActive = attemptId;
      ModelsManager.updated('users_items', $scope.user_item.ID, 'noSync');
      $scope.apiRequest('selectAttempt', {idAttempt: attemptId}, function(res) {
         $scope.getHistory();
         $scope.user_item.sToken = res.sToken;
         $rootScope.$broadcast('algorea.attemptChanged');
         }, true);
   };

   $scope.autoSelectAttempt = function() {
      var targetAttempt = null;
      for(var attemptId in $scope.item.groups_attempts) {
         var groupAttempt = $scope.item.groups_attempts[attemptId];
         if(!targetAttempt || groupAttempt.iVersion > targetAttempt.iVersion) {
            targetAttempt = groupAttempt;
         }
      }
      if(targetAttempt) {
         $scope.selectAttempt(targetAttempt.ID);
      } else {
         $scope.createAttempt();
      }
   };

   // Answers handling
   $scope.users_answers = {};
   $scope.lastFetchedHistory = {};
   $scope.getHistory = function(manual) {
      var idAttempt = $scope.user_item.idAttemptActive;
      if(!idAttempt ||
         (!manual && $scope.lastFetchedHistory[idAttempt] && (new Date() - $scope.lastFetchedHistory[idAttempt]) < 300000)) {
         // One non-manual refresh per 5 minutes
         return;
      }
      $scope.apiRequest('getHistory', {idAttempt: idAttempt}, function(res) {
         $scope.users_answers[idAttempt] = res.history;
         $scope.lastFetchedHistory[idAttempt] = new Date();
         });
   };

   $scope.loadAnswer = function(answer) {
      $scope.selectTab('task');
      $scope.keepState(true);
      $scope.user_item.sState = answer.sState;
      $scope.user_item.sAnswer = answer.sAnswer;
      $scope.lastSave.sState = answer.sState;
      $scope.lastSave.sAnswer = answer.sAnswer;

      if(answer.idAttempt != $scope.user_item.idAttemptActive) {
         $scope.selectAttempt(answer.idAttempt, true);
      } else {
         ModelsManager.updated('users_items', $scope.user_item.ID);
         $scope.load_answer_and_sync();
      }
   };

   $scope.keepState = function(loadingAfter, isCurrent) {
      var state = $scope.user_item.sState;
      var answer = $scope.user_item.sAnswer;
      if($scope.lastSave.sState == state && $scope.lastSave.sAnswer == answer) { return; }
      $scope.apiRequest('keepState', {
         idAttempt: $scope.user_item.idAttemptActive,
         sState: state,
         sAnswer: answer,
         isCurrent: !!isCurrent},
         function() {
            if(!loadingAfter) {
               $scope.lastSave.sState = state;
               $scope.lastSave.sAnswer = answer;
            }
         }, true);
   };

   $scope.teamUsers = null;
   $scope.getTeamUsers = function() {
      if($scope.teamUsers || !$scope.item.bHasAttempts) { return; }
      $scope.apiRequest('getTeamUsers', {}, function(res) {
         $scope.teamUsers = res.teamUsers;
         });
   };
   $scope.getTeamUsers();

   $scope.manualSync = function() {
      // TODO :: deprecated?
      SyncQueue.planToSend(0);
      $scope.manualSyncDisabled = true;
      $timeout(function() {
         $scope.manualSyncDisabled = false;
      }, 3000);
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
}])

   .filter('orderObjectBy', function() {
   return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
         filtered.push(item);
      });
      filtered.sort(function (a,b) {
         return (a[field] > b[field] ? !reverse : !!reverse) ? 1 : -1;
      });
      return filtered;
   };
});
