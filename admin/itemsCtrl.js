"use strict";

var app = angular.module('algorea', ['ui.bootstrap', 'franceIOILogin', 'ngSanitize', 'ngAnimate']);

app.directive('field', function() {
   return {
      restrict: 'E',
      scope: {
         model: '=',
         readonly: '@'
      },
      link: function(scope, elem, attrs) {
         var parts = attrs.field.split(".");
         scope.field = models[parts[0]].fields[parts[1]];
         scope.fieldname = parts[1];
      },
      controller: ['$scope', function($scope) {
         $scope.clear = function() {
            if ($scope.field.type == "jsdate") {
               $scope.model[$scope.fieldname] = null;
            }
         };
      }],
      templateUrl: ((typeof compiled !== 'undefined' && compiled)?'':"../")+"commonFramework/angularDirectives/formField.html",
      replace: true
   };
});

angular.module('algorea')
   .controller('adminCtrl', ['$scope', '$rootScope', 'loginService', '$sce', '$location', '$timeout', function($scope, $rootScope, loginService, $sce, $location, $timeout) {
      $scope.userLogged = false;
      $scope.loginReady = false;
      $scope.loginClass = 'loginCentered';
      loginService.init($rootScope);
      $scope.loginInnerHtml = '';
      $scope.loginModuleUrl = $sce.trustAsResourceUrl('https://loginaws.algorea.org/login.html#' + $location.absUrl());
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
   .controller('ItemsCtrl', ['$scope', '$uibModal', 'loginService', function($scope, $uibModal, loginService) {
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
            if (confirm("Des données de l'item en cours ont été modifiées, vous allez perdre les changements")) {
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
            this.canGiveAccessReason = "Vous devez avoir les droits manager pour pouvoir donner directement accès à cet item.";
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
         this.canGiveAccessReason = "Vous ne pouvez pas donner l'accès à un item à un groupe si celui-ci n'a pas accès à l'item parent";
         return this.canGiveAccess;
      };

      $scope.newItem = function(itemItemID) {
         if (!$scope.checkUserRight(itemItemID, 'items_items', 'insert')) {
            alert("Vous n'avez pas le droit d'ajouter un objet à cet endroit");
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
         itemStrings.sTitle = "Nouvel item";
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
         $scope.itemStrings = itemStrings;
      };

      $scope.newGroup = function(groupGroupID) {
         var group = ModelsManager.createRecord("groups");
         group.sName = "Nouveau groupe";
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
            $scope.$broadcast('admin.itemSelected');
            return;
         }
         $scope.item = ModelsManager.getRecord("items", itemID);
         $scope.group_item = getGroupItem($scope.loginData.idGroupSelf, itemID);
         var my_group = ModelsManager.getRecord("groups", $scope.loginData.idGroupSelf);
         $scope.my_user_item = getUserItem(my_group, $scope.item);
         $scope.item_strings = $scope.item.strings[0];
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
            if (action == 'delete' && (record.parent.ID == config.domains.current.CustomProgressItemId || record.parent.ID == config.domains.current.CustomContestRootItemId)) {
               return true;
            }
            if (action == 'insert' && (record.child.ID == config.domains.current.CustomProgressItemId || record.child.ID == config.domains.current.CustomContestRootItemId)) {
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
         var getItemTitle = function(item, item_item) {
            var title = "";
            if (item.strings.length === 0) {
               title = "loading...";
            } else {
               title = item.strings[0].sTitle;
            }
            var accessStr = '';
            var accessStrEnd = '';
            var group_item = getGroupItem($scope.loginData.idGroupSelf, item.ID);
            if (group_item && group_item.bOwnerAccess) {
               accessStr = '<span class="dynatree-owner">';
               accessStrEnd = '</span>';
            } else if (group_item && group_item.bManagerAccess) {
               accessStr = '<span class="dynatree-manager">';
               accessStrEnd = '</span>';
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
         
         function getGroupTitle(group, group_group) {
            var suffix = '';
            var preprefix = '';
            if (group_group && group_group.sType !== 'invitationAccepted' &&
                  group_group.sType !== 'requestAccepted' &&
                  group_group.sType !== 'direct') {
               preprefix = '<span style="color:gray;">';
               suffix = '</span>';
            }
            var prefix = models.groups.fields.sType.values[group.sType ? group.sType : 'Other'].label + " : ";
            if (group.sType == 'UserSelf') {
               if ($scope.loginData.idGroupSelf == group.ID) {
                  prefix = 'Mon compte : ';
               } else {
                  prefix = 'Utilisateur : ';
               }
            }
            if (group.sType == 'UserAdmin') {
               if ($scope.loginData.idGroupOwned == group.ID) {
                  return 'Mes groupes ('+group.sName+')';
               } else {
                  prefix = 'Les groupes de : ';
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
            staticData: true,
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
         {name: "groupsDescendantsAncestors"},
         {name: "groupsGroupsDescendantsAncestors"},
         {name: "groupsGroupsAncestors"},
         {name: "groupsItemsDescendantsAncestors"},
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
   .controller('ItemsSearchCtrl', ['$scope', function($scope) {
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
         $scope.closeMsg = 'I was closed at: ' + new Date();
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
   .controller('GroupsSearchCtrl', ['$scope', function($scope) {
      $scope.searchGroups = {
         sName: "",
         sType: "",
         sDescription: ""
      };
      $scope.open = function() {
         $scope.shouldBeOpen = true;
      };

      $scope.close = function() {
         $scope.closeMsg = 'I was closed at: ' + new Date();
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
   .controller('AccessModeCtrl', ['$scope', function($scope) {
      $scope.shouldBeOpen = false;
      $scope.data = {
         bAccessRestricted: true,
         bAlwaysVisible: 1
      };
      $scope.open = function() {
         $scope.showGenDialog('tabs/accessEditDialog.html', 'items_items', 'item_item', $scope.$parent.item_item);
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
   .controller('AccessDialogCtrl', ['$scope', '$controller', function($scope, $controller) {
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
            alert('vous n\'avez pas les droits suffisants pour changer les droits de ce groupe sur cet item: '+$scope.canGiveAccessReason);
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
      angular.forEach(fieldNames, function(cachedFieldName, fieldName) {
         var otherFieldName = cached ? cachedFieldName : fieldName;
         if ((access[cachedFieldName] == null) || ((otherAccess[otherFieldName] != null) && (otherAccess[otherFieldName] < access[cachedFieldName]))) {
            access[cachedFieldName] = otherAccess[otherFieldName];
         }
      });
      if (cached && otherAccess.bCachedManagerAccess) {
         access.bCachedManagerAccess = true;
      } else if (!cached && otherAccess.bManagerAccess) {
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
         bManagerAccess: false
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
               access.sAccessTitle += "Accès complet donné directement. ";
            } else {
               access.sAccessTitle += "Accès complet hérité. ";
            }
            access.sAccessLabel += "C";
         } else {
            if ((group_item) && (group_item.sFullAccessDate)) {
               sFutureAccessLabel += "+";
               sFutureAccessTitle += "Accès complet futur donné directement. ";
            } else {
               sFutureAccessTitle += "Accès complet futur hérité. ";
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
               access.sAccessTitle += "Accès partiel donné directement. ";
            } else {
               access.sAccessTitle += "Accès partiel hérité. ";
            }
            access.sAccessLabel += "P";
         } else if (sFutureAccessLabel == "") {
            if ((group_item) && (group_item.sFullAccessDate)) {
               sFutureAccessLabel += "+";
               sFutureAccessTitle += "Accès partiel futur donné directement. ";
            } else {
               sFutureAccessTitle += "Accès partiel futur hérité. ";
            }
            sFutureAccessLabel += "P";
            access.bHasFutureAccess = true;
         }
      }
      if (access.bOwnerAccess) {
         access.sAccessTitle += "Accès Propriétaire donné directement. ";
         access.sAccessLabel += "+O";
      }
      if (access.bCachedManagerAccess || access.bManagerAccess) {
         access.sAccessTitle += "Accès Manager ";
         if (access.bManagerAccess) {
            access.sAccessTitle += 'donné directement. ';
            access.sAccessLabel += "+";
         } else {
            access.sAccessTitle += 'hérité. ';
         }
         access.sAccessLabel += "M";
      }
      if (access.sCachedGrayedAccessDate && access.sAccessType != "full" && access.sAccessType != "partial" && curDate >= access.sCachedGrayedAccessDate) {
         access.sAccessType = "grayed";
         access.sAccessTitle += "Accès grisé.";
         access.sAccessLabel += "G";
      }
      if (access.sAccessType == "none") {
         access.sAccessLabel = "X";
         access.sAccessTitle += "Aucun accès actuellement. ";
      }
      access.sAccessSolutionType = "none";
      if ((access.sCachedAccessSolutionsDate) && (curDate >= access.sCachedAccessSolutionsDate)) {
         access.sAccessSolutionType = "full";
         if ((group_item) && (group_item.sAccessSolutionsDate != null)) {
            access.sAccessLabel += "+";
            access.sAccessTitle += "Accès aux solutions donné directement. ";
         } else {
            access.sAccessTitle += "Accès aux solutions hérité. ";
         }
         access.sAccessLabel += "S";
      } else if (access.sCachedAccessSolutionsDate) {
         access.sAccessSolutionType = "future";
         if ((group_item) && (group_item.sAccessSolutionsDate)) {
            sFutureAccessLabel += "+";
            sFutureAccessTitle += "Accès futur aux solutions donné directement. ";
         } else {
            sFutureAccessTitle += "Accès futur aux solutions hérité. ";
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
         access.sAccessTitle = "[En attente de synchro] " + access.sAccessTitle;
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
   .controller('GenDialogCtrl', ['$scope', '$uibModalInstance', 'modelName', 'recordName', 'record', 'group_group', 'item_item', 'canRemoveAccess', function($scope, $uibModalInstance, modelName, recordName, record, group_group, item_item, canRemoveAccess) {
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
               alert("Vous devez donner l'accès en lecture pour pouvoir donner l'accès en écriture");
               return false;
            }
            if (canRemoveAccess === false) {
               alert("Vous ne pouvez pas retirer l'accès à cet item à ce groupe, car il a un accès direct à un item enfant");
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
