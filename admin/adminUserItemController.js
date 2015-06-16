angular.module('algorea')
   .controller('adminUserItemController', function($scope) {
   $scope.user_item = null;
   $scope.getItemStatusForGroup = function(group, item) {
      console.error('get item status for item '+item.ID);
      var user_item = getUserItem(group, item);
      this.user_item = user_item;
      if (!user_item) {
         this.globalStatus = 'not visited';
      } else if (item.bGrayedAccess) {
         this.globalStatus = 'grayed';
      } else if (!user_item.sLastActivityDate || user_item.sLastActivityDate.getTime() == 0) {
         this.globalStatus = 'not visited';
      } else if (user_item.bValidated == true) {
         this.globalStatus = 'validated';
      } else if ( ! user_item.bValidated && user_item.nbTaskTried && this.item.sType == 'task') {
         this.globalStatus = 'failed';
      } else if (user_item.nbTaskWithHelp && this.item.sType == 'task') {
         this.globalStatus = 'hint asked';
      } else {
         this.globalStatus = 'visited';
      }
   };
   $scope.getItemStatusForGroup($scope.group_group.child, $scope.item_item.child);
   $scope.$on('admin.itemSelected', function() {
      $scope.getItemStatusForGroup($scope.group_group.child, $scope.item_item.child);
   });
   $scope.$on('admin.groupSelected', function() {
      $scope.getItemStatusForGroup($scope.group_group.child, $scope.item_item.child);
   });
});
