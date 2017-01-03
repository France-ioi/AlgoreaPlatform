'use strict';

// simple controller for forum filers, 
// followed by an angular filter using the forum filter to filter threads on the client side
//
// the idea is basically to modify the filter with bSelected=1, it will be automatically taken
// into account by the sync ("forumIndex" requestSet) and change the displayed threads
//
// TODO: remove the $parent access

angular.module('algorea')
   .controller('forumFilterController', ['$scope', 'itemService', 'loginService', function ($scope, itemService, loginService) {
   var defaultFilter={
      'sName': 'default',
      'bStarred': null,
      'sStartDate': null,
      'sEndDate': null,
      'bArchived': null,
      'bParticipated': null,
      'bUnread': null,
      'idItem': null,
      'idGroup': null,
      'olderThan': null,
      'newerThan': null,
      'sUsersSearch': null,
      'sBodySearch': null,
      'bImportant': null
   };
   $scope.loading = true;
   $scope.saveFilter= false;
   $scope.showFilters = false;
   $scope.showSavedFilter = false;
   $scope.editFilter = false;
   $scope.plusActiveVar = false;
   $scope.formValues = {};
   // $scope.filterInfos is inheritted from forumIndexController
   // using object here due to prototypal inheritance / scope mess, see
   // here: https://github.com/angular-ui/bootstrap/issues/2540
   $scope.data = {};
   $scope.data.opened = false;
   $scope.open = function($event, formOpened) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.data[formOpened] = true;
   };
   $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
   };
   $scope.submitForm = function(form) {
      ModelsManager.updated('filters', $scope.filterInfos.currentFilter.ID);
      $scope.formValues.editFilter = false;
   };
   $scope.selectFilter = function(filterID) {
      angular.forEach($scope.filterInfos.filters, function(filter, ID) {
         if (!filter) return; // no idea why, but it happens...
         if (ID && filter.bSelected && ID != filterID) {
            filter.bSelected = false;
            itemService.saveRecord('filters', ID);
         } else if ( (!filter.bSelected) && ID == filterID) {
            filter.bSelected = true;
            itemService.saveRecord('filters', ID);
         }
      });
      $scope.filterInfos.currentFilter = $scope.filterInfos.filters[filterID];
   };
   $scope.newFilter = function() {
      var newFilter = ModelsManager.createRecord('filters');
      ModelsManager.insertRecord('filters', newFilter);
      newFilter.idUser = SyncQueue.requests.loginData.ID;
      newFilter.sName = "Nouveau filtre";
      $scope.selectFilter(newFilter.ID);
   };
   $scope.deleteFilter = function(ID) {
      ModelsManager.deleteRecord('filters', ID);
      if (isObjEmpty($scope.filterInfos.filters)) {
         $scope.newFilter();
      }
   };
   function isObjEmpty(obj) {
      for (var key in obj)
         if (obj.hasOwnProperty(key))
            return false;
      return true;
   }
   function getSelectedFilter(filters) {
      var firstFilter = false;
      var res = false;
      angular.forEach(filters, function(filter, ID) {
         if (filter.bSelected) {
            res = filter;
            return false;
         }
         if (!firstFilter) {
            firstFilter = filter;
         }
      });
      if (!res && firstFilter) {
         res = firstFilter;
         firstFilter.bSelected = true;
      }
      return res;
   }
   var tempItemSelection = null;
   $scope.onSelectItem = function(item, itemDescendants) {
      tempItemSelection = item;
   };
   $scope.validateItemSelection = function() {
      $scope.filterInfos.currentFilter.idItem = tempItemSelection.ID;
      $scope.filterInfos.currentFilter.sItemTitle = tempItemSelection.strings[0].sTitle;
      $scope.formValues.modifyItem = false;
   }
   $scope.selectNoItem = function() {
      $scope.filterInfos.currentFilter.idItem = null;
      $scope.filterInfos.currentFilter.sItemTitle = 'Tous';
   }
   $scope.init = function() {
      $scope.loading = false;
      $scope.filterInfos.filters = ModelsManager.getRecords('filters');
      if (!$scope.filterInfos.filters || isObjEmpty($scope.filterInfos.filters)) {
         var filter = ModelsManager.createRecord('filters');
         filter.bSelected = true;
         filter.sName = "Filtre par défaut";
         filter.idUser = SyncQueue.requests.loginData.ID;
         $scope.filterInfos.currentFilter = filter;
         $scope.filterInfos.filters = [filter];
      } else {
         $scope.filterInfos.currentFilter = getSelectedFilter($scope.filterInfos.filters);
      }
   };

   itemService.onNewLoad(function() {
      $scope.init();
   });
}]).filter('threadFilter', function() {
   function threadOkForFilter(thread, filter) {
      if (!filter) return true;
      if (filter.bArchived && ! thread.bArchived) return false;
      var user_thread = null;
      angular.forEach(thread.user_thread, function(found_user_thread){
         user_thread = found_user_thread;
         return;
      });
      if (filter.bParticipated && ((!user_thread) || (!user_thread.sLastWriteDate)))
         return false;
      if (filter.bUnread && user_thread && user_thread.sLastReadDate)
         return false;
      if (filter.bStarred && ((!user_thread) || (!user_thread.bStarred)))
         return false;
      if (filter.bWithNewMessages && ((!user_thread) || (!user_thread.sLastReadDate) || user_thread.sLastReadDate < thread.sLastActivityDate))
         return false;
      if (filter.sBodySearch && (!thread.sMessage || thread.sMessage.indexOf(filter.sBodySearch) === -1))
         return false;
      if (filter.sStartDate && (thread.sLastActivityDate < filter.sStartDate))
         return false;
      if (filter.sEndDate && (thread.sLastActivityDate > filter.sEndDate))
         return false;
      var today = new Date();
      if (filter.newerThan && Math.floor((today - thread.sLastActivityDate) / 86400000) > filter.newerThan)
         return false;
      if (filter.olderThan && Math.floor((today - thread.sLastActivityDate) / 86400000) < filter.olderThan)
         return false;
      // check if item is descendant of filter.idItem
      if (filter.idItem && (!ModelsManager.indexes.idItemAncestor[filter.idItem] || 
               !ModelsManager.indexes.idItemAncestor[filter.idItem][thread.idItem])) {
         return false;
      }
      // TODO: handle bImportant, sUsersSearch and idGroup
      return true;
   }
   function checkAgainstTab(thread, tab, userID) {
      if (tab == 'getHelp')
         return thread.sType === 'Help' && thread.idUserCreated == userID;
      if (tab == 'helpOthers')
         return thread.sType === 'Help' && thread.idUserCreated != userID;
      if (tab == 'general')
         return thread.sType === 'General';
      if (tab == 'technicalSupport')
         return thread.sType === 'Bug';
   }
   return function(threads, tab, userID, currentFilter, currentGlobalFilter) {
      if (!currentFilter && !tab)
         return threads;
      var res = [];
      angular.forEach(threads, function(thread) {
         if (checkAgainstTab(thread, tab, userID) && threadOkForFilter(thread, currentFilter) && threadOkForFilter(thread, currentGlobalFilter)) {
            res.push(thread);
         }
      });
      return res;
   };
});

// hack due to https://github.com/angular-ui/bootstrap/issues/2659, remove when
// bug fixed in angular-ui
angular.module('algorea').directive('datepickerPopup', function (){return {restrict: 'EAC',require: 'ngModel',link: function(scope, element, attr, controller) {controller.$formatters.shift();}}});
