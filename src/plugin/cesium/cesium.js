goog.declareModuleId('plugin.cesium');

import GeometryType from 'ol/src/geom/GeometryType.js';
import {equivalent, get, toLonLat} from 'ol/src/proj.js';
import Tile from 'ol/src/source/Tile.js';
import core from 'ol-cesium/src/olcs/core.js';

import AlertManager from '../../os/alert/alertmanager.js';
import DisplaySetting from '../../os/config/displaysetting.js';
import settings from '../../os/config/settings.js';
import * as osMap from '../../os/map/map.js';
import {TerrainType} from '../../os/map/terrain.js';
import MapContainer from '../../os/mapcontainer.js';
import CrossOrigin from '../../os/net/crossorigin.js';
import * as net from '../../os/net/net.js';
import {ROOT} from '../../os/os.js';
import * as proj from '../../os/proj/proj.js';
import * as utils from '../../os/query/queryutils.js';
import * as osString from '../../os/string/string.js';
import TimelineController from '../../os/time/timelinecontroller.js';
import * as ConfirmUI from '../../os/ui/window/confirm.js';
import {launchConfirmText} from '../../os/ui/window/confirmtext.js';
import ImageryProvider from './imageryprovider.js';

const Promise = goog.require('goog.Promise');
const Uri = goog.require('goog.Uri');
const TrustedResourceUrl = goog.require('goog.html.TrustedResourceUrl');
const jsloader = goog.require('goog.net.jsloader');


/**
 * Constructor for a Cesium terrain provider.
 * @typedef {function(...):!Promise<Cesium.TerrainProvider>}
 */
export let TerrainProviderFn;

/**
 * @enum {string}
 */
export const GeometryInstanceId = {
  ELLIPSOID: 'ellipsoid',
  ELLIPSOID_OUTLINE: 'ellipsoidOutline',
  GEOM: 'geometry',
  GEOM_OUTLINE: 'geometryOutline'
};

/**
 * Cesium setting keys.
 * @enum {string}
 */
export const SettingsKey = {
  ACCESS_TOKEN: 'cesium.accessToken',
  ION_URL: 'cesium.ionUrl',
  LOAD_TIMEOUT: 'cesium.loadTimeout',
  SKYBOX_OPTIONS: 'cesium.skyBoxOptions'
};

/**
 * Identifier for Cesium plugin components
 * @type {string}
 */
export const ID = 'cesium';

/**
 * @type {string}
 */
export const CESIUM_ONLY_LAYER = '3D Layers';

/**
 * Regular expression to match ellipsoid geometry instance id's.
 * @type {RegExp}
 */
export const ELLIPSOID_REGEXP = /ellipsoid/i;

/**
 * Regular expression to match outline geometry instance id's.
 * @type {RegExp}
 */
export const OUTLINE_REGEXP = /outline/i;

/**
 * The maximum Cesium fog density.
 * @type {number}
 */
export const MAX_FOG_DENSITY = 3e-4;

/**
 * The default Cesium fog density, as a percentage of max density.
 * @type {number}
 */
export const DEFAULT_FOG_DENSITY = 0.5;

/**
 * Default URL to use for Ion assets.
 * @type {string}
 */
export const DEFAULT_ION_URL = 'https://assets.cesium.com/';

/**
 * Default timeout for loading Cesium. Override by setting `cesium.loadTimeout` in the app configuration.
 * @type {number}
 */
export const DEFAULT_LOAD_TIMEOUT = 30000;

/**
 * URL to use for Ion assets. Override to change/disable Ion service integration.
 * @type {string}
 */
let ionUrl = '';

/**
 * Get the URL to use for Ion assets.
 * @return {string}
 */
export const getIonUrl = () => ionUrl;

/**
 * Set the URL to use for Ion assets.
 * @param {string} value The URL.
 */
export const setIonUrl = (value) => {
  ionUrl = value;
};

/**
 * @define {string} Base path to the Cesium library, from the OpenSphere root.
 */
export const LIBRARY_BASE_PATH = goog.define('plugin.cesium.LIBRARY_BASE_PATH', 'vendor/cesium');

/**
 * Add a trusted server to Cesium.
 *
 * @param {string|undefined} url The server URL.
 */
