function DeclickMap() {
    
    /*
     * VARIABLES
     */

    // main path
    var path;

    var $canvas;
    var everything;

    // chapters
    var chapters = [];
    var sChapter, sChapterValidated;
    var currentChapterLabels;
    var chapterPaths = [];
    var chapterLabels = [];
    var chapterOpen = false;

    // steps
    var steps = [];
    var sStep, sStepValidated, sStepVisited;
    var displayedSteps = [];
    var stepCallback;
    var stepsDisplayed = false;

    // current step
    var current;
    var currentIndex = -1;
    var currentCallback = false;

    // labels
    var labels = [];
    var labelsVisible = false;

    // position and zoom
    var initCenter;
    var targetZoom, targetCenter, targetCurrent;
    var changeZoom = false, changeCenter = false, changeCurrent = false;
    var movementSpeed, zoomSpeed, currentSpeed;

    var clickCaptured = false;

    /*
     * CONSTANTS
     */

    // margin around the path
    var margin = 40;

    // duration of animations
    var animationDuration = 0.8;
    
    // zoom factor
    var zoomFactor = 200;
    
    // zoom threshold to display labels
    var zoomDisplayLabels = 1.5;
    // max and min levels of zoom
    var maxZoom = 3.5;
    

    /*
     *  INITIALIZATION 
     */

    // Reset size and position
    var reset = function() {
        // intialize zoom and center position
        initCenter = new paper.Point(paper.view.center);
        targetCenter = new paper.Point(initCenter);
        targetZoom = 1;
    };

    // Init view
    var initView = function(canvasId) {
        // Get a reference to the canvas object
        var canvas = document.getElementById(canvasId);
        $canvas = $(canvas);
        $canvas.attr("resize", "1");
        $canvas.css("cursor", "pointer");
        
        // setup paperjs
        paper.setup(canvas);

        reset();

        // view resizing
        paper.view.onResize = function(event) {
            reset();
            if (stepsDisplayed) {
                    resize();
            }
        };

        // zooming with scroll
        var scrollTimeout = -1;
        var endScrollTimeout = -1;
        var scrollAmount = 0;
        var scrollPoint = false;
        
        var handleScroll = function() {
            var newZoom = targetZoom+scrollAmount/zoomFactor;
            newZoom = Math.min(newZoom, maxZoom);
            if (newZoom < 1) {
                setTarget(initCenter, 1, true);                
            } else {
                var newCenter = scrollPoint.add(targetCenter.subtract(scrollPoint).divide(newZoom/targetZoom));
                setTarget(newCenter, newZoom, true);
            }
            scrollAmount = 0;
        }

        $canvas.mousewheel(function(event) {
            event.preventDefault();
            if (scrollPoint === false) {
                // first call: register scroll point
                scrollPoint = paper.view.getEventPoint(event);
            }
            if (endScrollTimeout !== -1) {
                clearTimeout(endScrollTimeout);
            }
            scrollAmount = event.deltaY*event.deltaFactor;
            if (scrollTimeout === -1 && !(targetZoom < 1 && scrollAmount <0) && !(targetZoom == maxZoom && scrollAmount>0)) {
                handleScroll();
                scrollTimeout = setTimeout(function() {
                    handleScroll();
                    scrollTimeout = -1;
                }, 200);
            }
            endScrollTimeout = setTimeout(function() {
                if (targetZoom <1) {
                    setTarget(initCenter, 1, true);
                    endScrollTimeout = -1;
                }
                scrollPoint = false;
            }, 250);
        });

        // handling of space key
        var tool = new paper.Tool();
        tool.onKeyDown = function(event) {
            if (event.key === 'space') {
                setTarget(initCenter, 1);
            }
        };
        

        // mouse dragging management
        var dragStartPoint;
        
        paper.view.onMouseDown = function(e){
            dragStartPoint = e.point;
        };
        
        paper.view.onMouseDrag = function(e){
            var delta = e.point.subtract(dragStartPoint);
            paper.view.center = paper.view.center.subtract(delta);
            targetCenter = paper.view.center;
        };

        // Map animation
        paper.view.onFrame = function(event) {
            var vector, step;
            var view = paper.view;
            var center = view.center;
            if (changeCenter) {
                step = event.delta*movementSpeed;
                vector = targetCenter.subtract(center);
                if (vector.length > step) {
                    step = vector.normalize(step);
                    view.center = center.add(step);
                } else {
                    view.center = new paper.Point(targetCenter);
                    changeCenter = false;
                }
            }
            if (changeZoom) {
                step = event.delta*zoomSpeed;
                if (view.zoom < targetZoom) {
                    view.zoom = Math.min(view.zoom + step, targetZoom);
                } else {
                    view.zoom = Math.max(view.zoom - step, targetZoom);
                }
                if (view.zoom === targetZoom) {
                    changeZoom = false;                    
                }
                checkLabelsVisibility();
            }
            if (changeCurrent) {
                step = event.delta*currentSpeed;
                vector = targetCurrent.subtract(current.position);
                if (vector.length > step) {
                    step = vector.normalize(step);
                    current.position = current.position.add(step);
                } else {
                    current.position = targetCurrent;
                    changeCurrent = false;
                    if (currentCallback) {
                        currentCallback();
                    }
                }
            }
        };
    };


    // Define symbols used for chapters and steps
    var initSymbols = function(currentSVG, callback) {
        // chapter
        var pChapter = new paper.Path.Circle(new paper.Point(0, 0), 12);
        pChapter.strokeColor = "#E01980";
        pChapter.strokeWidth = 2;
        pChapter.fillColor = "#46102A";
        sChapter = new paper.Symbol(pChapter);
        // step
        var pStep = new paper.Path.Circle(new paper.Point(0, 0), 8);
        pStep.strokeColor = "#E33022";
        pStep.strokeWidth = 1;
        pStep.fillColor = "#46102A";
        sStep = new paper.Symbol(pStep);
        // validated step
        var pStepValidated = new paper.Group();
        var pStepValidatedOuter = new paper.Path.Circle(new paper.Point(0, 0), 8);
        pStepValidatedOuter.strokeColor = "#E33022";
        pStepValidatedOuter.strokeWidth = 1;
        pStepValidatedOuter.fillColor = "#46102A";
        var pStepValidatedInner = new paper.Path.Circle(new paper.Point(0, 0), 6);
        pStepValidatedInner.fillColor = "#0FAC8D";
        pStepValidated.addChild(pStepValidatedOuter);
        pStepValidated.addChild(pStepValidatedInner);
        sStepValidated = new paper.Symbol(pStepValidated);
        pChapterValidated = new paper.Group();
        var pChapterValidatedOuter = new paper.Path.Circle(new paper.Point(0, 0), 12);
        pChapterValidatedOuter.strokeColor = "#E01980";
        pChapterValidatedOuter.strokeWidth = 2;
        pChapterValidatedOuter.fillColor = "#46102A";
        var pChapterValidatedInner = new paper.Path.Circle(new paper.Point(0, 0), 10);
        pChapterValidatedInner.fillColor = "#0FAC8D";
        pChapterValidated.addChild(pChapterValidatedOuter);
        pChapterValidated.addChild(pChapterValidatedInner);
        sChapterValidated = new paper.Symbol(pChapterValidated);
        // visited step
        var pStepVisited = new paper.Path.Circle(new paper.Point(0, 0), 6);
        pStepVisited.fillColor = "#E33022";
        sStepVisited = new paper.Symbol(pStepVisited);
        // load current image in a upper layer
        var activeLayer = paper.project.activeLayer;
        var currentLayer = new paper.Layer();
        // current step
        paper.project.importSVG(currentSVG, function(item) {
            current = item;
            current.visible = false;
            activeLayer.activate();
            if (callback) {
                callback();
            }
        });
    };
    
    var checkLabelsVisibility = function() {
        // check if texts have to be displayed or hidden
        if (labelsVisible) {
            if (paper.view.zoom <zoomDisplayLabels) {
                for (var i = 0; i<chapterLabels.length; i++) {
                    chapterLabels[i].visible = false;
                }
                labelsVisible = false;
            }
        } else {
            if (paper.view.zoom >zoomDisplayLabels) {
                for (var i = 0; i<chapterLabels.length; i++) {
                    chapterLabels[i].visible = true;
                }
                labelsVisible = true;
            }
        }
    }

    var centerEverything = function() {
        everything.position = new paper.Point(paper.view.center);
    };

    var initSteps = function(data) {
        steps = [];
        function getObject(value, chapter) {
            var object = {chapter: chapter, name: value.name};
            if (typeof value.id !== 'undefined') {
                object.id = value.id;
            }
            if (value.passed) {
                object.passed = value.passed;
            }
            if (value.visited) {
                object.visited = value.visited;
            }
            return object;
        }
        $.each(data, function(key, value) {
            steps.push(getObject(value, true));
            if (value.steps) {
                $.each(value.steps, function(key, value) {
                    steps.push(getObject(value, false));
                });
            }
        });
    };

    var openChapter = function(index, animate) {
        if (typeof animate === 'undefined') {
            animate = false;
        }
        if (index < chapterPaths.length) {
            var currentChapterPath = chapterPaths[index];
            var bounds = currentChapterPath.bounds;
            bounds = bounds.expand(2*margin);
            var zHeight = paper.view.bounds.height / (bounds.height);
            var zWidth = paper.view.bounds.width / (bounds.width);
            if (animate) {
                setTarget(bounds.center, paper.view.zoom * Math.min(zHeight, zWidth));
            } else {
                paper.view.center = new paper.Point(bounds.center);
                targetCenter = new paper.Point(paper.view.center);
                paper.view.zoom = paper.view.zoom * Math.min(zHeight, zWidth);
                targetZoom = paper.view.zoom;
                checkLabelsVisibility();
            }
            chapterOpen = true;
        } else {
            chapterOpen = false;
        }
    };

    var setTargetZoom = function(zoom, fast) {
        targetZoom = zoom;
        changeZoom = true;
        zoomSpeed = Math.abs(zoom - paper.view.zoom)/animationDuration;
        if (fast) {
            zoomSpeed = zoomSpeed*2;
        }
    };

    var setTargetCenter = function(center, fast) {
        targetCenter = new paper.Point(center);
        changeCenter = true;
        movementSpeed = (paper.view.center.getDistance(targetCenter))/animationDuration;
        if (fast) {
            movementSpeed = movementSpeed*2;
        }
    };

    var setTargetCurrent = function(position, factor) {
        targetCurrent = new paper.Point(position);
        changeCurrent = true;
        currentSpeed = (current.position.getDistance(targetCurrent)*factor)/(animationDuration);
    };

    var setTarget = function(center, zoom, fast) {
        setTargetZoom(zoom, fast);
        setTargetCenter(center, fast);
    };

    var wordwrap = function(txt,max) {
        var lines=[];
        var space=-1;
        times=0;
        function cut() {
            for(var i=0;i<txt.length;i++) {
                if (txt[i]==' ') {
                    space=i;
                }
                if(i>=max) {
                    if (space==-1||txt[i]==' ') {
                        space = i;
                    }
                    if(space>0) {
                        lines.push(txt.slice((txt[0]===' '?1:0),space));
                    }
                    txt = txt.slice(txt[0]===' '?(space+1):space);
                    space=-1;
                    break;
                }
            }
            check();
        }

        function check() {
            if(txt.length<=max) {
                lines.push(txt[0]===' '?txt.slice(1):txt);txt='';
            } else if (txt.length) {
                cut();
            }
            return;
        }
        check();
        return lines.join('\n');
    };

    var getSymbol = function(step) {
        if (step.chapter) {
            if (step.passed) {
                return sChapterValidated;
            } else {
                return sChapter;
            }
        } else {
            if (step.passed) {
                return sStepValidated;
            } else if (step.visited) {
                return sStepVisited;
            } else {
                return sStep;
            }
        }
    };

    var removeSteps = function() {
        // remove everything
        paper.project.activeLayer.removeChildren();
        // initialize data
        displayedSteps = [];
        chapterPaths = [];
        chapterLabels = [];
        chapters = [];
        labels = [];
        currentIndex = -1;
        chapterOpen = false;
        changeCenter = false;
        changeZoom = false;
        changeCurrent = false;
        labelsVisible = false;
        stepsDisplayed = true;
        
        if (initCenter) {
            paper.view.center = new paper.Point(initCenter);
            targetCenter = new paper.Point(initCenter);
        }
        paper.view.zoom = 1;
        targetZoom = 1;
        // create new group
        everything = new paper.Group();
        // fit path to new dimensions
        if (path) {
            path.fitBounds(paper.view.bounds.expand(-margin));
            // add path to new group
            everything.addChild(path);
            // center everything
            centerEverything();
        }
    };

    var resize = function() {
        var savedCurrentIndex = currentIndex;
        var savedChapterOpen = chapterOpen;
        removeSteps();
        // display steps
        displaySteps();
        // open chapter if required
        if (savedCurrentIndex>-1 && savedChapterOpen) {
            setCurrentStep(steps[savedCurrentIndex].id, false);
        }
    };


    // Position steps on the path
    var displaySteps = function() {
        var previousChapter = false;
        var previousLabel;
        var currentLabels;
        if (!path) {
            return;
        }
        var basePath = path.clone();

        var placeSymbol = function(index, curve, length, last) {
            var chapter = steps[index].chapter;
            var symbol = getSymbol(steps[index]);
            var point = curve.getPointAt(length, false);
            var placed = symbol.place(point);
            var hasSubItems = false;
            var offset, newPath, chapterPath;
            displayedSteps.push(placed);
            everything.addChild(placed);
            if (chapter) {
                if (previousChapter) {
                    offset = basePath.getOffsetOf(placed.position);
                    newPath = basePath.split(offset);
                    chapterPath = basePath;
                    chapterPath.visible = false;
                    chapterPaths.push(chapterPath);
                    basePath = newPath;
                    everything.addChild(currentLabels);
                    chapterLabels.push(currentLabels);
                }
                previousChapter = true;
                chapters.push(placed);
                currentLabels = new paper.Group();
                currentLabels.visible = false;
                if (typeof steps[index+1] !== 'undefined' && !steps[index+1].chapter) {
                        hasSubItems = true;
                }
                if (hasSubItems) {
                    placed.onMouseDown = getChapterMouseHandler(chapters.length - 1);
                } else {
                    // no subitems: open corresponding step
                    placed.onMouseDown = getStepMouseHandler(index);
                }
                // display chapter number
                var textNumber = new paper.PointText({
                    point: point,
                    justification: 'center',
                    fontSize: 15,
                    fillColor: "#FFFFFF",
                    content: chapters.length
                });
                textNumber.bounds.center = point;
                if (hasSubItems) {
                    placed.onMouseDown = getChapterMouseHandler(chapters.length - 1);
                    textNumber.onMouseDown = getChapterMouseHandler(chapters.length - 1);
                } else {
                    // no subitems: open corresponding step
                    placed.onMouseDown = getStepMouseHandler(index);
                    textNumber.onMouseDown = getStepMouseHandler(index);
                }
                everything.addChild(textNumber);
            } else {
                placed.onMouseDown = getStepMouseHandler(index);
                if (last) {
                    offset = basePath.getOffsetOf(placed.position);
                    newPath = basePath.split(offset);
                    chapterPath = basePath;
                    chapterPath.visible = false;
                    chapterPaths.push(chapterPath);
                    basePath = newPath;
                    everything.addChild(currentLabels);
                    chapterLabels.push(currentLabels);
                }
            }
            // Label
            var textColor, textSize, textShift;
            if (chapter) {
                textColor = "#E01980";
                textSize = 15;
                textShift = 20;
            } else {
                textColor = "#FFFFFF";
                textSize = 8;
                textShift = 15;
            }
            var normal = curve.getNormalAt(length, false);
            normal.length = textShift;
            var text = new paper.PointText({
                point: point.add(normal/*new paper.Point(textShift, textSize/3)*/),
                justification: 'left',
                fontSize: textSize,
                fillColor: textColor,
                content: steps[i].name
            });
            if (!chapter) {
                if (previousLabel && previousLabel.bounds.intersects(text.bounds)) {
                    normal = normal.multiply(-2);
                    text.point = text.point.add(normal);
                }
                previousLabel = text;
                currentLabels.addChild(text);
                text.onMouseDown = getStepMouseHandler(index);
            } else {
                text.content = wordwrap(steps[i].name, 12);
                if (text.intersects(path)) {
                    normal = normal.multiply(-2);
                    text.point = text.point.add(normal);
                }
                everything.addChild(text);
                if (hasSubItems) {
                    text.onMouseDown = getChapterMouseHandler(chapters.length - 1);
                } else {
                    text.onMouseDown = getStepMouseHandler(index);
                }
                previousLabel = null;
            }
            labels.push(text);
            return placed;
        };

        var stepLength = path.length / (steps.length - 1);
        var curves = path.curves;
        var currIndex = 0;
        var currentCurve = curves[0];
        var currentLength = 0;
        for (var i = 0; i < steps.length - 1; i++) {
            while (currentLength > currentCurve.length) {
                currentLength -= currentCurve.length;
                currIndex++;
                currentCurve = curves[currIndex];
            }
            placeSymbol(i, currentCurve, currentLength);
            currentLength += stepLength;
        }
        currentCurve = curves[curves.length - 1];
        // place last step
        placeSymbol(i, currentCurve, currentCurve.length, true);

        // resize and place current image
        var startIndex;
        if (currentIndex === -1) {
            //currentIndex not set yet
            startIndex = 0;
            current.visible = false;
        } else {
            startIndex = currentIndex;
        }
        current.position = displayedSteps[startIndex].position;
        targetCurrent = current.position;
        current.fitBounds(displayedSteps[startIndex].bounds);
        current.scale(1.5);
        current.onMouseDown = function(event) {
            event.preventDefault();
            setCurrentStep(steps[currentIndex].id, false, true, function() {
                if (stepCallback) {
                    stepCallback(steps[currentIndex].id);
                }
            });
        };

        everything.addChild(current);
    stepsDisplayed = true;
    };

    // Mouse handlers
    var getStepMouseHandler = function(i) {
        return function(event) {
            event.preventDefault();
            setCurrentStep(steps[i].id, true, true, function() {
                if (stepCallback) {
                    stepCallback(steps[i].id);
                }
            });
        };
    };

    var getChapterMouseHandler = function(i) {
        return function(event) {
            event.preventDefault();
            openChapter(i, true);
        };
    };

    var setCurrentStep = function(index, animate, skipChapter, callback) {
        var stepIndex = -1, chapterIndex = -1;
        // look for stepIndex
        for (var i=0;i<steps.length;i++) {
            if (steps[i].id && steps[i].id === index) {
                stepIndex = i;
                break;
            }
        }
        if (stepIndex > -1) {
            // set target current position
            var step = displayedSteps[stepIndex];
            if (!skipChapter) {
                // look for corresponding chapter
                for (var j=stepIndex; j>=0; j--) {
                    if (steps[j].chapter) {
                        for (var k=0; k<chapters.length;k++) {
                            if (chapters[k] === displayedSteps[j]) {
                                chapterIndex = k;
                                break;
                            }
                        }
                        break;
                    }
                }
                if (chapterIndex>-1) {
                    openChapter(chapterIndex, animate);
                }
            }            
            if (animate && current.visible === true) {
                var delta, factor;
                if (stepIndex < currentIndex) {
                    delta = -1;
                    factor = currentIndex - stepIndex;
                } else {
                    delta = +1;
                    factor = stepIndex - currentIndex;
                }
                currentCallback = function() {
                    currentIndex += delta;
                    if (currentIndex === stepIndex) {
                        if (callback) {
                            callback();
                        }
                    } else {
                        step = displayedSteps[currentIndex+delta];
                        setTargetCurrent(step.position, factor);
                    }
                }
                step = displayedSteps[currentIndex+delta];
                setTargetCurrent(step.position, factor);
            } else {
                current.visible = true;
                currentIndex = stepIndex;
                current.position = step.position;
                targetCurrent = current.position;
                if (callback) {
                    callback();
                }
            }

        } else {
            console.error("Step with index "+index+" not found");
        }
    };


    /*
     *  API 
     */

    // Init map
    this.init = function(canvasId, currentImage, newStepCallback, callback) {
        initView(canvasId);
        if (newStepCallback) {
            stepCallback = newStepCallback;
        }
        initSymbols(currentImage, callback);
    };

    // load Path
    this.loadPath = function(data) {
        // create path from SVG data
        path = new paper.Path(data.data);
        path.fitBounds(paper.view.bounds.expand(-margin));
        if (data.color) {
            path.strokeColor = data.color;
        }
        if (data.opacity) {
            path.opacity = data.opacity;
        }

        if (data.width) {
            path.strokeWidth = data.width;
        }

        everything = new paper.Group();
        everything.addChild(path);
        centerEverything();
    };

    // load Path from json file
    this.loadPathFromJSON = function(file, callback) {
        var self = this;
        $.getJSON(file, function(pathData) {
            self.loadPath(pathData);
            if (callback) {
                callback();
            }
        }).fail(function() {
            console.error("Could not load JSON file: "+file);
        });
    };

    // load steps
    this.loadSteps = function(data) {
        if (stepsDisplayed) {
                removeSteps();
        }
        initSteps(data);
        displaySteps();
        paper.view.draw();
    };

    // load steps from JSON file
    this.loadStepsFromJSON = function(file, callback) {
        var self = this;
        $.getJSON(file, function(stepsData) {
            self.loadSteps(stepsData);
            if (callback) {
                callback();
            }
        }).fail(function() {
            console.error("Could not load JSON file: "+file);
        });
    };

    // Update data
    this.updateState = function(udpatedSteps) {
        $.each(udpatedSteps, function(key, value) {
            if (value.id) {
                // find corresponding step
                for (var i=0;i<steps.length;i++) {
                    if (steps[i].id && steps[i].id === value.id) {
                        if (typeof value.passed !=='undefined') {
                            steps[i].passed = value.passed;
                        }
                        if (typeof value.visited !=='undefined') {
                            steps[i].visited = value.visited;
                        }
                        var old = displayedSteps[i];
                        var point = old.position;
                        old.remove();
                        var symbol = getSymbol(steps[i]);
                        var placed = symbol.place(point);
                        everything.addChild(placed);
                        displayedSteps[i] = placed;
                        placed.onMouseDown = getStepMouseHandler(i);
                        break;
                    }
                }
            }
        });
    };

    // Set current step
    this.setCurrentStep = function(index, animate) {
        if (typeof animate === 'undefined') {
            animate = false;
        }
        setCurrentStep(index, animate);
    };

    // Remove all steps
    this.removeSteps = function() {
        removeSteps();
    };

    // Update size
    this.update = function() {
        // check size
        var cSize = new paper.Size($canvas.width(), $canvas.height());
        if (!cSize.equals(paper.view.size)) {
            try {
                window.dispatchEvent(new Event('resize'));
            } catch (e) {
                // Problem in IE: try the IE way
                var evt = window.document.createEvent('UIEvents');
                evt.initUIEvent('resize', true, false, window, 0);
                window.dispatchEvent(evt);
            }
        }
        // remove any precedently bound mousemove handlers
        $canvas.off("mousemove");
    }; 
}
