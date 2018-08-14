/**
 * Histogram utility functions.
 */
goog.provide('os.hist');
goog.require('os.hist.HistogramData');


/**
 * Gets the maximum combined bin count in an array of histograms.
 * @param {?Array.<!os.hist.IHistogramData>} histograms The array of histograms.
 * @param {boolean=} opt_combine If the counts should be combined for like bins.
 * @return {number}
 */
os.hist.maxBinCount = function(histograms, opt_combine) {
  var combine = goog.isDef(opt_combine) ? opt_combine : false;
  var max = 0;

  if (histograms && histograms.length > 0) {
    // add up the counts for each bin across all histograms
    var binCounts = /** @type {Object.<string, (number|Array)>} */ ({});
    for (var i = 0, n = histograms.length; i < n; i++) {
      var counts = histograms[i].getCounts();
      for (var key in counts) {
        var count = goog.isNumber(counts[key]) ? counts[key] : counts[key].length;
        if (!(key in binCounts)) {
          binCounts[key] = count;
        } else if (combine) {
          binCounts[key] += count;
        } else if (counts[key] > binCounts[key]) {
          binCounts[key] = count;
        }
      }
    }

    // find the largest count
    for (var key in binCounts) {
      var count = /** @type {number} */ (goog.isArray(binCounts[key]) ? binCounts[key].length : binCounts[key]);
      if (count > max) {
        max = count;
      }
    }
  }

  return max;
};


/**
 * Gets the bin counts and returns them in a sorted array of objects whose keys are the
 * bin name and values are the count.
 * @param {?Array.<os.hist.IHistogramData>} histograms The array of histograms.
 * @param {boolean=} opt_combine If the counts should be combined for like bins.
 * @param {boolean=} opt_skipCompare Whether to skip the compare function.
 * @return {Array.<!Object>}
 */
os.hist.getBinCounts = function(histograms, opt_combine, opt_skipCompare) {
  var combine = goog.isDef(opt_combine) ? opt_combine : false;
  var sortedCounts = [];

  if (histograms && histograms.length > 0) {
    // add up the counts for each bin across all histograms
    var binCounts = /** @type {Object.<string, (number|Array)>} */ ({});
    for (var i = 0, n = histograms.length; i < n; i++) {
      var counts = histograms[i].getCounts();
      for (var key in counts) {
        var count = goog.isNumber(counts[key]) ? counts[key] : counts[key].length;
        if (!(key in binCounts)) {
          binCounts[key] = count;
        } else if (combine) {
          binCounts[key] += count;
        } else if (counts[key] > binCounts[key]) {
          binCounts[key] = count;
        }
      }
    }

    goog.object.forEach(binCounts, function(value, key) {
      var object = {};
      object[key] = value;
      goog.array.binaryInsert(sortedCounts, object, function(a, b) {
        var aCount = goog.object.getValues(a)[0];
        var bCount = goog.object.getValues(b)[0];
        if (opt_skipCompare) {
          return -1;
        }
        return aCount != bCount ? goog.array.defaultCompare(bCount, aCount) : -1;
      });
    });
  }

  return sortedCounts;
};
