goog.provide('plugin.cesium');

goog.require('goog.Promise');
goog.require('goog.Uri');
goog.require('goog.html.TrustedResourceUrl');
goog.require('goog.net.jsloader');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.source.WMTS');
goog.require('olcs.core');
goog.require('os.net');
goog.require('os.proj');
goog.require('os.string');
goog.require('plugin.cesium.ImageryProvider');


/**
 * Constructor for a Cesium terrain provider.
 * @typedef {function(new: Cesium.TerrainProvider, ...)}
 */
plugin.cesium.TerrainProviderFn;


/**
 * @enum {string}
 */
plugin.cesium.GeometryInstanceId = {
  ELLIPSOID: 'ellipsoid',
  ELLIPSOID_OUTLINE: 'ellipsoidOutline',
  GEOM: 'geometry',
  GEOM_OUTLINE: 'geometryOutline'
};


/**
 * Regular expression to match ellipsoid geometry instance id's.
 * @type {RegExp}
 * @const
 */
plugin.cesium.ELLIPSOID_REGEXP = /ellipsoid/i;


/**
 * Regular expression to match outline geometry instance id's.
 * @type {RegExp}
 * @const
 */
plugin.cesium.OUTLINE_REGEXP = /outline/i;


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


/**
 * Stolen from cesiums RectangleOutlineGeometry. Build our own polygon to display in polylines instead of a polygon
 * This was done to support more than 1px line width in windows
 * @param {ol.Extent} extent
 * @param {number=} opt_altitude
 * @param {boolean=} opt_extrude
 * @return {Array<Cesium.Cartesian3>}
 */
plugin.cesium.generateRectanglePositions = function(extent, opt_altitude, opt_extrude) {
  var rect = Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]);
  var rected = new Cesium.RectangleGeometry({
    ellipsoid: Cesium.Ellipsoid.WGS84,
    rectangle: rect,
    height: opt_altitude ? opt_altitude : 0,
    extrudedHeight: opt_extrude ? 0 : undefined
  });

  // NOTE: The Cesium.RectangleGeometryLibrary.computePosition does NOT use the height parameter :(
  // var geometry = Cesium.RectangleGeometry.createGeometry(rected);

  var options = Cesium.RectangleGeometryLibrary.computeOptions(rected, rect, new Cesium.Cartographic());
  // options.surfaceHeight = opt_altitude ? opt_altitude : 0;
  // options.extrudedHeight = opt_extrude ? 0 : undefined;
  var height = options.height;
  var width = options.width;
  var positions = [];
  var row = 0;
  var col;

  for (col = 0; col < width; col++) {
    var position = new Cesium.Cartesian3();
    Cesium.RectangleGeometryLibrary.computePosition(options, row, col, position);
    positions.push(position);
  }

  col = width - 1;
  for (row = 1; row < height; row++) {
    var position = new Cesium.Cartesian3();
    Cesium.RectangleGeometryLibrary.computePosition(options, row, col, position);
    positions.push(position);
  }

  row = height - 1;
  for (col = width - 2; col >= 0; col--) {
    var position = new Cesium.Cartesian3();
    Cesium.RectangleGeometryLibrary.computePosition(options, row, col, position);
    positions.push(position);
  }

  col = 0;
  for (row = height - 2; row > 0; row--) {
    var position = new Cesium.Cartesian3();
    Cesium.RectangleGeometryLibrary.computePosition(options, row, col, position);
    positions.push(position);
  }

  // Push on the first position to the last to close the polygon
  if (positions.length > 0) {
    positions.push(positions[0]);
  }

  return positions;
};


/**
 * Stolen from cesiums EllipseOutlineGeometry. Build our own polygon to display in polylines instead of a polygon
 * This was done to support more than 1px line width in windows
 * @param {!Cesium.Cartesian3} center
 * @param {number} radius
 * @return {Array<Cesium.Cartesian3>}
 */
