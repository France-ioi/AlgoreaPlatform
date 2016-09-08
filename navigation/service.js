angular.module('algorea')
   .service('itemService', ['$rootScope', '$timeout', 'loginService', '$stateParams', function($rootScope, $timeout, loginService, $stateParams) {
      'use strict';
    /*
     * Simple service providing items.
     */
      ModelsManager.init(models);
      SyncQueue.init(ModelsManager);
      SyncQueue.requestSets.getLevels = {minVersion: 0, name: 'getLevels'};
      SyncQueue.planToSend(0);
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
            setInterval(SyncQueue.planToSend, 30000);
         }
      }
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

      function createWindow() {
         var windowObj = ModelsManager.createRecord('windows');
         windowObj.idUser = SyncQueue.requests.loginData.ID;
         windowObj.dateLastActivity = new Date();
         ModelsManager.insertRecord('windows', windowObj, true);
         return windowObj;
      }

      var currentWindowObj = null;
      function updateWindow(argObj) {
         if (!currentWindowObj || currentWindowObj.idUser !== SyncQueue.requests.loginData.ID) {
            currentWindowObj = createWindow();
         }
         currentWindowObj.dateLastActivity = new Date();
         angular.forEach(currentWindowObj, function(val, name) {
            if (name == 'ID' || name == 'dateLastActivity') {
               return;
            }
            if (argObj[name]) {
               currentWindowObj[name] = argObj[name];
            }
         });
         ModelsManager.updated('windows', currentWindowObj.ID, false, true);
      }

      function syncDescendants(idItem, callback, simple) {
         if (!idItem) {
            console.error('syncDescendants called with empty idItem!');
            callback();
            return;
         }
         if (!SyncQueue.requestSets.itemsDescendants) {
            SyncQueue.requestSets.itemsDescendants = {minVersion: 0, name: 'itemsDescendants'};
         }
         var set = SyncQueue.requestSets.itemsDescendants;
         if (idItem == set.idItem) {
            callback();
            return;
         }
         set.justNames = simple ? 1 : 0;
         set.idItem = idItem;
         set.minVersion = 0;
         var endListenerName = 'itemsDescendants'+idItem;
         SyncQueue.addSyncEndListeners(endListenerName, function() {
            SyncQueue.removeSyncEndListeners(endListenerName);
            delete(SyncQueue.requestSets['itemsDescendants'].minVersion);
            callback();
         }, true);
         SyncQueue.planToSend(0);
      }

      function syncEndListener () {
         if (firstSyncFailed) { return; }
         if (lastSyncLogin == newLogin || !lastSyncLogin) {
            lastSyncLogin = newLogin;
            delete(SyncQueue.requestSets.getLevels.minVersion);
            if (!firstSyncDone) {
               if (userCallback) {
                  var user = getUser();
                  userCallback(user);
               }
               firstSyncDone = 1;
               var idToSync = getLevelToSync();
               if (idToSync) {
                  updateWindow({idMainItem: idToSync});
                  syncDescendants(idToSync, function() {
                     $rootScope.$broadcast('syncFinished');
                     syncDone = 1;
                     angular.forEach(callbacks, function(callbackIDlist, model) {
                        angular.forEach(callbackIDlist, function(callbacklist, ID) {
                           var record = (model == 'general') ? null : ModelsManager.curData[model][ID];
                           for (var i=0; i< callbacklist.length; i++) {
                              callbacklist[i](record);
                           }
                        });
                     });
                     $rootScope.$apply();
                     $timeout(function() {$timeout($rootScope.refreshSizes);}, 300); // see layout.js. 300 is a more or less random value...
                  });
               } else {
                  syncDone = 1;
                  $rootScope.$broadcast('syncFinished');
                  angular.forEach(callbacks, function(callbackIDlist, model) {
                     angular.forEach(callbackIDlist, function(callbacklist, ID) {
                        var record = (model == 'general') ? null : ModelsManager.curData[model][ID];
                        for (var i=0; i< callbacklist.length; i++) {
                           callbacklist[i](record);
                        }
                     });
                  });
                  $rootScope.$apply();
                  $timeout(function() {$timeout($rootScope.refreshSizes);}, 300); // see layout.js. 300 is a more or less random value...
               }
            }
         } else {
            lastSyncLogin = newLogin;
            ModelsManager.init(models);
            SyncQueue.init(ModelsManager);
            //SyncQueue.requestSets.getLevels = {minVersion: 0, name: 'getLevels'};
            SyncQueue.sentVersion = 0;
            SyncQueue.resetSync = true;
            angular.forEach(SyncQueue.requestSets, function(requestSet) {
               requestSet.minVersion = 0;
            });
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
         $rootScope.$broadcast('syncResetted.begin');
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
      var domainData = config.domains.current;
      var roots = {};
      roots[domainData.PlatformItemId] = true;
      roots[domainData.CustomProgressItemId] = true;
      roots[domainData.OfficialProgressItemId] = true;
      roots[domainData.DiscoverRootItemId] = true;
      roots[domainData.ContestRootItemId] = true;
      roots[domainData.CustomContestRootItemId] = true;
      roots[domainData.ProgressRootItemId] = true;
      roots[domainData.OfficialContestRootItemId] = true;
      function getLevelToSync() {
         var path = $stateParams.path;
         if (!path) {
            return null;
         }
         var splitPath = path.split('/');
         var res = null;
         angular.forEach(splitPath, function(ID) {
            if (!roots[ID] && !res) {
               res = ID;
            }
         });
         return res;
      }
      SyncQueue.addSyncEndListeners("ItemsService", syncEndListener);
      SyncQueue.addSyncStartListeners("ItemsService", syncStartListener);
      // return a relevant name for the name of the listener in sync:
      function getThreadSyncName(idThread, idItem, idUser) {
         if (idThread) {
            return 'thread-'+idThread;
         } else {
            return 'usersAnswers-'+idItem+'-'+idUser;
         }
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
         // XXX: change this for language filtering
         getStrings: function(item) {
            if (!item || !item.strings) {
               return null;
            }
            return item.strings[0];
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
            angular.forEach(item.user_answers, function(user_answer) {
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
            angular.forEach(item.user_answers, function(user_answer) {
               if (user_answer.idUser == idUser) {
                  result.push(user_answer);
               }
            });
            return result;
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
                  if (typeof lang !== 'undefined' && (!lang || lang == '*' || lang.indexOf('Python') != -1)) {
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
         normalizeItemType: function(type) {
            if (!type) return '';
            if (type.substring(type.length - 7, type.length) === 'Chapter') {
               type = 'Chapter';
            }
            if (type.substring(type.length - 4, type.length) === 'Root') {
               type = 'Root';
            }
            return type;
         },
         getItemTypeStr: function(item) {
            if (!item) return '';
            var type = this.normalizeItemType(item.sType);
            if (type == 'Root') return '';
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
         },
         syncForumIndex: function(callback) {
            SyncQueue.requestSets['forumIndex'] = {minVersion: 0, name: 'forumIndex'};
            SyncQueue.addSyncEndListeners('forumIndex', function() {
               SyncQueue.removeSyncEndListeners('forumIndex');
               delete(SyncQueue.requestSets['forumIndex'].minVersion);
               callback();
            }, true);
            SyncQueue.planToSend(0);
         },
         unsyncForumIndex:function() {
            delete(SyncQueue.requestSets['forumIndex']);
         },
         updateWindow: updateWindow,
         resetWindow: function() {
            itemService.updateWindow({groupAdmin_idGroup: null, groupAdmin_idItem: null, bOnForum: false, idThread: null, bOnProfile: false, bOnForum: false, idFilter: null, idMainItem: null, userActivity_idUser: null, userActivity_idItem: null});
         },
         syncThread: function(idThread, idItem, idUser, callback) {
            var endListenerName = getThreadSyncName(idThread, idItem, idUser);
            if (idThread) {
               SyncQueue.requestSets[endListenerName] = {minVersion: 0, name: 'getThread', idThread: idThread};
            } else {
               SyncQueue.requestSets[endListenerName] = {minVersion: 0, name: 'getUserAnswers', idItem: idItem, idUser: idUser};
            }
            SyncQueue.addSyncEndListeners(endListenerName, function() {
               SyncQueue.removeSyncEndListeners(endListenerName);
               delete(SyncQueue.requestSets[endListenerName].minVersion);
               callback();
            }, true);
            SyncQueue.planToSend(0);
         },
         unsyncThread:function(idThread, idItem, idUser) {
            var endListenerName = getThreadSyncName(idThread, idItem, idUser);
            delete(SyncQueue.requestSets[endListenerName]);
         },
         syncDescendants: syncDescendants,
         unsyncDescendants: function() {
            delete(SyncQueue.requestSets.itemsDescendants);
         }
      };
   }]);
