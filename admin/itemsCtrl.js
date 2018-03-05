"use strict";

var app = angular.module('algorea', ['ui.bootstrap', 'franceIOILogin', 'ngSanitize', 'ngAnimate', 'jm.i18next']);

angular.module('algorea')
   .config(['$sceDelegateProvider', function ($sceDelegateProvider) {
      if (config.domains.current.assetsBaseUrl) {
         $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            config.domains.current.assetsBaseUrl+'**'
         ]);
      }
      }]);

angular.module('algorea')
   .run(['$rootScope', function ($rootScope) {
      $rootScope.templatesPrefix = (config.domains.current.compiledMode || !config.domains.current.assetsBaseUrl) ? '' : config.domains.current.assetsBaseUrl;
   }]);

app.directive('field', ['$rootScope', function($rootScope) {
   return {
      restrict: 'E',
      scope: {
         model: '=',
         compare: '=',
         readonly: '@'
      },
      link: function(scope, elem, attrs) {
         var parts = attrs.field.split(".");
         scope.field = models[parts[0]].fields[parts[1]];
         scope.fieldname = parts[1];
      },
      controller: ['$scope', function($scope) {
            $scope.onChange = function() {
               if ($scope.field.type == "duration") {
                  var v = ($scope.model[$scope.fieldname] || '').trim();
                  if(v == '' || v == '00:00:00') {
                     $scope.model[$scope.fieldname] = null;
                  }
               }
            };
         $scope.clear = function() {
            if ($scope.field.type == "jsdate") {
               $scope.model[$scope.fieldname] = null;
            } else if ($scope.field.type == "duration") {
               $scope.model[$scope.fieldname] = null;
            }
         };
      }],
      templateUrl: $rootScope.templatesPrefix+"/commonFramework/angularDirectives/formField.html",
      replace: true
   };
}]);

angular.module('algorea')
   .controller('adminCtrl', ['$scope', '$rootScope', 'loginService', '$sce', '$location', '$timeout', function($scope, $rootScope, loginService, $sce, $location, $timeout) {
      $scope.userLogged = false;

      $scope.loginReady = true;
      $scope.loginClass = 'loginCentered';
      $scope.loginInnerHtml = '';
      $scope.loginModuleUrl = $sce.trustAsResourceUrl(config.domains.current.baseUrl + '/login/popup_redirect.php?action=login');
      loginService.init();

      $scope.$on('login.login', function(event, data) {
         if (data.tempUser) {
            $scope.userLogged = false;
            $scope.loginReady = true;
            $scope.loginClass = 'loginCentered';
            $scope.loginInnerHtml = '';
            $timeout(function() {});
         } else {
            $scope.userLogged = true;
            $scope.loginReady = true;
            $scope.loginInnerHtml = 'logged as ' + data.login;
            $scope.loginClass = 'loginCorner';
         }
      });
      $scope.$on('login.update', function(event, data) {
            $scope.userLogged = true;
            $scope.loginReady = true;
            $scope.loginInnerHtml = 'logged as ' + data.login;
            $scope.loginClass = 'loginCorner';
      });
      $scope.$on('login.notlogged', function(event, data) {
         $scope.userLogged = false;
         $scope.loginReady = true;
         $scope.loginClass = 'loginCentered';
         $scope.loginInnerHtml = '';
         $timeout(function() {});
      });

      $scope.$on('login.logout', function(event, data) {
         $scope.userLogged = false;
         $scope.loginReady = true;
         $scope.loginClass = 'loginCentered';
         $scope.loginInnerHtml = '';
         $timeout(function() {});
      });
   }]);

