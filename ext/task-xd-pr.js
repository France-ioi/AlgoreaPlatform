"use strict";
/*
 * Cross-domain task proxy implementation for Bebras task API - v1.0 - 08/2014
 *
 * This file implements a "TaskProxyManager" object in the global scope so that
 * platforms using this file can just call
 * "myTask = TaskProxyManager.getTaskProxy(task_id)" to get the task object
 * associated to a task loaded in an iframe. Then they can just call
 * "myTask.myFunction()", with function of the API, the task object will take
 * care of message sending and receiving with the actual task.
 * 'task_id' here refers to the "id" attribute of the iframe in which a task is
 * loaded.
 *
 * It depends on jQuery but contains a minified version of jQuery.ba-postmessage
 * and jQuery.deparam.
 *
 */


/**
 * Global objects
 */

var TaskProxyManager = {
   tasks: {},
   platforms: {},
   getTaskProxy: function(idFrame, force) {
      if (TaskProxyManager.tasks[idFrame] && !force) {
         return TaskProxyManager.tasks[idFrame];
      } else {
         $('#'+idFrame).each(function() {
            var idProxy = PmInterface.getRandomID();
            var curTask = new Task($(this), idProxy);
            TaskProxyManager.tasks[idFrame] = curTask;
            if (idFrame in TaskProxyManager.platforms) {
               curTask.setPlatform(TaskProxyManager.platforms[idFrame]);
            }
         });
         PmInterface.init();
         return TaskProxyManager.tasks[idFrame];
      }
   },
   setPlatform: function(task, platform) {
      TaskProxyManager.platforms[task.Id] = platform;
      TaskProxyManager.tasks[task.Id].setPlatform(platform);
   },
   deleteTaskProxy: function(idFrame) {
      delete(TaskProxyManager.tasks[idFrame]);
      delete(TaskProxyManager.platforms[idFrame]);
   }
};

TaskProxyManager.getGraderProxy = TaskProxyManager.getTaskProxy;

/**
 * Enable / Disable messages debug
 */
var platformDebug = false;

/*
 * Task object, created from an iframe DOM element
 */
function Task(iframe, proxyId) {
   this.iframe = iframe;
   this.proxyId = proxyId;
   this.Id = iframe.attr('id');
   this.iframe_loaded = false;
   this.idSet = false;
   this.elementsLoaded = false;
   this.platform = null;
   this.settingId = false;

   var that = this;
   // checking if iframe already loaded, if not registering function on load()
   var iframeDoc = {readyState: false};
   var taskPresent = false;
   try {
      iframeDoc = this.iframe[0].contentDocument || this.iframe[0].contentWindow.document;
      taskPresent = !!that.iframe[0].contentWindow.task;
   } catch (e) { iframeDoc = {readyState: 'complete'}; taskPresent = true; }
   if (iframeDoc.readyState  == 'complete' && taskPresent) {
      that.iframe_loaded = true;
      if (!that.idSet && !that.settingId) {
         that.settingId = true;
         PmInterface.sendMessage(that, 'setId', [that.Id, that.proxyId], function() {
            that.idSet = true;
         });
      }
   } else {
      this.iframe.load(function() {
         that.iframe_loaded = true;
         if (!that.idSet && !that.settingId) {
            that.settingId = true;
            PmInterface.sendMessage(that, 'setId', [that.Id, that.proxyId], function() {
               that.idSet = true;
            });
         }
      });
   }
   this.setPlatform = function(platform) {
      this.platform = platform;
   };
}

Task.prototype.getSourceId = function() {
   return this.Id;
};

Task.prototype.getTargetUrl = function() {
   return this.iframe.attr('src');
};

Task.prototype.getTarget = function() {
   return this.iframe[0].contentWindow;
};

Task.prototype.getDomain = function() {
   var url = this.getTargetUrl();

   return url.substr(0, url.indexOf('/', 7));
};

/**
 * Task API functions
 */
Task.prototype.load = function(views, callback) {
   PmInterface.sendMessage(this, 'load', [views], callback);
};

