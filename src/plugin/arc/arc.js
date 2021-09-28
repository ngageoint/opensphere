goog.declareModuleId('plugin.arc');

import ArcFeatureType from './arcfeaturetype.js';
import ESRIType from './esritype.js';

const xml = goog.require('goog.dom.xml');
const googString = goog.require('goog.string');
const text = goog.require('os.file.mime.text');
const {launchForLayer} = goog.require('os.ui.query.CombinatorUI');

const VectorLayer = goog.requireType('os.layer.Vector');
const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');
const IFeatureType = goog.requireType('os.ogc.IFeatureType');
const SlickTreeNode = goog.requireType('os.ui.slick.SlickTreeNode');
const {default: ArcServer} = goog.requireType('plugin.arc.ArcServer');
const {default: IArcLoader} = goog.requireType('plugin.arc.IArcLoader');


/**
 * @type {string}
 */
export const MAP_SERVER = 'MapServer';

/**
 * Enum of supported server types.
 * @enum {string}
 */
export const ServerType = {
  MAP_SERVER: 'MapServer',
  IMAGE_SERVER: 'ImageServer',
  FEATURE_SERVER: 'FeatureServer'
};

/**
 * @type {string}
 */
export const ID = 'arc';

/**
 * Returns a more recognizable type from an ESRI Type.
 *
 * @param {string} esriType
 * @return {?string}
 */
export const getColumnType = function(esriType) {
  if (esriType === ESRIType.BOOLEAN || esriType === ESRIType.STRING) {
    return 'string';
  } else if (esriType === ESRIType.DATE) {
    return 'datetime';
  } else if (esriType === ESRIType.GEOM) {
    return 'gml';
  } else {
    return 'decimal';
  }
};

/**
 * Launch the filter manager
 *
 * @param {!VectorLayer} layer The layer
 */
export const launchFilterManager = function(layer) {
  launchForLayer(layer.getId());
};

/**
 * Get the filterable columns
 *
 * @param {!VectorLayer} layer The layer
 * @return {?Array<FeatureTypeColumn>} the columns
 */
export const getFilterColumns = function(layer) {
  var layerOptions = layer.getLayerOptions();
  if (layerOptions && layerOptions['featureType']) {
    var featureType = /** @type {IFeatureType} */ (layerOptions['featureType']);
    if (featureType) {
      return featureType.getColumns();
    }
  }

  return null;
};

/**
 * Regular expression to detect an error response. The default ArcGIS error page displays "ArcGIS REST Framework" at
 * the top, and the error/code below.
 * @type {RegExp}
 */
export const ERROR_REGEXP = /ArcGIS[\s\S]+Error:[\s\S]+Code:/;

/**
 * @type {RegExp}
 */
export const URI_REGEXP = /arcgis/i;

/**
 * @type {RegExp}
 */
export const WMS_URI_REGEXP = /(\/WMSServer|service=WMS)/i;

/**
 * @type {RegExp}
 */
export const CONTENT_REGEXP = /ArcGIS REST Services Directory/i;

/**
 * The ArcGIS loader class.
 * @type {?function(new: IArcLoader, ...)}
 */
export let loaderClass_ = null;

/**
 * Instantiates and returns a new Arc loader. This
 *
 * @param {SlickTreeNode} node The root tree node.
 * @param {string} url The Arc service URL for the node.
 * @param {ArcServer} server The Arc server instance.
 * @return {IArcLoader}
 */
export const getArcLoader = function(node, url, server) {
  if (loaderClass_) {
    return new loaderClass_(node, url, server);
  }

  return null;
};

/**
 * Set the ArcGIS loader class.
 * @param {?function(new: IArcLoader, ...)} clazz The class.
 */
export const setLoaderClass = function(clazz) {
  loaderClass_ = clazz;
};

/**
 * Create an Arc feature type from the layer metadata.
 *
 * @param {Object} config The layer metadata.
 * @return {ArcFeatureType} The feature type.
 */
export const createFeatureType = function(config) {
  var featureType = null;

  var fields = config ? /** @type {Array} */ (config['fields']) : null;
  if (fields && Array.isArray(fields) && fields.length > 0) {
    featureType = new ArcFeatureType();

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
      var type = getColumnType(/** @type {string} */ (field['type']));
      var c = /** @type {FeatureTypeColumn} */ ({
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
      return googString.numerateCompare(a.name, b.name);
    });
    featureType.setColumns(columns);
  }

  return featureType;
};

/**
 * A validator function for requests which checks for ArcGIS errors
 *
 * @param {ArrayBuffer|string} response The response.
 * @param {?string=} opt_contentType The content type of the response, if available.
 * @param {Array<number>=} opt_codes Response codes, if available.
 * @return {?string} An error message if one was found, or null if the response is OK
 */
export const getException = function(response, opt_contentType, opt_codes) {
  try {
    // Try to parse the response as HTML and determine if the response is an Arc error page.
    if (response && (!opt_contentType || opt_contentType.indexOf('text/html') != -1)) {
      const strResponse = typeof response === 'string' ? response : text.getText(response);
      if (strResponse && ERROR_REGEXP.test(strResponse)) {
        const doc = xml.loadXml(strResponse);
        const titleEl = doc.querySelector('title');
        if (titleEl) {
          // Arc error pages display a user-friendly error in the page title.
          const titleContent = titleEl.textContent.trim();
          if (titleContent.startsWith('Error:')) {
            // Strip the "Error: " prefix
            return titleContent.replace(/^Error:\s*/, '');
          }
        }
      }
    }
  } catch (e) {
  }

  return null;
};
