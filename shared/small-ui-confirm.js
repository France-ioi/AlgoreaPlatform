angular.module('small-ui-confirm', ['ui.bootstrap'])
.directive('confirm', ['$uibModal', function($uibModal) {
  return {
    restrict: 'A',
    scope: {
      'action': '&confirm',
      'text': '@rel'
    },
    link: function(scope, elem, attrs) {
      elem.on('click', function() {
        var modalInstance = $uibModal.open({
          template: '<div class="modal-header"><h3 class="modal-title">Confirmation</h3></div><div class="modal-body">{{text}}</div><div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button><button class="btn btn-warning" ng-click="cancel()">Annuler</button></div>',
          controller: ["$scope", "$uibModalInstance", "text", function($scope, $uibModalInstance, text) {
            $scope.text = text;
            $scope.ok = function () {
              $uibModalInstance.close(/*$scope.text*/);
            };
            $scope.cancel = function () {
              $uibModalInstance.dismiss('cancel');
            };
          }],
          resolve: {
            text: function () {
              return scope.text;
            }
          }
        });
        modalInstance.result.then(function (/*text*/) {
          scope.action();
        }, function () {
        });
      });
    }
  };
}]);
