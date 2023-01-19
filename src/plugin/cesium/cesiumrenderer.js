goog.declareModuleId('plugin.cesium.CesiumRenderer');

import ViewHint from 'ol/src/ViewHint.js';
import OLCesium from 'ol-cesium/src/olcs/OLCesium.js';

import CommandProcessor from '../../os/command/commandprocessor.js';
import DisplaySetting from '../../os/config/displaysetting.js';
import settings from '../../os/config/settings.js';
import * as dispatcher from '../../os/dispatcher.js';
import {getGeometries} from '../../os/feature/feature.js';
import SynchronizerType from '../../os/layer/synchronizertype.js';
import {WEBGL_CANVAS_CLASS} from '../../os/map/map.js';
import MapEvent from '../../os/map/mapevent.js';
import * as terrain from '../../os/map/terrain.js';
import MapContainer from '../../os/mapcontainer.js';
import AbstractWebGLRenderer from '../../os/webgl/abstractwebglrenderer.js';
import AltitudeMode from '../../os/webgl/altitudemode.js';
import SynchronizerManager from '../../os/webgl/synchronizermanager.js';
import HeatmapSynchronizerType from '../heatmap/heatmapsynchronizertype.js';
import {
  DEFAULT_FOG_DENSITY,
  ID,
  MAX_FOG_DENSITY,
  SettingsKey,
  addTrustedServer,
  createCesiumTerrain,
  createWorldTerrain,
  getDefaultSkyBoxOptions,
  getDefaultTerrainProvider,
  getJulianDate,
  loadCesium,
  reduceBoundingSphere
} from './cesium.js';
import Camera from './cesiumcamera.js';
import {importSetup} from './cesiummenu.js';
import FlyToSphere from './command/flytospherecmd.js';
import {configureCesium, loadInteractionMixins} from './interaction/cesiuminteraction.js';
import {load as loadCesiumMixins} from './mixin/cesiummixin.js';
import HeatmapSynchronizer from './sync/heatmapsynchronizer.js';
import ImageStaticSynchronizer from './sync/imagestaticsynchronizer.js';
import ImageSynchronizer from './sync/imagesynchronizer.js';
import RootSynchronizer from './sync/rootsynchronizer.js';
import TileSynchronizer from './sync/tilesynchronizer.js';
import VectorSynchronizer from './sync/vectorsynchronizer.js';
import TerrainLayer from './terrainlayer.js';
import WMSTerrainProvider from './wmsterrainprovider.js';

const Promise = goog.require('goog.Promise');
const dispose = goog.require('goog.dispose');
const classlist = goog.require('goog.dom.classlist');
const log = goog.require('goog.log');
const {clamp} = goog.require('goog.math');
const userAgent = goog.require('goog.userAgent');


/**
 * The logger.
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.cesium.CesiumRenderer');


/**
 * A WebGL renderer powered by Cesium.
 */
