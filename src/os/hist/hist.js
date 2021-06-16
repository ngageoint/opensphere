/**
 * Histogram utility functions.
 */
goog.provide('os.hist');

goog.require('os.hist.HistogramData');
goog.require('os.hist.IHistogramProvider');
goog.require('os.implements');

goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * Gets the maximum combined bin count in an array of histograms.
 *
 * @param {?Array.<!os.hist.IHistogramData>} histograms The array of histograms.
 * @param {boolean=} opt_combine If the counts should be combined for like bins.
 * @return {number}
 */
os.hist.maxBinCount = function(histograms, opt_combine) {
  var combine = opt_combine !== undefined ? opt_combine : false;
  var max = 0;

  if (histograms && histograms.length > 0) {
    // add up the counts for each bin across all histograms
    var binCounts = /** @type {Object.<string, (number|Array)>} */ ({});
    for (var i = 0, n = histograms.length; i < n; i++) {
      var counts = histograms[i].getCounts();
      for (var key in counts) {
        var count = typeof counts[key] === 'number' ? counts[key] : counts[key].length;
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
      var count = /** @type {number} */ (Array.isArray(binCounts[key]) ? binCounts[key].length : binCounts[key]);
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
 *
 * @param {?Array.<os.hist.IHistogramData>} histograms The array of histograms.
 * @param {boolean=} opt_combine If the counts should be combined for like bins.
 * @param {boolean=} opt_skipCompare Whether to skip the compare function.
 * @return {Array.<!Object>}
 */
os.hist.getBinCounts = function(histograms, opt_combine, opt_skipCompare) {
  var combine = opt_combine !== undefined ? opt_combine : false;
  var sortedCounts = [];

  if (histograms && histograms.length > 0) {
    // add up the counts for each bin across all histograms
    var binCounts = /** @type {Object.<string, (number|Array)>} */ ({});
    for (var i = 0, n = histograms.length; i < n; i++) {
      var counts = histograms[i].getCounts();
      for (var key in counts) {
        var count = typeof counts[key] === 'number' ? counts[key] : counts[key].length;
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


/**
 * If an object is a histogram provider.
 * @param {Object} obj The object.
 * @return {boolean}
 */
os.hist.isHistogramProvider = (obj) => os.implements(obj, os.hist.IHistogramProvider.ID);


/**
 * Convenience function to map a layer or its source to a histogram.
 * @param {ol.layer.Layer} layer The layer.
 * @param {os.ui.timeline.TimelineScaleOptions} options The histogram options.
 * @return {?os.hist.IHistogramData} The histogram, or null if unavailable. May be found on the layer or source.
 */
os.hist.mapLayerToHistogram = (layer, options) => {
  if (layer) {
    if (os.hist.isHistogramProvider(layer)) {
      return /** @type {os.hist.IHistogramProvider} */ (layer).getHistogram(options);
    } else {
      return os.hist.mapSourceToHistogram(layer.getSource(), options);
    }
  }

  return null;
};


/**
 * Convenience function to map a source to a histogram.
 * @param {ol.source.Source} source The source.
 * @param {os.ui.timeline.TimelineScaleOptions} options The histogram options.
 * @return {?os.hist.IHistogramData} The histogram, or null if unavailable.
 */
os.hist.mapSourceToHistogram = (source, options) => {
  if (os.hist.isHistogramProvider(source)) {
    return /** @type {os.hist.IHistogramProvider} */ (source).getHistogram(options);
  }

  return null;
};
