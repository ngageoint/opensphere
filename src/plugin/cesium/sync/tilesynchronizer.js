goog.provide('plugin.cesium.sync.TileSynchronizer');

goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileWMS');
goog.require('os.MapEvent');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.events.SelectionType');
goog.require('os.layer');
goog.require('os.layer.AnimatedTile');
goog.require('os.layer.PropertyChange');
goog.require('os.map');
goog.require('os.ol.events');
goog.require('os.source.Vector');
goog.require('plugin.cesium.ImageryProvider');
goog.require('plugin.cesium.sync.CesiumSynchronizer');


/**
 * Synchronizes a single OpenLayers tile layer to Cesium.
 * @param {!os.layer.Tile} layer The OpenLayers tile layer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @param {!Cesium.Scene} scene The Cesium scene.
 * @extends {plugin.cesium.sync.CesiumSynchronizer.<os.layer.Tile>}
 * @constructor
 */
plugin.cesium.sync.TileSynchronizer = function(layer, map, scene) {
  plugin.cesium.sync.TileSynchronizer.base(this, 'constructor', layer, map, scene);

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
   * @type {goog.async.Delay}
   * @private
   */
  this.syncDelay_ = new goog.async.Delay(this.synchronizeInternal, 50, this);

  var view = os.MapContainer.getInstance().getMap().getView();
  if (view) {
    ol.events.listen(view, 'change:resolution', this.onZoomChange_, this);
  }
};
goog.inherits(plugin.cesium.sync.TileSynchronizer, plugin.cesium.sync.CesiumSynchronizer);


/**
 * @type {!Array<string>}
 * @const
 * @private
 */
