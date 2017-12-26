'use strict';

// Make sure to include the `ui.router` module as a dependency
angular.module('algorea')
   .run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.templatesPrefix = (config.domains.current.compiledMode || !config.domains.current.assetsBaseUrl) ? '' : config.domains.current.assetsBaseUrl;
   }]);

// Make sure to include the `ui.router` module as a dependency.
angular.module('algorea')
   .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$sceDelegateProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $sceDelegateProvider) {
      if (config.domains.current.assetsBaseUrl) {
         $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            config.domains.current.assetsBaseUrl+'**'
         ]);
      }
      var templatesPrefix = (config.domains.current.compiledMode || !config.domains.current.assetsBaseUrl) ? '' : config.domains.current.assetsBaseUrl;
      $urlRouterProvider
         .otherwise(config.domains.current.defaultPath);
      $stateProvider
         .state("contents", {
            url: "/contents/*path?sell&selr&viewl&viewr",
            //reloadOnSearch: false,
            params: {
               path: config.domains.current.ProgressRootItemId
            },
            views: {
               'left': {
                   template: '<div class="sidebar-left-content" ng-include="\''+templatesPrefix+'navigation/views/navbaritem.html\'" ng-repeat="item in itemsList track by $index"></div>',
                   controller: 'leftNavigationController',
                },
                'right': {
                   template: '<div display-item></div>',
                   controller: 'rightNavigationController',
                },
                'breadcrumbs': {
                   templateUrl: templatesPrefix+'navigation/views/super-bread-crumbs.html',
                   controller: 'superBreadCrumbsController',
                },
             },
          })
          .state('profile', {
            url: "/profile/:section",
            views: {
              'left': {
                  template: '',
                },
                'right': {
                  templateUrl: templatesPrefix+'profile/profile.html',
                  controller: 'profileController',
                },
                'breadcrumbs': {
                  template: '<div class="breadcrumbs-item"><span class="breadcrumbs-item-active breadcrumbs-item-active-last">Profile</span></div>',
                },
            },
          }).state("groupAdminGroup", {
            url: "/groupAdmin/:idGroup/:section",
            views: {
               'left': {
                   template: '',
                },
                'right': {
                   templateUrl: templatesPrefix+'groupAdmin/group.html',
                   controller: 'groupAdminController',
                },
                'breadcrumbs': {
                   templateUrl: templatesPrefix+'groupAdmin/breadcrumbs.html',
                   controller: 'groupAdminBreadCrumbsController',
                },
             }
          }).state('userInfos', {
             url: "/userInfos",
             views: {
               'left': {
                   template: '',
                },
                'right': {
                   templateUrl: templatesPrefix+'userInfos/index.html',
                   controller: 'userInfosController',
                },
                'breadcrumbs': {
                   template: '<div class="breadcrumbs-item"><span class="breadcrumbs-item-active breadcrumbs-item-active-last">Profil</span></div>',
                },
             },
          }).state("forum", {
            url: "/forum/",
            views: {
               'left': {
                   template: '',
                   controller: 'leftNavigationController',
                },
                'right': {
                   templateUrl: templatesPrefix+'forum/index.html',
                   controller: 'forumIndexController',
                },
                'breadcrumbs': {
                   template: '',
                },
             },
          }).state("concourir", {
            url: "/concourir",
            views: {
               'left': {
                   template: '',
                },
                'right': {
                   templateUrl: templatesPrefix+'static/concourir.html',
                },
                'breadcrumbs': {
                   template: '',
                },
             },
          }).state("newThread", {
            url: "/forum/thread/new",
            views: {
               'left': {
                   template: '',
                },
                'right': {
                   templateUrl: templatesPrefix+'forum/thread.html',
                   controller: 'forumThreadController',
                },
                'breadcrumbs': {
                   template: '',
                },
             },
          }).state("newThreadType", {
            url: "/forum/thread/new/:sType",
            views: {
               'left': {
                   template: '',
                },
                'right': {
                   templateUrl: templatesPrefix+'forum/thread.html',
                   controller: 'forumThreadController',
                },
                'breadcrumbs': {
                   template: '',
                },
             },
          }).state("thread", {
            url: "/forum/thread/:idThread",
            views: {
               'left': {
                   template: '',
                },
                'right': {
                   templateUrl: templatesPrefix+'forum/thread.html',
                   controller: 'forumThreadController',
                },
                'breadcrumbs': {
                   template: '',
                },
             },
          });
          $locationProvider.html5Mode(true);
      }]);