angular.module('algorea')
   .controller('ItemsCtrl', ['$scope', '$rootScope', '$uibModal', 'loginService', '$i18next', function($scope, $rootScope, $uibModal, loginService, $i18next) {
      $scope.models = models;
      $scope.inForum = true;// TODO: used by tasks, should be better
      $scope.accessManager = AccessManager;
      $scope.getGroupItem = getGroupItem;
      $scope.categoryNames = { // TODO : should not be needed anymore
         Undefined: "Indéfini",
         Challenge: "Challenge",
         Course: "Cours",
         Discovery: "Découverte",
         Validation: "Validation",
         Application: "Application"
      };
      $scope.longCategoryNames = models.items_items.fields.sCategory.values;
      $scope.longValidationTypesNames = models.items.fields.sValidationType.values;
      $scope.smallCategoryNames = { // TODO : should not be needed anymore
         Undefined: "I",
         Challenge: "Ch",
         Course: "C",
         Discovery: "D",
         Validation: "V",
         Application: "A"
      };
      $scope.validationTypesNames = { // TODO : should not be needed anymore
         None: "Aucune",
         All: "Tous",
         AllButOne: "Tous sauf un",
         One: "Au moins un",
         Categories: "Catégories"
      };
      $scope.date = '19/03/2013';
      $scope.test = function() {
         alert('test');
      };
      $scope.selectedView = 'itemsEditable';
      $scope.selectView = function(view) {
         $scope.selectedView = view;
      };
      $scope.itemIsExpanded = true;
      $scope.toggleItemExpanded = function() {
         this.itemIsExpanded = !this.itemIsExpanded;
         $scope.loadGrandChildren(this.item_item.child);
      };

      $scope.hasChildren = function(item) {
         return item && objectHasProperties(item.children);
      };

      $scope.saveObject = function(modelName, record) {
         if (record) {
            ModelsManager.updated(modelName, record.ID);
            if (modelName == 'groups') {
               $scope.groupsTreeView1.triggers.objectUpdated(record);
               $scope.groupsTreeView2.triggers.objectUpdated(record);
            } else if(modelName == 'items') {
               $scope.itemsTreeView1.triggers.objectUpdated(record);
               $scope.itemsTreeView2.triggers.objectUpdated(record);
            }
         }
      };

      $scope.hasObjectChanged = function(modelName, record) {
         if (!record) {
            return false;
         }
         return ModelsManager.hasRecordChanged(modelName, record.ID);
      };

      $scope.resetObjectChanges = function(modelName, record) {
         if (record) {
            ModelsManager.resetRecordChanges(modelName, record.ID);
         }
      };

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

      function getGroupAncestors(group, ancestors) {
         if (!group || !group.parents) return;
         ancestors[group.ID] = true;
         angular.forEach(group.parents, function(group_group_parent) {
            getGroupAncestors(group_group_parent.parent, ancestors);
         });
      }

      $scope.computeAccessRights = function(to_group, item_item) {
         var child_group_item = getGroupItem($scope.loginData.idGroupSelf, item_item.child.ID);
         if (!to_group || !child_group_item || (!child_group_item.bOwnerAccess && !child_group_item.bManagerAccess)) {
            this.canGiveAccess = false;
            this.canRemoveAccess = false;
            this.canGiveAccessReason = $i18next.t('groupAdmin_manager_required');
            return false;
         }
         var that = this;
         this.canRemoveAccess = true;
         var parent = item_item.parent;
         // can't remove access if group has a direct access to a child item
         angular.forEach(item_item.child.children, function(child) {
            if (!that.canRemoveAccess) {return false;}
            angular.forEach(child.child.group_items, function(group_item) {
               if (group_item.idGroup == to_group.ID &&
                     (group_item.sFullAccessDate ||
                        group_item.sPartialAccessDate ||
                        group_item.sSolutionAccessDate ||
                        group_item.bManagerAccess ||
                        group_item.bOwnerAccess)) {
                  console.error('cannot remove access because of '+child.child.ID);
                  that.canRemoveAccess = false;
                  return false;
               }
            });
         });
         // we can give and remove access if parent is a root item
         if (parent.ID === config.domains.current.OfficialProgressItemId ||
               parent.ID === config.domains.current.CustomProgressItemId ||
               parent.ID === config.domains.current.CustomContestRootItemId ||
               parent.ID === config.domains.current.OfficialContestRootItemId ||
               parent.ID === config.domains.current.ProgressRootItemId ||
               parent.ID === config.domains.current.ContestRootItemId) {
            this.canGiveAccess = true;
            that.canRemoveAccess = true;
            return true;
         }
         this.canGiveAccess = false;
         var group_ancestors = {};
         getGroupAncestors(to_group, group_ancestors);
         angular.forEach(parent.group_items, function(group_item) {
            if (group_ancestors[group_item.idGroup] && (group_item.bCachedFullAccess || group_item.bCachedPartialAccess)) {
               that.canGiveAccess = true;
               return true;
            }
         });
         this.canGiveAccessReason = $i18next.t('groupAdmin_parent_access_required');
         return this.canGiveAccess;
      };

      $scope.newItem = function(itemItemID) {
         if (!$scope.checkUserRight(itemItemID, 'items_items', 'insert')) {
            alert($i18next.t('groupAdmin_add_here_unauthorized'));
            return;
         }
         if (!$scope.checkSaveItem()) {
            return;
         }
         var item = ModelsManager.createRecord("items");
         item.bOwnerAccess = true;
         ModelsManager.insertRecord("items", item);
         var groupItem = ModelsManager.createRecord("groups_items");
         groupItem.idItem = item.ID;
         groupItem.idGroup = $scope.loginData.idGroupSelf;
         var accessStartDate = new Date();
         accessStartDate.setDate(accessStartDate.getDate() - 1);
         groupItem.sFullAccessDate = accessStartDate;
         groupItem.bCachedFullAccess = true;
         groupItem.bOwnerAccess = true;
         groupItem.idUserCreated = $scope.loginData.ID;
         groupItem.sPropagateAccess = 'self'; //TODO: remove
         ModelsManager.insertRecord("groups_items", groupItem);

         var itemStrings = ModelsManager.createRecord("items_strings");
         itemStrings.idItem = item.ID;
         itemStrings.idLanguage = 1; // TODO: handle this
         itemStrings.sTitle = $i18next.t('groupAdmin_new_item');
         ModelsManager.insertRecord("items_strings", itemStrings);

         var itemItemParent = ModelsManager.getRecord("items_items", itemItemID);
         var itemItem = ModelsManager.createRecord("items_items");
         itemItem.idItemParent = itemItemParent.idItemChild;
         var parentItem = ModelsManager.getRecord('items', itemItemParent.idItemChild);
         itemItem.idItemChild = item.ID;
         itemItem.iChildOrder = $scope.itemsTreeView1.firstAvailableOrder(parentItem);
         ModelsManager.insertRecord("items_items", itemItem);

         // angular.forEach(parentItem.group_items, function(group_item) {
         //    group_item.sPropagateAccess = 'children';
         //    ModelsManager.updated('groups_items', group_item.ID);
         // });
         $scope.itemItem = itemItem;
         $scope.item = item;
         $scope.group_item = groupItem;
         $scope.item_strings = itemStrings;
         $scope.item_strings_compare = {};
         $scope.availableLocales = ModelsManager.getRecords('languages');
      };

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

      $scope.newGroup = function(groupGroupID) {
         var group = ModelsManager.createRecord("groups");
         group.sName = $i18next.t('groupAdmin_new_group');
         group.sType = "Class";
         group.sDateCreated = new Date();
         ModelsManager.insertRecord("groups", group);
         var groupGroupParent = ModelsManager.getRecord("groups_groups", groupGroupID);
         var groupGroup = ModelsManager.createRecord("groups_groups");
         groupGroup.idGroupParent = groupGroupParent.child.ID;
         groupGroup.idGroupChild = group.ID;
         groupGroup.sRole = 'owner';
         groupGroup.sType = 'direct';
         groupGroup.iChildOrder = $scope.groupsTreeView1.firstAvailableOrder(group);
         ModelsManager.insertRecord("groups_groups", groupGroup);
         $scope.groupGroup = groupGroup;
         $scope.group = group;
      };

      $scope.deleteGroupGroup = function(groupGroup) {
         if (groupGroup.child.sType == 'UserSelf') {
            groupGroup.sType = 'removed';
            groupGroup.sStatusDate = new Date();
            ModelsManager.updated('groups_groups', groupGroup.ID);
         } else {
            ModelsManager.deleteRecord('groups_groups', groupGroup.ID);
         }
      };

      // mechanism to load grand children
      var loadGrandChildrenOf = [];
      var loadGrandChildrenOfThisSync = [];
      SyncQueue.addSyncStartListeners("loadGrandChildren", function() {
         loadGrandChildrenOfThisSync = loadGrandChildrenOf;
         loadGrandChildrenOf = [];
      });
      SyncQueue.addSyncEndListeners("loadGrandChildren", function() {
         angular.forEach(loadGrandChildrenOfThisSync, function(item, ID) {
            $scope.loadGrandChildren(item);
         });
      });
      $scope.loadGrandChildren = function(item) {
         $scope.loadChildren(item);
         loadGrandChildrenOf.push(item);
         angular.forEach(item.children, function(child){
            $scope.loadChildren(child.child);
         });
      };

      $scope.loadChildren = function(item) {
         if (!angular.equals([], item.children)) {
            return;
         }
         if (!SyncQueue.requests.expandedItems) {
            SyncQueue.requests.expandedItems = {};
         }
         if (!SyncQueue.requests.expandedItems[item.ID]) {
            SyncQueue.requests.expandedItems[item.ID] = {
               itemID: item.ID,
               resetMinVersion: true
            };
            SyncQueue.planToSend();
         }
      };

      $scope.itemExpanded = function(itemID) {
         var item = ModelsManager.getRecord("items", itemID);
         angular.forEach(item.children, function(itemItem) {
            $scope.loadGrandChildren(itemItem.child);
         });
      };

      $scope.itemSelected = function(itemID, withItemItem) {
         if (!$scope.checkSaveItem()) {
            return;
         }
         if (!withItemItem) {
            $scope.item_item = null;
         }
         if (!itemID){
            $scope.item = null;
            $scope.item_strings = null;
            $scope.item_strings_compare = null;
            $scope.$broadcast('admin.itemSelected');
            return;
         }
         $scope.item = ModelsManager.getRecord("items", itemID);
         $scope.group_item = getGroupItem($scope.loginData.idGroupSelf, itemID);
         var my_group = ModelsManager.getRecord("groups", $scope.loginData.idGroupSelf);
         $scope.my_user_item = getUserItem(my_group, $scope.item);
         $scope.item_strings = $scope.item.strings[0];
         $scope.item_strings_compare = null;
         $scope.availableLocales = ModelsManager.getRecords('languages');
         $scope.$broadcast('admin.itemSelected');
         $scope.$apply();
         $scope.loadGrandChildren($scope.item);
      };

      $scope.itemItemSelected = function(itemItemID) {
         if (!$scope.checkSaveItem()) {
            return;
         }
         var itemItem = ModelsManager.getRecord("items_items", itemItemID);
         $scope.item_item = itemItem;
         $scope.group_item = itemItem ? getGroupItem($scope.loginData.idGroupSelf, itemItem.child.ID) : null;
         $scope.itemSelected(itemItem ? itemItem.idItemChild : null, true);
         $scope.zip_message = false;
      };

      $scope.groupSelected = function(groupID, withGroupGroup) {
         if (!withGroupGroup) {
            $scope.group_group = null;
         }
         $scope.group = ModelsManager.getRecord("groups", groupID);
         $scope.user = $scope.getUser($scope.group);
         $scope.$broadcast('admin.groupSelected');
         $scope.$apply();
      };

      $scope.getUser = function(group) {
         var res = null;
         angular.forEach(group.userSelf, function(user) {
            res = user;
         });
         if (res) {
            return res;
         }
         angular.forEach(group.userAdmin, function(user) {
            res = user;
         });
         if (res) {
            return res;
         }
         angular.forEach(group.userAccess, function(user) {
            res = user;
         });
         return res;
      };

      $scope.groupGroupSelected = function(groupGroupID) {
         var groupGroup = ModelsManager.getRecord("groups_groups", groupGroupID);
         $scope.group_group = groupGroup;
         if (groupGroup) { // Happens when we click on "Unused objects"
            $scope.groupSelected(groupGroup.idGroupChild, true);
         }
         $scope.zip_message = false;
      };

      $scope.checkFields = function(item, fields, searchParams) {
         for (var iField = 0; iField < fields.length; iField++) {
            var field = fields[iField];
            if ((searchParams[field]) && ((!item[field]) || (item[field].indexOf(searchParams[field]) < 0))) {
               return false;
            }
         }
         return true;
      };

      $scope.searchItems = function(searchParams) {
         var allItems = ModelsManager.getRecords("items");
         var foundItems = {};
         var itemsFields = ["sTextId", "sType"];
         var stringsFields = ["sTitle", "sSubtitle", "sDescription"];
         for (var itemID in allItems) {
            var found = true;
            var item = allItems[itemID];
            found &= $scope.checkFields(item, itemsFields, searchParams);
            found &= $scope.checkFields(item.strings[0], stringsFields, searchParams);
            if (found) {
               foundItems[itemID] = item;
            }
         }
         $scope.itemsTreeView1.addSearchResults(foundItems);
      };

      $scope.searchGroups = function(searchParams) {
         var allGroups = ModelsManager.getRecords("groups");
         var foundGroups = {};
         var fields = ["sName", "sType", "sDescription"];
         for (var groupID in allGroups) {
            var found = true;
            var group = allGroups[groupID];
            found &= $scope.checkFields(group, fields, searchParams);
            if (found) {
               foundGroups[groupID] = group;
            }
         }
         $scope.groupsTreeView1.addSearchResults(foundGroups);
      };

      $scope.selectModelName = function(newModelName) {
         $scope.selectedModelName = newModelName;
         if ((newModelName == 'items') && (!$scope.item)) {
            $scope.showItems = true;
         }
         if ((newModelName == 'groups') && (!$scope.group)) {
            $scope.showGroups = true;
         }
      };

      $scope.checkUserRight = function(recordID, recordModel, action) {
         var record = ModelsManager.getRecord(recordModel, recordID);
         var group_item;
         if (!record) return false;
         if (recordModel == 'items_items') {
            if (action == 'delete' && record.parent.bCustomChapter) {
               return true;
            }
            if (action == 'insert' && record.child.bCustomChapter) {
                  return true;
            }
            if (action == 'delete') {
               group_item = getGroupItem($scope.loginData.idGroupSelf, record.parent.ID);
               return group_item && group_item.bOwnerAccess;
            }
            if (action == 'insert') {
               group_item = getGroupItem($scope.loginData.idGroupSelf, record.child.ID);
               return group_item && (group_item.bOwnerAccess || group_item.bManagerAccess);
            }
            return true;
         }
      };

      $scope.initItems = function() {
         var treeViewSharedData = {
            copiedObjectObject: null,
            isDropping: false
         };
         var getItemTitle = function(item, item_item, noHtml) {
            var title = "";
            if (item.strings.length === 0) {
               title = $i18next.t('groupAdmin_loading');
            } else {
               title = item.strings[0].sTitle; // TODO :: get strings depending on language
            }
            var accessStr = '';
            var accessStrEnd = '';
            if(!noHtml) {
               var group_item = getGroupItem($scope.loginData.idGroupSelf, item.ID);
               if (group_item && group_item.bOwnerAccess) {
                  accessStr = '<span class="dynatree-owner">';
                  accessStrEnd = '</span>';
               } else if (group_item && group_item.bManagerAccess) {
                  accessStr = '<span class="dynatree-manager">';
                  accessStrEnd = '</span>';
               }
            }
            return accessStr + "[" + item.sType + "] " + title + accessStrEnd;
         };
         var paramsItems = {
            objectsModelName: "items",
            objectsStringsModelName: "items_strings",
            objectFieldName: "item",
            relationsModelName: "items_items",
            idChildFieldName: "idItemChild",
            idParentFieldName: "idItemParent",
            iChildOrderFieldName: "iChildOrder",
            parentsFieldName: "parents",
            childrenFieldName: "children",
            childrenFixedRanksName: "bFixedRanks",
            parentFieldName: "parent",
            childFieldName: "child",
            displayUnused: false,
            isObjectRoot: function(object) {
               return (object.ID == config.RootItemId);
            },
            getObjectTitle: getItemTitle,
            checkUserRight: $scope.checkUserRight,
            objectSelected: $scope.itemSelected,
            objectExpanded: $scope.itemExpanded,
            relationSelected: $scope.itemItemSelected,
            compareRelations: function(itemItemA, itemItemB) {
               if (!itemItemA || !itemItemB) {
//                  console.error('itemItemA: ');
//                  console.error(itemItemA);
//                  console.error('itemItemB: ');
//                  console.error(itemItemB);
                  return -1;
               }
               if (itemItemA.iChildOrder < itemItemB.iChildOrder) {
                  return -1;
               }
               return 1;
            },
            createChild: $scope.newItem
         };
         $scope.itemsTreeView1 = new TreeView("treeItems", treeViewSharedData, paramsItems);
         $scope.itemsTreeView1.fillTree();
         $scope.itemsTreeView2 = new TreeView("treeItems2", treeViewSharedData, paramsItems);
         $scope.itemsTreeView2.fillTree();
      };


      $scope.zip_btn_disabled = false;
      $scope.zip_message = false;
      $scope.zipExport = function(itemId, groupId) {
            $scope.zip_btn_disabled = true;
            $scope.zip_message = 'Please wait...';
            $scope.zip_url = null;
            $.ajax({
                  type: 'GET',
                  url: 'zip_export.php',
                  data: {
                        itemId: itemId,
                        groupId: groupId
                  },
                  success: function(res) {
                        $scope.zip_btn_disabled = false;
                        if(res && res.file) {
                              $scope.zip_message = false;
                              $scope.zip_url = res.file;
                        } else {
                              $scope.zip_message = res;
                        }
                  },
                  error: function(request, status, err) {
                        $scope.zip_btn_disabled = false;
                        $scope.zip_message = err;
                  }
            });
      }

      $scope.zipDownload = function() {
         if($scope.zip_url) { window.location = $scope.zip_url; }
      }

      $scope.initGroups = function() {
         $scope.initGroupsDone = true;
         var rootGroupID;
         function filterGroupGroup(group_group){
            if (!filterGroup(group_group.parent) || !filterGroup(group_group.child)) {
               return false;
            }
            if (group_group.sType === 'invitationAccepted' ||
               group_group.sType === 'requestAccepted' ||
               group_group.sType === 'direct') {
                  return true;
               }
            return false;
//            return true;
         }
         function filterGroup(group) {
            if (group && (group.sType == 'RootSelf' || group.sType == 'RootAdmin')) {
               return false;
            }
            return true;
         }
         function createRootGroup() {
            if (rootGroupID) return;
            var rootGroup = ModelsManager.createRecord('groups');
            rootGroupID = rootGroup.ID;
            rootGroup.sType = 'Root';
            ModelsManager.curData.groups[rootGroup.ID] = rootGroup;
            ModelsManager.setLinks('groups', rootGroup);
         }
         function createRelation(idGroup, iChildOrder) {
            var newRelation = ModelsManager.createRecord('groups_groups');
            newRelation.idGroupParent = rootGroupID;
            newRelation.idGroupChild = idGroup;
            newRelation.iChildOrder = iChildOrder;
            ModelsManager.curData.groups_groups[newRelation.ID] = newRelation;
            ModelsManager.setLinks('groups_groups', newRelation);
            $scope.groupsTreeView1.triggers.relationInserted(newRelation);
            $scope.groupsTreeView2.triggers.relationInserted(newRelation);
         }
         function createRelations(idGroupOwned, idGroupSelf) {
            var groupSelf = ModelsManager.getRecord('groups', idGroupOwned);
            var groupOwned = ModelsManager.getRecord('groups', idGroupOwned);
            if (groupSelf) {
               createRelation(idGroupSelf, 0);
            }
            if (groupOwned) {
               createRelation(idGroupOwned, 1);
            }
            if (!groupOwned || !groupSelf) {
               ModelsManager.addListener('groups', 'inserted', 'addFakeRoot', function(group) {
                  if (group.ID == idGroupOwned) {
                     createRelation(idGroupOwned, 1);
                  } else if (group.ID == idGroupSelf) {
                     createRelation(idGroupSelf, 0);
                  }
               });
            }
         }
         loginService.getLoginData(function(data) {
            createRootGroup();
            createRelations(data.idGroupOwned, data.idGroupSelf);
            $scope.loginData = data;
         });

         function getGroupTitle(group, group_group, noHtml) {
            var suffix = '';
            var preprefix = '';
            if (group_group && !noHtml && group_group.sType !== 'invitationAccepted' &&
                  group_group.sType !== 'requestAccepted' &&
                  group_group.sType !== 'direct') {
               preprefix = '<span style="color:gray;">';
               suffix = '</span>';
            }
            var prefix = models.groups.fields.sType.values[group.sType ? group.sType : 'Other'].label + " : ";
            if (group.sType == 'UserSelf') {
               if ($scope.loginData.idGroupSelf == group.ID) {
                  prefix = $i18next.t('groupAdmin_account_mine');
               } else {
                  prefix = $i18next.t('groupAdmin_account_other');
               }
            }
            if (group.sType == 'UserAdmin') {
               if ($scope.loginData.idGroupOwned == group.ID) {
                  return $i18next.t('groupAdmin_groups_mine') +' ('+group.sName+')';
               } else {
                  prefix = $i18next.t('groupAdmin_groups_other')+' : ';
               }
            }
            return preprefix+prefix + group.sName + suffix;
         }
         var paramsGroups = {
            objectsModelName: "groups",
            objectsStringsModelName: null,
            objectFieldName: null,
            relationsModelName: "groups_groups",
            idChildFieldName: "idGroupChild",
            idParentFieldName: "idGroupParent",
            iChildOrderFieldName: "iChildOrder",
            parentsFieldName: "parents",
            childrenFieldName: "children",
            parentFieldName: "parent",
            childFieldName: "child",
            displayUnused: false,
            isObjectRoot: function(object) {
               return (object.sType == "Root");
            },
            getObjectTitle: getGroupTitle,
            objectFilter: filterGroup,
            relationFilter: filterGroupGroup,
            objectSelected: $scope.groupSelected,
            relationSelected: $scope.groupGroupSelected,
            deleteRelation: $scope.deleteGroupGroup,
            compareRelations: function(groupGroupA, groupGroupB) {
               if (!groupGroupA || !groupGroupB || groupGroupA.iChildOrder < groupGroupB.iChildOrder) {
                  return -1;
               }
               return 1;
            },
            createChild: $scope.newGroup
         };
         var groupsSharedData = {
            copiedObjectObject: null,
            isDropping: false
         };
         $scope.groupsTreeView1 = new TreeView("treeGroups", groupsSharedData, paramsGroups);
         $scope.groupsTreeView1.fillTree();
         $scope.groupsTreeView2 = new TreeView("treeGroups2", groupsSharedData, paramsGroups);
         $scope.groupsTreeView2.fillTree();
      };

      $scope.showGenDialog = function(templateUrl, modelName, recordName, record) {
         var thisScope = this;
         var options = {
            templateUrl: templateUrl,
            controller: 'GenDialogCtrl',
            scope: thisScope,
            resolve: {
               group_group: function() {
                  return thisScope.group_group;
               },
               item_item: function() {
                  return thisScope.item_item;
               },
               modelName: function() {
                  return modelName;
               },
               recordName: function() {
                  return recordName;
               },
               record: function() {
                  return record;
               },
               canRemoveAccess: function() {
                  return thisScope.canRemoveAccess;
               }
            }
         };
         $uibModal.open(options);
      };

      ModelsManager.init(models);
      AccessManager.init();
      $scope.initItems();
      SyncQueue.init(ModelsManager);
      SyncQueue.requests = {
         algorea: {
            type: 'expandedItems',
            admin: true
         }
      };
      // add a fake item_item for orphaned items
      SyncQueue.addSyncEndListeners("itemsOrphaned", function() {
         for (var itemId in ModelsManager.curData.items) {
            var item = ModelsManager.curData.items[itemId];
            if (item.requestSets && item.requestSets.itemsOrphaned && item.sType != 'Root' && !item.orphanedInserted) {
               item.orphanedInserted = true;
               var itemItem = ModelsManager.createRecord("items_items");
               itemItem.idItemParent = config.OrphanedRootItemId;
               var parentItem = ModelsManager.getRecord('items', config.OrphanedRootItemId);
               itemItem.idItemChild = item.ID;
               itemItem.iChildOrder = $scope.itemsTreeView1.firstAvailableOrder(parentItem);
               ModelsManager.setLinks("items_items", itemItem);
               ModelsManager.curData.items_items[itemItem.ID] = itemItem;
               $scope.itemsTreeView1.triggers.relationInserted(itemItem);
               $scope.itemsTreeView2.triggers.relationInserted(itemItem);
            }
         }
      });
      SyncQueue.requestSets = [
         {name: "groupsAncestors"},
         {name: "groupsDescendants"},
         //{name: "groupsDescendantsAncestors"},
         //{name: "groupsGroupsDescendantsAncestors"},
         {name: "groupsGroupsAncestors"},
         //{name: "groupsItemsDescendantsAncestors"},
         {name: "groupsItemsAncestors"},
         //{name: "itemsOrphaned"},
         //{name: "itemsStringsOrphaned"},
         //{name: "groupsItemsOrphaned"},
      ];
      var syncInterval;
      $scope.$on('login.login', function(event, data) {
         SyncQueue.sentVersion = 0;
         SyncQueue.resetSync = true;
         ModelsManager.reinit();
         SyncQueue.init(ModelsManager);
         if (!data.tempUser) {
            if ($scope.initGroupsDone) {
               $("#treeGroups").dynatree("getRoot").removeChildren();
               $("#treeGroups2").dynatree("getRoot").removeChildren();
            }
            $scope.initGroups();
            SyncQueue.sync();
            if (!syncInterval) {
               syncInterval = setInterval(SyncQueue.planToSend, 10000);
            }
         } else if (syncInterval) {
            clearInterval(syncInterval);
         }
      });
      $scope.$on('login.logout', function(event, data) {
         SyncQueue.sentVersion = 0;
         SyncQueue.resetSync = true;
         ModelsManager.reinit();
         SyncQueue.init(ModelsManager);
         if (syncInterval) {
            clearInterval(syncInterval);
         }
      });
      SyncQueue.addSyncEndListeners("ItemsCtrl.apply", function() {
         if (AccessManager.wasDuringSync) {
            AccessManager.resetAccess();
         }
         $scope.$apply();
      });
   }]);

