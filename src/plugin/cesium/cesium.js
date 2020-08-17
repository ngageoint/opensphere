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
goog.require('plugin.cesium.WMSTerrainProvider');


/**
 * Constructor for a Cesium terrain provider.
 * @typedef {function(...):Cesium.TerrainProvider}
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
 * Cesium setting keys.
 * @enum {string}
 */
plugin.cesium.SettingsKey = {
  ACCESS_TOKEN: 'cesium.accessTokens',
  ION_URL: 'cesium.ionUrl',
  LOAD_TIMEOUT: 'cesium.loadTimeout',
  SKYBOX_OPTIONS: 'cesium.skyBoxOptions'
};


/**
 * @type {string}
 * @const
 */
plugin.cesium.CESIUM_ONLY_LAYER = '3D Layers';


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
 * The default Cesium fog density, as a percentage of max density.
 * @type {number}
 * @const
 */
plugin.cesium.DEFAULT_FOG_DENSITY = 0.5;


/**
 * Default URL to use for Ion assets.
 * @type {string}
 * @const
 */
plugin.cesium.DEFAULT_ION_URL = 'https://assets.cesium.com/';


/**
 * Default timeout for loading Cesium. Override by setting `cesium.loadTimeout` in the app configuration.
 * @type {number}
 * @const
 */
plugin.cesium.DEFAULT_LOAD_TIMEOUT = 30000;


/**
 * URL to use for Ion assets. Override to change/disable Ion service integration.
 * @type {string}
 */
plugin.cesium.ionUrl = '';


/**
 * @define {string} Base path to the Cesium library, from the OpenSphere root.
 */
plugin.cesium.LIBRARY_BASE_PATH = goog.define('plugin.cesium.LIBRARY_BASE_PATH', 'vendor/cesium');


/**
 * Add a trusted server to Cesium.
 *
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
 * If Cesium Ion services should be enabled.
 *
 * @return {boolean}
 */
plugin.cesium.isIonEnabled = function() {
  return !!plugin.cesium.ionUrl;
};


/**
 * Load the Cesium library.
 *
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
    var timeout = /** @type {number} */ (os.settings.get(plugin.cesium.SettingsKey.LOAD_TIMEOUT,
        plugin.cesium.DEFAULT_LOAD_TIMEOUT));
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
 *
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
 * Get the default SkyBox using Cesium's assets.
 *
 * @return {!Cesium.SkyBoxOptions}
 */
plugin.cesium.getDefaultSkyBoxOptions = function() {
  var baseUrl = os.ROOT + plugin.cesium.LIBRARY_BASE_PATH + '/Assets/Textures/SkyBox/';
  return /** @type {!Cesium.SkyBoxOptions} */ ({
    sources: {
      positiveX: baseUrl + 'tycho2t3_80_px.jpg',
      negativeX: baseUrl + 'tycho2t3_80_mx.jpg',
      positiveY: baseUrl + 'tycho2t3_80_py.jpg',
      negativeY: baseUrl + 'tycho2t3_80_my.jpg',
      positiveZ: baseUrl + 'tycho2t3_80_pz.jpg',
      negativeZ: baseUrl + 'tycho2t3_80_mz.jpg'
    }
  });
};


/**
 * The Cesium Julian date object.
 * @type {Cesium.JulianDate|undefined}
 * @private
 */
plugin.cesium.julianDate_ = undefined;


/**
 * Gets the Julian date from the timeline current date.
 *
 * @return {Cesium.JulianDate} The Julian date of the application.
 */
plugin.cesium.getJulianDate = function() {
  plugin.cesium.julianDate_ = Cesium.JulianDate.fromDate(new Date(
      os.time.TimelineController.getInstance().getCurrent()
  ), plugin.cesium.julianDate_);
  return plugin.cesium.julianDate_;
};


/**
 * Stolen from cesiums EllipseOutlineGeometry. Build our own polygon to display in polylines instead of a polygon
 * This was done to support more than 1px line width in windows
 *
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
 * Convert a Cesium rectangle to an OpenLayers extent, in degrees.
 *
 * @param {Cesium.Rectangle} rectangle The rectangle.
 * @return {ol.Extent|undefined}
 */
plugin.cesium.rectangleToExtent = function(rectangle) {
  return rectangle ? [
    Cesium.Math.toDegrees(rectangle.west),
    Cesium.Math.toDegrees(rectangle.south),
    Cesium.Math.toDegrees(rectangle.east),
    Cesium.Math.toDegrees(rectangle.north)
  ] : undefined;
};


/**
 * Creates Cesium.ImageryLayer best corresponding to the given ol.layer.Layer. Only supports raster layers.
 * This replaces {@link olcs.core.tileLayerToImageryLayer} to use our custom provider supporting tile load counts.
 *
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

  if (source instanceof ol.source.TileImage) {
    var projection = source.getProjection();

    if (!projection) {
      // if not explicit, assume the same projection as view
      projection = viewProj;
    }

    var is3857 = ol.proj.equivalent(projection, ol.proj.get(os.proj.EPSG3857));
    var is4326 = ol.proj.equivalent(projection, ol.proj.get(os.proj.EPSG4326));
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
  if (ext != null && viewProj !== null) {
    layerOptions.rectangle = olcs.core.extentToRectangle(ext, viewProj);
  }

  var cesiumLayer = new Cesium.ImageryLayer(provider, layerOptions);
  return cesiumLayer;
};


/**
 * Synchronizes the layer rendering properties (opacity, visible) to the given Cesium ImageryLayer.
 *
 * @param {!ol.layer.Base} olLayer
 * @param {!Cesium.ImageryLayer} csLayer
 */
