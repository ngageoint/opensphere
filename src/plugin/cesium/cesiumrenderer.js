goog.provide('plugin.cesium.CesiumRenderer');

goog.require('goog.Promise');
goog.require('goog.log');
goog.require('olcs.OLCesium');
goog.require('olcs.core');
goog.require('os.MapEvent');
goog.require('os.webgl.AbstractWebGLRenderer');
goog.require('plugin.cesium');
goog.require('plugin.cesium.Camera');
goog.require('plugin.cesium.TerrainLayer');
goog.require('plugin.cesium.TileGridTilingScheme');
goog.require('plugin.cesium.command.FlyToSphere');
goog.require('plugin.cesium.interaction');
goog.require('plugin.cesium.mixin');
goog.require('plugin.cesium.sync.RootSynchronizer');


/**
 * A WebGL renderer powered by Cesium.
 *
 * @extends {os.webgl.AbstractWebGLRenderer}
 * @constructor
 */
plugin.cesium.CesiumRenderer = function() {
  plugin.cesium.CesiumRenderer.base(this, 'constructor');
  this.log = plugin.cesium.CesiumRenderer.LOGGER_;

  /**
   * The Openlayers/Cesium synchronizer.
   * @type {olcs.OLCesium|undefined}
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
   * @type {plugin.cesium.TerrainLayer|undefined}
   * @private
   */
  this.terrainLayer_ = undefined;

  /**
   * Cesium terrain provider.
   * @type {Cesium.TerrainProvider|undefined}
   * @private
   */
  this.terrainProvider_ = undefined;

  /**
   * Map of terrain provider types.
   * @type {!Object<string, !plugin.cesium.TerrainProviderFn>}
   * @private
   */
  this.terrainProviderTypes_ = {};
};
goog.inherits(plugin.cesium.CesiumRenderer, os.webgl.AbstractWebGLRenderer);


/**
 * The logger.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.cesium.CesiumRenderer.LOGGER_ = goog.log.getLogger('plugin.cesium.CesiumRenderer');


/**
 * Get the Cesium scene object.
 *
 * @return {Cesium.Scene|undefined}
 */
