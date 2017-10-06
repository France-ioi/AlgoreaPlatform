'use strict';

// Make sure to include the `ui.router` module as a dependency
var app = angular.module('algorea', ['ui.router', 'ui.bootstrap', 'franceIOILogin', 'ngSanitize','small-ui-confirm', 'anguFixedHeaderTable', 'jm.i18next']);

app.factory('$exceptionHandler', ['$log', function($log) {
    return function (exception, cause) {
      $log.error(exception, cause);
      ErrorLogger.log(exception.message, exception.fileName, exception.lineNumber, exception.columnNumber, exception);
    }
}]);

app.factory('preventTemplateCache', function($injector) {
  return {
    'request': function(cfg) {
      // 'uib/' - we must skip bootstrap templates since they are in cache already
      if(cfg.url.indexOf('.html') !== -1 && cfg.url.indexOf('uib/') === -1 && cfg.url.substr(0, 4) != 'mem/') {
        cfg.url += (window.config.domains.current.urlArgs || '');
      }
      return cfg;
    }
  }
}).config(function($httpProvider) {
  $httpProvider.interceptors.push('preventTemplateCache');
});
