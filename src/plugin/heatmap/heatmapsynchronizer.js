goog.provide('plugin.heatmap.HeatmapSynchronizer');
goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('goog.events.EventType');
goog.require('os.layer.PropertyChange');
goog.require('os.olcs');
goog.require('os.olcs.sync.AbstractSynchronizer');



/**
 * Synchronizes a single OL3 image layer to Cesium.
 * @param {!plugin.heatmap.Heatmap} layer
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @extends {os.olcs.sync.AbstractSynchronizer<plugin.heatmap.Heatmap>}
 * @constructor
 */
plugin.heatmap.HeatmapSynchronizer = function(layer, map, scene) {
  plugin.heatmap.HeatmapSynchronizer.base(this, 'constructor', layer, map, scene);

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
   * If the layer is turned on or off
   * @type {boolean}
   * @private
   */
  this.visible_ = this.layer.getLayerVisible();

  /**
   * @type {number}
   * @private
   */
  this.lastStart_ = -1;

  /**
   * Delay to debounce synchronize calls.
   * @type {goog.async.Delay}
   * @private
   */
  this.syncDelay_ = new goog.async.Delay(this.synchronizeInternal, 75, this);

  ol.events.listen(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
  os.ol.events.listenEach(this.layer, plugin.heatmap.HeatmapSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
};
goog.inherits(plugin.heatmap.HeatmapSynchronizer, os.olcs.sync.AbstractSynchronizer);


/**
 * @type {!Array<string>}
 * @const
 * @private
 */
plugin.heatmap.HeatmapSynchronizer.STYLE_KEYS_ = [
  'change:opacity'
];


/**
 * @inheritDoc
 */
plugin.heatmap.HeatmapSynchronizer.prototype.disposeInternal = function() {
  goog.dispose(this.syncDelay_);
  this.syncDelay_ = null;

  ol.events.unlisten(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
  os.ol.events.unlistenEach(this.layer, plugin.heatmap.HeatmapSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);

  this.cesiumLayers_.remove(this.activeLayer_);
  this.activeLayer_ = null;

  plugin.heatmap.HeatmapSynchronizer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.heatmap.HeatmapSynchronizer.prototype.synchronize = function() {
  if (this.syncDelay_) {
    this.syncDelay_.start();
  }
};


/**
 * Performs the actual synchronization.
 */
plugin.heatmap.HeatmapSynchronizer.prototype.synchronizeInternal = function() {
  if (!this.visible_) {
    return;
  }

  // get the index that it was at to maintain z-ordering
  var index = this.cesiumLayers_.length || undefined;
  if (this.activeLayer_) {
    // remove the old layer
    index = this.getFirstIndex();
    this.cesiumLayers_.remove(this.activeLayer_);
    this.activeLayer_ = null;
  }

  // get the image
  var img = /** @type {string|undefined} */ (this.layer.get('url'));
  if (!img) {
    // if we don't have it, create it (that function re-calls this one)
    this.createHeatmap();
    return;
  }

  if (img) {
    // scale back the extent so the image is positioned in the correct location
    var extent = this.layer.getExtent().slice();
    ol.extent.scaleFromCenter(extent, 1 / plugin.heatmap.EXTENT_SCALE_FACTOR);

    this.activeLayer_ = this.cesiumLayers_.addImageryProvider(new Cesium.SingleTileImageryProvider({
      url: img,
      rectangle: Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])
    }), index);

    goog.asserts.assert(this.activeLayer_);
    goog.asserts.assert(this.layer);
    os.olcs.updateCesiumLayerProperties(this.layer, this.activeLayer_);
    os.dispatcher.dispatchEvent(os.olcs.RenderLoop.REPAINT);
  }
};


/**
 * Handle visibility
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
plugin.heatmap.HeatmapSynchronizer.prototype.onLayerPropertyChange_ = function(event) {
  // ol3 also fires 'propertychange' events, so ignore those
  if (event instanceof os.events.PropertyChangeEvent) {
    var p = event.getProperty();
    if (p == os.layer.PropertyChange.VISIBLE) {
      this.visible_ = /** @type {boolean} */ (event.getNewValue());

      if (this.layer && this.activeLayer_) {
        os.olcs.updateCesiumLayerProperties(this.layer, this.activeLayer_);
        os.dispatcher.dispatchEvent(os.olcs.RenderLoop.REPAINT);
      }
    } else if (p == 'intensity' || p == 'size' || p == 'gradient') {
      this.createHeatmap();
    }
  }
};


/**
 * Update Cesium layer properties when the style changes.
 * @param {ol.Object.Event} event
 * @private
 */
plugin.heatmap.HeatmapSynchronizer.prototype.onStyleChange_ = function(event) {
  goog.asserts.assert(!goog.isNull(this.layer));
  goog.asserts.assert(!goog.isNull(this.activeLayer_));
  os.olcs.updateCesiumLayerProperties(this.layer, this.activeLayer_);
  os.dispatcher.dispatchEvent(os.olcs.RenderLoop.REPAINT);
};


/**
 * Re-create the heatmap by forcing a call to OL3.
 * @param {goog.events.Event=} opt_event
 * @suppress {accessControls}
 */
plugin.heatmap.HeatmapSynchronizer.prototype.createHeatmap = function(opt_event) {
  if (!os.MapContainer.getInstance().is3DEnabled() || !this.visible_) {
    return;
  }

  // force the 2D map to adjust to our new zoom/location
  this.map.renderSync();
  var renderer = /** @type {ol.renderer.canvas.Map} */ (this.map.getRenderer());
  var frameState = this.map.frameState_;

  // always make the heatmap visible
  var layer;
  var layerState;
  for (var i = 0, ii = frameState.layerStatesArray.length; i < ii; ++i) {
    layerState = frameState.layerStatesArray[i];
    layer = layerState.layer;
    if (layer === this.layer) {
      frameState.layerStatesArray[i].visible = true;
      frameState.layerStatesArray[i].extent = undefined;

      var extent = frameState.extent.slice();
      ol.extent.scaleFromCenter(extent, 2);
      frameState.extent = extent;
    }
  }

  // force a final 2D render so we get the new heatmap png
  renderer.renderFrame(frameState);
  this.synchronize();
};


/**
 * Regenerates the heatmap once the Cesium camera finishes changing.
 * @inheritDoc
 */
plugin.heatmap.HeatmapSynchronizer.prototype.updateFromCamera = function() {
  this.createHeatmap();
};


/**
 * @inheritDoc
 */
plugin.heatmap.HeatmapSynchronizer.prototype.reposition = function(start, end) {
  if (this.lastStart_ !== start) {
    this.lastStart_ = start;

    if (this.activeLayer_) {
      this.cesiumLayers_.remove(this.activeLayer_, false);
      this.cesiumLayers_.add(this.activeLayer_, start++);
    }
  } else {
    // the layer is positioned correctly, so return the last index + 1
    start = this.getFirstIndex() + 1;
  }

  return start;
};


/**
 * @inheritDoc
 */
plugin.heatmap.HeatmapSynchronizer.prototype.reset = function() {
  this.synchronize();
};


/**
 * Get the first index of this synchronizer's layers in the Cesium imagery layer array.
 * @return {number}
 */
plugin.heatmap.HeatmapSynchronizer.prototype.getFirstIndex = function() {
  return this.activeLayer_ ? this.cesiumLayers_.indexOf(this.activeLayer_) : -1;
};