plugin.cesium.CesiumRenderer.prototype.getCesiumScene = function() {
  return this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.isInitialized = function() {
  return !!this.olCesium_;
};


/**
 * @inheritDoc
 * @suppress {accessControls|checkTypes}
 */
plugin.cesium.CesiumRenderer.prototype.initialize = function() {
  if (!this.olCesium_ && this.map) {
    return new goog.Promise(function(resolve, reject) {
      plugin.cesium.loadCesium().then(function() {
        try {
          plugin.cesium.mixin.loadCesiumMixins();
          plugin.cesium.TileGridTilingScheme.init();

          // initialize interactions that have additional support for Cesium
          plugin.cesium.interaction.loadInteractionMixins();

          this.registerTerrainProviderType('cesium', plugin.cesium.createCesiumTerrain);
          this.registerTerrainProviderType('cesium-ion', plugin.cesium.createWorldTerrain);
          this.registerTerrainProviderType('wms', plugin.cesium.createWMSTerrain);

          this.olCesium_ = new olcs.OLCesium({
            cameraClass: plugin.cesium.Camera,
            createSynchronizers: this.createCesiumSynchronizers_.bind(this),
            map: this.map,
            time: plugin.cesium.getJulianDate
          });

          goog.dom.classlist.add(this.olCesium_.canvas_, os.map.WEBGL_CANVAS_CLASS);

          this.olCesium_.setTargetFrameRate(this.targetFrameRate);

          var scene = this.olCesium_.getCesiumScene();

          // Our users are more interested in color accuracy with the underlying imagery rather than attempting
          // to mimic atmospheric lighting effects
          scene.globe.showGroundAtmosphere = false;
          scene.highDynamicRange = false;

          // set the FOV to 60 degrees to match Google Earth
          scene.camera.frustum.fov = Cesium.Math.PI_OVER_THREE;

          // update the globe base color from application settings
          var bgColor = /** @type {string} */ (os.settings.get(['bgColor'], '#000000'));
          scene.globe.baseColor = Cesium.Color.fromCssColorString(bgColor);

          // only render 25% of the terrain data to improve performance. terrain data is typically much denser than
          // necessary to render a quality terrain model.
          //
          // reduce the quality further in Firefox since it is not as fast
          Cesium.TerrainProvider.heightmapTerrainQuality = goog.userAgent.GECKO ? 0.05 : 0.25;
          this.updateTerrainProvider();

          // configure WebGL features
          this.showFog(!!os.settings.get(os.config.DisplaySetting.FOG_ENABLED, true));
          this.showSunlight(!!os.settings.get(os.config.DisplaySetting.ENABLE_LIGHTING, false));
          this.showSky(!!os.settings.get(os.config.DisplaySetting.ENABLE_SKY, false));

          // legacy code saved density as the Cesium fog density value. now it is saved as a percentage from 0-1. if
          // the settings value is non-zero (no fog) and less than 5% (not allowed by our UI), reset it to the default.
          var density = /** @type {number} */ (os.settings.get(os.config.DisplaySetting.FOG_DENSITY,
              plugin.cesium.DEFAULT_FOG_DENSITY));
          if (density != 0 && density < 0.05) {
            density = plugin.cesium.DEFAULT_FOG_DENSITY;
          }

          this.setFogDensity(density);

          // create our camera handler
          var camera = this.olCesium_.camera_ = new plugin.cesium.Camera(scene, this.map);

          // configure camera interactions. do not move this before the camera is created!
          plugin.cesium.interaction.configureCesium(camera, scene.screenSpaceCameraController);

          // only render the scene when something changes
          this.olCesium_.enableAutoRenderLoop();

          // call the parent function last to ensure Cesium init succeeded
          os.webgl.AbstractWebGLRenderer.prototype.initialize.call(this);
          resolve();
        } catch (e) {
          goog.log.error(this.log, 'Failed to create 3D view!', e);
          reject();
        }
      }, reject, this);
    }, this);
  }

  return goog.Promise.resolve();
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.setEnabled = function(value) {
  plugin.cesium.CesiumRenderer.base(this, 'setEnabled', value);

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
  }
};


/**
 * @inheritDoc
 * @suppress {checkTypes}
 */
plugin.cesium.CesiumRenderer.prototype.getCamera = function() {
  return this.olCesium_ ? /** @type {plugin.cesium.Camera} */ (this.olCesium_.getCamera()) : undefined;
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.getCoordinateFromPixel = function(pixel) {
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
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.getPixelFromCoordinate = function(coordinate, opt_inView) {
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
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.forEachFeatureAtPixel = function(pixel, callback, opt_options) {
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

  return null;
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.onPostRender = function(callback) {
  if (this.olCesium_) {
    var scene = this.olCesium_.getCesiumScene();
    if (scene) {
      return scene.postRender.addEventListener(callback);
    }
  }

  return undefined;
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.renderSync = function() {
  if (this.olCesium_) {
    var scene = this.olCesium_.getCesiumScene();
    if (scene) {
      scene.initializeFrame();
      scene.forceRender(plugin.cesium.getJulianDate());
    }
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.toggleMovement = function(value) {
  if (this.olCesium_) {
    var scene = this.olCesium_.getCesiumScene();
    if (scene && scene.screenSpaceCameraController) {
      scene.screenSpaceCameraController.enableInputs = value;
    }
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.setBGColor = function(value) {
  if (this.olCesium_) {
    this.olCesium_.getCesiumScene().globe.baseColor = Cesium.Color.fromCssColorString(value);
    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.showFog = function(value) {
  var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
  if (scene && scene.fog.enabled != value) {
    scene.fog.enabled = value;
    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.setFogDensity = function(value) {
  var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
  if (scene) {
    // density value should be between 0 (no fog) and the maximum density allowed by the application
    var newDensity = goog.math.clamp(value * plugin.cesium.MAX_FOG_DENSITY, 0, plugin.cesium.MAX_FOG_DENSITY);
    if (scene.fog.density != newDensity) {
      scene.fog.density = newDensity;
    }
    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.showSky = function(value) {
  var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
  if (scene) {
    if (!scene.skyBox && value) {
      var skyBoxOptions = /** @type {Cesium.SkyBoxOptions|undefined} */ (os.settings.get(
          plugin.cesium.SettingsKey.SKYBOX_OPTIONS));
      if (!skyBoxOptions) {
        skyBoxOptions = plugin.cesium.getDefaultSkyBoxOptions();
      }

      scene.skyBox = new Cesium.SkyBox(skyBoxOptions);
    }

    if (scene.skyBox) {
      scene.skyBox.show = value;
    }

    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.showSunlight = function(value) {
  var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
  if (scene) {
    if (!scene.sun) {
      scene.sun = new Cesium.Sun();
    }

    scene.sun.show = value;
    scene.globe.enableLighting = value;

    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.showTerrain = function(value) {
  if (value) {
    if (!this.terrainLayer_) {
      this.terrainLayer_ = new plugin.cesium.TerrainLayer(this.terrainProvider_);
      os.MapContainer.getInstance().addLayer(this.terrainLayer_);
    } else {
      this.terrainLayer_.setTerrainProvider(this.terrainProvider_);
    }
  } else {
    this.removeTerrainLayer_();
  }

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * Register a new Cesium terrain provider type.
 *
 * @param {string} type The type id.
 * @param {!plugin.cesium.TerrainProviderFn} factory Factory function to create a terrain provider instance.
 * @protected
 */
plugin.cesium.CesiumRenderer.prototype.registerTerrainProviderType = function(type, factory) {
  type = type.toLowerCase();

  if (type in this.terrainProviderTypes_) {
    goog.log.error(this.log, 'The terrain provider type "' + type + '" already exists!');
    return;
  }

  this.terrainProviderTypes_[type] = factory;
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.disableTerrain = function() {
  // remove the provider first so it's gone when any active terrain gets updated
  this.removeTerrainLayer_();

  plugin.cesium.CesiumRenderer.base(this, 'disableTerrain');
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.updateTerrainProvider = function() {
  // clean up existing layer
  this.removeTerrainLayer_();

  var terrainOptions = /** @type {osx.map.TerrainProviderOptions|undefined} */ (os.settings.get(
      os.config.DisplaySetting.TERRAIN_OPTIONS));
  if (terrainOptions) {
    var terrainType = terrainOptions.type;
    if (terrainType && terrainType in this.terrainProviderTypes_) {
      if (terrainOptions.url) {
        // instruct Cesium to trust terrain servers (controlled by app configuration)
        plugin.cesium.addTrustedServer(terrainOptions.url);
      }

      this.terrainProvider_ = this.terrainProviderTypes_[terrainType](terrainOptions);
    } else if (!terrainType) {
      goog.log.error(this.log, 'Terrain provider type not configured.');
    } else if (!(terrainType in this.terrainProviderTypes_)) {
      goog.log.error(this.log, 'Unknown terrain provider type: ' + terrainType);
    }
  }

  // set the provider in Cesium
  var showTerrain = !!os.settings.get(os.config.DisplaySetting.ENABLE_TERRAIN, false);
  this.showTerrain(showTerrain);
};


/**
 * Clean up the terrain layer.
 *
 * @private
 */
plugin.cesium.CesiumRenderer.prototype.removeTerrainLayer_ = function() {
  if (this.terrainLayer_) {
    os.MapContainer.getInstance().removeLayer(this.terrainLayer_);

    goog.dispose(this.terrainLayer_);
    this.terrainLayer_ = undefined;
  }

  var provider = plugin.cesium.getDefaultTerrainProvider();
  if (provider) {
    var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
    if (scene) {
      scene.terrainProvider = provider;
    }
  }
};


/**
 * Create the layer synchronizers for olcs.OLCesium instance.
 *
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @return {Array<olcs.AbstractSynchronizer>}
 * @private
 */
plugin.cesium.CesiumRenderer.prototype.createCesiumSynchronizers_ = function(map, scene) {
  if (!this.rootSynchronizer) {
    this.rootSynchronizer = new plugin.cesium.sync.RootSynchronizer(map, scene);
  }

  return [this.rootSynchronizer];
};


/**
 * Handles Cesium camera move start/end events.
 *
 * @param {boolean} isMoving If the camera is moving.
 * @private
 */
plugin.cesium.CesiumRenderer.prototype.onCesiumCameraMoveChange_ = function(isMoving) {
  if (this.map) {
    // fool proof this to ensure we only increment/decrement by 1
    var view = this.map.getView();
    if (isMoving && !this.cesiumMoving_) {
      this.cesiumMoving_ = true;
      view.setHint(ol.ViewHint.INTERACTING, 1);
    } else if (!isMoving && this.cesiumMoving_) {
      this.cesiumMoving_ = false;
      view.setHint(ol.ViewHint.INTERACTING, -1);

      if (this.rootSynchronizer) {
        this.rootSynchronizer.updateFromCamera();
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.getAltitudeModes = function() {
  return [
    os.webgl.AltitudeMode.CLAMP_TO_GROUND,
    os.webgl.AltitudeMode.ABSOLUTE,
    os.webgl.AltitudeMode.RELATIVE_TO_GROUND
  ];
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.flyToFeatures = function(features) {
  var sphere = os.feature.getGeometries(features).reduce(plugin.cesium.reduceBoundingSphere, null);

  if (sphere) {
    var cmd = new plugin.cesium.command.FlyToSphere(sphere);
    os.commandStack.addCommand(cmd);
  }
};
