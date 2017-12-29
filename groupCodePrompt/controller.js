angular.module('algorea')
    .controller('groupCodePromptController', ['$scope', 'loginService', '$http', '$i18next', function ($scope, loginService, $http, $i18next) {

    $scope.tempUser = true;
    $scope.$on('login.login', function(event, data) {
        $scope.tempUser = data.tempUser;
    });

    loginService.getLoginData(function(data) {
        $scope.tempUser = data.tempUser;
    });



    $scope.loading = false;
    $scope.code = {
        value: '',
        valid: false
    }

    $scope.validate = function() {
        if(!$scope.code.value) return;

        $scope.error = false;
        $scope.loading = true;

        var p = {
            idItem: $scope.item.ID,
            code: $scope.code.value,
            action: 'validate'
        }
        $http.post(
            '/groupCodePrompt/controller.php',
            p,
            {responseType: 'json'}
        ).success(function(res) {
            $scope.loading = false;
            $scope.code.valid = res;
            if(!res) {
                $scope.error = $i18next.t('groupCodePrompt_validation_failed')
            }
        }).error(function(res) {
            $scope.loading = false;
            console.error(res.error)
            $scope.error = 'Server error';
        });
    }



    $scope.enter = function() {
        $scope.error = false;
        $scope.loading = true;

        var p = {
            idItem: $scope.item.ID,
            code: $scope.code.value,
            action: 'enter'
        }
        $http.post(
            '/groupCodePrompt/controller.php',
            p,
            {responseType: 'json'}
        ).success(function(res) {
            $scope.loading = false;
            if(res == 'entered') {
                SyncQueue.planToSend(0);
            } else if(res == 'login_module_popup') {
                loginService.openLoginPopup();
            } else {
                $scope.error = $i18next.t('groupCodePrompt_validation_failed')
            }
        }).error(function(res) {
            $scope.loading = false;
            console.error(res.error)
            $scope.error = 'Server error';
        });
    }

}]);