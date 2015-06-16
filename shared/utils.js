// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.removeByID = function(itemID) {
  var iFoundItem = undefined;
  for (var iItem = 0; iItem < this.length; iItem++) {
     if (this[iItem].ID === itemID) {
        iFoundItem = iItem;
        break;
     }
  }
  if (iFoundItem !== undefined) {
     this.remove(iFoundItem);
  }
};

var objectHasProperties = function(object) {
   for (var property in object) {
      if(object.hasOwnProperty(property)) {
         return true;
      }
   }
   return false;
};
