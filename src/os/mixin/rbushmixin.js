goog.provide('os.mixin.rbush');

goog.require('ol.structs.RBush');
goog.require('os.extent');

(function() {
  var oldGetInExtent = ol.structs.RBush.prototype.getInExtent;

  var left = [];
  var right = [];
  var center = [];
  var extents = [left, center, right];
  var featureSets = [];

  /**
   * @param {Array} a
   * @param {Array} b
   * @return {number}
   */
  var sortLength = function(a, b) {
    return b.length - a.length;
  };

  /**
   * @param {ol.Extent} extent
   * @return {Array<T>} All the items in the extent
   */
  ol.structs.RBush.prototype.getInExtent = function(extent) {
    extents[0] = os.extent.normalizeAntiLeft(extent, undefined, left);
    extents[1] = ol.extent.returnOrUpdate(extent, center);
    extents[2] = os.extent.normalizeAntiRight(extent, undefined, right);

    // merge any extents which intersect
    for (var i = extents.length - 1; i > 0; i--) {
      var prev = extents[i - 1];
      var curr = extents[i];
      if (ol.extent.intersects(prev, curr)) {
        ol.extent.extend(prev, curr);
        extents.splice(i, 1);
      }
    }

    // query for features
    var setsContainingFeatures = 0;
    featureSets.length = 0;
    for (var i = 0, n = extents.length; i < n; i++) {
      featureSets[i] = oldGetInExtent.call(this, extents[i]);
      if (featureSets[i].length) {
        setsContainingFeatures++;
      }
    }

    featureSets.sort(sortLength);

    // if more than one returned results, dedupe them
    if (setsContainingFeatures > 1) {
      var seen = {};
      for (i = 0, n = featureSets.length; i < n; i++) {
        for (var j = 0, m = featureSets[i].length; j < m; j++) {
          var feature = featureSets[i][j];
          var id = ol.getUid(feature);

          if (i !== 0 && !seen[id]) {
            featureSets[0].push(feature);
          }

          seen[id] = true;
        }
      }
    }

    return featureSets[0];
  };
})();