Task.prototype.unload = function(callback) {
   PmInterface.sendMessage(this, 'unload', null, callback);
};

Task.prototype.getHeight = function(callback) {
   PmInterface.sendMessage(this, 'getHeight', null, callback);
};

Task.prototype.updateToken = function(token, callback) {
   PmInterface.sendMessage(this, 'updateToken', [token], callback);
};

Task.prototype.getMetaData = function(callback) {
   PmInterface.sendMessage(this, 'getMetaData', null, callback);
};

Task.prototype.getAnswer = function(callback) {
   PmInterface.sendMessage(this, 'getAnswer', null, callback);
};

Task.prototype.reloadAnswer = function(answer, callback) {
   PmInterface.sendMessage(this, 'reloadAnswer', [answer], callback);
};

Task.prototype.getState = function(callback) {
   PmInterface.sendMessage(this, 'getState', null, callback);
};

Task.prototype.reloadState = function(state, callback) {
   PmInterface.sendMessage(this, 'reloadState', [state], callback);
};

Task.prototype.getViews = function(callback) {
   PmInterface.sendMessage(this, 'getViews', null, callback);
};

Task.prototype.showViews = function(views, callback) {
   PmInterface.sendMessage(this, 'showViews', [views], callback);
};

Task.prototype.gradeTask = function(answer, answerToken, callback) {
   PmInterface.sendMessage(this, 'grader.gradeTask', [answer, answerToken], callback);
};

/*
 * Platform object definition, created from a Task object (see below)
 */

function Platform(task) {
   this.task = task;
}

Platform.prototype.getTask = function() {
   return this.task;
};

/*
 * Simple prototypes for platform API functions, to be overriden by your
 * platform's specific functions (for each platform object)
 */

Platform.prototype.validate = function(mode) {};
Platform.prototype.showView = function(views) {};
Platform.prototype.askHint = function(platformToken) {};
Platform.prototype.updateHeight = function(height) { this.updateDisplay({height: height}); };
Platform.prototype.updateDisplay = function(data) {
   if(data.height) {
      this.task.iframe.height(parseInt(data.height)+40);
   }
};
Platform.prototype.getTaskParams = function(key, defaultValue) {
   var res = {minScore: -3, maxScore: 6, randomSeed: 0, noScore: 0, readOnly: false};
   if (typeof key !== 'undefined') {
      if (key !== 'options' && key in res) {
         return this.taskParams[key];
      } else {
         return (typeof defaultValue !== 'undefined') ? defaultValue : null;
      }
   }
   return res;
};

Platform.prototype.openUrl = function(url) {
   // TODO
};

/* ************************************
 * Post Message interface definitions *
 **************************************
 */

/**
 * A message can be send or retrieved
 *
 * @param {string} request
 * @param {string} content
 * @param {string} iframe source id
 * @param {string} message identifier
 * @returns {Message}
 */
var Message = function(request, content, sSourceId, messageId, proxyId)
{
   this.request = request;
   this.content = content;
   this.source = sSourceId;
   this.messageId = messageId;
   this.proxyId = proxyId;
};

/**
 * Postmessage interface for tasks
 */
