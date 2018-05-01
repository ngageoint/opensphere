goog.provide('plugin.cesium.sync.ImageSynchronizer');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('ol.layer.Tile');
goog.require('os.MapEvent');
goog.require('os.events.SelectionType');
goog.require('os.layer.PropertyChange');
goog.require('os.source.Vector');
goog.require('plugin.cesium.sync.CesiumSynchronizer');



/**
 * Synchronizes a single OpenLayers image layer to Cesium.
 * @param {!os.layer.Image} layer The OpenLayers image layer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @param {!Cesium.Scene} scene The Cesium scene.
 * @extends {plugin.cesium.sync.CesiumSynchronizer.<os.layer.Image>}
 * @constructor
 */
plugin.cesium.sync.ImageSynchronizer = function(layer, map, scene) {
  plugin.cesium.sync.ImageSynchronizer.base(this, 'constructor', layer, map, scene);

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
  this.visible_ = true;

  ol.events.listen(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
};
goog.inherits(plugin.cesium.sync.ImageSynchronizer, plugin.cesium.sync.CesiumSynchronizer);


/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageSynchronizer.prototype.disposeInternal = function() {
  ol.events.unlisten(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

  var layers = this.scene.imageryLayers;
  layers.remove(this.activeLayer_);
  this.activeLayer_ = null;

  plugin.cesium.sync.ImageSynchronizer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageSynchronizer.prototype.synchronize = function() {
  // remove the old KML image
  var layers = this.scene.imageryLayers;
  if (this.activeLayer_) {
    layers.remove(this.activeLayer_);
    this.activeLayer_ = null;
  }

  if (!this.visible_) {
    return;
  }

  var img = /** @type {string} */ (this.layer.get('url'));

  if (img) {
    var extent = this.layer.getExtent();
    layers.addImageryProvider(new Cesium.SingleTileImageryProvider({
      url: img,
      rectangle: Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])
    }));
    this.activeLayer_ = layers.get(layers.length - 1);

    this.activeLayer_.imageryProvider.errorEvent.addEventListener(this.providerError.bind(this));
  }
};


/**
 * @param {Cesium.Event} error
 */
plugin.cesium.sync.ImageSynchronizer.prototype.providerError = function(error) {
  // error has already been logged, remove the bad image layer so other tiles load properly
  var layers = this.scene.imageryLayers;
  layers.remove(this.activeLayer_);
};

/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageSynchronizer.prototype.reposition = function(start) {
  this.synchronize();
  return ++start;
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageSynchronizer.prototype.reset = function() {
  this.synchronize();
};


/**
 * Handle visibility
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
plugin.cesium.sync.ImageSynchronizer.prototype.onLayerPropertyChange_ = function(event) {
  // ol3 also fires 'propertychange' events, so ignore those
  if (event instanceof os.events.PropertyChangeEvent) {
    var p = event.getProperty();
    if (p == os.layer.PropertyChange.VISIBLE) {
      this.visible_ = /** @type {boolean} */ (event.getNewValue());
      this.synchronize();
      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};
