goog.provide('os.action.common');

goog.require('os.ui.IHistogramUI');


/**
 * Gets the items from a set of bins
 * @param {!Array<!os.data.histo.ColorBin>} bins
 * @return {!Array<!ol.Feature>} items
 */
os.action.common.getCountByItems = function(bins) {
  // build an array in-place instead of using concat which will create a new array on each call
  var items = [];
  for (var i = 0, ii = bins.length; i < ii; i++) {
    var startIndex = items.length;
    var binItems = bins[i].getItems();
    items.length += binItems.length;

    for (var j = 0, jj = binItems.length; j < jj; j++) {
      items[startIndex + j] = binItems[j];
    }
  }

  return items;
};


/**
 * Handle the user choosing a selected bin color.
 * @param {!os.data.histo.SourceHistogram} histogram The histogram
 * @param {!Array<!os.data.histo.ColorBin>} bins The bins to color
 * @param {string} color The color
 */
os.action.common.onColorChosen = function(histogram, bins, color) {
  histogram.setColorMethod(os.data.histo.ColorMethod.MANUAL, bins, os.style.toRgbaString(color));
};


/**
 * Get vector source from an action event context.
 * @param {*} context
 * @return {!Array<!os.source.Vector>}
 */
os.action.common.getSourcesFromContext = function(context) {
  var sources = [];
  if (context) {
    if (os.instanceOf(context, os.source.Vector.NAME)) {
      // single source passed as context (list tool)
      sources.push(context);
    } else if (goog.isArray(context)) {
      for (var i = 0, n = context.length; i < n; i++) {
        if (os.instanceOf(context[i], os.source.Vector.NAME)) {
          sources.push(context[i]);
        } else if (context[i] instanceof os.data.LayerNode) {
          // layers window
          var layerNode = /** @type {os.data.LayerNode} */ (context[i]);
          var layer = layerNode.getLayer();
          if (layer instanceof os.layer.Vector) {
            var source = layer.getSource();
            if (source) {
              sources.push(source);
            }
          }
        }
      }
    }
  }

  return sources;
};


/**
 * Checks if there are selected bins in the Count By to show/hide the Color Selected menu item.
 * @param {os.ui.IHistogramUI=} opt_histoUi
 * @return {boolean}
 */
os.action.common.canCreateHistogramFilter = function(opt_histoUi) {
  if (opt_histoUi) {
    try {
      if (os.source.isFilterable(opt_histoUi.getSource())) {
        var parent = opt_histoUi.getParent();

        // we can create a filter if the count by has selected bins, is cascaded and has cascaded bins, or the parent
        // is able to create a filter
        return opt_histoUi.hasSelectedBins() || (opt_histoUi.isCascaded() && opt_histoUi.hasCascadedBins()) ||
            os.action.common.canCreateHistogramFilter(parent);
      }
    } catch (e) {
      // wasn't a histogram controller? fall through to return false
    }
  }

  return false;
};