export const addTrustedServer = function(url) {
  if (url && net.getCrossOrigin(url) === CrossOrigin.USE_CREDENTIALS) {
    // add URL to Cesium.TrustedServers
    var uri = new Uri(url);
    var port = uri.getPort();
    if (!port) {
      var scheme = uri.getScheme();
      if (!scheme) {
        var local = new Uri(window.location);
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
export const isIonEnabled = function() {
  return !!ionUrl;
};

/**
 * Load the Cesium library.
 *
 * @return {!(Promise|Deferred)} A promise that resolves when Cesium has been loaded.
 */
export const loadCesium = function() {
  if (window.Cesium === undefined) {
    // tell Cesium where to find its resources
    var cesiumPath = ROOT + LIBRARY_BASE_PATH;
    window['CESIUM_BASE_URL'] = cesiumPath;

    // load Cesium
    var cesiumUrl = cesiumPath + '/Cesium.js';
    var trustedUrl = TrustedResourceUrl.fromConstant(osString.createConstant(cesiumUrl));

    // extend default timeout (5 seconds) for slow connections and debugging with unminified version
    var timeout = /** @type {number} */ (settings.getInstance().get(SettingsKey.LOAD_TIMEOUT,
        DEFAULT_LOAD_TIMEOUT));
    return jsloader.safeLoad(trustedUrl, {
      timeout: timeout
    });
  }

  return Promise.resolve();
};

/**
 * Prompt the user to provide an access token.
 *
 * @return {!Promise<string>}
 */
export const promptForAccessToken = function() {
  return new Promise(function(resolve, reject) {
    launchConfirmText(/** @type {!osx.window.ConfirmTextOptions} */ ({
      confirm: (accessToken) => {
        settings.getInstance().set(SettingsKey.ACCESS_TOKEN, accessToken);
        resolve(accessToken);
      },
      cancel: reject,
      defaultValue: '',
      limit: 2000,
      select: true,
      prompt: `
        This layer is provided by <a href="https://cesium.com/platform/cesium-ion/" target="_blank">Cesium Ion</a>
        and requires an access token to use. Please provide a Cesium Ion access token, or click Cancel to remove the
        layer.
        <br><br>
        If you do not have a Cesium Ion account, you can
        <a href="https://cesium.com/ion/" target="_blank">create one here</a>. Once logged in, click on Access Tokens >
        Default Token. Copy the token and paste it below:
      `,
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        icon: 'fa fa-warning',
        label: 'Access Token Required',
        modal: true,
        width: 410
      })
    }));
  });
};

/**
 * The default Cesium terrain provider.
 * @type {Cesium.EllipsoidTerrainProvider|undefined}
 */
let defaultTerrainProvider_ = undefined;

/**
 * Get the default Cesium terrain provider.
 *
 * @return {Cesium.EllipsoidTerrainProvider|undefined}
 */
export const getDefaultTerrainProvider = function() {
  // lazy init so Cesium isn't invoked by requiring this file
  if (!defaultTerrainProvider_ && window.Cesium !== undefined) {
    defaultTerrainProvider_ = new Cesium.EllipsoidTerrainProvider();
  }

  return defaultTerrainProvider_;
};

/**
 * Get the default SkyBox using Cesium's assets.
 *
 * @return {!Cesium.SkyBoxOptions}
 */
export const getDefaultSkyBoxOptions = function() {
  var baseUrl = ROOT + LIBRARY_BASE_PATH + '/Assets/Textures/SkyBox/';
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
 */
let julianDate = undefined;

/**
 * Gets the Julian date from the timeline current date.
 *
 * @return {Cesium.JulianDate} The Julian date of the application.
 */
export const getJulianDate = function() {
  julianDate = Cesium.JulianDate.fromDate(new Date(TimelineController.getInstance().getCurrent()), julianDate);
  return julianDate;
};

/**
 * Stolen from cesiums EllipseOutlineGeometry. Build our own polygon to display in polylines instead of a polygon
 * This was done to support more than 1px line width in windows
 *
 * @param {!Cesium.Cartesian3} center
 * @param {number} radius
 * @return {Array<Cesium.Cartesian3>}
 */
export const generateCirclePositions = function(center, radius) {
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
    var pos = flatpos.splice(0, 3);
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
export const rectangleToExtent = function(rectangle) {
  return rectangle ? [
    Cesium.Math.toDegrees(rectangle.west),
    Cesium.Math.toDegrees(rectangle.south),
    Cesium.Math.toDegrees(rectangle.east),
    Cesium.Math.toDegrees(rectangle.north)
  ] : undefined;
};

/**
 * Creates Cesium.ImageryLayer best corresponding to the given ol.layer.Layer. Only supports raster layers.
 * This replaces {@link core.tileLayerToImageryLayer} to use our custom provider supporting tile load counts.
 *
 * @param {!Layer} olLayer
 * @param {?Projection} viewProj Projection of the view.
 * @return {?Cesium.ImageryLayer} null if not possible (or supported)
 */
export const tileLayerToImageryLayer = function(olLayer, viewProj) {
  var source = olLayer.getSource();
  var provider = null;

  if (source instanceof Tile) {
    var projection = source.getProjection();

    if (!projection) {
      // if not explicit, assume the same projection as view
      projection = viewProj;
    }

    var is3857 = equivalent(projection, get(proj.EPSG3857));
    var is4326 = equivalent(projection, get(proj.EPSG4326));
    if (is3857 || is4326) {
      provider = new ImageryProvider(source, olLayer, viewProj);
    } else {
      return null;
    }
  } else {
    // sources other than Tile are currently not supported
    return null;
  }

  // the provider is always non-null if we got this far

  var layerOptions = {};

  var ext = olLayer.getExtent();
  if (ext != null && viewProj !== null) {
    layerOptions.rectangle = core.extentToRectangle(ext, viewProj);
  }

  var cesiumLayer = new Cesium.ImageryLayer(provider, layerOptions);
  return cesiumLayer;
};

/**
 * Synchronizes the layer rendering properties (opacity, visible) to the given Cesium ImageryLayer.
 *
 * @param {!LayerBase} olLayer
 * @param {!Cesium.ImageryLayer} csLayer
 */
export const updateCesiumLayerProperties = function(olLayer, csLayer) {
  // call the ol3-cesium function first
  core.updateCesiumLayerProperties(/** @type {olcsx.LayerWithParents} */ ({
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
 * @return {!Promise<!Cesium.CesiumTerrainProvider>}
 */
export const createCesiumTerrain = function(options) {
  return Promise.resolve(new Cesium.CesiumTerrainProvider(options));
};

/**
 * Create a Cesium World Terrain instance.
 *
 * @param {Cesium.WorldTerrainOptions} options The Cesium World Terrain options.
 * @return {!Promise<!Cesium.CesiumTerrainProvider>}
 */
export const createWorldTerrain = function(options) {
  var assetId = options.assetId != null ? options.assetId : 1;
  var accessToken = options.accessToken || /** @type {string|undefined} */ (
    settings.getInstance().get(SettingsKey.ACCESS_TOKEN));

  if (!accessToken) {
    return promptForAccessToken().then((accessToken) => {
      return createWorldTerrain_(assetId, accessToken);
    });
  } else {
    return Promise.resolve(createWorldTerrain_(assetId, accessToken));
  }
};

/**
 * Create a Cesium Ion resource URL.
 *
 * @param {number} assetId The Ion asset id.
 * @param {string} accessToken The Ion access token.
 * @return {Cesium.Promise}
 */
export const createIonAssetUrl = function(assetId, accessToken) {
  const assetUrl = Cesium.IonResource.fromAssetId(assetId, {
    accessToken
  });

  assetUrl.then(undefined, () => {
    // If the token matches the one in settings, clear it because it's invalid.
    if (accessToken === settings.getInstance().get(SettingsKey.ACCESS_TOKEN)) {
      settings.getInstance().set(SettingsKey.ACCESS_TOKEN, '');
    }

    const am = AlertManager.getInstance();
    am.sendAlert('The provided Cesium Ion access token is invalid. Please reload the resource and try again.');
  });

  return assetUrl;
};

/**
 * Create a Cesium World Terrain instance.
 *
 * @param {number} assetId The Cesium World Terrain asset id.
 * @param {string} accessToken The Cesium World Terrain access token.
 * @return {!Cesium.CesiumTerrainProvider}
 *
 */
const createWorldTerrain_ = function(assetId, accessToken) {
  return new Cesium.CesiumTerrainProvider({
    url: createIonAssetUrl(assetId, accessToken)
  });
};

/**
 * Prompt the user to activate Cesium World Terrain.
 * @param {string} prompt The message to display.
 */
export const promptForWorldTerrain = function(prompt) {
  if (!isWorldTerrainActive() && hasWorldTerrain()) {
    ConfirmUI.launchConfirm(/** @type {!osx.window.ConfirmTextOptions} */ ({
      confirm: enableWorldTerrain,
      defaultValue: '',
      select: true,
      prompt,
      yesText: 'Yes',
      noText: 'No',
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        label: 'Activate Cesium World Terrain',
        modal: true
      })
    }));
  }
};

/**
 * If Cesium World Terrain is the active terrain provider.
 * @return {boolean}
 */
export const isWorldTerrainActive = function() {
  const terrainActive = settings.getInstance().get(DisplaySetting.ENABLE_TERRAIN);
  if (terrainActive) {
    const map = MapContainer.getInstance();
    const renderer = map.getWebGLRenderer();
    if (renderer) {
      const activeProvider = renderer.getActiveTerrainProvider();
      return activeProvider != null && activeProvider.type === TerrainType.ION;
    }
  }

  return false;
};

/**
 * If Cesium World Terrain is available.
 * @return {boolean}
 */
export const hasWorldTerrain = function() {
  const map = MapContainer.getInstance();
  const renderer = map.getWebGLRenderer();
  if (renderer) {
    const providers = renderer.getSupportedTerrainProviders();
    return providers.some((p) => p.type === TerrainType.ION);
  }

  return false;
};

/**
 * Enable the Cesium World Terrain provider, if configured.
 */
export const enableWorldTerrain = function() {
  const map = MapContainer.getInstance();
  const renderer = map.getWebGLRenderer();
  if (renderer) {
    const supported = renderer.getSupportedTerrainProviders();
    const worldTerrain = supported.find((p) => p.type === TerrainType.ION);
    if (worldTerrain) {
      renderer.setActiveTerrainProvider(worldTerrain);
      settings.getInstance().set(DisplaySetting.ENABLE_TERRAIN, true);
    }
  }
};

/**
 * @type {?Cesium.Cartesian3}
 */
let scratchCartesian_ = null;

/**
 * @type {?Cesium.BoundingSphere}
 */
let scratchSphere_ = null;

/**
 * @type {ol.Coordinate}
 */
let scratchCoord_ = [];

/**
 * @param {Cesium.BoundingSphere} sphere
 * @param {?Geometry|undefined} geom
 * @return {Cesium.BoundingSphere}
 */
export const reduceBoundingSphere = function(sphere, geom) {
  if (geom) {
    var type = geom.getType();
    var scratchSphere = scratchSphere_;

    if (utils.isWorldQuery(geom)) {
      if (scratchSphere) {
        scratchSphere.center = Cesium.Cartesian3.UNIT_X;
        scratchSphere.radius = 6378137;
      } else {
        scratchSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.UNIT_X, 6378137);
      }

      return scratchSphere;
    }

    if (type === GeometryType.GEOMETRY_COLLECTION) {
      var geoms = /** @type {GeometryCollection} */ (geom).getGeometriesArray();
      sphere = geoms.reduce(reduceBoundingSphere, sphere);
    } else {
      geom = /** @type {SimpleGeometry} */ (geom);
      var flats = geom.getFlatCoordinates();
      var stride = geom.getStride();
      var scratchCartesian = scratchCartesian_ || new Cesium.Cartesian3();
      var scratchCoord = scratchCoord_;

      for (var i = 0, n = flats.length; i < n; i += stride) {
        scratchCoord[0] = flats[i];
        scratchCoord[1] = flats[i + 1];
        scratchCoord[2] = stride > 2 ? flats[i + 2] || 0 : 0;

        if (!equivalent(osMap.PROJECTION, get(proj.EPSG4326))) {
          scratchCoord = toLonLat(scratchCoord, osMap.PROJECTION);
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

      scratchCartesian_ = scratchCartesian;
      scratchCoord_ = scratchCoord;
      scratchSphere_ = scratchSphere;
    }
  }

  return sphere;
};
