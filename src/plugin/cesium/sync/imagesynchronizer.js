goog.provide('plugin.cesium.sync.ImageSynchronizer');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.layer.Tile');
goog.require('os.Map');
goog.require('os.MapContainer');
goog.require('os.MapEvent');
goog.require('os.events.SelectionType');
goog.require('os.layer.PropertyChange');
goog.require('os.source.ImageStatic');
goog.require('plugin.cesium.sync.CesiumSynchronizer');



/**
 * Synchronizes a single OpenLayers image layer to Cesium.
 *
 * @param {!os.layer.Image} layer The OpenLayers image layer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @param {!Cesium.Scene} scene The Cesium scene.
 * @extends {plugin.cesium.sync.CesiumSynchronizer.<os.layer.Image>}
 * @constructor
 */
plugin.cesium.sync.ImageSynchronizer = function(layer, map, scene) {
  plugin.cesium.sync.ImageSynchronizer.base(this, 'constructor', layer, map, scene);

  /**
   * @type {Cesium.Primitive}
   * @private
   */
  this.activePrimitive_ = null;

  /**
   * If the layer is turned on or off
   * @type {boolean}
   * @private
   */
  this.visible_ = this.layer.getVisible();

  /**
   * @type {ol.source.Image}
   * @private
   */
  this.source_ = this.layer.getSource();

  /**
   * @type {number}
   * @private
   */
  this.lastRevision_ = -1;

  /**
   * @type {!Cesium.PrimitiveCollection}
   * @private
   */
  this.collection_ = new Cesium.PrimitiveCollection();

  /**
   * @type {number}
   * @private
   */
  this.nextId_ = 0;

  this.onPrimitiveReady_ = this.onPrimitiveReadyInternal_.bind(this);
  this.scene.primitives.add(this.collection_);

  ol.events.listen(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
  ol.events.listen(this.source_, ol.events.EventType.CHANGE, this.syncInternal, this);
};
goog.inherits(plugin.cesium.sync.ImageSynchronizer, plugin.cesium.sync.CesiumSynchronizer);


/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageSynchronizer.prototype.disposeInternal = function() {
  ol.events.unlisten(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange_, this);
  ol.events.unlisten(this.source_, ol.events.EventType.CHANGE, this.syncInternal, this);

  this.activePrimitive_ = null;
  this.source_ = null;

  this.scene.primitives.remove(this.collection_);
  plugin.cesium.sync.ImageSynchronizer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
plugin.cesium.sync.ImageSynchronizer.prototype.synchronize = function() {
  this.syncInternal();
};

/**
 * @param {boolean=} opt_force Force an update regardless of the current source revision
 * @protected
 */
plugin.cesium.sync.ImageSynchronizer.prototype.syncInternal = function(opt_force) {
  if (this.lastRevision_ !== this.source_.getRevision() || opt_force) {
    this.lastRevision_ = this.source_.getRevision();

    if (!this.visible_) {
      this.removeImmediate_();
      return;
    }

    var map = /** @type {os.Map} */ (os.map.mapContainer.getMap());
    var viewExtent = map.getExtent();

    if (!viewExtent) {
      this.removeImmediate_();
      return;
    }

    var pixelExtent = map.getPixelFromCoordinate(ol.extent.getBottomLeft(viewExtent)).concat(
        map.getPixelFromCoordinate(ol.extent.getTopRight(viewExtent)));

    var resolution = ol.extent.getWidth(viewExtent) / Math.abs(ol.extent.getWidth(pixelExtent));
    if (isNaN(resolution)) {
      return;
    }

    var img = this.source_.getImage(viewExtent, resolution, window.devicePixelRatio, os.map.PROJECTION);

    if (!img) {
      this.removeImmediate_();
      return;
    }

    if (this.source_ instanceof os.source.ImageStatic) {
      // This source supports rotation and must be loaded first. Other source types such as ol.source.ImageStatic
      // can pass the img.src parameter through to the Cesium material.
      if (img.getState() === ol.ImageState.IDLE) {
        img.load();
      }

      if (img.getState() !== ol.ImageState.LOADED) {
        this.removeImmediate_();
        return;
      }
    }

    var url;
    var el = img.getImage();

    if (el instanceof HTMLVideoElement || el instanceof Image) {
      url = el.src;
    } else if (el instanceof HTMLCanvasElement) {
      url = el.toDataURL();
    }

    var extent = img.getExtent();

    if (url && extent) {
      var primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.RectangleGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])
          }),
          id: this.layer.getId() + '.' + (this.nextId_++)
        }),
        appearance: new Cesium.MaterialAppearance({
          material: Cesium.Material.fromType('Image', {
            image: url
          })
        })
      });

      primitive.readyPromise.then(this.onPrimitiveReady_);
      this.collection_.add(primitive);
    } else {
      this.removeImmediate_();
    }
  }
};


/**
 * @param {!Cesium.Primitive} primitive
 * @private
 */
plugin.cesium.sync.ImageSynchronizer.prototype.onPrimitiveReadyInternal_ = function(primitive) {
  this.activePrimitive_ = primitive;
  for (var i = this.collection_.length - 1; i; i--) {
    var item = this.collection_.get(i);

    if (item !== this.activePrimitive_) {
      this.collection_.remove(item);
    }
  }
};


/**
 * Immediately remove the primitive
 * @private
 */
plugin.cesium.sync.ImageSynchronizer.prototype.removeImmediate_ = function() {
  this.activePrimitive_ = null;
  this.collection_.removeAll();
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageSynchronizer.prototype.reset = function() {
  this.syncInternal(true);
};


/**
 * Handle visibility
 *
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
plugin.cesium.sync.ImageSynchronizer.prototype.onLayerPropertyChange_ = function(event) {
  if (event instanceof ol.Object.Event && event.key == os.layer.PropertyChange.VISIBLE) {
    this.visible_ = this.layer.getVisible();
    this.syncInternal(true);
  }
};
