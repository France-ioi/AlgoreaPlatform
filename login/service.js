'use strict';

angular.module('franceIOILogin', ['jm.i18next', 'ui.bootstrap'])
     .service('loginService', ['$http', '$rootScope', '$sce', '$uibModal', function ($http, $rootScope, $sce, $uibModal) {
        var state = 'not-ready';
        var tempUser = false;
        var userID = null;
        var userSelfGroup = null;
        var userOwnedGroup = null;
        var userLogin = null;
        var callbacks = [];
        var loginDone = false;
        var loggedOut = true;
        var loginModuleUrl = $sce.trustAsResourceUrl(config.loginUrl);
        function getLoginData(callback) {
           if (loginDone) {
             callback({
               'ID': userID,
               'sLogin': userLogin,
               'idGroupSelf': userSelfGroup,
               'idGroupOwned': userOwnedGroup,
               'tempUser': tempUser
            });
         } else {
            callbacks.push(function() {
               callback({
                 'ID': userID,
                 'sLogin': userLogin,
                 'idGroupSelf': userSelfGroup,
                 'idGroupOwned': userOwnedGroup,
                 'tempUser': tempUser
              });
            });
         }
        }
        function setLocalLoginData(loginData) {
          if (!loginDone) {
            if (loginData) {
               state = 'login';
               loggedOut = false;
               tempUser = loginData.tempUser;
               userID = loginData.ID;
               userSelfGroup = loginData.idGroupSelf;
               userOwnedGroup = loginData.idGroupOwned;
               userLogin = loginData.sLogin;
               var broadcastArg = {login: loginData.sLogin, tempUser: loginData.tempUser, loginData: loginData};
               $rootScope.$broadcast('login.login', broadcastArg);
               triggerCallback();
            } else {
               onNotLogged();
            }
          }
        }
        function triggerCallback() {
           loginDone = true;
           angular.forEach(callbacks, function(callback, i) {
             if (typeof callback === 'function') {
                callback();
                delete callbacks[i];
             }
          });
        }
        function allowSourceOrigin() { return true; }
        function onLogin(data) {
           if (data.login == userLogin) return;
           createSession(data, function (user) {
              loggedOut = false;
              state = 'login';
              tempUser = false;
              data.tempUser = false;
              data.loginData = user.loginData;
              userID = user.ID;
              userSelfGroup = user.loginData.idGroupSelf;
              userOwnedGroup = user.loginData.idGroupOwned;
              userLogin = user.sLogin;
              $rootScope.myUserID = userID;
              $rootScope.myLogin = user.sLogin;
              $rootScope.$broadcast('login.login', data);
              triggerCallback();
           });
        }
        function onLogout(data) {
           if (loggedOut || tempUser) return;
           loggedOut = true;
           $rootScope.$broadcast('login.logout');
           createTempUser('logout', function(user) {
              loggedOut = false;
              tempUser = true;
              userLogin = user.sLogin;
              userID = user.ID;
              userSelfGroup = null;
              userOwnedGroup = null;
              state = 'login';
              $rootScope.myUserID = userID;
              $rootScope.myLogin = user.sLogin;
              $rootScope.$broadcast('login.login', {login: user.sLogin, tempUser: true, loginData: user.loginData});
              triggerCallback();
           });
        }
        function onNotLogged(data) {
           if (tempUser) return;
           createTempUser('notLogged', function(user) {
              loggedOut = false;
              tempUser = true;
              userLogin = user.sLogin;
              userID = user.ID;
              userSelfGroup = null;
              userOwnedGroup = null;
              state = 'login';
              $rootScope.$broadcast('login.login', {login: user.sLogin, tempUser: true, loginData: user.loginData});
              $rootScope.myUserID = userID;
              $rootScope.myLogin = user.sLogin;
              triggerCallback();
           });
        }
        function messageCallback(e) {
           var message;
           try {
              message = JSON.parse(e.data);
           } catch(e) { return; }
           if (!message || message.source !== 'loginModule')
              return;
           if (message.request == 'login') {
              onLogin(message.content);
           } else if (message.request == 'logout') {
              onLogout(message.content);
           } else if (message.request == 'notlogged') {
              onNotLogged(message.content);
           }
        }
        function requireMoreLoginFields(missingFields) {
            var text = 'Les champs suivants sont nécessaires à la connexion sur cette plateforme mais n\'ont pas été fournis : ';
            text += missingFields.join(', ');
            text += '. Cliquez sur OK pour ouvrir une fenêtre où vous pourrez les renseigner.';
            var modalInstance = $uibModal.open({
             template: '<div class="modal-header"><h3 class="modal-title">Confirmation</h3></div><div class="modal-body">{{text}}</div><div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button><button class="btn btn-warning" ng-click="cancel()">Annuler</button></div>',
             controller: ["$scope", "$uibModalInstance", "text", function($scope, $uibModalInstance, text) {
               $scope.text = text;
               $scope.ok = function () {
                 openLoginPopup();
                 $uibModalInstance.dismiss('cancel');
               };
               $scope.cancel = function () {
                 $uibModalInstance.dismiss('cancel');
               };
             }],
             resolve: {
               text: function () {
                 return text;
               }
             }
           });
           modalInstance.result.then(function (/*text*/) {
             scope.action();
           }, function () {
           });
        }
        function openLoginPopup(logout) {
            var additionalArgs = '';
            if (config.domains.current.additionalLoginArgs) {
               additionalArgs += '&'+config.domains.current.additionalLoginArgs; 
            }
            if (config.domains.current.loginMandatoryFields) {
               additionalArgs += '&requiredFields='+encodeURIComponent(config.domains.current.loginMandatoryFields.join());
            }
            if (config.domains.current.beInsistentWithBadge) {
               additionalArgs += '&beInsistentWithBadge=1';
            }
            if (logout) {
               additionalArgs += '&autoLogout=1';
            }
            additionalArgs += '&fallbackReturnUrl='+encodeURIComponent(config.domains.current.baseUrl+'login/loginModule-fallback.php');
            var popup = window.open(loginModuleUrl+'?mode=popup'+additionalArgs,"Login","menubar=no, status=no, scrollbars=no, menubar=no, width=500, height=600");
            if (!logout) {
               connectToPopup(popup);
            } else {
               onLogout();
            }
        }
        function createSession(data, callback) {
           data.action = 'login';
           var postRes;
           $http.post('/login/platform_user.php', data, {responseType: 'json'}).success(function(postRes) {
              if ( ! postRes.result) {
                 if (postRes.missingFields) {
                    requireMoreLoginFields(postRes.missingFields);
                    return;
                 }
                 console.error("got error from login token decoder: "+postRes.error);
              } else {
                 callback(postRes);
              }
           })
           .error(function() {
              console.error("error calling platform_user.php");
           });
        }
        function createTempUser(action, callback) {
           $http.post('/login/platform_user.php', {'action': action}, {responseType: 'json'}).success(function(postRes) {
              if ( ! postRes.result) {
                 console.error("got error from login token decoder: "+postRes.error);
              } else {
                 callback(postRes);
              }
           })
           .error(function() {
              console.error("error calling platform_user.php");
           });
        }
        function connectToPopup(popup) {
            var nbIntervalCalled = 0;
            // IE basically cannot talk to its popups
            var interval = window.setInterval(function() {
               $http.post('/login/loginModule-fallback.php', {get: true}).then(function(res) {
                  var message = res.data;
                  if (message) {
                     if (message.request == 'login') {
                        onLogin(message.content);
                        clearInterval(interval);
                     } else if (message.request == 'logout') {
                        onLogout(message.content);
                        clearInterval(interval);
                     } else if (message.request == 'notlogged') {
                        onNotLogged(message.content);
                     }
                  }
               });
               // givin up after 2mn
               nbIntervalCalled += 1;
               if (nbIntervalCalled > 120) {
                  clearInterval(interval);
               }
            }, 1000);
            channel = Channel.build({
                window: popup,
                origin: "*",
                scope: "loginModule",
                onReady: function() {
                  clearInterval(interval);
                }
            });
            channel.bind("loginMessage", function(trans, message) {
               if (message.request == 'login') {
                  onLogin(message.content);
               } else if (message.request == 'logout') {
                  onLogout(message.content);
               } else if (message.request == 'notlogged') {
                  onNotLogged(message.content);
               }
               return;
            });
        }
        var channel = null;
        return {
           loginUrl: loginModuleUrl,
           getState: function() {
              return state;
           },
           openLoginPopup: openLoginPopup,
           getLoginData: getLoginData,
           onLogout: onLogout,
           setLocalLoginData: setLocalLoginData,
           getUser: function() {
              if (state == 'not-ready') {
                 return false;
              }
              return {tempUser: tempUser, userLogin: userLogin, userID: userID};
           },
           isTempUser: function() {
              return tempUser;
           },
           bindScope: function(newScope) {
           },
           init: function() {
           },
           initEventListener: function(newScope) { // used by admin interface, works under IE because it's an iframe
              window.addEventListener("message", messageCallback, false);
           },
           connectToPopup: connectToPopup,
           getCallbacks: function() {
              return {'login': onLogin, 'logout': onLogout, 'notlogged': onNotLogged};
           }
        };
  }]);
