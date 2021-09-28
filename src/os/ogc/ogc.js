goog.declareModuleId('os.ogc');

import Settings from '../config/settings.js';
import {getText} from '../file/mime/text.js';
import {getMapContainer} from '../map/mapinstance.js';

const QueryData = goog.require('goog.Uri.QueryData');
const {loadXml} = goog.require('goog.dom.xml');

const {default: IOGCDescriptor} = goog.requireType('os.ui.ogc.IOGCDescriptor');


/**
 * Identifier used by OGC data model.
 * @type {string}
 */
export const ID = 'ogc';

/**
 * Default projection to use for OGC requests.
 * @type {string}
 */
export const defaultProjection = 'EPSG:4326';

/**
 * Regular expressions to detect OGC GetCapabilities root elements.
 * @enum {RegExp}
 */
export const GetCapsRootRegexp = {
  WMS: /^WM(T_M)?S_Capabilities$/i,
  WMTS: /^Capabilities$/i,
  WFS: /^WFS_Capabilities$/i
};

/**
 * The default tile style object.
 * @type {!osx.ogc.TileStyle}
 */
export const DEFAULT_TILE_STYLE = {
  label: 'Default',
  data: ''
};

/**
 * Regular expression to detect tile styles that support changing the tile color.
 * @type {RegExp}
 */
export const COLOR_STYLE_REGEX = /(density)|(foreground color)/i;

/**
 * Regular expression to detect an OGC error response.
 * @type {RegExp}
 */
export const ERROR_REGEX = /(ExceptionText|ServiceException)/i;

/**
 * A validator function for requests which checks for OGC exceptions
 *
 * @param {ArrayBuffer|string} response The response.
 * @param {?string=} opt_contentType The content type of the response, if available.
 * @param {Array<number>=} opt_codes Response codes, if available.
 * @return {?string} An error message if one was found, or null if the response is OK
 */
export const getException = function(response, opt_contentType, opt_codes) {
  try {
    // Try to parse the response as XML and determine if it appears to be an OGC exception report.
    //  - Ignore if the content type is not XML
    //  - Ignore if the response codes contain 200 OK. Geoserver will return a 200 code for exceptions to the /ows
    //    endpoint, which we should be able to handle and load the server with appropriate parameters.
    if (response &&
        (!opt_contentType || opt_contentType.indexOf('/xml') != -1) &&
        (!opt_codes || opt_codes.indexOf(200) === -1)) {
      const strResponse = typeof response === 'string' ? response : getText(response);
      if (strResponse && ERROR_REGEX.test(strResponse)) {
        const doc = loadXml(strResponse);
        const ex = doc.querySelector('ExceptionText, ServiceException');
        if (ex) {
          return ex.textContent;
        }
      }
    }
  } catch (e) {
  }

  return null;
};

/**
 * Get the default WFS layer options
 *
 * @return {!Object<string, *>}
 */
export const getDefaultWfsOptions = function() {
  return {
    'load': true,
    'spatial': true,
    'temporal': true,
    'exclusions': false, // TODO: make this true after supporting exclusion areas
    'filter': true,
    'usePost': true,
    'params': getDefaultWfsParams()
  };
};

/**
 * Get a default set of WFS parameters
 *
 * @return {!QueryData}
 */
export const getDefaultWfsParams = function() {
  var params = new QueryData();
  params.setIgnoreCase(true);
  params.set('service', 'WFS');
  params.set('version', '1.1.0');
  params.set('request', 'GetFeature');
  params.set('srsname', 'EPSG:4326');
  params.set('outputformat', 'application/json');
  return params;
};

/**
 * Get the WFS params for an OGC descriptor.
 * @param {IOGCDescriptor} descriptor The descriptor.
 * @return {!QueryData} The params.
 */
export const getWfsParams = function(descriptor) {
  var params = getDefaultWfsParams();
  if (descriptor) {
    params.set('typename', descriptor.getWfsName());

    // merge custom WFS params
    var customWfsParams = descriptor.getWfsParams();
    if (customWfsParams) {
      params.extend(customWfsParams);
    }

    var namespace = descriptor.getWfsNamespace();
    if (namespace) {
      params.set('namespace', namespace);
    }
  }

  return params;
};

/**
 * Get the maxiumum number of features supported by the application.
 *
 * @param {string=} opt_key Optional settings key
 * @return {number}
 */
export const getMaxFeatures = function(opt_key) {
  if (opt_key) {
    // use the key if provided
    return /** @type {number} */ (Settings.getInstance().get('maxFeatures.' + opt_key, 50000));
  }

  const map = getMapContainer();
  if (map && map.is3DSupported() && map.is3DEnabled()) {
    // try getting it for the 3D renderer
    const renderer = map.getWebGLRenderer();
    if (renderer) {
      return renderer.getMaxFeatureCount();
    }
  }

  // fallback to the safest option
  return /** @type {number} */ (Settings.getInstance().get('maxFeatures.2d', 50000));
};
