'use strict';

angular.module('algorea')
.controller('chapterController', [
    '$rootScope', '$scope', 'itemService', '$state', '$i18next', '$uibModal', 'loginService',
    function ($rootScope, $scope, itemService, $state, $i18next, $uibModal, loginService) {

        var that = this;

        $scope.models = models;
        $scope.sortable_options = {
            handle: '.drag-ctrl'
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
            for(var k in $scope.item.children) {
                if($scope.item.children[k].iChildOrder > iChildOrder) {
                    iChildOrder = $scope.item.children[k].iChildOrder;
                }
            }
            itemItem.iChildOrder = iChildOrder + 1;
            ModelsManager.insertRecord("items_items", itemItem);
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
                ModelsManager.deleteRecord('items', item_item.idItemChild);
            }
            ModelsManager.deleteRecord('items_items', item_item.ID);
            that.changeChildrenOrderBetween($scope.item, -1, iChildOrder + 1);
        }



        $scope.addNewItem = function() {
            //console.log($scope.item);return
            var item = createItem();
            addItem(item)
        }



        $scope.clipboard = null;
        $scope.copyItem = function(item) {
            console.log(item)
            $scope.clipboard = {
                ID: item.ID,
                title: $scope.item.strings[0].sTitle
            }
        }


        $scope.cutItem = function() {

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


        this.changeChildrenOrderBetween = function(object, delta, beginOrder, endOrder) {
            if(this.childrenFixedRanksName && object[this.childrenFixedRanksName]) {
               return;
            }
            var that = this;
            var maxOrder = 0;
            var minOrder = 1000000000;
            var iRelation, relation;
            $.each(object.children, function(iRelation, relation) {
               var relationOrder = relation[that.iChildOrderFieldName];
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
               var prevOrder = relation[that.iChildOrderFieldName];
               if ((prevOrder >= beginOrder) && (prevOrder < endOrder)) {
                  relation[that.iChildOrderFieldName] = relation[that.iChildOrderFieldName]+delta;
                  ModelsManager.updated(that.relationsModelName, relation.ID);
               }
            });
        },


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