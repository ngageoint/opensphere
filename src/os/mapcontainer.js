goog.module('os.MapContainer');
goog.module.declareLegacyNamespace();

goog.require('os.ui.help.webGLPerfCaveatDirective');
goog.require('os.ui.help.webGLSupportDirective');

const Promise = goog.require('goog.Promise');
const {binarySelect, defaultCompare} = goog.require('goog.array');
const {assert} = goog.require('goog.asserts');
const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const Delay = goog.require('goog.async.Delay');
const nextTick = goog.require('goog.async.nextTick');
const googDispose = goog.require('goog.dispose');
const ViewportSizeMonitor = goog.require('goog.dom.ViewportSizeMonitor');
const {install: installPolyfill} = goog.require('goog.dom.animationFrame.polyfill');
const googEvents = goog.require('goog.events');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const KeyCodes = goog.require('goog.events.KeyCodes');
const log = goog.require('goog.log');
const {clamp, toDegrees, toRadians} = goog.require('goog.math');

const ol = goog.require('ol');
const Collection = goog.require('ol.Collection');
const Feature = goog.require('ol.Feature');
const MapEventType = goog.require('ol.MapEventType');
const ObjectEventType = goog.require('ol.ObjectEventType');
const View = goog.require('ol.View');
const {linear: linearEasing} = goog.require('ol.easing');
const olEvents = goog.require('ol.events');
const olExtent = goog.require('ol.extent');
const has = goog.require('ol.has');
const LayerGroup = goog.require('ol.layer.Group');
const ImageLayer = goog.require('ol.layer.Image');
const Layer = goog.require('ol.layer.Layer');
const Tile = goog.require('ol.layer.Tile');
const OLVectorLayer = goog.require('ol.layer.Vector');
const VectorTile = goog.require('ol.layer.VectorTile');
const olProj = goog.require('ol.proj');
const Type = goog.require('ol.renderer.Type');
const OLVectorSource = goog.require('ol.source.Vector');
const {createForProjection} = goog.require('ol.tilegrid');

const {ROOT} = goog.require('os');
const CameraMode = goog.require('os.CameraMode');
const dispatcher = goog.require('os.Dispatcher');
const OSMap = goog.require('os.Map');
const MapChange = goog.require('os.MapChange');
const MapEvent = goog.require('os.MapEvent');
const MapMode = goog.require('os.MapMode');
const EventType = goog.require('os.action.EventType');
const {isColorString} = goog.require('os.color');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const FlyToExtent = goog.require('os.command.FlyToExtent');
const LayerRemove = goog.require('os.command.LayerRemove');
const ToggleWebGL = goog.require('os.command.ToggleWebGL');
const {getAppName} = goog.require('os.config');
const DisplaySetting = goog.require('os.config.DisplaySetting');
const Settings = goog.require('os.config.Settings');
const DataManager = goog.require('os.data.DataManager');
const DeactivateDescriptor = goog.require('os.data.DeactivateDescriptor');
const RecordField = goog.require('os.data.RecordField');
const ZOrder = goog.require('os.data.ZOrder');
const {killEvent} = goog.require('os.events');
const OSEventType = goog.require('os.events.EventType');
const LayerEvent = goog.require('os.events.LayerEvent');
const LayerEventType = goog.require('os.events.LayerEventType');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const {normalize: normalizeExtent, normalizeToCenter} = goog.require('os.extent');
const osFeature = goog.require('os.feature');
const {filterFalsey, noop, reduceExtentFromGeometries} = goog.require('os.fn');
const {normalizeLongitude} = goog.require('os.geo2');
const instanceOf = goog.require('os.instanceOf');
const {setConfig: setInterpolateConfig, interpolateFeature} = goog.require('os.interpolate');
const AnimatedTile = goog.require('os.layer.AnimatedTile');
const Drawing = goog.require('os.layer.Drawing');
const Group = goog.require('os.layer.Group');
const LayerType = goog.require('os.layer.LayerType');
const SynchronizerType = goog.require('os.layer.SynchronizerType');
const VectorLayer = goog.require('os.layer.Vector');
const osMap = goog.require('os.map');
const FlightMode = goog.require('os.map.FlightMode');
const metrics = goog.require('os.metrics');
const Metrics = goog.require('os.metrics.Metrics');
const VariableReplacer = goog.require('os.net.VariableReplacer');
const {unsafeClone} = goog.require('os.object');
const {clone: cloneFeature} = goog.require('os.ol.feature');
const {EPSG3857, EPSG4326, loadProjections} = goog.require('os.proj');
const {setEnableRasterReprojection} = goog.require('os.proj.reprojection');
const projSwitch = goog.require('os.proj.switch');
const queryUtils = goog.require('os.query.utils');
const {randomString} = goog.require('os.string');
const osStyle = goog.require('os.style');
const StyleType = goog.require('os.style.StyleType');
const label = goog.require('os.style.label');
const ui = goog.require('os.ui');
const ActionEventType = goog.require('os.ui.action.EventType');
const {launchWebGLPerfCaveatDialog, launchWebGLSupportDialog} = goog.require('os.ui.help');
const Controls = goog.require('os.ui.help.Controls');
const OnboardingManager = goog.require('os.ui.onboarding.OnboardingManager');
const {isSupported: isWebglSupported, hasPerformanceCaveat} = goog.require('os.webgl');
const AbstractWebGLRenderer = goog.require('os.webgl.AbstractWebGLRenderer');
const AltitudeMode = goog.require('os.webgl.AltitudeMode');

const Logger = goog.requireType('goog.log.Logger');
const SettingChangeEvent = goog.requireType('os.events.SettingChangeEvent');
const ILayer = goog.requireType('os.layer.ILayer');
const IMapContainer = goog.requireType('os.map.IMapContainer');
const ActionEvent = goog.requireType('os.ui.action.ActionEvent');
const IWebGLCamera = goog.requireType('os.webgl.IWebGLCamera');
const IWebGLRenderer = goog.requireType('os.webgl.IWebGLRenderer');


/**
 * Wrapper for the Openlayers map.
 *
 * @implements {IMapContainer}
 */
