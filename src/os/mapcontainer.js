goog.provide('os.MapContainer');

goog.require('goog.Promise');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.ConditionalDelay');
goog.require('goog.async.Delay');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.dom.animationFrame.polyfill');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.Collection');
goog.require('ol.Feature');
goog.require('ol.MapEventType');
goog.require('ol.ObjectEventType');
goog.require('ol.View');
goog.require('ol.ViewHint');
goog.require('ol.easing');
goog.require('ol.events');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.renderer.Type');
goog.require('ol.source.Vector');
goog.require('ol.tilegrid');
goog.require('os.Map');
goog.require('os.MapChange');
goog.require('os.MapEvent');
goog.require('os.MapMode');
goog.require('os.action.EventType');
goog.require('os.command.FlyToExtent');
goog.require('os.command.LayerRemove');
goog.require('os.command.ToggleWebGL');
goog.require('os.config');
goog.require('os.config.DisplaySetting');
goog.require('os.control.ZoomLevel');
goog.require('os.data.DeactivateDescriptor');
goog.require('os.data.ZOrder');
goog.require('os.defines');
goog.require('os.events');
goog.require('os.events.LayerEvent');
goog.require('os.events.LayerEventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.extent');
goog.require('os.fn');
goog.require('os.geo');
goog.require('os.instanceOf');
goog.require('os.interpolate');
goog.require('os.layer.AnimatedTile');
goog.require('os.layer.Drawing');
goog.require('os.layer.Group');
goog.require('os.layer.ILayer');
goog.require('os.layer.LayerType');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.map.FlightMode');
goog.require('os.map.IMapContainer');
goog.require('os.metrics');
goog.require('os.metrics.Metrics');
goog.require('os.object');
goog.require('os.ogc');
goog.require('os.ol.control.MousePosition');
goog.require('os.ol.feature');
goog.require('os.proj');
goog.require('os.proj.switch');
goog.require('os.query');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('os.style.StyleType');
goog.require('os.style.label');
goog.require('os.ui.GlobalMenuCtrl');
goog.require('os.ui.action.ActionEvent');
goog.require('os.ui.help.Controls');
goog.require('os.ui.help.webGLPerfCaveatDirective');
goog.require('os.ui.help.webGLSupportDirective');
goog.require('os.ui.window');
goog.require('os.ui.window.ConfirmUI');
goog.require('os.webgl');
goog.require('plugin.position.copyPositionDirective');



/**
 * Wrapper for the Openlayers map.
 *
 * @implements {os.map.IMapContainer}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.MapContainer = function() {
  os.MapContainer.base(this, 'constructor');

  /**
   * The Openlayers map.
   * @type {os.Map}
   * @private
   */
  this.map_ = null;

  /**
   * The WebGL map/globe renderer.
   * @type {os.webgl.IWebGLRenderer|undefined}
   * @private
   */
  this.webGLRenderer_ = undefined;

  /**
   * The available WebGL map/globe renderers.
   * @type {Object<string, os.webgl.IWebGLRenderer>}
   * @private
   */
  this.webGLRenderers_ = {};

  /**
   * If the WebGL renderer is initializing. Disables toggling the view.
   * @type {boolean}
   * @private
   */
  this.initializingWebGL_ = false;

  /**
   * @type {boolean|undefined}
   * @private
   */
  this.is3DSupported_ = undefined;

  /**
   * @type {boolean|undefined|null}
   * @private
   */
  this.hasPerformanceCaveat_ = undefined;

  /**
   * Defers updating of labels until the zoom hasn't changed in a timeout period.
   * @type {goog.async.Delay}
   * @private
   */
  this.viewChangeDelay_ = new goog.async.Delay(this.handleViewChange_, 500, this);

  /**
   * A delay used to wait until the view is ready before restoring the camera state.
   * @type {goog.async.ConditionalDelay}
   * @private
   */
  this.restoreCameraDelay_ = null;

  /**
   * Drawing layer for query regions.
   * @type {os.layer.Vector}
   * @private
   */
  this.drawingLayer_ = null;

  /**
   * @type {?function():ol.Collection}
   * @private
   */
  this.controlFunction_ = null;

  /**
   * @type {?function():ol.Collection}
   * @private
   */
  this.interactionFunction_ = null;

  /**
   * @type {goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.vsm_ = new goog.dom.ViewportSizeMonitor();

  /**
   * @type {boolean}
   * @private
   */
  this.overrideFailIfMajorPerformanceCaveat_ = false;

  os.dispatcher.listen(os.ui.action.EventType.ZOOM, this.onZoom_, false, this);

  os.dispatcher.listen(os.action.EventType.RESET_VIEW, this.resetView, false, this);
  os.dispatcher.listen(os.action.EventType.RESET_ROTATION, this.resetRotation, false, this);
  os.dispatcher.listen(os.action.EventType.TOGGLE_VIEW, this.onToggleView_, false, this);

  os.dispatcher.listen(os.events.LayerEventType.REMOVE, this.onRemoveLayerEvent_, false, this);

  os.dispatcher.listen(os.MapEvent.RENDER, this.render, false, this);
  os.dispatcher.listen(os.MapEvent.RENDER_SYNC, this.renderSync, false, this);

  os.settings.listen(os.config.DisplaySetting.BG_COLOR, this.onSettingChange_, false, this);
};
goog.inherits(os.MapContainer, goog.events.EventTarget);
goog.addSingletonGetter(os.MapContainer);


// install the requestAnimationFrame polyfill
goog.dom.animationFrame.polyfill.install();


/**
 * The ID for the drawing layer
 * @type {string}
 * @const
 */
os.MapContainer.DRAW_ID = os.layer.Drawing.ID;


/**
 * The map target element id.
 * @type {string}
 * @const
 */
os.MapContainer.TARGET = 'map-container';


/**
 * @type {number}
 * @const
 */
os.MapContainer.FLY_ZOOM_DURATION = 1000;


/**
 * @type {number}
 * @private
 * @const
 */
os.MapContainer.FLY_ZOOM_BUFFER_ = 0.025;


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.MapContainer.LOGGER_ = goog.log.getLogger('os.MapContainer');


/**
 * @inheritDoc
 */
os.MapContainer.prototype.disposeInternal = function() {
  goog.dispose(this.vsm_);
  this.vsm_ = null;

  goog.dispose(this.viewChangeDelay_);
  this.viewChangeDelay_ = null;

  goog.dispose(this.restoreCameraDelay_);
  this.restoreCameraDelay_ = null;

  if (this.map_) {
    var view = this.map_.getView();
    if (view) {
      ol.events.unlisten(view, ol.ObjectEventType.PROPERTYCHANGE, this.onViewChange_, this);
    }

    this.map_.dispose();
    this.map_ = null;
  }

  os.dispatcher.unlisten(os.ui.action.EventType.ZOOM, this.onZoom_, false, this);

  os.dispatcher.unlisten(os.action.EventType.RESET_VIEW, this.resetView, false, this);
  os.dispatcher.unlisten(os.action.EventType.RESET_ROTATION, this.resetRotation, false, this);
  os.dispatcher.unlisten(os.action.EventType.TOGGLE_VIEW, this.onToggleView_, false, this);

  os.dispatcher.unlisten(os.events.LayerEventType.REMOVE, this.onRemoveLayerEvent_, false, this);

  os.dispatcher.unlisten(os.MapEvent.RENDER, this.render, false, this);
  os.dispatcher.unlisten(os.MapEvent.RENDER_SYNC, this.renderSync, false, this);

  os.settings.unlisten(os.config.DisplaySetting.BG_COLOR, this.onSettingChange_, false, this);

  os.MapContainer.base(this, 'disposeInternal');
};


/**
 * Get the active WebGL renderer.
 *
 * @return {os.webgl.IWebGLRenderer|undefined}
 */
os.MapContainer.prototype.getWebGLRenderer = function() {
  return this.webGLRenderer_;
};


/**
 * Get the available WebGL renderers.
 *
 * @return {Object<string, os.webgl.IWebGLRenderer>}
 */
