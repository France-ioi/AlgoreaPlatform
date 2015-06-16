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

var display_right = $('#display-right');
var scrollbar_right = $('#scrollbar-right');
var scrollbar_inner_right = $('#inner-scrollbar-right');
var display_left = $('#display-left');
var scrollbar_left = $('#scrollbar-left');
var scrollbar_inner_left = $('#inner-scrollbar-left');
function updateScrollBarRight() {
   scrollbar_inner_right.width(display_right.prop('scrollWidth'));
   display_right.prop('scrollLeft', scrollbar_right.scrollLeft());
}
function updateScrollBarLeft() {
   scrollbar_inner_left.width(display_left.prop('scrollWidth'));
   display_left.prop('scrollLeft', scrollbar_left.scrollLeft());
}

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
      global: $('#layoutContainer').layout({
          // http://layout.jquery-dev.net/documentation.cfm#List_of_Options
          north__slidable: false,
          west__slidable:  false,
          east__slidable:  true,
          east__size:     "20%",
          north__size:     153,
          north__maxSize:  153,
          east__maxSize:  "30%",
          west__size:  406,
          north__togglerLength_open:   0,
          east__togglerLength_closed: "100%",
          west__togglerLength_closed: "100%",
          north__spacing_closed: 0,
          north__spacing_open:   4,
          north__showOverflowOnHover: true,
          west__onopen: function() {$scope.layout.west_is_open = true; $scope.$apply(); $scope.layout.refreshSizes();},
          west__onclose: function() {$scope.layout.west_is_open = false; $scope.$apply(); $timeout($scope.layout.refreshSizes, 500); },
          center__onresize: function() {$scope.layout.tablesResized(); $scope.layout.refreshSizes();},
          maskContents:true,
      }),
      west_is_open : true,
      tablesResized: function() {
         var width_right= $('#content-right').width();
         var width_left= $('#content-left').width();
         if (width_right > 500) {
            $rootScope.right_is_small = false;
            $('#content-right .sons-from-parent').toggleClass('sons-from-parent-large', true);
            $('#content-right .sons-from-parent').toggleClass('sons-from-parent-small', false);
         } else {
            $rootScope.right_is_small = true;
            $('#content-right .sons-from-parent').toggleClass('sons-from-parent-small', true);
            $('#content-right .sons-from-parent').toggleClass('sons-from-parent-large', false);
         }
         if (width_left > 500) {
            $rootScope.left_is_small = false;
            $('#content-left .sons-from-parent').toggleClass('sons-from-parent-large', true);
            $('#content-left .sons-from-parent').toggleClass('sons-from-parent-small', false);
         } else {
            $rootScope.left_is_small = true;
            $('#content-left .sons-from-parent').toggleClass('sons-from-parent-small', true);
            $('#content-left .sons-from-parent').toggleClass('sons-from-parent-large', false);
         }
      },
      refreshSizes : function() {
         // hackish, inspired from
         // http://layout.jquery-dev.net/demos/flexible_height_columns.html
         var old_height = container.height();
         var content_left = $('#content-left');
         var content_right = $('#content-right');
         var display_left = $('#display-left');
         var display_right = $('#display-right');
         // first updating scrollbars
         var width_center = content_right.outerWidth();
         var width_west = content_left.outerWidth();
         if (width_center > $scope.rightMinWidth) {
            scrollbar_right.hide();
         } else {
            scrollbar_right.show();
            scrollbar_right.css('left', pane_center.position().left);
            scrollbar_right.width(pane_center.width());
            updateScrollBarRight();
         }
         if (width_west > $scope.leftMinWidth) {
            scrollbar_left.hide();
         } else {
            scrollbar_left.show();
            scrollbar_left.css('left', pane_west.position().left);
            scrollbar_left.width(pane_west.width());
            updateScrollBarLeft();
         }
         var height_west = content_left.outerHeight();
         var height_center = content_right.outerHeight();
         var top_height;
         if ($scope.layout.global.state.north.isClosed) {
            top_height = $scope.layout.global.options.north.spacing_closed;
         } else {
            top_height = $scope.layout.global.state.north.outerHeight+$scope.layout.global.options.north.spacing_open;
         }
         var max_pane_height = Math.max($window.innerHeight - top_height, Math.max(content_right.outerHeight(), content_left.outerHeight()));
         var new_height = Math.max($window.innerHeight, top_height + Math.max(height_center, height_west));
         display_left.height(max_pane_height - (pane_west.outerHeight() - pane_west.height()));
         display_right.height(max_pane_height + pane_center.height() - pane_center.outerHeight());
         if (new_height != old_height) {
            container.height(new_height);
            $scope.layout.global.resizeAll();
         }
      },
      buttonClass: "fullscreen",
      state: "normal",
      goFullscreen: function() {
        this.global.options.east.spacing_closed = 0;
        this.global.close('north');
        this.global.close('east');
      },
      goNormal: function() {
        this.global.options.east.spacing_closed = 6;
        this.global.open('north');
        this.global.open('east');
      },
    };
    $scope.toggleFullscreen = function() {
      if ($scope.layout.state == "normal") {
        $scope.layout.buttonClass = "resize-small";
        $scope.layout.state = "fullscreen";
        $scope.layout.goFullscreen();
      } else {
        $scope.layout.buttonClass = "fullscreen";
        $scope.layout.state = "normal";
        $scope.layout.goNormal();
      }
    };
    $scope.leftMinWidth = nonTaskMinWidth;
    $scope.rightMinWidth = nonTaskMinWidth;
    $scope.layout.leftIsTask = function(leftIsTask) {
       $scope.leftMinWidth = leftIsTask ? taskMinWidth : nonTaskMinWidth;
       $('#content-left').css('min-width', $scope.leftMinWidth);
    };
    $scope.layout.rightIsTask = function(rightIsTask) {
       $scope.rightMinWidth = rightIsTask ? taskMinWidth : nonTaskMinWidth;
       $('#content-right').css('min-width', $scope.rightMinWidth);
    };
    var isCurrentlyOnePage;
    $scope.layout.isOnePage = function(isOnePage) {
       if (typeof isCurrentlyOnePage !== 'undefined' && isOnePage == isCurrentlyOnePage) {
          return;
       }
       if (isOnePage) {
          $scope.layout.global.options.west.spacing_closed = 0;
          $scope.layout.global.close('west');
          isCurrentlyOnePage = isOnePage;
       } else {
          $scope.layout.global.options.west.spacing_closed = 6;
          $scope.layout.global.open('west');
          isCurrentlyOnePage = isOnePage;
       }
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
    // resizing on window resizing (tamed)
    $window.onresize = debounce($scope.layout.refreshSizes, 200, false);
    // function to be called at sync end by the service (it's alive. It's alive...)
    $rootScope.refreshSizes = function() {
      $scope.layout.refreshSizes();
      $scope.layout.tablesResized();
    };
    // resizing on state change
    $rootScope.$on('$viewContentLoaded', function() {
       $timeout($rootScope.refreshSizes, 0); // 100 works here, might have to be changed for slow computers
    });
    $interval($scope.layout.refreshSizes, 1000);
}]);
