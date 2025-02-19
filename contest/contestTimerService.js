angular.module('algorea')
	.service('contestTimerService', ['$http', function ($http) {
		'use strict';
		var TimeManager = {
			endTime: null, // timestamp of the contest end time
			prevTime: null, // previous time we updated the timer
			interval: null,
			synchronizing: false,
			unsynced: false,
			updateTimeCallback: function () { },
			endTimeCallback: function () { },
			idItem: null, // currently unused

			pad2: function (number) {
				if (number < 10) {
					return "0" + number;
				}
				return number;
			},

			init: function (timeRemaining, idItem) {
				if (timeRemaining <= 0) {
					TimeManager.timerEnded();
					return;
				}

				TimeManager.synchronizing = false;
				TimeManager.unsynced = false;
				TimeManager.prevTime = null;

				TimeManager.idItem = idItem;
				TimeManager.setRemainingTime(timeRemaining);
				TimeManager.interval = setInterval(TimeManager.updateTime, 1000);
				TimeManager.updateTime();
			},

			setRemainingTime: function (timeRemaining) {
				var curDate = new Date();
				TimeManager.endTime = curDate.getTime() / 1000 + timeRemaining;
			},

			getRemainingTime: function () {
				var curDate = new Date();
				var remainingTime = TimeManager.endTime - curDate.getTime() / 1000;
				if (remainingTime < 0) {
					remainingTime = 0;
				}
				return remainingTime;
			},

			syncWithServer: function () {
				TimeManager.synchronizing = true;
				$http.post('contest/api.php', { action: 'getRemainingTime', idItem: TimeManager.idItem }).success(function (data) {
					if (data.success) {
						TimeManager.processData(data);
						TimeManager.synchronizing = false;
					}
				}).error(function () {
					setTimeout(TimeManager.syncWithServer, 20000);
				});
			},

			updateTime: function () {
				if (!TimeManager.endTime) {
					return;
				}

				var curDate = new Date();
				var curTime = curDate.getTime() / 1000;

				if (TimeManager.prevTime) {
					var timeDiff = Math.abs(curTime - TimeManager.prevTime);
					// We traveled through time, more than 60s difference compared to 1 second ago !
					if (timeDiff > 60) {
						TimeManager.syncWithServer();
					}
				}

				TimeManager.prevTime = curTime;
				var remainingTime = TimeManager.getRemainingTime();
				var minutes = Math.floor(remainingTime / 60);
				var seconds = Math.floor(remainingTime - 60 * minutes);

				TimeManager.updateTimeCallback(minutes, TimeManager.pad2(seconds), TimeManager.synchronizing);
				if (remainingTime <= 0) {
					TimeManager.timerEnded();
				}
			},
			processData: function (contestData) {
				if (contestData && contestData.endTime) {
					if (TimeManager.endTime) {
						TimeManager.setRemainingTime(contestData.endTime - contestData.now);
					} else {
						TimeManager.init(contestData.endTime - contestData.now, contestData.idItem);
					}
				} else {
					// All contests are over
					TimeManager.timerEnded();
				}
			},
			timerEnded: function () {
				if (TimeManager.endTime && TimeManager.endTimeCallback) {
					TimeManager.endTimeCallback();
				}
				if (TimeManager.interval) {
					clearInterval(TimeManager.interval);
					TimeManager.interval = null;
				}
				TimeManager.endTime = null;
			}
		};

		SyncQueue.addSyncStartListeners('contestTimerService', function (data) {
			var contestData = data.changes.contestData;
			TimeManager.processData(contestData);
		});

		return {
			connect: function (updateTimeCallback, endTimeCallback) {
				TimeManager.updateTimeCallback = updateTimeCallback;
				TimeManager.endTimeCallback = endTimeCallback;
			},
			startContest: function (idItem, duration) {
				TimeManager.init(duration, idItem);
			}
		};

	}]);
