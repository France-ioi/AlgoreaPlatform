'use strict';

// Make sure to include the `ui.router` module as a dependency
angular.module('algorea')
   .run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.templatesPrefix = (config.domains.current.compiledMode || !config.domains.current.assetsBaseUrl) ? '' : config.domains.current.assetsBaseUrl;
   }]);

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
            url: "/contents/*path/:section",
            params: {
               path: config.domains.current.ProgressRootItemId
            },
            views: {
                'right': {
                   template: '<div display-item from="main"></div>',
                   controller: 'rightNavigationController',
                },
                'breadcrumbs': {
                   templateUrl: templatesPrefix+'navigation/views/super-bread-crumbs.html',
                   controller: 'superBreadCrumbsController',
                },
             },
          })
          .state("oldcontents", {
            // Legacy URLs
            url: "/contents/*path?sell&selr&viewl&viewr"
          })
          .state('profile', {
            url: "/profile/:section",
            views: {
                'right': {
                   templateUrl: templatesPrefix+'profile/profile.html',
                   controller: 'profileController',
                },
                'breadcrumbs': {
                   templateUrl: templatesPrefix+'navigation/views/breadcrumbs-profile.html'
                },
            },
          }).state("groupAdminGroup", {
            url: "/groupAdmin/:idGroup/:section",
            views: {
                'right': {
                   templateUrl: templatesPrefix+'groupAdmin/group.html',
                   controller: 'groupAdminController',
                },
                'breadcrumbs': {
                   templateUrl: templatesPrefix+'groupAdmin/breadcrumbs.html',
                   controller: 'groupAdminBreadCrumbsController',
                },
             }
          }).state("forum", {
            url: "/forum/",
            views: {
                'right': {
                   templateUrl: templatesPrefix+'forum/index.html',
                   controller: 'forumIndexController',
                },
                'breadcrumbs': {
                   template: '',
                },
             },
          }).state("newThread", {
            url: "/forum/thread/new",
            views: {
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
         // Keep legacy URLs valid
         if(toState.name == 'contents' || toState.name == 'oldcontents') {
             var toPath = toParams.path;
             var sanitizedPath = toPath.replace(/\//g, '-');
             if(toState.name == 'oldcontents' || sanitizedPath != toPath) {
                event.preventDefault();
                toParams.path = sanitizedPath;
                $state.go('contents', toParams);
                return;
             }
         }

         if (fromState.name == 'contents' && toState.name == 'contents' && fromParams.path == toParams.path) {
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
         $timeout(function() {
            $rootScope.$broadcast('algorea.reloadView', 'breadcrumbs');
//            $rootScope.$broadcast('algorea.reloadView', 'right');
         }, 0);
      });
    /*
     * Simple service for path parsing and analysis and url factoring
     */
      return {
        // analyzes path parameters
        getPathParams: function (pane) {
           var pathParams =  {};
           pathParams.path = $stateParams.path.split('-');
           pathParams.pathStr = $stateParams.path;
           if (pane == 'menu') {
              return pathParams;
           }
           pathParams.section = $stateParams.section;
           if(pane == 'left') {
              var basePath = pathParams.path.slice(0, pathParams.path.length-1);
              pathParams.currentItemID = pathParams.path.length > 1 ? pathParams.path[pathParams.path.length-2] : -2;
              pathParams.parentItemID = pathParams.path.length > 2 ? pathParams.path[pathParams.path.length-3] : -2;
           } else {
              var basePath = pathParams.path;
              pathParams.currentItemID = pathParams.path[pathParams.path.length-1];
              pathParams.parentItemID = pathParams.path.length > 1? pathParams.path[pathParams.path.length-2] : -2;
           }
           pathParams.basePathStr = basePath.join('-');
           pathParams.baseDepth = basePath.length;
           return pathParams;
        },
        getPathAtDepth: function(path, depth) {
           if(typeof depth != 'undefined' && depth != null) {
              return path.slice(0, depth+1);
           }
           return path;
        },
        getPathStrAtDepth: function(pathStr, depth) {
           if(typeof depth != 'undefined' && depth != null) {
              pathStr = pathStr.split('-').slice(0, depth+1).join('-');
           }
           return pathStr;
        },
        // returns string to pass to ui-sref for a link to current item
        // view is optional and contains the view the task must show (in relevant case)
        getSref: function(panel, depth, pathParams, relativePath, view) {
           if (panel == 'menu') {
              return this.getSrefString(pathParams.pathStr, depth);
           }
           var path = pathParams.basePathStr + relativePath;
           var newDepth = pathParams.baseDepth + depth;
           return this.getSrefString(path, newDepth, view ? view : null);
        },
        // returns function to go to relative path:
        getStateGo: function(panel, depth, pathParams, relativePath, view) {
           if (panel == 'menu') {
              return this.getSrefFunction(pathParams.pathStr, depth);
           }
           var path = pathParams.basePathStr + relativePath;
           var newDepth = pathParams.baseDepth + depth;
           return this.getSrefFunction(path, newDepth, null, view ? view : null);
        },
        getSrefString: function(path, depth, section) {
           // Get string for ui-sref, targetting depth in path
           path = this.getPathStrAtDepth(path, depth);
           return "contents("+JSON.stringify({path: path, section: section})+")";
        },
        getSrefFunction: function(path, depth, section) {
           // Get function to go to depth in path
           path = this.getPathStrAtDepth(path, depth);
           return function() {
              if(!section) { section = $stateParams.section; }
              $state.go("contents", {path: path, section: section})
              };
        },
        goToResolution: function(pathParams) {
           $state.go('contents', {
              path:    pathParams.pathStr,
              section: 'editor',
           });
        },
        openItemFromLink: function(itemPath) {
           // Currently only used by platform.openUrl
           var params = {};
           params.path = typeof itemPath == 'string' ? itemPath : itemPath.path;
           params.path = params.path.replace(/\//g, '-');
           if(itemPath && itemPath.newTab) {
              window.open($state.href('contents', params));
           } else {
              $state.go('contents', params);
           }
        }
      };
   }]);
