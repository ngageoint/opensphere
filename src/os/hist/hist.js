/**
 * Histogram utility functions.
 */
goog.module('os.hist');

const {binaryInsert, defaultCompare} = goog.require('goog.array');
const googObject = goog.require('goog.object');
const IHistogramProvider = goog.require('os.hist.IHistogramProvider');
const osImplements = goog.require('os.implements');

const Layer = goog.requireType('ol.layer.Layer');
const Source = goog.requireType('ol.source.Source');
const IHistogramData = goog.requireType('os.hist.IHistogramData');
const TimelineScaleOptions = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * Gets the maximum combined bin count in an array of histograms.
 *
 * @param {?Array<!IHistogramData>} histograms The array of histograms.
 * @param {boolean=} opt_combine If the counts should be combined for like bins.
 * @return {number}
 */
const maxBinCount = function(histograms, opt_combine) {
  var combine = opt_combine !== undefined ? opt_combine : false;
  var max = 0;

  if (histograms && histograms.length > 0) {
    // add up the counts for each bin across all histograms
    var binCounts = /** @type {Object<string, (number|Array)>} */ ({});
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
 * @param {?Array<IHistogramData>} histograms The array of histograms.
 * @param {boolean=} opt_combine If the counts should be combined for like bins.
 * @param {boolean=} opt_skipCompare Whether to skip the compare function.
 * @return {Array<!Object>}
 */
const getBinCounts = function(histograms, opt_combine, opt_skipCompare) {
  var combine = opt_combine !== undefined ? opt_combine : false;
  var sortedCounts = [];

  if (histograms && histograms.length > 0) {
    // add up the counts for each bin across all histograms
    var binCounts = /** @type {Object<string, (number|Array)>} */ ({});
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

    googObject.forEach(binCounts, function(value, key) {
      var object = {};
      object[key] = value;
      binaryInsert(sortedCounts, object, function(a, b) {
        var aCount = googObject.getValues(a)[0];
        var bCount = googObject.getValues(b)[0];
        if (opt_skipCompare) {
          return -1;
        }
        return aCount != bCount ? defaultCompare(bCount, aCount) : -1;
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
const isHistogramProvider = (obj) => osImplements(obj, IHistogramProvider.ID);

/**
 * Convenience function to map a layer or its source to a histogram.
 * @param {Layer} layer The layer.
 * @param {TimelineScaleOptions} options The histogram options.
 * @return {?IHistogramData} The histogram, or null if unavailable. May be found on the layer or source.
 */
const mapLayerToHistogram = (layer, options) => {
  if (layer) {
    if (isHistogramProvider(layer)) {
      return (
        /** @type {IHistogramProvider} */
        (layer).getHistogram(options)
      );
    } else {
      return mapSourceToHistogram(layer.getSource(), options);
    }
  }

  return null;
};

/**
 * Convenience function to map a source to a histogram.
 * @param {Source} source The source.
 * @param {TimelineScaleOptions} options The histogram options.
 * @return {?IHistogramData} The histogram, or null if unavailable.
 */
const mapSourceToHistogram = (source, options) => {
  if (isHistogramProvider(source)) {
    return (
      /** @type {IHistogramProvider} */
      (source).getHistogram(options)
    );
  }

  return null;
};

exports = {
  maxBinCount,
  getBinCounts,
  isHistogramProvider,
  mapLayerToHistogram,
  mapSourceToHistogram
};
