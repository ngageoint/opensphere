goog.provide('plugin.cesium.CesiumRenderer');

goog.require('goog.Promise');
goog.require('goog.log');
goog.require('olcs.OLCesium');
goog.require('olcs.core');
goog.require('os.MapEvent');
goog.require('os.webgl.AbstractWebGLRenderer');
goog.require('plugin.cesium');
goog.require('plugin.cesium.Camera');
goog.require('plugin.cesium.TileGridTilingScheme');
goog.require('plugin.cesium.WMSTerrainProvider');
goog.require('plugin.cesium.interaction');
goog.require('plugin.cesium.mixin');
goog.require('plugin.cesium.sync.RootSynchronizer');


/**
 * A WebGL renderer powered by Cesium.
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

          this.registerTerrainProviderType('cesium', Cesium.CesiumTerrainProvider);
          this.registerTerrainProviderType('wms', plugin.cesium.WMSTerrainProvider);

          this.olCesium_ = new olcs.OLCesium({
            cameraClass: plugin.cesium.Camera,
            createSynchronizers: this.createCesiumSynchronizers_.bind(this),
            map: this.map,
            time: plugin.cesium.getJulianDate
          });

          goog.dom.classlist.add(this.olCesium_.canvas_, os.map.WEBGL_CANVAS_CLASS);

          this.olCesium_.setTargetFrameRate(this.targetFrameRate);

          var scene = this.olCesium_.getCesiumScene();

          scene.globe.enableLighting = !!os.settings.get(os.config.DisplaySetting.ENABLE_LIGHTING, false);

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

          // configure Cesium fog
          this.showFog(/** @type {boolean} */ (os.settings.get(os.config.DisplaySetting.FOG_ENABLED, true)));

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
    var cartesian = new Cesium.Cartesian2(pixel[0], pixel[1]);
    var scene = this.olCesium_.getCesiumScene();
    cartesian = scene && scene.camera ? scene.camera.pickEllipsoid(cartesian) : undefined;

    if (cartesian) {
      var cartographic = scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      return [
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude)
      ];
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.getPixelFromCoordinate = function(coordinate) {
  // verify the coordinate is defined and numeric.
  if (this.olCesium_ && coordinate && coordinate.length >= 2 && !isNaN(coordinate[0]) && !isNaN(coordinate[1])) {
    var cartesian = olcs.core.ol4326CoordinateToCesiumCartesian(coordinate);
    cartesian = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.olCesium_.getCesiumScene(), cartesian);

    return cartesian ? [cartesian.x, cartesian.y] : null;
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.forEachFeatureAtPixel = function(pixel, callback, opt_options) {
  // NOTE: The Cesium version does not follow the full spec for forEachFeatureAtPixel. In all of our current
  // calls, we are only concerned with the top feature. Therefore, Scene.pick() is used instead of
  // Scene.drillPick(). If the calling method is attempting to loop over more than the top pixel, the 3D
  // method will fail over to the OpenLayers method.

  if (this.olCesium_) {
    var cartesian = new Cesium.Cartesian2(pixel[0], pixel[1]);
    var picked = /** @type {Cesium.Primitive} */ (this.olCesium_.getCesiumScene().pick(cartesian));
    if (picked && picked.primitive) {
      // convert primitive to feature
      var feature = picked.primitive.olFeature;
      var layer = picked.primitive.olLayer;

      if (feature && layer) {
        var layerFilter = opt_options ? opt_options.layerFilter : undefined;
        if (!layerFilter || layerFilter(layer)) {
          return callback(feature, layer) || null;
        }
      }
    }
  }

  return null;
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
plugin.cesium.CesiumRenderer.prototype.showSunlight = function(value) {
  var scene = this.olCesium_ ? this.olCesium_.getCesiumScene() : undefined;
  if (scene) {
    scene.globe.enableLighting = value;
    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.showTerrain = function(value) {
  if (this.olCesium_) {
    var scene = this.olCesium_.getCesiumScene();
    if (scene) {
      // use the configured provider if terrain is enabled, falling back on the default provider
      var provider = (value ? this.terrainProvider_ : undefined) ||
          plugin.cesium.getDefaultTerrainProvider();

      // only change this if there is a provider to switch to. Cesium will render a blank globe without any terrain
      // provider.
      if (provider) {
        scene.terrainProvider = provider;
      }

      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};


/**
 * Register a new Cesium terrain provider type.
 * @param {string} type The type id.
 * @param {!plugin.cesium.TerrainProviderFn} clazz The terrain provider class.
 * @protected
 */
plugin.cesium.CesiumRenderer.prototype.registerTerrainProviderType = function(type, clazz) {
  type = type.toLowerCase();

  if (type in this.terrainProviderTypes_) {
    goog.log.error(this.log, 'The terrain provider type "' + type + '" already exists!');
    return;
  }

  this.terrainProviderTypes_[type] = clazz;
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.disableTerrain = function() {
  // remove the provider first so it's gone when any active terrain gets updated
  this.removeTerrainProvider_();

  plugin.cesium.CesiumRenderer.base(this, 'disableTerrain');
};


/**
 * @inheritDoc
 */
plugin.cesium.CesiumRenderer.prototype.updateTerrainProvider = function() {
  // clean up existing provider
  this.removeTerrainProvider_();

  if (this.terrainOptions) {
    var terrainType = this.terrainOptions.type;
    var terrainUrl = this.terrainOptions.url;

    if (terrainType && terrainType in this.terrainProviderTypes_ && terrainUrl) {
      // instruct Cesium to trust terrain servers (controlled by app configuration)
      plugin.cesium.addTrustedServer(terrainUrl);

      // create the terrain provider
      this.terrainProvider_ = new this.terrainProviderTypes_[terrainType](this.terrainOptions);
      this.terrainProvider_.errorEvent.addEventListener(this.onTerrainError_, this);
    } else {
      // report any errors in the configuration
      if (!terrainType) {
        goog.log.error(this.log, 'Terrain provider type not configured.');
      } else if (!(terrainType in this.terrainProviderTypes_)) {
        goog.log.error(this.log, 'Unknown terrain provider type: ' + terrainType);
      }

      if (!terrainUrl) {
        goog.log.error(this.log, 'Terrain provider URL not configured.');
      }
    }
  }

  // set the provider in Cesium
  var showTerrain = !!os.settings.get(os.config.DisplaySetting.ENABLE_TERRAIN, false);
  this.showTerrain(showTerrain);
};


/**
 * Clean up the terrain provider.
 * @private
 */
plugin.cesium.CesiumRenderer.prototype.removeTerrainProvider_ = function() {
  if (this.terrainProvider_) {
    this.terrainProvider_.errorEvent.removeEventListener(this.onTerrainError_, this);
    this.terrainProvider_ = undefined;
  }
};


/**
 * Handle error raised from a Cesium terrain provider.
 * @param {Cesium.TileProviderError} error The tile provider error.
 * @private
 */
plugin.cesium.CesiumRenderer.prototype.onTerrainError_ = function(error) {
  // notify the user that terrain will be disabled
  goog.log.error(this.log, 'Terrain provider initialization error: ' + error.message);
  os.alertManager.sendAlert('Terrain provider failed to initialize and will be disabled. Please see the log for ' +
      'more details.', os.alert.AlertEventSeverity.ERROR);

  this.disableTerrain();
};


/**
 * Create the layer synchronizers for olcs.OLCesium instance.
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