os.MapContainer.prototype.getWebGLRenderers = function() {
  return this.webGLRenderers_;
};


/**
 * Add a WebGL renderer
 *
 * @param {os.webgl.IWebGLRenderer|undefined} renderer
 */
os.MapContainer.prototype.addWebGLRenderer = function(renderer) {
  if (renderer) {
    this.webGLRenderers_[renderer.getId() || os.string.randomString()] = renderer;
  }
};


/**
 * Set the active WebGL renderer.
 *
 * @param {os.webgl.IWebGLRenderer|undefined} value The new renderer.
 */
os.MapContainer.prototype.setWebGLRenderer = function(value) {
  this.addWebGLRenderer(value);

  if (this.webGLRenderer_) {
    if (this.webGLRenderer_.isInitialized()) {
      // do not allow replacing the WebGL renderer once it has been initialized, because it may make changes to
      // interactions and other application behavior that will affect the new renderer.
      goog.log.error(os.MapContainer.LOGGER_, 'A WebGL renderer has already been set and initialized on the map.');
      return;
    }

    this.webGLRenderer_.setMap(undefined);
  }

  this.webGLRenderer_ = value;
  if (value && value.id) {
    os.settings.set(os.webgl.AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY, value.id);
  }

  if (this.webGLRenderer_) {
    this.webGLRenderer_.setMap(this.map_);
  }
};


/**
 * Get the WebGL camera.
 *
 * @return {os.webgl.IWebGLCamera|undefined}
 */
os.MapContainer.prototype.getWebGLCamera = function() {
  return this.webGLRenderer_ ? this.webGLRenderer_.getCamera() : undefined;
};


/**
 * Handle changes to map settings.
 *
 * @param {!os.events.SettingChangeEvent} event
 * @private
 */
os.MapContainer.prototype.onSettingChange_ = function(event) {
  switch (event.type) {
    case os.config.DisplaySetting.BG_COLOR:
      var color = /** @type {string} */ (event.newVal);
      if (os.color.isColorString(color)) {
        this.setBGColor(color);
      }
      break;
    default:
      break;
  }
};


/**
 * Get the extent of the current view.
 *
 * @return {ol.Extent}
 */
os.MapContainer.prototype.getViewExtent = function() {
  return this.map_ ? this.map_.getExtent() : ol.extent.createEmpty();
};


/**
 * Handle changes to the view resolution. This happens a lot during user interaction, so defer handling until the view
 * settles.
 *
 * @param {ol.Object.Event} event
 * @private
 */
os.MapContainer.prototype.onViewChange_ = function(event) {
  this.viewChangeDelay_.start();
};


/**
 * Perform actions in response to view changes. This is called on a delay and will not fire until the view stops
 * changing.
 *
 * @private
 */
os.MapContainer.prototype.handleViewChange_ = function() {
  var cameraMode = /** @type {string|undefined} */ (os.settings.get(os.config.DisplaySetting.CAMERA_MODE));
  if (cameraMode == os.CameraMode.LAST) {
    try {
      var cameraState = this.persistCameraState();
      os.settings.set(os.config.DisplaySetting.CAMERA_STATE, cameraState);
    } catch (e) {
      goog.log.error(os.MapContainer.LOGGER_, 'Error persisting camera state:', e);
    }
  }

  os.style.label.updateShown();
  this.dispatchEvent(os.MapEvent.VIEW_CHANGE);
};


/**
 * Render the map.
 */
os.MapContainer.prototype.render = function() {
  var map = this.getMap();
  if (map) {
    map.render();
  }
};


/**
 * Synchronously render the map.
 */
os.MapContainer.prototype.renderSync = function() {
  var map = this.getMap();
  if (map) {
    map.renderSync();
  }
};


/**
 * Adds/removes a feature to the skip list based on its visibility.
 *
 * @param {ol.Feature} feature
 * @param {boolean} visible
 */
os.MapContainer.prototype.updateFeatureVisibility = function(feature, visible) {
  if (this.map_) {
    if (visible) {
      this.map_.unskipFeature(feature);
    } else {
      this.map_.skipFeature(feature);
    }
  }
};


/**
 * This will cause the canvas to resize itself and take up the correct amount of space. The size is first set to 0 so
 * when ol.Map#updateSize is called it will take up the remaining space in the window after other content is laid out.
 */
os.MapContainer.prototype.updateSize = function() {
  if (this.map_) {
    // wait for the map to finish rendering with 0 size, then update the size to the correct value
    ol.events.listenOnce(this.map_, ol.MapEventType.POSTRENDER, function() {
      var map = this.map_;
      os.ui.waitForAngular(function() {
        map.updateSize();
        os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
      });
    }, this);

    this.map_.setSize([0, 0]);
    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * @return {os.Map}
 * @override
 */
os.MapContainer.prototype.getMap = function() {
  return this.map_;
};


/**
 * Set the map view.
 *
 * @param {ol.View} view The view
 */
os.MapContainer.prototype.setView = function(view) {
  if (this.map_) {
    var oldView = this.map_.getView();
    if (oldView) {
      ol.events.unlisten(oldView, ol.ObjectEventType.PROPERTYCHANGE, this.onViewChange_, this);
    }

    this.map_.setView(view);

    if (view) {
      ol.events.listen(view, ol.ObjectEventType.PROPERTYCHANGE, this.onViewChange_, this);
    }
  }
};


/**
 * Whether or not the given value is a tile layer.
 *
 * @param {*} layer The value to test.
 * @return {boolean}
 */
os.MapContainer.isTileLayer = function(layer) {
  return layer instanceof ol.layer.Tile;
};


/**
 * Whether or not the given value is a vector layer.
 *
 * @param {*} layer The value to test.
 * @return {boolean}
 */
os.MapContainer.isVectorLayer = function(layer) {
  return layer instanceof ol.layer.Vector && !os.MapContainer.isImageLayer(layer);
};


/**
 * Whether or not the given value is an image layer.
 *
 * @param {*} layer The value to test.
 * @return {boolean}
 */
os.MapContainer.isImageLayer = function(layer) {
  return layer instanceof ol.layer.Image ||
      (layer instanceof os.layer.Vector && layer.getOSType() === os.layer.LayerType.IMAGE);
};


/**
 * Cancels the current camera flight if one is in progress. The camera is left at it's current location.
 */
os.MapContainer.prototype.cancelFlight = function() {
  if (this.is3DEnabled()) {
    var camera = this.getWebGLCamera();
    if (camera) {
      camera.cancelFlight();
    }
  } else {
    var map = this.getMap();
    var view = map ? map.getView() : undefined;
    if (view) {
      view.cancelAnimations();
    }
  }
};


/**
 * Flies to the provided coordinate/zoom level.
 *
 * @param {!osx.map.FlyToOptions} options The fly to options.
 */
os.MapContainer.prototype.flyTo = function(options) {
  var map = this.getMap();
  if (map) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.FLY_TO, 1);
    var view = map.getView();
    goog.asserts.assert(view);

    var center = options.destination || options.center || view.getCenter();
    var duration = options.duration || os.MapContainer.FLY_ZOOM_DURATION;

    if (this.is3DEnabled()) {
      var camera = this.getWebGLCamera();
      if (camera) {
        // favor altitude over zoom in 3D mode
        if (options.altitude === undefined && options.zoom !== undefined) {
          options.altitude = camera.calcDistanceForResolution(this.zoomToResolution(options.zoom),
              ol.math.toRadians(center[1]));
          delete options.zoom;
        }

        camera.flyTo(options);
      }
    } else {
      var animateOptions = /** @type {!olx.AnimationOptions} */ ({
        center: center,
        duration: duration
      });

      if (options.zoom !== undefined) {
        // prioritize zoom in 2D mode
        animateOptions.zoom = goog.math.clamp(options.zoom, os.map.MIN_ZOOM, os.map.MAX_ZOOM);
      } else if (!options.positionCamera && options.range !== undefined) {
        // telling the camera where to look, so a range will generally be specified
        var resolution = os.map.resolutionForDistance(this.getMap(), options.range, 0);
        animateOptions.resolution = goog.math.clamp(resolution, os.map.MIN_RESOLUTION, os.map.MAX_RESOLUTION);
      } else if (options.altitude !== undefined) {
        // try altitude last, because it will generally be 0 if positioning the camera
        var resolution = os.map.resolutionForDistance(this.getMap(), options.altitude, 0);
        animateOptions.resolution = goog.math.clamp(resolution, os.map.MIN_RESOLUTION, os.map.MAX_RESOLUTION);
      }

      // 'bounce' uses default easing, 'smooth' uses linear.
      if (options.flightMode === os.map.FlightMode.SMOOTH) {
        animateOptions.easing = ol.easing.linear;
      }

      view.animate(animateOptions);
    }
  }
};


