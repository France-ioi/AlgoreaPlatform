angular.module('algorea')
   .service('contestTimerService', ['$http', function($http) {
   	'use strict';
   	// copying code from bebras platform, to be shared in a cleaner way
	var TimeManager = {
	   endTime: null,  // is set once the contest is closed, to the closing time
	   timeUsedBefore: null, // time used before the contest is loaded (in case of an interruption)
	   timeStart: null, // when the contest was loaded (potentially after an interruption)
	   totalTime: null, // time allocated to this contest
	   interval: null,
	   prevTime: null,
	   synchronizing: false,
	   updateTimeCallback: function(){},
	   endTimeCallback: function() {},
	   idItem: null,
	   pad2: function(number) {
	      if (number < 10) {
	         return "0" + number;
	      }
	      return number;
	   },

	   setTotalTime: function(totalTime) {
	      this.totalTime = totalTime;
	   },

	   init: function(timeUsed, endTime, idItem) {
	   	this.idItem = idItem;
	      this.timeUsedBefore = parseInt(timeUsed);
	      this.endTime = endTime;
	      var curDate = new Date();
	      this.timeStart = curDate.getTime() / 1000;
	      if (this.totalTime > 0) {
	         this.prevTime = this.timeStart;
	         this.updateTime();
	         TimeManager.interval = setInterval(this.updateTime, 1000);
	         console.error(TimeManager.interval);
	      } else {
	      	console.error('total time = '+this.totalTime);
	      }
	   },

	   getRemainingTime: function() {
	      var curDate = new Date();
	      var curTime = curDate.getTime() / 1000;
	      var usedTime = (curTime - this.timeStart) + this.timeUsedBefore;
	      var remainingTime = this.totalTime - usedTime;
	      if (remainingTime < 0) {
	         remainingTime = 0;
	      }
	      return remainingTime;
	   },

	   // fallback when sync with server fails:
	   simpleTimeAdjustment: function() {
	      var curDate = new Date();
	      var timeDiff = curDate.getTime() / 1000 - TimeManager.prevTime;
	      TimeManager.timeStart += timeDiff - 1;
	      setTimeout(function() {
	         TimeManager.syncWithServer();
	      }, 120000);
	   },

	   syncWithServer: function() {
	      TimeManager.synchronizing = true;
	      TimeManager.updateTimeCallback('sync');
	      var self = this;
	      $.post('contest/api.php', {action: 'getRemainingTime', idItem: TimeManager.idItem},
	         function(data) {
	            if (data.success) {
	               var remainingTime = self.getRemainingTime();
	               TimeManager.timeStart = TimeManager.timeStart + data.remainingTime - remainingTime;
	            } else {
	               TimeManager.simpleTimeAdjustment();
	            }
	         },
	      'json').done(function() {
	         var curDate = new Date();
	         TimeManager.prevTime = curDate.getTime() / 1000;
	         TimeManager.synchronizing = false;
	      }).fail(function() {
	         TimeManager.simpleTimeAdjustment();
	         TimeManager.synchronizing = false;
	      });
	   },

	   updateTime: function() {
	      if (TimeManager.endTime || TimeManager.synchronizing) {
	      	console.error('no end time or synchronizing');
	         return;
	      }
	      var curDate = new Date();
	      var curTime = curDate.getTime() / 1000;
	      var timeDiff = Math.abs(curTime - TimeManager.prevTime);
	      // We traveled through time, more than 60s difference compared to 1 second ago !
	      if (timeDiff > 60 || timeDiff < -60) {
	         TimeManager.syncWithServer();
	         return;
	      }
	      TimeManager.prevTime = curTime;
	      var remainingTime = TimeManager.getRemainingTime();
	      var minutes = Math.floor(remainingTime / 60);
	      var seconds = Math.floor(remainingTime - 60 * minutes);
	      TimeManager.updateTimeCallback(minutes, TimeManager.pad2(seconds));
	      if (remainingTime <= 0) {
	         clearInterval(TimeManager.interval);
	         TimeManager.endTimeCallback();
	      }
	   },

	   setEndTime: function(endTime) {
	      this.endTime = endTime;
	   },

	   stopNow: function() {
	      var curDate = new Date();
	      this.endTime = curDate.getTime() / 1000;
	   },

	   isContestOver: function() {
	      return this.endTime;
	   }
	};

	var previousData = null;
	SyncQueue.addSyncStartListeners('contestTimerService', function(data) {
		var contestData = data.changes.contestData;
		if (contestData) {
			TimeManager.setTotalTime(contestData.duration);
			var usedTime = contestData.now - contestData.startTime;
			if (!TimeManager.timeStart) {
				TimeManager.init(usedTime, null, contestData.idItem);
			}
		} else {
			if (TimeManager.timeStart) {
				TimeManager.endTimeCallback();
				TimeManager.timeStart = null;
				console.error('contest over!');
			}
		}
		previousData = contestData;
	});

	return {
		connect: function(updateTimeCallback, endTimeCallback) {
			TimeManager.updateTimeCallback = updateTimeCallback;
			TimeManager.endTimeCallback = endTimeCallback;
		},
		startContest: function(idItem, duration) {
			TimeManager.setTotalTime(duration);
			TimeManager.init(0, null, idItem);
		}
	};

}]);