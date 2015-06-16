'use strict';

angular.module('franceIOILogin', [])
     .service('loginService', ['$http', function ($http) {
        var state = 'not-ready';
        var scope = null;
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
       // deparam.min.js (https://github.com/chrissrogers/jquery-deparam), modified to check if integer is in bounds
       (function(h){h.deparam=function(i,j){var d={},k={"true":!0,"false":!1,"null":null};h.each(i.replace(/\+/g," ").split("&"),function(i,l){var m;var a=l.split("="),c=decodeURIComponent(a[0]),g=d,f=0,b=c.split("]["),e=b.length-1;/\[/.test(b[0])&&/\]$/.test(b[e])?(b[e]=b[e].replace(/\]$/,""),b=b.shift().split("[").concat(b),e=b.length-1):e=0;if(2===a.length)if(a=decodeURIComponent(a[1]),j&&(a=a&&!isNaN(a)&&parseInt(a).toString===a?+a:"undefined"===a?void 0:void 0!==k[a]?k[a]:a),e)for(;f<=e;f++)c=""===b[f]?g.length:b[f],m=g[c]=
        f<e?g[c]||(b[f+1]&&isNaN(b[f+1])?{}:[]):a,g=m;else h.isArray(d[c])?d[c].push(a):d[c]=void 0!==d[c]?[d[c],a]:a;else c&&(d[c]=j?void 0:"")});return d}})(jQuery);
        function getMessage(serializedString) {
           var obj;
           try {
              obj = $.deparam(serializedString, true);
           } catch (e) {
              console.error("impossible to decode received message ("+serializedString+'), ');
              return null;
           }
           var message = null;
           if (obj.request) {
              message = {request: obj.request, content: obj.content, source: obj.source, messageId: obj.messageId};
           }
           return message;
        }
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
              scope.$broadcast('login.login', data);
              triggerCallback();
           });
        }
        function onLogout(data) {
           scope.$broadcast('login.logout');
           createTempUser('logout', function(user) {
              tempUser = true;
              userLogin = user.sLogin;
              userID = user.ID;
              userSelfGroup = null;
              userOwnedGroup = null;
              state = 'login';
              scope.$broadcast('login.login', {login: user.sLogin, tempUser: true, loginData: user.loginData});
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
              scope.$broadcast('login.login', {login: user.sLogin, tempUser: true, loginData: user.loginData});
              triggerCallback();
           });
        }
        function messageCallback(e) {
           var message = getMessage(e.data);
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
           getState: function() {
              return state;
           },
           getLoginData: getLoginData,
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
              scope = newScope;
           },
           init: function(newScope) {
              scope = newScope;
              $.receiveMessage(messageCallback, allowSourceOrigin);
           },
           getCallbacks: function() {
              return {'login': onLogin, 'logout': onLogout, 'notlogged': onNotLogged};
           }
        };
  }]);
