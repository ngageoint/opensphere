goog.provide('plugin.cesium.sync.ImageStaticSynchronizer');

goog.require('ol.source.ImageStatic');
goog.require('os.MapEvent');
goog.require('os.source.ImageStatic');
goog.require('plugin.cesium.sync.CesiumSynchronizer');



/**
 * Synchronizes a single OpenLayers ImageStatic source to Cesium
 *
 * @param {!ol.layer.Image} layer The OpenLayers image layer
 * @param {!ol.PluggableMap} map The map
 * @param {!Cesium.Scene} scene
 * @extends {plugin.cesium.sync.CesiumSynchronizer<os.layer.Image>}
 * @constructor
 */
plugin.cesium.sync.ImageStaticSynchronizer = function(layer, map, scene) {
  plugin.cesium.sync.ImageStaticSynchronizer.base(this, 'constructor', layer, map, scene);

  /**
   * @type {ol.source.Image}
   * @protected
   */
  this.source = this.layer.getSource();


  /**
   * @type {ol.ImageBase}
   * @protected
   */
  this.image;

  /**
   * @type {Cesium.Primitive}
   * @protected
   */
  this.primitive;

  ol.events.listen(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange, this);
};
goog.inherits(plugin.cesium.sync.ImageStaticSynchronizer, plugin.cesium.sync.CesiumSynchronizer);



/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageStaticSynchronizer.prototype.disposeInternal = function() {
  this.resetInternal();
  this.source = null;
  plugin.cesium.sync.ImageSynchronizer.base(this, 'disposeInternal');
};



/**
 * @inheritDoc
 * @suppress {accessControls}
 */
plugin.cesium.sync.ImageStaticSynchronizer.prototype.synchronize = function() {
  if (!this.image) {
    if (!(this.source instanceof ol.source.ImageStatic)) {
      return;
    }

    this.image = this.source.image_;
    ol.events.listen(this.image, ol.events.EventType.CHANGE, this.synchronize, this);
  }

  if (this.source instanceof os.source.ImageStatic) {
    // This source supports rotation and must be loaded first. Other source types such as ol.source.ImageStatic
    // can pass the img.src parameter through to the Cesium material.
    if (this.image.getState() === ol.ImageState.IDLE) {
      this.image.load();
    }

    if (this.image.getState() !== ol.ImageState.LOADED) {
      return;
    }

    if (this.image !== this.source.rotatedImage) {
      ol.events.unlisten(this.image, ol.events.EventType.CHANGE, this.synchronize, this);
      this.image = this.source.rotatedImage;
    }
  }

  var url;
  var el = this.image.getImage();

  if (el instanceof HTMLVideoElement || el instanceof Image) {
    url = el.src;
  } else if (el instanceof HTMLCanvasElement) {
    url = el.toDataURL();
  }

  var extent = ol.proj.transformExtent(this.image.getExtent(), os.map.PROJECTION, os.proj.EPSG4326);

  if (!this.primitive && url && extent) {
    this.primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
          rectangle: Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])
        }),
        id: this.layer.getId()
      }),
      appearance: new Cesium.MaterialAppearance({
        material: Cesium.Material.fromType('Image', {
          image: url
        })
      }),
      show: this.layer.getVisible()
    });

    this.scene.primitives.add(this.primitive);
  }
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageStaticSynchronizer.prototype.reset = function() {
  this.resetInternal();
  this.synchronize();
};


/**
 * @protected
 */
plugin.cesium.sync.ImageStaticSynchronizer.prototype.resetInternal = function() {
  if (this.image) {
    ol.events.unlisten(this.image, ol.events.EventType.CHANGE, this.synchronize, this);
    this.image = null;
  }

  if (this.primitive) {
    this.scene.primitives.remove(this.primitive);
    this.primitive = null;
  }
};


/**
 * Handle visibility
 *
 * @param {os.events.PropertyChangeEvent} event
 * @protected
 */
plugin.cesium.sync.ImageStaticSynchronizer.prototype.onLayerPropertyChange = function(event) {
  if (this.primitive && event instanceof ol.Object.Event && event.key == os.layer.PropertyChange.VISIBLE) {
    this.primitive.show = this.layer.getVisible();
    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};