var PmInterface = {
   listening: false,
   listeners: {},
   callbacks: {},

   responseFromRequest: {
      validate: 'validateCallback',
      showView: 'showViewCallback',
      askHint: 'askHintCallback',
      updateHeight: 'updateHeightCallback',
      getTaskParams: 'getTaskParamsCallback',
      openUrl: 'openUrlCallback',
   },

   init: function() {
      if (PmInterface.listening === false) {
         $.receiveMessage(PmInterface.messageCallback, PmInterface.allowSourceOrigin);
         PmInterface.listening = true;
      }
   },

   /**
    * New message !
    *
    * @param {type} e
    */
   messageCallback: function(e) {
      var message = PmInterface.getMessage(e.data);
      if (platformDebug && message.request !== 'getHeightCallback') {
         console.log('Platform Got from '+message.source+' : ');
         console.log(message);
      }

      if (typeof message.content === 'string' || (typeof message.content === 'object' && Object.prototype.toString.call(message.content) !== '[object Array]')) {
         message.content = [message.content];
      }

      /**
       * Events
       */
      if (message.request in PmInterface.listeners && message.source in PmInterface.listeners[message.request]) {
         for (var i=0; i < PmInterface.listeners[message.request][message.source].length; i++){
            PmInterface.listeners[message.request][message.source][i].apply(this, message.content);
         }
      } else if (PmInterface.responseFromRequest[message.request] == message.request+'Callback') {
          message.content = (message.content === undefined) ? [] : message.content;
          // adding a callback proxy
                  message.content.push(function() {
                     // Convert arguments to an array (arguments is not an array)
                     var parameters = [];
                     for(var i = 0; i < arguments.length; i++) {
                        parameters.push(arguments[i]);
                     }
                     PmInterface.respond(message.source, message, parameters);
                  });
                  if (typeof TaskProxyManager.platforms[message.source][message.request] === 'function') {
                     TaskProxyManager.platforms[message.source][message.request].apply(this, message.content);
                  }
               }
      else {
         // If a callback was used, call it
         if (message.messageId in PmInterface.callbacks) {
            if (TaskProxyManager.tasks[message.source]) {
               var currentProxyId = TaskProxyManager.tasks[message.source].proxyId;
               if (currentProxyId != PmInterface.callbacks[message.messageId].proxyId) {
                  console.warn("receiving message from old task, ignoring...");
               } else {
                  PmInterface.callbacks[message.messageId].callback.apply(this, message.content);
               }
            }
            delete PmInterface.callbacks[message.messageId];
         }
         else if (typeof TaskProxyManager.platforms[message.source][message.request] === 'function') {
            var answer = TaskProxyManager.platforms[message.source][message.request].apply(this, message.content);

            /*if (answer && message.request in PmInterface.responseFromRequest) {
               var msg = new Message(PmInterface.responseFromRequest[message.request], answer);
               $.postMessage(msg, PmInterface.parent_url, parent);

               if (platformDebug && msg.request !== 'getHeight') {
                  console.log('Platform Send to '+message.source+' : ');
                  console.log(msg);
               }
            }*/
         }
         else if (message.request !== 'heightEvent') {
            console.log('Warning : Platform Got from '+message.source+' undefined '+message.request);
         }
      }
   },

   /**
    * General listener
    */
   addEventListener: function(sourceId, event, callback) {
      if (!(event in PmInterface.listeners)) {
         PmInterface.listeners[event] = [];
      }
      if (!(sourceId in PmInterface.listeners[event])) {
         PmInterface.listeners[event][sourceId] = [];
      }
      PmInterface.listeners[event][sourceId].push(callback);
   },

   /**
    * Check if we allow the origin's message
    *
    * @param {type} origin
    * @returns {Boolean}
   */
   allowSourceOrigin: function(origin) {
      return true;
   },

   /**
    * Send a message to task's iframe
    * It takes care of whether or not the iframe is fully loaded
    *
    * @param {object} task
    * @param {object} request
    * @param {array} content
    * @param {function} callback
    */
   sendMessage: function(task, request, content, callback) {
      if (!task.iframe_loaded || (task.idSet !== true && request !== 'setId')) {
         setTimeout(function() {
            PmInterface.sendMessage(task, request, content, callback);
         }, 250);
      }
      else {
         var messageId = PmInterface.getRandomID();
         // Here we hack load a little to transfer platformParams (that will
         // be returned by platform.getTaskParams(). We do it in order to avoid
         // having a task->platform postMessage interface, which makes things
         // more difficult
         if (request == 'load') {
            content[1] = task.platform.getTaskParams();
         }

         // Register callback
         if (typeof callback !== 'undefined') {
            PmInterface.callbacks[messageId] = {callback: callback, proxyId: task.proxyId};
         }

         var msg = new Message(request, content, null, messageId, task.proxyId);
         $.postMessage(msg, task.getTargetUrl(), task.getTarget());
      }
   },

   /**
    * Respond to the message (called by the "callback proxy")
    *
    * @param {Message} message
    * @param {string} answer
    */
   respond: function(source, message, answer) {
      if (message.request in PmInterface.responseFromRequest) {
         var msg = new Message(PmInterface.responseFromRequest[message.request], answer, null, message.messageId);
         $.postMessage(msg, TaskProxyManager.tasks[message.source].getTargetUrl(), TaskProxyManager.tasks[message.source].getTarget());
         if (platformDebug) {
            console.log('Platform responds: ');
            console.log(msg);
         }
      }
   },

   /**
    * Retrieve a Message object from a $.receiveMessage call
    *
    * @param {string} serializedString
    * @returns {Message}
   */
   getMessage: function(serializedString) {
      var obj = $.deparam(serializedString);
      var message = null;
      if (obj.request) {
         message = new Message(obj.request, obj.content, obj.source, obj.messageId);
      }

      return message;
  },

   /**
    * Generates a random id
    *
    * @returns {integer}
    */
   getRandomID: function() {
      var low = Math.floor(Math.random() * 922337203).toString();
      var high = Math.floor(Math.random() * 2000000000).toString();
      return high + low;
   }
};

