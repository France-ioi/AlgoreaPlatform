'use strict';

angular.module('algorea')
  .directive('viewButton', function () {
    return {
      restrict: 'A',
      template: '<button type="button" class="btn btn-default btn-xs view-button" ng-click="toggleFullscreen();">'+
                  '<span class="glyphicon glyphicon-{{layout.buttonClass}}"></span>'+
                '</button>',
  };
});

angular.module('algorea')
  .controller('layoutController', ['$scope', '$window', '$timeout', '$rootScope', '$interval', function ($scope, $window, $timeout, $rootScope, $interval) {
    var pane_west = $('.ui-layout-west');
    var pane_center = $('.ui-layout-center');
    var container = $('#layoutContainer');
    var taskMinWidth = 820;
    var nonTaskMinWidth = 400;
    // $scope.layout will be accesset and set by viewButton directive in a subscope, so
    // it must be an object, or prototypal inheritance will mess everything
    $scope.layout = {
      west_is_open : true,
      tablesResized: function() {
      },
      refreshSizes : function() {

      },
      buttonClass: "fullscreen",
      state: "normal",
      goFullscreen: function() {

      },
      goNormal: function() {

      },
      toggleLeft: function() {
         $('#sidebar-left').toggleClass('sidebar-left-toggled');
         $('.main-left-arrow').toggleClass('main-left-arrow-toggled');
         $scope.layout.refreshSizes();
      },
      toggleRight: function() {
         $('#sidebar-right').toggleClass('sidebar-right-toggled');
         $('#main-titlebar-community').toggleClass('main-titlebar-community-toggled');
         $('.main-right-arrow').toggleClass('main-right-arrow-toggled');
         $scope.layout.refreshSizes();
      },
      setRightIcon: function() {
         if ($('#sidebar-right').hasClass('sidebar-right-toggled')) {
            $('#main-titlebar-community').addClass('main-titlebar-community-toggled');
         }
      },
      toggleMenu: function() {
         $('#menu').toggleClass('menu-toggled');
         $('#fixed-header-room').toggleClass('fixed-header-room-toggled');
      },
      closeMenu: function() {
         $scope.layout.menuOpen = false;
         if ($(window).width() < 1100) {
            if ($('#menu').hasClass('menu-toggled')) {
               $scope.layout.toggleMenu();
            }
         } else {
            if (!$('#menu').hasClass('menu-toggled')) {
               $scope.layout.toggleMenu();
            }
         }
      },
      closeRight: function() {
         $scope.layout.rightOpen = false;
         if ($(window).width() < 1100) {
            if ($('#sidebar-right').hasClass('sidebar-right-toggled')) {
               $scope.layout.toggleRight();
            }
         } else {
            if (!$('#sidebar-right').hasClass('sidebar-right-toggled')) {
               $scope.layout.toggleRight();
            }
         }
      },
      closeLeft: function() {
         $scope.layout.leftOpen = false;
         if ($(window).width() < 1100) {
            if ($('#sidebar-left').hasClass('sidebar-left-toggled')) {
               $scope.layout.toggleLeft();
            }
         } else {
            if (!$('#sidebar-left').hasClass('sidebar-left-toggled')) {
               $scope.layout.toggleLeft();
            }
         }
      },
      openMenu: function(event) {
         // do not open menu when user clicks on arrows
         console.error(event.target.className);
         if (event.target.className.indexOf('link-arrow') != -1) {
            return;
         }
         if ($(window).width() < 1100) {
            if (!$('#menu').hasClass('menu-toggled')) {
               $scope.layout.menuOpen = true;
               $scope.layout.toggleMenu();
            }
         } else {
            if ($('#menu').hasClass('menu-toggled')) {
               $scope.layout.menuOpen = true;
               $scope.layout.toggleMenu();
            }
         }
      },
      openRight: function() {
         if ($(window).width() < 1100) {
            if (!$('#sidebar-right').hasClass('sidebar-right-toggled')) {
               $scope.layout.rightOpen = true;
               $scope.layout.toggleRight();
            }
         } else {
            if ($('#sidebar-right').hasClass('sidebar-right-toggled')) {
               $scope.layout.rightOpen = true;
               $scope.layout.toggleRight();
            }
         }
      },
      openLeft: function() {
         if ($scope.layout.leftOpen) {
            $scope.layout.closeLeft();
            return;
         }
         if ($(window).width() < 1100) {
            if (!$('#sidebar-left').hasClass('sidebar-left-toggled')) {
               $scope.layout.leftOpen = true;
               $scope.layout.toggleLeft();
            }
         } else {
            if ($('#sidebar-left').hasClass('sidebar-left-toggled')) {
               $scope.layout.leftOpen = true;
               $scope.layout.toggleLeft();
            }
         }
      },
      closeIfOpen: function() {
         if ($scope.layout.leftOpen) {
            $scope.layout.closeLeft();
         }
         if ($scope.layout.menuOpen) {
            $scope.layout.closeMenu();
         }
      }
    };
    $scope.toggleFullscreen = function() {
      if ($scope.layout.state == "normal") {

      } else {

      }
    };
   function fixArrowPositions() {
      if ($('#sidebar-left').hasClass('sidebar-left-toggled') != $('.main-left-arrow').hasClass('main-left-arrow-toggled')) {
         $('.main-left-arrow').toggleClass('main-left-arrow-toggled')
      }
      if ($('#sidebar-right').hasClass('sidebar-right-toggled') != $('.main-right-arrow').hasClass('main-right-arrow-toggled')) {
         $('.main-right-arrow').toggleClass('main-right-arrow-toggled')
      }
   }
   var lastRightIsFullScreen;
   $scope.layout.rightIsFullScreen = function(rightIsFullScreen) {
      if (rightIsFullScreen == lastRightIsFullScreen) {
         fixArrowPositions();
         return;
      }
      lastRightIsFullScreen = rightIsFullScreen;
       if (rightIsFullScreen) {
         $scope.layout.closeMenu();
         $scope.layout.closeLeft();
         $scope.layout.closeRight();
       } else if ($(window).width() > 1100) {
         $scope.layout.leftOpen = false;
         $scope.layout.rightOpen = false;
         $scope.layout.menuOpen = false;
         if ($('#sidebar-left').hasClass('sidebar-left-toggled')) {
            $scope.layout.toggleLeft();
         }
         if ($('#sidebar-right').hasClass('sidebar-right-toggled')) {
            $scope.layout.toggleRight();
         }
         if ($('#menu').hasClass('menu-toggled')) {
            $scope.layout.toggleMenu();
         }
       }
       fixArrowPositions();
       $scope.layout.refreshSizes();
    };
    var isCurrentlyOnePage = false;;
    $scope.layout.isOnePage = function(isOnePage) {
       if (typeof isOnePage === 'undefined') {
          return isCurrentlyOnePage;
       }
       isCurrentlyOnePage = isOnePage;
    };
    // inspired from https://github.com/capaj/ng-tools/blob/master/src/debounce.js
    // used on onresize for obvious performance reasons
    function debounce(fn, timeout, apply){
       apply = angular.isUndefined(apply) ? true : apply;
       var nthCall = 0;
       return function(){ // intercepting fn
          var that = this;
          var argz = arguments;
          nthCall++;
          var later = (function(version){
             return function(){
                if (version === nthCall){
                   return fn.apply(that, argz);
                }
             };
          })(nthCall);
          return $timeout(later, timeout, apply);
       };
    }
    $scope.layout.separateEditorOK = false;
    var lastSeparateEditorOK = false;
    $scope.layout.refreshSizes = function() {
       if (lastRightIsFullScreen) { // things are handled automatically for everything but the task layout
          var availableMainWidth = $('#main-area').width();
          var minWidth = $('#task-right').css('min-width');
          if (!minWidth) {minWidth = '0px';}
          minWidth = parseInt(minWidth.slice(0,-2));
          if (!minWidth) {minWidth = 800;}
          if (availableMainWidth - 2*minWidth > 40) {
            $scope.layout.separateEditorOK = true;
          } else {
            $scope.layout.separateEditorOK = false;
          }
         if (lastSeparateEditorOK != $scope.layout.separateEditorOK) {
            $timeout($rootScope.apply);
         }
         lastSeparateEditorOK = $scope.layout.separateEditorOK;
       } else {
         $scope.layout.separateEditorOK = false;
       }
    };
    // resizing on window resizing (tamed)
    $window.onresize = debounce($scope.layout.refreshSizes, 200, false);
    // function to be called at sync end by the service (it's alive. It's alive...)
    $rootScope.refreshSizes = $scope.layout.refreshSizes;
    // resizing on state change
    $rootScope.$on('$viewContentLoaded', function() {
       $timeout($scope.layout.refreshSizes, 0); // 100 works here, might have to be changed for slow computers
    });
    $interval($scope.layout.refreshSizes, 1000);
    $scope.$on('layout.taskLayoutChange', $scope.layout.refreshSizes);
}]);
