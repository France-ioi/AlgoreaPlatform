window.ErrorLogger = {

  last_error_key: null,

  log: function(message, file, line, column, error) {
    var key = this.getErrorKey(file, line);
    if(key !== this.last_error_key) {
      this.last_error_key = key;
      this.send({
        url: window.location.href.toString(),
        browser: this.getBrowser(),
        details: this.formatDetails({
          details: Array.prototype.slice.call(arguments)
        })
      })
    }
  },

  logTaskError: function(url) {
    this.send({
      url: url,
      browser: this.getBrowser(),
      details: this.formatDetails({
        details: Array.prototype.slice.call(arguments)
      })
    })
  },

  getErrorKey: function() {
    return Array.prototype.slice.call(arguments).join(':');
  },

  send: function(data) {
    var url = config.domains.current.baseUrl;
    if(url[url.length - 1] != '/') {
      url += '/';
    }
    url += 'errors/error_logger.php';
    $.post(url, data,
        function(res) {
            if (!res || !res.success) {
              window.console && window.console.log('error from error_logger.php');
            }
        },
        'json'
    ).fail(function() {
      window.console && window.console.log('error calling error_logger.php');
    });
  },

  getBrowser: function() {
    return window['bowser'] ? bowser.name + ' ' + bowser.version : '';
  },

  formatDetails: function() {
    var chunks = [];
    try {
      var n = arguments.length, i;
      for (i = 0; i < n; i++) {
        var arg = arguments[i];
        if (typeof arg === "string") {
          chunks.push([i, arg]);
        } else if (typeof arg === "object") {
          if (typeof arg.name === "string") {
            chunks.push([i, "name", arg.name]);
          }
          if (typeof arg.message === "string") {
            chunks.push([i, "message", arg.message]);
          }
          if (typeof arg.stack === "string") {
            chunks.push([i, "stack", arg.stack]);
          }
          if (typeof arg.details === "object" && arg.details !== null) {
            var details = arg.details;
            if (details.length >= 4) {
              chunks.push([i, "details", "message", details[0]]);
              chunks.push([i, "details", "file", details[1]]);
              chunks.push([i, "details", "line", details[2]]);
              chunks.push([i, "details", "column", details[3]]);
              var ex = details[4];
              if (ex && typeof ex === "object") {
                chunks.push([i, "details", "ex", "name", ex.name]);
                chunks.push([i, "details", "ex", "message", ex.message]);
                chunks.push([i, "details", "ex", "stack", ex.stack]);
              }
            } else {
              chunks.push([i, "details", "keys", Object.keys(details)]);
              chunks.push([i, "details", "values", Object.values(details)]);
            }
          }
          chunks.push([i, "keys", Object.keys(arg)]);
        } else {
          chunks.push([i, "type", typeof arg]);
        }
      }
    } catch (ex) {
      chunks.push(["oops", ex.toString()]);
      if (typeof ex.stack === "string") {
        chunks.push(["oops", "stack", ex.stack]);
      }
    }
    return JSON.stringify(chunks);
  }

}


window.onerror = function() {
  ErrorLogger.log.apply(ErrorLogger, arguments);
};