'use strict';

angular.module('franceIOILogin', ['jm.i18next', 'ui.bootstrap'])
     .service('loginService', ['$injector', '$http', '$rootScope', '$sce', '$uibModal', function ($injector, $http, $rootScope, $sce, $uibModal) {
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
        var popup = null;
        function getLoginData(callback) {
           if (loginDone) {
              var retval = {
                 'ID': userID,
                 'sLogin': userLogin,
                 'idGroupSelf': userSelfGroup,
                 'idGroupOwned': userOwnedGroup,
                 'tempUser': tempUser
              }
              if(callback) { callback(retval); }
              return retval;
           } else {
              if(callback) {
                 callbacks.push({callback: function() {
                    callback({
                       'ID': userID,
                       'sLogin': userLogin,
                       'idGroupSelf': userSelfGroup,
                       'idGroupOwned': userOwnedGroup,
                       'tempUser': tempUser
                    });
                 }});
              }
              return null;
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
        function triggerCallback(type) {
           loginDone = true;

           var curCallbacks = callbacks;
           callbacks = [];

           angular.forEach(curCallbacks, function(cbData, i) {
             if(cbData.type && cbData.type != type) {
                callbacks.push(cbData);
                return;
             }
             if (typeof cbData.callback === 'function') {
                cbData.callback(type);
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
          var url = config.domains.current.baseUrl;
          if(url[url.length-1] != '/') {
            url += '/';
          }
          url += 'login/platform_user.php';
           $http.post(url, {'action': action}, {responseType: 'json'}).success(function(postRes) {
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
          if(user.sLogin == userLogin) return
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
          triggerCallback('login');
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
          triggerCallback('logout');
        }

        function handleProfile(user) {
          userLogin = user.sLogin;
          $rootScope.myLogin = user.sLogin;
          $rootScope.$broadcast('login.update', {
            login: user.sLogin,
            tempUser: false,
            loginData: user.loginData
          });
          var u = ModelsManager.curData.users[user.ID];
          angular.forEach(u, function(value, key) {
            if(key in user.loginData) {
              u[key] = user.loginData[key];
            }
          });
          triggerCallback('profile');
        }


        function createHandler(handler) {
          return function(user, params) {
            popup && popup.close();
            if(user.result) {
              handler(user);
              if(params && params['redirectPath']) {
                var sell = params.redirectPath.split('/').length-1;
                if($injector.has('$state')) {
                  $state = $injector.get('$state');
                  $state.go('contents', {path: params.redirectPath, sell: sell, selr: sell+1});
                }
              }
            } else {
              console.error(user.error);
            }
          }
        }


        function openLoginPopup(action) {
            if(!action) {
              action = 'login';
            }
            var url = config.domains.current.baseUrl +
              '/login/popup_redirect.php' +
              '?action=' + action +
              '&locale=' + ($rootScope.sLocale || 'en');
            popup = window.open(url, "LoginModule", "menubar=no, status=no, scrollbars=yes, menubar=no, width=800, height=600");
            popup.focus();
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
           registerCallback: function(callback, type) {
              callbacks.push({type: type, callback: callback});
           },
           init: function() {
            window.__LoginModuleOnLogin = createHandler(handleLogin);
            window.__LoginModuleOnLogout = createHandler(handleLogout);
            window.__LoginModuleOnProfile = createHandler(handleProfile);
           }
        };
  }])
