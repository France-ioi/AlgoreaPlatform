angular.module('algorea')
  .directive('contestTimer', ['contestTimerService', 'pathService', '$state', function (contestTimerService, pathService, $state) {
  	'use strict';
    return {
      restrict: 'EA',
      scope: true,
      template: '<span class="contestTimer">{{timerStr}}</span>',
      link: function(scope, elem, attrs){
      	scope.timerStr = '';
      	var updateCallback = function(minutesOrType, seconds) {
      		var newTimerStr = '';
      		if (minutesOrType == 'sync') {
      			newTimerStr = 'synchronisation...';
      		} else {
      			if (minutesOrType == '0' && seconds == '00') {
      				newTimerStr = '';
      			} else {
      				newTimerStr = minutesOrType+':'+seconds;
      			}
      		}
      		scope.$applyAsync(function() {scope.timerStr = newTimerStr;});
      	};
      	var contestOverCallback = function() {
      		scope.$applyAsync(function() {
      			scope.timerStr = '';
      			alert(i18next.t('contest_ended'));
            SyncQueue.planToSend(0);

						var pathParams = pathService.getPathParams();
						var sell = Math.min(pathParams.path.length - 1, pathParams.sell);
						var path = pathParams.path.slice(0, sell).join('/');
						$state.go('contents', {path: path, sell: sell, selr: null});
      		});
      	};
      	contestTimerService.connect(updateCallback, contestOverCallback);
      }
    };
}]);
