'use strict';

angular.module('franceIOILogin', [])
     .service('loginService', ['$http', '$rootScope', '$sce', function ($http, $rootScope, $sce) {
        var state = 'not-ready';
        var tempUser = false;
        var userID = null;
        var userSelfGroup = null;
        var userOwnedGroup = null;
        var userLogin = null;
        var callbacks = [];
        var loginDone = false;
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
           createSession(data, function (user) {
              state = 'login';
              tempUser = false;
              data.tempUser = false;
              data.loginData = user.loginData;
              userID = user.ID;
              userSelfGroup = user.loginData.idGroupSelf;
              userOwnedGroup = user.loginData.idGroupOwned;
              userLogin = user.sLogin;
              $rootScope.myUserID = userID;
              $rootScope.$broadcast('login.login', data);
              triggerCallback();
           });
        }
        function onLogout(data) {
           $rootScope.$broadcast('login.logout');
           createTempUser('logout', function(user) {
              tempUser = true;
              userLogin = user.sLogin;
              userID = user.ID;
              userSelfGroup = null;
              userOwnedGroup = null;
              state = 'login';
              $rootScope.myUserID = userID;
              $rootScope.$broadcast('login.login', {login: user.sLogin, tempUser: true, loginData: user.loginData});
           });
        }
        function onNotLogged(data) {
           createTempUser('notLogged', function(user) {
              tempUser = true;
              userLogin = user.sLogin;
              userID = user.ID;
              userSelfGroup = null;
              userOwnedGroup = null;
              state = 'login';
              $rootScope.$broadcast('login.login', {login: user.sLogin, tempUser: true, loginData: user.loginData});
              $rootScope.myUserID = userID;
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
        function createSession(data, callback) {
           data.action = 'login';
           var postRes;
           $http.post('/login/platform_user.php', data, {responseType: 'json'}).success(function(postRes) {
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
        return {
           loginUrl: $sce.trustAsResourceUrl('https://oldloginfranceioi.eroux.fr/login.html'),
           getState: function() {
              return state;
           },
           getLoginData: getLoginData,
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
           init: function(newScope) {
              window.addEventListener("message", messageCallback, false);
           },
           getCallbacks: function() {
              return {'login': onLogin, 'logout': onLogout, 'notlogged': onNotLogged};
           }
        };
  }]);
