goog.provide('os.ogc');

goog.require('goog.Uri.QueryData');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.config.Settings');


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
  WPS: 'wps'
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
 * A validator function for requests which checks for OGC exceptions
 *
 * @param {ArrayBuffer|string} response
 * @param {?string=} opt_contentType
 * @return {?string} An error message if one was found, or null if the response is OK
 */
os.ogc.getException = function(response, opt_contentType) {
  try {
    var isXml = opt_contentType && goog.string.contains(opt_contentType, '/xml');

    // THIN-5464
    // if there are headers and the header is xml and the response is a string try to parse the xml.
    // if no headers and response is a string, just try it and deal with the error in the console in IE and firefox.
    if (isXml || !opt_contentType) {
      var doc = typeof response === 'string' ? goog.dom.xml.loadXml(response) : response;
      var ex = doc.querySelector('ExceptionText, ServiceException');
      if (ex) {
        return ex.textContent;
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
  var key = opt_key || 'maxFeatures';
  return /** @type {number} */ (os.settings.get(key, 50000));
};
