'use strict';

angular.module('algorea')
   .controller('forumThreadController', ['$scope', '$state', 'itemService', 'loginService', '$http', '$timeout', '$rootScope',  function ($scope, $state, itemService, loginService, $http, $timeout, $rootScope) {
   if (!$scope.inTask) {
      $scope.layout.isOnePage(true);
      $scope.user_item = {};
   } else {
      $scope.other_user_item = $scope.user_item; // a bit convoluted... this variable is forced as user_item for the task in the thread. In the case where the thread is itself in a task, we need this
   }
   $scope.inForum = true;
   $scope.other_user_item = $scope.user_item; // fake user_item of the asking user
   $scope.loading = true;
   $scope.taskLoading = true;
   $scope.taskLoadingError = null;
   $scope.hasTask = false;
   $scope.ownThread = false;
   $scope.newThread = false;
   $scope.task = {};
   // $scope.item might be already defined if we are in a task context
   //$scope.item = $scope.item ? $scope.item : {};
   if (!$scope.item) {
      $scope.item = {};
   }
   $scope.newMessage = null;
   $scope.newMessageInserted = false;
   //$scope.myUserID = null;
   $scope.answers = [];
   $scope.events = [];
   $scope.canValidate = false;
   $scope.threadData = {currentAnswer: null}; // just to ease prototypal inheritance
   $scope.thread = null;
   $scope.createEmptyNewMessage = function() {
      $scope.newMessage = ModelsManager.createRecord('messages');
      $scope.newMessage.idThread = $scope.thread.ID;
      $scope.newMessage.idUser = $scope.myUserID;
      $scope.newMessage.sLogin = $scope.myLogin;
      $scope.newMessage.bPublished = false;
      $scope.newMessage.sSubmissionDate = false;
   };
   $scope.openAnswer = function(answer) {
      if (answer) {
         $scope.$broadcast('task-answers.openAnswer', answer.sAnswer);
         $scope.threadData.currentAnswer = answer;
      }
   };
   $scope.ensureUserThread = function() {
      angular.forEach($scope.thread.user_thread, function(found_user_thread) {
         $scope.user_thread = found_user_thread;
      });
      if (!$scope.user_thread || $scope.user_thread.idUser != $scope.myUserID) {
         $scope.user_thread = ModelsManager.createRecord('users_threads');
         $scope.user_thread.idUser = $scope.myUserID;
         $scope.user_thread.idThread = $scope.thread.ID;
         ModelsManager.insertRecord('users_threads', $scope.user_thread);
      }
   };
   $scope.updateReadDate = function() {
      $scope.user_thread.sLastReadDate = new Date();
      ModelsManager.updated('users_threads', $scope.user_thread.ID);
   };
   $scope.updateWriteDate = function() {
      $scope.user_thread.sLastWriteDate = new Date();
      ModelsManager.updated('users_threads', $scope.user_thread.ID);
   };
   function fetchThread(idThread) {
      itemService.syncThread(idThread, function() {
         var thread = itemService.getRecord('threads', idThread);
         $scope.thread = thread;
         $scope.loading = false;
         if (!thread) {
            return;
         }
         $scope.ownThread = ($scope.myUserID == thread.idUserCreated);
         angular.forEach(thread.messages, function(message) {
            if (message.idUser == $scope.myUserID && message.sSubmissionDate === null) {
               $scope.newMessage = message;
               $scope.newMessageInserted = true;
            }
         });
         if ($scope.newMessage === null) {
            $scope.createEmptyNewMessage();
         }
         $scope.events = thread.messages.slice(0);
         if ($scope.thread.idItem && !$scope.inTask) { // scope.inTask prototype-inheritted from taskController when in a task.
            if (!$scope.item.ID) {
               $scope.item = ModelsManager.getRecord('items', $scope.thread.idItem);
            }
            $scope.user_item = itemService.getUserItem($scope.item, $rootScope.myUserID);
            $scope.other_user_item = itemService.getUserItem($scope.item, thread.idUserCreated);
            var typeStr = itemService.getItemTypeStr($scope.item);
            $scope.itemStr = typeStr+' : '+($scope.item.strings[0] ? $scope.item.strings[0].sTitle : '');
            if ($scope.item.sType && $scope.item.sType == "Task") {
               $scope.hasTask = true;
               var currentAnswer = itemService.getCurrentAnswer($scope.item, thread.idUserCreated);
               $scope.answers = itemService.getAnswers($scope.item, thread.idUserCreated);
               $scope.events = $scope.thread.messages.slice(0);
               $scope.events = $scope.events.concat($scope.answers);
               $scope.openAnswer(currentAnswer);
               $scope.taskLoading = false;
               $scope.synchronizeEvents();
            }
         } else if ($scope.inTask) {
            $scope.answers = itemService.getAnswers($scope.item);
            $scope.events = $scope.events.concat($scope.answers);
            $scope.user_item = itemService.getUserItem($scope.item);
            $scope.hasTask = true;
            $scope.taskLoading = false;
            $scope.synchronizeEvents();
         }
         $scope.ensureUserThread();
         $scope.updateReadDate();
      });
   }
   $scope.synchronizeEvents = function() {
      SyncQueue.addSyncEndListeners('forumThreadController', function() {
         $scope.events = $scope.thread.messages.slice(0);
         $scope.answers = itemService.getAnswers($scope.item, $scope.thread.idUserCreated);
         $scope.events = $scope.events.concat($scope.answers);
      }, true);
   }
   $scope.$on('$destroy', function() {
      SyncQueue.removeSyncEndListeners('forumThreadController');
      if ($scope.thread && $scope.thread.ID) {
         itemService.unsyncThread($scope.thread.ID);
      }
   });
   function startNewThread(item) {
      $scope.ownThread = true;
      $scope.newThread = true;
      itemService.onNewLoad(function() {
         var newThread = ModelsManager.createRecord('threads');
         newThread.idUserCreated = $scope.myUserID;
         if (item) {
            newThread.idItem = item.ID;
            newThread.sTitle = item.strings[0].sTitle;
            newThread.sType = 'Help';
            $scope.answers = $scope.item.user_answers;
            $scope.events = $scope.answers;
            $scope.user_item = itemService.getUserItem($scope.item);
            $scope.hasTask = true;
            $scope.taskLoading = false;
         }
         newThread.sLastActivityDate = new Date();
         $scope.thread = newThread;
         $scope.createEmptyNewMessage();
         $scope.ensureUserThread();
         $scope.loading = false;
      });
   }
   // function called in the context of a thread inside a task, in which
   // $scope.item is defined
   function lookupThread() {
      var result = null;
      angular.forEach($scope.item.threads, function(thread) {
         if (thread.idUserCreated == $scope.myUserID) {
            result = thread;
         }
      });
      return result;
   }
   function initThread() {
      if ($scope.inTask) {
         $scope.ownThread = true;
         $scope.thread = lookupThread();
         if (!$scope.thread) {
            startNewThread($scope.item);
         } else {
            fetchThread($scope.thread.ID);
         }
      } else {
         if ($state.current.name == 'newThread') {
            startNewThread();
         } else {
            fetchThread($state.params.idThread);
         }
      }
      $scope.canValidate = $scope.user_item && $scope.user_item.bValidated != 0 && $scope.item.sValidationType == 'Manual';
   }
   //initThread();
   $scope.init = function() {
      $scope.loading = true;
      itemService.onNewLoad(function() {
         initThread();
         $timeout($scope.$apply);
      });   
   }
   $scope.init();
   $scope.$on('syncResetted', function() {
      $scope.loading = true;
      $scope.init();
   });
   $scope.$on('algorea.reloadView', function() {
      $scope.loading = true;
      $timeout(initThread);
   });
   // TODO: launch initThread on ModelsManager.addListener('threads', 'updated', 'forumThreadController', callback); ?
   $scope.isFieldEditable = function(field) {
      return true;
   };
   $scope.submitForm = function(form) {
      if ($scope.inTask) {
         if ($scope.newThread) {
            ModelsManager.insertRecord('threads', $scope.thread);
            $scope.newThread = false;
            $scope.newMessage.sSubmissionDate = new Date();
            $scope.newMessage.bPublished = true;
            ModelsManager.insertRecord('messages', $scope.newMessage);
            $scope.createEmptyNewMessage();
            $scope.newMessageInserted = false;
            $scope.events = $scope.thread.messages.slice(0);
            $scope.events = $scope.events.concat($scope.answers);
         } else {
            ModelsManager.updateRecord('threads', $scope.thread);
         }
      } else {
         if ($state.current.name == 'newThread') {
            ModelsManager.insertRecord('threads', $scope.thread);
            $scope.newMessage.sSubmissionDate = new Date();
            ModelsManager.insertRecord('messages', $scope.newMessage);
            $state.go('thread', {idThread: $scope.thread.ID});
         } else {
            itemService.saveRecord('threads', $scope.thread.ID);
         }
      }
   };
   $scope.getUserString = function(idUser) {
      var user = ModelsManager.getRecord('users', idUser);
      return user ? user.sLogin : '?';
   };
   $scope.newMessageFocus = function() {
      if (!$scope.newMessageInserted) {
         if ($scope.newMessage === null) {
            $scope.createEmptyNewMessage();
         }
         ModelsManager.insertRecord('messages', $scope.newMessage);
         $scope.newMessageInserted = true;
      }
   };
   $scope.newMessageBlur = function() {
      if ($scope.newMessageInserted) {
         if ($scope.newMessage.sBody == '') {
            ModelsManager.deleteRecord('messages', $scope.newMessage.ID);
            $scope.createEmptyNewMessage();
            $scope.newMessageInserted = false;
         } else {
            ModelsManager.updated('messages', $scope.newMessage.ID);
         }
      }
   };
   $scope.newMessageSave = function() {
      $scope.newMessage.sSubmissionDate = new Date();
      $scope.newMessage.bPublished = true;
      ModelsManager.updated('messages', $scope.newMessage.ID);
      $scope.createEmptyNewMessage();
      $scope.newMessageInserted = false;
      $scope.updateWriteDate();
      $scope.events = $scope.thread.messages.slice(0);
      $scope.events = $scope.events.concat($scope.answers);
   };
   $scope.getMessageState = function(message) {
      if (message.ID == $scope.newMessage.ID) {
         return 'noDisplay';
      }
      if (!message.bPublished) {
         return 'typing';
      }
      return 'notEditable';
   };
   var future = new Date(2030,1,1); // let's hope static code analyzers of 2029 will detect this...
   $scope.eventsSortFunction = function(event) {
      if (event.sSubmissionDate == null) {
         return future; 
      }
      return event.sSubmissionDate;
   };
   $scope.toggleTreePicker = function(type) {
      $scope.$broadcast('treeview.load', 'treeview_'+type);
      $scope['showTreePicker_'+type] = !$scope['showTreePicker_'+type];
   };
   $scope.$on('treeview.recordSelected', function(event, recordID, relationID, id) {
      event.stopPropagation();
      if (id == 'treeview_items') {
         $scope.thread.idItem = recordID;
         $scope.toggleTreePicker('items');
         $scope.item = ModelsManager.getRecord('items', recordID);
         $scope.user_item = itemService.getUserItem($scope.item);
         if ($scope.item && $scope.item.sType == 'Task') {
            $scope.answers = $scope.item.user_answers;
            $scope.events = $scope.answers;
         } else {
            $scope.answers = [];
            $scope.events = [];
         }
      } else {
         $scope.thread.idGroup = recordID;
         $scope.toggleTreePicker('groups');
      }
   });
   $scope.manualGrade = function (answer) {
      // answer.iScore must be set to the desired score
      var iScore = parseFloat(answer.iScore);
      if (iScore < 0 || iScore > 100) {
         console.error('iScore must be between 0 and 100!');
         return;
      }
      var bValidated = iScore > 50;
      $http.post('/forum/gradeAnswer.php', {idUserAnswer: answer.ID, iScore: iScore, bValidated: bValidated}, {responseType: 'json'}).
         success(function(data) {
            if (!data.success) {
               $scope.taskLoadingError = data.error;
               $scope.taskLoading = false;
               console.error(data.error);
               return;
            }
         }).
         error(function(data) {
            $scope.taskLoadingError = 'Error while calling validateAnswer.';
            $scope.taskLoading = false;
            console.error(data);
         });
   };
}]).filter('eventsFilter', function() {
   return function(events, position, currentAnswer) {
      var res = [];
      var currentDate = currentAnswer ? currentAnswer.sSubmissionDate : null;
      var now = new Date();
      var recently = new Date(now.getTime() - 15*60000);
      if (!currentDate) {
         if (position == 'before') {
            return events;
         } else {
            return [];
         }
      }
      angular.forEach(events, function(event) {
         if (((event.sSubmissionDate > currentDate && position=='after') ||
               (position=='before' && event.sSubmissionDate <= currentDate)) &&
               (event.bPublished !== false || event.sSubmissionDate > recently)
               ) {
            res.push(event);
         }
      });
      return res;
   };
});