angular.module('algorea')
   .controller('ItemsSearchCtrl', ['$scope', '$i18next', function($scope, $i18next) {
      $scope.searchItems = {
         sTextId: "",
         sTitle: "",
         sSubtitle: "",
         sType: "",
         sDescription: ""
      };
      $scope.open = function() {
         $scope.shouldBeOpen = true;
      };

      $scope.close = function() {
         $scope.closeMsg = $i18next.t('groupAdmin_closed_at') + new Date();
         $scope.shouldBeOpen = false;
      };

      $scope.search = function() {
         $scope.close();
         $scope.$parent.searchItems($scope.searchItems);
      };

      $scope.opts = {
         backdropFade: true,
         dialogFade: true
      };
   }]);

angular.module('algorea')
   .controller('GroupsSearchCtrl', ['$scope', '$i18next', function($scope, $i18next) {
      $scope.searchGroups = {
         sName: "",
         sType: "",
         sDescription: ""
      };
      $scope.open = function() {
         $scope.shouldBeOpen = true;
      };

      $scope.close = function() {
         $scope.closeMsg = $i18next.t('groupAdmin_closed_at') + new Date();
         $scope.shouldBeOpen = false;
      };

      $scope.search = function() {
         $scope.close();
         $scope.$parent.searchGroups($scope.searchGroups);
      };

      $scope.opts = {
         backdropFade: true,
         dialogFade: true
      };
   }]);

