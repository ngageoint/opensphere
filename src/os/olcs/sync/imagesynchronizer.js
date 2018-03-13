goog.provide('os.olcs.sync.ImageSynchronizer');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('ol.layer.Tile');
goog.require('os.MapEvent');
goog.require('os.events.SelectionType');
goog.require('os.layer.PropertyChange');
goog.require('os.olcs');
goog.require('os.olcs.sync.AbstractSynchronizer');
goog.require('os.source.Vector');



/**
 * Synchronizes a single OL3 image layer to Cesium.
 * @param {!os.layer.Image} layer
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @extends {os.olcs.sync.AbstractSynchronizer.<os.layer.Image>}
 * @constructor
 */
os.olcs.sync.ImageSynchronizer = function(layer, map, scene) {
  os.olcs.sync.ImageSynchronizer.base(this, 'constructor', layer, map, scene);

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
goog.inherits(os.olcs.sync.ImageSynchronizer, os.olcs.sync.AbstractSynchronizer);


/**
 * @inheritDoc
 */
os.olcs.sync.ImageSynchronizer.prototype.disposeInternal = function() {
  ol.events.unlisten(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);

  var layers = this.scene.imageryLayers;
  layers.remove(this.activeLayer_);
  this.activeLayer_ = null;

  os.olcs.sync.ImageSynchronizer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
os.olcs.sync.ImageSynchronizer.prototype.synchronize = function() {
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
os.olcs.sync.ImageSynchronizer.prototype.providerError = function(error) {
  // error has already been logged, remove the bad image layer so other tiles load properly
  var layers = this.scene.imageryLayers;
  layers.remove(this.activeLayer_);
};

/**
 * @inheritDoc
 */
os.olcs.sync.ImageSynchronizer.prototype.reposition = function(start) {
  this.synchronize();
  return ++start;
};


/**
 * @inheritDoc
 */
os.olcs.sync.ImageSynchronizer.prototype.reset = function() {
  this.synchronize();
};


/**
 * Handle visibility
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.olcs.sync.ImageSynchronizer.prototype.onLayerPropertyChange_ = function(event) {
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
