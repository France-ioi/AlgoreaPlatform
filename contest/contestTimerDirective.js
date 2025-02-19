angular.module('algorea')
  .directive('contestTimer', ['contestTimerService', 'pathService', '$state', function (contestTimerService, pathService, $state) {
  	'use strict';
    return {
      restrict: 'EA',
      scope: true,
      template: '<span class="contestTimer">{{timerStr}}</span>',
      link: function(scope, elem, attrs){
      	scope.timerStr = '';
        var updateCallback = function (minutes, seconds, synchronizing) {
      		var newTimerStr = '';
          if (minutes == '0' && seconds == '00') {
            newTimerStr = '';
          } else {
            newTimerStr = minutes + ':' + seconds;
          }
          if (synchronizing) {
            newTimerStr = '~' + newTimerStr;
          }
      		scope.$applyAsync(function() {scope.timerStr = newTimerStr;});
      	};
      	var contestOverCallback = function() {
            scope.$applyAsync(function() {
               scope.timerStr = '';
               alert(i18next.t('contest_ended'));
               // for some reason, sync doesn't work in this case
               SyncQueue.sentVersion = 0;
               SyncQueue.serverVersion = 0;
               SyncQueue.resetSync = true;
               SyncQueue.planToSend(0);
               // TODO :: better way of finding item to redirect to
               var pathParams = pathService.getPathParams();
               var path = pathParams.path.slice(0, pathParams.path.length - 1).join('-');
               $state.go('contents', {path: path});
      		});
      	};
      	contestTimerService.connect(updateCallback, contestOverCallback);
      }
    };
}]);
