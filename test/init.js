goog.require('os.ui.Module');

// Init angular app before all tests
angular.module('app', ['os.ui']);
module('app');

(function() {
  if (window.zip) {
    var script = document.querySelector('script[src*=\'/zip.js\']');
    zip.workerScriptsPath = script.src.replace(/\/zip.js(\?.*)?$/, '/');
  }
})();