/**
 * Fits the view to an extent.
 *
 * @param {ol.Extent} extent The extent to fit
 * @param {number=} opt_buffer Scale factor for the extent to provide a buffer around the displayed area
 * @param {number=} opt_maxZoom The maximum zoom level for the updated view
 */
os.MapContainer.prototype.flyToExtent = function(extent, opt_buffer, opt_maxZoom) {
  if (extent && extent.indexOf(Infinity) != -1 || extent.indexOf(-Infinity) != -1) {
    goog.log.fine(os.MapContainer.LOGGER_, 'Attempted to fly to infinite extent.');
    return;
  }

  var map = this.getMap();
  if (map) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.FLY_TO_EXTENT, 1);
    var view = map.getView();
    goog.asserts.assert(view != null);

    if (extent) {
      // clone the extent before modifying it to avoid potentially adverse affects
      extent = extent.slice();

      if (opt_buffer && opt_buffer > 0) {
        ol.extent.scaleFromCenter(extent, opt_buffer);
      } else {
        // THIN-6449: prevent flying to excessive zoom levels if a buffer wasn't provided. if one was provided,
        // assume the caller knows what they are doing.
        var buffer = os.MapContainer.FLY_ZOOM_BUFFER_;
        if (ol.extent.getWidth(extent) < buffer && ol.extent.getHeight(extent) < buffer) {
          extent = ol.extent.buffer(extent, buffer);
        }
      }

      if (!this.is3DEnabled()) {
        // In 2D views, projections supporting wrapping can pan "multiple worlds" over. We want to pan the least
        // amount possible to go to the spot and avoid jumping "multiple worlds" back to the "origin world"
        extent = os.extent.normalizeToCenter(extent, view.getCenter()[0]);

        view.fit(extent, {
          duration: os.MapContainer.FLY_ZOOM_DURATION,
          maxZoom: opt_maxZoom,
          constrainResolution: true
        });
      } else {
        var camera = this.getWebGLCamera();
        var size = map.getSize();
        if (camera && size) {
          var center = ol.extent.getCenter(extent);
          var resolution = view.getResolutionForExtent(extent, size);

          if (opt_maxZoom != null) {
            var zoom = Math.min(opt_maxZoom, this.resolutionToZoom(resolution));
            resolution = this.zoomToResolution(zoom);
          }

          var altitude = camera.calcDistanceForResolution(resolution, 0);
          camera.flyTo(/** @type {!osx.map.FlyToOptions} */ ({
            center: center,
            altitude: altitude,
            duration: os.MapContainer.FLY_ZOOM_DURATION
          }));
        }
      }
    }
  }
};


/**
 * Handle zoom action events. Flies to an extent containing all geometries in the extent.
 *
 * @param {os.ui.action.ActionEvent} event The action event.
 * @private
 */
os.MapContainer.prototype.onZoom_ = function(event) {
  try {
    var context = event.getContext();
    if (!goog.isArray(context)) {
      context = [context];
    }

    var features = context.map(function(c) {
      return c['feature'];
    }).filter(os.fn.filterFalsey);

    if (features.length) {
      if (this.is3DEnabled() && features.length == 1 && os.query.isWorldQuery(features[0].getGeometry())) {
        // while in 3D mode only, handle zooming to the world area by looking at the back of the world
        features[0] = os.query.WORLD_ZOOM_FEATURE;
      }

      os.feature.flyTo(/** @type {Array<ol.Feature>} */ (features));
    } else {
      var extent = /** @type {!Array<?{geometry: ol.geom.Geometry}>} */ (context).reduce(
          os.fn.reduceExtentFromGeometries,
          ol.extent.createEmpty());

      if (!ol.extent.isEmpty(extent)) {
        os.commandStack.addCommand(new os.command.FlyToExtent(extent, undefined, -1));
      }
    }
  } catch (e) {
    goog.log.error(os.MapContainer.LOGGER_, 'Zoom action failed:', e);
  }
};


/**
 * Resets the map/globe to the default view.
 */
os.MapContainer.prototype.resetView = function() {
  if (this.is3DEnabled()) {
    var camera = this.getWebGLCamera();
    if (camera) {
      var resolution = this.zoomToResolution(3);
      var distance = camera.calcDistanceForResolution(resolution, 0);
      camera.flyTo(/** @type {!osx.map.FlyToOptions} */ ({
        range: distance,
        center: [0, 0],
        heading: 0,
        pitch: 0
      }));
    }
  } else {
    var map = this.getMap();
    var view = map.getView();
    goog.asserts.assert(view !== undefined);
    view.setRotation(0);
    view.setCenter(os.map.DEFAULT_CENTER);
    view.setZoom(3);
  }

  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.RESET_VIEW, 1);
};


/**
 * Resets the rotation of the map and the tilt of the globe if 3D mode is enabled.
 */
os.MapContainer.prototype.resetRotation = function() {
  if (this.is3DEnabled()) {
    var camera = this.getWebGLCamera();
    if (camera) {
      camera.flyTo({
        range: camera.getDistanceToCenter(),
        center: camera.getCenter(),
        heading: 0,
        pitch: 0,
        roll: 0
      });
    }
  } else {
    var map = this.getMap();
    var view = map.getView();
    goog.asserts.assert(view !== undefined);
    view.setRotation(0);
  }

  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.RESET_ROTATION, 1);
};


/**
 * Reset camera tilt in 3D.
 */
os.MapContainer.prototype.resetTilt = function() {
  if (this.is3DEnabled()) {
    var camera = this.getWebGLCamera();
    if (camera) {
      camera.flyTo({
        range: camera.getDistanceToCenter(),
        center: camera.getCenter(),
        pitch: 0
      });
    }
  }

  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.RESET_TILT, 1);
};


/**
 * Reset camera roll in 3D.
 */
os.MapContainer.prototype.resetRoll = function() {
  if (this.is3DEnabled()) {
    var camera = this.getWebGLCamera();
    if (camera) {
      camera.flyTo({
        range: camera.getDistanceToCenter(),
        center: camera.getCenter(),
        heading: 0
      });
    }
  } else {
    var map = this.getMap();
    var view = map.getView();
    goog.asserts.assert(view !== undefined);
    view.setRotation(0);
  }

  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.RESET_ROLL, 1);
};


/**
 * Fix focus. HTML canvas elements are not focusable by default, and can only be made focusable by adding tabindex="0"
 * to the canvas. We don't always control those elements so we manually blur the active element when the map viewport
 * is clicked.
 *
 * @private
 */
os.MapContainer.prototype.fixFocus_ = function() {
  // document.activeElement is supported by all major browsers

  // I read that some versions of IE will cause the entire browser window to lose focus if you blur the body.
  // So don't do that.
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
};


/**
 * Setup the control help menu
 *
 * @private
 */
