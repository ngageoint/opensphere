goog.provide('plugin.arc');
goog.provide('plugin.arc.ESRIType');

goog.require('os.ui.query.CombinatorCtrl');
goog.require('plugin.arc.ArcFeatureType');
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
 * @type {string}
 * @const
 */
plugin.arc.ID = 'arc';


/**
 * Returns a more recognizable type from an ESRI Type.
 *
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
 *
 * @param {!os.layer.Vector} layer The layer
 */
plugin.arc.launchFilterManager = function(layer) {
  os.ui.query.CombinatorCtrl.launchForLayer(layer.getId());
};


/**
 * Get the filterable columns
 *
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
 * @type {RegExp}
 * @const
 */
plugin.arc.URI_REGEXP = /arcgis/i;


/**
 * @type {RegExp}
 * @const
 */
plugin.arc.CONTENT_REGEXP = /ArcGIS REST Services Directory/i;


/**
 * Instantiates and returns a new Arc loader. This
 *
 * @param {os.ui.slick.SlickTreeNode} node
 * @param {string} url
 * @param {plugin.arc.ArcServer} server
 * @return {plugin.arc.ArcLoader}
 */
plugin.arc.getArcLoader = function(node, url, server) {
  var loader = new plugin.arc.ArcLoader(node, url, server);
  return loader;
};


/**
 * Create an Arc feature type from the layer metadata.
 *
 * @param {Object} config The layer metadata.
 * @return {plugin.arc.ArcFeatureType} The feature type.
 */
plugin.arc.createFeatureType = function(config) {
  var featureType = null;

  var fields = config ? /** @type {Array} */ (config['fields']) : null;
  if (fields && Array.isArray(fields) && fields.length > 0) {
    featureType = new plugin.arc.ArcFeatureType();

    var startField = null;
    var endField = null;
    var timeInfo = /** @type {Object} */ (config['timeInfo']);
    if (timeInfo) {
      startField = /** @type {string} */ (timeInfo['startTimeField']);
      endField = /** @type {string} */ (timeInfo['endTimeField']);
    }

    var columns = [];
    for (var i = 0, ii = fields.length; i < ii; i++) {
      var field = fields[i];
      var name = /** @type {string} */ (field['name']);
      var type = plugin.arc.getColumnType(/** @type {string} */ (field['type']));
      var c = /** @type {os.ogc.FeatureTypeColumn} */ ({
        'name': name,
        'type': type
      });
      columns.push(c);

      if (name === startField) {
        featureType.setStartDateColumnName(startField);
      } else if (name === endField) {
        featureType.setEndDateColumnName(endField);
      } else if (name === 'esriFieldTypeGeometry') {
        featureType.setGeometryColumnName(name);
      }
    }

    columns.sort(function(a, b) {
      return goog.string.numerateCompare(a.name, b.name);
    });
    featureType.setColumns(columns);
  }

  return featureType;
};
