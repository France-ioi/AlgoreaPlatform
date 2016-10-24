angular.module('algorea')
   .controller('adminUserItemController', ['$scope', '$filter', '$i18next', function($scope, $filter, $i18next) {
   $scope.user_item = null;
   $scope.getItemStatusForGroup = function(group, item) {
      console.error('get item status for item '+item.ID);
      var user_item = getUserItem(group, item);
      this.user_item = user_item;

      if (!user_item) {
         this.globalStatus = 'not visited';
         this.statusGlyphicon = 'glyphicon-eye-close';
         this.statusTitle = $i18next.t('admin_status_not_visited');
      } else if (item.bGrayedAccess) {
         this.globalStatus = 'grayed';
         this.statusGlyphicon = 'glyphicon-lock';
         this.statusTitle = $i18next.t('admin_status_grayed');
      } else if (!user_item.sLastActivityDate || user_item.sLastActivityDate.getTime() == 0) {
         this.globalStatus = 'not visited';
         this.statusGlyphicon = 'glyphicon-eye-close';
         this.statusTitle = $i18next.t('admin_status_not_visited');
      } else if (user_item.bValidated == true) {
         this.globalStatus = 'validated';
         this.statusGlyphicon = 'glyphicon-ok';
         this.statusTitle = $i18next.t('admin_status_validated')+' '+$filter('date')(new Date(user_item.sLastActivityDate), 'dd/MM/yyyy')+', '+$i18next.t('admin_score')+' : '+user_item.iScore+'/100';
      } else if ( ! user_item.bValidated && user_item.nbTaskTried && this.item.sType == 'task') {
         this.globalStatus = 'failed';
         this.statusGlyphicon = 'glyphicon-remove';
         this.statusTitle = '';
      } else if (user_item.nbTaskWithHelp && this.item.sType == 'task') {
         this.globalStatus = 'hint asked';
         this.statusGlyphicon = '';
         this.statusTitle = '';
      } else {
         this.globalStatus = 'visited';
         this.statusGlyphicon = 'glyphicon-eye-open';
         this.statusTitle = $i18next.t('admin_status_visited')+' '+$filter('date')(user_item.sLastActivityDate);
      }
   };
   $scope.getItemStatusForGroup($scope.group_group.child, $scope.item_item.child);
   $scope.$on('admin.itemSelected', function() {
      $scope.getItemStatusForGroup($scope.group_group.child, $scope.item_item.child);
   });
   $scope.$on('admin.groupSelected', function() {
      $scope.getItemStatusForGroup($scope.group_group.child, $scope.item_item.child);
   });
}]);
