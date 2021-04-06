goog.module('plugin.cesium.sync.ImageSynchronizer');

const dispatcher = goog.require('os.Dispatcher');
const geo = goog.require('os.geo');
const mapContainer = goog.require('os.MapContainer');
const googEventsEventType = goog.require('goog.events.EventType');
const events = goog.require('ol.events');
const EventType = goog.require('ol.events.EventType');
const MapEvent = goog.require('os.MapEvent');
const PropertyChange = goog.require('os.layer.PropertyChange');
const CesiumSynchronizer = goog.require('plugin.cesium.sync.CesiumSynchronizer');

const Map = goog.requireType('os.Map');


/**
 * Synchronizes a single OpenLayers image layer to Cesium.
 *
 * @extends {CesiumSynchronizer.<os.layer.Image>}
 */
class ImageSynchronizer extends CesiumSynchronizer {
  /**
   * Constructor.
   * @param {!os.layer.Image} layer The OpenLayers image layer.
   * @param {!ol.PluggableMap} map The OpenLayers map.
   * @param {!Cesium.Scene} scene The Cesium scene.
   */
  constructor(layer, map, scene) {
    super(layer, map, scene);

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

    events.listen(this.layer, googEventsEventType.PROPERTYCHANGE, this.onLayerPropertyChange, this);
    events.listen(this.source_, EventType.CHANGE, this.syncInternal, this);
    mapContainer.getInstance().listen(MapEvent.VIEW_CHANGE, this.onSyncChange, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    events.unlisten(this.layer, googEventsEventType.PROPERTYCHANGE, this.onLayerPropertyChange, this);
    events.unlisten(this.source_, EventType.CHANGE, this.syncInternal, this);
    mapContainer.getInstance().unlisten(MapEvent.VIEW_CHANGE, this.onSyncChange, false, this);

    this.activePrimitive_ = null;
    this.source_ = null;

    this.scene.primitives.remove(this.collection_);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  synchronize() {
    this.syncInternal();
  }

  /**
   * @param {boolean=} opt_force Force an update regardless of the current source revision
   * @protected
   */
  syncInternal(opt_force) {
    if (this.source_ && (this.lastRevision_ !== this.source_.getRevision() || opt_force)) {
      this.lastRevision_ = this.source_.getRevision();

      if (this.activePrimitive_) {
        this.activePrimitive_.show = this.layer.getVisible();
      }

      var map = /** @type {Map} */ (mapContainer.getInstance().getMap());
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
          resolution += geo.EPSILON;
          this.firstLoopFixed_ = true;
        }

        img = this.source_.getImage(viewExtent, resolution, window.devicePixelRatio, os.map.PROJECTION);

        if (img) {
          if (img !== this.image_) {
            if (this.image_) {
              events.unlisten(this.image_, EventType.CHANGE, this.onSyncChange, this);
            }

            var imageState = img.getState();
            if (imageState != ol.ImageState.LOADED && imageState != ol.ImageState.ERROR) {
              events.listen(img, EventType.CHANGE, this.onSyncChange, this);
            }

            if (imageState == ol.ImageState.ERROR) {
              // don't do anything, leave the old image rendered
              return;
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
          var minX = viewExtent[0];
          var minY = viewExtent[1];
          var maxX = viewExtent[2] - geo.EPSILON;
          var maxY = viewExtent[3] - geo.EPSILON;
          var flatCoordinates = [minX, minY, minX, maxY, maxX, maxY, maxX, minY, minX, minY];

          var primitive = new Cesium.GroundPrimitive({
            geometryInstances: new Cesium.GeometryInstance({
              geometry: new Cesium.PolygonGeometry({
                polygonHierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(flatCoordinates)),
                height: 5000,
                arcType: Cesium.ArcType.RHUMB
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
          dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
        }
      } else {
        this.removeImmediate_();
      }
    }
  }

  /**
   * @param {!Cesium.Primitive} primitive
   * @protected
   */
  onPrimitiveReadyInternal(primitive) {
    this.activePrimitive_ = primitive;

    let i = this.collection_.length;
    while (i--) {
      var item = this.collection_.get(i);

      if (item !== this.activePrimitive_) {
        this.collection_.remove(item);
      }
    }
  }

  /**
   * @protected
   */
  onSyncChange() {
    this.syncInternal(true);
  }

  /**
   * Immediately remove the primitive
   * @private
   */
  removeImmediate_() {
    this.activePrimitive_ = null;
    this.lastExtent_ = undefined;
    this.lastUrl_ = undefined;
    this.collection_.removeAll();
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.syncInternal(true);
  }

  /**
   * Handle visibility
   *
   * @param {os.events.PropertyChangeEvent} event
   * @protected
   */
  onLayerPropertyChange(event) {
    if (event instanceof ol.Object.Event && event.key == PropertyChange.VISIBLE) {
      this.syncInternal(true);
    }
  }
}

exports = ImageSynchronizer;