os.MapContainer.prototype.addHelpControls_ = function() {
  var genMapGrp = 'General Map Controls';
  var moveGrp = 'Map Movement Controls';
  var zoomGrp = 'Map Zoom Controls';
  var controls = os.ui.help.Controls.getInstance();
  var platformModifier = ol.has.MAC ? goog.events.KeyCodes.META : goog.events.KeyCodes.CTRL;

  // Map
  controls.addControl(genMapGrp, 1, 'Draw Geometry',
      [goog.events.KeyCodes.SHIFT, '+'], [os.ui.help.Controls.MOUSE.LEFT_MOUSE, '+', os.ui.help.Controls.FONT.ALL]);
  controls.addControl(genMapGrp, 1, 'Context Menu', null, [os.ui.help.Controls.MOUSE.RIGHT_MOUSE]);
  controls.addControl(genMapGrp, 1, 'Reset View', [goog.events.KeyCodes.V]);
  controls.addControl(genMapGrp, 1, 'Reset Rotation', [goog.events.KeyCodes.R]);
  controls.addControl(genMapGrp, 1, 'Copy Coordinates', [goog.events.KeyCodes.PERIOD]); // position plugin

  // Move
  controls.addControl(moveGrp, 2, 'Pan View',
      null, [os.ui.help.Controls.MOUSE.LEFT_MOUSE, '+', os.ui.help.Controls.FONT.ALL]);
  controls.addControl(moveGrp, 2, 'Pan View', null, [os.ui.help.Controls.FONT.LEFT,
    'or', os.ui.help.Controls.FONT.RIGHT,
    'or', os.ui.help.Controls.FONT.UP,
    'or', os.ui.help.Controls.FONT.DOWN]);

  // Zoom
  controls.addControl(zoomGrp, 3, 'Zoom to Box',
      [platformModifier, '+'], [os.ui.help.Controls.MOUSE.LEFT_MOUSE, '+', os.ui.help.Controls.FONT.ALL]);
  controls.addControl(zoomGrp, 3, 'Smooth Zoom In/Out',
      [platformModifier, '+'], [os.ui.help.Controls.MOUSE.RIGHT_MOUSE, '+',
        os.ui.help.Controls.FONT.VERTICAL]);
  controls.addControl(zoomGrp, 3, 'Zoom About Mouse', null, ['Mouse Wheel']);
  controls.addControl(zoomGrp, 3, 'Zoom In', null, ['Double Left Click']);
  controls.addControl(zoomGrp, 3, 'Zoom Out', [platformModifier, '+'], ['Double Left Click']);

  controls.addControl(zoomGrp, 3, 'Large Zoom In/Out',
      [goog.events.KeyCodes.PAGE_UP, 'or', goog.events.KeyCodes.PAGE_DOWN]);
  controls.addControl(zoomGrp, 3, 'Zoom In/Out', null, ['+', '/', '=', 'or', '-', '/', '_']);

  if (this.is3DSupported() && !this.failPerformanceCaveat()) {
    var grp3D = '3D Controls';
    controls = os.ui.help.Controls.getInstance();
    controls.addControl(grp3D, 4, 'Tilt Globe',
        null, [os.ui.help.Controls.MOUSE.MIDDLE_MOUSE, 'or', os.ui.help.Controls.MOUSE.RIGHT_MOUSE, '+',
          os.ui.help.Controls.FONT.VERTICAL]);
    controls.addControl(grp3D, 4, 'Roll Globe',
        null, [os.ui.help.Controls.MOUSE.MIDDLE_MOUSE, 'or', os.ui.help.Controls.MOUSE.RIGHT_MOUSE, '+',
          os.ui.help.Controls.FONT.HORIZONTAL]);
    controls.addControl(grp3D, 4, 'Tilt Globe',
        [goog.events.KeyCodes.SHIFT, '+'], [os.ui.help.Controls.FONT.UP, 'or', os.ui.help.Controls.FONT.DOWN]);
    controls.addControl(grp3D, 4, 'Roll Globe',
        [goog.events.KeyCodes.SHIFT, '+'], [os.ui.help.Controls.FONT.LEFT, 'or', os.ui.help.Controls.FONT.RIGHT]);
    controls.addControl(grp3D, 4, 'Reset Roll', [goog.events.KeyCodes.N]);
    controls.addControl(grp3D, 4, 'Reset Tilt', [goog.events.KeyCodes.U]);
  }
};


/**
 * Callback for when application settings have been loaded.
 */
os.MapContainer.prototype.init = function() {
  os.proj.loadProjections();

  // register a check function to detect projection differences before layer commands go
  // on the stack
  os.command.CommandProcessor.getInstance().registerCheckFunction(os.proj.switch.checkCommand);

  // set up interpolation
  os.interpolate.setConfig(/** @type {Object<string, *>} */ (os.settings.get('interpolation')));

  // do not make this a {@link os.source.Vector}. the drawing layer should not respond to normal interactions like
  // selection/highlight. it is intended for features that are externally styled/managed.
  this.drawingLayer_ = new os.layer.Drawing({
    source: new ol.source.Vector()
  });

  this.drawingLayer_.setTitle('Drawing Layer');
  this.drawingLayer_.setId(os.MapContainer.DRAW_ID);
  this.drawingLayer_.setProvider(os.config.getAppName() || null);
  this.drawingLayer_.setStyle(os.style.StyleManager.getInstance().getOrCreateStyle(os.style.DEFAULT_VECTOR_CONFIG));
  this.drawingLayer_.setOSType(os.layer.LayerType.REF);
  this.drawingLayer_.setExplicitType('');
  this.drawingLayer_.setRemovable(false);
  this.drawingLayer_.setDoubleClickHandler(null);
  this.drawingLayer_.setLayerUI('');
  this.drawingLayer_.setSticky(true);
  this.drawingLayer_.setSynchronizerType(os.layer.SynchronizerType.DRAW);
  this.drawingLayer_.renderLegend = goog.nullFunction;
  this.drawingLayer_.set(os.data.RecordField.ALTITUDE_MODE, os.webgl.AltitudeMode.CLAMP_TO_GROUND);

  var tileGroup = new os.layer.Group();
  tileGroup.setPriority(-2);
  tileGroup.setCheckFunc(os.MapContainer.isTileLayer);
  tileGroup.setOSType(os.layer.LayerType.TILES);

  var vectorGroup = new os.layer.Group({
    layers: [this.drawingLayer_]
  });
  vectorGroup.setCheckFunc(os.MapContainer.isVectorLayer);
  vectorGroup.setOSType(os.layer.LayerType.FEATURES);

  var imageGroup = new os.layer.Group({
    hidden: true
  });
  imageGroup.setCheckFunc(os.MapContainer.isImageLayer);
  imageGroup.setOSType(os.layer.LayerType.IMAGE);

  var referenceGroup = new os.layer.Group();
  referenceGroup.setPriority(100);
  referenceGroup.setOSType(os.layer.LayerType.REF);

  os.map.PROJECTION = ol.proj.get(/** @type {string} */ (
    os.settings.get(os.map.PROJECTION_KEY, os.map.PROJECTION.getCode())));

  os.map.TILEGRID = ol.tilegrid.createForProjection(
      os.map.PROJECTION, ol.DEFAULT_MAX_ZOOM, [512, 512]);
  os.map.MIN_RESOLUTION = os.map.zoomToResolution(os.map.MAX_ZOOM, os.map.PROJECTION);
  os.map.MAX_RESOLUTION = os.map.zoomToResolution(os.map.MIN_ZOOM, os.map.PROJECTION);
  os.proj.switch.ENABLE_RASTER_REPROJECTION = /** @type {boolean} */ (os.settings.get('enableReprojection', true));

  // try restoring values from settings, otherwise fall back on defaults
  var mapCenter = os.map.DEFAULT_CENTER;
  var mapZoom = os.map.DEFAULT_ZOOM;

  var view = new ol.View({
    projection: os.map.PROJECTION,
    center: mapCenter,
    zoom: mapZoom,
    minZoom: os.map.MIN_ZOOM,
    maxZoom: os.map.MAX_ZOOM
  });

  this.map_ = new os.Map({
    controls: this.controlFunction_ ? this.controlFunction_() : undefined,
    interactions: this.interactionFunction_ ? this.interactionFunction_() : undefined,
    layers: new ol.Collection([
      tileGroup,
      vectorGroup,
      referenceGroup,
      imageGroup
    ]),
    // prevents a blank map while flyTo animates
    loadTilesWhileAnimating: true,
    renderer: ol.renderer.Type.CANVAS,
    target: os.MapContainer.TARGET,
    view: view,
    keyboardEventTarget: document
  });

  // update labels when the view resolution changes
  ol.events.listen(view, ol.ObjectEventType.PROPERTYCHANGE, this.onViewChange_, this);

  // export the map's getPixelFromCoordinate/getCoordinateFromPixel methods for tests
  window['pfc'] = this.map_.getPixelFromCoordinate.bind(this.map_);
  window['cfp'] = this.map_.getCoordinateFromPixel.bind(this.map_);
  window['fte'] = this.flyToExtent.bind(this);

  // update the map canvas size on browser resize
  this.vsm_.listen(goog.events.EventType.RESIZE, this.updateSize, false, this);

  // let the stack clear before updating the map size to fit the window
  goog.async.nextTick(this.updateSize, this);

  var vp = this.getMap().getViewport();
  goog.events.listen(vp, goog.events.EventType.CONTEXTMENU, os.events.killEvent, true);
  goog.events.listen(vp, goog.events.EventType.CLICK, this.fixFocus_, false, this);

  // initialize the background color
  var bgColor = /** @type {string} */ (os.settings.get(os.config.DisplaySetting.BG_COLOR, '#000000'));
  this.setBGColor(bgColor);

  this.dispatchEvent(os.MapEvent.MAP_READY);

  this.initSettings();

  this.addHelpControls_();

  // Replace {pos:lat} or {pos:lon} variables with the current view center
  os.net.VariableReplacer.add('pos', os.MapContainer.replacePos_);

  // Replace variables like {extent:north}

  // this one always keeps left less than right, but can use longitudes outside of [-180, 180]
  // when crossing the date line
  os.net.VariableReplacer.add('extent', os.MapContainer.replaceExtent_);

  // this one always keeps normalized longitudes, but the left can be greater than the right
  // when crossing the date line
  os.net.VariableReplacer.add('extent2', os.MapContainer.replaceExtentNormalized_);
};


