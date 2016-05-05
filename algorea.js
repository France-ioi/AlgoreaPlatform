'use strict';

// Make sure to include the `ui.router` module as a dependency
var app = angular.module('algorea', ['ui.router', 'ui.bootstrap', 'franceIOILogin', 'ngSanitize','small-ui-confirm']);

app.run(['$window', function($window) {
	$window.ga('create', 'UA-9457907-5', 'auto');
}]);
