'use strict';

angular.module('algorea')
    .controller('groupAccountsManagerController', ['$scope', '$http', '$i18next', '$uibModal', 'loginService', function($scope, $http, $i18next, $uibModal, loginService) {


    function collectGroups(group) {
        var res = {}
        res[group.ID] = group.sName;
        for(var i=0; i<group.children.length; i++) {
            Object.assign(res, collectGroups(group.children[i].child));
        }
        return res;
    }


    $scope.user = {}
    $scope.error = null;
    $scope.fetching = false;
    $scope.available = false;
    $scope.prefixes = null;


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


    // prefixes
    accountsManagerRequest({
        action: 'get_prefixes',
        group_id: $scope.$parent.group.ID
    }, function(prefixes) {
        $scope.prefixes = prefixes;
    });



    function getPrefixId(prefix) {
        if($scope.prefixes === null) return false;
        for(var i=0; i<$scope.prefixes.length; i++) {
            if($scope.prefixes[i].prefix === prefix) return $scope.prefixes[i].ID;
        }
        return false;
    }


    // create users
    $scope.create_params = {
        prefix: '',
        amount: 1,
        postfix_length: 3,
        password_length: 6,
        create_in_subgroups: false,
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
            password_length: parseInt($scope.create_params.password_length, 10) || 0
        };
        var l = $scope.create_params.example_login.length;
        if(l > 30 || l < 3) {
            $scope.create_params.error = $i18next.t('groupAccountsManager_wrong_login_length');
            return;
        }
        if(res.prefix == '') {
            $scope.create_params.error = $i18next.t('groupAccountsManager_wrong_prefix');
            return;
        }
        if(res.postfix_length > 30 || res.postfix_length < 3) {
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
        if($scope.create_params.create_in_subgroups) {
            res.groups = Object.keys(collectGroups($scope.$parent.group)).join(';');
        } else {
            res.groups = $scope.$parent.group.ID;
        }
        return res;
    }

    $scope.createUsers = function() {
        var params = getCreateParams()
        if(!params) return;

        $scope.error = null;
        accountsManagerRequest(params, function(data) {
            $scope.prefixes = data.prefixes;
            showAccounts(data.accounts);
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
                    groups: collectGroups($scope.$parent.group)
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
            $scope.prefixes = $scope.prefixes.filter(function(v) {
                return v.prefix !== params.prefix;
            });
        });
        $scope.delete_params.prefix = '';
    }
}]);



// printable popup controller

angular.module('algorea')
   .controller('groupAccountsCreatePopupController', ['$i18next','$scope', '$uibModalInstance', 'data', function ($i18next, $scope, $uibModalInstance, data) {
   'use strict';

    $scope.groups = data.groups;
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


    $scope.download = function () {
        var csv = [[
            $i18next.t('models_groups_items_fields_idGroup_label'),
            $i18next.t('groupAccountsManager_login'),
            $i18next.t('groupAccountsManager_password')
        ].join(';')];

        for(var i=0; i<data.accounts.length; i++) {
            var account = data.accounts[i];
            csv.push([
                data.groups[account.algoreaGroupId],
                account.login,
                account.password
            ].join(';'));
        }

        var blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        if(navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, exportedFilenmae);
        } else {
            var link = document.createElement('a');
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'accounts.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }


    $scope.close = function () {
        $uibModalInstance.close();
    };

}]);