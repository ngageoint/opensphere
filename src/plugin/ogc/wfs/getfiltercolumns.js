goog.module('plugin.ogc.wfs.getFilterColumns');


/**
 * Get the filterable columns
 *
 * @param {!os.layer.Vector} layer The layer
 * @return {?Array<os.ogc.FeatureTypeColumn>} the columns
 */
exports = function(layer) {
  var layerOptions = layer.getLayerOptions();
  if (layerOptions && layerOptions['featureType']) {
    var featureType = /** @type {os.ogc.IFeatureType} */ (layerOptions['featureType']);
    if (featureType) {
      return featureType.getColumns();
    }
  }

  return null;
};
