angular.module('algorea')
   .service('mapService', ['itemService', 'pathService', '$state', function (itemService, pathService, $state) {
      'use strict';
      var mapPath = {
          "data": "M25.255,63.302c32.97-3.167,63.481-17.886,96.522-21.262c31.374-3.206,62.175-4.643,94.51-4.328c45.235,0.439,113.158,22.029,128.641,66.525c10.522,30.243,11.189,71.242-8.883,97.309c-23.825,30.939-55.704,40.616-89.128,60.174c-39.078,22.867-39.078,22.867-75.06,47.575c-35.261,24.213-87.611,59.112-92.27,102.089c-2.703,24.943,7.114,54.339,21.787,74.96c28.008,39.363,65.192,80.229,111.434,101.433c55.587,25.485,112.499,36.663,173.848,39.621c57.567,2.778,111.682,2.036,162.889-24.55c39.235-20.368,69.451-54.185,69.977-97.74c0.375-31.134-11.793-55.753-22.851-84.559c-11.122-28.972-16.033-58.073-15.71-88.649c0.292-27.768,11.396-54.101,35.71-70.92c25.972-17.969,54.402-25.999,72.833-52.986c33.826-49.535,12.82-134.523,70.377-170.015c65.75-40.539,163.432,7.745,209.688,53.859c34.891,34.786,57.88,91.84,58.417,139.253c0.237,20.913,3.027,44.543-1.792,64.917c-5.568,23.546-19.611,34.563-39.299,48.274c-40.057,27.902-78.061,62.405-88.834,109.851c-4.686,20.627-9.176,46.802,1.037,66.749c6.909,13.499,19.683,26.981,31.945,36.569c52.711,41.21,131.881,44.271,196.91,44.396c84.241,0.162,148.639-52.938,177.451-124.24c23.287-57.621,31.08-113.144,31.07-174.281c-0.009-49.22-22.069-102.894-12.887-151.773c4.817-25.648,43.632-57.636,68.898-66.53c30.76-10.827,67.95,3.379,96.806,13.133",
          "color": "#CFBFC7",
          "width": 7,
          "opacity": "0.4"
      };
      // we keep the list of item ids in the map to watch their change
      var itemIdList = {};
      function getSteps(itemId) {
         var item = ModelsManager.getRecord('items', itemId);
         if (!item) {
            console.error('cannot find item '+itemId);
         }
         var steps = [];
         // add children and grand children
         var children = itemService.getChildren(item);
         $.each(children, function(i, child) {
            var strings = itemService.getStrings(child);
            var user_item = itemService.getUserItem(child);
            if (!strings || !user_item) {
               console.error('unable to find string or user item for '+child.ID);
               return;
            }
            var childStep = {};
            childStep.name = strings.sTitle;
            childStep.passed = !!user_item.sLastActivityDate;
            childStep.id = itemId+'/'+child.ID;
            itemIdList[child.ID] = true;
            childStep.steps = [];
            var grandChildren = itemService.getChildren(child);
            $.each(grandChildren, function(i, grandChild) {
               var gc_strings = itemService.getStrings(grandChild);
               var gc_user_item = itemService.getUserItem(grandChild);
               if (!gc_strings || !gc_user_item) {
                  console.error('unable to find string or user item for '+grandChild.ID);
                  return;
               }
               var grandChildStep = {};
               grandChildStep.name = gc_strings.sTitle;
               grandChildStep.passed = !!gc_user_item.sLastActivityDate;
               grandChildStep.id = itemId+'/'+child.ID+'/'+grandChild.ID;
               itemIdList[grandChild.ID] = true;
               childStep.steps.push(grandChildStep);
            });
            steps.push(childStep);
         });
         return steps;
      }
      var basePath = '';
      var setBasePath = function(newBasePath) {
         basePath = newBasePath;
      }
      // replace with a $broadcast
      var clickedCallback = null;
      var setClickedCallback = function (f) {
         clickedCallback = f;
      }
      var itemIdClicked = function(path) {
         var items = path.split('/');
         var baseItems = basePath.split('/');
         var lastItemId = items[items.length-1];
         var lastItem = ModelsManager.getRecord('items', lastItemId);
         if (clickedCallback) {
            clickedCallback(basePath+'/'+path, lastItem);
         }
      };
      var currentMap = null;
      var actuallyDrawMap = function(callback) {
         var map = new DeclickMap();
         map.init("map-content", "map/robot.svg", function(index) {
            itemIdClicked(index);
         }, function() {
            map.loadPath(mapPath);
            map.setCurrentStep(0);
            var steps = getSteps(currentRoot);
            map.loadSteps(steps);
            currentMap = map;
            drawnRoot = currentRoot;
            currentMap.update();
            if (callback) {
               callback();
            }
         });
      };
      var currentRoot = null;
      var drawnRoot = null;
      var setRoot = function(itemId) {
         currentRoot = itemId;
      };
      var prepareMap = function(callback) {
         if(currentRoot != drawnRoot) {
            actuallyDrawMap(callback);
         } else {
            if (callback) {
               callback();
            }
         }
      };
      var show = function() {
         if (currentMap) {
            currentMap.update();
         }
      }
      /* todo !
      var getRootIdFromItem = function(item) {

      };
      var currentItemId = null;
      */
      var setCurrentItem = function(item, pathParams) {
         //currentItemId = item.ID;
      };
      return {
         setCurrentItem: setCurrentItem,
         prepareMap: prepareMap,
         actuallyDrawMap: actuallyDrawMap,
         setRoot: setRoot,
         setBasePath: setBasePath,
         setClickedCallback: setClickedCallback,
         show: show
      };
}]);
