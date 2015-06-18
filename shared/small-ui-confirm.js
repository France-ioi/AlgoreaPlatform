angular.module('small-ui-confirm', ['ui.bootstrap'])
.directive('confirm', ['$modal', function($modal) {
  return {
    restrict: 'A',
    scope: {
      'action': '&confirm',
      'text': '@rel'
    },
    link: function(scope, elem, attrs) {
      elem.on('click', function() {
        var modalInstance = $modal.open({
          templateUrl: 'shared/small-ui-confirm.html',
          controller: ["$scope", "$modalInstance", "text", function($scope, $modalInstance, text) {
            $scope.text = text;
            $scope.ok = function () {
              $modalInstance.close(/*$scope.text*/);
            };
            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
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
