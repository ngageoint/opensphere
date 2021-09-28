goog.declareModuleId('plugin.ogc.wfs.getFilterColumns');

const {default: Vector} = goog.requireType('os.layer.Vector');
const {default: FeatureTypeColumn} = goog.requireType('os.ogc.FeatureTypeColumn');
const {default: IFeatureType} = goog.requireType('os.ogc.IFeatureType');


/**
 * Get the filterable columns
 *
 * @param {!Vector} layer The layer
 * @return {?Array<FeatureTypeColumn>} the columns
 */
const getFilterColumns = function(layer) {
  var layerOptions = layer.getLayerOptions();
  if (layerOptions && layerOptions['featureType']) {
    var featureType = /** @type {IFeatureType} */ (layerOptions['featureType']);
    if (featureType) {
      return featureType.getColumns();
    }
  }

  return null;
};

export default getFilterColumns;