// deparam.min.js (https://github.com/chrissrogers/jquery-deparam)
(function(h){h.deparam=function(i,j){var d={},k={"true":!0,"false":!1,"null":null};h.each(i.replace(/\+/g," ").split("&"),function(i,l){var m;var a=l.split("="),c=decodeURIComponent(a[0]),g=d,f=0,b=c.split("]["),e=b.length-1;/\[/.test(b[0])&&/\]$/.test(b[e])?(b[e]=b[e].replace(/\]$/,""),b=b.shift().split("[").concat(b),e=b.length-1):e=0;if(2===a.length)if(a=decodeURIComponent(a[1]),j&&(a=a&&!isNaN(a)?+a:"undefined"===a?void 0:void 0!==k[a]?k[a]:a),e)for(;f<=e;f++)c=""===b[f]?g.length:b[f],m=g[c]=
f<e?g[c]||(b[f+1]&&isNaN(b[f+1])?{}:[]):a,g=m;else h.isArray(d[c])?d[c].push(a):d[c]=void 0!==d[c]?[d[c],a]:a;else c&&(d[c]=j?void 0:"")});return d}})(jQuery);

/*!
 * jQuery postMessage - v0.5 - 9/11/2009
 * http://benalman.com/projects/jquery-postmessage-plugin/
 *
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 *
 * Version from
 * https://github.com/jkeys089/jquery-postmessage
 */
(function($,f){var b,d,j=1,a,g=!1,h="postMessage",c="addEventListener",e,i=f[h];
$[h]=function(k,m,l){if(!m){return;}k=typeof k==="string"?k:$.param(k);l=l||parent;if(i){f.setTimeout(function(){l[h](k,m.replace(/([^:]+:\/\/[^\/]+).*/,"$1"));
},0);}else{if(m){l.location=m.replace(/#.*$/,"")+"#"+(+new Date())+(j++)+"&"+k;}}};$.receiveMessage=e=function(m,l,k){if(i){if(m){a&&e();a=function(n){if(n.domain){l=l.split("://")[1];
n.origin=n.domain;}if((typeof l==="string"&&n.origin!==l)||($.isFunction(l)&&l(n.origin)===g)){return g;}m(n);};}if(f[c]){f[m?c:"removeEventListener"]("message",a,g);
}else{f[m?"attachEvent":"detachEvent"]("onmessage",a);}}else{b&&clearInterval(b);b=null;if(m){k=typeof l==="number"?l:typeof k==="number"?k:100;b=setInterval(function(){var o=document.location.hash,n=/^#?\d+&/;
if(o!==d&&n.test(o)){d=o;m({data:o.replace(n,"")});}},k);}}};})(jQuery,window);
