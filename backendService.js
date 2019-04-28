angular.module('algorea')
.service('backendService', ['$http', '$timeout', '$q', 'loginService', function($http, $timeout, $q, loginService) {
    var backendService = {};

    /***** List of API calls *****/
    var apiCalls = {
        itemsBreadCrumbs: {
            endpoint: 'items/',
            method: 'GET',
            inputs: [{name: 'idList', array: true, t: 'int'}],
            getArgs: function(inputs) { return {ids: inputs.idList.join(',')}; }
        },

        groupRecentActivity: {
            endpoint: 'groups/{group_id}/recent_activity',
            method: 'GET',
            inputs: [{name: 'group_id', t: 'int', replace: true},
                     {name: 'item_id', t: 'int'}],
            getArgs: ['item_id']
        },

        groupView: {
            endpoint: 'groups/{group_id}',
            method: 'GET',
            inputs: [{name: 'group_id', t: 'int', replace: true}]
        },

        groupEdit: {
            endpoint: 'groups/{group_id}',
            method: 'PUT',
            inputs: [{name: 'group_id', t: 'int', replace: true},
                     {name: 'group_data', t: 'object'}],
            dataArgs: function(inputs) { return inputs.group_data; }
        },

        groupChildrenView: {
            endpoint: 'groups/{group_id}/children',
            method: 'GET',
            inputs: [{name: 'group_id', t: 'int', replace: true}]
        },

        groupAddChild: {
            endpoint: 'groups/{parent_group_id}/add_child/{child_group_id}',
            method: 'POST',
            inputs: [{name: 'parent_group_id', t: 'int', replace: true},
                     {name: 'child_group_id', t: 'int', replace: true}]
        },

        groupRequestsView: {
            endpoint: 'groups/{group_id}/requests',
            method: 'GET',
            inputs: [{name: 'group_id', t: 'int', replace: true},
                     {name: 'rejections_within_weeks', t: 'int', optional: true}],
            getArgs: ['rejections_within_weeks']
        },

        groupRequestsAccept: {
            endpoint: 'groups/{parent_group_id}/accept_requests',
            method: 'POST',
            inputs: [{name: 'parent_group_id', t: 'int', replace: true},
                     {name: 'group_ids', array: true, t: 'int'}],
            dataArgs: ['group_ids']
        },

        groupRequestsReject: {
            endpoint: 'groups/{parent_group_id}/reject_requests',
            method: 'POST',
            inputs: [{name: 'parent_group_id', t: 'int', replace: true},
                     {name: 'group_ids', array: true, t: 'int'}],
            dataArgs: ['group_ids']
        },

        groupChangePassword: {
            endpoint: 'groups/{group_id}/change_password',
            method: 'POST',
            inputs: [{name: 'group_id', t: 'int', replace: true}]
        },

        groupMemberView: {
            endpoint: 'groups/{group_id}/members',
            method: 'GET',
            inputs: [{name: 'group_id', t: 'int', replace: true}]
        }
    };


    // Check that an argument has the right type
    function checkArg(type, arg) {
        if(type.array) {
            var newType = {};
            Object.assign(newType, type);
            newType.array = false;
            if(!angular.isArray(arg) ||
                    _.find(arg, function(x) { !checkArg(newType, x); }) !== undefined) {
                return false;
            }
            return true;
        } else {
            if(type.optional && (typeof arg == 'undefined' || arg === null)) {
                return true;
            }
            if(type.t == 'int') {
                return /^\d+$/.test(arg);
            } else if(type.t == 'object') {
                // TODO :: better verification
                return angular.isObject(arg);
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
                // Return an angular Promise
                $q(function(resolve, reject) {
                    reject('Invalid call to '+callName+', arguments invalid: '+argErrors.join(', '));
                });
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
            function processArgs(argsProto) {
                if(!argsProto) { return {}; }
                var outputArgs = {};
                if(angular.isFunction(argsProto)) {
                    // A function makes the list of arguments
                    outputArgs = argsProto(inputArgs);
                } else if(angular.isArray(argsProto)) {
                    // Simply copy input arguments
                    angular.forEach(argsProto, function(argName) {
                        outputArgs[argName] = inputArgs[argName];
                    });
                } else {
                    console.error('Error : backend call '+callName+' improperly configured.');
                }
                return outputArgs;
            }
            var getArgs = processArgs(data.getArgs);
            var dataArgs = processArgs(data.dataArgs);

            // Read options
            if(options.sort) {
                getArgs.sort = angular.isArray(options.sort) ? options.sort.join(',') : options.sort;
            }

            // Make the actual call
            function callBackend() {
                return $http({
                    method: data.method,
                    url: config.backendUrl + endpoint,
                    params: getArgs,
                    data: dataArgs,
                    });
            }

            // Wait to get user data (as otherwise the backend won't answer any query)
            if(loginService.isLoggedIn()) {
                return callBackend();
            } else {
                return $q(function(resolve, reject) {
                    loginService.getLoginData(function() {
                        callBackend().then(resolve, reject);
                        });
                    });
            }
        }
    };

    // Create the service endpoints according to the list
    angular.forEach(apiCalls, function(data, callName) {
        backendService[callName] = makeServiceEndpoint(data, callName);
    });


    return backendService;
}]);