angular.module('algorea')
   .service('pathService', ['$stateParams', '$state', '$rootScope', '$timeout', 'itemService','$view','$window','$location', function($stateParams, $state, $rootScope, $timeout, itemService,$view, $window,$location) {
     /* Warning: tricks at work here!
      *
      * As of today (2014-03-18), none of the available routers handle the possibility
      * to have query params reload the views and others not. But we have to
      * do that here, and we do it with the following code.
      *
      * This should be handled differently when a router will handle this kind
      * of features.
      *
      * Another possible solution is described here:
      *    https://github.com/angular-ui/ui-router/issues/322
      * but I find it less elegant because it breaks ui-sref
      */
      $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
         if (fromState.name == 'contents' && toState.name == 'contents' && fromParams.path == toParams.path && fromParams.sell == toParams.sell && typeof toParams.selr == "undefined" && fromParams.selr == toParams.path.split('/').length) {
             // here, only the parameters that shouldn't change the view are changed in the URL
             event.preventDefault();
             /* Ok, we prevent default, *but*, preventing default in this signal
              * handling means to rewrite the url in its previous state, which
              * we don't want!
              *
              * So the following code executes right after the end of the
              * current $digest and re-replaces the url by its wanted value
              * and sends a signal to the controller to change the task view.
              */
             $timeout(function() {
                   $state.go(toState, toParams, {notify: false, location: 'replace'});
                   $rootScope.$broadcast('algorea.taskViewChange', toParams, fromParams);
                },0);
             return;
         }
         /* This part is also a hack due to the limited capacities of routers.
          * It's been done after reporting https://github.com/angular-ui/ui-router/issues/1744
          * (which has a description of the addressed problem)
          * The idea is not to reload left view when unnecessary. This was
          * introduced in order not to reload left iframe in case of static content.
          * The code computes left item before and after, and if it's the same,
          * it just sends a signal instead of reloading the views. Then the scopes
          * need to handle their reloading themselves by watching the signal.
          */
         if (fromState.name == 'contents' && toState.name == 'contents') {
            var toPath = toParams.path.split('/');
            var toSelr = toParams.selr ? parseInt(toParams.selr) : toPath.length;
            var toSell = toParams.sell ? parseInt(toParams.sell) : toSelr -1;
            var toLeftItem = toPath[toSell-1];
            var fromPath = fromParams.path.split('/');
            var fromSelr = fromParams.selr ? parseInt(fromParams.selr) : fromPath.length;
            var fromSell = fromParams.sell ? parseInt(fromParams.sell) : fromSelr -1;
            var fromLeftItem = fromPath[fromSell-1];
            if(fromLeftItem == toLeftItem) {
               event.preventDefault();
               $timeout(function() {
                  $state.go(toState, toParams, {notify: false, location: 'replace'});
                  $timeout(function() {
                     $rootScope.$broadcast('algorea.reloadView', 'breadcrumbs');
                     $rootScope.$broadcast('algorea.reloadView', 'right');
                  },0);
               },0);
            }
         }
      });
    /*
     * Simple service for path parsing and analysis and url factoring
     */
      return {
        // analyzes path parameters
        getPathParams: function (pane) {
           var pathParams =  {};
           pathParams.path = $stateParams.path.split('/');
           pathParams.pathStr = $stateParams.path;
           pathParams.selr = $stateParams.selr ? $stateParams.selr : pathParams.path.length;
           pathParams.sell = ($stateParams.sell && $stateParams.sell <= pathParams.selr) ? $stateParams.sell : pathParams.selr -1;
           if (pane == 'menu') {
              return pathParams;
           }
           /*
            * for /11/12/13/14/15/16?sell=2&selr=4, we have
            *   for left pane:  base_path = /11/12
            *   for right pane: base_path = /11/12/13/14
            *
            * sell = -1 means not to print anything on the left, we return currentItemID == -2
            * selr = r means to print resolution on the right, we return resolution = true
            */
           var basePath = pathParams.path.slice(0,(pane=='left' ? pathParams.sell : pathParams.selr));
           pathParams.basePathStr = basePath.join('/');
           pathParams.baseDepth = basePath.length;
           pathParams.currentItemID = 0;
           pathParams.viewl = $stateParams.viewl;
           pathParams.viewr = $stateParams.viewr;
           pathParams.itemsOnBothSides = pathParams.selr == pathParams.sell;
           if ($stateParams.sell === 0 && pane == 'left') {
              pathParams.currentItemID = -2;
           } else {
              pathParams.currentItemID = pathParams.path[(pane=='left' ? pathParams.sell-1 : pathParams.selr-1)];
           }
           pathParams.parentItemID = -2;
           if ((pane == 'left' && pathParams.sell > 1) || (pane == 'right' && pathParams.selr > 1)) {
              pathParams.parentItemID = pathParams.path[(pane=='left' ? pathParams.sell-2 : pathParams.selr-2)];
           }
           return pathParams;
        },
        // returns string to pass to ui-sref for a link to current item
        // view is optional and contains the view the task must show (in relevant case)
        getSref: function(panel, depth, pathParams, relativePath, view) {
           if (panel == 'menu') {
              return this.getSrefString(pathParams.pathStr, depth, depth+1);
           }
           var sell = panel=='left' ? pathParams.sell : pathParams.selr;
           var path = pathParams.basePathStr + relativePath;
           sell = '' + (parseInt(sell) + Math.max(relativePath.split('/').length - 2, 0)); // If we're going much deeper, jump
           var selr = null;
           if (pathParams.pathStr.substring(0, path.length) == path && (pathParams.path[path.length+1] || pathParams.pathStr[path.length+1]=='/')) {
              selr = pathParams.baseDepth + depth;
              path = pathParams.pathStr;
              if (pathParams.path.length == selr) {
                 selr=null;
              }
           }
           return this.getSrefString(path, sell, selr, null, view ? view : null);
        },
        // returns function to go to relative path:
        getStateGo: function(panel, depth, pathParams, relativePath, view) {
           if (panel == 'menu') {
              return this.getSrefFunction(pathParams.pathStr, depth, depth+1);
           }
           var sell = panel=='left' ? pathParams.sell : pathParams.selr;
           var path = pathParams.basePathStr + relativePath;
           var selr = null;
           if (pathParams.pathStr.substring(0, path.length) == path && (pathParams.path[path.length+1] || pathParams.pathStr[path.length+1]=='/')) {
              selr = pathParams.baseDepth + depth;
              path = pathParams.pathStr;
              if (pathParams.path.length == selr) {
                 selr=null;
              }
           }
           return this.getSrefFunction(path, sell, selr, null, view ? view : null);
        },
        getSrefString: function(path, sell, selr, viewl, viewr) {
           return "contents("+JSON.stringify({path:path, sell: sell, selr: selr, viewl: viewl, viewr: viewr})+")";
        },
        getSrefFunction: function(path, sell, selr, viewl, viewr) {
           return function() {$state.go("contents", {path:path, sell: sell, selr: selr, viewl: viewl, viewr: viewr})};
        },
        goToResolution: function(pathParams) {
           $state.go('contents', {
              path:   pathParams.pathStr,
              sell:   pathParams.selr,
              selr:   pathParams.selr,
              viewl:  pathParams.viewl,
              viewr: 'editor',
           });
        },
        openItemFromLink: function(itemId, pathParams, pane) {
           if (itemService.isSonOf(itemId, pathParams.currentItemID)) {
              $state.go('contents', {
                 path:   pathParams.basePathStr+'/'+itemId,
                 sell:   pane == 'right' ? pathParams.selr : pathParams.sell,
                 selr:   pane == 'right' ? parseInt(pathParams.selr)+1 : parseInt(pathParams.sell)+1,
              });
           } else {
              $state.go('contents', {
                 path:   itemId,
                 sell:   -1,
                 selr:   1,
              });
           }
        }
      };
   }]);
