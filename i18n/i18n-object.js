/*
Set of functions to help translating strings within an object.

It is used for the object 'models', defined in shared/models.js:
this object defines lots of labels for its fields.

JSON.stringify(fetchAllPropertyStrings(models, 'label', 'models'));
will return a JSON with the strings for each path of the object.

commonFramework/i18n/i18n-replace.py can then be used to replace all these
strings in models.js by their key (corresponding to the path).

translateProperty is then used, when i18next is loaded, to translate all these
keys back into strings.
*/


function translateProperty(obj, prop, path, trFct) {
  // Recursively translate property prop of the object obj through trFct.
  // trFct is passed two arguments: the path to the current property, and its
  // value, and must return the new value.
  var keys = Object.keys(obj);
  for(var i=0; i<keys.length; i++) {
    var curKey = keys[i];
    var curVal = obj[curKey];
    var curPath = (path ? path + '_' : '') + curKey;
    if(curKey == prop && typeof curVal === 'string') {
      obj[curKey] = trFct(curPath, obj[curKey]);
    } else if(curVal && typeof curVal === 'object') {
      obj[curKey] = translateProperty(obj[curKey], prop, curPath, trFct);
    }
  }
  return obj;
}

function fetchAllPropertyStrings(obj, prop, basePath='') {
  // Recursively get all strings corresponding to a property prop in object obj
  var propStrObj = {};
  var fetchFct = function (path, val) {
    propStrObj[path] = val;
    return val;
  };
  translateProperty(obj, prop, basePath, fetchFct);
  return propStrObj;
}

// Translate models object
i18next.on('loaded', function (loaded) {
  window.models = translateProperty(window.models, 'label', '', function(path, val) {
    if(val.substring(0, 7) == 'models_') {
      return i18next.t(val);
    } else {
      return val;
    }
    });
});
