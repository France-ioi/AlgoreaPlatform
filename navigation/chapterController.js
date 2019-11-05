'use strict';

angular.module('algorea')
.controller('chapterController', [
    '$rootScope', '$scope', 'itemService', '$state', '$i18next', '$uibModal', '$sce', '$timeout', '$interval', '$http', 'loginService', 'pathService',
    function ($rootScope, $scope, itemService, $state, $i18next, $uibModal, $sce, $timeout, $interval, $http, loginService, pathService) {
        $scope.itemService = itemService;
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

        // sync does not work without this
        if(!SyncQueue.requests) { SyncQueue.requests = {}; }
        SyncQueue.requests.algorea = {
           admin: true
        };


        var user = null;
        loginService.getLoginData(function(res) {
            user = res;
        })


        // common
        $scope.availableLocales = ModelsManager.getRecords('languages');
        // TODO :: Why is that happening?
        if($scope.availableLocales[0]) { delete $scope.availableLocales[0]; }

        function refresh() {
            $scope.allowReorder = !$scope.item.bFixedRanks;
            $scope.items = itemService.getChildren($scope.item);
            $scope.item_strings = $scope.item.strings[0];
            $scope.item_strings_compare = null;
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



        $scope.$on('algorea.reloadView', function(event, view) {
            if(view == 'right') {
                refresh();
            }
        });


        $scope.selectTab = function(tab) {
            $scope.tab = tab;
            if(tab == 'repository' && !$scope.repositoryAutoSynced) {
                $scope.syncRepository();
                // Only do it automatically once
                $scope.repositoryAutoSynced = true;
            }
        }

        $scope.getItemIcon = itemService.getItemIcon;

        $scope.getChildSref = function(item) {
            return pathService.getSref($scope.panel, typeof $scope.depth != 'undefined' ? $scope.depth + 1 : 0, $scope.pathParams, '/' + item.ID);
        };

        $scope.checkSaveItem = function() {
            var hasChanged = false;
//            hasChanged |= $scope.hasObjectChanged("items_items", $scope.item_item);
            hasChanged |= $scope.hasObjectChanged("items", $scope.item);
            hasChanged |= $scope.hasObjectChanged("items_strings", $scope.item_strings);
            if (hasChanged) {
               if (confirm($i18next.t('groupAdmin_confirm_unsaved'))) {
//                  $scope.resetObjectChanges("items_items", $scope.item_item);
                  $scope.resetObjectChanges("items", $scope.item);
                  $scope.resetObjectChanges("items_strings", $scope.item_strings);
               } else {
                  return false;
               }
            }
            return true;
        };



        // params

        $scope.hasObjectChanged = function(modelName, record) {
            if(!record) return;
            return ModelsManager.hasRecordChanged(modelName, record.ID);
        };


        $scope.resetObjectChanges = function(modelName, record) {
            if(!record) return;
            ModelsManager.resetRecordChanges(modelName, record.ID);
        };


        $scope.saveObject = function(modelName, record) {
            if(!record) return;
            ModelsManager.updated(modelName, record.ID);
        };



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
            ModelsManager.deleteRecord('items', item_item.idItemChild);
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
                ModelsManager.updated('items_items', itemItem.ID);
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
            if(!$scope.showMore[item.ID]) {
                $scope.links[item.ID] = $scope.getLinks(item);
            }
            if(typeof force !== 'undefined') {
                $scope.showMore[item.ID] = force;
            } else {
                $scope.showMore[item.ID] = !$scope.showMore[item.ID];
            }
        }

        $scope.toggleMoreAll = function() {
            // showMore[0] contains the chapter state
            $scope.showMore[0] = !$scope.showMore[0];
            angular.forEach($scope.items, function(item) {
                $scope.toggleMore(item, $scope.showMore[0]);
                });
        }

        // strings

        $scope.newItemStrings = function() {
            if (!$scope.checkSaveItem()) {
                return;
            }
            var existingLocales = [];
            for(var i=0; i < $scope.item.strings.length; i++) {
                existingLocales.push($scope.item.strings[i].language);
            }
            // TODO :: default to selected admin locale
            var idLanguage = null;
            for(var idLocale in $scope.availableLocales) {
                if(existingLocales.indexOf($scope.availableLocales[idLocale]) == -1) {
                    idLanguage = idLocale;
                    break;
                }
            }
            if(!idLanguage) {
                return;
            }
            var itemStrings = ModelsManager.createRecord("items_strings");
            itemStrings.idItem = $scope.item.ID;
            itemStrings.idLanguage = idLanguage;
            itemStrings.sTitle = $i18next.t('groupAdmin_new_item');
            ModelsManager.insertRecord("items_strings", itemStrings);
            $scope.item_strings = itemStrings;
        };


        $scope.deleteItemStrings = function(id) {
            if($scope.item.strings.length > 1) {
                ModelsManager.deleteRecord("items_strings", id);
                $scope.item_strings = $scope.item.strings[0];
            }
        };

        if($scope.item.sRepositoryPath) {
            // TODO :: something depending on the platform
            $scope.repositoryUrl = $sce.trustAsResourceUrl('http://svnimport.mblockelet.info/import.php?path='+encodeURI($scope.item.sRepositoryPath)+'&recursive=1&display=frame');
        }
        $scope.repositoryChan = null;
        $scope.bindRepository = function(callback) {
            // Bind to the repository editor
            if(!$scope.repositoryUrl || $scope.repositoryChan) {
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

        $scope.syncResults = [];
        $scope.syncStatus = {
            done: false,
            icon: 'loop',
            msg: 'inprogress',
            nbGood: 0};
        $scope.repositoryLinked = function(e, params) {
            // Called when the repository sends a link
            if(!params.url || !params.task) { console.error(params); }

            if(params.task.indexOf($scope.item.sRepositoryPath) != 0) {
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
            if($scope.itemsByPath[params.task]) {
                item = $scope.itemsByPath[params.task];
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
                item.sRepositoryPath = params.task;
                ModelsManager.updated('items', item.ID);
                $scope.syncResults.push({
                    icon: 'library_books',
                    msg: 'chapterEditor_sync_update_path',
                    params: params,
                    item: item});
                modified = true;
            }

            var path = params.task.split('/');
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
                item.sRepositoryPath = params.task;
                item.sUrl = params.url;
                ModelsManager.updated('items', item.ID);
                $scope.setHierarchy(item);
                $scope.syncResults.push({
                    icon: 'note_add',
                    msg: 'chapterEditor_sync_new_task',
                    params: params,
                    item: item});
            }
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
        };

        $scope.syncError = function() {
            $scope.syncStatus.done = true;
            $scope.syncStatus.icon = 'error';
            $scope.syncStatus.msg = 'error';
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
            $scope.bindRepository(function() {
                $scope.makeSyncItemLists();
                $scope.repositoryChan.notify({method: 'syncRepository'});
                });
        };


        // LTI
        $scope.ltiGetScores = function() {
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
            var parameters = {action: 'sendScore', idItem: $scope.item.ID};
            $http.post('/lti/ltiApi.php', parameters).success(function(res) {
                if(!res.result) {
                    $scope.ltiSendError = res.error;
                    return;
                }
                $scope.ltiSentScore = true;
            });
        }

        if(window.options.barebone) {
            $scope.getEditMode = function() { return 'lti'; }
            $scope.ltiGetScores();
            $scope.ltiSendScore();
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