/**
 * Toggle if the Openlayers canvas is displayed.
 *
 * @param {boolean} shown If the canvas should be displayed.
 * @protected
 */
os.MapContainer.prototype.toggle2DCanvas = function(shown) {
  var viewport = this.map_ ? this.map_.getViewport() : undefined;
  var olCanvas = viewport ? viewport.querySelector('canvas') : undefined;
  if (olCanvas) {
    olCanvas.style.visibility = shown ? '' : 'hidden';
  }
};


/**
 * Initializes settings and adds listeners for settings changes.
 *
 * @protected
 */
os.MapContainer.prototype.initSettings = function() {
  if (os.config && os.config.DisplaySetting) {
    os.settings.listen(os.config.DisplaySetting.MAP_MODE, this.onMapModeChange_, false, this);

    var mapMode = os.settings.get(os.config.DisplaySetting.MAP_MODE, os.MapMode.VIEW_3D);
    if (mapMode === os.MapMode.VIEW_3D || mapMode === os.MapMode.AUTO) {
      // hide the Openlayers canvas while WebGL is initialized
      this.toggle2DCanvas(false);

      // don't display errors on initialization, and wait until the globe is ready to initialize the camera
      this.setWebGLEnabled(true, true).thenAlways(function() {
        // show the Openlayers canvas again
        this.toggle2DCanvas(true);

        // initialize the camera/view
        this.initCameraSettings();
      }, this);
    } else {
      this.initCameraSettings();
    }
  }
};


/**
 * Initializes camera settings.
 *
 * @protected
 */
os.MapContainer.prototype.initCameraSettings = function() {
  var cameraState =
    /** @type {osx.map.CameraState|undefined} */ (os.settings.get(os.config.DisplaySetting.CAMERA_STATE));

  // if a camera state was saved to settings, restore it now
  if (cameraState) {
    this.restoreCameraState(cameraState);
  }
};


/**
 * Handle view toggle from a settings change.
 *
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.MapContainer.prototype.onMapModeChange_ = function(event) {
  if (typeof event.newVal === 'string') {
    var mode = /** @type {os.MapMode} */ (event.newVal);
    var useWebGL = mode === os.MapMode.VIEW_3D || mode === os.MapMode.AUTO ? true : false;
    if (useWebGL != this.is3DEnabled()) {
      this.setWebGLEnabled(useWebGL);
    }
  } else {
    goog.log.warning(os.MapContainer.LOGGER_, 'Unrecognized map mode change value: ' + event.newVal);
  }
};


/**
 * Handle view toggle from the context menu.
 *
 * @private
 */
os.MapContainer.prototype.onToggleView_ = function() {
  if (this.isInitializingWebGL()) {
    return;
  }

  var useWebGL = !this.is3DEnabled();

  // prompt the user if they try to enable WebGL and it isn't supported
  if (useWebGL) {
    if (this.failPerformanceCaveat()) {
      var preventOverride =
        /** @type {boolean} */ (os.settings.get('webgl.performanceCaveat.preventOverride', false));

      os.ui.help.launchWebGLPerfCaveatDialog('3D Globe Performance Issue',
          preventOverride ? undefined : this.overrideFailIfPerformanceCaveat.bind(this));
    }
  }

  var code = os.map.PROJECTION.getCode();
  if (!useWebGL || code === os.proj.EPSG4326 || code === os.proj.EPSG3857) {
    var cmd = new os.command.ToggleWebGL(useWebGL);
    os.command.CommandProcessor.getInstance().addCommand(cmd);
  }
};


/**
 * User opts to override the performance
 */
os.MapContainer.prototype.overrideFailIfPerformanceCaveat = function() {
  this.overrideFailIfMajorPerformanceCaveat_ = true;
  this.setWebGLEnabled(true);
};


/**
 * Save the map mode to settings.
 *
 * @private
 */
os.MapContainer.prototype.saveMapMode_ = function() {
  var mode = this.is3DEnabled() ? os.MapMode.VIEW_3D : os.MapMode.VIEW_2D;
  os.settings.set(os.config.DisplaySetting.MAP_MODE, mode);
};


/**
 * Persist the camera state to an object.
 *
 * @return {!osx.map.CameraState}
 */
os.MapContainer.prototype.persistCameraState = function() {
  if (this.is3DEnabled()) {
    var camera = this.getWebGLCamera();
    if (camera) {
      return camera.persist();
    }
  }

  // persist from the 2D view if 3D isn't enabled, or camera isn't defined
  var view = this.getMap().getView();
  goog.asserts.assert(!!view, 'view not defined');

  // always translate the center point to EPSG:4326
  var center = view.getCenter() || os.map.DEFAULT_CENTER;
  if (os.map.PROJECTION != os.proj.EPSG4326) {
    center = ol.proj.toLonLat(center, os.map.PROJECTION);
    center[0] = os.geo2.normalizeLongitude(center[0], undefined, undefined, os.proj.EPSG4326);
  }

  var resolution = view.getResolution();
  goog.asserts.assert(resolution != null, 'resolution not defined');
  var sizeObj = this.getMap().getSize();
  var altitude = os.map.distanceForResolution([sizeObj[0], sizeObj[1]], resolution);
  var zoom = this.resolutionToZoom(resolution, 1);
  var rotation = goog.math.toDegrees(view.getRotation() || 0);

  return /** @type {!osx.map.CameraState} */ ({
    center: center,
    altitude: altitude,
    heading: rotation,
    roll: 0,
    tilt: 0,
    zoom: zoom
  });
};


/**
 * Restore the camera state.
 *
 * @param {!osx.map.CameraState} cameraState
 */
os.MapContainer.prototype.restoreCameraState = function(cameraState) {
  if (this.restoreCameraDelay_) {
    goog.dispose(this.restoreCameraDelay_);
  }

  this.restoreCameraDelay_ = new goog.async.ConditionalDelay(this.restoreCameraStateInternal_.bind(this, cameraState));
  this.restoreCameraDelay_.start(100, 5000);
};


/**
 * Restore the camera state.
 *
 * @param {!osx.map.CameraState} cameraState
 * @return {boolean}
 * @private
 */
