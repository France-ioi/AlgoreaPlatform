'use strict';

angular.module('algorea')
   .service('itemService', ['$rootScope', '$timeout', '$stateParams', function($rootScope, $timeout, $stateParams) {
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
      function setSyncInterval() {
         if (!intervalIsSet) {
            intervalIsSet = true;
            setInterval(SyncQueue.planToSend, 15000);
         }
      }
      SyncQueue.planToSend();
      setSyncInterval();
      function syncStartListener(data) {
         if (!lastSyncLogin && data && data.changes && data.changes.loginData && data.changes.loginData.sLogin) {
            // case of the first sync, before any login is done, this relies on the local session
            lastSyncLogin = data.changes.loginData.sLogin;
            newLogin = lastSyncLogin;
            console.error('newLogin: '+newLogin);
            SyncQueue.requests.loginData = data.changes.loginData;
         } else {
            if (!lastSyncLogin) {
               firstSyncFailed = true;
               SyncQueue.sentVersion = 0;
               SyncQueue.resetSync = true;
            }
         }
      };
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
               SyncQueue.requests = {algorea: {type: 'getItemsFromAncestors', ancestors: getIdsToSync(true)}};
               SyncQueue.planToSend(0);
               firstSyncDone = 1;
               if (userCallback) {
                  var user = getUser();
                  userCallback(user);
               }
            } else if (!syncDone) {
               // calling callbacks after first full sync
               SyncQueue.requests = {algorea: {type: 'getItemsFromAncestors', ancestors: getIdsToSync(false)}};
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
            SyncQueue.requests = {algorea: {type: 'getAllLevels'}};
            SyncQueue.sentVersion = 0;
            SyncQueue.resetSync = true;
            syncDone = 0;
            firstSyncDone = 0;
            lastSyncLogin = newLogin;
            $rootScope.$broadcast('syncResetted');
            SyncQueue.planToSend();
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
            SyncQueue.planToSend();
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
         console.error(SyncQueue.requests);
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
//         var pathItems = $stateParams.path ? $stateParams.path.split('/') : ['6'];
//         if (/*pathItems[0] == '6'*/ false) {
//            var rootItem = ModelsManager.getRecords('items')[6];
//            pathItems = [];
//            if ( rootItem && rootItem.children) {
//               angular.forEach(rootItem.children, function(child) {
//                  if (child.child.iLevel != 0 && child.child.iLevel != 127 && pathItems.indexOf(parseInt(child.idItemChild)) == -1) {
//                     pathItems.push(parseInt(child.idItemChild));
//                  }
//               });
//            }
//         } else {
//            pathItems = [pathItems[0]];
//         }
         var pathItems = [config.ProgressRootItemId, config.DiscoverRootItemId, config.ContestRootItemId];
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
            }
         },
         saveRecord: function(model, ID) {
            ModelsManager.updated(model, ID, false);
         },
         // XXX: change this for language filtering
         getStrings: function(item) {
            return item.strings[0];
         },
         getUserItem: function(item) {
            var result_user_item = null;
            angular.forEach(item.user_item, function(user_item) {
               result_user_item = user_item;
               return;
            });
            return result_user_item;
         },
         getCurrentAnswer: function(item) {
            var result_user_answer = null;
            angular.forEach(item.user_answers, function(user_answer) {
               if (!result_user_answer || result_user_answer.sSubmissionDate < user_answer.sSubmissionDate) {
                  result_user_answer = user_answer;
               }
            });
            return result_user_answer;
         },
         getBrothersFromParent: function(parentID) {
            return this.getChildren(this.getItem(parentID));
         },
         getChildren: function(item) {
            var children = [];
            if (!item || !item.children) {
               return children;
            }
//            console.error('getting children of '+item.ID);
            // a few convoluted checks for duplicated child items and child order
            var childrenz = [];
            var seenIDs = [];
            angular.forEach(item.children, function(child) {
//               if (item.sType == 'Root') {
//                  if (child.child.iLevel != 0 && child.child.iLevel != 127 && !(child.idItemChild in seenIDs)) {
//                     childrenz.push(child);
//                     seenIDs.push(child.idItemChild);
//                  }
//               } else
               if (!(child.idItemChild in seenIDs) ){
                  var lang = child.child.sSupportedLangProg;
                  if (typeof lang !== 'undefined' && (lang == null || lang == '' || lang == '*' || lang.indexOf('Python') != -1)) {
                     childrenz.push(child);
                  }
                  seenIDs.push(child.idItemChild);
               }
            });
            childrenz = childrenz.sort(function(a,b) {
               return a.iChildOrder - b.iChildOrder;
            });
            angular.forEach(childrenz, function (child) {
               children.push(child.child);
            });
//            console.error(children);
            return children;
         },
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
               user_item.sLastActivityDate = new Date();
               ModelsManager.updated('users_items', user_item.ID, false, true);
            }
         },
         getItemTypeStr: function(item) {
            if (!item || item.sType == 'Root') return '';
            var type = item.sType;
            if (type == 'GenericChapter' || type == 'StaticChapter'  || type == 'ContestChapter'  || type == 'LimitedTimeChapter') {
               type = 'Chapter';
            }
            var typeStr;
            if (type == 'Level') {
               typeStr = 'Niveau' + (item.iLevel ? ' '+item.iLevel : '');
            } else if(type == 'Chapter') {
               typeStr = 'Chapitre';
            } else if (type == 'Category') {
               typeStr = 'Catégorie';
            } else if (type == 'Section') {
               typeStr = 'Section';
            } else if (type == 'Task') {
               typeStr = 'Exercice';
            } else if (type == 'Course') {
               typeStr = 'Cours';
            }
            return typeStr;
         }
      };
   }]);
