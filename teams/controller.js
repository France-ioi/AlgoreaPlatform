angular.module('algorea')
   .controller('teamsController', ['$scope', '$rootScope', '$http', '$timeout', '$i18next', 'loginService', 'itemService', 'contestTimerService', function ($scope, $rootScope, $http, $timeout, $i18next, loginService, itemService, contestTimerService) {
      $scope.window = window;

      $scope.newTeamName = '';
      $scope.joinPassword = '';
      $scope.isLogged = true;
      $scope.user_item = itemService.getUserItem($scope.item);

      $scope.updateTeam = function(data) {
         // Update scope data from a request answer
         if(data.team) {
            $scope.team = data.team;
            $scope.hasPassword = !!data.team.sPassword;
            loginService.getLoginData(function(data) {
               $scope.userGroupSelf = data.idGroupSelf;
            });
            if($scope.loading && $scope.team.iTeamParticipating == 1) {
               $scope.collapse = true;
            }
         }
         if(typeof data.qualificationState != 'undefined') {
            $scope.qualificationState = data.qualificationState;
            $scope.canResetQualificationState = data.canResetQualificationState;
         }
      };

      $scope.apiRequest = function(action, parameters, syncAfter, callback, errorVar) {
         // Send a request to the teams API
         if(!errorVar) { errorVar = 'error'; }
         $scope[errorVar] = '';

         if(!$scope.item || !$scope.item.sTeamMode) {
            $scope[errorVar] = "This item doesn't support teams.";
            return;
         }

         if(!parameters) { parameters = {}; }
         parameters['action'] = action;
         parameters['idItem'] = $scope.item.ID;

         $http.post('/teams/teamsApi.php', parameters).success(function(res) {
            if(!res.result) {
               if(res.error == 'api_needs_login') { $scope.isLogged = false; }
               $scope[errorVar] = res.error;
               return;
            }
            $scope.isLogged = true;
            $scope.updateTeam(res);
            if(syncAfter) { SyncQueue.planToSend(0); }
            if(callback) {
               callback(res);
            }
         });
      };

      $scope.genPassword = function() {
         var newPassword = '';
         var stringOfAllowedChars = '3456789abcdefghijkmnpqrstuvwxy';
         for (var i = 0; i < 10;  i++) {
            newPassword += stringOfAllowedChars.charAt(Math.floor(Math.random()*stringOfAllowedChars.length));
         }
         return newPassword;
      };

      $scope.createTeam = function() {
         $scope.apiRequest('createTeam', {name: $scope.newTeamName, password: $scope.genPassword()}, true);
      };

      $scope.joinTeam = function(password) {
         $scope.apiRequest('joinTeam', {
            password: password ? password : $scope.joinPassword
            }, true);
      };

      $scope.startItem = function() {
         var nbChildren = $scope.item.children.length;
         $scope.apiRequest('startItem', {}, false, function(res) {
            if(res.startTime) {
               config.contestData = {endTime: res.endTime, startTime: res.startTime, duration: res.duration, idItem: $scope.item.ID};
               contestTimerService.startContest($scope.item.ID, res.duration);
               // for some reason, sync doesn't work in this case
               SyncQueue.sentVersion = 0;
               SyncQueue.serverVersion = 0;
               SyncQueue.resetSync = true;
            }
            SyncQueue.planToSend(0);
            $scope.syncUntilChildren(nbChildren, 30);
         });
      };

      $scope.syncUntilChildren = function(nbChildren, attempts) {
         if(attempts < 0) { return; }
         $timeout(function() {
            if($scope.item.children.length > nbChildren) { return; }
            SyncQueue.planToSend(0);
            $scope.syncUntilChildren(nbChildren, attempts-1);
            }, 1000);
      };

      $scope.changeTeamPassword = function(callback) {
         if(!$scope.team) { return; }
         var newPassword = '';
         if(!$scope.team.sPassword) {
            // Create a new password
            newPassword = $scope.genPassword();
         } // else the password will be set at null, preventing people from joining
         $scope.apiRequest('changeTeamPassword', {password: newPassword}, false, callback);
      };

      $scope.removeTeamMember = function(idGroupChild) {
         if(!idGroupChild) { return; }
         if(!confirm($i18next.t('teams_confirm_remove'))) { return; }
         $scope.apiRequest('removeTeamMember', {idGroupChild: idGroupChild}, true, function(res) {
            if(!res.team) { $scope.team = null; } // we just left the team
         });
      };

      $scope.leaveTeam = function() {
         if(!confirm($i18next.t('teams_confirm_leave'))) { return; }
         $scope.apiRequest('leaveTeam', null, true, function() {
            $scope.team = null;
         });
      };

      $scope.resetDoNotPossess = function() {
         loginService.openLoginPopup('badge');
      };

      $scope.toggleInterface = function() {
         $scope.collapse = !$scope.collapse;
      };

      $scope.loginNewMemberCallback = function() {
         if(!window.loginNewMemberPassword) { return; }
         $scope.joinPassword = window.loginNewMemberPassword;
         $scope.joinTeam(window.loginNewMemberPassword);
         window.loginNewMemberPassword = null;
      };

      $scope.loginNewMember = function() {
         function logoutLogin() {
            window.loginNewMemberPassword = $scope.team.sPassword;
            loginService.registerCallback(function() {
               loginService.registerCallback($scope.loginNewMemberCallback, 'login');
               loginService.openLoginPopup('login');
               }, 'logout');
            loginService.openLoginPopup('logout');
         }
         if($scope.team.sPassword) {
            logoutLogin();
         } else {
            $scope.changeTeamPassword(logoutLogin);
         }
      };

      $scope.loading = true;
      $scope.apiRequest('getTeam', {}, false, function() { $scope.loading = false; });
   }]);
