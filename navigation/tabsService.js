angular.module('algorea')
    .service('tabsService', ['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
        var tabsServices = {};

        function makeTabsService() {
            var displayedTabs = [];
            var tabsById = {};

            var curItemId = 0;
            var curTabId = null;

            var targetTabId = null;
            $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
                if (toParams.section) {
                    targetTabId = toParams.section;
                }
            });

            function selectTab(id) {
                if (typeof tabsById[id] == 'undefined') { return false; }
                if (id == curTabId) { return true; }

                var tab = displayedTabs[tabsById[id]];
                if (tab && tab.disabled) { return false; }

                if (targetTabId == tab.id) { targetTabId = null; }

                var oldCb = curTabId ? displayedTabs[tabsById[curTabId]].callback : null;
                curTabId = id;
                angular.forEach(displayedTabs, function (val) {
                    val.active = val.id == id;
                });

                if (oldCb && oldCb !== tab.callback) {
                    oldCb(id, false);
                }
                if (tab.callback && oldCb !== tab.callback) {
                    tab.callback(id, true);
                }

                var params = JSON.parse(JSON.stringify($stateParams));
                params.section = tabsById[id] > 0 ? id : null;
                $state.go($state.current.name, params, { notify: false });

                return true;
            }

            function computeTabsById() {
                tabsById = {};
                angular.forEach(displayedTabs, function (val, key) {
                    tabsById[val.id] = key;
                });
            }

            function removeTabById(id) {
                var idx = null;
                angular.forEach(displayedTabs, function (val, key) {
                    if (val.id == id) { idx = key; }
                });
                if (idx !== null) {
                    displayedTabs.splice(idx, 1);
                    computeTabsById();

                    if (curTabId == id) {
                        curTabId = null;
                        var targetId = null;
                        angular.forEach(displayedTabs, function (val) {
                            if (!targetId && !val.disabled) {
                                targetId = val.id;
                            }
                        });
                        selectTab(targetId);
                    }
                }
            }

            function removeTabsNotInList(l) {
                var toRemove = [];
                angular.forEach(displayedTabs, function (val) {
                    if (l.indexOf(val.id) == -1) {
                        toRemove.push(val.id);
                    }
                });
                angular.forEach(toRemove, function (val) {
                    removeTabById(val);
                });
            }

            function addTab(tab) {
                if (typeof tabsById[tab.id] != 'undefined') {
                    displayedTabs[tabsById[tab.id]] = tab;
                    if (tab.id == curTabId) {
                        displayedTabs[tabsById[tab.id]].active = true;
                    }
                } else {
                    displayedTabs.push(tab);
                }
                displayedTabs.sort(function (a, b) {
                    var ao = typeof a.order != 'undefined' ? a.order : 0;
                    var bo = typeof a.order != 'undefined' ? b.order : 0;
                    return ao - bo;
                });
                computeTabsById();
                if (!tab.disabled && (curTabId === null || targetTabId == tab.id)) {
                    selectTab(tab.id);
                }
            }

            function updateTabById(id, opts) {
                if (typeof tabsById[id] == 'undefined') { return false; }
                Object.assign(displayedTabs[tabsById[id]], opts);
            }

            function resetTabs(isEdit) {
                displayedTabs.splice(0, displayedTabs.length);
                tabsById = {};
                curTabId = null;
                setEditMode(isEdit);
            }

            function setEditMode(isEdit) {
                if (isEdit) {
                    addTab({ id: 'parameters', title: 'chapterEditor_parameters', order: 100 });
                    addTab({ id: 'strings', title: 'chapterEditor_strings', order: 101 });
                } else {
                    removeTabById('parameters');
                    removeTabById('strings');
                }
            }

            return {
                displayedTabs: displayedTabs,
                selectTab: selectTab,
                removeTabById: removeTabById,
                addTab: addTab,
                removeTabsNotInList: removeTabsNotInList,
                resetTabs: resetTabs,
                updateTabById: updateTabById,

                newItem: function (item) {
                    // Reset tabs
                    if (item.ID == curItemId) { return; }
                    curItemId = item.ID;
                    resetTabs();
                },

                isTab: function (id) {
                    return curTabId == id;
                },

                getCurTabId: function () {
                    return curTabId;
                },

                setEditMode: setEditMode
            };
        }

        return {
            getTabsService: function (tabsName) {
                if (typeof tabsServices[tabsName] == 'undefined') {
                    tabsServices[tabsName] = makeTabsService();
                }
                return tabsServices[tabsName];
            }
        }
    }]);
