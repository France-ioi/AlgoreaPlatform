'use strict';

angular.module('algorea')
   .controller('communityController', ['$scope', function ($scope) {
      $scope.events = [
         {
            id: 1,
            new: 1,
            time: "14:24",
            user: "ayadi23",
            type: "solved",
            typestr: "a résolu",
            itemstr: "Empilement de cylindres",
         },
         {
            id: 2,
            new: 0,
            time: "13:46",
            user: "bibioo",
            type: "needshelp",
            typestr: "a besoin d'aide sur",
            itemstr: "Fiches d'inscription",
         },
         {
            id: 3,
            new: 0,
            time: "15:26",
            user: "eroux",
            type: "solved",
            typestr: "a prototypé le",
            itemstr: "Contrôleur de communauté",
         }
      ];
}]);
