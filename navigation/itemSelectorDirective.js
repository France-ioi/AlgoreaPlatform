// directive showing a few select to choose an item
// always starts with the levels of the platform
// handles item synchronisation to fetch everything it needs
// used in forum thread creation and groupAdmin results display

angular.module('algorea')
   .directive('itemSelector', ['itemService', '$rootScope', '$i18next', function (itemService, $rootScope, $i18next) {
   'use strict';
   return {
      restrict: 'EA',
      scope: {
      	onSelect: '&',
      	allowAll: '&'
      },
      templateUrl: $rootScope.templatesPrefix+'navigation/itemSelector.html',
      link: function(scope, element, attr) {

         function fillItemsListWithSonsRec(itemsList, itemsListRev, item) {
		      if (!item) return;
		      angular.forEach(item.children, function(child_item_item) {
		         var child_item = child_item_item.child;
		         if (child_item.sType != 'Course' && child_item.sType != 'Presentation') {
		            itemsList.push(child_item);
		            itemsListRev[child_item.ID] = true;
		         }
		         if (child_item.children) {
		            fillItemsListWithSonsRec(itemsList, itemsListRev, child_item)
		         }
		      });
		   }

		   scope.selectedItemId = 0;
		   scope.dropdownSelections = [];
		   scope.formValues = {};

		   scope.dropdownSelected = function(depth) {
		      if (depth === 0) { // final dropdown
		         depth = scope.dropdownSelections.length;
		      }
		      var itemId = scope.dropdownSelectionsIDs[depth];
		      if (itemId == 0) {
		         depth=depth-1;
		         itemId = scope.dropdownSelections[depth].ID;
		      }
		      var newSelections = [];
		      var newSelectionsIDs = [];
		      for (var i = 0; i < depth; i++) {
		         newSelections[i] = scope.dropdownSelections[i];
		         newSelectionsIDs[i] = scope.dropdownSelections[i].ID;
		      }
		      var newRootItem = ModelsManager.getRecord('items', itemId);
		      newSelections[depth] = newRootItem;
		      newSelectionsIDs[depth] = newRootItem.ID;
		      scope.dropdownSelections = newSelections;
		      scope.dropdownSelectionsIDs = newSelectionsIDs;
		      scope.itemSelected(newRootItem);
		   };

		   scope.itemSelected = function(item) {
		      if (scope.rootItem == item) return;
		      scope.rootItem = item;
		      scope.itemsList = [item];
		      scope.itemsListRev = {};
		      fillItemsListWithSonsRec(scope.itemsList, scope.itemsListRev, scope.rootItem);
		      // strange angular syntax when passing function as directive arguments
		      scope.onSelect()(item, scope.itemsListRev);
		   };

		   // fake level selecting all Levels:
		   scope.fakeAllLevels = {ID: null, children: [], strings: [{sTitle: 'Tous les niveaux'}]};

		   scope.levelSelected = function() {
		      //scope.itemSelected(scope.formValues.selectedLevel);
		      scope.dropdownSelections = [];
		      scope.dropdownSelectionsIDs = [];
		      scope.dropdownSelections[0] = scope.formValues.selectedLevel;
		      scope.dropdownSelectionsIDs[0] = scope.formValues.selectedLevel.ID;
		      if (scope.formValues.selectedLevel.ID) {
			      scope.levelLoading = true;
			      itemService.syncDescendants(scope.formValues.selectedLevel.ID, function() {
			      	scope.levelLoading = false;
			      	scope.itemSelected(scope.formValues.selectedLevel);
			      }, true, true);
		      } else {
		      	scope.onSelect()(scope.formValues.selectedLevel, {});
		      }
		   };

		   scope.initItems = function() {
		      var officialRootItem = ModelsManager.getRecord('items', config.domains.current.OfficialProgressItemId);
		      var customRootItem = ModelsManager.getRecord('items', config.domains.current.CustomProgressItemId);
		      scope.levels = [];
		      if (scope.allowAll()) {
		      	scope.levels.push(scope.fakeAllLevels);
		      }
		      angular.forEach(officialRootItem.children, function(child) {
		         scope.levels.push(child.child);
		      });
		      angular.forEach(customRootItem.children, function(child) {
		         scope.levels.push(child.child);
		      });
		      if (!scope.formValues.selectedLevel) {
		         scope.formValues.selectedLevel = scope.levels[0];
		         scope.levelSelected(scope.levels[0].ID);
		      }
		   };

		   scope.initItems();
      }
   };
}]);
