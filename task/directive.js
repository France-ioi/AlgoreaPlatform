'use strict';

// root url of tasks, everything before task.php
var taskRootUrl = 'http://tasks.eroux.fr/';

angular.module('algorea')
  .directive('includeTask', function () {
    return {
      restrict: 'EA',
      scope: false,
      template: function(elem, attrs) {
        return '<iframe ng-src="{{taskUrl}}" class="iframe-task" id="{{taskName}}" build-task allowfullscreen></iframe>';
      },
      link: function(scope, elem, attrs) {
         console.error('start link!');
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
  .directive('buildTask', ['$location', '$sce', '$http', '$timeout', function ($location, $sce, $http, $timeout) {
    function loadTask(scope) {
      scope.loadedUserItemID = scope.user_item.ID;
      scope.task = TaskProxyManager.getTaskProxy(scope.taskName, true);
      scope.task.unloaded = false;
      scope.grader = TaskProxyManager.getGraderProxy(scope.taskName);
      scope.platform = new Platform(scope.task);
      TaskProxyManager.setPlatform(scope.task, scope.platform);
      scope.platform.showView = function(view) {
         scope.selectTab(view);
      };
      scope.platform.updateHeight = function(height) {
         scope.updateHeight(height);
      };
      scope.platform.askHint = function() {
         scope.askHintUserItemID = scope.user_item.ID;
         $http.post('/task/task.php', {action: 'askHint', sToken: scope.user_item.sToken}, {responseType: 'json'}).success(function(postRes) {
            if ( ! postRes.result) {
               console.error("got error from task.php: "+postRes.error);
            } else if (!scope.canGetState || scope.user_item.ID != scope.askHintUserItemID) {
               console.error("got askHint return from another task");
            } else {
               scope.user_item.sToken = postRes.sToken;
               scope.task.updateToken(scope.user_item.sToken);
            }
         })
         .error(function() {
            console.error("error calling task.php");
         });
      };
      scope.platform.validate = function(mode) {
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
               if (scope.loadedUserItemID != scope.user_item.ID) return;
               $http.post('/task/task.php', {action: 'askValidation', sToken: scope.user_item.sToken, sAnswer: answer}, {responseType: 'json'}).success(function(postRes) {
                  if (scope.loadedUserItemID != scope.user_item.ID) {
                     console.error('loadedUserItemID != user_item.ID');
                     return;
                  }
                  if ( ! postRes.result) {
                     console.error("got error from task.php: "+postRes.error);
                  } else if (!scope.canGetState || validateUserItemID != scope.user_item.ID) {
                     console.error('got validate from another task');
                  } else if (scope.item.sValidationType != 'Manual') {
                     var newAnswer = ModelsManager.createRecord('users_answers');
                     newAnswer.ID = postRes.answer.idUserAnswer;
                     newAnswer.idItem = postRes.answer.idItem;
                     newAnswer.idGroup = postRes.answer.idGroup;
                     newAnswer.sAnswer = postRes.answer.sAnswer;
                     newAnswer.sSubmissionDate = new Date();
                     ModelsManager.curData.users_answers[postRes.answer.idUserAnswer] = newAnswer;
                     scope.user_answer = newAnswer;
                     scope.gradeTask(answer, postRes.sAnswerToken, validateUserItemID);
                  }
               })
               .error(function() {
                  console.error("error calling task.php");
               });
            });
         }
      };
      scope.taskParams = {minScore: 0, maxScore: 10, noScore: 0, readOnly: !!scope.readOnly, randomSeed: scope.user_item.idUser};
      scope.platform.getTaskParams = function(askedParam) {
         return askedParam ? scope.taskParams[askedParam] : scope.taskParams;
      };
      scope.gradeTask = function (answer, answerToken, validateUserItemID) {
         scope.grader.gradeTask(answer, answerToken, function(score, message, scoreToken) {
            $http.post('/task/task.php', {action: 'graderResult', sToken: scope.user_item.sToken, scoreToken: scoreToken, answerToken: answerToken, score: score, message: message}, {responseType: 'json'}).success(function(postRes) {
               if ( ! postRes.result) {
                  console.error("got error from task.php: "+postRes.error);
                  return;
               }
               if (scope.user_item.ID != validateUserItemID) {
                  console.error("grading old task");
                  return;
               }
               if (!scope.user_item.bValidated && postRes.bValidated) {
                  scope.user_item.sToken = postRes.sToken;
                  scope.user_item.bValidated = true;
                  scope.user_item.sValidationDate = new Date();
                  ModelsManager.updated('users_items', scope.user_item.ID, false, true);
                  scope.task.updateToken(postRes.sToken, function() {
                     scope.task.getViews(function(views) {
                        scope.showSolution();
                        scope.setTabs(views);
                     });
                  });
               }
               scope.user_item.iScore = Math.max(scope.user_item.iScore, 10*score);
            })
            .error(function() {
               console.error("error calling task.php");
            });
         });
      };
      var views = {'task': true, 'solution': true, 'editor': true, 'hints': true, 'grader': true,'metadata':true};
      scope.taskLoaded = true;
      scope.task.load(views, function() {
         //scope.taskLoaded = true;
         scope.task.getViews(function(views) {
            scope.setTabs(views);
         });
      });
    }
    return {
      restrict: 'EA',
      scope: false,
      link:function(scope, elem, attrs){
         console.error('starting link2!');
         var name = 'task-'+scope.panel;
         if (scope.inForum) {
            name = 'task-'+Math.floor((Math.random() * 10000) + 1);// could be better...
         }
         if (!scope.taskName) {scope.taskName = name;}
         scope.taskIframe = elem;
         function initTask() {
            console.error('init!');
            //scope.taskUrl = $sce.trustAsResourceUrl(taskRootUrl+'task.php?sToken='+scope.user_item.sToken+'&sPlatform=http%253A%252F%252Falgorea.pem.dev&sLangProg=Python&bBasicEditorMode=1&sSourceId='+name+'#'+$location.absUrl());
            if (scope.item.sUrl) {
               scope.taskUrl = $sce.trustAsResourceUrl(scope.item.sUrl+'?sToken='+(scope.user_item ? scope.user_item.sToken : '')+'&sPlatform=http%253A%252F%252Falgorea.pem.dev&sSourceId='+scope.taskName+'#'+$location.absUrl());
            } else {
               //scope.taskUrl = $sce.trustAsResourceUrl('http://tasks.eroux.fr/task_integration_api/example/2013-SK-09ab/index.html?sSourceId='+scope.taskName+'#'+$location.absUrl());
               scope.taskUrl = $sce.trustAsResourceUrl(taskRootUrl+'task.php?sToken='+(scope.user_item ? scope.user_item.sToken : '')+'&sPlatform=http%253A%252F%252Falgorea.pem.dev&sLangProg=Python&bBasicEditorMode=1&sSourceId='+name+'#'+$location.absUrl());
            }
            elem[0].src = scope.taskUrl;
            $timeout(function() { loadTask(scope);});
         }
         if (scope.item && scope.item.sType == 'Task') {
            initTask();
         }
         function reinit() {
            if (!scope.item || scope.item.sType !== 'Task') {
               return;
            }
            console.error('reinit!');
            scope.taskLoaded = false;
            scope.canGetState = false;
            scope.selectTab('task');
            if (!scope.task.unloaded) {
               scope.task.unloaded = true;
               scope.task.unload(function() {
                  TaskProxyManager.deleteTaskProxy(scope.taskName);
                  elem[0].src = '';
                  $timeout(initTask);
               });
            } else {
               TaskProxyManager.deleteTaskProxy(scope.taskName);
               elem[0].src = '';
               $timeout(initTask);
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

angular.module('algorea')
  .directive('includeCourse', function () {
    return {
      restrict: 'EA',
      scope: false,
      template: function(elem, attrs) {
        return '<iframe class="iframe-course" ng-src="{{courseUrl}}" id="{{taskName}}" build-course allowfullscreen></iframe>';
      },
    };
});

angular.module('algorea')
.directive('buildCourse', ['$location', '$sce', '$timeout', '$injector', function ($location, $sce, $timeout, $injector) {
   var itemService, pathService;
   if ($injector.has('itemService')) {
      itemService = $injector.get('itemService');
   }
   if ($injector.has('pathService')) {
      pathService = $injector.get('pathService');
   }
   return {
      restrict: 'EA',
      scope: false,
      link: function(scope, elem, attrs) {
         var name = 'course-'+scope.panel;
         // small hack because of the shape of the model
         function loadCourse(scope) {
            if (!scope.item.bUsesAPI) {
               return;
            }
            scope.task = TaskProxyManager.getTaskProxy(scope.taskName, function() {}, true);
            scope.task.unloaded = false;
            scope.platform = new Platform(scope.task);
            scope.platform.openUrl = function(sTextId) {
               if (itemService && pathService) {
                  var itemId = itemService.getItemIdByTextId(sTextId);
                  pathService.openItemFromLink(itemId, scope.pathParams, scope.panel);
               } else {
                  console.error('you cannot follow links in this mode');
               }
            };
            TaskProxyManager.setPlatform(scope.task, scope.platform);
            scope.platform.showView = function(view) {};
            scope.platform.updateHeight = function(height) {
               scope.updateHeight(height);
            };
            var views = {'task': true,'metadata':true};
            scope.task.load(views, function() {
               scope.task.getMetaData(function(metaData) {
                  scope.metaData = metaData;
                  if (metaData.minWidth) {
                     elem.css('min-width',metaData.minWidth+'px');
                  }
                  scope.onCourseLoaded();
               });
            });
         }
         scope.taskName = name;
         scope.taskIframe = elem;
         var initCourse = function() {
            if (scope.item.sUrl) {
               scope.courseUrl = $sce.trustAsResourceUrl(scope.item.sUrl+'?sToken='+(scope.user_item ? scope.user_item.sToken : '')+'&sPlatform=http%253A%252F%252Falgorea.pem.dev&sSourceId='+scope.taskName+'#'+$location.absUrl());
            } else {
               scope.courseUrl = $sce.trustAsResourceUrl(taskRootUrl+'course.php?sToken='+(scope.user_item ? scope.user_item.sToken : '')+'&sPlatform=http%253A%252F%252Falgorea.pem.dev&sSourceId='+name+'#'+$location.absUrl());
            }
            $timeout(function() {loadCourse(scope);});
         };
         if (!scope.item || scope.item.sType !== 'Course') {
            initCourse();
         }
         scope.$on('admin.itemSelected', function() {
            if (scope.item.bUsesAPI) {
               TaskProxyManager.deleteTaskProxy(scope.taskName);
            }
            elem[0].src = '';
            $timeout(initCourse);
         });
         scope.$on('algorea.reloadView', function(event, viewName){
            if (viewName == scope.panel) {
               if (scope.item.bUsesAPI) {
                  TaskProxyManager.deleteTaskProxy(scope.taskName);
               }
               elem[0].src = '';
               $timeout(initCourse);
            }
         });
      }
   };
}]);
