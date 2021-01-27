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

  /**
   * @type {ol.ImageBase|undefined}
   * @private
   */
  this.image_;

  /**
   * @type {ol.Extent|undefined}
   * @private
   */
  this.lastExtent_;

  /**
   * @type {string|undefined}
   * @private
   */
  this.lastUrl_;

  /**
   * Flag for fixing a bug with the first render loop pass.
   * @type {boolean}
   * @private
   */
  this.firstLoopFixed_ = false;

  this.onPrimitiveReady_ = this.onPrimitiveReadyInternal.bind(this);
  this.scene.primitives.add(this.collection_);

  ol.events.listen(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange, this);
  ol.events.listen(this.source_, ol.events.EventType.CHANGE, this.syncInternal, this);
  os.map.mapContainer.listen(os.MapEvent.VIEW_CHANGE, this.onSyncChange, false, this);
};
goog.inherits(plugin.cesium.sync.ImageSynchronizer, plugin.cesium.sync.CesiumSynchronizer);


/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageSynchronizer.prototype.disposeInternal = function() {
  ol.events.unlisten(this.layer, goog.events.EventType.PROPERTYCHANGE, this.onLayerPropertyChange, this);
  ol.events.unlisten(this.source_, ol.events.EventType.CHANGE, this.syncInternal, this);
  os.map.mapContainer.unlisten(os.MapEvent.VIEW_CHANGE, this.onSyncChange, false, this);

  this.activePrimitive_ = null;
  this.source_ = null;

  this.scene.primitives.remove(this.collection_);
  plugin.cesium.sync.ImageSynchronizer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.ImageSynchronizer.prototype.synchronize = function() {
  this.syncInternal();
};


/**
 * @param {boolean=} opt_force Force an update regardless of the current source revision
 * @protected
 */
plugin.cesium.sync.ImageSynchronizer.prototype.syncInternal = function(opt_force) {
  if (this.source_ && (this.lastRevision_ !== this.source_.getRevision() || opt_force)) {
    this.lastRevision_ = this.source_.getRevision();

    if (this.activePrimitive_) {
      this.activePrimitive_.show = this.layer.getVisible();
    }

    var map = /** @type {os.Map} */ (os.map.mapContainer.getMap());
    var viewExtent = map.getExtent();
    if (ol.extent.containsExtent(viewExtent, os.map.PROJECTION.getWorldExtent())) {
      // never allow an extent larger than the world to be requested
      return;
    }

    // normalize the extent across the antimeridian
    viewExtent = os.extent.normalize(viewExtent, -360, 0);

    if (!viewExtent) {
      this.removeImmediate_();
      return;
    }

    var resolution = map.getView().getResolution();
    let img;
    if (!isNaN(resolution) && resolution != null) {
      if (!this.firstLoopFixed_) {
        // HACK ALERT: when initially loading into Cesium, the image for this layer has already been created and loaded
        // by a single render call on the 2D map. The extent for this request is incompatible with 3D since it's
        // often wider than the world extent. OL also caches the bad image, so this tiny change to the resolution
        // is designed to defeat that cache.
        resolution += os.geo.EPSILON;
        this.firstLoopFixed_ = true;
      }

      img = this.source_.getImage(viewExtent, resolution, window.devicePixelRatio, os.map.PROJECTION);

      if (img) {
        if (img !== this.image_) {
          if (this.image_) {
            ol.events.unlisten(this.image_, ol.events.EventType.CHANGE, this.onSyncChange, this);
          }

          var imageState = img.getState();
          if (imageState != ol.ImageState.LOADED && imageState != ol.ImageState.ERROR) {
            ol.events.listen(img, ol.events.EventType.CHANGE, this.onSyncChange, this);
          }

          if (imageState == ol.ImageState.IDLE) {
            img.load();
          }

          this.image_ = img;
          return;
        }
      } else {
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

    var changed = this.lastUrl_ !== url;
    this.lastUrl_ = url;
    var extent = ol.proj.transformExtent(img.getExtent(), os.map.PROJECTION, os.proj.EPSG4326);
    if (this.lastExtent_) {
      for (var i = 0, n = extent.length; i < n; i++) {
        if (Math.abs(extent[i] - this.lastExtent_[i]) > 1E-12) {
          changed = true;
          break;
        }
      }
    } else {
      changed = true;
    }
    this.lastExtent_ = extent.slice();

    if (url && extent) {
      if (changed) {
        var primitive = new Cesium.Primitive({
          geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.RectangleGeometry({
              rectangle: Cesium.Rectangle.fromDegrees(viewExtent[0], viewExtent[1], viewExtent[2], viewExtent[3])
            }),
            id: this.layer.getId() + '.' + (this.nextId_++)
          }),
          appearance: new Cesium.MaterialAppearance({
            material: Cesium.Material.fromType('Image', {
              image: el
            })
          }),
          show: this.layer.getVisible()
        });

        primitive.readyPromise.then(this.onPrimitiveReady_);
        this.collection_.add(primitive);
        os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
      }
    } else {
      this.removeImmediate_();
    }
  }
};


/**
 * @param {!Cesium.Primitive} primitive
 * @protected
 */
plugin.cesium.sync.ImageSynchronizer.prototype.onPrimitiveReadyInternal = function(primitive) {
  this.activePrimitive_ = primitive;

  let i = this.collection_.length;
  while (i--) {
    var item = this.collection_.get(i);

    if (item !== this.activePrimitive_) {
      this.collection_.remove(item);
    }
  }
};


/**
 * @protected
 */
plugin.cesium.sync.ImageSynchronizer.prototype.onSyncChange = function() {
  this.syncInternal(true);
};


/**
 * Immediately remove the primitive
 * @private
 */
plugin.cesium.sync.ImageSynchronizer.prototype.removeImmediate_ = function() {
  this.activePrimitive_ = null;
  this.lastExtent_ = undefined;
  this.lastUrl_ = undefined;
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
 * @protected
 */
plugin.cesium.sync.ImageSynchronizer.prototype.onLayerPropertyChange = function(event) {
  if (event instanceof ol.Object.Event && event.key == os.layer.PropertyChange.VISIBLE) {
    this.syncInternal(true);
  }
};