angular.module('algorea')
   .controller('AccessModeCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
      $scope.shouldBeOpen = false;
      $scope.data = {
         bAccessRestricted: true,
         bAlwaysVisible: 1
      };
      $scope.open = function() {
         $scope.showGenDialog($rootScope.templatesPrefix+'/admin/tabs/accessEditDialog.html', 'items_items', 'item_item', $scope.$parent.item_item);
      };


      $scope.save = function() {
         $scope.item_item.bAccessRestricted = $scope.data.bAccessRestricted;
         $scope.item_item.bAlwaysVisible = $scope.data.bAlwaysVisible;
         ModelsManager.updated("items_items", $scope.item_item.ID);
         $scope.close();
      };

      $scope.opts = {
         backdropFade: true,
         dialogFade: true
      };
   }]);


angular.module('algorea')
   .controller('GenericDialogCtrl', ['$scope', function($scope) {
      $scope.shouldBeOpen = false;
      $scope.open = function(modelName, recordID) {
         $scope.modelName = modelName;
         $scope.recordID = recordID;
         $scope.shouldBeOpen = true;
      };

      $scope.close = function() {
         ModelsManager.resetRecordChanges($scope.modelName, $scope.recordID);
         $scope.shouldBeOpen = false;
      };

      $scope.save = function() {
         ModelsManager.updated($scope.modelName, $scope.recordID);
         $scope.shouldBeOpen = false;
      };

      $scope.opts = {
         backdropFade: true,
         dialogFade: true
      };
   }]);

