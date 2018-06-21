angular.module('algorea')
    .controller('modifyController', ['$scope', '$sce', '$timeout', '$rootScope', '$interval', 'pathService', function($scope, $sce, $timeout, $rootScope, $interval, pathService) {

    // Mandatory to get edition access
    SyncQueue.requests.algorea = {
       admin: true
    };

    $scope.$on('$destroy', function() {
        if($scope.getHeightInterval) {
            $interval.cancel($scope.getHeightInterval);
        }
        });

    // Make jschannel
    $scope.editorChan = null;
    $scope.buildChannel = function() {
        if(!$scope.modifyUrl || $scope.editorChan) { return; }
        if(!document.getElementById('iframe-editor')) {
           // The iframe hasn't rendered yet, retry in a second
           $timeout($scope.buildChannel, 1000);
           return;
        }
        $scope.editorChan = Channel.build({
            window: document.getElementById('iframe-editor').contentWindow,
            origin: '*',
            scope: 'editor'
            });
        $scope.editorChan.bind('link', $scope.gotLink);
        $scope.getHeightInterval = $interval($scope.getHeight, 1000);
    }
    $scope.$watch('modifyUrl', $scope.buildChannel);

    $scope.gotLink = function(ctx, params) {
        if(!params.url || $scope.item.sUrl == params.url) { return; }
        $scope.item.sUrl = params.url;
        ModelsManager.updated('items', $scope.item.ID);
        $rootScope.$broadcast('algorea.reloadTabs');
    }

    $scope.getHeight = function() {
        if(!$scope.editorChan) { return; }
        $scope.editorChan.call({
            method: 'getHeight',
            success: function(height) {
                $('#iframe-editor').css('height', parseInt(height)+400);
                if($rootScope.refreshSizes) {
                    $rootScope.refreshSizes();
                }
            }});
    }

    $scope.editors = [
        {sTitle: 'TaskPlatform task (with task-editor)', url: 'http://task-editor.france-ioi.org/#create/Dartmouth'},
        {sTitle: 'Direct task URL', url: 'direct'}
        ];
    $scope.newItemEditor = $scope.editors[0];
    $scope.newItemUrl = '';

    $scope.createTaskDisabled = function() {
        return $scope.newItemEditor.url == 'direct' && !$scope.newItemUrl;
    };

    $scope.startEditor = function() {
        if($scope.newItemEditor.url == 'direct') {
           $scope.item.sUrl = $scope.newItemUrl;
           $rootScope.$broadcast('algorea.reloadView', 'right');
        } else {
           $scope.modifyUrl = $sce.trustAsResourceUrl($scope.newItemEditor.url);
        }
    };

}]);
