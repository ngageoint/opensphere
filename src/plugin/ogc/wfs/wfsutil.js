goog.provide('plugin.ogc.wfs');

goog.require('os.layer.Vector');
goog.require('os.ogc.FeatureTypeColumn');
goog.require('os.ogc.IFeatureType');
goog.require('os.ui.query.CombinatorCtrl');



/**
 * Launch the filter manager
 *
 * @param {!os.layer.Vector} layer The layer
 */
plugin.ogc.wfs.launchFilterManager = function(layer) {
  os.ui.query.CombinatorCtrl.launchForLayer(layer.getId());
};


/**
 * Get the filterable columns
 *
 * @param {!os.layer.Vector} layer The layer
 * @return {?Array<os.ogc.FeatureTypeColumn>} the columns
 */
plugin.ogc.wfs.getFilterColumns = function(layer) {
  var layerOptions = layer.getLayerOptions();
  if (layerOptions && layerOptions['featureType']) {
    var featureType = /** @type {os.ogc.IFeatureType} */ (layerOptions['featureType']);
    if (featureType) {
      return featureType.getColumns();
    }
  }

  return null;
};
