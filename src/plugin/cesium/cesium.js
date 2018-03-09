goog.provide('plugin.cesium');

goog.require('goog.Promise');
goog.require('goog.Uri');
goog.require('goog.html.TrustedResourceUrl');
goog.require('goog.net.jsloader');
goog.require('os.string');


/**
 * Constructor for a Cesium terrain provider.
 * @typedef {function(new: Cesium.TerrainProvider, ...)}
 */
plugin.cesium.TerrainProviderFn;


/**
 * The maximum Cesium fog density.
 * @type {number}
 * @const
 */
plugin.cesium.MAX_FOG_DENSITY = 3e-4;


/**
 * The default Cesium fog density.
 * @type {number}
 * @const
 */
plugin.cesium.DEFAULT_FOG_DENSITY = plugin.cesium.MAX_FOG_DENSITY / 2;


/**
 * Default timeout for loading Cesium. Override by setting `cesium.loadTimeout` in the app configuration.
 * @type {number}
 * @const
 */
plugin.cesium.DEFAULT_LOAD_TIMEOUT = 30000;


/**
 * @define {string} Base path to the Cesium library, from the OpenSphere root.
 */
goog.define('plugin.cesium.LIBRARY_BASE_PATH', 'vendor/cesium');


/**
 * Add a trusted server to Cesium.
 * @param {string|undefined} url The server URL.
 */
plugin.cesium.addTrustedServer = function(url) {
  if (url && os.net.getCrossOrigin(url) === os.net.CrossOrigin.USE_CREDENTIALS) {
    // add URL to Cesium.TrustedServers
    var uri = new goog.Uri(url);
    var port = uri.getPort();
    if (!port) {
      var scheme = uri.getScheme();
      if (!scheme) {
        var local = new goog.Uri(window.location);
        scheme = local.getScheme();
      }

      port = scheme === 'https' ? 443 : scheme === 'http' ? 80 : port;
    }

    if (port) {
      Cesium.TrustedServers.add(uri.getDomain(), port);
    }
  }
};


/**
 * Load the Cesium library.
 * @return {!(goog.Promise|goog.async.Deferred)} A promise that resolves when Cesium has been loaded.
 */
plugin.cesium.loadCesium = function() {
  if (window.Cesium === undefined) {
    // tell Cesium where to find its resources
    var cesiumPath = os.ROOT + plugin.cesium.LIBRARY_BASE_PATH;
    window['CESIUM_BASE_URL'] = cesiumPath;

    // load Cesium
    var cesiumUrl = cesiumPath + '/Cesium.js';
    var trustedUrl = goog.html.TrustedResourceUrl.fromConstant(os.string.createConstant(cesiumUrl));

    // extend default timeout (5 seconds) for slow connections and debugging with unminified version
    var timeout = /** @type {number} */ (os.settings.get('cesium.loadTimeout', plugin.cesium.DEFAULT_LOAD_TIMEOUT));
    return goog.net.jsloader.safeLoad(trustedUrl, {
      timeout: timeout
    });
  }

  return goog.Promise.resolve();
};


/**
 * The default Cesium terrain provider.
 * @type {Cesium.EllipsoidTerrainProvider|undefined}
 * @private
 */
plugin.cesium.defaultTerrainProvider_ = undefined;


/**
 * Get the default Cesium terrain provider.
 * @return {Cesium.EllipsoidTerrainProvider|undefined}
 */
plugin.cesium.getDefaultTerrainProvider = function() {
  // lazy init so Cesium isn't invoked by requiring this file
  if (!plugin.cesium.defaultTerrainProvider_ && window.Cesium !== undefined) {
    plugin.cesium.defaultTerrainProvider_ = new Cesium.EllipsoidTerrainProvider();
  }

  return plugin.cesium.defaultTerrainProvider_;
};


/**
 * The Cesium Julian date object.
 * @type {Cesium.JulianDate|undefined}
 * @private
 */
plugin.cesium.julianDate_ = undefined;


/**
 * Gets the Julian date from the timeline current date.
 * @return {Cesium.JulianDate} The Julian date of the application.
 */
plugin.cesium.getJulianDate = function() {
  plugin.cesium.julianDate_ = Cesium.JulianDate.fromDate(new Date(
    os.time.TimelineController.getInstance().getCurrent()
  ), plugin.cesium.julianDate_);
  return plugin.cesium.julianDate_;
};
