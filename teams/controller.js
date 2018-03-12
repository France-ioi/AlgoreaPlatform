angular.module('algorea')
   .controller('teamsController', ['$scope', '$rootScope', '$http', '$i18next', 'loginService', function ($scope, $rootScope, $http, $i18next, loginService) {
      $scope.newTeamName = '';
      $scope.joinPassword = '';
      $scope.isLogged = true;

      $scope.updateTeam = function(data) {
         // Update scope data from a request answer
         if(data.team) {
            $scope.team = data.team;
            $scope.hasPassword = !!data.team.sPassword;
            loginService.getLoginData(function(data) {
               $scope.userGroupSelf = data.idGroupSelf;
            });
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

      $scope.joinTeam = function() {
         $scope.apiRequest('joinTeam', {password: $scope.joinPassword}, true);
      };

      $scope.startItem = function() {
         $scope.apiRequest('startItem', {}, true);
      };

      $scope.changeTeamPassword = function() {
         if(!$scope.team) { return; }
         var newPassword = '';
         if(!$scope.team.sPassword) {
            // Create a new password
            newPassword = $scope.genPassword();
         } // else the password will be set at null, preventing people from joining
         $scope.apiRequest('changeTeamPassword', {password: newPassword});
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

      $scope.loading = true;
      $scope.apiRequest('getTeam', {}, false, function() { $scope.loading = false; });
   }]);
