function DeclickMap() {
    // Variables declaration
    var path;
    var chapters = [];
    var steps = [];
    var pStep, pChapter, pChapterValidated, pStepValidated, pStepVisited, current;
    var sStep, sChapter, sChapterValidated, sStepValidated, sStepVisited;
    var $canvas;
    var initCenter;
    var everything;
    var currentChapterPath, currentChapterLabels;
    var chapterPaths = [];
    var chapterLabels = [];
    var targetZoom, targetCenter, targetCurrent, target = false;
    var clickCaptured = false;
    var displayedSteps = [];
    var labels = [];
    var stepCallback;
    var currentIndex = -1;
    var chapterOpen = false;
    var movementSpeed, zoomSpeed;

    // margin around the path
    var margin = 40;
    // duration of animations
    var animationDuration = 0.8;



    // Initialization
    var initView = function(canvasId) {
        // Get a reference to the canvas object
        var canvas = document.getElementById(canvasId);
        $canvas = $(canvas);
        $canvas.attr("resize", "1");
        
        // setup paperjs
        paper.setup(canvas);

        initCenter = new paper.Point(paper.view.center);
        targetCenter = new paper.Point(initCenter);
        targetZoom = 1;

        var dragX, dragY;

        // mouse management
        var moveTracker = function(event) {
            var p = new paper.Point(dragX - event.pageX, dragY - event.pageY);
            paper.view.scrollBy(p);
            dragX = event.pageX;
            dragY = event.pageY;
            clickCaptured = true;
        };
        
        $canvas.click(function(event) {
            if (!clickCaptured) {
                closeChapter();
            }
            clickCaptured = false;
        });

        $canvas.mousedown(function(event) {
            dragX = event.pageX;
            dragY = event.pageY;
            $canvas.on("mousemove", moveTracker);
        });

        $canvas.mouseup(function(event) {
            $canvas.off("mousemove", moveTracker);
        });

        // handling of space key
        var tool = new paper.Tool();
        tool.onKeyDown = function(event) {
            if (event.key === 'space') {
                closeChapter();
                /*paper.view.center = initCenter;
                 paper.view.zoom = 1;*/
            }
        };

        // Map animation
        paper.view.onFrame = function(event) {
            if (target) {
                var view = paper.view;
                var center = view.center;
                target = false;
                if (!center.equals(targetCenter)) {
                    var stepCenter = event.delta*movementSpeed;
                    target = true;
                    var vector = targetCenter.subtract(center);
                    if (vector.length > stepCenter) {
                        var step = vector.normalize(stepCenter);
                        view.center = center.add(step);
                    } else {
                        view.center = new paper.Point(targetCenter);
                    }
                }
                if (view.zoom !== targetZoom) {
                    var stepZoom = event.delta*zoomSpeed;
                    target = true;
                    if (view.zoom < targetZoom) {
                        view.zoom = Math.min(view.zoom + stepZoom, targetZoom);
                    } else {
                        view.zoom = Math.max(view.zoom - stepZoom, targetZoom);
                    }
                }
                if (!current.position.equals(targetCurrent)) {
                    target = true;
                    var vector = targetCurrent.subtract(current.position);
                    if (vector.length > stepCenter) {
                        var step = vector.normalize(stepCenter);
                        current.position = current.position.add(step);
                    } else {
                        current.position = targetCurrent;
                    }
                }
            }
        };
    };

    var initSymbols = function(currentSVG, callback) {
        pChapter = new paper.Path.Circle(new paper.Point(0, 0), 12);
        pChapter.strokeColor = "#E01980";
        pChapter.strokeWidth = 2;
        pChapter.fillColor = "#46102A";
        sChapter = new paper.Symbol(pChapter);
        pStep = new paper.Path.Circle(new paper.Point(0, 0), 8);
        pStep.strokeColor = "#E33022";
        pStep.strokeWidth = 1;
        pStep.fillColor = "#46102A";
        sStep = new paper.Symbol(pStep);
        pStepValidated = new paper.Group();
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
        pStepVisited = new paper.Path.Circle(new paper.Point(0, 0), 6);
        pStepVisited.fillColor = "#E33022";
        sStepVisited = new paper.Symbol(pStepVisited);
        // load current image in a upper layer 
        var activeLayer = paper.project.activeLayer;
        var currentLayer = new paper.Layer();
        paper.project.importSVG(currentSVG, function(item) {
            current = item;
            current.visible = false;
            if (callback) {
                callback();
            }
        });
        activeLayer.activate();            
    };
    
    this.init = function(canvasId, currentImage, newStepCallback, callback) {
        initView(canvasId);
        initSymbols(currentImage, callback);
        if (newStepCallback) {
            stepCallback = newStepCallback;
        }
    };

    var centerEveryting = function() {
        everything.position = new paper.Point(paper.view.center);
    };

    // Path loading
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
        centerEveryting();
    };
    
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

    // Steps loading
    this.loadSteps = function(data) {
        initSteps(data);
        displaySteps();
        // view resizing
        paper.view.onResize = function(event) {
            initCenter = new paper.Point(paper.view.center);
            targetCenter = new paper.Point(initCenter);
            targetZoom = 1;
            //centerEveryting();
            resize();
        };
        paper.view.draw();
    };

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

    var closeChapter = function() {
        if (currentChapterPath) {
            currentChapterPath.visible = false;
            currentChapterLabels.visible = false;
        }
        setTarget(initCenter, 1);
        $canvas.css("cursor", "default");
        currentChapterPath = null;
        chapterOpen = false;
    };

    var openChapter = function(index, animate) {
        if (typeof animate === 'undefined') {
            animate = false;
        }
        if (currentChapterPath) {
            currentChapterPath.visible = false;
            currentChapterLabels.visible = false;
        }
        if (index < chapterPaths.length) {
            currentChapterPath = chapterPaths[index];
            currentChapterPath.visible = true;
            currentChapterLabels = chapterLabels[index];
            currentChapterLabels.visible = true;
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
            }
            $canvas.css("cursor", "pointer");
            chapterOpen = true;
        } else {
            currentChapterPath = null;
            chapterOpen = false;
        }
    };
    
    var setTarget = function(center, zoom) {
        targetCenter = new paper.Point(center);
        targetZoom = zoom;
        movementSpeed = (paper.view.center.getDistance(targetCenter))/animationDuration;
        zoomSpeed = Math.abs(zoom - paper.view.zoom)/animationDuration;
        target = true;
    };


    var wordwrap = function(txt,max) {
        var lines=[];
        var space=-1;
        times=0;
        function cut() {
            for(var i=0;i<txt.length;i++) {
                (txt[i]==' ')&&(space=i);
                if(i>=max) {
                    (space==-1||txt[i]==' ')&&(space=i);
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
        target = false;
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
            centerEveryting();
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
        var basePath = path.clone();

        var placeSymbol = function(index, curve, length) {
            var chapter = steps[index].chapter;
            var symbol = getSymbol(steps[index]);
            var point = curve.getPointAt(length, false);
            var placed = symbol.place(point);
            displayedSteps.push(placed);
            everything.addChild(placed);
            if (chapter) {
                if (previousChapter) {
                    var offset = basePath.getOffsetOf(placed.position);
                    var newPath = basePath.split(offset);
                    var chapterPath = basePath;
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
                placed.onMouseDown = getChapterMouseHandler(chapters.length - 1);
                // display chapter number
                var textNumber = new paper.PointText({
                    point: point,
                    justification: 'center',
                    fontSize: 15,
                    fillColor: "#FFFFFF",
                    content: chapters.length
                });
                textNumber.bounds.center = point;
                textNumber.onMouseDown = getChapterMouseHandler(chapters.length - 1);
                everything.addChild(textNumber);
            } else {
                placed.onMouseDown = getStepMouseHandler(index);
            }
            placed.onMouseEnter = mouseEnterHandler;
            placed.onMouseLeave = mouseLeaveHandler;
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
                text.onMouseDown = getChapterMouseHandler(chapters.length - 1);
                previousLabel = null;
            }
            labels.push(text);
            text.onMouseEnter = mouseEnterHandler;
            text.onMouseLeave = mouseLeaveHandler;
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
        placeSymbol(i, currentCurve, currentCurve.length);
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
            setCurrentStep(steps[currentIndex].id, false, true);
            if (stepCallback) {
                stepCallback(steps[currentIndex].id);
            }
            event.preventDefault();
            clickCaptured = true;            
        };
        current.onMouseEnter = mouseEnterHandler;
        current.onMouseLeave = mouseLeaveHandler;

        everything.addChild(current);
    };
    
    // Mouse handlers
    var getStepMouseHandler = function(i) {
        return function(event) {
            setCurrentStep(steps[i].id, false, true);
            if (stepCallback) {
                stepCallback(steps[i].id);
            }
            event.preventDefault();
            clickCaptured = true;
        };
    };

    var getChapterMouseHandler = function(i) {
        return function(event) {
            openChapter(i, true);
            event.preventDefault();
            clickCaptured = true;
        };
    };

    var mouseEnterHandler = function(event) {
        $canvas.css("cursor", "pointer");
    };

    var mouseLeaveHandler = function(event) {
        if (!currentChapterPath) {
            $canvas.css("cursor", "default");
        }
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
                        placed.onMouseEnter = mouseEnterHandler;
                        placed.onMouseLeave = mouseLeaveHandler;                        
                        break;
                    }
                }
            }
        });
    };
    
    var setCurrentStep = function(index, animate, skipChapter) {
        var stepIndex = -1, chapterIndex = -1;
        // look for stepIndex
        for (var i=0;i<steps.length;i++) {
            if (steps[i].id && steps[i].id === index) {
                stepIndex = i;
                break;
            }
        }
        if (stepIndex > -1) {
            current.visible = true;
            currentIndex = stepIndex;
            // set target current position
            var step = displayedSteps[stepIndex];
            if (animate) {
                targetCurrent = step.position;
                target = true;
            } else {
                current.position = step.position;
                targetCurrent = current.position;
            }
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
        } else {
            console.error("Step with index "+index+" not found");
        }
    };
    
    this.setCurrentStep = function(index, animate) {
        if (typeof animate === 'undefined') {
            animate = false;
        }
        setCurrentStep(index, animate);
    };
    
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
    
    this.removeSteps = function() {
        removeSteps();
    };
}


