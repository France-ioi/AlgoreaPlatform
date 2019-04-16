'use strict';

angular.module('algorea')
  .directive('includeTask', function () {
    return {
      restrict: 'EA',
      scope: false,
      template: function(elem, attrs) {
        var userItemVarStr = attrs.userItemVar ? 'user-item-var="'+attrs.userItemVar+'"' : '';
        return '<span ng-show="loadingError">{{loadingError}}</span><span build-task><iframe ng-if="taskUrl && !loadingError" ng-src="{{taskUrl}}" class="iframe-task" id="{{taskName}}" '+userItemVarStr+' allowfullscreen allow="microphone"></iframe></span>';
      },
      link: function(scope, elem, attrs) {
         // user-item-var can be used to take a variable other than
         // $scope.user_item for the user_item. This is used in the forum.
         if (attrs.userItemVar) {
            scope.user_item = scope[attrs.userItemVar];
         }
         if (attrs.readOnly && attrs.readOnly != 'false') {
            scope.readOnly = true;
         }
         if (attrs.taskName) {
            scope.taskName = attrs.taskName;
         }
      }
    };
});

angular.module('algorea')
  .directive('buildTask', ['$sce', '$http', '$timeout', '$rootScope', '$interval', '$injector', '$i18next', 'itemService', 'pathService', 'tabsService', function ($sce, $http, $timeout, $rootScope, $interval, $injector, $i18next, itemService, pathService, tabsService) {
   var mapService = null;
   if (config.domains.current.useMap) {
      mapService = $injector.get('mapService');
   }

   // Steps :
   // -initTask : loads the URL into the iframe
   // -initIframe : wait for the task DOM to be loaded
   // -loadTask : connect to the task object
   // -configureTask : configure the platform and start task.load
   // and then the controller logic takes over

   function initTask(scope, elem, sameUrl) {
      scope.currentView = null;
      // ID of the current instance, allows to avoid callbacks from old tasks
      scope.currentId = Math.random() * 1000000000;
      if (scope.item.sUrl) {
         if (scope.item.bUsesAPI) {
            var itemUrl = scope.item.sUrl;
            scope.taskUrl = $sce.trustAsResourceUrl(TaskProxyManager.getUrl(itemUrl, (scope.user_item ? scope.user_item.sToken : ''), 'http://algorea.pem.dev', name, $rootScope.sLocale));
            scope.itemUrl = itemUrl;
         } else {
            scope.taskUrl = $sce.trustAsResourceUrl(scope.item.sUrl);
            scope.itemUrl = null; // Reload the iframe each time
         }

         // Let a $digest happen before continuing
         $timeout(function() { initIframe(scope, elem, sameUrl); });
      } else {
         loadTask(scope, null, false);
      }
   }

   function initIframe(scope, elem, sameUrl) {
      scope.taskIframe = elem.find('iframe');
//      scope.taskIframe[0].src = scope.taskUrl;
      var timeout = $timeout(function() {
          loadTask(scope, scope.taskIframe, sameUrl);
          }, 3000);
      scope.taskIframe[0].onload = function() {
         if($timeout.cancel(timeout)) {
            loadTask(scope, scope.taskIframe, sameUrl);
         }
      };
   }

   function loadTask(scope, elem, sameUrl) {
      scope.item_strings = scope.item.strings[0];
      scope.item_strings_compare = null;
      if(!scope.item.sUrl) {
         scope.setTabs({}, true);
         scope.taskLoaded = true;
         return;
      }
      scope.loadingError = false;
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
      var currentId = scope.currentId;
      scope.loadOpacity = 1;
      var loadMsgTimeout = $timeout(function () {
         scope.slowLoading = true;
      }, 5000);
      TaskProxyManager.getTaskProxy(scope.taskName, function(task) {
         if(scope.currentId != currentId) { return; }
         $timeout.cancel(loadMsgTimeout);
         scope.task = task;
         configureTask(scope, elem, sameUrl);
      }, !sameUrl, function() {
         if(scope.currentId != currentId) { return; }
         scope.taskLoaded = true;
         scope.loadingError = $i18next.t('task_communicate_error');
         scope.$apply();
      });
   }

   function configureTask(scope, elem, sameUrl) {
      scope.loadedUserItemID = scope.user_item.ID;
      scope.task.unloaded = false;
      // not sure the following line is still necessary
      var currentId = scope.currentId;
      TaskProxyManager.getGraderProxy(scope.taskName, function(grader) {
         if(scope.currentId != currentId) { return; }
         scope.grader = grader;
      });
      scope.taskParams = {
         minScore: 0,
         maxScore: 100,
         noScore: 0,
         readOnly: !!scope.readOnly,
         randomSeed: scope.user_item.attempt ? scope.user_item.attempt.ID : scope.user_item.idUser,
         options: {},   
         returnUrl: config.domains.current.baseUrl+'/task/task.php'
         };

      scope.platform = new Platform(scope.task);
      TaskProxyManager.setPlatform(scope.task, scope.platform);
      scope.platform.showView = function(view, success, error) {
         tabsService.selectTab(view);
         if (success) { success(); }
      };
      scope.platform.openUrl = function(itemPath, success, error) {
         // Temporarily restricted to a specific use case : open an item path
         pathService.openItemFromLink(itemPath);
         if (success) {success();}
      };
      scope.platform.updateHeight = function(height, success, error) {
         // TODO :: remove once we are sure it's not used anymore
         console.log("updateHeight is deprecated and shouldn't be called");
         scope.platform.updateDisplay({height: height}, success, error);
      };
      scope.platform.updateDisplay = function(data, success, error) {
         // Task asked the platform to update display
         if(data.height) {
            scope.updateHeight(data.height);
         }
         if(data.views) {
            scope.setTabs(data.views);
         }
         if(typeof data.scrollTop != 'undefined') {
            // Scroll
            var offset = data.scrollTop && data.scrollTop > 0 ? elem.offset().top + data.scrollTop - 60 : 0;
            $([document.documentElement, document.body]).animate({scrollTop: offset});
         }
         if(success) { success(); }
      };
      scope.platform.askHint = function(hintToken, success, error) {
         $rootScope.$broadcast('algorea.itemTriggered', scope.item.ID);
         scope.askHintUserItemID = scope.user_item.ID;
         $http.post('/task/task.php', {
           action: 'askHint',
           sToken: scope.user_item.sToken,
           hintToken: hintToken,
           userItemId: scope.user_item.ID
          }, {
            responseType: 'json'
          }).success(function(postRes) {
            if ( ! postRes.result) {
               error("got error from task.php: "+postRes.error);
            } else if (scope.user_item.ID != scope.askHintUserItemID) {
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
            scope.task.reloadAnswer('', success, error);
         } else if (mode == 'nextImmediate') {
            scope.moveToNextImmediate();
         } else {
            if (!scope.canGetState) {
               console.log('Warning: canGetState = false');
            };
            scope.task.getAnswer(function (answer) {
               if (scope.loadedUserItemID != scope.user_item.ID) error('scope.loadedUserItemID != scope.user_item.ID');

               // Get validation token to send to the task
               $http.post('/task/task.php', {
                 action: 'askValidation',
                 sToken: scope.user_item.sToken,
                 sAnswer: answer,
                 userItemId: scope.user_item.ID
                }, {
                  responseType: 'json'
                }).success(function(postRes) {
                  if (scope.loadedUserItemID != scope.user_item.ID) {
                     error('loadedUserItemID != user_item.ID');
                     return;
                  }
                  if ( ! postRes.result) {
                     error("got error from task.php: "+postRes.error);
                  } else if (validateUserItemID != scope.user_item.ID) {
                     error('got validate from another task');
                  } else if (scope.item.sValidationType != 'Manual') {
                     // Grade the task
                     scope.gradeTask(answer, postRes.sAnswerToken, validateUserItemID, function(validated) {
                        if (success) { success(); }
                        if (validated && mode == 'next') {
                           scope.moveToNext();
                        }
                     }, error);
                  }
               })
               .error(function() {
                  error("error calling task.php");
               });

               // Save state while evaluating
               scope.task.getState(function(state) {
                  if (scope.canGetState) {
                     scope.user_item.sState = state;
                     scope.user_item.sAnswer = answer;
                     ModelsManager.updated('users_items', scope.user_item.ID);
                  }
               });
            }, function() {
              ErrorLogger.logTaskError(scope.item.sUrl);
            });
         }
      };
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

      // move to next item in same chapter
      scope.moveToNextImmediate = function() {
         scope.goRightImmediateLink();
      };
      // move to next item
      scope.moveToNext = function() {
         scope.goRightLink();
      };

      scope.curAttemptId = scope.user_item.attempt ? scope.user_item.attempt.ID : null;
      scope.gradeTask = function (answer, answerToken, validateUserItemID, success, error) {
         scope.grader.gradeTask(answer, answerToken, function(score, message, scoreToken) {
            var postParams = {
              action: 'graderResult',
              scoreToken: scoreToken,
              score: score,
              message: message,
              sToken: scope.user_item.sToken
            };
            if (!scoreToken) {
               postParams.answerToken = answerToken;
            }
            $http.post('/task/task.php', postParams, {responseType: 'json'}).success(function(postRes) {
               if ( ! postRes.result) {
                  console.error("got error from task.php: "+postRes.error);
                  return;
               }
               if (scope.user_item.ID != validateUserItemID) {
                  error("grading old task");
                  return;
               }
               scope.user_item.nbTasksTried = scope.user_item.nbTasksTried+1;

               // We just unlocked some items
               if (!scope.user_item.bKeyObtained && postRes.bKeyObtained && scope.item.idItemUnlocked) {
                  scope.user_item.bKeyObtained = true;
                  if(!postRes.bValidated) {
                     ModelsManager.updated('users_items', scope.user_item.ID, false, true);
                  }
                  // An item has been unlocked, need to reset sync as for some
                  // reason it doesn't get the changes
                  SyncQueue.sentVersion = 0;
                  SyncQueue.serverVersion = 0;
                  SyncQueue.resetSync = true;
                  SyncQueue.planToSend(0);
                  alert("Félicitations ! Vous avez débloqué un ou plusieurs contenus.");
               }

               // We validated the task for the first time
               if (!scope.user_item.bValidated && postRes.bValidated) {
                  scope.user_item.sToken = postRes.sToken;
                  scope.user_item.bValidated = true;
                  scope.user_item.bKeyObtained = true;
                  scope.user_item.sValidationDate = new Date();
                  if (config.domains.current.useMap) {
                     mapService.updateSteps();
                  }
                  ModelsManager.updated('users_items', scope.user_item.ID, false, true);
                  scope.task.updateToken(postRes.sToken, function() {
                     scope.task.getViews(function(views) {
                        scope.showSolution();
                        scope.setTabs(views);
                     });
                  });
               }
               scope.user_item.iScore = Math.max(scope.user_item.iScore, score);
               $rootScope.$broadcast('algorea.itemTriggered', scope.item.ID);
               scope.$applyAsync();
               if (success) { success(postRes.bValidated); } else { return postRes.bValidated; };
            })
            .error(function() {
               error("error calling task.php");
            });
         });
      };

      var views = {'task': true, 'solution': true, 'editor': true, 'hints': true, 'grader': true, 'metadata':true};
      var currentId = scope.currentId;

      scope.loadOpacity = 0.6;
      scope.$apply();

      var loadMsgTimeout = $timeout(function () {
         scope.slowLoading = true;
      }, 5000);

      scope.task.load(views, function() {
         if(scope.currentId != currentId) { return; }
         scope.taskLoaded = true;
         $timeout.cancel(loadMsgTimeout);
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
               scope.taskIframe.css('height', '');
               elem.addClass('task-auto-height');
            } else {
               elem.removeClass('task-auto-height');
            }
            scope.modifyUrl = metaData.editorUrl ? $sce.trustAsResourceUrl(metaData.editorUrl) : null;
            tabsService.updateTabById('modify', {disabled: !scope.modifyUrl});
            $rootScope.$broadcast('layout.taskLayoutChange');
         });
         $timeout(function () {
            // Need to let the DOM refresh properly first
            scope.task.getViews(function(views) {
               scope.setTabs(views);
               scope.$apply();
            });
         }, 0);
      }, function() {
         if(scope.currentId != currentId) { return; }
         scope.loadingError = $i18next.t('task_load_error');
         scope.$apply();
      });
    }

    return {
      restrict: 'EA',
      scope: false,
      link: function(scope, elem, attrs){
         if (attrs.userItemVar) {
            scope.user_item = scope[attrs.userItemVar];
         }
         var name = 'task-'+scope.panel;
         if (scope.inForum) {
            name = 'task-'+Math.floor((Math.random() * 10000) + 1);// could be better...
         }
         if (!scope.taskName) {scope.taskName = name;}
         if (scope.item && (scope.item.sType == 'Task' || scope.item.sType == 'Course')) {
            if(scope.item.bHasAttempts && !scope.user_item.idAttemptActive) {
               // Create an attempt first
               scope.attemptAutoSelected = true;
               scope.autoSelectAttempt();
            } else {
               scope.startItem();
               initTask(scope, elem, false);
            }
         }
         // function comparing two url, returning true if the iframe won't be reloaded
         // (= if the difference is only after #)
         function isSameBaseUrl(oldItemUrl, newItemUrl) {
            if (!oldItemUrl || !newItemUrl) {return false;}
            var baseOldItemUrl = oldItemUrl.indexOf('#') == -1 ? oldItemUrl : oldItemUrl.substr(0, oldItemUrl.indexOf('#'));
            var baseNewItemUrl = newItemUrl.indexOf('#') == -1 ? newItemUrl : newItemUrl.substr(0, newItemUrl.indexOf('#'));
            return baseNewItemUrl == baseOldItemUrl;
         }
         function reinit(force) {
            // New task selected

            // Resynchronise changes to users_items
            SyncQueue.planToSend(0);

            if (!scope.item || (scope.item.sType !== 'Task' && scope.item.sType !== 'Course')) {
               return;
            }
            angular.forEach(scope.intervals, function(interval) {
               $interval.cancel(interval);
            });
            scope.intervals = {};

            var sameUrl = !force && isSameBaseUrl(scope.itemUrl, scope.item.sUrl);
            if (scope.task && !scope.task.unloaded) {
               scope.task.unload(function() {
                  scope.taskLoaded = false;
                  scope.canGetState = false;
                  scope.task.unloaded = true;
                  if (!sameUrl) {
                     TaskProxyManager.deleteTaskProxy(scope.taskName);
                     scope.taskUrl = '';
                     $timeout(function() {initTask(scope, elem, sameUrl);});
                  } else {
                     scope.task.updateToken(scope.user_item.sToken, function() {
                        initTask(scope, elem, sameUrl);
                     });
                  }
               }, function() {
                  // Failed
                  scope.taskLoaded = false;
                  scope.canGetState = false;
                  scope.task.unloaded = true;
                  TaskProxyManager.deleteTaskProxy(scope.taskName);
                  scope.taskUrl = '';
                  $timeout(function() {initTask(scope, elem);});
               });
            } else {
               scope.taskLoaded = false;
               scope.canGetState = false;
               scope.currentView = null;
               if (!sameUrl) {
                  TaskProxyManager.deleteTaskProxy(scope.taskName);
                  scope.taskUrl = '';
               }
               $timeout(function() {initTask(scope, elem, sameUrl);});
            }
         }
         scope.$on('algorea.attemptChanged', function(event) {
            // Reload item after we select a new attempt
            if (scope.user_item.attempt && scope.user_item.attempt.ID != scope.curAttemptId) {
               scope.itemUrl = null; // Avoid considering it's the same URL as we're changing parameters
               reinit();
            }
         });
         scope.$on('admin.itemSelected', function() {
            reinit();
         });
         scope.$on('admin.groupSelected', function() {
            reinit();
         });
         scope.$on('algorea.reloadView', function(event, viewName, force) {
            if (viewName == scope.panel) {
               reinit(force);
            }
         });
         scope.$on('algorea.reloadTabs', function() {
            if(scope.lastTaskViews) {
               scope.setTabs(scope.lastTaskViews);
            }
         });
         scope.$on('algorea.languageChanged', function(event) {
            reinit(true);
         });
      },
    };
}]);


angular.module('algorea').factory('$exceptionHandler', ['$log', function($log) {
  return function (exception, cause) {
    $log.error(exception, cause);
    ErrorLogger.log(exception.message, exception.fileName, exception.lineNumber, exception.columnNumber, exception);
  }
}]);