export default class CesiumRenderer extends AbstractWebGLRenderer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
    this.maxFeaturesKey = 'maxFeatures.cesium';

    this.id = ID;
    this.label = 'Cesium';
    this.description = 'Cesium is a 3D globe renderer for general use.';

    /**
     * The Openlayers/Cesium synchronizer.
     * @type {OLCesium|undefined}
     * @private
     */
    this.olCesium_ = undefined;

    /**
     * Flag to double check Cesium Camera movement events
     * @type {boolean}
     * @private
     */
    this.cesiumMoving_ = false;

    /**
     * Cesium event listeners
     * @type {!Array<function()>}
     * @private
     */
    this.csListeners_ = [];

    /**
     * OpenLayers layer to sync Cesium terrain.
     * @type {TerrainLayer|undefined}
     * @private
     */
    this.terrainLayer_ = undefined;

    /**
     * Promise that resolves when terrain has been activated.
     * @type {Promise|undefined}
     * @private
     */
    this.terrainPromise_ = undefined;

    /**
     * Cesium terrain provider.
     * @type {Cesium.TerrainProvider|undefined}
     * @private
     */
    this.terrainProvider_ = undefined;

    /**
     * Map of terrain provider types.
     * @type {!Object<string, !TerrainProviderFn>}
     * @private
     */
    this.terrainProviderTypes_ = {};
  }

  /**
   * Get the Cesium scene object.
   *
   * @return {Cesium.Scene|undefined}
   */
  getCesiumScene() {
    return this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
  }

  /**
   * @inheritDoc
   */
  isInitialized() {
    return !!this.olCesium_;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  initialize() {
    if (!this.olCesium_ && this.map) {
      const mapInstance = /** @type {!OLMap} */ (this.map);
      return new Promise((resolve, reject) => {
        loadCesium().then(() => {
          try {
            // register the default set of synchronizers
            var sm = SynchronizerManager.getInstance();
            sm.registerSynchronizer(SynchronizerType.VECTOR, VectorSynchronizer);
            sm.registerSynchronizer(SynchronizerType.VECTOR_TILE, TileSynchronizer);
            sm.registerSynchronizer(SynchronizerType.TILE, TileSynchronizer);
            sm.registerSynchronizer(SynchronizerType.IMAGE, ImageSynchronizer);
            sm.registerSynchronizer(SynchronizerType.DRAW, VectorSynchronizer);
            sm.registerSynchronizer(SynchronizerType.IMAGE_STATIC, ImageStaticSynchronizer);
            sm.registerSynchronizer(HeatmapSynchronizerType.HEATMAP, HeatmapSynchronizer);

            // set up menus
            importSetup();

            loadCesiumMixins();

            // initialize interactions that have additional support for Cesium
            loadInteractionMixins();

            this.registerTerrainProviderType(terrain.TerrainType.CESIUM, createCesiumTerrain);
            this.registerTerrainProviderType(terrain.TerrainType.ION, createWorldTerrain);
            this.registerTerrainProviderType(terrain.TerrainType.WMS, WMSTerrainProvider.create);

            // OLCesium just appends the globe to the end of the viewport child list, causing zoom controls to be
            // hidden by globe when globe is visible.
            const globeContainer = document.createElement('DIV');
            globeContainer.id = 'globe-container';
            const targetElement = mapInstance.getViewport();
            targetElement.insertBefore(globeContainer, targetElement.children[1]);

            this.olCesium_ = new OLCesium({
              cameraClass: Camera,
              createSynchronizers: this.createCesiumSynchronizers_.bind(this),
              map: mapInstance,
              time: getJulianDate,
              target: globeContainer.id
            });
            this.olCesium_.getCesiumScene()._creditContainer.style.display = 'none';

            classlist.add(this.olCesium_.canvas_, WEBGL_CANVAS_CLASS);

            this.olCesium_.setTargetFrameRate(this.targetFrameRate);

            var scene = this.olCesium_.getCesiumScene();

            // Our users are more interested in color accuracy with the underlying imagery rather than attempting
            // to mimic atmospheric lighting effects
            scene.globe.showGroundAtmosphere = false;
            scene.highDynamicRange = false;

            // set the FOV to 60 degrees to match Google Earth
            scene.camera.frustum.fov = Cesium.Math.PI_OVER_THREE;

            // update the globe base color from application settings
            var bgColor = /** @type {string} */ (settings.getInstance().get(['bgColor'], '#000000'));
            scene.globe.baseColor = Cesium.Color.fromCssColorString(bgColor);

            // only render 25% of the terrain data to improve performance. terrain data is typically much denser than
            // necessary to render a quality terrain model.
            //
            // reduce the quality further in Firefox since it is not as fast
            Cesium.TerrainProvider.heightmapTerrainQuality = userAgent.GECKO ? 0.05 : 0.25;
            this.updateTerrainProvider();

            // configure WebGL features
            this.showFog(!!settings.getInstance().get(DisplaySetting.FOG_ENABLED, true));
            this.showSunlight(!!settings.getInstance().get(DisplaySetting.ENABLE_LIGHTING, false));
            this.showSky(!!settings.getInstance().get(DisplaySetting.ENABLE_SKY, false));

            // legacy code saved density as the Cesium fog density value. now it is saved as a percentage from 0-1. if
            // the settings value is non-zero (no fog) and less than 5% (not allowed by our UI), reset it to the default.
            var density = /** @type {number} */ (settings.getInstance().get(DisplaySetting.FOG_DENSITY,
                DEFAULT_FOG_DENSITY));
            if (density != 0 && density < 0.05) {
              density = DEFAULT_FOG_DENSITY;
            }

            this.setFogDensity(density);

            // create our camera handler
            var camera = this.olCesium_.camera_ = new Camera(scene, mapInstance);

            // configure camera interactions. do not move this before the camera is created!
            configureCesium(camera, scene.screenSpaceCameraController);

            // only render the scene when something changes
            this.olCesium_.enableAutoRenderLoop();

            // call the parent function last to ensure Cesium init succeeded
            super.initialize();
            resolve();
          } catch (e) {
            log.error(this.log, 'Failed to create 3D view!', e);
            reject();
          }
        }, reject, this);
      });
    }

    return Promise.resolve();
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    super.setEnabled(value);

    if (!this.olCesium_) {
      // OLCS was not set up correctly or has been disposed, don't do anything
      return;
    }

    this.olCesium_.setEnabled(value);

    if (value) {
      var scene = this.olCesium_.getCesiumScene();
      if (scene) {
        // add Cesium listeners
        this.csListeners_.push(
            scene.camera.moveStart.addEventListener(this.onCesiumCameraMoveChange_.bind(this, true)));
        this.csListeners_.push(
            scene.camera.moveEnd.addEventListener(this.onCesiumCameraMoveChange_.bind(this, false)));
      }
    } else {
      // remove Cesium listeners
      for (var i = 0, n = this.csListeners_.length; i < n; i++) {
        this.csListeners_[i]();
      }

      this.csListeners_.length = 0;

      // flag as no longer moving to ensure the ViewHint is updated
      this.setCesiumMoving_(false);
    }
  }

  /**
   * @inheritDoc
   */
  getCamera() {
    return this.olCesium_ ? /** @type {Camera} */ (this.olCesium_.getCamera()) : undefined;
  }

  /**
   * @inheritDoc
   */
  getCoordinateFromPixel(pixel) {
    // verify the pixel is valid and numeric. key events in particular can provide NaN pixels.
    if (this.olCesium_ && pixel && pixel.length == 2 && !isNaN(pixel[0]) && !isNaN(pixel[1])) {
      var cartesian = Cesium.Cartesian2.fromArray(pixel);
      var scene = this.olCesium_.getCesiumScene();
      var removeHeight;
      if (scene && scene.camera && scene.globe) {
        // The Cesium team recommends different methods here based on whether terrain is enabled
        // see https://github.com/AnalyticalGraphicsInc/cesium/issues/4368#issuecomment-406639086
        if (!scene.terrainProvider || scene.terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
          // this is the "no terrain" case
          cartesian = scene.camera.pickEllipsoid(cartesian);
          // both the docs and the forums indicate that method should return a height of zero, but
          // it slightly doesn't
          removeHeight = true;
        } else {
          var pickRay = scene.camera.getPickRay(cartesian);
          cartesian = scene.globe.pick(pickRay, scene);
        }

        if (cartesian) {
          var cartographic = scene.globe.ellipsoid.cartesianToCartographic(cartesian);
          if (removeHeight) {
            cartographic.height = 0;
          }
          return [
            Cesium.Math.toDegrees(cartographic.longitude),
            Cesium.Math.toDegrees(cartographic.latitude),
            cartographic.height
          ];
        }
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getPixelFromCoordinate(coordinate, opt_inView) {
    var result = null;

    if (this.olCesium_) {
      var scene = this.olCesium_.getCesiumScene();
      var cartesian = null;

      // verify the coordinate is defined and numeric.
      if (coordinate && coordinate.length >= 2 && !isNaN(coordinate[0]) && !isNaN(coordinate[1])) {
        var height = coordinate[2] || 0;
        cartesian = Cesium.Cartesian3.fromDegrees(coordinate[0], coordinate[1], height);
      }

      if (opt_inView && cartesian && this.olCesium_) {
        var camera = scene.camera;

        // check if coordinate is behind the horizon
        var ellipsoidBoundingSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(), 6356752);
        var occluder = new Cesium.Occluder(ellipsoidBoundingSphere, camera.position);
        if (!occluder.isPointVisible(cartesian)) {
          cartesian = null;
        }

        // check if coordinate is visible from the camera
        var cullingVolume = camera.frustum.computeCullingVolume(camera.position, camera.direction, camera.up);
        if (cullingVolume.computeVisibility(new Cesium.BoundingSphere(cartesian)) !== 1) {
          cartesian = null;
        }
      }

      if (cartesian) {
        var pixelCartesian = scene.cartesianToCanvasCoordinates(cartesian);
        if (pixelCartesian) {
          result = [pixelCartesian.x, pixelCartesian.y];
        }
      }
    }

    return result;
  }

  /**
   * @inheritDoc
   */
  forEachFeatureAtPixel(pixel, callback, opt_options) {
    if (this.olCesium_) {
      var cartesian = new Cesium.Cartesian2(pixel[0], pixel[1]);
      var drillPick = opt_options ? opt_options['drillPick'] : false;
      var scene = this.olCesium_.getCesiumScene();
      var primitives;

      if (drillPick) {
        // drillPick is extremely slow and should only be used in cases where it's needed (such as launching feature
        // info for stacked features)
        primitives = /** @type {Array<Cesium.Primitive>} */ (scene.drillPick(cartesian));
      } else {
        var primitive = /** @type {Cesium.Primitive} */ (scene.pick(cartesian));
        if (primitive) {
          primitives = [primitive];
        }
      }

      if (primitives && primitives.length > 0) {
        for (var i = 0, ii = primitives.length; i < ii; i++) {
          // convert primitive to feature
          var primitive = primitives[i];
          var feature = primitive.primitive.olFeature;
          var layer = primitive.primitive.olLayer;

          if (feature && layer) {
            var layerFilter = opt_options ? opt_options.layerFilter : undefined;
            if (!layerFilter || layerFilter(layer)) {
              var value = callback(feature, layer) || null;
              if (value) {
                return value;
              }
            }
          }
        }
      }
    }

    return undefined;
  }

  /**
   * @inheritDoc
   */
  onPostRender(callback) {
    if (this.olCesium_) {
      var scene = this.olCesium_.getCesiumScene();
      if (scene) {
        return scene.postRender.addEventListener(callback);
      }
    }

    return undefined;
  }

  /**
   * @inheritDoc
   */
  renderSync() {
    if (this.olCesium_) {
      var scene = this.olCesium_.getCesiumScene();
      if (scene) {
        scene.initializeFrame();
        scene.forceRender(getJulianDate());
      }
    }
  }

  /**
   * @inheritDoc
   */
  toggleMovement(value) {
    if (this.olCesium_) {
      var scene = this.olCesium_.getCesiumScene();
      if (scene && scene.screenSpaceCameraController) {
        scene.screenSpaceCameraController.enableInputs = value;
      }
    }
  }

  /**
   * @inheritDoc
   */
  setBGColor(value) {
    if (this.olCesium_) {
      this.olCesium_.getCesiumScene().globe.baseColor = Cesium.Color.fromCssColorString(value);
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * @inheritDoc
   */
  showFog(value) {
    var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
    if (scene && scene.fog.enabled != value) {
      scene.fog.enabled = value;
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * @inheritDoc
   */
  setFogDensity(value) {
    var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
    if (scene) {
      // density value should be between 0 (no fog) and the maximum density allowed by the application
      var newDensity = clamp(value * MAX_FOG_DENSITY, 0, MAX_FOG_DENSITY);
      if (scene.fog.density != newDensity) {
        scene.fog.density = newDensity;
      }
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * @inheritDoc
   */
  showSky(value) {
    var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
    if (scene) {
      if (!scene.skyBox && value) {
        var skyBoxOptions = /** @type {Cesium.SkyBoxOptions|undefined} */ (settings.getInstance().get(
            SettingsKey.SKYBOX_OPTIONS));
        if (!skyBoxOptions) {
          skyBoxOptions = getDefaultSkyBoxOptions();
        }

        scene.skyBox = new Cesium.SkyBox(skyBoxOptions);
      }

      if (scene.skyBox) {
        scene.skyBox.show = value;
      }

      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * @inheritDoc
   */
  showSunlight(value) {
    var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
    if (scene) {
      if (!scene.sun) {
        scene.sun = new Cesium.Sun();
      }

      scene.sun.show = value;
      scene.globe.enableLighting = value;

      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * @inheritDoc
   */
  showTerrain(value) {
    if (value) {
      this.terrainPromise_ = this.createTerrainProvider().then((provider) => {
        this.terrainPromise_ = null;
        this.terrainProvider_ = provider;

        if (!this.terrainLayer_) {
          this.terrainLayer_ = new TerrainLayer(this.terrainProvider_);
          MapContainer.getInstance().addLayer(this.terrainLayer_);
        } else {
          this.terrainLayer_.setTerrainProvider(this.terrainProvider_);
        }
      }, (err) => {
        const errorMessage = typeof err === 'string' ? err : 'Unable to load terrain, disabling.';
        log.error(this.log, errorMessage);

        this.terrainPromise_ = null;
        settings.getInstance().set(DisplaySetting.ENABLE_TERRAIN, false);
      });
    } else {
      if (this.terrainPromise_) {
        this.terrainPromise_.cancel();
        this.terrainPromise_ = null;
      }

      this.removeTerrainLayer_();
    }

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * Register a new Cesium terrain provider type.
   *
   * @param {string} type The type id.
   * @param {!TerrainProviderFn} factory Factory function to create a terrain provider instance.
   * @protected
   */
  registerTerrainProviderType(type, factory) {
    if (type in this.terrainProviderTypes_) {
      log.error(this.log, 'The terrain provider type "' + type + '" already exists!');
      return;
    }

    this.supportedTerrainTypes.push(type);
    this.terrainProviderTypes_[type] = factory;
  }

  /**
   * @inheritDoc
   */
  disableTerrain() {
    // remove the provider first so it's gone when any active terrain gets updated
    this.removeTerrainLayer_();

    super.disableTerrain();
  }

  /**
   * Create a terrain provider instance for the active provider.
   * @return {!Promise<Cesium.TerrainProvider>}
   * @protected
   */
  createTerrainProvider() {
    var terrainOptions = this.getActiveTerrainProvider();
    if (terrainOptions) {
      var terrainType = terrainOptions.type;
      if (terrainType && terrainType in this.terrainProviderTypes_) {
        if (terrainOptions.url) {
          // instruct Cesium to trust terrain servers (controlled by app configuration)
          addTrustedServer(terrainOptions.url);
        }

        return this.terrainProviderTypes_[terrainType](terrainOptions);
      } else if (!terrainType) {
        return Promise.reject('Terrain provider type not configured.');
      } else if (!(terrainType in this.terrainProviderTypes_)) {
        return Promise.reject(`Unknown terrain provider type: ${terrainType}`);
      }
    }

    return Promise.reject('Unable to create terrain provider.');
  }

  /**
   * @inheritDoc
   */
  updateTerrainProvider() {
    // clean up existing layer/provider
    this.removeTerrainLayer_();
    this.terrainProvider_ = undefined;

    // set the provider in Cesium
    var showTerrain = !!settings.getInstance().get(DisplaySetting.ENABLE_TERRAIN, false);
    this.showTerrain(showTerrain);
  }

  /**
   * Clean up the terrain layer.
   *
   * @private
   */
  removeTerrainLayer_() {
    if (this.terrainLayer_) {
      MapContainer.getInstance().removeLayer(this.terrainLayer_);

      dispose(this.terrainLayer_);
      this.terrainLayer_ = undefined;
    }

    var provider = getDefaultTerrainProvider();
    if (provider) {
      var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
      if (scene) {
        scene.terrainProvider = provider;
      }
    }
  }

  /**
   * Create the layer synchronizers for OLCesium instance.
   *
   * @param {!OLMap} map
   * @param {!Cesium.Scene} scene
   * @return {Array<AbstractSynchronizer>}
   * @private
   */
  createCesiumSynchronizers_(map, scene) {
    if (!this.rootSynchronizer) {
      this.rootSynchronizer = new RootSynchronizer(map, scene);
    }

    return [this.rootSynchronizer];
  }

  /**
   * Set if Cesium is currently moving the camera.
   * @param {boolean} value If the camera is moving.
   * @private
   */
  setCesiumMoving_(value) {
    if (this.cesiumMoving_ !== value) {
      this.cesiumMoving_ = value;

      // Update the OpenLayers interacting flag, to disable performance-intensive operations during animation.
      if (this.map) {
        var view = this.map.getView();
        if (view) {
          view.setHint(ViewHint.INTERACTING, value ? 1 : -1);
        }
      }

      // Update synchronizers when the camera stops moving, to update view-based rendering.
      if (!value && this.rootSynchronizer) {
        this.rootSynchronizer.updateFromCamera();
      }
    }
  }

  /**
   * Handles Cesium camera move start/end events.
   *
   * @param {boolean} isMoving If the camera is moving.
   * @private
   */
  onCesiumCameraMoveChange_(isMoving) {
    this.setCesiumMoving_(isMoving);
  }

  /**
   * @inheritDoc
   */
  getAltitudeModes() {
    return [
      AltitudeMode.CLAMP_TO_GROUND,
      AltitudeMode.ABSOLUTE,
      AltitudeMode.RELATIVE_TO_GROUND
    ];
  }

  /**
   * @inheritDoc
   */
  flyToFeatures(features) {
    var sphere = getGeometries(features).reduce(reduceBoundingSphere, null);

    if (sphere) {
      var cmd = new FlyToSphere(sphere);
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }
}
