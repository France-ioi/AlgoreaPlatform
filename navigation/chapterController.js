'use strict';

angular.module('algorea')
.controller('chapterController', [
    '$rootScope', '$scope', 'itemService', '$state', '$i18next', '$uibModal', 'loginService', 'pathService',
    function ($rootScope, $scope, itemService, $state, $i18next, $uibModal, loginService, pathService) {
        $scope.itemService = itemService;

        $scope.sortableOptions = {
            handle: '.drag-ctrl',
            stop: function(event, ui) {
                recalculateItemsOrder();
            }
        }

        // sync does not work without this
        if(!SyncQueue.requests) { SyncQueue.requests = {}; }
        SyncQueue.requests.algorea = {
           admin: true
        };

        var user = null;
        loginService.getLoginData(function(res) {
            user = res;
        })

        $scope.editable = function() {
            var groupItem = itemService.getGroupItem($scope.item);
            if(!groupItem) return false;
            return groupItem.bOwnerAccess || groupItem.bManagerAccess;
        }
        $scope.mode = 'view';

        $scope.setMode = function(mode) {
            $scope.mode = $scope.editable ? mode : false;
        }

        $scope.getMode = function() {
            if(!$scope.editable()) {
                $scope.mode = 'view';
            }
            return $scope.mode;
        }

        $scope.isMode = function(mode) {
            return $scope.getMode() == mode;
        }



        // common
        $scope.item_strings = $scope.item.strings[0];
        $scope.item_strings_compare = null;

        function refresh() {
            $scope.allowReorder = $scope.item.bFixedRanks;
            $scope.items = itemService.getChildren($scope.item);
        }
        refresh();

        function getItemItem(item) {
            // Get the item_item between the current item and the argument
            var item_item = null;
            angular.forEach(item.parents, function(ii) {
                if(ii.idItemParent == $scope.item.ID) {
                    item_item = ii;
                }
            });
            return item_item;
        }


        $scope.$on('algorea.reloadView', function(event, view) {
            if(view == 'right') {
                refresh();
            }
        });


        $scope.checkSaveItem = function() {
            var hasChanged = false;
            hasChanged |= $scope.hasObjectChanged("items_items", $scope.item_item);
            hasChanged |= $scope.hasObjectChanged("items", $scope.item);
            hasChanged |= $scope.hasObjectChanged("items_strings", $scope.item_strings);
            if (hasChanged) {
               if (confirm($i18next.t('groupAdmin_confirm_unsaved'))) {
                  $scope.resetObjectChanges("items_items", $scope.item_item);
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


        // children items
        function createItem(sType, sTitle) {
            var item = ModelsManager.createRecord("items");
            item.bOwnerAccess = true;
            item.sType = sType;
            ModelsManager.insertRecord("items", item);

            var groupItem = ModelsManager.createRecord("groups_items");
            groupItem.idItem = item.ID;
            groupItem.idGroup = user.idGroupSelf;
            var accessStartDate = new Date();
            accessStartDate.setDate(accessStartDate.getDate() - 1);
            groupItem.sFullAccessDate = accessStartDate;
            groupItem.bCachedFullAccess = true;
            groupItem.bOwnerAccess = true;
            groupItem.idUserCreated = user.ID;
            ModelsManager.insertRecord("groups_items", groupItem);

            var itemStrings = ModelsManager.createRecord("items_strings");
            itemStrings.idItem = item.ID;
            itemStrings.idLanguage = 1; // TODO: handle this
            itemStrings.sTitle = sTitle;
            ModelsManager.insertRecord("items_strings", itemStrings);

            var userItem = ModelsManager.createRecord("users_items");
            userItem.idUser = user.ID;
            userItem.idItem = item.ID;
            ModelsManager.insertRecord("users_items", userItem);
            return item;
        }

        function addItem(item) {
            var itemItem = ModelsManager.createRecord("items_items");
            itemItem.idItemParent = $scope.item.ID;
            itemItem.idItemChild = item.ID;
            var iChildOrder = 0;
            angular.forEach($scope.item.children, function(child) {
                if(child.iChildOrder > iChildOrder) {
                    iChildOrder = child.iChildOrder;
                }
            })
            itemItem.iChildOrder = iChildOrder + 1;
            ModelsManager.insertRecord("items_items", itemItem);
            $rootScope.$broadcast('algorea.reloadView', 'right');
        }

        function deleteItemItem(item_item) {
            // Delete an item_item link
            if(!item_item) { return; }
            ModelsManager.deleteRecord('items_items', item_item.ID);
            recalculateItemsOrder(item_item.parent);
            $rootScope.$broadcast('algorea.reloadView', 'right');
        }

        function destroyItem(item) {
            // Delete an item from the database
            // TODO :: delete all links and associated data
            if(!item) { return; }
            if(itemService.getClipboard().ID == item.ID) {
                itemService.setClipboard(null);
            }
            ModelsManager.deleteRecord('items', item_item.idItemChild);
        }


        $scope.addNewChapter = function() {
            $scope.creating = {
                sType: 'Task',
                icon: 'folder',
                placeholder: 'New chapter',
                name: ''
                }
        }

        $scope.addNewTask = function() {
            $scope.creating = {
                sType: 'Task',
                icon: 'keyboard',
                placeholder: 'New task',
                name: ''
                }
        }

        $scope.create = function() {
            if(!$scope.creating || !$scope.creating.name) { return; }
            var item = createItem($scope.creating.sType, $scope.creating.name);
            addItem(item);
            $scope.creating = null;
        }

        $scope.cancelCreate = function() {
            $scope.creating = null;
        }

        $scope.addExistingItem = function() {
            $uibModal.open({
                templateUrl: '/navigation/views/chapter/browse-items-dialog.html',
                controller: 'chapterEditorBrowserController',
                resolve: {
                    callback: function() {
                        return function(item) {
                            addItem(item);
                        }
                    },
                    startItem: function() {
                        return $scope.item;
                    },
                    startPath: function() {
                        return pathService.getPathParams('right').path;
                    }
                },
                backdrop: 'static',
                keyboard: false
            });
        }

        // Clipboard
        $scope.copyItem = function(item) {
            itemService.setClipboard({
                ID: item.ID,
                title: item.strings[0].sTitle
            });
        }


        $scope.cutItem = function(item) {
            itemService.setClipboard({
                ID: item.ID,
                title: item.strings[0].sTitle,
                cut: getItemItem(item) // Remove this item_item when we paste
            });
        }


        $scope.pasteItem = function() {
            var clipboard = itemService.getClipboard();
            if(!clipboard) { return; }

            var item = ModelsManager.getRecord('items', clipboard.ID);
            addItem(item);
            if(clipboard.cut) {
                // Item was cut, remove former link
                deleteItemItem(clipboard.cut);
            }
        }


        $scope.removeItem = function(item) {
            // Show popup to remove an item
            var item_item = getItemItem(item);
            $uibModal.open({
                templateUrl: '/navigation/views/chapter/delete-dialog.html',
                controller: function($scope) {
                    $scope.close = function () {
                        $scope.$close();
                    };
                    $scope.removeItem = function () {
                        deleteItemItem(item_item);
                        $scope.$close();
                    };
                    $scope.destroyItem = function () {
                        destroyItem(item);
                        $scope.$close();
                    };
                },
                backdrop: 'static',
                keyboard: false
            });
        }


        function recalculateItemsOrder(parentItem) {
            // Recalculate the order for parentItem's children
            if(parentItem.bFixedRanks) {
                return;
            }
            var iChildOrder = {}
            $.each(parentItem.children, function(idx, itemItem) {
                itemItem.iChildOrder = idx+1;
                ModelsManager.updated('items_items', itemItem.ID);
            });
        }

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




angular.module('algorea')
.controller('chapterEditorBrowserController', [
    '$scope', 'itemService', '$uibModalInstance', 'startItem', 'startPath', 'callback',
    function($scope, itemService, $uibModalInstance, startItem, startPath, callback) {



        var path = startPath.slice();
        path.pop();


        $scope.openItem = function(item, path_skip) {
            if($scope.item && !path_skip) {
                path.push($scope.item.ID);
            }
            $scope.item = item;
            $scope.children = itemService.getChildren(item);
        }



        $scope.haveParent = function() {
            return $scope.item && $scope.item.ID != path[0];
        }


        $scope.openParent = function() {
            var parentId = path.pop();
            if(parentId) {
                var parent = ModelsManager.getRecord('items', parentId);
                $scope.openItem(parent, true);
            }
        }


        $scope.select = function(item) {
            $uibModalInstance.dismiss('cancel');
            callback(item);
        }


        $scope.close = function() {
            $uibModalInstance.dismiss('cancel');
        }


        $scope.openItem(startItem);
    }
]);
