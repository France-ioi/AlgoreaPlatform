'use strict';

angular.module('algorea')
    .controller('groupAccountsManagerController', ['$scope', '$http', '$i18next', '$uibModal', 'loginService', function($scope, $http, $i18next, $uibModal, loginService) {


    $scope.user = {}
    $scope.error = null;
    $scope.fetching = false;
    $scope.available = false;

    loginService.getLoginData(function(res) {
        $scope.user = ModelsManager.getRecord('users', res.ID);
        if(!$scope.user.loginModulePrefix) {
            $scope.error = $i18next.t('groupAccountsManager_empty_loginModulePrefix_alert');
        } else {
            $scope.available = true;
        }
    });


    function accountsManagerRequest(params, callback) {
        $scope.fetching = true;
        $http.post('/groupAdmin/accounts_manager.php', params, { responseType: 'json'})
            .success(function(res) {
                $scope.fetching = false;
                if(res.success) {
                    callback(res.data)
                } else {
                    $scope.error = res.error
                }
            })
            .error(function(res) {
                $scope.error = res && res.error ? res.error : 'Server error';
                console.error("error calling accounts_manager.php");
            });
    }


    function getPrefixId(prefix) {
        var l = $scope.$parent.group.login_prefixes;
        for(var i=0; i<l.length; l++) {
            if(l[i].prefix === prefix) return l[i].ID;
        }
        return false;
    }


    // create users
    $scope.create_params = {
        prefix: '',
        amount: 1,
        postfix_length: 3,
        password_length: 6,
        example_login: null,
        error: false
    }
    $scope.accounts = [];


    $scope.refreshExampleLogin = function() {
        if($scope.create_params.prefix == '') {
            return null;
        }
        var l = parseInt($scope.create_params.postfix_length, 10);
        if(l > 100 || l < 0) {
            return null;
        }
        var postfix = '';
        var c = "23456789abcdefghijkmnpqrstuvwxyz";
        for(var i=0; i<$scope.create_params.postfix_length; i++) {
            postfix += c.charAt(Math.floor(Math.random() * c.length));
        }
        $scope.create_params.example_login = ([
            $scope.user.loginModulePrefix,
            $scope.create_params.prefix,
            postfix
        ]).join('_');
    }


    function getCreateParams() {
        $scope.create_params.error = false;
        var res = {
            action: 'create',
            prefix: $scope.create_params.prefix.trim(),
            amount: parseInt($scope.create_params.amount, 10) || 0,
            postfix_length: parseInt($scope.create_params.postfix_length, 10) || 0,
            password_length: parseInt($scope.create_params.password_length, 10) || 0,
            group_id: $scope.$parent.group.ID
        };
        if(res.prefix == '') {
            $scope.create_params.error = $i18next.t('groupAccountsManager_wrong_prefix');
            return;
        }
        if(res.postfix_length > 50 || res.postfix_length < 3) {
            $scope.create_params.error = $i18next.t('groupAccountsManager_wrong_postfix_length');
            return;
        }
        if(res.password_length > 50 || res.password_length < 6) {
            $scope.create_params.error = $i18next.t('groupAccountsManager_wrong_password_length');
            return;
        }
        if(getPrefixId(res.prefix)) {
            $scope.create_params.error = $i18next.t('groupAccountsManager_used_prefix');
            return;
        }
        if(res.amount < 0 || res.amount > 50) {
            $scope.create_params.error = $i18next.t('groupAccountsManager_wrong_number_of_users');
            return;
        }
        return res;
    }

    $scope.createUsers = function() {
        var params = getCreateParams()
        if(!params) return;

        $scope.error = null;
        accountsManagerRequest(params, function(data) {
            var item = ModelsManager.createRecord("groups_login_prefixes");
            item.idGroup = $scope.$parent.group.ID;
            item.prefix = data.prefix;
            ModelsManager.insertRecord("groups_login_prefixes", item);
            showAccounts(data.accounts);
            SyncQueue.planToSend(0);
        });

        $scope.create_params.example_login = null;
        $scope.create_params.prefix = '';
        $scope.create_params.amount = 1;
    }



    // show generated accounts

    function showAccounts(accounts) {
        $uibModal.open({
            templateUrl: '/groupAdmin/groupAccountsCreatePopup.html',
            controller: 'groupAccountsCreatePopupController',
            resolve: { data: function () {
                return {
                    accounts: accounts,
                    group: $scope.$parent.group.sName
                }
            }},
            windowClass: 'groupAdmin-modal',
            backdrop: 'static',
            keyboard: false
        });
    };




    // delete users
    $scope.delete_params = {
        prefix: '',
        error: false
    }

    $scope.selectPrefix = function(prefix) {
        $scope.delete_params.prefix = prefix;
        $scope.delete_params.error = false;
    }


    function getDeleteParams() {
        $scope.delete_params.error = false;
        var prefix = $scope.delete_params.prefix.trim();
        var res = {
            action: 'delete',
            prefix: prefix,
            id: getPrefixId(prefix),
            group_id: $scope.$parent.group.ID
        }
        if(!res.prefix) {
            $scope.delete_params.error = $i18next.t('groupAccountsManager_wrong_prefix');
            return;
        }
        if(!res.id) {
            $scope.delete_params.error = $i18next.t('groupAccountsManager_nonexistent_prefix');
            return;
        }
        return res;
    }


    $scope.deleteUsers = function() {
        var params = getDeleteParams()
        if(!params) return;

        $scope.error = null;
        accountsManagerRequest(params, function(data) {
            ModelsManager.deleteRecord('groups_login_prefixes', params.id);
            SyncQueue.planToSend(0);
        });

        $scope.delete_params.prefix = '';
    }

}]);



// printable popup controller

angular.module('algorea')
   .controller('groupAccountsCreatePopupController', ['$scope', '$uibModalInstance', 'data', function ($scope, $uibModalInstance, data) {
   'use strict';

    $scope.group = data.group;
    $scope.accounts = data.accounts;
    $scope.printing = false;

    $scope.print = function() {
        $scope.printing = true;
        var html =
            '<html><head>' +
            '<title>' + data.group  + '</title>' +
            '<link rel="stylesheet" type="text/css" href="/groupAdmin/groupAccountsPrint.css"/>' +
            '</head><body>' +
            document.getElementById('groupAccountsManagerPopupController_print').innerHTML +
            '</body></html>';
        var win = window.open('', 'PRINT', 'width=300,height=300');
        win.document.write(html);
        win.document.close();

        var interval = setInterval(function() {
            if (win.document.readyState != "complete") return;
            clearInterval(interval);
            interval = null;
            win.focus();
            win.print();
            win.close();
            $scope.printing = false;
        }, 50);

        setTimeout(function() {
            if(!interval) return;
            clearInterval(interval);
            $scope.printing = false;
            console.error('Print popup readyState error');
        }, 5000);
    }

    $scope.close = function () {
        $uibModalInstance.close();
    };
}]);