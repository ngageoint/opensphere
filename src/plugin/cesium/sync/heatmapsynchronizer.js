goog.module('plugin.cesium.sync.HeatmapSynchronizer');

const asserts = goog.require('goog.asserts');
const Delay = goog.require('goog.async.Delay');
const EventType = goog.require('goog.events.EventType');
const olEvents = goog.require('ol.events');
const {scaleFromCenter} = goog.require('ol.extent');
const dispatcher = goog.require('os.Dispatcher');
const MapContainer = goog.require('os.MapContainer');
const MapEvent = goog.require('os.MapEvent');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const PropertyChange = goog.require('os.layer.PropertyChange');
const events = goog.require('os.ol.events');
const cesium = goog.require('plugin.cesium');
const CesiumSynchronizer = goog.require('plugin.cesium.sync.CesiumSynchronizer');
const {EXTENT_SCALE_FACTOR} = goog.require('plugin.heatmap');
const HeatmapPropertyType = goog.require('plugin.heatmap.HeatmapPropertyType');
const HeatmapField = goog.require('plugin.heatmap.HeatmapField');

const GoogEvent = goog.requireType('goog.events.Event');
const OLObject = goog.requireType('ol.Object');
const PluggableMap = goog.requireType('ol.PluggableMap');
const MapCanvasRenderer = goog.requireType('ol.renderer.canvas.Map');

/**
 * Synchronizes a single OpenLayers image layer to Cesium.
 *
 * @extends {CesiumSynchronizer<plugin.heatmap.Heatmap>}
 */
class HeatmapSynchronizer extends CesiumSynchronizer {
  /**
   * Constructor.
   * @param {!plugin.heatmap.Heatmap} layer The OpenLayers heatmap layer.
   * @param {!PluggableMap} map The OpenLayers map.
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
     * @type {Delay}
     * @private
     */
    this.syncDelay_ = new Delay(this.synchronizeInternal, 75, this);

    olEvents.listen(this.layer, EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
    events.listenEach(this.layer, HeatmapSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    goog.dispose(this.syncDelay_);
    this.syncDelay_ = null;

    olEvents.unlisten(this.layer, EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
    events.unlistenEach(this.layer, HeatmapSynchronizer.STYLE_KEYS_, this.onStyleChange_, this);

    this.cesiumLayers_.remove(this.activeLayer_);
    this.activeLayer_ = null;

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
   * Performs the actual synchronization.
   */
  synchronizeInternal() {
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
    var canvas = /** @type {HTMLCanvasElement|undefined} */ (this.layer.get(HeatmapField.CANVAS));
    var img = /** @type {string|null} */ (canvas ? canvas.toDataURL() : null);
    if (!img) {
      // if we don't have it, create it (that function re-calls this one)
      this.createHeatmap();
      return;
    }

    if (img) {
      // scale back the extent so the image is positioned in the correct location
      var extent = this.layer.getExtent().slice();
      scaleFromCenter(extent, 1 / EXTENT_SCALE_FACTOR);

      this.activeLayer_ = this.cesiumLayers_.addImageryProvider(new Cesium.SingleTileImageryProvider({
        url: img,
        rectangle: Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])
      }), index);

      asserts.assert(this.activeLayer_);
      asserts.assert(this.layer);
      cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * Handle visibility
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onLayerPropertyChange_(event) {
    // ol3 also fires 'propertychange' events, so ignore those
    if (event instanceof PropertyChangeEvent) {
      var p = event.getProperty();
      if (p == PropertyChange.VISIBLE) {
        this.visible_ = /** @type {boolean} */ (event.getNewValue());

        if (this.layer && this.activeLayer_) {
          cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
          dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
        }
      } else if (p == HeatmapPropertyType.INTENSITY ||
          p == HeatmapPropertyType.SIZE ||
          p == HeatmapPropertyType.GRADIENT) {
        this.createHeatmap();
      }
    }
  }

  /**
   * Update Cesium layer properties when the style changes.
   *
   * @param {OLObject.Event} event
   * @private
   */
  onStyleChange_(event) {
    asserts.assert(this.layer !== null);
    asserts.assert(this.activeLayer_ !== null);
    cesium.updateCesiumLayerProperties(this.layer, this.activeLayer_);
    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * Re-create the heatmap by forcing a call to OpenLayers.
   *
   * @param {GoogEvent=} opt_event
   * @suppress {accessControls}
   */
  createHeatmap(opt_event) {
    if (!MapContainer.getInstance().is3DEnabled() || !this.visible_) {
      return;
    }

    // force the 2D map to adjust to our new zoom/location
    this.map.renderSync();
    var renderer = /** @type {MapCanvasRenderer} */ (this.map.getRenderer());
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
        scaleFromCenter(extent, 2);
        frameState.extent = extent;
      }
    }

    // force a final 2D render so we get the new heatmap png
    renderer.renderFrame(frameState);
    this.synchronize();
  }

  /**
   * Regenerates the heatmap once the Cesium camera finishes changing.
   *
   * @inheritDoc
   */
  updateFromCamera() {
    this.createHeatmap();
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
    } else {
      // the layer is positioned correctly, so return the last index + 1
      start = this.getFirstIndex() + 1;
    }

    return start;
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.synchronize();
  }

  /**
   * Get the first index of this synchronizer's layers in the Cesium imagery layer array.
   *
   * @return {number}
   */
  getFirstIndex() {
    return this.activeLayer_ ? this.cesiumLayers_.indexOf(this.activeLayer_) : -1;
  }
}


/**
 * @type {!Array<string>}
 * @const
 * @private
 */
HeatmapSynchronizer.STYLE_KEYS_ = [
  'change:opacity'
];


exports = HeatmapSynchronizer;