angular.module('algorea')
   .controller('AccessDialogCtrl', ['$scope', '$controller', '$i18next', function($scope, $controller, $i18next) {
      $controller('GenericDialogCtrl', {
         $scope: $scope
      });

      $scope.openGroupItem = function(idGroup, idItem) {
         $scope.group_item = getGroupItem(idGroup, idItem);
         if ($scope.group_item == undefined) {
            $scope.group_item = createGroupItem(idGroup, idItem);
         }
         $scope.open('groups_items', $scope.group_item.ID);
      };

      $scope.switchAccessMode = function(idGroup, item_item) {
         var idItem = item_item.child.ID;
         var group = ModelsManager.getRecord('groups', idGroup);
         if (!group) {
            console.error('cannot find group '+idGroup);
            return;
         }
         if (!$scope.computeAccessRights(group, item_item)) {
            alert($i18next.t('groupAdmin_insufficient_rights')+$scope.canGiveAccessReason);
            return;
         }
         var access = AccessManager.dynComputeGroupItemAccess(idGroup, idItem);
         if (access.bHasFutureAccess) {
            $scope.openGroupItem(idGroup, idItem);
            return;
         }
         var accessStartDate = new Date();
         accessStartDate.setDate(accessStartDate.getDate() - 1);
         var groupItem = getGroupItem(idGroup, idItem);
         if (groupItem == undefined) {
            groupItem = createGroupItem(idGroup, idItem);
            groupItem.sPartialAccessDate = accessStartDate;
         } else {
            if ((groupItem.sPartialAccessDate == null) && (groupItem.sFullAccessDate == null)) { // no access
               groupItem.sPartialAccessDate = accessStartDate;
               groupItem.sCachedPartialAccessDate = groupItem.sPartialAccessDate;
            } else if (groupItem.sFullAccessDate == null) { // partial access
               groupItem.sFullAccessDate = accessStartDate;
               groupItem.sCachedFullAccessDate = groupItem.sFullAccessDate;
               groupItem.sPartialAccessDate = null;
               groupItem.sCachedPartialAccessDate = null;
            } else if (groupItem.sPartialAccessDate == null) { // full access
               groupItem.sFullAccessDate = null;
               groupItem.sCachedFullAccessDate = null;
               if ($scope.canRemoveAccess === false) {
                  groupItem.sPartialAccessDate = accessStartDate;
                  groupItem.sCachedPartialAccessDate = groupItem.sPartialAccessDate;
               }
            }
            groupItem.sPropagateAccess = 'self';
            ModelsManager.updated("groups_items", groupItem.ID);
         }
      };
   }]);