class MapContainer extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The Openlayers map.
     * @type {OSMap}
     * @private
     */
    this.map_ = null;

    /**
     * The WebGL map/globe renderer.
     * @type {IWebGLRenderer|undefined}
     * @private
     */
    this.webGLRenderer_ = undefined;

    /**
     * The available WebGL map/globe renderers.
     * @type {Object<string, IWebGLRenderer>}
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
     * @type {Delay}
     * @private
     */
    this.viewChangeDelay_ = new Delay(this.handleViewChange_, 500, this);

    /**
     * A delay used to wait until the view is ready before restoring the camera state.
     * @type {ConditionalDelay}
     * @private
     */
    this.restoreCameraDelay_ = null;

    /**
     * Drawing layer for query regions.
     * @type {VectorLayer}
     * @private
     */
    this.drawingLayer_ = null;

    /**
     * @type {?function():Collection}
     * @private
     */
    this.controlFunction_ = null;

    /**
     * @type {?function():Collection}
     * @private
     */
    this.interactionFunction_ = null;

    /**
     * @type {ViewportSizeMonitor}
     * @private
     */
    this.vsm_ = new ViewportSizeMonitor();

    /**
     * @type {boolean}
     * @private
     */
    this.overrideFailIfMajorPerformanceCaveat_ = false;

    dispatcher.getInstance().listen(ActionEventType.ZOOM, this.onZoom_, false, this);

    dispatcher.getInstance().listen(EventType.RESET_VIEW, this.resetView, false, this);
    dispatcher.getInstance().listen(EventType.RESET_ROTATION, this.resetRotation, false, this);
    dispatcher.getInstance().listen(EventType.TOGGLE_VIEW, this.onToggleView_, false, this);

    dispatcher.getInstance().listen(LayerEventType.REMOVE, this.onRemoveLayerEvent_, false, this);

    dispatcher.getInstance().listen(MapEvent.RENDER, this.render, false, this);
    dispatcher.getInstance().listen(MapEvent.RENDER_SYNC, this.renderSync, false, this);

    Settings.getInstance().listen(DisplaySetting.BG_COLOR, this.onSettingChange_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    googDispose(this.vsm_);
    this.vsm_ = null;

    googDispose(this.viewChangeDelay_);
    this.viewChangeDelay_ = null;

    googDispose(this.restoreCameraDelay_);
    this.restoreCameraDelay_ = null;

    if (this.map_) {
      var view = this.map_.getView();
      if (view) {
        olEvents.unlisten(view, ObjectEventType.PROPERTYCHANGE, this.onViewChange_, this);
      }

      this.map_.dispose();
      this.map_ = null;
    }

    dispatcher.getInstance().unlisten(ActionEventType.ZOOM, this.onZoom_, false, this);

    dispatcher.getInstance().unlisten(EventType.RESET_VIEW, this.resetView, false, this);
    dispatcher.getInstance().unlisten(EventType.RESET_ROTATION, this.resetRotation, false, this);
    dispatcher.getInstance().unlisten(EventType.TOGGLE_VIEW, this.onToggleView_, false, this);

    dispatcher.getInstance().unlisten(LayerEventType.REMOVE, this.onRemoveLayerEvent_, false, this);

    dispatcher.getInstance().unlisten(MapEvent.RENDER, this.render, false, this);
    dispatcher.getInstance().unlisten(MapEvent.RENDER_SYNC, this.renderSync, false, this);

    Settings.getInstance().unlisten(DisplaySetting.BG_COLOR, this.onSettingChange_, false, this);

    super.disposeInternal();
  }

  /**
   * Get the active WebGL renderer.
   *
   * @return {IWebGLRenderer|undefined}
   */
  getWebGLRenderer() {
    return this.webGLRenderer_;
  }

  /**
   * Get the available WebGL renderers.
   *
   * @return {Object<string, IWebGLRenderer>}
   */
  getWebGLRenderers() {
    return this.webGLRenderers_;
  }

  /**
   * Add a WebGL renderer
   *
   * @param {IWebGLRenderer|undefined} renderer
   */
  addWebGLRenderer(renderer) {
    if (renderer) {
      this.webGLRenderers_[renderer.getId() || randomString()] = renderer;
    }
  }

  /**
   * Set the active WebGL renderer.
   *
   * @param {IWebGLRenderer|undefined} value The new renderer.
   */
  setWebGLRenderer(value) {
    this.addWebGLRenderer(value);

    if (this.webGLRenderer_) {
      if (this.webGLRenderer_.isInitialized()) {
        // do not allow replacing the WebGL renderer once it has been initialized, because it may make changes to
        // interactions and other application behavior that will affect the new renderer.
        log.error(logger, 'A WebGL renderer has already been set and initialized on the map.');
        return;
      }

      this.webGLRenderer_.setMap(undefined);
    }

    this.webGLRenderer_ = value;
    if (value && value.getId()) {
      Settings.getInstance().set(AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY, value.getId());
    }

    if (this.webGLRenderer_) {
      this.webGLRenderer_.setMap(this.map_);
    }
  }

  /**
   * Get the WebGL camera.
   *
   * @return {IWebGLCamera|undefined}
   */
  getWebGLCamera() {
    return this.webGLRenderer_ ? this.webGLRenderer_.getCamera() : undefined;
  }

  /**
   * Handle changes to map settings.
   *
   * @param {!SettingChangeEvent} event
   * @private
   */
  onSettingChange_(event) {
    switch (event.type) {
      case DisplaySetting.BG_COLOR:
        var color = /** @type {string} */ (event.newVal);
        if (isColorString(color)) {
          this.setBGColor(color);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Get the extent of the current view.
   *
   * @return {ol.Extent}
   */
  getViewExtent() {
    return this.map_ ? this.map_.getExtent() : olExtent.createEmpty();
  }

  /**
   * Handle changes to the view resolution. This happens a lot during user interaction, so defer handling until the view
   * settles.
   *
   * @param {ol.Object.Event} event
   * @private
   */
  onViewChange_(event) {
    this.viewChangeDelay_.start();
  }

  /**
   * Perform actions in response to view changes. This is called on a delay and will not fire until the view stops
   * changing.
   *
   * @private
   */
  handleViewChange_() {
    var cameraMode = /** @type {string|undefined} */ (Settings.getInstance().get(DisplaySetting.CAMERA_MODE));
    if (cameraMode == CameraMode.LAST) {
      try {
        var cameraState = this.persistCameraState();
        Settings.getInstance().set(DisplaySetting.CAMERA_STATE, cameraState);
      } catch (e) {
        log.error(logger, 'Error persisting camera state:', e);
      }
    }

    label.updateShown();
    this.dispatchEvent(MapEvent.VIEW_CHANGE);
  }

  /**
   * Render the map.
   */
  render() {
    var map = this.getMap();
    if (map) {
      map.render();
    }
  }

  /**
   * Synchronously render the map.
   */
  renderSync() {
    var map = this.getMap();
    if (map) {
      map.renderSync();
    }
  }

  /**
   * Adds/removes a feature to the skip list based on its visibility.
   *
   * @param {Feature} feature
   * @param {boolean} visible
   */
  updateFeatureVisibility(feature, visible) {
    if (this.map_) {
      if (visible) {
        this.map_.unskipFeature(feature);
      } else {
        this.map_.skipFeature(feature);
      }
    }
  }

  /**
   * This will cause the canvas to resize itself and take up the correct amount of space. The size is first set to 0 so
   * when ol.Map#updateSize is called it will take up the remaining space in the window after other content is laid out.
   */
  updateSize() {
    if (this.map_) {
      // wait for the map to finish rendering with 0 size, then update the size to the correct value
      olEvents.listenOnce(this.map_, MapEventType.POSTRENDER, () => {
        var map = this.map_;
        ui.waitForAngular(function() {
          map.updateSize();
          dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
        });
      });

      this.map_.setSize([0, 0]);
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * @return {OSMap}
   * @override
   */
  getMap() {
    return this.map_;
  }

  /**
   * Set the map view.
   *
   * @param {View} view The view
   */
  setView(view) {
    if (this.map_) {
      var oldView = this.map_.getView();
      if (oldView) {
        olEvents.unlisten(oldView, ObjectEventType.PROPERTYCHANGE, this.onViewChange_, this);
      }

      this.map_.setView(view);

      if (view) {
        olEvents.listen(view, ObjectEventType.PROPERTYCHANGE, this.onViewChange_, this);
      }
    }
  }

  /**
   * Cancels the current camera flight if one is in progress. The camera is left at it's current location.
   */
  cancelFlight() {
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
  }

  /**
   * Flies to the provided coordinate/zoom level.
   *
   * @param {!osx.map.FlyToOptions} options The fly to options.
   */
  flyTo(options) {
    var map = this.getMap();
    if (map) {
      Metrics.getInstance().updateMetric(metrics.keys.Map.FLY_TO, 1);
      var view = map.getView();
      assert(view);

      var center = options.destination || options.center || view.getCenter();
      var duration = options.duration || MapContainer.FLY_ZOOM_DURATION;

      if (this.is3DEnabled()) {
        var camera = this.getWebGLCamera();
        if (camera) {
          // favor altitude over zoom in 3D mode
          if (options.altitude === undefined && options.zoom !== undefined) {
            options.altitude = camera.calcDistanceForResolution(this.zoomToResolution(options.zoom),
                toRadians(center[1]));
            delete options.zoom;
          }

          camera.flyTo(options);
        }
      } else {
        // translate 3D heading to OpenLayers rotation if defined and non-zero
        var rotation = options.heading ? toRadians(-options.heading) : 0;

        var animateOptions = /** @type {!olx.AnimationOptions} */ ({
          center,
          duration,
          rotation
        });

        if (options.zoom !== undefined) {
          // prioritize zoom in 2D mode
          animateOptions.zoom = clamp(options.zoom, osMap.MIN_ZOOM, osMap.MAX_ZOOM);
        } else if (!options.positionCamera && options.range !== undefined) {
          // telling the camera where to look, so a range will generally be specified
          var resolution = osMap.resolutionForDistance(this.getMap(), options.range, 0);
          animateOptions.resolution = clamp(resolution, osMap.MIN_RESOLUTION, osMap.MAX_RESOLUTION);
        } else if (options.altitude !== undefined) {
          // try altitude last, because it will generally be 0 if positioning the camera
          var resolution = osMap.resolutionForDistance(this.getMap(), options.altitude, 0);
          animateOptions.resolution = clamp(resolution, osMap.MIN_RESOLUTION, osMap.MAX_RESOLUTION);
        }

        // 'bounce' uses default easing, 'smooth' uses linear.
        if (options.flightMode === FlightMode.SMOOTH) {
          animateOptions.easing = linearEasing;
        }

        view.animate(animateOptions);
      }
    }
  }

  /**
   * @inheritDoc
   */
  flyToExtent(extent, opt_buffer, opt_maxZoom) {
    if (extent && extent.indexOf(Infinity) != -1 || extent.indexOf(-Infinity) != -1) {
      log.fine(logger, 'Attempted to fly to infinite extent.');
      return;
    }

    var map = this.getMap();
    if (map) {
      Metrics.getInstance().updateMetric(metrics.keys.Map.FLY_TO_EXTENT, 1);
      var view = map.getView();
      assert(view != null);

      if (extent) {
        // clone the extent before modifying it to avoid potentially adverse affects
        extent = extent.slice();

        if (opt_buffer && opt_buffer > 0) {
          olExtent.scaleFromCenter(extent, opt_buffer);
        } else {
          // THIN-6449: prevent flying to excessive zoom levels if a buffer wasn't provided. if one was provided,
          // assume the caller knows what they are doing.
          var buffer = MapContainer.FLY_ZOOM_BUFFER_;
          if (olExtent.getWidth(extent) < buffer && olExtent.getHeight(extent) < buffer) {
            extent = olExtent.buffer(extent, buffer);
          }
        }

        if (!this.is3DEnabled()) {
          // In 2D views, projections supporting wrapping can pan "multiple worlds" over. We want to pan the least
          // amount possible to go to the spot and avoid jumping "multiple worlds" back to the "origin world"
          extent = normalizeToCenter(extent, view.getCenter()[0]);

          view.fit(extent, {
            duration: MapContainer.FLY_ZOOM_DURATION,
            maxZoom: opt_maxZoom,
            constrainResolution: true
          });
        } else {
          var camera = this.getWebGLCamera();
          var size = map.getSize();
          if (camera && size) {
            var center = olExtent.getCenter(extent);
            var resolution = view.getResolutionForExtent(extent, size);

            if (opt_maxZoom != null) {
              var zoom = Math.min(opt_maxZoom, this.resolutionToZoom(resolution));
              resolution = this.zoomToResolution(zoom);
            }

            var altitude = camera.calcDistanceForResolution(resolution, 0);
            camera.flyTo(/** @type {!osx.map.FlyToOptions} */ ({
              center: center,
              altitude: altitude,
              duration: MapContainer.FLY_ZOOM_DURATION
            }));
          }
        }
      }
    }
  }

  /**
   * Handle zoom action events. Flies to an extent containing all geometries in the extent.
   *
   * @param {ActionEvent} event The action event.
   * @private
   */
  onZoom_(event) {
    try {
      var context = event.getContext();
      if (!Array.isArray(context)) {
        context = [context];
      }

      var features = context.map(function(c) {
        return c['feature'];
      }).filter(filterFalsey);

      if (features.length) {
        if (this.is3DEnabled() && features.length == 1 && queryUtils.isWorldQuery(features[0].getGeometry())) {
          // while in 3D mode only, handle zooming to the world area by looking at the back of the world
          features[0] = queryUtils.WORLD_ZOOM_FEATURE;
        }

        osFeature.flyTo(/** @type {Array<Feature>} */ (features));
      } else {
        var extent = /** @type {!Array<?{geometry: ol.geom.Geometry}>} */ (context).reduce(
            reduceExtentFromGeometries,
            olExtent.createEmpty());

        if (!olExtent.isEmpty(extent)) {
          CommandProcessor.getInstance().addCommand(new FlyToExtent(extent, undefined, -1));
        }
      }
    } catch (e) {
      log.error(logger, 'Zoom action failed:', e);
    }
  }

  /**
   * Resets the map/globe to the default view.
   */
  resetView() {
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
      assert(view !== undefined);
      view.setRotation(0);
      view.setCenter(osMap.DEFAULT_CENTER);
      view.setZoom(3);
    }

    Metrics.getInstance().updateMetric(metrics.keys.Map.RESET_VIEW, 1);
  }

  /**
   * Resets the rotation of the map and the tilt of the globe if 3D mode is enabled.
   */
  resetRotation() {
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
      assert(view !== undefined);
      view.setRotation(0);
    }

    Metrics.getInstance().updateMetric(metrics.keys.Map.RESET_ROTATION, 1);
  }

  /**
   * Reset camera tilt in 3D.
   */
  resetTilt() {
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

    Metrics.getInstance().updateMetric(metrics.keys.Map.RESET_TILT, 1);
  }

  /**
   * Reset camera roll in 3D.
   */
  resetRoll() {
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
      assert(view !== undefined);
      view.setRotation(0);
    }

    Metrics.getInstance().updateMetric(metrics.keys.Map.RESET_ROLL, 1);
  }

  /**
   * Fix focus. HTML canvas elements are not focusable by default, and can only be made focusable by adding tabindex="0"
   * to the canvas. We don't always control those elements so we manually blur the active element when the map viewport
   * is clicked.
   *
   * @private
   */
  fixFocus_() {
    // document.activeElement is supported by all major browsers

    // I read that some versions of IE will cause the entire browser window to lose focus if you blur the body.
    // So don't do that.
    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
  }

  /**
   * Setup the control help menu
   *
   * @private
   */
  addHelpControls_() {
    var genMapGrp = 'General Map Controls';
    var moveGrp = 'Map Movement Controls';
    var zoomGrp = 'Map Zoom Controls';
    var controls = Controls.getInstance();
    var platformModifier = has.MAC ? KeyCodes.META : KeyCodes.CTRL;

    // Map
    controls.addControl(genMapGrp, 1, 'Draw Geometry',
        [KeyCodes.SHIFT, '+'], [Controls.MOUSE.LEFT_MOUSE, '+', Controls.FONT.ALL]);
    controls.addControl(genMapGrp, 1, 'Context Menu', null, [Controls.MOUSE.RIGHT_MOUSE]);
    controls.addControl(genMapGrp, 1, 'Reset View', [KeyCodes.V]);
    controls.addControl(genMapGrp, 1, 'Reset Rotation', [KeyCodes.R]);
    controls.addControl(genMapGrp, 1, 'Copy Coordinates', [KeyCodes.PERIOD]); // position plugin

    // Move
    controls.addControl(moveGrp, 2, 'Pan View',
        null, [Controls.MOUSE.LEFT_MOUSE, '+', Controls.FONT.ALL]);
    controls.addControl(moveGrp, 2, 'Pan View', null, [Controls.FONT.LEFT,
      'or', Controls.FONT.RIGHT,
      'or', Controls.FONT.UP,
      'or', Controls.FONT.DOWN]);
    controls.addControl(moveGrp, 2, 'Rotate View',
        null, [Controls.MOUSE.MIDDLE_MOUSE, 'or', Controls.MOUSE.RIGHT_MOUSE, '+',
          Controls.FONT.HORIZONTAL]);
    controls.addControl(moveGrp, 2, 'Rotate View',
        [KeyCodes.SHIFT, '+'], [Controls.FONT.LEFT, 'or', Controls.FONT.RIGHT]);

    // Zoom
    controls.addControl(zoomGrp, 3, 'Zoom to Box',
        [platformModifier, '+'], [Controls.MOUSE.LEFT_MOUSE, '+', Controls.FONT.ALL]);
    controls.addControl(zoomGrp, 3, 'Smooth Zoom In/Out',
        [platformModifier, '+'], [Controls.MOUSE.RIGHT_MOUSE, '+',
          Controls.FONT.VERTICAL]);
    controls.addControl(zoomGrp, 3, 'Zoom About Mouse', null, ['Mouse Wheel']);
    controls.addControl(zoomGrp, 3, 'Zoom In', null, ['Double Left Click']);
    controls.addControl(zoomGrp, 3, 'Zoom Out', [platformModifier, '+'], ['Double Left Click']);

    controls.addControl(zoomGrp, 3, 'Large Zoom In/Out',
        [KeyCodes.PAGE_UP, 'or', KeyCodes.PAGE_DOWN]);
    controls.addControl(zoomGrp, 3, 'Zoom In/Out', null, ['+', '/', '=', 'or', '-', '/', '_']);

    if (this.is3DSupported() && !this.failPerformanceCaveat()) {
      var grp3D = '3D Controls';
      controls = Controls.getInstance();
      controls.addControl(grp3D, 4, 'Tilt Globe',
          null, [Controls.MOUSE.MIDDLE_MOUSE, 'or', Controls.MOUSE.RIGHT_MOUSE, '+',
            Controls.FONT.VERTICAL]);
      controls.addControl(grp3D, 4, 'Roll Globe',
          null, [Controls.MOUSE.MIDDLE_MOUSE, 'or', Controls.MOUSE.RIGHT_MOUSE, '+',
            Controls.FONT.HORIZONTAL]);
      controls.addControl(grp3D, 4, 'Tilt Globe',
          [KeyCodes.SHIFT, '+'], [Controls.FONT.UP, 'or', Controls.FONT.DOWN]);
      controls.addControl(grp3D, 4, 'Roll Globe',
          [KeyCodes.SHIFT, '+'], [Controls.FONT.LEFT, 'or', Controls.FONT.RIGHT]);
      controls.addControl(grp3D, 4, 'Reset Roll', [KeyCodes.N]);
      controls.addControl(grp3D, 4, 'Reset Tilt', [KeyCodes.U]);
    }
  }

  /**
   * Callback for when application settings have been loaded.
   */
  init() {
    loadProjections();

    // register a check function to detect projection differences before layer commands go
    // on the stack
    CommandProcessor.getInstance().registerCheckFunction(projSwitch.checkCommand);

    // set up interpolation
    setInterpolateConfig(/** @type {Object<string, *>} */ (Settings.getInstance().get('interpolation')));

    // do not make this a {@link os.source.Vector}. the drawing layer should not respond to normal interactions like
    // selection/highlight. it is intended for features that are externally styled/managed.
    this.drawingLayer_ = new Drawing({
      source: new OLVectorSource()
    });

    this.drawingLayer_.setTitle('Drawing Layer');
    this.drawingLayer_.setId(MapContainer.DRAW_ID);
    this.drawingLayer_.setProvider(getAppName() || null);
    this.drawingLayer_.setStyle(osStyle.StyleManager.getInstance().getOrCreateStyle(osStyle.DEFAULT_VECTOR_CONFIG));
    this.drawingLayer_.setOSType(LayerType.REF);
    this.drawingLayer_.setExplicitType('');
    this.drawingLayer_.setRemovable(false);
    this.drawingLayer_.setDoubleClickHandler(null);
    this.drawingLayer_.setLayerUI('');
    this.drawingLayer_.setSticky(true);
    this.drawingLayer_.setSynchronizerType(SynchronizerType.DRAW);
    this.drawingLayer_.renderLegend = noop;
    this.drawingLayer_.set(RecordField.ALTITUDE_MODE, AltitudeMode.CLAMP_TO_GROUND);

    var tileGroup = new Group();
    tileGroup.setPriority(-2);
    tileGroup.setCheckFunc(MapContainer.isTileLayer);
    tileGroup.setOSType(LayerType.TILES);

    var imageGroup = new Group({
      hidden: true
    });
    imageGroup.setPriority(-1);
    imageGroup.setCheckFunc(MapContainer.isImageLayer);
    imageGroup.setOSType(LayerType.IMAGE);

    var vectorGroup = new Group({
      layers: [this.drawingLayer_]
    });
    vectorGroup.setCheckFunc(MapContainer.isVectorLayer);
    vectorGroup.setOSType(LayerType.FEATURES);

    var vectorTileGroup = new Group();
    vectorTileGroup.setCheckFunc(MapContainer.isVectorTileLayer);
    vectorTileGroup.setOSType(LayerType.VECTOR_TILES);

    var referenceGroup = new Group();
    referenceGroup.setPriority(100);
    referenceGroup.setOSType(LayerType.REF);

    osMap.PROJECTION = olProj.get(/** @type {string} */ (
      Settings.getInstance().get(osMap.PROJECTION_KEY, osMap.PROJECTION.getCode())));

    osMap.TILEGRID = createForProjection(
        osMap.PROJECTION, ol.DEFAULT_MAX_ZOOM, [512, 512]);
    osMap.MIN_RESOLUTION = osMap.zoomToResolution(osMap.MAX_ZOOM, osMap.PROJECTION);
    osMap.MAX_RESOLUTION = osMap.zoomToResolution(osMap.MIN_ZOOM, osMap.PROJECTION);

    const enableReprojection = /** @type {boolean} */ (Settings.getInstance().get('enableReprojection', true));
    setEnableRasterReprojection(enableReprojection);

    // try restoring values from settings, otherwise fall back on defaults
    var mapCenter = osMap.DEFAULT_CENTER;
    var mapZoom = osMap.DEFAULT_ZOOM;

    var view = new View({
      projection: osMap.PROJECTION,
      center: mapCenter,
      zoom: mapZoom,
      minZoom: osMap.MIN_ZOOM,
      maxZoom: osMap.MAX_ZOOM
    });

    this.map_ = new OSMap({
      controls: this.controlFunction_ ? this.controlFunction_() : undefined,
      interactions: this.interactionFunction_ ? this.interactionFunction_() : undefined,
      layers: new Collection([
        tileGroup,
        imageGroup,
        vectorTileGroup,
        vectorGroup,
        referenceGroup
      ]),
      // prevents a blank map while flyTo animates
      loadTilesWhileAnimating: true,
      renderer: Type.CANVAS,
      target: MapContainer.TARGET,
      view: view,
      keyboardEventTarget: document
    });

    // update labels when the view resolution changes
    olEvents.listen(view, ObjectEventType.PROPERTYCHANGE, this.onViewChange_, this);

    // export the map's getPixelFromCoordinate/getCoordinateFromPixel methods for tests
    window['pfc'] = this.map_.getPixelFromCoordinate.bind(this.map_);
    window['cfp'] = this.map_.getCoordinateFromPixel.bind(this.map_);
    window['fte'] = this.flyToExtent.bind(this);

    // update the map canvas size on browser resize
    this.vsm_.listen(GoogEventType.RESIZE, this.updateSize, false, this);

    // let the stack clear before updating the map size to fit the window
    nextTick(this.updateSize, this);

    var vp = this.getMap().getViewport();
    googEvents.listen(vp, GoogEventType.CONTEXTMENU, killEvent, true);
    googEvents.listen(vp, GoogEventType.CLICK, this.fixFocus_, false, this);

    // initialize the background color
    var bgColor = /** @type {string} */ (Settings.getInstance().get(DisplaySetting.BG_COLOR, '#000000'));
    this.setBGColor(bgColor);

    this.dispatchEvent(MapEvent.MAP_READY);

    this.initSettings();

    this.addHelpControls_();

    // Replace {pos:lat} or {pos:lon} variables with the current view center
    VariableReplacer.add('pos', MapContainer.replacePos_);

    // Replace variables like {extent:north}

    // this one always keeps left less than right, but can use longitudes outside of [-180, 180]
    // when crossing the date line
    VariableReplacer.add('extent', MapContainer.replaceExtent_);

    // this one always keeps normalized longitudes, but the left can be greater than the right
    // when crossing the date line
    VariableReplacer.add('extent2', MapContainer.replaceExtentNormalized_);
  }

  /**
   * Toggle if the Openlayers canvas is displayed.
   *
   * @param {boolean} shown If the canvas should be displayed.
   * @protected
   */
  toggle2DCanvas(shown) {
    var viewport = this.map_ ? this.map_.getViewport() : undefined;
    var olCanvas = viewport ? viewport.querySelector('canvas') : undefined;
    if (olCanvas) {
      olCanvas.style.visibility = shown ? '' : 'hidden';
    }
  }

  /**
   * Initializes settings and adds listeners for settings changes.
   *
   * @protected
   */
  initSettings() {
    Settings.getInstance().listen(DisplaySetting.MAP_MODE, this.onMapModeChange_, false, this);

    var mapMode = Settings.getInstance().get(DisplaySetting.MAP_MODE, MapMode.VIEW_3D);
    if (mapMode === MapMode.VIEW_3D || mapMode === MapMode.AUTO) {
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

  /**
   * Initializes camera settings.
   *
   * @protected
   */
  initCameraSettings() {
    var cameraState =
      /** @type {osx.map.CameraState|undefined} */ (Settings.getInstance().get(DisplaySetting.CAMERA_STATE));

    // if a camera state was saved to settings, restore it now
    if (cameraState) {
      this.restoreCameraState(cameraState);
    }
  }

  /**
   * Handle view toggle from a settings change.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onMapModeChange_(event) {
    if (typeof event.newVal === 'string') {
      var mode = /** @type {MapMode} */ (event.newVal);
      var useWebGL = mode === MapMode.VIEW_3D || mode === MapMode.AUTO ? true : false;
      if (useWebGL != this.is3DEnabled()) {
        this.setWebGLEnabled(useWebGL);
      }
    } else {
      log.warning(logger, 'Unrecognized map mode change value: ' + event.newVal);
    }
  }

  /**
   * Handle view toggle from the context menu.
   *
   * @private
   */
  onToggleView_() {
    if (this.isInitializingWebGL()) {
      return;
    }

    var useWebGL = !this.is3DEnabled();

    // prompt the user if they try to enable WebGL and it isn't supported
    if (useWebGL) {
      if (this.failPerformanceCaveat()) {
        var preventOverride =
          /** @type {boolean} */ (Settings.getInstance().get('webgl.performanceCaveat.preventOverride', false));

        launchWebGLPerfCaveatDialog('3D Globe Performance Issue',
            preventOverride ? undefined : this.overrideFailIfPerformanceCaveat.bind(this));
      }
    }

    var code = osMap.PROJECTION.getCode();
    if (!useWebGL || code === EPSG4326 || code === EPSG3857) {
      var cmd = new ToggleWebGL(useWebGL);
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }

  /**
   * User opts to override the performance
   */
  overrideFailIfPerformanceCaveat() {
    this.overrideFailIfMajorPerformanceCaveat_ = true;
    this.setWebGLEnabled(true);
  }

  /**
   * Save the map mode to settings.
   *
   * @private
   */
  saveMapMode_() {
    var mode = this.is3DEnabled() ? MapMode.VIEW_3D : MapMode.VIEW_2D;
    Settings.getInstance().set(DisplaySetting.MAP_MODE, mode);
  }

  /**
   * Persist the camera state to an object.
   *
   * @return {!osx.map.CameraState}
   */
  persistCameraState() {
    if (this.is3DEnabled()) {
      var camera = this.getWebGLCamera();
      if (camera) {
        return camera.persist();
      }
    }

    // persist from the 2D view if 3D isn't enabled, or camera isn't defined
    var view = this.getMap().getView();
    assert(!!view, 'view not defined');

    // always translate the center point to EPSG:4326
    var center = view.getCenter() || osMap.DEFAULT_CENTER;
    if (osMap.PROJECTION != EPSG4326) {
      center = olProj.toLonLat(center, osMap.PROJECTION);
      center[0] = normalizeLongitude(center[0], undefined, undefined, EPSG4326);
    }

    var resolution = view.getResolution();
    assert(resolution != null, 'resolution not defined');
    var sizeObj = this.getMap().getSize();
    var altitude = osMap.distanceForResolution([sizeObj[0], sizeObj[1]], resolution);
    var zoom = this.resolutionToZoom(resolution, 1);
    var rotation = toDegrees(view.getRotation() || 0);

    return /** @type {!osx.map.CameraState} */ ({
      center: center,
      altitude: altitude,
      heading: -rotation,
      roll: 0,
      tilt: 0,
      zoom: zoom
    });
  }

  /**
   * Restore the camera state.
   *
   * @param {!osx.map.CameraState} cameraState
   */
  restoreCameraState(cameraState) {
    if (this.restoreCameraDelay_) {
      googDispose(this.restoreCameraDelay_);
    }

    this.restoreCameraDelay_ = new ConditionalDelay(this.restoreCameraStateInternal_.bind(this, cameraState));
    this.restoreCameraDelay_.start(100, 5000);
  }

  /**
   * Restore the camera state.
   *
   * @param {!osx.map.CameraState} cameraState
   * @return {boolean}
   * @private
   */
  restoreCameraStateInternal_(cameraState) {
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
      assert(view !== undefined);

      var zoom = cameraState.zoom;
      if (zoom == null) {
        // check if the view extent is available, or {@link osMap.resolutionForDistance} will fail
        var viewExtent = this.getViewExtent();
        if (olExtent.equals(viewExtent, osMap.ZERO_EXTENT)) {
          return false;
        }

        var resolution = osMap.resolutionForDistance(this.getMap(), cameraState.altitude);

        // if the calculated resolution is NaN, the map isn't ready (size is probably updating)
        if (isNaN(resolution)) {
          return false;
        }

        zoom = this.resolutionToZoom(resolution);
      }

      // camera state is saved in EPSG:4326
      var center = olProj.fromLonLat(cameraState.center, osMap.PROJECTION);
      view.setCenter(center);
      view.setRotation(toRadians(-cameraState.heading));
      view.setZoom(zoom);
    } catch (e) {
      log.error(logger, 'Error restoring camera state:', e);
    }

    return true;
  }

  /**
   * Gets the altitude of the current map view in meters.
   *
   * @return {number} The altitude in meters.
   */
  getAltitude() {
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
      altitude = osMap.distanceForResolution([sizeObj[0], sizeObj[1]], resolution);
    }

    return altitude;
  }

  /**
   * If the map container is initializing the WebGL renderer.
   *
   * @return {boolean}
   */
  isInitializingWebGL() {
    return this.initializingWebGL_;
  }

  /**
   * Set if the map container is initializing the WebGL renderer.
   *
   * @param {boolean} value If WebGL is being initialized.
   * @protected
   */
  setInitializingWebGL(value) {
    if (this.initializingWebGL_ != value) {
      this.initializingWebGL_ = value;
      this.dispatchEvent(new PropertyChangeEvent(MapChange.INIT3D, value));
    }
  }

  /**
   * Enable/disable the WebGL renderer.
   *
   * @param {boolean} enabled If the WebGL renderer should be enabled.
   * @param {boolean=} opt_silent If errors should be ignored.
   * @return {!goog.Thenable}
   */
  setWebGLEnabled(enabled, opt_silent) {
    var code = osMap.PROJECTION.getCode();
    enabled = enabled && (code === EPSG4326 || code === EPSG3857);

    // change the view if different than current
    if (enabled != this.is3DEnabled() && this.webGLRenderer_ && !this.isInitializingWebGL()) {
      if (enabled && this.is3DSupported() && !this.failPerformanceCaveat() && !this.webGLRenderer_.isInitialized()) {
        // initialize the WebGL renderer
        this.setInitializingWebGL(true);

        return this.webGLRenderer_.initialize().then(() => {
          // initialize succeeded - call again to activate WebGL
          this.setInitializingWebGL(false);
          this.setWebGLEnabled(enabled, opt_silent);
        }, () => {
          // initialize failed - disable 3D support and call again to report the WebGL error
          this.setInitializingWebGL(false);
          this.is3DSupported_ = false;
          this.setWebGLEnabled(enabled, opt_silent);
        });
      }

      this.setWebGLEnabled_(enabled);

      if (!enabled) {
        //
        // The OpenLayers canvas renderer goes down a less optimal path when rotation is non-zero. Resetting to 0 when
        // switching to 2D may be desirable for performance reasons, but preserving the view is the preferred default
        // behavior.
        //
        // Change this value to true in admin/user settings to reset rotation when switching to 2D.
        //
        // @see {@link ol.renderer.canvas.Layer#composeFrame}
        //
        const resetRotation = Settings.getInstance().get(DisplaySetting.RESET_ROTATION_2D, false);
        if (resetRotation) {
          this.resetRotation();
        }

        // Use the default fly to features behavior.
        osFeature.flyToOverride = undefined;
      } else {
        // reset all synchronizers to a clean state. this needs to be called after WebGL is enabled/rendering to ensure
        // synchronized objects are reset in the correct state.
        this.webGLRenderer_.resetSync();

        // Use the WebGL renderer when flying to feature for a more accurate 3D view.
        osFeature.flyToOverride = this.webGLRenderer_.flyToFeatures.bind(this.webGLRenderer_);
      }

      this.dispatchEvent(OSEventType.MAP_MODE);
    }

    if (this.is3DEnabled() != enabled && !this.failPerformanceCaveat() && !this.isInitializingWebGL() && !opt_silent) {
      // if we tried enabling WebGL and it isn't supported or enabling failed, disable support and display an error
      this.is3DSupported_ = false;
      launchWebGLSupportDialog('3D Globe Not Supported');

      Metrics.getInstance().updateMetric(metrics.keys.Map.WEBGL_FAILED, 1);
    }

    // save the current map mode to settings after the stack clears. this will prevent conflicts with Angular caused by
    // failed changes in settings.
    setTimeout(this.saveMapMode_.bind(this), 0);

    return Promise.resolve();
  }

  /**
   * Internal call to enable/disable the WebGL renderer, once it has been initialized.
   *
   * @param {boolean} value If the WebGL renderer should be enabled.
   * @private
   */
  setWebGLEnabled_(value) {
    if (this.webGLRenderer_ && this.webGLRenderer_.isInitialized() && this.is3DSupported_) {
      this.webGLRenderer_.setEnabled(value);

      var metricKey = value ? metrics.keys.Map.MODE_3D : metrics.keys.Map.MODE_2D;
      Metrics.getInstance().updateMetric(metricKey, 1);

      this.dispatchEvent(new PropertyChangeEvent(MapChange.VIEW3D, value));
    }
  }

  /**
   * If the WebGL renderer is the active view.
   *
   * @return {boolean}
   */
  is3DEnabled() {
    return !!this.webGLRenderer_ && this.webGLRenderer_.getEnabled();
  }

  /**
   * Checks if WebGL is supported by the browser.
   *
   * @return {boolean}
   */
  is3DSupported() {
    if (this.is3DSupported_ == undefined) {
      // use the OS function by default. if WebGL is supported and the renderer fails to load, we'll flip it to false.
      this.is3DSupported_ = isWebglSupported();

      if (!this.is3DSupported_) {
        Metrics.getInstance().updateMetric(metrics.keys.Map.WEBGL_UNSUPPORTED, 1);
      }
    }

    return this.is3DSupported_ && this.webGLRenderer_ != null;
  }

  /**
   * Checks if WebGL will be rendered with degraded performance
   *
   * @return {boolean|undefined|null}
   */
  failPerformanceCaveat() {
    if (this.overrideFailIfMajorPerformanceCaveat_) {
      return false;
    } else {
      if (this.hasPerformanceCaveat_ == undefined) {
        var failIfMajorPerformanceCaveat_ =
          /** @type {boolean} */ (Settings.getInstance().get('webgl.performanceCaveat.failIf', false));
        this.hasPerformanceCaveat_ = failIfMajorPerformanceCaveat_ ?
          hasPerformanceCaveat() : false;
        if (this.hasPerformanceCaveat_) {
          Metrics.getInstance().updateMetric(metrics.keys.Map.WEBGL_PERFORMANCE_CAVEAT, 1);
        }
      }

      return this.hasPerformanceCaveat_;
    }
  }

  /**
   * Set the background color for the map.
   *
   * @param {string} color The new color.
   * @protected
   */
  setBGColor(color) {
    $('#map-container').css('background', color);
  }

  /**
   * Adds a layer to the map
   *
   * @param {!(ILayer|ol.layer.Layer)} layer The layer to add
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  addLayer(layer) {
    if (this.map_ && layer instanceof Layer) {
      if (!projSwitch.checkLayer(layer)) {
        return;
      }
      var layers = this.map_.getLayers();

      for (var i = 0, n = layers.getLength(); i < n; i++) {
        var item = layers.item(i);

        if (item instanceof Group) {
          var group = /** @type {Group} */ (item);
          var chk = group.getCheckFunc();

          if (chk && chk(layer)) {
            group.getLayers().push(layer);

            var event = new LayerEvent(LayerEventType.ADD, layer);
            this.dispatchEvent(event);
            dispatcher.getInstance().dispatchEvent(event);

            this.recordLayerMetric_(layer, true);

            if (layer instanceof AnimatedTile) {
              var om = OnboardingManager.getInstance();
              if (om && group.getOSType() != LayerType.REF) {
                om.displayOnboarding(ROOT + 'onboarding/loaddata.json');
              }
            }

            var z = ZOrder.getInstance();
            if (group.getOSType() == LayerType.FEATURES) {
              z.moveHighestAndUpdate(/** @type {ILayer} */ (layer).getId());
              z.save();
            } else {
              z.update();
              z.save();
            }

            return;
          }
        }
      }

      log.warning(logger, 'No layer group was found to support ' + layer);
    }
  }

  /**
   * Records metrics for layer add/remove.
   *
   * @param {!(ILayer|ol.layer.Layer)} layer The layer being added/removed
   * @param {boolean} add ture if adding, otherwise false.
   * @private
   */
  recordLayerMetric_(layer, add) {
    if (add) {
      Metrics.getInstance().updateMetric(metrics.keys.Map.ADD_LAYER, 1);
    } else {
      Metrics.getInstance().updateMetric(metrics.keys.Map.REMOVE_LAYER, 1);
    }

    Metrics.getInstance().updateMetric(metrics.keys.Map.LAYER_COUNT, this.map_.getLayers().getLength());
  }

  /**
   * Adds a layer group to the map
   *
   * @param {!Group} group
   */
  addGroup(group) {
    if (this.map_) {
      var layers = this.map_.getLayers();

      // get the proper index to maintain sort
      var i = binarySelect(layers.getArray(), function(el, i, arr) {
        return MapContainer.compareGroups_(group, /** @type {Group} */ (el));
      });

      // see the docs for binarySelect
      if (i < 0) {
        i = Math.abs(i + 1);
        layers.insertAt(i, group);
      }
      // otherwise it is already in the collection
    }
  }

  /**
   * Removes a layer from the map
   *
   * @param {!(ILayer|ol.layer.Layer|string)} layer
   * @param {boolean=} opt_dispose If the layer should be disposed. Defaults to true.
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  removeLayer(layer, opt_dispose) {
    var dispose = opt_dispose != null ? opt_dispose : true;
    var l = typeof layer === 'string' ? this.getLayer(layer) : layer;

    if (l instanceof Layer) {
      var canRemove = true;

      try {
        canRemove = /** @type {ILayer} */ (l).isRemovable();
      } catch (e) {
      }

      if (canRemove) {
        l = this.getLayer(l, null, true);

        if (l) {
          var event = new LayerEvent(LayerEventType.REMOVE, l);
          this.dispatchEvent(event);
          dispatcher.getInstance().dispatchEvent(event);

          if (dispose) {
            l.dispose();
          }
          this.recordLayerMetric_(l, false);
        }
      }
    }
  }

  /**
   * Handle remove layer events fired in the application.
   *
   * @param {LayerEvent} event
   * @private
   */
  onRemoveLayerEvent_(event) {
    if (event && event.layer) {
      var layer = /** @type {ILayer} */ (this.getLayer(event.layer));
      if (layer) {
        var remove;
        var descriptor = DataManager.getInstance().getDescriptor(layer.getId());
        if (descriptor) {
          if (descriptor.isActive()) {
            // if the layer is synchronized to the descriptor, use the deactivate command
            remove = new DeactivateDescriptor(descriptor);
          } else {
            // if the descriptor is already inactive, then something must have gone wrong. remove the layer, but log a
            // warning.
            log.warning(logger, 'Descriptor for removed layer "' + layer.getTitle() +
                '" is already inactive.');

            this.removeLayer(/** @type {!ol.layer.Layer} */ (layer));
          }
        }

        var options;
        if (!remove) {
          // if there wasn't a descriptor or a remove command was not created, then create one
          options = layer.getLayerOptions();

          if (options && 'id' in options) {
            remove = new LayerRemove(options);

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
            CommandProcessor.getInstance().addCommand(remove);
          }
        } else {
          // no command - try to remove the layer anyway
          this.removeLayer(/** @type {!ol.layer.Layer} */ (layer));
        }
      }
    }
  }

  /**
   * @inheritDoc
   * @export Prevent the compiler from moving the function off the prototype.
   */
  addFeature(feature, opt_style) {
    if (feature != undefined) {
      Metrics.getInstance().updateMetric(metrics.keys.Map.ADD_FEATURE, 1);
      if (!(feature instanceof Feature)) {
        // created in another context
        feature = cloneFeature(feature, [RecordField.DRAWING_LAYER_NODE]);
      }

      if (typeof opt_style === 'object') {
        // if created externally, clone the style config
        var style = opt_style instanceof Object ? opt_style : unsafeClone(opt_style);
        feature.set(StyleType.FEATURE, style);
        osStyle.setFeatureStyle(feature);
      }

      var drawLayer = this.getLayer(MapContainer.DRAW_ID);
      if (drawLayer) {
        // make sure the feature has an id or we won't be able to look it up for removal
        if (!feature.getId()) {
          feature.setId(ol.getUid(feature));
        }

        // set the layer id so we can look up the layer
        feature.set(RecordField.SOURCE_ID, /** @type {ILayer} */ (drawLayer).getId());

        var drawSource = drawLayer.getSource();

        if (drawSource instanceof OLVectorSource) {
          interpolateFeature(feature);
          drawSource.addFeature(feature);
          return feature;
        }
      }
    }

    return undefined;
  }

  /**
   * @inheritDoc
   * @export Prevent the compiler from moving the function off the prototype.
   */
  addFeatures(features, opt_style) {
    var added = [];
    Metrics.getInstance().updateMetric(metrics.keys.Map.ADD_FEATURES, 1);
    for (var i = 0, n = features.length; i < n; i++) {
      var addedFeature = this.addFeature(features[i], opt_style);
      if (addedFeature) {
        added.push(addedFeature);
      }
    }

    return added;
  }

  /**
   * @inheritDoc
   * @export Prevent the compiler from moving the function off the prototype.
   */
  removeFeature(feature, opt_dispose) {
    if (feature != null) {
      Metrics.getInstance().updateMetric(metrics.keys.Map.REMOVE_FEATURE, 1);
      var layer = this.getLayer(MapContainer.DRAW_ID);
      if (layer != null) {
        var source = /** @type {OLVectorSource} */ (layer.getSource());
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
  }

  /**
   * @inheritDoc
   */
  containsFeature(feature) {
    if (feature != null) {
      var layer = this.getLayer(MapContainer.DRAW_ID);

      if (layer) {
        var source = /** @type {OLVectorSource} */ (layer.getSource());

        return !!(typeof feature === 'string' || typeof feature === 'number' ? source.getFeatureById(feature) :
          source.getFeatureById(feature.getId() + ''));
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   * @export Prevent the compiler from moving the function off the prototype.
   */
  removeFeatures(features, opt_dispose) {
    Metrics.getInstance().updateMetric(metrics.keys.Map.REMOVE_FEATURES, 1);
    for (var i = 0, n = features.length; i < n; i++) {
      this.removeFeature(features[i], opt_dispose);
    }
  }

  /**
   * Gets the array of features in the drawing layer.
   *
   * @return {Array<Feature>}
   */
  getFeatures() {
    return this.drawingLayer_ ? this.drawingLayer_.getSource().getFeatures() : [];
  }

  /**
   * Gets the reference to the drawing layer.
   *
   * @return {ol.layer.Layer}
   */
  getDrawingLayer() {
    return this.drawingLayer_;
  }

  /**
   * Gets an array of layers ordered from top to bottom
   *
   * @return {!Array<!ol.layer.Layer>}
   */
  getLayers() {
    var layers = [];

    if (this.map_) {
      var l = this.map_.getLayers().getArray();

      for (var i = 0, n = l.length; i < n; i++) {
        if (instanceOf(l[i], LayerGroup.NAME)) {
          layers = layers.concat(/** @type {ol.layer.Group} */ (l[i]).getLayers().getArray());
        } else {
          layers.push(/** @type {ol.layer.Layer} */ (l[i]));
        }
      }
    }

    layers.reverse();
    return layers;
  }

  /**
   * Count the number of active map layers matching a class.
   *
   * @param {!Object} clazz The layer class
   * @return {number} The layer count
   */
  getLayerCount(clazz) {
    var layers = this.getLayers();
    return layers.reduce(function(previousValue, currentValue, index, array) {
      return currentValue instanceof clazz ? previousValue + 1 : previousValue;
    }, 0);
  }

  /**
   * @inheritDoc
   */
  getLayer(layerOrFeature, opt_search, opt_remove) {
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

        if (item instanceof Group) {
          l = this.getLayer(layerOrFeature, /** @type {Group} */ (item).getLayers(), opt_remove);
        } else {
          try {
            if (typeof layerOrFeature === 'string') {
              var lid = /** @type {ILayer} */ (item).getId();
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
            } else if (layerOrFeature instanceof Feature) {
              var src = /** @type {ol.layer.Layer} */ (item).getSource();

              if (src instanceof OLVectorSource &&
                  src.getFeatureById(/** @type {Feature} */ (layerOrFeature).getId() || '')) {
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
  }

  /**
   * @param {function():Collection} controlFunction
   */
  setControlFunction(controlFunction) {
    this.controlFunction_ = controlFunction;
  }

  /**
   * @param {function():Collection} interactionFunction
   */
  setInteractionFunction(interactionFunction) {
    this.interactionFunction_ = interactionFunction;
  }

  /**
   * Gets the resolution for the given zoom level
   *
   * @param {number} zoom
   * @return {number} resolution (degrees per pixel)
   */
  zoomToResolution(zoom) {
    var projection = this.getMap().getView().getProjection();
    return osMap.zoomToResolution(zoom, projection);
  }

  /**
   * Gets the zoom level from the given resolution
   *
   * @param {number} resolution
   * @param {number=} opt_precision The decimal precision
   * @return {number} zoom
   */
  resolutionToZoom(resolution, opt_precision) {
    var projection = this.getMap().getView().getProjection();
    return osMap.resolutionToZoom(resolution, projection, opt_precision);
  }

  /**
   * Whether or not the given value is a tile layer.
   *
   * @param {*} layer The value to test.
   * @return {boolean}
   */
  static isTileLayer(layer) {
    return layer instanceof Tile;
  }

  /**
   * Whether or not the given value is a vector layer.
   *
   * @param {*} layer The value to test.
   * @return {boolean}
   */
  static isVectorLayer(layer) {
    return layer instanceof OLVectorLayer && !MapContainer.isImageLayer(layer) &&
        !MapContainer.isVectorTileLayer(layer);
  }

  /**
   * Whether or not the given value is a vector tile layer.
   *
   * @param {*} layer The value to test.
   * @return {boolean}
   */
  static isVectorTileLayer(layer) {
    return layer instanceof VectorTile;
  }

  /**
   * Whether or not the given value is an image layer.
   *
   * @param {*} layer The value to test.
   * @return {boolean}
   */
  static isImageLayer(layer) {
    return layer instanceof ImageLayer ||
        (layer instanceof VectorLayer && layer.getOSType() === LayerType.IMAGE);
  }

  /**
   * Compares groups by priority
   *
   * @param {Group} a
   * @param {os.layer.Group} b
   * @return {number}
   * @private
   */
  static compareGroups_(a, b) {
    return defaultCompare(a.getPriority(), b.getPriority());
  }

  /**
   * @param {string} match
   * @param {string} submatch
   * @param {number} offset
   * @param {string} str
   * @return {string}
   * @private
   */
  static replacePos_(match, submatch, offset, str) {
    var center = MapContainer.getInstance().getMap().getView().getCenter();

    if (center) {
      center = olProj.toLonLat(center, osMap.PROJECTION);
    }

    return (submatch.indexOf('a') > -1 ? center[1] : center[0]).toString();
  }

  /**
   * @param {string} match
   * @param {string} submatch
   * @param {number} offset
   * @param {string} str
   * @return {string}
   * @private
   */
  static replaceExtent_(match, submatch, offset, str) {
    var extent = olProj.transformExtent(
        MapContainer.getInstance().getMap().getExtent(),
        osMap.PROJECTION,
        EPSG4326);
    return MapContainer.replaceExtentInternal_(extent, match, submatch, offset, str);
  }

  /**
   * @param {ol.Extent} extent
   * @param {string} match
   * @param {string} submatch
   * @param {number} offset
   * @param {string} str
   * @return {string}
   * @private
   */
  static replaceExtentInternal_(extent, match, submatch, offset, str) {
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
  }

  /**
   * @param {string} match
   * @param {string} submatch
   * @param {number} offset
   * @param {string} str
   * @return {string}
   * @private
   */
  static replaceExtentNormalized_(match, submatch, offset, str) {
    var extent = MapContainer.getInstance().getMap().getExtent();

    extent = olProj.transformExtent(extent, osMap.PROJECTION, EPSG4326);
    extent = normalizeExtent(extent, undefined, undefined, EPSG4326);
    return MapContainer.replaceExtentInternal_(extent, match, submatch, offset, str);
  }

  /**
   * Get the global instance.
   * @return {!MapContainer}
   */
  static getInstance() {
    if (!instance) {
      instance = new MapContainer();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {MapContainer} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {MapContainer|undefined}
 */
let instance;


// install the requestAnimationFrame polyfill
installPolyfill();


/**
 * The ID for the drawing layer
 * @type {string}
 * @const
 */
MapContainer.DRAW_ID = Drawing.ID;


/**
 * The map target element id.
 * @type {string}
 * @const
 */
MapContainer.TARGET = 'map-container';


/**
 * @type {number}
 * @const
 */
MapContainer.FLY_ZOOM_DURATION = 1000;


/**
 * @type {number}
 * @private
 * @const
 */
MapContainer.FLY_ZOOM_BUFFER_ = 0.025;


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.MapContainer');


exports = MapContainer;
