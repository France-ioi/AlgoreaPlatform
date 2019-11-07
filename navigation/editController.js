angular.module('algorea')
.controller('editController', [
    '$rootScope', '$scope', 'itemService', '$state', '$i18next', '$uibModal', '$sce', '$timeout', '$interval', 'loginService', 'pathService', 'tabsService',
    function ($rootScope, $scope, itemService, $state, $i18next, $uibModal, $sce, $timeout, $interval, loginService, pathService, tabsService) {
        $scope.itemService = itemService;
        $scope.tabsService = tabsService;
        $scope.models = window.models;

        $scope.setupSync = function() {
            if($scope.getEditMode() != 'edit') { return; }
            // sync does not work without this
            if(!SyncQueue.requests) { SyncQueue.requests = {}; }
            SyncQueue.requests.algorea = {
                admin: true
            };
        }

        var user = null;
        loginService.getLoginData(function(res) {
            user = res;
        })

        // common
        $scope.availableLocales = ModelsManager.getRecords('languages');
        // TODO :: Why is that happening?
        if($scope.availableLocales[0]) { delete $scope.availableLocales[0]; }

        $scope.$watch('item', function() {
            if($scope.item && $scope.item.strings && $scope.item.strings.length) {
                $scope.item_strings = $scope.item.strings[0];
            }
        });


        $scope.$on('algorea.reloadTabs', function(event) {
            $scope.setupSync();
        });
        $scope.$on('algorea.reloadView', function(event, view) {
            if(view == 'right') {
                $scope.setupSync();
            }
        });

        $scope.setupSync();

        $scope.checkSaveItem = function() {
            var hasChanged = false;
            hasChanged |= $scope.hasObjectChanged("items", $scope.item);
            hasChanged |= $scope.hasObjectChanged("items_strings", $scope.item_strings);
            if (hasChanged) {
               if (confirm($i18next.t('groupAdmin_confirm_unsaved'))) {
                  $scope.resetObjectChanges("items", $scope.item);
                  $scope.resetObjectChanges("items_strings", $scope.item_strings);
               } else {
                  return false;
               }
            }
            return true;
        };


        // params
        $scope.hasObjectChanged = function(modelName, record) {
            if(!record) return;
            return ModelsManager.hasRecordChanged(modelName, record.ID);
        };

        $scope.resetObjectChanges = function(modelName, record) {
            if(!record) return;
            ModelsManager.resetRecordChanges(modelName, record.ID);
        };

        $scope.saveObject = function(modelName, record) {
            if(!record) return;
            ModelsManager.updated(modelName, record.ID);
        };

        // strings
        $scope.newItemStrings = function() {
            if (!$scope.checkSaveItem()) {
                return;
            }
            var existingLocales = [];
            for(var i=0; i < $scope.item.strings.length; i++) {
                existingLocales.push($scope.item.strings[i].language);
            }
            // TODO :: default to selected admin locale
            var idLanguage = null;
            for(var idLocale in $scope.availableLocales) {
                if(existingLocales.indexOf($scope.availableLocales[idLocale]) == -1) {
                    idLanguage = idLocale;
                    break;
                }
            }
            if(!idLanguage) {
                return;
            }
            var itemStrings = ModelsManager.createRecord("items_strings");
            itemStrings.idItem = $scope.item.ID;
            itemStrings.idLanguage = idLanguage;
            itemStrings.sTitle = $i18next.t('groupAdmin_new_item');
            ModelsManager.insertRecord("items_strings", itemStrings);
            $scope.item_strings = itemStrings;
        };


        $scope.deleteItemStrings = function(id) {
            if($scope.item.strings.length > 1) {
                ModelsManager.deleteRecord("items_strings", id);
                $scope.item_strings = $scope.item.strings[0];
            }
        };

    }
]);
