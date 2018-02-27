'use strict';

angular.module('algorea').
  filter('groupsOnly', function() {
    return function(items) {
      return _.filter(items, function(item) {
        return item.child.sType != 'UserSelf' && item.parent.sType != 'UserAdmin';
      })
    };
  });

angular.module('algorea')
    .controller('groupSubgroupsController', ['$scope', '$state', '$stateParams', '$i18next', '$http', 'loginService', 'itemService', function($scope, $state, $stateParams, $i18next, $http, loginService, itemService) {

    $scope.loading = false;

    function init() {
        $scope.group = ModelsManager.getRecord('groups', $stateParams.idGroup);
        var cnt = 0;
        _.each($scope.group.parents, function(gg) {
            if(gg.parent.sType != 'UserAdmin') cnt++;
        })
        $scope.show_parents = cnt > 0;
    }

    loginService.getLoginData(function(res) {
        var user = ModelsManager.getRecord('users', res.ID);
        if(!user.allowSubgroups) {
            $scope.error = $i18next.t('groupSubgroups_not_available');
        } else {
            $scope.available = true;
            init();
        }
    });



    $scope.formValues = {};


    function parseGroupNames() {
        return _.filter($scope.formValues.groupNames.split('\n'), function(l) {
            return l.trim() != '';
        })
    }

    $scope.createSubgroups = function() {
        var sNames = parseGroupNames();
        $scope.error = false;
        if(!sNames.length || sNames.length > 20) {
            $scope.error = $i18next.t('groupSubgroups_incorrect_names_array');
            return;
        }
        $scope.loading = true;
        var params = {
            action: 'createMultipleGroups',
            idParent: $stateParams.idGroup,
            sNames: sNames
        }
        $http.post('/groupAdmin/api.php', params, {responseType: 'json'})
        .success(function(postRes) {
            $scope.loading = false;
            if (!postRes || !postRes.success) {
                console.error("got error from admin groupAdmin/api.php: "+postRes.error);
            } else {
              SyncQueue.planToSend(0);
              $scope.formValues.groupNames = '';
           }
        })
        .error(function() {
           console.error("error calling groupAdmin/api.php");
        });
    }

    $scope.openGroup = function(idGroup) {
        $state.go('groupAdminGroup', {idGroup: idGroup, section: 'subgroups'});
    };


    $scope.deleteGroup = function(idGroup, $event) {
        $scope.error = false;
        $scope.loading = true;
        if ($event) {
            $event.stopPropagation();
        }
        var params = {
            action: 'deleteGroup',
            idGroup: idGroup
        }
        $http.post('/groupAdmin/api.php', params, {responseType: 'json'})
        .success(function(postRes) {
            if (!postRes || !postRes.success) {
               console.error("got error from admin groupAdmin/api.php: "+postRes.error);
            } else {
               SyncQueue.planToSend(0);
            }
            $scope.loading = false;
         })
         .error(function() {
            console.error("error calling groupAdmin/api.php");
         });
    }

}]);