var AccessManager = {
   dynAccess: {},
   wasDuringSync: false,
   resetAccess: function() {
      AccessManager.dynAccess = {};
      AccessManager.wasDuringSync = false;
   },
   init: function() {
      ModelsManager.addListener("groups_items", "updated", "access", AccessManager.resetAccess);
      ModelsManager.addListener("groups_items", "inserted", "access", AccessManager.resetAccess);
      ModelsManager.addListener("groups_items", "deleted", "access", AccessManager.resetAccess);
   },
   updateAccess: function(access, otherAccess, cached) {
      var fieldNames = {
         "sFullAccessDate": 'sCachedFullAccessDate',
         "sPartialAccessDate": 'sCachedPartialAccessDate',
         "sAccessSolutionsDate": 'sCachedAccessSolutionsDate',
         "sCachedGrayedAccessDate": 'sCachedGrayedAccessDate'
      };
      var fieldTextNames = {
         "sFullAccessDate": 'fullInheritedFrom',
         "sPartialAccessDate": 'partialInheritedFrom',
         "sAccessSolutionsDate": 'solutionsInheritedFrom'
      };
      angular.forEach(fieldNames, function(cachedFieldName, fieldName) {
         var otherFieldName = cached ? cachedFieldName : fieldName;
         if ((access[cachedFieldName] == null) || ((otherAccess[otherFieldName] != null) && (otherAccess[otherFieldName] < access[cachedFieldName]))) {
            access[cachedFieldName] = otherAccess[otherFieldName];
            if (fieldTextNames[fieldName]) {
               if (otherAccess.idItem) {
                  access[fieldTextNames[fieldName]].push(otherAccess.idGroup);
               } else {
                  access[fieldTextNames[fieldName]] = access[fieldTextNames[fieldName]].concat(otherAccess[fieldTextNames[fieldName]]);
               }
            }
         }
      });
      if (cached && otherAccess.bCachedManagerAccess) {
         if (otherAccess.idItem) {
            access.managerInheritedFrom.push(otherAccess.idGroup);
         }
         access.bCachedManagerAccess = true;
      } else if (!cached && otherAccess.bManagerAccess) {
         if (otherAccess.idItem) {
            access.managerInheritedFrom.push(otherAccess.idGroup);
         }
         access.bCachedManagerAccess = true;
      }
   },
   dynComputeGroupItemAccess: function(idGroup, idItem) {
      if (!idGroup || !idItem) {
         return null;
      }
      var group = ModelsManager.getRecord("groups", idGroup);
      var item = ModelsManager.getRecord("items", idItem);
      if (!item || !group) {
         console.error('group or item null in dynComputeItemAccess! idGroup: '+idGroup+', idItem: '+idItem);
         return;
      }
      var key = group.ID + "-" + item.ID;
      if (AccessManager.dynAccess[key]) {
         return AccessManager.dynAccess[key];
      }
      var access = AccessManager.dynAccess[key] = {
         sCachedFullAccessDate: null,
         sCachedPartialAccessDate: null,
         sCachedAccessSolutionsDate: null,
         sCachedGrayedAccessDate: null,
         bCachedManagerAccess: false,
         bOwnerAccess: false,
         bManagerAccess: false,
         partialInheritedFrom: [],
         fullInheritedFrom: [],
         partialInheritedFrom: [],
         solutionsInheritedFrom: [],
         managerInheritedFrom: [],
      };
      var group_item = getGroupItem(group.ID, item.ID);
      if (group_item) {
         AccessManager.updateAccess(access, group_item, false);
         AccessManager.updateAccess(access, group_item, true);
         access.bOwnerAccess = group_item.bOwnerAccess;
         access.bManagerAccess = group_item.bManagerAccess;
         access.bCachedManagerAccess = group_item.bCachedManagerAccess;
      }
      for (var idParentGroupGroup in group.parents) {
         var parentGroupGroup = group.parents[idParentGroupGroup];
         if (parentGroupGroup.sType != 'direct' && parentGroupGroup.sType != 'invitationAccepted' && parentGroupGroup.sType != 'requestAccepted') {
            continue;
         }
         var parentGroup = parentGroupGroup.parent;
         var parentAccess = AccessManager.dynComputeGroupItemAccess(parentGroup.ID, item.ID);
         AccessManager.updateAccess(access, parentAccess, true);
      }
      var curDate = new Date();
      access.sAccessType = "none";
      access.sAccessLabel = "";
      access.sAccessTitle = "";
      access.bHasFutureAccess = false;
      var sFutureAccessLabel = "";
      var sFutureAccessTitle = "";
      if (access.sCachedFullAccessDate) {
         if (curDate >= access.sCachedFullAccessDate) {
            access.sAccessType = "full";
            if ((group_item) && (group_item.sFullAccessDate) && (curDate >= group_item.sFullAccessDate)) {
               access.sAccessLabel += "+";
               access.sAccessTitle += i18next.t('groupAdmin_access_complete_direct');
            } else {
               access.sAccessTitle += i18next.t('groupAdmin_access_complete_inherited');
            }
            access.sAccessLabel += "C";
         } else {
            if ((group_item) && (group_item.sFullAccessDate)) {
               sFutureAccessLabel += "+";
               sFutureAccessTitle += i18next.t('groupAdmin_access_complete_direct_future');
            } else {
               sFutureAccessTitle += i18next.t('groupAdmin_access_complete_inherited_future');
            }
            sFutureAccessLabel += "C";
            access.bHasFutureAccess = true;
         }
      }
      if ((access.sCachedPartialAccessDate) && (access.sAccessType != "full")) {
         if (curDate >= access.sCachedPartialAccessDate) {
            access.sAccessType = "partial";
            if ((group_item) && (group_item.sPartialAccessDate) && (curDate >= group_item.sPartialAccessDate)) {
               access.sAccessLabel += "+";
               access.sAccessTitle += i18next.t('groupAdmin_access_partial_direct');
            } else {
               access.sAccessTitle += i18next.t('groupAdmin_access_partial_inherited');
            }
            access.sAccessLabel += "P";
         } else if (sFutureAccessLabel == "") {
            if ((group_item) && (group_item.sFullAccessDate)) {
               sFutureAccessLabel += "+";
               sFutureAccessTitle += i18next.t('groupAdmin_access_partial_direct_future');
            } else {
               sFutureAccessTitle += i18next.t('groupAdmin_access_partial_inherited_future');
            }
            sFutureAccessLabel += "P";
            access.bHasFutureAccess = true;
         }
      }
      if (access.bOwnerAccess) {
         access.sAccessTitle += $i18next.t('groupAdmin_access_owner_direct');
         access.sAccessLabel += "+O";
      }
      if (access.bCachedManagerAccess || access.bManagerAccess) {
         if (access.bManagerAccess) {
            access.sAccessTitle += i18next.t('groupAdmin_access_manager_direct');
            access.sAccessLabel += "+";
         } else {
            access.sAccessTitle += i18next.t('groupAdmin_access_manager_inherited');
         }
         access.sAccessLabel += "M";
      }
      if (access.sCachedGrayedAccessDate && access.sAccessType != "full" && access.sAccessType != "partial" && curDate >= access.sCachedGrayedAccessDate) {
         access.sAccessType = "grayed";
         access.sAccessTitle += i18next.t('groupAdmin_access_grayed');
         access.sAccessLabel += "G";
      }
      if (access.sAccessType == "none") {
         access.sAccessLabel = "X";
         access.sAccessTitle += i18next.t('groupAdmin_access_none');
      }
      access.sAccessSolutionType = "none";
      if ((access.sCachedAccessSolutionsDate) && (curDate >= access.sCachedAccessSolutionsDate)) {
         access.sAccessSolutionType = "full";
         if ((group_item) && (group_item.sAccessSolutionsDate != null)) {
            access.sAccessLabel += "+";
            access.sAccessTitle += i18next.t('groupAdmin_access_solutions_direct');
         } else {
            access.sAccessTitle += i18next.t('groupAdmin_access_solutions_inherited');
         }
         access.sAccessLabel += "S";
      } else if (access.sCachedAccessSolutionsDate) {
         access.sAccessSolutionType = "future";
         if ((group_item) && (group_item.sAccessSolutionsDate)) {
            sFutureAccessLabel += "+";
            sFutureAccessTitle += i18next.t('groupAdmin_access_solutions_direct_future');
         } else {
            sFutureAccessTitle += i18next.t('groupAdmin_access_solutions_inherited_future');
         }
         sFutureAccessLabel += "S";
         access.bHasFutureAccess = true;
      }
      if (sFutureAccessLabel) {
         access.sAccessLabel += "=>" + sFutureAccessLabel;
         access.sAccessTitle += sFutureAccessTitle;
      }
      if (SyncQueue.status != SyncQueue.statusIdle) {
         access.sAccessLabel += "?";
         AccessManager.wasDuringSync = true;
         access.sAccessTitle = '['+i18next.t('groupAdmin_access_waiting_sync')+'] '+access.sAccessTitle;
      }
      return access;
   }
};

