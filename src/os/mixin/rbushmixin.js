goog.module('os.mixin.rbush');
goog.module.declareLegacyNamespace();

const {getUid} = goog.require('ol');
const {extend, intersects, returnOrUpdate} = goog.require('ol.extent');
const RBush = goog.require('ol.structs.RBush');
const {removeDuplicates} = goog.require('os.array');
const {normalizeAntiLeft, normalizeAntiRight} = goog.require('os.extent');


var oldGetInExtent = RBush.prototype.getInExtent;

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
RBush.prototype.getInExtent = function(extent) {
  extents[0] = normalizeAntiLeft(extent, undefined, left);
  extents[1] = returnOrUpdate(extent, center);
  extents[2] = normalizeAntiRight(extent, undefined, right);

  // merge any extents which intersect
  for (var i = extents.length - 1; i > 0; i--) {
    var prev = extents[i - 1];
    var curr = extents[i];
    if (intersects(prev, curr)) {
      extend(prev, curr);
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
    var merged = Array.prototype.concat.apply([], featureSets);
    removeDuplicates(merged, undefined, /** @type {function(?):string|undefined} */ (getUid));
    return merged;
  }

  return featureSets[0];
};
