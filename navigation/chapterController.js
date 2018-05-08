'use strict';

angular.module('algorea')
.controller('chapterController', [
    '$rootScope', '$scope', 'itemService', '$state', '$i18next', '$uibModal', 'loginService', '$timeout',
    function ($rootScope, $scope, itemService, $state, $i18next, $uibModal, loginService, $timeout) {

        $scope.sortableOptions = {
            handle: '.drag-ctrl',
            stop: function(event, ui) {
                var iChildOrder = {}
                $.each($scope.items, function(idx, item) {
                    iChildOrder[item.ID] = idx + 1;
                });
                $.each($scope.item.children, function(idx, itemItem) {
                    itemItem.iChildOrder = iChildOrder[itemItem.idItemChild];
                    ModelsManager.updated('items_items', itemItem.ID);
                });
            }
        }

        // sync does not work without this
        SyncQueue.requests = {
           algorea: {
              admin: true
           }
        };


        var user = null;
        loginService.getLoginData(function(res) {
            user = res;
        })


        //TODO:
        $scope.editable = function() {
            // TODO: test access
            return true;

        }
        $scope.mode = 'view';
//$scope.mode = 'edit'; // testing

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
        $scope.items = itemService.getChildren($scope.item);

        $scope.$on('algorea.reloadView', function(event, view) {
            if(view == 'right') {
                $scope.items = itemService.getChildren($scope.item);
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

        function createItem() {
            var item = ModelsManager.createRecord("items");
            item.bOwnerAccess = true;
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
            groupItem.sPropagateAccess = 'self'; //TODO: remove
            ModelsManager.insertRecord("groups_items", groupItem);

            var itemStrings = ModelsManager.createRecord("items_strings");
            itemStrings.idItem = item.ID;
            itemStrings.idLanguage = 1; // TODO: handle this
            itemStrings.sTitle = $i18next.t('chapterEditor_new_item_title');
            ModelsManager.insertRecord("items_strings", itemStrings);
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



        function deleteItem(item, destroy) {
            var item_item = null;
            angular.forEach(item.parents, function(ii) {
                if(ii.idItemParent == $scope.item.ID) {
                    item_item = ii;
                }
            });
            var iChildOrder = item_item['iChildOrder'];
            if(destroy) {
                if($scope.clipboard && $scope.clipboard.ID == item.ID) {
                    $scope.clipboard = null;
                }
                ModelsManager.deleteRecord('items', item_item.idItemChild);
            }
            ModelsManager.deleteRecord('items_items', item_item.ID);
            //changeChildrenOrderBetween($scope.item, -1, iChildOrder + 1);
            $rootScope.$broadcast('algorea.reloadView', 'right');
        }


        $scope.addNewItem = function() {
            var item = createItem();
            addItem(item)
        }



        $scope.addExistingItem = function() {
            $uibModal.open({
                templateUrl: '/navigation/views/chapter/browse-items-dialog.html',
                controller: 'chapterEditorBrowserController',
                resolve: {
                    callback: function() {
                        return function(item) {
                            console.log(item)
                            addItem(item)
                        }
                    },
                    startItem: function() {
                        return $scope.item
                    }
                },
                backdrop: 'static',
                keyboard: false
            });
        }

        // clipboard

        $scope.clipboard = null;
        $scope.copyItem = function(item) {
            $scope.clipboard = {
                ID: item.ID,
                title: item.strings[0].sTitle
            }
        }


        $scope.cutItem = function(item) {
            $scope.clipboard = {
                ID: item.ID,
                title: item.strings[0].sTitle
            }
            deleteItem(item)
        }


        $scope.pasteItem = function() {
            var item = ModelsManager.getRecord('items', $scope.clipboard.ID);
            addItem(item)
        }




        $scope.removeItem = function(item) {
            $uibModal.open({
                templateUrl: '/navigation/views/chapter/delete-dialog.html',
                controller: function($scope) {
                    $scope.close = function () {
                        $scope.$close();
                    };
                    $scope.removeItem = function () {
                        deleteItem(item, false);
                        $scope.$close();
                    };
                    $scope.destroyItem = function () {
                        deleteItem(item, true);
                        $scope.$close();
                    };
                },
                backdrop: 'static',
                keyboard: false
            });
        },


        /// need it ???
        /*
        function changeChildrenOrderBetween(object, delta, beginOrder, endOrder) {
            var maxOrder = 0;
            var minOrder = 1000000000;
            var iRelation, relation;
            $.each(object.children, function(iRelation, relation) {
               var relationOrder = relation['iChildOrder'];
               if (relationOrder > maxOrder) {
                  maxOrder = relationOrder;
               }
               if (relationOrder < minOrder) {
                  minOrder = relationOrder;
               }
            });
            if (endOrder == undefined) {
               endOrder = maxOrder + 1;
            }
            if (beginOrder == undefined) {
               beginOrder = minOrder;
            }
            $.each(object.children, function(iRelation, relation) {
               var prevOrder = relation['iChildOrder'];
               if ((prevOrder >= beginOrder) && (prevOrder < endOrder)) {
                  relation['iChildOrder'] = relation['iChildOrder']+delta;
                  ModelsManager.updated('items_items', relation.ID);
               }
            });
        },
        */

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
    '$scope', 'itemService', '$uibModalInstance', 'startItem', 'callback',
    function($scope, itemService, $uibModalInstance, startItem, callback) {

        $scope.openItem = function(item) {
            $scope.item = item;
            $scope.children = itemService.getChildren(item);
        }


        $scope.openParent = function() {
            console.log($scope.item.item_item_ID)
            var itemItem = ModelsManager.getRecord('items_items', $scope.item.item_item_ID);
            var item = ModelsManager.getRecord('items', itemItem.idItemParent);
            $scope.openItem(item)
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