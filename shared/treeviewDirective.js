"use strict";

// the two first directives are a bit misplaces, but I don't know where else
// to put them

// formatting items
angular.module('algorea')
.directive('itemText', ['itemService', function (itemService) {
   return {
      restrict: 'EA',
      require: 'ngModel',
      link: function(scope, element, attr, controller) {
         controller.$formatters.push(function(idItem) {
            var item = ModelsManager.getRecord('items', idItem);
            if (!item) return '';
            var typeStr = itemService.getItemTypeStr(item);
            if (item.strings.length === 0) return typeStr;
            return typeStr+' : '+item.strings[0].sTitle;
         });
      }
   };
}]);

// formatting groups
angular.module('algorea')
.directive('groupText', function () {
   return {
      restrict: 'EA',
      require: 'ngModel',
      link: function(scope, element, attr, controller) {
         controller.$formatters.push(function(idGroup) {
            var group = ModelsManager.getRecord('groups', idGroup);
            return group ? group.sName : '';
         });
      }
   };
});

// loading a treeview and handling a few simple signals
angular.module('algorea')
.directive('treeview', function () {
   return {
      restrict: 'EA',
      scope:true,
      link: function(scope, element, attr) {
         var id = attr.id;
         var params, relationSelected;
         var sharedData = {
            copiedObjectObject: null,
            isDropping: false
         };
         if (attr.model == 'items') {
            relationSelected = function(relationID) {
               var item_item = ModelsManager.getRecord('items_items', relationID);
               if (!item_item) {
                  console.error('this shouldn\'t happen');
               }
               scope.$emit('treeview.recordSelected', item_item.idItemChild, relationID, id);
            };
            var getItemTitle = function(item) {
               var title = "";
               if (!item.strings || item.strings.length == 0) {
                  title = "loading...";
               } else {
                  title = item.strings[0].sTitle;
               }
               return "[" + item.sType + "] " + title;
            };
            params = {
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
               onQueryActivate: function(flag, dtnode) {
                  var item_item = ModelsManager.getRecord('items_items',dtnode.data.idRelation);
                  if (!item_item) return false;
                  if (item_item.child.sType == 'Task') {
                     return true;
                  }
                  return false;
               },
               objectFilter: function(item) {
                  if (item.sType == 'Course') {
                     return false;
                  }
                  return true;
               },
               relationFilter: function(item_item) {
                  if (item_item.child.sType == 'Course') {
                     return false;
                  }
                  return true;
               },
               isObjectRoot: function(object) {
                  return (object.ID == config.domains.current.ProgressRootItemId);
               },
               getObjectTitle: getItemTitle,
               objectSelected: function(recordID) {scope.$emit('treeview.recordSelected', recordID, null, id);},
               objectExpanded: function(){},
               relationSelected: relationSelected,
               compareRelations: function(itemItemA, itemItemB) {
                  if (itemItemA.iChildOrder < itemItemB.iChildOrder) {
                     return -1;
                  }
                  return 1;
               },
               createChild: function(){},
               staticData: true,
               readOnly: true,
               displayUnused: false
            };
         } else {
            var getGroupTitle = function(group) {
               return "[" + group.sType + "] " + group.sName;
            };
            relationSelected = function(relationID) {
               var group_group = ModelsManager.getRecord('groups_groups', relationID);
               if (!group_group) {
                  console.error('this shouldn\'t happen');
               }
               scope.$emit('treeview.recordSelected', group_group.idGroupChild, relationID, id);
            };
            params = {
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
               isObjectRoot: function(object) { return (object.sType == "Root"); },
               getObjectTitle: getGroupTitle,
               objectSelected: function(recordID) {scope.$emit('treeview.recordSelected', recordID, null, id);},
               relationSelected: relationSelected,
               compareRelations: function(groupGroupA, groupGroupB) {
                  if (groupGroupA.iChildOrder < groupGroupB.iChildOrder) {
                     return -1;
                  }
                  return 1;
               },
               createChild: function(){},
               staticData: true,
               readOnly: true,
               displayUnused: false
            };
         }
         scope['treeview'+id] = null;
         scope.$on('$destroy', function() {
            if (scope['treeview'+id]) {
               scope['treeview'+id].prepareDeletion();
            }
         });
         scope.$on('treeview.load', function(event, askedId) {
            if (askedId == id) {
               if (!scope['treeview'+id]) {
                  scope['treeview'+id] = new TreeView(id, sharedData, params);
                  scope['treeview'+id].fillTree();
               }
            }
         });
      }
   };
});
