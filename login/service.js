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


        function handleLogin(user) {
          if(user.login == userLogin) return
          loggedOut = false;
          state = 'login';
          tempUser = false;
          userID = user.ID;
          userSelfGroup = user.loginData.idGroupSelf;
          userOwnedGroup = user.loginData.idGroupOwned;
          userLogin = user.sLogin;
          $rootScope.myUserID = userID;
          $rootScope.myLogin = user.sLogin;
          $rootScope.$broadcast('login.login', {
            login: user.sLogin,
            tempUser: false,
            loginData: user.loginData
          });
          triggerCallback();
        }

        function handleLogout(user) {
          if (loggedOut || tempUser) return;
          loggedOut = true;
          $rootScope.$broadcast('login.logout');
          loggedOut = false;
          tempUser = true;
          userLogin = user.sLogin;
          userID = user.ID;
          userSelfGroup = null;
          userOwnedGroup = null;
          state = 'login';
          $rootScope.myUserID = userID;
          $rootScope.myLogin = user.sLogin;
          $rootScope.$broadcast('login.login', {
            login: user.sLogin,
            tempUser: true,
            loginData: user.loginData
          });
          triggerCallback();
        }


        function createHandler(handler, popup) {
          return function(user) {
            if(user.result) {
              handler(user);
            } else {
              console.error(user.error);
            }
            popup.close();
          }
        }


        function openLoginPopup(logout) {
            var url = config.domains.current.baseUrl + '/login/' + (logout ? 'redirect_logout.php' : 'redirect_oauth.php');
            var popup = window.open(url, "Login", "menubar=no, status=no, scrollbars=yes, menubar=no, width=500, height=600");
            window.__IOIAuthOnLogin = createHandler(handleLogin, popup);
            window.__IOIAuthOnLogout = createHandler(handleLogout, popup);
        }




        return {
           loginUrl: loginModuleUrl,
           getState: function() {
              return state;
           },
           openLoginPopup: openLoginPopup,
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
           init: function() {
           }
        };
  }]);