os.MapContainer.prototype.restoreCameraStateInternal_ = function(cameraState) {
  try {
    if (this.is3DEnabled()) {
      var camera = this.getWebGLCamera();
      if (camera) {
        camera.restore(cameraState);
        return true;
      }
    }

    // restore the 2D view if in 2D mode or the 3D camera is not defined
    var view = this.getMap().getView();
    goog.asserts.assert(view !== undefined);

    var zoom = cameraState.zoom;
    if (zoom == null) {
      // check if the view extent is available, or {@link os.map.resolutionForDistance} will fail
      var viewExtent = this.getViewExtent();
      if (ol.extent.equals(viewExtent, os.map.ZERO_EXTENT)) {
        return false;
      }

      var resolution = os.map.resolutionForDistance(this.getMap(), cameraState.altitude);

      // if the calculated resolution is NaN, the map isn't ready (size is probably updating)
      if (isNaN(resolution)) {
        return false;
      }

      zoom = this.resolutionToZoom(resolution);
    }

    // camera state is saved in EPSG:4326
    var center = ol.proj.fromLonLat(cameraState.center, os.map.PROJECTION);
    view.setCenter(center);
    view.setRotation(goog.math.toRadians(cameraState.heading));
    view.setZoom(zoom);
  } catch (e) {
    goog.log.error(os.MapContainer.LOGGER_, 'Error restoring camera state:', e);
  }

  return true;
};


/**
 * Gets the altitude of the current map view in meters.
 *
 * @return {number} The altitude in meters.
 */
os.MapContainer.prototype.getAltitude = function() {
  var altitude = 0;
  if (this.is3DEnabled()) {
    var camera = this.getWebGLCamera();
    if (!camera) {
      return altitude;
    }

    // in 3D, use the camera altitude
    altitude = camera.getAltitude();
  } else {
    var view = this.map_.getView();
    var resolution = view.getResolution();
    if (resolution == null) {
      return altitude;
    }

    // in 2D, use the view resolution
    var sizeObj = this.getMap().getSize();
    altitude = os.map.distanceForResolution([sizeObj[0], sizeObj[1]], resolution);
  }

  return altitude;
};


/**
 * If the map container is initializing the WebGL renderer.
 *
 * @return {boolean}
 */
os.MapContainer.prototype.isInitializingWebGL = function() {
  return this.initializingWebGL_;
};


/**
 * Set if the map container is initializing the WebGL renderer.
 *
 * @param {boolean} value If WebGL is being initialized.
 * @protected
 */
os.MapContainer.prototype.setInitializingWebGL = function(value) {
  if (this.initializingWebGL_ != value) {
    this.initializingWebGL_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.MapChange.INIT3D, value));
  }
};


/**
 * Enable/disable the WebGL renderer.
 *
 * @param {boolean} enabled If the WebGL renderer should be enabled.
 * @param {boolean=} opt_silent If errors should be ignored.
 * @return {!goog.Thenable}
 */
os.MapContainer.prototype.setWebGLEnabled = function(enabled, opt_silent) {
  var code = os.map.PROJECTION.getCode();
  enabled = enabled && (code === os.proj.EPSG4326 || code === os.proj.EPSG3857);

  // change the view if different than current
  if (enabled != this.is3DEnabled() && this.webGLRenderer_ && !this.isInitializingWebGL()) {
    if (enabled && this.is3DSupported() && !this.failPerformanceCaveat() && !this.webGLRenderer_.isInitialized()) {
      // initialize the WebGL renderer
      this.setInitializingWebGL(true);

      return this.webGLRenderer_.initialize().then(function() {
        // initialize succeeded - call again to activate WebGL
        this.setInitializingWebGL(false);
        this.setWebGLEnabled(enabled, opt_silent);
      }, function() {
        // initialize failed - disable 3D support and call again to report the WebGL error
        this.setInitializingWebGL(false);
        this.is3DSupported_ = false;
        this.setWebGLEnabled(enabled, opt_silent);
      }, this);
    }

    this.setWebGLEnabled_(enabled);

    if (!enabled) {
      // in 2D mode, always put north toward the top of the screen. this *must* be called after setWebGLEnabled_ above
      // or the camera synchronizer will make the rotation something very close to 0, but not 0. this causes the canvas
      // renderer to go down a less performant code path.
      // @see {@link ol.renderer.canvas.Layer#composeFrame}
      this.resetRotation();
      os.feature.flyToOverride = undefined;
    } else {
      // reset all synchronizers to a clean state. this needs to be called after WebGL is enabled/rendering to ensure
      // synchronized objects are reset in the correct state.
      this.webGLRenderer_.resetSync();
      os.feature.flyToOverride = this.webGLRenderer_.flyToFeatures.bind(this.webGLRenderer_);
    }

    this.dispatchEvent(os.events.EventType.MAP_MODE);
  }

  if (this.is3DEnabled() != enabled && !this.failPerformanceCaveat() && !this.isInitializingWebGL() && !opt_silent) {
    // if we tried enabling WebGL and it isn't supported or enabling failed, disable support and display an error
    this.is3DSupported_ = false;
    os.ui.help.launchWebGLSupportDialog('3D Globe Not Supported');

    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.WEBGL_FAILED, 1);
  }

  // save the current map mode to settings after the stack clears. this will prevent conflicts with Angular caused by
  // failed changes in settings.
  setTimeout(this.saveMapMode_.bind(this), 0);

  return goog.Promise.resolve();
};


/**
 * Internal call to enable/disable the WebGL renderer, once it has been initialized.
 *
 * @param {boolean} value If the WebGL renderer should be enabled.
 * @private
 */
os.MapContainer.prototype.setWebGLEnabled_ = function(value) {
  if (this.webGLRenderer_ && this.webGLRenderer_.isInitialized() && this.is3DSupported_) {
    this.webGLRenderer_.setEnabled(value);

    var metricKey = value ? os.metrics.keys.Map.MODE_3D : os.metrics.keys.Map.MODE_2D;
    os.metrics.Metrics.getInstance().updateMetric(metricKey, 1);

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.MapChange.VIEW3D, value));
  }
};


/**
 * If the WebGL renderer is the active view.
 *
 * @return {boolean}
 */
os.MapContainer.prototype.is3DEnabled = function() {
  return !!this.webGLRenderer_ && this.webGLRenderer_.getEnabled();
};


/**
 * Checks if WebGL is supported by the browser.
 *
 * @return {boolean}
 */
os.MapContainer.prototype.is3DSupported = function() {
  if (this.is3DSupported_ == undefined) {
    // use the OS function by default. if WebGL is supported and the renderer fails to load, we'll flip it to false.
    this.is3DSupported_ = os.webgl.isSupported();

    if (!this.is3DSupported_) {
      os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.WEBGL_UNSUPPORTED, 1);
    }
  }

  return this.is3DSupported_ && this.webGLRenderer_ != null;
};


/**
 * Checks if WebGL will be rendered with degraded performance
 *
 * @return {boolean|undefined|null}
 */
os.MapContainer.prototype.failPerformanceCaveat = function() {
  if (this.overrideFailIfMajorPerformanceCaveat_) {
    return false;
  } else {
    if (this.hasPerformanceCaveat_ == undefined) {
      var failIfMajorPerformanceCaveat_ =
        /** @type {boolean} */ (os.settings.get('webgl.performanceCaveat.failIf', false));
      this.hasPerformanceCaveat_ = failIfMajorPerformanceCaveat_ ?
        os.webgl.hasPerformanceCaveat() : false;
      if (this.hasPerformanceCaveat_) {
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.WEBGL_PERFORMANCE_CAVEAT, 1);
      }
    }

    return this.hasPerformanceCaveat_;
  }
};


/**
 * Set the background color for the map.
 *
 * @param {string} color The new color.
 * @protected
 */
os.MapContainer.prototype.setBGColor = function(color) {
  $('#map-container').css('background', color);
};