plugin.cesium.updateCesiumLayerProperties = function(olLayer, csLayer) {
  // call the ol3-cesium function first
  olcs.core.updateCesiumLayerProperties(/** @type {olcsx.LayerWithParents} */ ({
    layer: olLayer,
    parents: []
  }), csLayer);

  // that little guy? I wouldn't worry about that little guy.

  // Cesium actually operates in YIQ space -> hard to emulate
  // The following values are only a rough approximations:

  // The hue in Cesium has different meaning than the OL equivalent.
  var hue = olLayer.getHue();
  if (hue != null) {
    csLayer.hue = hue * Cesium.Math.RADIANS_PER_DEGREE;
  }
};


/**
 * Create a Cesium terrain provider instance.
 *
 * @param {Cesium.CesiumTerrainProviderOptions} options The Cesium terrain options.
 * @return {!Cesium.CesiumTerrainProvider}
 */
plugin.cesium.createCesiumTerrain = function(options) {
  return new Cesium.CesiumTerrainProvider(options);
};


/**
 * Create a Cesium World Terrain instance.
 *
 * @param {Cesium.WorldTerrainOptions} options The Cesium World Terrain options.
 * @return {!Cesium.CesiumTerrainProvider}
 */
plugin.cesium.createWorldTerrain = function(options) {
  var assetId = options.assetId != null ? options.assetId : 1;
  return plugin.cesium.createCesiumTerrain({
    url: Cesium.IonResource.fromAssetId(assetId, {
      accessToken: options.accessToken
    })
  });
};


/**
 * Create a Cesium WMS terrain provider instance.
 *
 * @param {!osx.cesium.WMSTerrainProviderOptions} options The WMS terrain options.
 * @return {!plugin.cesium.WMSTerrainProvider}
 */
plugin.cesium.createWMSTerrain = function(options) {
  return new plugin.cesium.WMSTerrainProvider(options);
};



/**
 * @type {?Cesium.Cartesian3}
 * @private
 */
plugin.cesium.scratchCartesian_ = null;


/**
 * @type {?Cesium.BoundingSphere}
 * @private
 */
plugin.cesium.scratchSphere_ = null;


/**
 * @type {ol.Coordinate}
 * @private
 */
plugin.cesium.scratchCoord_ = [];


/**
 * @param {Cesium.BoundingSphere} sphere
 * @param {?ol.geom.Geometry|undefined} geom
 * @return {Cesium.BoundingSphere}
 */
plugin.cesium.reduceBoundingSphere = function(sphere, geom) {
  if (geom) {
    var type = geom.getType();
    var scratchSphere = plugin.cesium.scratchSphere_;

    if (os.query.isWorldQuery(geom)) {
      if (scratchSphere) {
        scratchSphere.center = Cesium.Cartesian3.UNIT_X;
        scratchSphere.radius = 6378137;
      } else {
        scratchSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.UNIT_X, 6378137);
      }

      return scratchSphere;
    }

    if (type === ol.geom.GeometryType.GEOMETRY_COLLECTION) {
      var geoms = /** @type {ol.geom.GeometryCollection} */ (geom).getGeometriesArray();
      sphere = geoms.reduce(plugin.cesium.reduceBoundingSphere, sphere);
    } else {
      geom = /** @type {ol.geom.SimpleGeometry} */ (geom);
      var flats = geom.getFlatCoordinates();
      var stride = geom.getStride();
      var scratchCartesian = plugin.cesium.scratchCartesian_ || new Cesium.Cartesian3();
      var scratchCoord = plugin.cesium.scratchCoord_;

      for (var i = 0, n = flats.length; i < n; i += stride) {
        scratchCoord[0] = flats[i];
        scratchCoord[1] = flats[i + 1];
        scratchCoord[2] = stride > 2 ? flats[i + 2] || 0 : 0;

        if (!ol.proj.equivalent(os.map.PROJECTION, ol.proj.get(os.proj.EPSG4326))) {
          scratchCoord = ol.proj.toLonLat(scratchCoord, os.map.PROJECTION);
        }

        scratchCartesian = Cesium.Cartesian3.fromDegrees(
            scratchCoord[0], scratchCoord[1], scratchCoord[2], undefined, scratchCartesian);

        if (!scratchSphere) {
          scratchSphere = new Cesium.BoundingSphere(scratchCartesian);
        } else {
          scratchSphere.center = scratchCartesian;
        }

        sphere = !sphere ? scratchSphere.clone() : Cesium.BoundingSphere.union(scratchSphere, sphere, sphere);
      }

      plugin.cesium.scratchCoord_ = scratchCoord;
      plugin.cesium.scratchSphere = scratchSphere;
    }
  }

  return sphere;
};
