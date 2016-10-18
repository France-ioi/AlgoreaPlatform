angular.module('algorea')
  .directive('contestTimer', ['contestTimerService', function (contestTimerService) {
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
      			alert('Le concours est terminé !');
            SyncQueue.planToSend(0);
            // brutal way of ensuring that items are not accessible afterwards
            location.reload();
      		});
      	};
      	contestTimerService.connect(updateCallback, contestOverCallback);
      }
    };
}]);