/**
 * Adds a layer to the map
 *
 * @param {!(os.layer.ILayer|ol.layer.Layer)} layer The layer to add
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.MapContainer.prototype.addLayer = function(layer) {
  if (this.map_ && layer instanceof ol.layer.Layer) {
    if (!os.proj.switch.checkLayer(layer)) {
      return;
    }
    var layers = this.map_.getLayers();

    for (var i = 0, n = layers.getLength(); i < n; i++) {
      var item = layers.item(i);

      if (item instanceof os.layer.Group) {
        var group = /** @type {os.layer.Group} */ (item);
        var chk = group.getCheckFunc();

        if (chk && chk(layer)) {
          group.getLayers().push(layer);

          var event = new os.events.LayerEvent(os.events.LayerEventType.ADD, layer);
          this.dispatchEvent(event);
          os.dispatcher.dispatchEvent(event);

          this.recordLayerMetric_(layer, true);

          if (layer instanceof os.layer.AnimatedTile) {
            var om = os.ui.onboarding.OnboardingManager.getInstance();
            if (om && group.getOSType() != os.layer.LayerType.REF) {
              om.displayOnboarding(os.ROOT + 'onboarding/loaddata.json');
            }
          }

          var z = os.data.ZOrder.getInstance();
          if (group.getOSType() == os.layer.LayerType.FEATURES) {
            z.moveHighestAndUpdate(/** @type {os.layer.ILayer} */ (layer).getId());
            z.save();
          } else {
            z.update();
            z.save();
          }

          return;
        }
      }
    }

    goog.log.warning(os.MapContainer.LOGGER_, 'No layer group was found to support ' + layer);
  }
};


/**
 * Records metrics for layer add/remove.
 *
 * @param {!(os.layer.ILayer|ol.layer.Layer)} layer The layer being added/removed
 * @param {boolean} add ture if adding, otherwise false.
 * @private
 */
os.MapContainer.prototype.recordLayerMetric_ = function(layer, add) {
  if (add) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.ADD_LAYER, 1);
  } else {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.REMOVE_LAYER, 1);
  }

  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.LAYER_COUNT, this.map_.getLayers().getLength());
};


/**
 * Adds a layer group to the map
 *
 * @param {!os.layer.Group} group
 */
os.MapContainer.prototype.addGroup = function(group) {
  if (this.map_) {
    var layers = this.map_.getLayers();

    // get the proper index to maintain sort
    var i = goog.array.binarySelect(layers.getArray(), function(el, i, arr) {
      return os.MapContainer.compareGroups_(group, /** @type {os.layer.Group} */ (el));
    });

    // see the docs for goog.array.binarySelect
    if (i < 0) {
      i = Math.abs(i + 1);
      layers.insertAt(i, group);
    }
    // otherwise it is already in the collection
  }
};


/**
 * Removes a layer from the map
 *
 * @param {!(os.layer.ILayer|ol.layer.Layer|string)} layer
 * @param {boolean=} opt_dispose If the layer should be disposed. Defaults to true.
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.MapContainer.prototype.removeLayer = function(layer, opt_dispose) {
  var dispose = opt_dispose != null ? opt_dispose : true;
  var l = typeof layer === 'string' ? this.getLayer(layer) : layer;

  if (l instanceof ol.layer.Layer) {
    var canRemove = true;

    try {
      canRemove = /** @type {os.layer.ILayer} */ (l).isRemovable();
    } catch (e) {
    }

    if (canRemove) {
      l = this.getLayer(l, null, true);

      if (l) {
        var event = new os.events.LayerEvent(os.events.LayerEventType.REMOVE, l);
        this.dispatchEvent(event);
        os.dispatcher.dispatchEvent(event);

        if (dispose) {
          l.dispose();
        }
        this.recordLayerMetric_(l, false);
      }
    }
  }
};


/**
 * Handle remove layer events fired in the application.
 *
 * @param {os.events.LayerEvent} event
 * @private
 */
os.MapContainer.prototype.onRemoveLayerEvent_ = function(event) {
  if (event && event.layer) {
    var layer = /** @type {os.layer.ILayer} */ (this.getLayer(event.layer));
    if (layer) {
      var remove;
      var descriptor = os.dataManager.getDescriptor(layer.getId());
      if (descriptor) {
        if (descriptor.isActive()) {
          // if the layer is synchronized to the descriptor, use the deactivate command
          remove = new os.data.DeactivateDescriptor(descriptor);
        } else {
          // if the descriptor is already inactive, then something must have gone wrong. remove the layer, but log a
          // warning.
          goog.log.warning(os.MapContainer.LOGGER_, 'Descriptor for removed layer "' + layer.getTitle() +
              '" is already inactive.');

          this.removeLayer(/** @type {!ol.layer.Layer} */ (layer));
        }
      }

      var options;
      if (!remove) {
        // if there wasn't a descriptor or a remove command was not created, then create one
        options = layer.getLayerOptions();

        if (options && 'id' in options) {
          remove = new os.command.LayerRemove(options);

          try {
            remove.title += ' "' + layer.getTitle() + '"';
          } catch (e) {
          }
        }
      }

      if (remove) {
        if (options && options['loadOnce']) {
          // allow bypassing the stack for certain layers, primarily static data layers.
          remove.execute();
        } else {
          // add the command to the stack
          os.command.CommandProcessor.getInstance().addCommand(remove);
        }
      } else {
        // no command - try to remove the layer anyway
        this.removeLayer(/** @type {!ol.layer.Layer} */ (layer));
      }
    }
  }
};


/**
 * @inheritDoc
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.MapContainer.prototype.addFeature = function(feature, opt_style) {
  if (feature != undefined) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.ADD_FEATURE, 1);
    if (!(feature instanceof ol.Feature)) {
      // created in another context
      feature = os.ol.feature.clone(feature, [os.data.RecordField.DRAWING_LAYER_NODE]);
    }

    if (typeof opt_style === 'object') {
      // if created externally, clone the style config
      var style = opt_style instanceof Object ? opt_style : os.object.unsafeClone(opt_style);
      feature.set(os.style.StyleType.FEATURE, style);
      os.style.setFeatureStyle(feature);
    }

    var drawLayer = this.getLayer(os.MapContainer.DRAW_ID);
    if (drawLayer) {
      // make sure the feature has an id or we won't be able to look it up for removal
      if (!feature.getId()) {
        feature.setId(ol.getUid(feature));
      }

      // set the layer id so we can look up the layer
      feature.set(os.data.RecordField.SOURCE_ID, /** @type {os.layer.ILayer} */ (drawLayer).getId());

      var drawSource = drawLayer.getSource();

      if (drawSource instanceof ol.source.Vector) {
        os.interpolate.interpolateFeature(feature);
        drawSource.addFeature(feature);
        return feature;
      }
    }
  }

  return undefined;
};


