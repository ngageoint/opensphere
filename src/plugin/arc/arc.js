goog.provide('plugin.arc');
goog.provide('plugin.arc.ESRIType');
goog.require('plugin.arc.ArcLoader');


/**
 * Enum of ESRI types.
 * @enum {string}
 */
plugin.arc.ESRIType = {
  BOOLEAN: 'esriFieldTypeBoolean',
  STRING: 'esriFieldTypeString',
  DATE: 'esriFieldTypeDate',
  GEOM: 'esriFieldTypeGeometry'
};


/**
 * @const
 * @type {string}
 */
plugin.arc.MAP_SERVER = 'MapServer';


/**
 * Returns a more recognizable type from an ESRI Type.
 * @param {string} esriType
 * @return {?string}
 */
plugin.arc.getColumnType = function(esriType) {
  if (esriType === plugin.arc.ESRIType.BOOLEAN || esriType === plugin.arc.ESRIType.STRING) {
    return 'string';
  } else if (esriType === plugin.arc.ESRIType.DATE) {
    return 'datetime';
  } else if (esriType === plugin.arc.ESRIType.GEOM) {
    return 'gml';
  } else {
    return 'decimal';
  }
};


/**
 * Launch the filter manager
 * @param {!os.layer.Vector} layer The layer
 */
plugin.arc.launchFilterManager = function(layer) {
  os.ui.CombinatorCtrl.launchForLayer(layer.getId());
};


/**
 * Get the filterable columns
 * @param {!os.layer.Vector} layer The layer
 * @return {?Array<os.ogc.FeatureTypeColumn>} the columns
 */
plugin.arc.getFilterColumns = function(layer) {
  var layerOptions = layer.getLayerOptions();
  if (layerOptions && layerOptions['featureType']) {
    var featureType = /** @type {os.ogc.IFeatureType} */ (layerOptions['featureType']);
    if (featureType) {
      return featureType.getColumns();
    }
  }

  return null;
};


/**
 * @param {os.file.File} file
 * @return {number}
 */
plugin.arc.isArcResponse = function(file) {
  var score = 0;

  if (file && !os.file.isLocal(file)) {
    var uri = file.getUrl();

    if (uri) {
      score += plugin.arc.URI_REGEXP_.test(uri) ? 3 : 0;
    }

    var content = file.getContent();
    if (goog.isString(content)) {
      score += plugin.arc.CONTENT_REGEXP_.test(content) ? 3 : 0;
    }
  }

  return score;
};


/**
 * @type {RegExp}
 * @const
 * @private
 */
plugin.arc.URI_REGEXP_ = /arcgis/i;


/**
 * @type {RegExp}
 * @const
 * @private
 */
plugin.arc.CONTENT_REGEXP_ = /ArcGIS REST Services Directory/i;


/**
 * Instantiates and returns a new Arc loader. This
 * @param {os.ui.slick.SlickTreeNode} node
 * @param {string} url
 * @param {plugin.arc.ArcServer} server
 * @return {plugin.arc.ArcLoader}
 */
plugin.arc.getArcLoader = function(node, url, server) {
  var loader = new plugin.arc.ArcLoader(node, url, server);
  return loader;
};
