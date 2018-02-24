'use strict';

angular.module('algorea')
   .service('itemService', ['$rootScope', '$timeout', '$interval', '$http', 'loginService', '$i18next', function($rootScope, $timeout, $interval, $http, loginService, $i18next) {
    /*
     * Simple service providing items.
     */
      ModelsManager.init(models);
      SyncQueue.init(ModelsManager);
      SyncQueue.requests = {algorea: {type: 'getAllLevels'}, loginData: {}};
      var callbacks = {};
      var userCallback = null;
      var syncDone = 0;
      var firstSyncDone = 0;
      var lastSyncLogin = null;
      var newLogin = null;
      var intervalIsSet = false;
      var firstSyncFailed = false; // case of first sync without session, before login
      var usersAnswers = {}; // Stores users_answers per item

      function setSyncInterval() {
         if (!intervalIsSet) {
            intervalIsSet = true;
            setInterval(SyncQueue.planToSend, 300000);
         }
      }
      SyncQueue.planToSend(0);
      setSyncInterval();
      function syncStartListener(data) {
         if (!lastSyncLogin && data && data.changes && data.changes.loginData && data.changes.loginData.sLogin) {
            // case of the first sync, before any login is done, this relies on the local session
            lastSyncLogin = data.changes.loginData.sLogin;
            newLogin = lastSyncLogin;
            SyncQueue.requests.loginData = data.changes.loginData;
            loginService.setLocalLoginData(data.changes.loginData);
         } else {
            if (!lastSyncLogin) {
               firstSyncFailed = true;
               SyncQueue.sentVersion = 0;
               SyncQueue.resetSync = true;
               loginService.setLocalLoginData();
            }
         }
      }
//      $rootScope.$on('$stateChangeSuccess', function() {
//         var oldIds = idsToSync;
//         var newIds =
//      });
      function syncEndListener () {
         if (firstSyncFailed) { return; }
         if (lastSyncLogin == newLogin || !lastSyncLogin) {
            lastSyncLogin = newLogin;
            if (!firstSyncDone) {
               // we don't want just new descendants, but all descendants:
               SyncQueue.sentVersion = 0;
               SyncQueue.resetSync = true;
               // refreshing ids to sync (containing version number)
               SyncQueue.requests.algorea = {type: 'getItemsFromAncestors', ancestors: getIdsToSync(true)};
               SyncQueue.planToSend(0);
               firstSyncDone = 1;
               if (userCallback) {
                  var user = getUser();
                  userCallback(user);
               }
            } else if (!syncDone) {
               // calling callbacks after first full sync
               SyncQueue.requests.algorea = {type: 'getItemsFromAncestors', ancestors: getIdsToSync(false)};
               $rootScope.$broadcast('syncFinished');
               angular.forEach(callbacks, function(callbackIDlist, model) {
                  angular.forEach(callbackIDlist, function(callbacklist, ID) {
                     var record = (model == 'general') ? null : ModelsManager.curData[model][ID];
                     for (var i=0; i< callbacklist.length; i++) {
                        callbacklist[i](record);
                     }
                  });
               });
               syncDone = 1;
            }
            $rootScope.$apply();
            $timeout(function() {$timeout($rootScope.refreshSizes);}, 300); // see layout.js. 300 is a more or less random value...
         } else {
            lastSyncLogin = newLogin;
            ModelsManager.init(models);
            SyncQueue.init(ModelsManager);
            SyncQueue.requests.algorea = {type: 'getAllLevels'};
            SyncQueue.sentVersion = 0;
            SyncQueue.resetSync = true;
            syncDone = 0;
            firstSyncDone = 0;
            lastSyncLogin = newLogin;
            $rootScope.$broadcast('syncResetted');
            SyncQueue.planToSend(100);
         }
      }
      $rootScope.$on('login.logout', function() {
         delete SyncQueue.requests.loginData;
      });
      function syncWithNewLogin(login, loginData) {
         SyncQueue.requests.loginData = loginData;
         newLogin = login;
         firstSyncFailed = false;
         if (newLogin !== lastSyncLogin) {
            SyncQueue.planToSend(50);
         }
         // TODO: build SyncQueue.cancelCurrentSync() with a StartSyncListener
      }
      function getUserID() {

         return SyncQueue.requests.loginData.ID;
      }
      function getLoginData() {
         return SyncQueue.requests.loginData;
      }
      function getUser() {
         var res = false;
         var userID = SyncQueue.requests.loginData.ID;
         angular.forEach(ModelsManager.curData.users, function(user, ID) {
            if (ID == userID) {
               res = user;
            }
         });
         return res;
      }
      var idsToSync = {};
      function getIdsToSync(reset) {
         var pathItems = [config.domains.current.ProgressRootItemId, config.domains.current.DiscoverRootItemId, config.domains.current.ContestRootItemId];
         angular.forEach(config.domains.current.tabs, function(tab) {
            var itemID = tab.path.split('/')[0];
            if (parseInt(itemID) && pathItems.indexOf(itemID) == -1) {
               pathItems.push(itemID);
            }
         });
         angular.forEach(pathItems, function(itemID) {
            idsToSync[itemID] = {'itemID': itemID, 'minVersion': (itemID in idsToSync) ? SyncQueue.serverVersion : 0};
         });
         if (reset) {
            idsToSync.resetMinVersion = true;
         }
         return idsToSync;
      }
      SyncQueue.addSyncEndListeners("ItemsService", syncEndListener);
      SyncQueue.addSyncStartListeners("ItemsService", syncStartListener);
      // SyncThread intervals
      var syncThreadIntervals = {}; 
      function stopThreadInterval(idThread, idItem, idUser) {
         // Stop a syncThread interval and return the name
         if (idThread) {
            var name = 'thread-'+idThread;
         } else {
            var name = 'usersAnswers-'+idItem+'-'+idUser;
         }
         if(syncThreadIntervals[name]) {
            $interval.cancel(syncThreadIntervals[name]);
            syncThreadIntervals[name] = null;
         }
         return name;
      }
      return {
         getItem: function(ID) {
            return ModelsManager.getRecord('items', ID);
         },
         getAsyncUser: function(callback) {
            if (syncDone) {
               callback(getUser());
            }
            userCallback = callback;
         },
         saveUser: function() {
            var user_id = getUserID();
            ModelsManager.updated('users', user_id, false);
         },
         syncWithNewLogin: syncWithNewLogin,
         getRecord: function (model, ID) {
            return ModelsManager.getRecord(model, ID);
         },
         getAsyncRecord: function (model, ID, callback) {
            if (syncDone) {
               callback(ModelsManager.getRecord(model, ID));
            } else {
               if (! callbacks[model]) {
                  callbacks[model] = {};
               }
               if (callbacks[model][ID]) {
                  callbacks[model][ID].push(callback);
               } else {
                 callbacks[model][ID] = [callback];
               }
            }
         },
         onNewLoad: function (callback) {
            if (syncDone) {
               callback();
            } else {
               if (! callbacks.general) {
                  callbacks.general = {0: []};
               }
               callbacks.general[0].push(callback);
               // TODO: remove callback once called
            }
         },
         saveRecord: function(model, ID) {
            ModelsManager.updated(model, ID, false);
         },
         getStrings: function(item) {
            if (!item || !item.strings) {
               return null;
            }
            var strings = item.strings[0];
            for(var i=0; i<item.strings.length; i++) {
               // User-chosen language
               if(item.strings[i].language.sCode == $rootScope.sLocale) {
                  strings = item.strings[i];
                  break;
               }
               // Default language for this item
               if(item.defaultLanguage && item.strings[i].language.sCode == item.defaultLanguage.sCode) {
                  strings = item.strings[i];
               }
            }
            return strings;
         },
         getUserItem: function(item, idUser) {
            if (!item) return null;
            var result_user_item = null;
            if (!idUser) {
               if (!SyncQueue.requests.loginData) {
                  return null;
               }
               idUser = SyncQueue.requests.loginData.ID;
            }
            angular.forEach(item.user_item, function(user_item) {
               if (user_item.idUser == idUser) {
                  result_user_item = user_item;
                  return;
               }
            });
            return result_user_item;
         },
         getCurrentAnswer: function(item, idUser) {
            var result_user_answer = null;
            if (!idUser) {
               idUser = $rootScope.myUserID;
            }
            if(!usersAnswers[item.ID]) { return; }
            angular.forEach(usersAnswers[item.ID], function(user_answer) {
               if ((!result_user_answer || result_user_answer.sSubmissionDate < user_answer.sSubmissionDate) && user_answer.idUser == idUser) {
                  result_user_answer = user_answer;
               }
            });
            return result_user_answer;
         },
         getAnswers: function(item, idUser) {
            var result = [];
            if (!idUser) {
               idUser = $rootScope.myUserID;
            }
            angular.forEach(usersAnswers[item.ID], function(user_answer) {
               if (user_answer.idUser == idUser) {
                  result.push(user_answer);
               }
            });
            return result;
         },
         getBrothersFromParent: function(parentID) {
            return this.getChildren(this.getItem(parentID));
         },


         getChildren: function(item, idUser) {
            var children = [];
            if (!item || !item.children) {
               return children;
            }
            // a few convoluted checks for duplicated child items and child order
            var childrenz = [];
            var seenIDs = [];

            angular.forEach(item.children, function(child) {
               if(seenIDs.indexOf(child.child.ID) === -1) {
                  var lang = child.child.sSupportedLangProg;
                  if(typeof lang !== 'undefined') { // TODO :: why? (eliminates base platform items)
                     childrenz.push(child);
                  }
                  seenIDs.push(child.child.ID);
               }
            });

            // Randomize order of children when they have the same iChildOrder
            var randomize = item.bFixedRanks;
            if(randomize && !idUser) {
               if(SyncQueue.requests.loginData) {
                  idUser = SyncQueue.requests.loginData.ID;
               } else {
                  console.error('Tried to randomize items without idUser.');
                  randomize = false;
               }
            }

            childrenz = childrenz.sort(function(a, b) {
               if(randomize && a.iChildOrder == b.iChildOrder) {
                  // If randomized, compare using the MD5 of
                  // idUser - idItemParent - idItemChild
                  var md5a = md5(idUser + '-' + item.ID + '-' + a.ID);
                  var md5b = md5(idUser + '-' + item.ID + '-' + b.ID);
                  return md5a.localeCompare(md5b);
               }
               return a.iChildOrder - b.iChildOrder;
            });

            angular.forEach(childrenz, function (child) {
               children.push(child.child);
               children[children.length-1].item_item_ID = child.ID;
            });
            return children;
         },


         getIdsToSync: getIdsToSync,


         getItemIdByTextId: function(sTextId) {
            return ModelsManager.indexes.sTextId[sTextId];
         },


         isSonOf: function(sonItemId, parentItemId) {
            var parentItem = ModelsManager.getRecord('items', parentItemId);
            if (!parentItem) { return false; }
            var result = false;
            angular.forEach(parentItem.children, function(child) {
               if (child.child.ID == sonItemId) {
                  result = true;
                  return;
               }
            });
            return result;
         },
         onSeen: function(item) {
            var user_item = this.getUserItem(item);
            if (user_item) {
               if (!user_item.sLastActivityDate || user_item.sLastActivityDate.getYear() < 100) {
                  user_item.sLastActivityDate = new Date();
               }
               if (!user_item.sStartDate || user_item.sStartDate.getYear() < 100) {
                  user_item.sStartDate = user_item.sLastActivityDate;
               }
               ModelsManager.updated('users_items', user_item.ID, false, true);
               $rootScope.$broadcast('algorea.itemTriggered', item.ID);
            }
         },
         getItemTypeStr: function(item) {
            if (!item) return '';
            if (item.sType == 'Root') return '';
            var typeStr;
            if(item.sType == 'Chapter') {
               typeStr = $i18next.t('navigation_chapter');
            } else if (item.sType == 'Task') {
               typeStr = $i18next.t('navigation_task');
            } else if (item.sType == 'Course') {
               typeStr = $i18next.t('navigation_course');
            }
            return typeStr;
         },
         syncThread: function(idThread, idItem, idUser, callback) {
            // Start synchronizing some users_answers
            // We stop the current syncThread to restart it directly
            var intervalName = stopThreadInterval(idThread, idItem, idUser);
            var syncFunc = function() {
               $http.post('/task/task.php', {action: 'getUsersAnswers', idThread: idThread, idItem: idItem, idUser: idUser}).success(function(res) {
                  if(res.result) {
                     // Add new usersAnswers
                     angular.forEach(res.usersAnswers, function(user_answer) {
                        if(!usersAnswers[user_answer.idItem]) {
                           usersAnswers[user_answer.idItem] = {};
                        }
                        usersAnswers[user_answer.idItem][user_answer.ID] = user_answer;
                     });
                  }
                  if(callback) {
                     callback();
                     callback = null;
                  }
               });
            };
            syncFunc(callback);
            syncThreadIntervals[intervalName] = $interval(syncFunc, 300000);

            if (idThread) {
               // Use getThread to fetch other data such as messages
               SyncQueue.requestSets[intervalName] = {minVersion: 0, name: 'getThread', idThread: idThread};
               SyncQueue.addSyncEndListeners(intervalName, function() {
                  SyncQueue.removeSyncEndListeners(intervalName);
                  delete(SyncQueue.requestSets[intervalName].minVersion);
                  callback();
               }, false, true);
               SyncQueue.planToSend(0);
            }

         },
         unsyncThread:function(idThread, idItem, idUser) {
            var intervalName = stopThreadInterval(idThread, idItem, idUser);
            delete(SyncQueue.requestSets[intervalName]);
         }
      };
   }]);