function getGroupItem(idGroup, idItem) {
   var curContainer = ModelsManager.indexes.groupItem[idGroup];
   if (curContainer == undefined) {
      return null;
   }
   curContainer = curContainer[idItem];
   if (curContainer == undefined) {
      return null;
   }
   return ModelsManager.curData.groups_items[curContainer];
}

function getUserItem(group, item) {
   if (!group || !item || !group.idUser) {
      return null;
   }
   var res = null;
   angular.forEach(item.user_item, function(user_item) {
      if (user_item.idUser == group.idUser) {
         res = user_item;
         return;
      }
   });
   return res;
}

function createGroupItem(idGroup, idItem, doNotInsert) {
   var groupItem = ModelsManager.createRecord("groups_items");
   groupItem.idGroup = idGroup;
   groupItem.idItem = idItem;
   groupItem.item = ModelsManager.getRecord('items', idItem);
   groupItem.sPartialAccessDate = null;
   groupItem.sFullAccessDate = null;
   groupItem.sAccessReason = '';
   if (!doNotInsert) {
      ModelsManager.insertRecord("groups_items", groupItem);
   }
   return groupItem;
}


angular.module('algorea')
   .controller('GenDialogCtrl', ['$scope', '$uibModalInstance', 'modelName', 'recordName', 'record', 'group_group', 'item_item', 'canRemoveAccess', '$i18next', function($scope, $uibModalInstance, modelName, recordName, record, group_group, item_item, canRemoveAccess, $i18next) {
      $scope.freshlyCreated = false;
      $scope.canRemoveAccess = canRemoveAccess;
      if (!record && modelName === 'groups_items') {
         record = createGroupItem(group_group.child.ID, item_item.child.ID, true);
         $scope.freshlyCreated = true;
      }
      $scope[recordName] = record;

      $scope.cancel = function() {
         if (!$scope.freshlyCreated) {
            ModelsManager.resetRecordChanges(modelName, $scope[recordName].ID);
         }
         $uibModalInstance.dismiss('cancel');
      };

      $scope.checkGroupItem = function() {
         if (!$scope.group_item.sFullAccessDate && !$scope.group_item.sPartialAccessDate) {
            if ($scope.group_item.bManagerAccess || $scope.group_item.bOwnerAccess) {
               alert($i18next.t('groupAdmin_needs_read_for_write'));
               return false;
            }
            if (canRemoveAccess === false) {
               alert($i18next.t('groupAdmin_still_has_access_child'));
               return false;
            }
         }
         $scope.ok();
      };

      $scope.ok = function() {
         record.sPropagateAccess = 'self';
         if ($scope.freshlyCreated) {
            ModelsManager.insertRecord(modelName, record);
         } else {
            ModelsManager.updated(modelName, $scope[recordName].ID);
         }
         $uibModalInstance.close();
         AccessManager.resetAccess();
      };


   }]);
