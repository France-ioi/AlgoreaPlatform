angular.module('algorea')
  .service('backendService', ['$http', '$timeout', function($http, $timeout) {
    var backendService = {};

    /***** List of API calls *****/
    var apiCalls = {
      itemsBreadCrumbs: {
        endpoint: 'items/',
        inputs: [{name: 'idList', array: true, t: 'number'}],
        args: function(inputs) { return {ids: inputs.idList.join(',')}; }
      },

      groupRecentActivity: {
        endpoint: 'groups/{group_id}/recent_activity',
        inputs: [{name: 'group_id', t: 'number', replace: true},
                 {name: 'item_id', t: 'number'}],
        args: ['item_id']
      },

      groupView: {
        endpoint: 'groups/{group_id}',
        inputs: [{name: 'group_id', t: 'number'}],
        args: ['group_id']
      }
    };


    // Check that an argument has the right type
    function checkArg(type, arg) {
      if(type.array) {
        if(!angular.isArray(arg) ||
            _.find(arg, function(x) { !checkArg({t: type.t}, x); }) !== undefined) {
          return false;
        }
        return true;
      } else {
        if(type.t == 'number') {
          return !isNaN(arg);
        }
      }
    }

    // Create a service endpoint function
    function makeServiceEndpoint(data, callName) {
      return function() {
        var callArguments = arguments;

        var inputArgs = {};
        var argsToReplace = [];

        // Get and check input arguments
        var argErrors = [];
        angular.forEach(data.inputs, function(inputData, idx) {
          var curInput = callArguments[idx];
          if(!checkArg(inputData, curInput)) {
            argErrors.push(inputData.name);
            return;
          }
          inputArgs[inputData.name] = curInput;
          if(inputData.replace) { argsToReplace.push(inputData.name); }
        });
        if(argErrors.length) {
          // Return a fake object which will call the error function
          return {
            success: function() { return this; },
            error: function(errFunc) {
              $timeout(function() {
                errFunc('Invalid call to '+callName+', arguments invalid: '+argErrors.join(', '));
              });
            }
          }
        }

        // Set up options
        var options = {};
        Object.assign(options, data.baseOptions ? data.baseOptions : {});
        // The last call argument can be extra options
        var lastArg = callArguments[data.inputs.length];
        if(lastArg) {
          if(angular.isObject(lastArg)) {
            Object.assign(options, lastArg);
          } else {
            console.log('Notice : got extra argument during backend call to '+callName+'.');
          }
        }

        // Make endpoint URL
        var endpoint = data.endpoint;
        angular.forEach(argsToReplace, function(argName) {
          endpoint = endpoint.replace('{'+argName+'}', inputArgs[argName]);
        });

        // Make arguments
        var backendArgs = {};
        if(angular.isFunction(data.args)) {
          // A function makes the list of arguments
          backendArgs = data.args(inputArgs);
        } else if(angular.isArray(data.args)) {
          // Simply copy input arguments
          angular.forEach(data.args, function(argName) {
            backendArgs[argName] = inputArgs[argName];
          });
        } else {
          console.error('Error : backend call '+callName+' improperly configured.');
        }

        // Start the call to the API
        var getArgs = {};
        var postArgs = {};

        // Read options
        if(options.sort) {
          getArgs.sort = angular.isArray(options.sort) ? options.sort.join(',') : options.sort;
        }
        Object.assign(options.post ? postArgs : getArgs, backendArgs);

        // Make the actual call
        return $http({
          method: options.post ? 'POST' : 'GET',
          url: config.backendUrl + endpoint,
          params: getArgs,
          data: postArgs,
          });
      }
    };

    // Create the service endpoints according to the list
    angular.forEach(apiCalls, function(data, callName) {
      backendService[callName] = makeServiceEndpoint(data, callName);
    });


    return backendService;
}]);