plugin.cesium.generateCirclePositions = function(center, radius) {
  var options = {
    'center': center,
    'semiMajorAxis': radius,
    'semiMinorAxis': radius,
    'granularity': Cesium.Math.RADIANS_PER_DEGREE,
    'rotation': 0
    // 'ellipsoid': Cesium.Ellipsoid.WGS84,
    // 'height': 0.0,
    // 'extrudedHeight': undefined,
    // 'numberOfVerticalLines': 0,
    // 'extrude': false
  };

  var flatpos = Cesium.EllipseGeometryLibrary.computeEllipsePositions(options, false, true).outerPositions;

  // Send back a list of positions as we expect them to be.
  var positions = [];
  while (flatpos.length > 0) {
    var pos = goog.array.splice(flatpos, 0, 3);
    var cartPos = new Cesium.Cartesian3(pos[0], pos[1], pos[2]);
    positions.push(cartPos);
  }

  // Push on the first position to the last to close the polygon
  if (positions.length > 0) {
    positions.push(positions[0]);
  }

  // Return an array of cartesians
  return positions;
};


/**
 * Creates Cesium.ImageryLayer best corresponding to the given ol.layer.Layer. Only supports raster layers.
 * This replaces {@link olcs.core.tileLayerToImageryLayer} to use our custom provider supporting tile load counts.
 * @param {!ol.layer.Layer} olLayer
 * @param {?ol.proj.Projection} viewProj Projection of the view.
 * @return {?Cesium.ImageryLayer} null if not possible (or supported)
 */
plugin.cesium.tileLayerToImageryLayer = function(olLayer, viewProj) {
  if (!(olLayer instanceof ol.layer.Tile)) {
    return null;
  }

  var source = olLayer.getSource();
  var provider = null;

  // handle special cases before the general synchronization
  if (source instanceof ol.source.WMTS) {
    // WMTS uses different TileGrid which is not currently supported
    return null;
  }

  if (source instanceof ol.source.TileImage) {
    var projection = source.getProjection();

    if (!projection) {
      // if not explicit, assume the same projection as view
      projection = viewProj;
    }

    var is3857 = projection === ol.proj.get(os.proj.EPSG3857);
    var is4326 = projection === ol.proj.get(os.proj.EPSG4326);
    if (is3857 || is4326) {
      provider = new plugin.cesium.ImageryProvider(source, viewProj);
    } else {
      return null;
    }
  } else {
    // sources other than TileImage are currently not supported
    return null;
  }

  // the provider is always non-null if we got this far

  var layerOptions = {};

  var ext = olLayer.getExtent();
  if (goog.isDefAndNotNull(ext) && !goog.isNull(viewProj)) {
    layerOptions.rectangle = olcs.core.extentToRectangle(ext, viewProj);
  }

  var cesiumLayer = new Cesium.ImageryLayer(provider, layerOptions);
  return cesiumLayer;
};


/**
 * Synchronizes the layer rendering properties (opacity, visible) to the given Cesium ImageryLayer.
 * @param {!ol.layer.Base} olLayer
 * @param {!Cesium.ImageryLayer} csLayer
 */
plugin.cesium.updateCesiumLayerProperties = function(olLayer, csLayer) {
  // call the ol3-cesium function first
  olcs.core.updateCesiumLayerProperties(/** @type {olcsx.LayerWithParents} */ ({
    layer: olLayer,
    parents: []
  }), csLayer);

  // saturation and contrast are working ok
  var saturation = olLayer.getSaturation();
  if (saturation != null) {
    csLayer.saturation = saturation;
  }

  // that little guy? I wouldn't worry about that little guy.
  //
  // if contrast is 1 (default value) and hue is changed from the default (0) on *any* layer, transparent pixels are
  // blacked out.
  var contrast = olLayer.getContrast();
  csLayer.contrast = contrast == null || contrast == 1 ? 1.01 : contrast;

  // Cesium actually operates in YIQ space -> hard to emulate
  // The following values are only a rough approximations:

  // The hue in Cesium has different meaning than the OL equivalent.
  var hue = olLayer.getHue();
  if (hue != null) {
    csLayer.hue = hue * Cesium.Math.RADIANS_PER_DEGREE;
  }

  var brightness = olLayer.getBrightness();
  if (brightness != null) {
    // rough estimation
    csLayer.brightness = Math.pow(1 + parseFloat(brightness), 2);
  }
};