/**
 * @inheritDoc
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.MapContainer.prototype.addFeatures = function(features, opt_style) {
  var added = [];
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.ADD_FEATURES, 1);
  for (var i = 0, n = features.length; i < n; i++) {
    if (this.addFeature(features[i], opt_style)) {
      added.push(features[i]);
    }
  }

  return added;
};


/**
 * @inheritDoc
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.MapContainer.prototype.removeFeature = function(feature, opt_dispose) {
  if (feature != null) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.REMOVE_FEATURE, 1);
    var layer = this.getLayer(os.MapContainer.DRAW_ID);
    if (layer != null) {
      var source = /** @type {ol.source.Vector} */ (layer.getSource());
      if (typeof feature === 'string' || typeof feature === 'number') {
        feature = source.getFeatureById(feature);
      } else {
        feature = source.getFeatureById(feature.getId() + '');
      }

      if (feature != null) {
        source.removeFeature(feature);

        if (opt_dispose) {
          feature.dispose();
        }
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.MapContainer.prototype.containsFeature = function(feature) {
  if (feature != null) {
    var layer = this.getLayer(os.MapContainer.DRAW_ID);

    if (layer) {
      var source = /** @type {ol.source.Vector} */ (layer.getSource());

      return !!(typeof feature === 'string' || typeof feature === 'number' ? source.getFeatureById(feature) :
        source.getFeatureById(feature.getId() + ''));
    }
  }

  return false;
};


/**
 * @inheritDoc
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.MapContainer.prototype.removeFeatures = function(features, opt_dispose) {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.REMOVE_FEATURES, 1);
  for (var i = 0, n = features.length; i < n; i++) {
    this.removeFeature(features[i], opt_dispose);
  }
};


/**
 * Gets the array of features in the drawing layer.
 *
 * @return {Array<ol.Feature>}
 */
os.MapContainer.prototype.getFeatures = function() {
  return this.drawingLayer_ ? this.drawingLayer_.getSource().getFeatures() : [];
};


/**
 * Gets the reference to the drawing layer.
 *
 * @return {ol.layer.Layer}
 */
os.MapContainer.prototype.getDrawingLayer = function() {
  return this.drawingLayer_;
};


/**
 * Gets an array of layers ordered from top to bottom
 *
 * @return {!Array<!ol.layer.Layer>}
 */
os.MapContainer.prototype.getLayers = function() {
  var layers = [];

  if (this.map_) {
    var l = this.map_.getLayers().getArray();

    for (var i = 0, n = l.length; i < n; i++) {
      if (os.instanceOf(l[i], ol.layer.Group.NAME)) {
        layers = layers.concat(/** @type {ol.layer.Group} */ (l[i]).getLayers().getArray());
      } else {
        layers.push(/** @type {ol.layer.Layer} */ (l[i]));
      }
    }
  }

  layers.reverse();
  return layers;
};


/**
 * Count the number of active map layers matching a class.
 *
 * @param {!Object} clazz The layer class
 * @return {number} The layer count
 */
os.MapContainer.prototype.getLayerCount = function(clazz) {
  var layers = this.getLayers();
  return layers.reduce(function(previousValue, currentValue, index, array) {
    return currentValue instanceof clazz ? previousValue + 1 : previousValue;
  }, 0);
};


/**
 * @inheritDoc
 */
os.MapContainer.prototype.getLayer = function(layerOrFeature, opt_search, opt_remove) {
  if (opt_remove == null) {
    opt_remove = false;
  }

  if (!opt_search && this.map_) {
    opt_search = this.map_.getLayers();
  }

  var l = null;

  if (this.map_) {
    for (var i = 0, n = opt_search.getLength(); i < n; i++) {
      var item = opt_search.item(i);

      if (item instanceof os.layer.Group) {
        l = this.getLayer(layerOrFeature, /** @type {os.layer.Group} */ (item).getLayers(), opt_remove);
      } else {
        try {
          if (typeof layerOrFeature === 'string') {
            var lid = /** @type {os.layer.ILayer} */ (item).getId();
            if (lid == layerOrFeature) {
              l = /** @type {ol.layer.Layer} */ (item);

              if (opt_remove) {
                opt_search.removeAt(i);
              }

              break;
            }
          } else if (layerOrFeature === item) {
            l = /** @type {ol.layer.Layer} */ (item);

            if (opt_remove) {
              opt_search.removeAt(i);
            }

            break;
          } else if (layerOrFeature instanceof ol.Feature) {
            var src = /** @type {ol.layer.Layer} */ (item).getSource();

            if (src instanceof ol.source.Vector &&
                src.getFeatureById(/** @type {ol.Feature} */ (layerOrFeature).getId() || '')) {
              l = /** @type {ol.layer.Layer} */ (item);
            }
          }
        } catch (e) {
          // whatever
        }
      }

      if (l) {
        break;
      }
    }
  }

  return l;
};


/**
 * Compares groups by priority
 *
 * @param {os.layer.Group} a
 * @param {os.layer.Group} b
 * @return {number}
 * @private
 */
os.MapContainer.compareGroups_ = function(a, b) {
  return goog.array.defaultCompare(a.getPriority(), b.getPriority());
};


/**
 * @param {function():ol.Collection} controlFunction
 */
os.MapContainer.prototype.setControlFunction = function(controlFunction) {
  this.controlFunction_ = controlFunction;
};


/**
 * @param {function():ol.Collection} interactionFunction
 */
os.MapContainer.prototype.setInteractionFunction = function(interactionFunction) {
  this.interactionFunction_ = interactionFunction;
};


/**
 * Gets the resolution for the given zoom level
 *
 * @param {number} zoom
 * @return {number} resolution (degrees per pixel)
 */
os.MapContainer.prototype.zoomToResolution = function(zoom) {
  var projection = this.getMap().getView().getProjection();
  return os.map.zoomToResolution(zoom, projection);
};


/**
 * Gets the zoom level from the given resolution
 *
 * @param {number} resolution
 * @param {number=} opt_precision The decimal precision
 * @return {number} zoom
 */
os.MapContainer.prototype.resolutionToZoom = function(resolution, opt_precision) {
  var projection = this.getMap().getView().getProjection();
  return os.map.resolutionToZoom(resolution, projection, opt_precision);
};


/**
 * @param {string} match
 * @param {string} submatch
 * @param {number} offset
 * @param {string} str
 * @return {string}
 * @private
 */
os.MapContainer.replacePos_ = function(match, submatch, offset, str) {
  var center = os.MapContainer.getInstance().getMap().getView().getCenter();

  if (center) {
    center = ol.proj.toLonLat(center, os.map.PROJECTION);
  }

  return (submatch.indexOf('a') > -1 ? center[1] : center[0]).toString();
};


/**
 * @param {string} match
 * @param {string} submatch
 * @param {number} offset
 * @param {string} str
 * @return {string}
 * @private
 */
os.MapContainer.replaceExtent_ = function(match, submatch, offset, str) {
  var extent = ol.proj.transformExtent(
      os.MapContainer.getInstance().getMap().getExtent(),
      os.map.PROJECTION,
      os.proj.EPSG4326);
  return os.MapContainer.replaceExtentInternal_(extent, match, submatch, offset, str);
};


/**
 * @param {ol.Extent} extent
 * @param {string} match
 * @param {string} submatch
 * @param {number} offset
 * @param {string} str
 * @return {string}
 * @private
 */
os.MapContainer.replaceExtentInternal_ = function(extent, match, submatch, offset, str) {
  switch (submatch.toLowerCase()) {
    case 'north':
      return Math.max(extent[1], extent[3]).toString();
    case 'south':
      return Math.min(extent[1], extent[3]).toString();
    case 'east':
      return Math.max(extent[0], extent[2]).toString();
    case 'west':
      return Math.min(extent[0], extent[2]).toString();
    default:
      return extent.join(',');
  }
};


/**
 * @param {string} match
 * @param {string} submatch
 * @param {number} offset
 * @param {string} str
 * @return {string}
 * @private
 */
os.MapContainer.replaceExtentNormalized_ = function(match, submatch, offset, str) {
  var extent = os.MapContainer.getInstance().getMap().getExtent();

  extent = ol.proj.transformExtent(extent, os.map.PROJECTION, os.proj.EPSG4326);
  extent = os.extent.normalize(extent, undefined, undefined, os.proj.EPSG4326);
  return os.MapContainer.replaceExtentInternal_(extent, match, submatch, offset, str);
};


/**
 * Launch a dialog warning users of the risks in using 2D with lots of data.
 *
 * @return {!goog.Promise}
 */
os.MapContainer.launch2DPerformanceDialog = function() {
  return new goog.Promise(function(resolve, reject) {
    var text = '<p>Switching to 2D mode with the current data volume may degrade performance considerably or crash ' +
        'the browser. Click OK to switch to 2D, or Cancel to stay in 3D.</p>' +
        '<p>If you would like to switch to 2D mode safely, please consider narrowing your time range, applying ' +
        'filters, shrinking your query areas, or removing some feature layers.</p>';

    os.ui.window.ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: resolve,
      cancel: reject,
      prompt: text,
      windowOptions: {
        'label': 'Feature Limit Exceeded',
        'icon': 'fa fa-warning',
        'x': 'center',
        'y': 'center',
        'width': '425',
        'height': 'auto',
        'modal': 'true',
        'headerClass': 'bg-warning u-bg-warning-text'
      }
    }));
  });
};
