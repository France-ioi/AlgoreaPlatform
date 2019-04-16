angular.module('algorea')
    .controller('groupCodePromptController', ['$scope', 'loginService', '$http', '$i18next', function ($scope, loginService, $http, $i18next) {

    $scope.tempUser = true;
    $scope.loading = false;
    $scope.code = {
        value: '',
        valid: false
    }

    $scope.account = {
        created: false,
        participation_code: null,
        redirect: null
    }

    function redirect() {
        if($scope.account.created && $scope.account.redirect) {
            location.href = $scope.account.redirect;
        }
    }

    $scope.$on('login.login', function(event, data) {
        $scope.tempUser = data.tempUser;
        redirect();
    });
    $scope.$on('login.update', function(event, data) {
        redirect();
    });
    loginService.getLoginData(function(data) {
        $scope.tempUser = data.tempUser;
    });





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
            if(res.status == 'entered') {
                if(res.redirect) {
                    location.href = res.redirect;
                }
            } else if(res.status == 'account_created') {
                $scope.account = {
                    created: true,
                    participation_code: res.participation_code,
                    redirect: res.redirect
                }
            } else {
                $scope.error = $i18next.t('groupCodePrompt_validation_failed')
            }
        }).error(function(res) {
            $scope.loading = false;
            console.error(res.error)
            $scope.error = 'Server error';
        });
    }


    $scope.openLoginModule = function() {
        loginService.openLoginPopup();
    }

}]);
