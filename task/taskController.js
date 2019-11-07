'use strict';

angular.module('algorea')
   .controller('taskController', ['$scope', '$rootScope', '$window', '$location', '$interval', '$injector', '$http', '$timeout', '$i18next', 'tabsService', function ($scope, $rootScope, $window, $location, $interval, $injector, $http, $timeout, $i18next, tabsService) {
   var itemService, $state;
   if ($injector.has('itemService')) {
      itemService = $injector.get('itemService');
   }
   if ($injector.has('$state')) {
      $state = $injector.get('$state');
   }
   $scope.tabsService = tabsService;
   tabsService.resetTabs($scope.getEditMode && $scope.getEditMode() == 'edit');
   $scope.showForum = false;
   $scope.showTask = true;
   if ($scope.inTask) {
      // task inside forum inside task!
      $scope.taskInsideForumInsideTask = true;
   }
   $scope.inTask = true;

   // Last saved state/answer
   $scope.lastSave = {sState: '', sAnswer: ''};

   // platformView = 1 view that the platform wants
   // taskView = view avaible on the task
   // 1 platformView can be several taskViews, for instance, platform wants
   // to show help + forum (2 taskViews) in one tab (1 platformView)
   $scope.lastTaskViews = {};
   var platformViews = {};
   var initPlatformViews = function(platformOnly) {
      platformViews = {
         'attempts': {tabString: 'task_attempts', order: 10},
         'task': {tabString: 'task_statement', taskViews: {'task': true}, order: 20},
         'editor': {tabString: 'task_solve', taskViews: {'editor': true}, order: 21},
         'hints': {tabString: 'task_hints', taskViews: {'hints': true}, order: 22},
         'history': {tabString: 'task_history', order: 30},
         'modify': {tabString: 'task_modify', order: 40}
      };
      if(platformOnly || !$scope.item.bHasAttempts) {
         delete(platformViews.attempts);
         delete(platformViews.history);
      }
      if(!$scope.isEditMode || !$scope.isEditMode('edit')) {
         delete(platformViews.modify);
      }
      if(platformOnly) {
         delete(platformViews.editor);
         delete(platformViews.hints);
      }
   };
   initPlatformViews();
   if ($scope.taskInsideForumInsideTask) {
      delete(platformViews.task);
   }
   $scope.showSolution = function() {
      platformViews.solution = {tabString: 'task_solution', taskViews: {'solution': true}, order: 23};
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
      if($scope.metaData && !$scope.metaData.autoHeight) {
         $scope.taskIframe.css('height', parseInt(height)+40);
      }
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
      if($scope.intervals.syncState) { return; }
      $scope.syncCounter = 0;
      $scope.intervals.syncState = $interval(function() {
         if(!$scope.canGetState) { return; }
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
      }, 3000);
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
         tabsService.selectTab(toParams.section, true);
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
         if($scope.isDisabled(platformView)) { return; }
         if((platformView == 'modify' || platformView == 'settings' || platformView == 'strings') && (!$scope.editable || !$scope.editable())) {
            // Avoid displaying the view if the user doesn't have the rights
            return;
         }
         // Views offered by the platform
         if(platformView == 'history') {
            $scope.getHistory();
         }
         $scope.showTask = !!(platformViews[platformView].taskViews && $scope.item.sUrl);
         if($scope.showTask) {
            // View offered by the task
            var callbackFun = $scope.firstViewLoaded ? function() {} : $scope.load_answer_and_sync;
            $scope.task.showViews(platformViews[platformView].taskViews, callbackFun, function(){});
         }
         $scope.currentView = platformView;
      }
   };

   $scope.setViews = function(taskViews) {
      // TODO :: better handling of task views
      if (taskViews.task && taskViews.task.includes && taskViews.task.includes.indexOf['editor'] != -1) {
         platformViews.task = {
            tabString: $i18next.t('task_statement') + ' & ' + $i18next.t('task_solve'), // TODO find a way to send the translation keys
            taskViews: {'task': true, 'editor': true},
            order: 20};
         delete platformViews.editor;
         if($scope.currentView == 'editor') { $scope.currentView = 'task'; }
      } else {
         platformViews.task = {tabString: 'task_statement', taskViews: {'task': true}, order: 20};
         if (taskViews.editor && !taskViews.editor.requires) {
            platformViews.editor = {tabString: 'task_solve', taskViews: {'editor': true}, order: 21};
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

   $scope.setTabs = function (taskViews, platformOnly) {
      $scope.lastTaskViews = taskViews;
      $scope.firstViewLoaded = false;

      // TODO :: find how to make it work
      if($scope.currentView == 'modify' || $scope.currentView == 'strings' || $scope.currentView == 'parameters') {
         $scope.setEditMode('edit');
      }

      initPlatformViews(platformOnly);
      if (!this.inForum && this.useForum) {
         platformViews.forum = {tabString: 'task_help'};
      }
      if ($scope.user_item.bAccessSolutions || $scope.user_item.bValidated) {
         $scope.showSolution();
      } else {
         $scope.hideSolution();
      }
      $scope.setViews(taskViews);

      $scope.askedView = $scope.currentView;
      if($scope.isDisabled($scope.askedView)) { $scope.askedView = null; }
      angular.forEach(platformViews, function(platformView, platformViewName) {
         var newTab = {
            id:       platformViewName,
            title:    platformView.tabString,
            order:    platformView.order,
            disabled: $scope.isDisabled(platformViewName),
            callback: $scope.tabSelect.bind($scope)
         };
         tabsService.addTab(newTab);
      });

      if(!tabsService.getCurTabId()) {
         // No tab was selected
         if($scope.editable() && !$scope.item.sUrl) {
            if(!$scope.isEditMode) { return; }
            if(!$scope.isEditMode('edit')) {
               $scope.setEditMode('edit');
               $scope.setTabs(taskViews, platformOnly);
               return;
            }
            $scope.askedView = 'modify';
         }
      }
   };
   $scope.isDisabled = function(view) {
     if(view == 'task' && !$scope.item.sUrl) {
        return true;
     }
     if(view == 'task' && $scope.item.bHasAttempts && !$scope.user_item.idAttemptActive) {
        return true;
     }
     return false;
   };

   $scope.tabSelect = function(tabname, isMine) {
      if(!isMine) {
         $scope.showTask = false;
         $scope.currentView = null;
         return;
      }
      if(tabname != $scope.currentView) {
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
      $scope.createAttempt(function () {
         tabsService.selectTab('task');
         });
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
      $scope.showTask = true;
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
         $scope.showView('attempts');
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
      tabsService.selectTab('task');
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

   $scope.startItem = function() {
      $scope.apiRequest('startItem');
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
})

.filter('attemptTime', function() {
   return function(attempt) {
      var mins = Math.floor((attempt.sBestAnswerDate - attempt.sStartDate) / 60000);
      var secs = Math.floor((attempt.sBestAnswerDate - attempt.sStartDate) / 1000) % 60;
      return (mins ? mins + 'mn ' : '') + secs + 's';
   };
})

.filter('bestAttemptTime', function() {
   return function(attempts) {
      var bestTime = Infinity;
      angular.forEach(attempts, function(attempt) {
         if(attempt.iScore > 0 && attempt.sStartDate && attempt.sBestAnswerDate) {
            var curTime = attempt.sBestAnswerDate - attempt.sStartDate;
            if(curTime < bestTime) { bestTime = curTime; }
         }
      });
      if(bestTime === Infinity) { return ''; }
      var mins = Math.floor(bestTime / 60000);
      var secs = Math.floor(bestTime / 1000) % 60;
      return (mins ? mins + 'mn ' : '') + secs + 's';
   };
})

.filter('isBestAttempt', function() {
   return function(attempt, attempts) {
      if(attempt.iScore == 0 || !attempt.sStartDate || !attempt.sBestAnswerDate) { return false; }
      var attemptTime = attempt.sBestAnswerDate - attempt.sStartDate;
      var isBest = true;
      angular.forEach(attempts, function(curAttempt) {
         isBest = isBest && !(
            curAttempt.iScore > attempt.iScore
               || (curAttempt.iScore == attempt.iScore
                && curAttempt.sStartDate
                && curAttempt.sBestAnswerDate
                && (curAttempt.sBestAnswerDate - curAttempt.sStartDate) < attemptTime));
      });
      return isBest;
   };
})

.filter('isEmptyObject', function() {
   return function(obj) {
      return !Object.keys(obj).length;
   };
});