plugin.cesium.sync.TileSynchronizer.STYLE_KEYS_ = [
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
plugin.cesium.sync.TileSynchronizer.RESOLUTION_KEYS_ = [
  'change:minResolution',
  'change:maxResolution'
];


/**
 * @inheritDoc
 */
plugin.cesium.sync.TileSynchronizer.prototype.disposeInternal = function() {
  goog.dispose(this.syncDelay_);
  this.syncDelay_ = null;

  var view = os.MapContainer.getInstance().getMap().getView();
  if (view) {
    ol.events.unlisten(view, 'change:resolution', this.onZoomChange_, this);
  }

  ol.events.unlisten(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

  this.disposeSingle_();
  this.disposeCache_();

  this.cesiumLayers_ = null;

  plugin.cesium.sync.TileSynchronizer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.TileSynchronizer.prototype.synchronize = function() {
  if (this.syncDelay_) {
    this.syncDelay_.start();
  }
};


/**
 * Synchronize the tile layer.
 * @protected
 */
plugin.cesium.sync.TileSynchronizer.prototype.synchronizeInternal = function() {
  // clean up existing layers
  this.disposeSingle_();
  this.disposeCache_();

  // create the base layer
  this.createSingle_();

  if (this.layer instanceof os.layer.AnimatedTile && this.layer.getAnimationEnabled()) {
    // for animation layers, enable the layer cache if the timeline is up
    this.createCache_();
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.TileSynchronizer.prototype.reset = function() {
  // nothing to do yet
};


/**
 * Handles min/max zoom
 * @param {goog.events.Event=} opt_evt
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.onZoomChange_ = function(opt_evt) {
  if (this.layer && this.activeLayer_ && !this.animationCache_) {
    var proj = this.view.getProjection();
    var current = this.view.getResolution();
    var min = this.layer.getMinResolution();
    var max = this.layer.getMaxResolution();

    min = goog.isDef(min) ? min : os.map.zoomToResolution(42, proj);
    max = goog.isDef(max) ? max : os.map.zoomToResolution(1, proj);

    var maxZoom = os.map.resolutionToZoom(min, proj);
    // for layers with a max zoom of 20 or greater, we will assume that they should just stay on indefinitely as
    // the user zooms in (since they are probably last in the base map "stack")
    this.activeLayer_.show = (maxZoom >= 20 || min <= current) && current <= max && this.layer.getVisible();
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.TileSynchronizer.prototype.reposition = function(start, end) {
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
};


/**
 * Get the first index of this synchronizer's layers in the Cesium imagery layer array.
 * @return {number}
 */
plugin.cesium.sync.TileSynchronizer.prototype.getFirstIndex = function() {
  return this.activeLayer_ ? this.cesiumLayers_.indexOf(this.activeLayer_) : -1;
};


/**
 * Get the last index of this synchronizer's layers in the Cesium imagery layer array.
 * @return {number}
 */
plugin.cesium.sync.TileSynchronizer.prototype.getLastIndex = function() {
  var lastIndex = this.getFirstIndex();
  if (lastIndex > -1 && this.animationCache_) {
    lastIndex += goog.object.getCount(this.animationCache_);
  }

  return lastIndex;
};


/**
 * Creates a single Cesium layer to represent the OpenLayers tile layer.
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.createSingle_ = function() {
  goog.asserts.assertInstanceof(this.layer, ol.layer.Tile);
  goog.asserts.assert(!goog.isNull(this.view));

  ol.events.listen(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
  this.activeLayer_ = plugin.cesium.tileLayerToImageryLayer(this.layer, this.view.getProjection());

  if (this.activeLayer_) {
    // update the layer style and add it to the scene
    plugin.cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
    this.onZoomChange_();
    this.cesiumLayers_.add(this.activeLayer_, this.lastStart_ > -1 ? this.lastStart_ : undefined);

    // register listeners to update the layer
    os.ol.events.listenEach(this.layer, plugin.cesium.sync.TileSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
    os.ol.events.listenEach(this.layer, plugin.cesium.sync.TileSynchronizer.RESOLUTION_KEYS_, this.onZoomChange_, this);
    ol.events.listen(this.layer, 'change:extent', this.synchronize, this);
    ol.events.listen(this.layer, 'change', this.onChange_, this);
  }
};


/**
 * Disposes of the single Cesium layer if it exists.
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.disposeSingle_ = function() {
  ol.events.unlisten(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

  if (this.activeLayer_) {
    // clean up listeners
    os.ol.events.unlistenEach(this.layer, plugin.cesium.sync.TileSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
    os.ol.events.unlistenEach(this.layer, plugin.cesium.sync.TileSynchronizer.RESOLUTION_KEYS_, this.onZoomChange_,
        this);
    ol.events.unlisten(this.layer, 'change:extent', this.synchronize, this);
    ol.events.unlisten(this.layer, 'change', this.onChange_, this);

    if (this.activeLayer_.imageryProvider instanceof plugin.cesium.ImageryProvider) {
      this.activeLayer_.imageryProvider.dispose();
    }

    // remove layer from the scene and destroy it
    this.cesiumLayers_.remove(this.activeLayer_, true);
    this.activeLayer_ = null;

    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * Creates Cesium layer cache based on a single OpenLayers tile layer to facilitate tile animation.
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.createCache_ = function() {
  if (this.activeLayer_ && this.layer.getSource() instanceof ol.source.TileWMS) {
    // hide the active layer and disable any events that would update it
    this.activeLayer_.show = false;
    os.ol.events.unlistenEach(this.layer, plugin.cesium.sync.TileSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
    ol.events.unlisten(this.layer, 'change', this.onChange_, this);

    // create the cache
    this.updateAnimationCache_();

    // update the layer cache when the style changes, or a change event is fired (ie, params/url changed). in the
    // future we may have to clear the cache if something other than the TIME param changes (like user changes to
    // the url) but currently there isn't a way to do that.
    os.ol.events.listenEach(this.layer, plugin.cesium.sync.TileSynchronizer.STYLE_KEYS_, this.updateAnimationCache_,
        this);
    ol.events.listen(this.layer, 'change', this.updateAnimationCache_, this);
  }
};


/**
 * Disposes of the Cesium tile layer cache.
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.disposeCache_ = function() {
  // remove cache listeners
  os.ol.events.unlistenEach(this.layer, plugin.cesium.sync.TileSynchronizer.STYLE_KEYS_, this.updateAnimationCache_,
      this);
  ol.events.unlisten(this.layer, 'change', this.updateAnimationCache_, this);

  // destroy the cache
  if (this.animationCache_) {
    for (var key in this.animationCache_) {
      this.cesiumLayers_.remove(this.animationCache_[key], true);

      if (this.animationCache_[key].imageryProvider instanceof plugin.cesium.ImageryProvider) {
        this.animationCache_[key].imageryProvider.dispose();
      }

      delete this.animationCache_[key];
    }

    this.animationCache_ = null;
  }

  // reactivate the active layer and its listeners. the show flag will be determined by layer visibility.
  if (this.layer && this.activeLayer_) {
    plugin.cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
    os.ol.events.listenEach(this.layer, plugin.cesium.sync.TileSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
    ol.events.listen(this.layer, 'change', this.onChange_, this);
  }
};


/**
 * Caches tile layers for the current timeline window and the tile boundary on either side of the window. Preloading
 * tiles makes them available to the GPU immediately so seamless transition between tiles is possible. While animating,
 * tile layers are cached for each tile boundary within the animation loop.
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.updateAnimationCache_ = function() {
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
  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * Creates a WMS TIME parameter based on the timeline controller's current start/end, offset by the provided number
 * of timeline durations (ie, day week month). This is a convenience function for creating tile boundaries around
 * the current time window.
 * @param {number} offset The number of timeline durations (day, week, month, etc) to offset this range.
 * @return {string} WMS TIME parameter for the requested offset.
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.getTimeParameter_ = function(offset) {
  goog.asserts.assertInstanceof(this.layer, os.layer.AnimatedTile);

  var dateFormat = this.layer.getDateFormat();
  var duration = this.tlc.getDuration();
  var start = this.tlc.getCurrent() - this.tlc.getOffset();
  var end = this.tlc.getCurrent();

  return os.layer.AnimatedTile.getTimeParameter(dateFormat,
      os.time.offset(new Date(start), duration, offset).getTime(),
      os.time.offset(new Date(end), duration, offset).getTime(),
      duration);
};


/**
 * Caches a layer for the given time and sets the visibility.
 * @param {string} timeParam The TIME param for the layer.
 * @param {boolean} show If the layer should be shown.
 * @return {Cesium.ImageryLayer}
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.getCacheLayer_ = function(timeParam, show) {
  goog.asserts.assert(!goog.isNull(this.layer));

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
};


/**
 * Creates a Cesium layer representing this synchronizer's layer with a custom time range. This is used when caching
 * multiple time ranges for animation.
 * @param {string} timeParam Time to use for the WMS TIME parameter
 * @return {!Cesium.ImageryLayer} The Cesium imagery layer
 * @private
 * @suppress {accessControls}
 */
plugin.cesium.sync.TileSynchronizer.prototype.getLayerByTime_ = function(timeParam) {
  goog.asserts.assertInstanceof(this.layer, os.layer.AnimatedTile);
  goog.asserts.assert(!goog.isNull(this.view));

  var originalSource = /** @type {ol.source.TileWMS} */ (this.layer.getSource());
  goog.asserts.assertInstanceof(originalSource, ol.source.TileWMS);

  var options = this.layer.getLayerOptions();
  // just to be sure, make the ID different
  options['id'] = goog.string.getRandomString();

  var clone = os.layer.createFromOptions(options);
  var source = /** @type {ol.source.TileWMS} */ (clone.getSource());

  var params = originalSource.getParams();
  params['TIME'] = timeParam;
  source.updateParams(params);

  var provider = new plugin.cesium.ImageryProvider(source);
  var cesiumLayer = new Cesium.ImageryLayer(provider);
  return cesiumLayer;
};


/**
 * Update Cesium layer properties when the style changes.
 * @param {ol.Object.Event} event
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.onStyleChange_ = function(event) {
  goog.asserts.assert(!goog.isNull(this.layer));
  goog.asserts.assert(!goog.isNull(this.activeLayer_));
  plugin.cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
  this.onZoomChange_();
};


/**
 * Handle generic 'change' events on the tile layer.
 * @param {ol.Object.Event} event
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.onChange_ = function(event) {
  // don't bother re-adding if the layer isn't shown. the change will take effect when the layer is shown again.
  if (this.activeLayer_ && this.activeLayer_.show) {
    // when the source changes, re-add the layer to force update
    var activePosition = this.cesiumLayers_.indexOf(this.activeLayer_);
    if (activePosition >= 0) {
      this.cesiumLayers_.remove(this.activeLayer_, false);
      this.cesiumLayers_.add(this.activeLayer_, activePosition);
    }
  }

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};


/**
 * Handle property change events on the layer.
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
plugin.cesium.sync.TileSynchronizer.prototype.onLayerPropertyChange_ = function(event) {
  // ol3 also fires 'propertychange' events, so ignore those
  if (event instanceof os.events.PropertyChangeEvent) {
    var p = event.getProperty();
    if (p == os.layer.PropertyChange.ANIMATION_ENABLED) {
      // enable/disable the cache based on the animation state (fired when the timeline is opened/closed)
      var enabled = /** @type {boolean} */ (event.getNewValue());
      if (enabled) {
        this.createCache_();
      } else {
        this.disposeCache_();
      }
    } else if (p == os.layer.PropertyChange.STYLE) {
      this.synchronize();
    }
  }

  os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
};
