goog.provide('os.ogc');
goog.provide('os.ogc.LayerType');
goog.provide('os.ogc.WFSTypeConfig');

goog.require('goog.Uri.QueryData');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.config.Settings');
goog.require('os.file.mime.text');


/**
 * Identifier used by OGC data model.
 * @type {string}
 * @const
 */
os.ogc.ID = 'ogc';


/**
 * Default projection to use for OGC requests.
 * @type {string}
 */
os.ogc.defaultProjection = 'EPSG:4326';


/**
 * @enum {string}
 */
os.ogc.LayerType = {
  WFS: 'wfs',
  WMS: 'wms',
  WMTS: 'wmts',
  WPS: 'wps'
};


/**
 * Regular expressions to detect OGC GetCapabilities root elements.
 * @enum {RegExp}
 */
os.ogc.GetCapsRootRegexp = {
  WMS: /^WM(T_M)?S_Capabilities$/i,
  WMTS: /^Capabilities$/i,
  WFS: /^WFS_Capabilities$/i
};


/**
 * The default tile style object.
 * @type {!osx.ogc.TileStyle}
 * @const
 */
os.ogc.DEFAULT_TILE_STYLE = /** @type {!osx.ogc.TileStyle} */ ({
  label: 'Default',
  data: ''
});


/**
 * Regular expression to detect tile styles that support changing the tile color.
 * @type {RegExp}
 * @const
 */
os.ogc.COLOR_STYLE_REGEX = /(density)|(foreground color)/i;


/**
 * Regular expression to detect an OGC error response.
 * @type {RegExp}
 * @const
 */
os.ogc.ERROR_REGEX = /(ExceptionText|ServiceException)/i;


/**
 * Typedef describing available WFS format types (GML, GeoJSON, etc.)
 * @typedef {{
 *   type: !string,
 *   regex: !RegExp,
 *   parser: !string,
 *   priority: !number,
 *   responseType: (string|undefined)
 * }}
 */
os.ogc.WFSTypeConfig;


/**
 * A validator function for requests which checks for OGC exceptions
 *
 * @param {ArrayBuffer|string} response The response.
 * @param {?string=} opt_contentType The content type of the response, if available.
 * @param {Array<number>=} opt_codes Response codes, if available.
 * @return {?string} An error message if one was found, or null if the response is OK
 */
os.ogc.getException = function(response, opt_contentType, opt_codes) {
  try {
    // Try to parse the response as XML and determine if it appears to be an OGC exception report.
    if (response && (!opt_contentType || opt_contentType.indexOf('/xml') != -1)) {
      const strResponse = typeof response === 'string' ? response : os.file.mime.text.getText(response);
      if (strResponse && os.ogc.ERROR_REGEX.test(strResponse)) {
        const doc = goog.dom.xml.loadXml(strResponse);
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
os.ogc.getDefaultWfsOptions = function() {
  return {
    'load': true,
    'spatial': true,
    'temporal': true,
    'exclusions': false, // TODO: make this true after supporting exclusion areas
    'filter': true,
    'usePost': true,
    'params': os.ogc.getDefaultWfsParams()
  };
};


/**
 * Get a default set of WFS parameters
 *
 * @return {!goog.Uri.QueryData}
 */
os.ogc.getDefaultWfsParams = function() {
  var params = new goog.Uri.QueryData();
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
 * @param {os.ui.ogc.IOGCDescriptor} descriptor The descriptor.
 * @return {!goog.Uri.QueryData} The params.
 */
os.ogc.getWfsParams = function(descriptor) {
  var params = os.ogc.getDefaultWfsParams();
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
os.ogc.getMaxFeatures = function(opt_key) {
  if (opt_key) {
    // use the key if provided
    return /** @type {number} */ (os.settings.get('maxFeatures.' + opt_key, 50000));
  }

  if (os.MapContainer) {
    const map = os.MapContainer.getInstance();
    if (map && map.is3DSupported() && map.is3DEnabled()) {
      // try getting it for the 3D renderer
      const renderer = map.getWebGLRenderer();
      if (renderer) {
        return renderer.getMaxFeatureCount();
      }
    }
  }

  // fallback to the safest option
  return /** @type {number} */ (os.settings.get('maxFeatures.2d', 50000));
};
