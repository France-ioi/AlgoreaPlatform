'use strict';

/*
// Not currently in use
angular.module('algorea')
  .directive('viewButton', function () {
    return {
      restrict: 'A',
      template: '<button type="button" class="btn btn-default btn-xs view-button" ng-click="toggleFullscreen();">'+
                  '<span class="glyphicon glyphicon-{{layout.buttonClass}}"></span>'+
                '</button>',
  };
});
*/


// loosely based on https://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element
// Compute the absolute top of the element.
function getAbsoluteTop (element) {
  var top = 0;
  var rect = element.getBoundingClientRect();
  var bodyRect = document.body.getBoundingClientRect(),
      elemRect = element.getBoundingClientRect();
      top = elemRect.top;
  return top;
}
// This directive sets the affix class on its single child element
// when the child's absolute top position is negative.
// The height of the container is also adjusted when the child is
// affixed to avoid changes to the page layout.
affixMeDirective.$inject = ['$window', '$timeout'];
function affixMeDirective ($window, $timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var isEnabled = false;
      function onScroll () {
        var child = element.children();
        var top = getAbsoluteTop(element[0]);
        scope.top = top;
        if (top >= 0) {
          child.removeClass('affix');
        } else {
          child.addClass('affix');
          element.css('height', child[0].offsetHeight);
        }
      }
      function enable () {
        if (!isEnabled) {
          $timeout(onScroll, 0);
          $window.addEventListener("scroll", onScroll);
          isEnabled = true;
        }
      }
      function disable () {
        if (isEnabled) {
          $window.removeEventListener("scroll", onScroll);
          var child = element.children();
          child.removeClass('affix');
          element.css('height', '');
          isEnabled = false;
        }
      }
      scope.$watch(attrs.affixMe, function (val) {
        if (val) enable(); else disable();
      });
      scope.$on('$destroy', disable);
    }
  };
}
angular.module('algorea').directive('affixMe', affixMeDirective);

// Menus states
angular.module('algorea')
   .factory('layoutService', ['$rootScope', function ($rootScope) {
      function reset () {
        $rootScope.affix = 'toolbar';
        $rootScope.showNavTopOverlay = false;
      }
      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams) {
        reset();
      });
      reset();
      return {
         openNavTopOverlay: function () {
            $rootScope.showNavTopOverlay = true;
         },
         closeNavTopOverlay: function () {
            $rootScope.showNavTopOverlay = false;
         },
         openSidebarLeftOverlay: function () {
            $rootScope.showSidebarLeftOverlay = true;
         },
         closeSidebarLeftOverlay: function () {
            $rootScope.showSidebarLeftOverlay = false;
         },
         openMobileTopMenu: function () {
            $rootScope.mobileNavTopIsOpen = true;
         },
         closeMobileTopMenu: function () {
            $rootScope.mobileNavTopIsOpen = false;
         },
         openMobileTopMenuOverlay: function () {
            $rootScope.showMobileNavTopOverlay = true;
         },
         closeMobileTopMenuOverlay: function () {
            $rootScope.showMobileNavTopOverlay = false;
         },
         affixToolbar: function () {
            $rootScope.affix = 'toolbar';
         },
         affixHeader: function () {
            $rootScope.affix = 'header';
         }
      };
   }]);


