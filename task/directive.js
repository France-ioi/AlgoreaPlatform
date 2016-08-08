'use strict';

// root url of tasks, everything before task.php
var taskRootUrl = 'http://tasks.eroux.fr/';

angular.module('algorea')
  .directive('includeTask', function () {
    return {
      restrict: 'EA',
      scope: false,
      template: function(elem, attrs) {
        return '<iframe ng-src="{{taskUrl}}" id="{{taskName}}" build-task allowfullscreen></iframe>';
      },
      link: function(scope, elem, attrs) {
         // user-item-var can be used to take a variable other than
         // $scope.user_item for the user_item. This is used in the forum.
         if (typeof attrs.userItemVar !== 'undefined') {
            scope.user_item = scope[attrs.userItemVar];
         }
         if (attrs.readOnly) {
            scope.readOnly = true;
         }
         if (attrs.taskName) {
            scope.taskName = attrs.taskName;
         }
      }
    };
});

angular.module('algorea')
.directive('buildTask', ['$location', '$sce', '$http', '$timeout', '$rootScope', '$state', '$interval', 'mapService', function ($location, $sce, $http, $timeout, $rootScope, $state, $interval, mapService) {
   function loadTask(scope, elem, sameUrl) {
      if (scope.item.sType == 'Task') {
         elem.addClass('iframe-task');
      } else {
         elem.addClass('iframe-course');
      }
      if (!scope.item.bUsesAPI) {
         elem.addClass('fullscreen-iframe');
         scope.taskLoaded = true;
         return;
      }
      TaskProxyManager.getTaskProxy(scope.taskName, function(task) {
         scope.task = task;
         configureTask(scope, elem, sameUrl);
      }, !sameUrl);
   }
   function configureTask(scope, elem, sameUrl) {
      scope.loadedUserItemID = scope.user_item.ID;
      scope.task.unloaded = false;
      // not sure the following line is still necessary
      TaskProxyManager.getGraderProxy(scope.taskName, function(grader) {scope.grader = grader;});
      scope.platform = new Platform(scope.task);
      TaskProxyManager.setPlatform(scope.task, scope.platform);
      scope.platform.showView = function(view, success, error) {
         scope.selectTab(view);
         if (success) { success(); }
      };
      scope.platform.openUrl = function(sTextId, success, error) {
         if (itemService && pathService) {
            var itemId = itemService.getItemIdByTextId(sTextId);
            pathService.openItemFromLink(itemId, scope.pathParams, scope.panel);
            if (success) {success();}
         } else {
            if (error) {
               error('you cannot follow links in this mode');
            } else {
               console.error('you cannot follow links in this mode');
            }
         }
      };
      scope.platform.updateHeight = function(height, success, error) {
         scope.updateHeight(height);
         if (success) { success(); }
      };
      // move to next item in same chapter
      scope.moveToNext = function() {
         scope.goRightLink();
      };
      scope.platform.askHint = function(success, error) {
         $rootScope.$broadcast('algorea.itemTriggered', scope.item.ID);
         scope.askHintUserItemID = scope.user_item.ID;
         $http.post('/task/task.php', {action: 'askHint', sToken: scope.user_item.sToken}, {responseType: 'json'}).success(function(postRes) {
            if ( ! postRes.result) {
               error("got error from task.php: "+postRes.error);
            } else if (!scope.canGetState || scope.user_item.ID != scope.askHintUserItemID) {
               error("got askHint return from another task");
            } else {
               scope.user_item.sToken = postRes.sToken;
               scope.task.updateToken(scope.user_item.sToken, success, error);
            }
         })
         .error(function() {
            error("error calling task.php");
         });
      };
      scope.platform.validate = function(mode, success, error) {
         $rootScope.$broadcast('algorea.itemTriggered', scope.item.ID);
         if (scope.loadedUserItemID != scope.user_item.ID) return;
         var validateUserItemID = scope.user_item.ID;
         if (mode == 'cancel') {
            scope.task.reloadAnswer('', function () {
               $http.post('/task/task.php', {action: 'askValidation', sToken: scope.user_item.sToken, sAnswer: ''}, {responseType: 'json'}).success(function(postRes) {
                  if ( ! postRes.result) {
                     console.error("got error from task.php: "+postRes.error);
                  }
               });
            });
         } else {
            if (!scope.canGetState) return;
            scope.task.getAnswer(function (answer) {
               if (scope.loadedUserItemID != scope.user_item.ID) error('scope.loadedUserItemID != scope.user_item.ID');
               $http.post('/task/task.php', {action: 'askValidation', sToken: scope.user_item.sToken, sAnswer: answer}, {responseType: 'json'}).success(function(postRes) {
                  if (scope.loadedUserItemID != scope.user_item.ID) {
                     error('loadedUserItemID != user_item.ID');
                     return;
                  }
                  if ( ! postRes.result) {
                     error("got error from task.php: "+postRes.error);
                  } else if (!scope.canGetState || validateUserItemID != scope.user_item.ID) {
                     error('got validate from another task');
                  } else if (scope.item.sValidationType != 'Manual') {
                     var newAnswer = ModelsManager.createRecord('users_answers');
                     newAnswer.ID = postRes.answer.idUserAnswer;
                     newAnswer.idItem = postRes.answer.idItem;
                     newAnswer.idGroup = postRes.answer.idGroup;
                     newAnswer.sAnswer = postRes.answer.sAnswer;
                     newAnswer.sSubmissionDate = new Date();
                     ModelsManager.curData.users_answers[postRes.answer.idUserAnswer] = newAnswer;
                     scope.user_answer = newAnswer;
                     scope.gradeTask(answer, postRes.sAnswerToken, validateUserItemID, function(validated) {
                        if (success) { success(); }
                        if (validated && mode == 'next') {
                           scope.moveToNext();
                        }
                     });
                  }
               })
               .error(function() {
                  error("error calling task.php");
               });
            });
         }
      };
      scope.taskParams = {minScore: 0, maxScore: 100, noScore: 0, readOnly: !!scope.readOnly, randomSeed: scope.user_item.idUser, options: {}};
      scope.platform.getTaskParams = function(key, defaultValue, success, error) {
         var res = scope.taskParams;
         if (key) {
            if (key !== 'options' && key in res) {
               res = res[key];
            } else if (res.options && key in res.options) {
               res = res.options[key];
            } else {
               res = (typeof defaultValue !== 'undefined') ? defaultValue : null; 
            }
         }
         if (success) {
            success(res);
         } else {
            return res;
         }
      };
      scope.gradeTask = function (answer, answerToken, validateUserItemID, success, error) {
         scope.grader.gradeTask(answer, answerToken, function(score, message, scoreToken) {
            $http.post('/task/task.php', {action: 'graderResult', sToken: scope.user_item.sToken, scoreToken: scoreToken, answerToken: answerToken, score: score, message: message, idItem: scope.item.ID}, {responseType: 'json'}).success(function(postRes) {
               if ( ! postRes.result) {
                  console.error("got error from task.php: "+postRes.error);
                  return;
               }
               if (scope.user_item.ID != validateUserItemID) {
                  error("grading old task");
                  return;
               }
               if (!scope.user_item.bValidated && postRes.bValidated) {
                  scope.user_item.sToken = postRes.sToken;
                  scope.user_item.bValidated = true;
                  scope.user_item.sValidationDate = new Date();
                  mapService.updateSteps();
                  ModelsManager.updated('users_items', scope.user_item.ID, false, true);
                  $rootScope.$broadcast('algorea.itemTriggered', scope.item.ID);
                  scope.task.updateToken(postRes.sToken, function() {
                     scope.task.getViews(function(views) {
                        scope.showSolution();
                        scope.setTabs(views);
                     });
                  });
               }
               scope.user_item.iScore = Math.max(scope.user_item.iScore, 10*score);
               if (success) { success(postRes.bValidated); } else { return postRes.bValidated; };
            })
            .error(function() {
               error("error calling task.php");
            });
         });
      };
      var views = {'task': true, 'solution': true, 'editor': true, 'hints': true, 'grader': true,'metadata':true};
      scope.taskLoaded = true;
      scope.task.load(views, function() {
         //scope.taskLoaded = true;
         scope.task.getMetaData(function(metaData) {
            scope.metaData = metaData;
            if (metaData.minWidth) {
               if (metaData.minWidth == 'auto') {
                  elem.css('width','100%');
               } else {
                  elem.css('min-width',metaData.minWidth+'px');
               }
            }
            if (metaData.autoHeight) {
               elem.addClass('task-auto-height');
            } else {
               elem.removeClass('task-auto-height');
            }
            $rootScope.$broadcast('layout.taskLayoutChange');
         });
         scope.task.getViews(function(views) {
            scope.setTabs(views);
         });
      });
    }
    return {
      restrict: 'EA',
      scope: false,
      link:function(scope, elem, attrs){
         var name = 'task-'+scope.panel;
         if (scope.inForum) {
            name = 'task-'+Math.floor((Math.random() * 10000) + 1);// could be better...
         }
         if (!scope.taskName) {scope.taskName = name;}
         scope.taskIframe = elem;
         function initTask(sameUrl) {
            scope.currentView = null;
            if (scope.item.sUrl) {
               if (scope.item.bUsesAPI) {
                  var itemUrl = scope.item.sUrl;
                  if (itemUrl.indexOf('#') == -1) {
                     // the idea is not to change the base url even if we change token, so we put token after #
                     itemUrl = itemUrl + '#';
                  }
                  scope.taskUrl = $sce.trustAsResourceUrl(TaskProxyManager.getUrl(itemUrl, (scope.user_item ? scope.user_item.sToken : ''), 'http://algorea.pem.dev', name));
                  // we save the value, to compare it with the new one if iframe is reloaded
                  scope.itemUrl = itemUrl;
               } else {
                  scope.taskUrl = $sce.trustAsResourceUrl(scope.item.sUrl);
                  scope.itemUrl = null;
               }
            } else {
               console.error('item has no url!');
            }
            elem[0].src = scope.taskUrl;
            $timeout(function() { loadTask(scope, elem, sameUrl);});
         }
         if (scope.item && (scope.item.sType == 'Task' || scope.item.sType == 'Presentation' || scope.item.sType == 'Course')) {
            initTask(false);
         }
         // function comparing two url, returning true if the iframe won't be reloaded
         // (= if the difference is only after #)
         function isSameBaseUrl(oldItemUrl, newItemUrl) {
            if (!oldItemUrl || !newItemUrl) {return false;}
            var baseOldItemUrl = oldItemUrl.indexOf('#') == -1 ? oldItemUrl : oldItemUrl.substr(0, oldItemUrl.indexOf('#'));
            var baseNewItemUrl = newItemUrl.indexOf('#') == -1 ? newItemUrl : newItemUrl.substr(0, newItemUrl.indexOf('#'));  
            return baseNewItemUrl == baseOldItemUrl;
         }
         function reinit() {
            if (!scope.item || (scope.item.sType !== 'Task' && scope.item.sType !== 'Presentation' && scope.item.sType !== 'Course')) {
               return;
            }
            scope.taskLoaded = false;
            scope.canGetState = false;
            //scope.selectTab('task');
            scope.currentView = null;
            var sameUrl = isSameBaseUrl(scope.itemUrl, scope.item.sUrl);
            if (scope.task && !scope.task.unloaded) {
               scope.task.unloaded = true;
               angular.forEach(scope.intervals, function(interval) {
                  $interval.cancel(interval);
               });
               scope.task.unload(function() {
                  if (!sameUrl) {
                     TaskProxyManager.deleteTaskProxy(scope.taskName);
                     elem[0].src = '';
                     $timeout(function() {initTask(sameUrl);});
                  } else {
                     scope.task.updateToken(scope.user_item.sToken, function() {
                        initTask(sameUrl);
                     });
                  }
               });
            } else {
               if (!sameUrl) {
                  TaskProxyManager.deleteTaskProxy(scope.taskName);
                  elem[0].src = '';
               }
               $timeout(function() {initTask(sameUrl);});
            }
         }
         scope.$on('admin.itemSelected', function() {
            reinit();
         });
         scope.$on('admin.groupSelected', function() {
            reinit();
         });
         scope.$on('algorea.reloadView', function(event, viewName){
            if (viewName == scope.panel) {
               reinit();
            }
         });
      },
    };
}]);
