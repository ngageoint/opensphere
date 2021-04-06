goog.module('plugin.cesium.sync.TileSynchronizer');
goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const MapContainer = goog.require('os.MapContainer');
const asserts = goog.require('goog.asserts');
const Delay = goog.require('goog.async.Delay');
const EventType = goog.require('goog.events.EventType');
const googString = goog.require('goog.string');
const TileWMS = goog.require('ol.source.TileWMS');
const MapEvent = goog.require('os.MapEvent');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const osLayer = goog.require('os.layer');
const AnimatedTile = goog.require('os.layer.AnimatedTile');
const PropertyChange = goog.require('os.layer.PropertyChange');
const osMap = goog.require('os.map');
const events = goog.require('os.ol.events');
const ImageryProvider = goog.require('plugin.cesium.ImageryProvider');
const CesiumSynchronizer = goog.require('plugin.cesium.sync.CesiumSynchronizer');


/**
 * Synchronizes a single OpenLayers tile layer to Cesium.
 *
 * @extends {CesiumSynchronizer.<osLayer.Tile>}
 */
class TileSynchronizer extends CesiumSynchronizer {
  /**
   * Constructor.
   * @param {!osLayer.Tile} layer The OpenLayers tile layer.
   * @param {!ol.PluggableMap} map The OpenLayers map.
   * @param {!Cesium.Scene} scene The Cesium scene.
   */
  constructor(layer, map, scene) {
    super(layer, map, scene);

    /**
     * @type {Cesium.ImageryLayerCollection}
     * @private
     */
    this.cesiumLayers_ = scene.imageryLayers;

    /**
     * @type {Cesium.ImageryLayer}
     * @private
     */
    this.activeLayer_ = null;

    /**
     * @type {Object<string, Cesium.ImageryLayer>}
     * @private
     */
    this.animationCache_ = null;

    /**
     * The last z-order start index for the layer.
     * @type {number}
     * @private
     */
    this.lastStart_ = -1;

    /**
     * Delay to debounce synchronize calls.
     * @type {Delay}
     * @private
     */
    this.syncDelay_ = new Delay(this.synchronizeInternal, 50, this);

    var view = MapContainer.getInstance().getMap().getView();
    if (view) {
      ol.events.listen(view, 'change:resolution', this.onZoomChange_, this);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    goog.dispose(this.syncDelay_);
    this.syncDelay_ = null;

    var view = MapContainer.getInstance().getMap().getView();
    if (view) {
      ol.events.unlisten(view, 'change:resolution', this.onZoomChange_, this);
    }

    ol.events.unlisten(this.layer, EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

    this.disposeSingle_();
    this.disposeCache_();

    this.cesiumLayers_ = null;

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  synchronize() {
    if (this.syncDelay_) {
      this.syncDelay_.start();
    }
  }

  /**
   * Synchronize the tile layer.
   *
   * @protected
   */
  synchronizeInternal() {
    // clean up existing layers
    this.disposeSingle_();
    this.disposeCache_();

    // create the base layer
    this.createSingle_();

    if (this.layer instanceof AnimatedTile && this.layer.getAnimationEnabled()) {
      // for animation layers, enable the layer cache if the timeline is up
      this.createCache_();
    }
  }

  /**
   * @inheritDoc
   */
  reset() {
    // nothing to do yet
  }

  /**
   * Handles min/max zoom
   *
   * @param {goog.events.Event=} opt_evt
   * @private
   */
  onZoomChange_(opt_evt) {
    if (this.layer && this.activeLayer_ && !this.animationCache_) {
      var proj = this.view.getProjection();
      var current = this.view.getResolution();
      var min = this.layer.getMinResolution();
      var max = this.layer.getMaxResolution();

      min = min !== undefined ? min : osMap.zoomToResolution(42, proj);
      max = max !== undefined ? max : osMap.zoomToResolution(1, proj);

      var maxZoom = osMap.resolutionToZoom(min, proj);
      // for layers with a max zoom of 20 or greater, we will assume that they should just stay on indefinitely as
      // the user zooms in (since they are probably last in the base map "stack")
      this.activeLayer_.show = (maxZoom >= 20 || min <= current) && current <= max && this.layer.getVisible();
    }
  }

  /**
   * @inheritDoc
   */
  reposition(start, end) {
    if (this.lastStart_ !== start) {
      this.lastStart_ = start;

      if (this.activeLayer_) {
        this.cesiumLayers_.remove(this.activeLayer_, false);
        this.cesiumLayers_.add(this.activeLayer_, start++);
      }

      if (this.animationCache_) {
        for (var key in this.animationCache_) {
          this.cesiumLayers_.remove(this.animationCache_[key], false);
          this.cesiumLayers_.add(this.animationCache_[key], start++);
        }
      }
    } else {
      // the layer is positioned correctly, so return the last index + 1
      start = this.getLastIndex() + 1;
    }

    return start;
  }

  /**
   * Get the first index of this synchronizer's layers in the Cesium imagery layer array.
   *
   * @return {number}
   */
  getFirstIndex() {
    return this.activeLayer_ ? this.cesiumLayers_.indexOf(this.activeLayer_) : -1;
  }

  /**
   * Get the last index of this synchronizer's layers in the Cesium imagery layer array.
   *
   * @return {number}
   */
  getLastIndex() {
    var lastIndex = this.getFirstIndex();
    if (lastIndex > -1 && this.animationCache_) {
      lastIndex += goog.object.getCount(this.animationCache_);
    }

    return lastIndex;
  }

  /**
   * Creates a single Cesium layer to represent the OpenLayers tile layer.
   *
   * @private
   */
  createSingle_() {
    asserts.assert(this.layer != null);
    asserts.assert(this.view != null);

    ol.events.listen(this.layer, EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
    this.activeLayer_ = plugin.cesium.tileLayerToImageryLayer(this.layer, this.view.getProjection());

    if (this.activeLayer_) {
      // update the layer style and add it to the scene
      plugin.cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
      this.onZoomChange_();
      this.cesiumLayers_.add(this.activeLayer_, this.lastStart_ > -1 ? this.lastStart_ : undefined);

      // register listeners to update the layer
      events.listenEach(this.layer, TileSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
      events.listenEach(this.layer, TileSynchronizer.RESOLUTION_KEYS_, this.onZoomChange_, this);
      ol.events.listen(this.layer, 'change:extent', this.synchronize, this);
      ol.events.listen(this.layer, 'change', this.onChange_, this);
    }
  }

  /**
   * Disposes of the single Cesium layer if it exists.
   *
   * @private
   */
  disposeSingle_() {
    ol.events.unlisten(this.layer, EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

    if (this.activeLayer_) {
      // clean up listeners
      events.unlistenEach(this.layer, TileSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
      events.unlistenEach(this.layer, TileSynchronizer.RESOLUTION_KEYS_, this.onZoomChange_,
          this);
      ol.events.unlisten(this.layer, 'change:extent', this.synchronize, this);
      ol.events.unlisten(this.layer, 'change', this.onChange_, this);

      if (this.activeLayer_.imageryProvider instanceof ImageryProvider) {
        this.activeLayer_.imageryProvider.dispose();
      }

      // remove layer from the scene and destroy it
      this.cesiumLayers_.remove(this.activeLayer_, true);
      this.activeLayer_ = null;

      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * Creates Cesium layer cache based on a single OpenLayers tile layer to facilitate tile animation.
   *
   * @private
   */
  createCache_() {
    if (this.activeLayer_ && this.layer.getSource() instanceof TileWMS) {
      // hide the active layer and disable any events that would update it
      this.activeLayer_.show = false;
      events.unlistenEach(this.layer, TileSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
      ol.events.unlisten(this.layer, 'change', this.onChange_, this);

      // create the cache
      this.updateAnimationCache_();

      // update the layer cache when the style changes, or a change event is fired (ie, params/url changed). in the
      // future we may have to clear the cache if something other than the TIME param changes (like user changes to
      // the url) but currently there isn't a way to do that.
      events.listenEach(this.layer, TileSynchronizer.STYLE_KEYS_, this.updateAnimationCache_,
          this);
      ol.events.listen(this.layer, 'change', this.updateAnimationCache_, this);
    }
  }

  /**
   * Disposes of the Cesium tile layer cache.
   *
   * @private
   */
  disposeCache_() {
    // remove cache listeners
    events.unlistenEach(this.layer, TileSynchronizer.STYLE_KEYS_, this.updateAnimationCache_,
        this);
    ol.events.unlisten(this.layer, 'change', this.updateAnimationCache_, this);

    // destroy the cache
    if (this.animationCache_) {
      for (var key in this.animationCache_) {
        this.cesiumLayers_.remove(this.animationCache_[key], true);

        if (this.animationCache_[key].imageryProvider instanceof ImageryProvider) {
          this.animationCache_[key].imageryProvider.dispose();
        }

        delete this.animationCache_[key];
      }

      this.animationCache_ = null;
    }

    // reactivate the active layer and its listeners. the show flag will be determined by layer visibility.
    if (this.layer && this.activeLayer_) {
      plugin.cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
      events.listenEach(this.layer, TileSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
      ol.events.listen(this.layer, 'change', this.onChange_, this);
    }
  }

  /**
   * Caches tile layers for the current timeline window and the tile boundary on either side of the window. Preloading
   * tiles makes them available to the GPU immediately so seamless transition between tiles is possible. While animating,
   * tile layers are cached for each tile boundary within the animation loop.
   *
   * @private
   */
  updateAnimationCache_() {
    var newCache = {};

    // get the current layer from the cache and put it in the new cache
    var timeParam = this.getTimeParameter_(0);
    newCache[timeParam] = this.getCacheLayer_(timeParam, true);

    // hide all of the other layers that aren't the current by setting their alpha to 0
    // this.animationCache_ no longer contains the current layer as the call above removes it
    if (this.animationCache_) {
      for (var key in this.animationCache_) {
        newCache[key] = this.animationCache_[key];
        newCache[key].alpha = 0;
      }
    }

    this.animationCache_ = newCache;
    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * Creates a WMS TIME parameter based on the timeline controller's current start/end, offset by the provided number
   * of timeline durations (ie, day week month). This is a convenience function for creating tile boundaries around
   * the current time window.
   *
   * @param {number} offset The number of timeline durations (day, week, month, etc) to offset this range.
   * @return {string} WMS TIME parameter for the requested offset.
   * @private
   */
  getTimeParameter_(offset) {
    asserts.assertInstanceof(this.layer, AnimatedTile);

    var dateFormat = this.layer.getDateFormat();
    var timeFormat = this.layer.getTimeFormat();
    var duration = this.tlc.getDuration();
    var start = this.tlc.getCurrent() - this.tlc.getOffset();
    var end = this.tlc.getCurrent();

    return AnimatedTile.getTimeParameter(dateFormat, timeFormat,
        os.time.offset(new Date(start), duration, offset).getTime(),
        os.time.offset(new Date(end), duration, offset).getTime(),
        duration);
  }

  /**
   * Caches a layer for the given time and sets the visibility.
   *
   * @param {string} timeParam The TIME param for the layer.
   * @param {boolean} show If the layer should be shown.
   * @return {Cesium.ImageryLayer}
   * @private
   */
  getCacheLayer_(timeParam, show) {
    asserts.assert(this.layer !== null);

    var cesiumLayer = this.animationCache_ ? this.animationCache_[timeParam] : undefined;
    if (!cesiumLayer) {
      // layer doesn't exist, so create it and add it to the scene. insert it after the active layer.
      var activePosition = this.cesiumLayers_.indexOf(this.activeLayer_);
      cesiumLayer = this.getLayerByTime_(timeParam);
      this.cesiumLayers_.add(cesiumLayer, activePosition + 1);
    } else {
      // layer already exists, so remove it from the current cache and return it
      delete this.animationCache_[timeParam];
    }

    plugin.cesium.updateCesiumLayerProperties(this.layer, cesiumLayer);
    cesiumLayer.alpha = show ? (this.layer.getOpacity() || 0) : 0;
    return cesiumLayer;
  }

  /**
   * Creates a Cesium layer representing this synchronizer's layer with a custom time range. This is used when caching
   * multiple time ranges for animation.
   *
   * @param {string} timeParam Time to use for the WMS TIME parameter
   * @return {!Cesium.ImageryLayer} The Cesium imagery layer
   * @private
   * @suppress {accessControls}
   */
  getLayerByTime_(timeParam) {
    asserts.assertInstanceof(this.layer, AnimatedTile);
    asserts.assert(this.view !== null);

    var originalSource = /** @type {TileWMS} */ (this.layer.getSource());
    asserts.assertInstanceof(originalSource, TileWMS);

    var options = this.layer.getLayerOptions();
    // just to be sure, make the ID different
    options['id'] = googString.getRandomString();

    var clone = /** @type {osLayer.Tile} */ (osLayer.createFromOptions(options));
    var source = /** @type {TileWMS} */ (clone.getSource());

    // don't leak the layer and its ties to the source
    clone.setSource(null);
    clone.dispose();

    var params = originalSource.getParams();
    params['TIME'] = timeParam;
    source.updateParams(params);

    var provider = new ImageryProvider(source, null);
    var cesiumLayer = new Cesium.ImageryLayer(provider);
    return cesiumLayer;
  }

  /**
   * Update Cesium layer properties when the style changes.
   *
   * @param {ol.Object.Event} event
   * @private
   */
  onStyleChange_(event) {
    asserts.assert(this.layer !== null);
    asserts.assert(this.activeLayer_ !== null);
    plugin.cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
    this.onZoomChange_();
  }

  /**
   * Handle generic 'change' events on the tile layer.
   *
   * @param {ol.Object.Event} event
   * @private
   */
  onChange_(event) {
    // don't bother re-adding if the layer isn't shown. the change will take effect when the layer is shown again.
    if (this.activeLayer_ && this.activeLayer_.show) {
      // when the source changes, re-add the layer to force update
      var activePosition = this.cesiumLayers_.indexOf(this.activeLayer_);
      if (activePosition >= 0) {
        this.cesiumLayers_.remove(this.activeLayer_, false);
        this.cesiumLayers_.add(this.activeLayer_, activePosition);
      }
    }

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * Handle property change events on the layer.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onLayerPropertyChange_(event) {
    // ol3 also fires 'propertychange' events, so ignore those
    if (event instanceof PropertyChangeEvent) {
      var p = event.getProperty();
      if (p == PropertyChange.ANIMATION_ENABLED) {
        // enable/disable the cache based on the animation state (fired when the timeline is opened/closed)
        var enabled = /** @type {boolean} */ (event.getNewValue());
        if (enabled) {
          this.createCache_();
        } else {
          this.disposeCache_();
        }
      } else if (p == PropertyChange.STYLE) {
        this.synchronize();
      }
    }

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }
}


/**
 * @type {!Array<string>}
 * @const
 * @private
 */
TileSynchronizer.STYLE_KEYS_ = [
  'change:brightness',
  'change:contrast',
  'change:hue',
  'change:opacity',
  'change:saturation',
  'change:visible'
];


/**
 * @type {!Array<string>}
 * @const
 * @private
 */
TileSynchronizer.RESOLUTION_KEYS_ = [
  'change:minResolution',
  'change:maxResolution'
];


exports = TileSynchronizer;