angular.module('algorea')
  .controller('layoutController', ['$scope', '$window', '$timeout', '$rootScope', '$interval', '$injector', 'itemService', 'pathService', '$state', 'layoutService', function ($scope, $window, $timeout, $rootScope, $interval, $injector, itemService, pathService, $state, layoutService) {
    var pane_west = $('.ui-layout-west');
    var pane_center = $('.ui-layout-center');
    var container = $('#layoutContainer');
    var taskMinWidth = 820;
    var nonTaskMinWidth = 400;
    var mapService = null;
    if (config.domains.current.useMap) {
      mapService = $injector.get('mapService');
      mapService.setClickedCallback(function(path, lastItem) {
        if (lastItem.sType == 'Task' || lastItem.sType == 'Course') {
           var pathArray = path.split('/');
           var selr = pathArray.length;
           var sell = selr -1;
           var pathParams = pathService.getPathParams();
           if (pathParams.basePathStr == path) {
              $scope.layout.closeMap();
           } else {
              $state.go('contents', {path: path,sell:sell,selr:selr});
           }
        }
      });
    }
    $scope.mapInfos = {
       'mapPossible' : true,
       'hasMap':false,
       'mapOpened' : false
    };
   $scope.gotoIndex = function() {
      var defaultPathStr = config.domains.current.defaultPath;
      if (defaultPathStr.substr(0, 10) == '/contents/') {
         defaultPathStr = defaultPathStr.substr(10, defaultPathStr.length);
         var pathArray = defaultPathStr.split('/');
         var selr = pathArray.length;
         var sell = selr -1;
      }
      $state.go('contents', {path: defaultPathStr,sell:null,selr:null});
   }
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
      navTopIsOpen: true,
      goFullscreen: function() {

      },
      goNormal: function() {

      },
      hasMap: function(hasMap, firstOpening) {
         $scope.mapInfos.hasMap = hasMap;
         if (!config.domains.current.useMap) return;
         if (hasMap == 'always') {
            $scope.layout.openMap();
         } else if (hasMap == 'never') {
            $scope.layout.closeMap();
         } else if (hasMap == 'button' && firstOpening) {
            $scope.layout.closeMap();
         }
      },
      openMap: function() {
         if (!$scope.mapInfos.mapMode && config.domains.current.useMap) {
            if ($scope.mapInfos.hasMap == 'button') {
               $scope.layout.navTopIsOpen = true;
            }
            $scope.mapInfos.mapMode = true;
            //$('#footer').hide();
            $('#view-right').hide();
            $('#map').show();
            mapService.show();
         }
      },
      closeMap: function() {
         if ($scope.mapInfos.mapMode) {
            if ($scope.mapInfos.hasMap == 'button') {
               $scope.layout.navTopIsOpen = false;
            }
            //$('#footer').show();
            $('#view-right').show();
            $('#map').hide();
            $scope.mapInfos.mapMode = false;
         }
      },
      openSidebarLeft: function() {
        $rootScope.sidebarLeftIsOpen = true;
        layoutService.openSidebarLeftOverlay(); // is hidden in CSS when not mobile layout to enable its visibility when resizing window
        $scope.layout.closeNavTopOverlay();
        if ($rootScope.isMobileLayout) {
          $scope.layout.closeMobileNavTop();
        }
      },
      closeSidebarLeft: function() {
        $rootScope.sidebarLeftIsOpen = false;
        layoutService.closeSidebarLeftOverlay();
      },
      closeSidebarLeftOverlay: function() {
        $scope.layout.closeSidebarLeft();
        layoutService.closeSidebarLeftOverlay();
      },
      openTaskMenu: function() {
         layoutService.affixHeader();
         layoutService.openNavTopOverlay();
         $scope.layout.navTopIsOpen = true;
      },
      openMobileTaskMenu: function() {
        layoutService.openNavTopOverlay();
        $scope.layout.navTopIsOpen = true;
        layoutService.openMobileTopMenu();
      },
      closeMobileTaskMenu: function() {
        layoutService.closeNavTopOverlay();
        $scope.layout.navTopIsOpen = false;
        layoutService.closeMobileTopMenu();
      },
      closeNavTopOverlay: function() {
        if ($rootScope.showNavTopOverlay) {
          layoutService.closeNavTopOverlay();
          layoutService.affixToolbar();
          $scope.layout.navTopIsOpen = false;
        }
      },
      openMobileNavTop: function() {
        layoutService.openMobileTopMenuOverlay();
        layoutService.openMobileTopMenu();
        if ($rootScope.isMobileLayout) {
          $scope.layout.closeSidebarLeft();
        }
      },
      closeMobileNavTop: function() {
        layoutService.closeMobileTopMenuOverlay();
        layoutService.closeMobileTopMenu();
      },
      breadcrumbsClicked: function(event) {
         // do not close menu when user clicks on link
         if (!config.domains.current.clickableMenu || event.target.parentNode.parentNode.className.indexOf('breadcrumbs-item') != -1 || event.target.className.indexOf('link-arrow') != -1) {
            return;
         }
      },
      toggleRight: function() {
         $('#sidebar-right').toggleClass('sidebar-right-toggled');
         $('#main-titlebar-community').toggleClass('main-titlebar-community-toggled');
         $scope.layout.refreshSizes();
      },
      setRightIcon: function() {
         if ($('#sidebar-right').hasClass('sidebar-right-toggled')) {
            $('#main-titlebar-community').addClass('main-titlebar-community-toggled');
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
      }
    };
   $scope.layout.rightIsFullScreen = function(rightIsFullScreen) {
      if (rightIsFullScreen == $rootScope.rightIsFullScreen) {
         return;
      }
      $rootScope.rightIsFullScreen = rightIsFullScreen;
       $scope.layout.navTopIsOpen = true;
       if (rightIsFullScreen) {
         if (!$scope.mapInfos.mapMode) {
           $scope.layout.navTopIsOpen = false;
         }
        $scope.layout.closeRight();
        $scope.layout.closeSidebarLeft();
       }
       $scope.layout.refreshSizes();
    };
    var isCurrentlyOnePage = !config.domains.current.useLeftNavigation;
    $scope.layout.isOnePage = function(isOnePage) {
       if (config.domains.current.useLeftNavigation) {
          if (typeof isOnePage === 'undefined') {
             return isCurrentlyOnePage || $rootScope.mapInfos.mapMode;
          }
          isCurrentlyOnePage = isOnePage;
       } else {
          return true;
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
    $scope.layout.separateEditorOK = false;
    var lastSeparateEditorOK = false;
    $scope.layout.refreshSizes = function() {
       if ($rootScope.rightIsFullScreen) { // things are handled automatically for everything but the task layout
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

    var lastWindowWidth = $(window).width();
    $scope.layout.onResize = function () {
       // reset the opened/closed status of the left sidebar depending on the
       // new window width
       var newWindowWidth = $(window).width();
       lastWindowWidth = newWindowWidth;

       $scope.layout.refreshSizes();
       $rootScope.isMobileLayout = newWindowWidth < 700 ? true : false;
    }
    // resizing on window resizing (tamed)
    $window.onresize = debounce($scope.layout.onResize, 100, false);
    // function to be called at sync end by the service (it's alive. It's alive...)
    $rootScope.refreshSizes = $scope.layout.refreshSizes;
    // resizing on state change
    $rootScope.$on('$viewContentLoaded', function() {
      $rootScope.hasSidebarLeft = $state.current.views && $state.current.views.left.template.length > 1 ? true : false;
      if ($rootScope.hasSidebarLeft && !$rootScope.isMobileLayout) {$scope.layout.openSidebarLeft();}
      $timeout($scope.layout.refreshSizes, 0); // 100 works here, might have to be changed for slow computers
    });
    $interval($scope.layout.refreshSizes, 1000);
    $scope.$on('layout.taskLayoutChange', $scope.layout.refreshSizes);
    $rootScope.sidebarLeftIsOpen = true;
    $rootScope.showSidebarLeftOverlay = false;
    $rootScope.mobileNavTopIsOpen = false;
    $rootScope.isMobileLayout = $(window).width() < 700 ? true : false;
}]);
