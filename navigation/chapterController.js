'use strict';

angular.module('algorea')
.controller('chapterController', [
    '$rootScope', '$scope', 'itemService', '$state', '$i18next', '$uibModal', '$sce', '$timeout', '$interval', '$http', 'loginService', 'pathService', 'tabsService',
    function ($rootScope, $scope, itemService, $state, $i18next, $uibModal, $sce, $timeout, $interval, $http, loginService, pathService, tabsService) {
        $scope.itemService = itemService;
        $scope.tabsService = tabsService;
        $scope.models = models;
        $scope.tab = 'content';

        $scope.links = {};
        $scope.showMore = {};

        $scope.sortableOptions = {
            handle: '.drag-ctrl',
            stop: function(event, ui) {
                recalculateItemsOrder();
            }
        }

        $scope.setupSync = function() {
            if($scope.getEditMode() != 'edit') { return; }
            // sync does not work without this
            if(!SyncQueue.requests) { SyncQueue.requests = {}; }
            SyncQueue.requests.algorea = {
                admin: true
            };
        }

        var user = null;
        loginService.getLoginData(function(res) {
            user = res;
        })

        tabsService.resetTabs($scope.getEditMode && $scope.getEditMode() == 'edit');
        tabsService.addTab({id: 'content', title: 'chapterEditor_content', order: 0});

        // common
        $scope.availableLocales = ModelsManager.getRecords('languages');
        // TODO :: Why is that happening?
        if($scope.availableLocales[0]) { delete $scope.availableLocales[0]; }

        function refresh() {
            $scope.allowReorder = !$scope.item.bFixedRanks;
            $scope.items = itemService.getChildren($scope.item);
            $scope.item_strings = $scope.item.strings[0];
            $scope.item_strings_compare = null;
            if($scope.getEditMode() == 'edit' && $scope.item.sRepositoryPath) {
                tabsService.addTab({id: 'repository', title: 'chapterEditor_repository', order: 200});
            }
            $scope.setupSync();
            $scope.itemItems = {};
            angular.forEach($scope.item.children, function(itemItem) {
                $scope.itemItems[itemItem.child.ID] = itemItem;
            });
        }
        refresh();

        function getItemItem(item) {
            // Get the item_item between the current item and the argument
            var item_item = null;
            angular.forEach(item.parents, function(ii) {
                if(ii.idItemParent == $scope.item.ID) {
                    item_item = ii;
                }
            });
            return item_item;
        }


        $scope.$on('algorea.reloadTabs', function(event) {
            refresh();
        });
        $scope.$on('algorea.reloadView', function(event, view) {
            if(view == 'right') {
                refresh();
            }
        });


        $scope.getItemIcon = itemService.getItemIcon;

        $scope.getChildSref = function(item) {
            return pathService.getSref($scope.panel, typeof $scope.depth != 'undefined' ? $scope.depth + 1 : 0, $scope.pathParams, '-' + item.ID);
        };

        $scope.setChanged = function(itemItem) {
            ModelsManager.updated('items_items', itemItem.ID);
        }

        $scope.contestWithinDates = function() {
            var d = new Date();
            if($scope.item.sAccessOpenDate && d < $scope.item.sAccessOpenDate) { return false; }
            var endDate = new Date($scope.item.sEndContestDate.valueOf());
            endDate.setDate(endDate.getDate() + 1);
            if($scope.item.sEndContestDate && d > endDate) { return false; }
            return true;
        }

        // children items

        function createItem(sType, sTitle) {
            var item = ModelsManager.createRecord("items");
            item.bOwnerAccess = true;
            item.sType = sType;
            ModelsManager.insertRecord("items", item);

            var groupItem = ModelsManager.createRecord("groups_items");
            groupItem.idItem = item.ID;
            groupItem.idGroup = user.idGroupSelf;
            var accessStartDate = new Date();
            accessStartDate.setDate(accessStartDate.getDate() - 1);
            groupItem.sFullAccessDate = accessStartDate;
            groupItem.bCachedFullAccess = true;
            groupItem.bOwnerAccess = true;
            groupItem.idUserCreated = user.ID;
            ModelsManager.insertRecord("groups_items", groupItem);

            var itemStrings = ModelsManager.createRecord("items_strings");
            itemStrings.idItem = item.ID;
            itemStrings.idLanguage = 1; // TODO: handle this
            itemStrings.sTitle = sTitle;
            ModelsManager.insertRecord("items_strings", itemStrings);

            var userItem = ModelsManager.createRecord("users_items");
            userItem.idUser = user.ID;
            userItem.idItem = item.ID;
            ModelsManager.insertRecord("users_items", userItem);
            return item;
        }


        function addItem(item, parentItem) {
            // Add an item to a parent
            if(!parentItem) { parentItem = $scope.item; }
            var itemItem = ModelsManager.createRecord("items_items");
            itemItem.idItemParent = parentItem.ID;
            itemItem.idItemChild = item.ID;
            var iChildOrder = 0;
            angular.forEach($scope.item.children, function(child) {
                if(child.iChildOrder > iChildOrder) {
                    iChildOrder = child.iChildOrder;
                }
            })
            itemItem.iChildOrder = iChildOrder + 1;
            ModelsManager.insertRecord("items_items", itemItem);
            $rootScope.$broadcast('algorea.reloadView', 'right');
        }



        function deleteItemItem(item_item) {
            // Delete an item_item link
            if(!item_item) { return; }
            ModelsManager.deleteRecord('items_items', item_item.ID);
            recalculateItemsOrder(item_item.parent);
            $rootScope.$broadcast('algorea.reloadView', 'right');
        }


        function destroyItem(item) {
            // Delete an item from the database
            // TODO :: delete all links and associated data
            if(!item) { return; }
            if(itemService.getClipboard().ID == item.ID) {
                itemService.setClipboard(null);
            }
            ModelsManager.deleteRecord('items', item.ID);
        }

        $scope.addNewChapter = function() {
            $scope.creating = {
                sType: 'Chapter',
                icon: 'folder',
                placeholder: $i18next.t('chapterEditor_new_chapter_title'),
                name: ''
                }
        }

        $scope.addNewTask = function() {
            $scope.creating = {
                sType: 'Task',
                icon: 'keyboard',
                placeholder: $i18next.t('chapterEditor_new_task_title'),
                name: ''
                }
        }

        $scope.addNewCourse = function() {
            $scope.creating = {
                sType: 'Course',
                icon: 'assignment',
                placeholder: $i18next.t('chapterEditor_new_course_title'),
                name: ''
                }
        }

        $scope.create = function() {
            if(!$scope.creating || !$scope.creating.name) { return; }
            var item = createItem($scope.creating.sType, $scope.creating.name);
            addItem(item);
            $scope.creating = null;
        }

        $scope.cancelCreate = function() {
            $scope.creating = null;
        }

        $scope.addExistingItem = function() {
            $uibModal.open({
                templateUrl: '/navigation/views/chapter/browse-items-dialog.html',
                controller: 'chapterEditorBrowserController',
                resolve: {
                    callback: function() {
                        return function(item) {
                            addItem(item);
                        }
                    },
                    startItem: function() {
                        return $scope.item;
                    },
                    startPath: function() {
                        return pathService.getPathParams('right').path;
                    }
                },
                backdrop: 'static',
                keyboard: false
            });
        }

        // Clipboard
        $scope.copyItem = function(item) {
            itemService.setClipboard({
                ID: item.ID,
                title: item.strings[0].sTitle
            });
        }


        $scope.cutItem = function(item) {
            itemService.setClipboard({
                ID: item.ID,
                title: item.strings[0].sTitle,
                cut: getItemItem(item) // Remove this item_item when we paste
            });
        }


        $scope.pasteItem = function() {
            var clipboard = itemService.getClipboard();
            if(!clipboard) { return; }

            var item = ModelsManager.getRecord('items', clipboard.ID);
            addItem(item);
            if(clipboard.cut) {
                // Item was cut, remove former link
                deleteItemItem(clipboard.cut);
            }
        }


        $scope.removeItem = function(item) {
            // Show popup to remove an item
            var item_item = getItemItem(item);
            $uibModal.open({
                templateUrl: '/navigation/views/chapter/delete-dialog.html',
                controller: function($scope) {
                    $scope.close = function () {
                        $scope.$close();
                    };
                    $scope.removeItem = function () {
                        deleteItemItem(item_item);
                        $scope.$close();
                    };
                    $scope.destroyItem = function () {
                        destroyItem(item);
                        $scope.$close();
                    };
                },
                backdrop: 'static',
                keyboard: false
            });
        }


        function recalculateItemsOrder(parentItem) {
            // Recalculate the order for parentItem's children
            if(!parentItem) { parentItem = $scope.item; }
            if(parentItem.bFixedRanks) {
                return;
            }
            var iChildOrder = {}
            $.each(parentItem.children, function(idx, itemItem) {
                itemItem.iChildOrder = idx+1;
                $scope.setChanged(itemItem);
            });
        }

        $scope.getLinks = function(item) {
            if(!item.sUrl || item.sType != 'Task') { return []; }
            var links = [];
            links.push({
                title: $i18next.t('chapterEditor_links_lti'),
                url: 'https://lti.algorea.org/?taskUrl=' + encodeURIComponent(item.sUrl)
                });
            return links;
        };

        $scope.canMore = function(item) {
            return item.sUrl && (item.sType == 'Task' || item.sType == 'Course');
        };

        $scope.toggleMore = function(item, force) {
            if(!$scope.canMore(item)) { return; }
            if(!$scope.showMore[item.ID] && force !== false) {
                $scope.links[item.ID] = $scope.getLinks(item);
            }
            if(typeof force !== 'undefined') {
                $scope.showMore[item.ID] = force;
            } else {
                $scope.showMore[item.ID] = !$scope.showMore[item.ID];
            }
        }

        $scope.toggleAll = function(obj, func) {
            var toggleTarget = null;
            angular.forEach($scope.items, function(item) {
                if(toggleTarget === null) {
                    toggleTarget = !obj[item.ID];
                } else if (toggleTarget != !obj[item.ID]) {
                    toggleTarget = true;
                }
                });
            angular.forEach($scope.items, function(item) {
                func(item, toggleTarget);
                });
        }

        $scope.toggleMoreAll = function() {
            $scope.toggleAll($scope.showMore, $scope.toggleMore);
        }

        $scope.showWeight = {};
        $scope.toggleWeight = function(childItem, force) {
            $scope.showWeight[childItem.ID] = force !== undefined ? force : !$scope.showWeight[childItem.ID];
        }

        $scope.toggleWeightAll = function() {
            $scope.toggleAll($scope.showWeight, $scope.toggleWeight);
        }


        function setImporterUrl() {
            if(!$scope.item.sRepositoryPath) {
                $scope.repositoryUrl = null;
            }

            var importerBaseUrl = 'http://svnimport.mblockelet.info/import.php';
            var components = $scope.item.sRepositoryPath.split(';');
            if(components[0] == 'git') {
                $scope.repositoryIsGit = true;
                var params = {
                    type: 'git',
                    repo: components[1],
                    path: components[2],
                    recursive: 1,
                    display: 'frame',
                    autostart: 1
                    };
            } else {
                $scope.repositoryIsGit = false;
                var params = {
                    type: 'svn',
                    path: $scope.item.sRepositoryPath,
                    recursive: 1,
                    display: 'frame',
                    autostart: 1
                    };
            }
            var urlParams = [];
            for(var k in params) {
                if(params.hasOwnProperty(k)) {
                    urlParams.push(k + '=' + encodeURIComponent(params[k]));
                }
            }
            $scope.repositoryUrl = $sce.trustAsResourceUrl(importerBaseUrl + '?' + urlParams.join('&'));
        }

        $scope.repositoryChan = null;
        $scope.bindRepository = function(callback) {
            // Bind to the repository editor
            $scope.repositoryChan = null;
            if(!$scope.repositoryUrl) {
                if(callback) {
                    callback();
                }
                return;
            }
            if(!document.getElementById('iframe-editor')) {
                // The iframe hasn't rendered yet, retry in a second
                $timeout($scope.bindRepository, 1000);
                return;
            }
            $scope.repositoryChan = Channel.build({
                window: document.getElementById('iframe-editor').contentWindow,
                origin: '*',
                scope: 'importer'
                });
            $scope.repositoryChan.bind('link', $scope.repositoryLinked);
            $scope.repositoryChan.bind('syncFinished', $scope.syncFinished);
            $scope.repositoryChan.bind('syncError', $scope.syncError);
//            $scope.getHeightInterval = $interval($scope.getHeight, 1000);
            if(callback) {
                callback();
            }
        };

        function pathToRepoPath(path) {
            if($scope.repositoryIsGit) {
                var components = path.split('/');
                return 'git;' + components.slice(0, 5).join('/') + '/;' + components.slice(5).join('/');
            } else {
                return path;
            }

        }

        $scope.syncResults = [];
        $scope.syncStatus = {
            done: false,
            icon: 'loop',
            msg: 'inprogress',
            nbGood: 0};
        $scope.repositoryLinked = function(e, params) {
            // Called when the repository sends a link
            if(!params.url || !params.task) { console.error(params); }

            var newPath = pathToRepoPath(params.task);
            if(newPath.indexOf($scope.item.sRepositoryPath) != 0) {
                // This task is not in a subfolder
                $scope.syncResults.push({
                    icon: 'error',
                    msg: 'chapterEditor_sync_error_subfolder',
                    params: params,
                    item: $scope.item});
                return;
            }

            var item = null;
            var modified = false;
            if($scope.itemsByPath[newPath]) {
                item = $scope.itemsByPath[newPath];
                if(item.sUrl != params.url) {
                    item.sUrl = params.url;
                    ModelsManager.updated('items', item.ID);
                    $scope.syncResults.push({
                        icon: 'link',
                        msg: 'chapterEditor_sync_update_link',
                        params: params,
                        item: item});
                    modified = true;
                }
            } else if($scope.itemsByUrl[params.url]) {
                item = $scope.itemsByUrl[params.url];
                // It's different, else we would have found it in the previous case
                item.sRepositoryPath = newPath;
                ModelsManager.updated('items', item.ID);
                $scope.syncResults.push({
                    icon: 'library_books',
                    msg: 'chapterEditor_sync_update_path',
                    params: params,
                    item: item});
                modified = true;
            }

            var path = newPath.split('/');
            if(item) {
                // Check item hierarchy
                var lastParent = item;
                var curParent = $scope.itemsParents[item.ID];
                var minIdx = $scope.item.sRepositoryPath.split('/').length;
                var idx = path.length-1;
                while(curParent && idx >= minIdx) {
                    var desiredPath = path.slice(0, idx).join('/');
                    if(curParent.sRepositoryPath != path.slice(0, idx).join('/')) {
                        $scope.syncResults.push({
                            icon: 'error',
                            msg: 'chapterEditor_sync_error_path',
                            params: {task: desiredPath, url: ''},
                            item: lastParent,
                            hierarchyError: 1});
                        modified = true;
                        break;
                    }
                    lastParent = curParent;
                    curParent = $scope.itemsParents[curParent.ID];
                    idx -= 1;
                }
                if(!modified) {
                    $scope.syncStatus.nbGood += 1;
                }
            } else {
                var name = path[path.length-1];
                var item = createItem('Task', name);
                item.sRepositoryPath = newPath;
                item.sUrl = params.url;
                ModelsManager.updated('items', item.ID);
                $scope.setHierarchy(item);
                $scope.syncResults.push({
                    icon: 'note_add',
                    msg: 'chapterEditor_sync_new_task',
                    params: params,
                    item: item});
            }
            $scope.$apply();
        };

        $scope.setHierarchy = function(item, result) {
            // Put the item in the right hierarchy, creating chapters if needed
            // result is the optional corresponding syncResult, to set as fixed
            // once done

            // Create the item
            var curParent = $scope.item;
            var path = item.sRepositoryPath.split('/');
            for(var i = $scope.item.sRepositoryPath.split('/').length; i < path.length; i++) {
                // Create hierarchy
                var name = path[i];
                var curPath = path.slice(0, i+1).join('/');
                // Select item at this depth
                var curItem = (i == path.length-1) ? item : $scope.itemsByPath[curPath];
                if(curItem) {
                    // An item already is at this path, check parent
                    var curItemParent = $scope.itemsParents[curItem.ID];
                    if(curItemParent !== curParent) {
                        // Parent is wrong, create proper relation
                        angular.forEach(curItem.parents, function(item_item) {
                            if(item_item.parent === curItemParent) {
                                ModelsManager.deleteRecord('items_items', item_item.ID);
                            }});
                        addItem(curItem, curParent);
                    }
                } else {
                    // Create a new chapter
                    curItem = createItem('Chapter', name);
                    addItem(curItem, curParent);
                    curItem.sRepositoryPath = curPath;
                    ModelsManager.updated('items', curItem.ID);
                    $scope.syncResults.push({
                        icon: 'create_new_folder',
                        msg: 'chapterEditor_sync_new_chapter',
                        params: {task: curPath, url: ''},
                        item: curItem});
                }
                $scope.itemsByPath[curPath] = curItem;
                $scope.itemsParents[curItem.ID] = curParent;
                curParent = curItem;
            }

            if(result && result.hierarchyError) {
                result.hierarchyError = 2;
            }
        };

        $scope.syncFinished = function() {
            // Importer said the synchronisation is done
            $scope.syncStatus.done = true;
            $scope.syncStatus.icon = 'done';
            $scope.syncStatus.msg = 'done';
            $scope.$apply();
        };

        $scope.syncError = function() {
            $scope.syncStatus.done = true;
            $scope.syncStatus.icon = 'error';
            $scope.syncStatus.msg = 'error';
            $scope.$apply();
        }

        $scope.makeSyncItemLists = function() {
            // Prepare data for sync
            $scope.repositoryItems = {};
            $scope.repositoryPaths = {};
            $scope.repositoryLinks = {};

            $scope.itemsByPath = {};
            $scope.itemsByUrl = {};
            $scope.itemsParents = {};

            function makeItemLists(itemsToList, parentItem) {
                angular.forEach(itemsToList, function(item_item) {
                    var curItem = item_item.child;
                    if(curItem.sRepositoryPath) {
                        $scope.itemsByPath[curItem.sRepositoryPath] = curItem;
                    }
                    if(curItem.sUrl) {
                        $scope.itemsByUrl[curItem.sUrl] = curItem;
                    }
                    $scope.itemsParents[curItem.ID] = parentItem;
                    if(curItem.children.length) {
                        makeItemLists(curItem.children, curItem);
                    }
                    });
            };
            makeItemLists($scope.item.children, $scope.item);
        };

        $scope.syncRepository = function() {
            $scope.syncStatus.done = false;
            $scope.syncStatus.icon = 'loop';
            $scope.syncStatus.msg = 'inprogress';
            $scope.syncStatus.nbGood = 0;
            $scope.syncResults = [];
            $scope.makeSyncItemLists();
            $scope.repositoryUrl = null;
            $timeout(function() {
                setImporterUrl();
                $scope.bindRepository();
                }, 100);
        };
        $scope.syncRepository();


        // LTI
        $scope.ltiGetScores = function() {
            $scope.ltiError = null;
            var parameters = {action: 'getScores', idItem: $scope.item.ID};
            $http.post('/lti/ltiApi.php', parameters).success(function(res) {
                if(!res.result) {
                    $scope.ltiError = res.error;
                    return;
                }
                $scope.ltiTotalScore = res.total_score;
                $scope.ltiScores = res.scores;
            });
        }

        $scope.ltiSendScore = function() {
            $scope.ltiError = null;
            var parameters = {action: 'sendScore', idItem: $scope.item.ID};
            $http.post('/lti/ltiApi.php', parameters).success(function(res) {
                if(!res.result) {
                    $scope.ltiError = res.error;
                    return;
                }
                $scope.ltiSentScore = true;
            });
        }

        if(window.options.barebone) {
            $scope.getEditMode = function() { return 'lti'; }
            $scope.ltiGetScores();
        }
    }
]);




angular.module('algorea')
.controller('chapterEditorBrowserController', [
    '$scope', 'itemService', '$uibModalInstance', 'startItem', 'startPath', 'callback',
    function($scope, itemService, $uibModalInstance, startItem, startPath, callback) {


        var path = startPath.slice();
        var pathDepth = path.indexOf(startItem.ID);
        if(pathDepth > -1) { path.splice(pathDepth); }

        $scope.getItemIcon = itemService.getItemIcon;


        $scope.openItem = function(item, path_skip) {
            if($scope.item && !path_skip) {
                path.push($scope.item.ID);
            }
            $scope.item = item;
            $scope.children = itemService.getChildren(item);
        }



        $scope.haveParent = function() {
            return $scope.item && $scope.item.ID != path[0];
        }


        $scope.openParent = function() {
            var parentId = path.pop();
            if(parentId) {
                var parent = ModelsManager.getRecord('items', parentId);
                $scope.openItem(parent, true);
            }
        }


        $scope.select = function(item) {
            $uibModalInstance.dismiss('cancel');
            callback(item);
        }


        $scope.close = function() {
            $uibModalInstance.dismiss('cancel');
        }


        $scope.openItem(startItem);
    }
]);
