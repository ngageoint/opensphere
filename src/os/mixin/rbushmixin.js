goog.declareModuleId('os.mixin.rbush');

import {extend, intersects, returnOrUpdate} from 'ol/src/extent.js';
import RBush from 'ol/src/structs/RBush.js';
import {getUid} from 'ol/src/util.js';

import {removeDuplicates} from '../array/array.js';
import {normalizeAntiLeft, normalizeAntiRight} from '../extent.js';


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

  let result = featureSets[0];

  // if more than one returned results, dedupe them
  if (setsContainingFeatures > 1) {
    var merged = Array.prototype.concat.apply([], featureSets);
    removeDuplicates(merged, undefined, /** @type {function(?):string|undefined} */ (getUid));
    result = merged;
  }

  // Clear feature sets so the module won't keep feature references in memory.
  featureSets.length = 0;

  return result;
};
