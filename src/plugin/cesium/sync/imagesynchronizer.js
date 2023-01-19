goog.declareModuleId('plugin.cesium.sync.ImageSynchronizer');

import Event from 'ol/src/events/Event.js';
import EventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import {containsExtent} from 'ol/src/extent.js';
import ImageState from 'ol/src/ImageState.js';
import {transformExtent, get} from 'ol/src/proj.js';

import * as dispatcher from '../../../os/dispatcher.js';
import * as osExtent from '../../../os/extent.js';
import * as geo from '../../../os/geo/geo.js';
import {normalizeLongitude} from '../../../os/geo/geo2.js';
import PropertyChange from '../../../os/layer/propertychange.js';
import {PROJECTION, zoomToResolution} from '../../../os/map/map.js';
import MapEvent from '../../../os/map/mapevent.js';
import mapContainer from '../../../os/mapcontainer.js';
import * as osProj from '../../../os/proj/proj.js';
import CesiumSynchronizer from './cesiumsynchronizer.js';

const googEventsEventType = goog.require('goog.events.EventType');


/**
 * Synchronizes a single OpenLayers image layer to Cesium.
 *
 * @extends {CesiumSynchronizer<ImageLayer>}
 */
export default class ImageSynchronizer extends CesiumSynchronizer {
  /**
   * Constructor.
   * @param {!ImageLayer} layer The OpenLayers image layer.
   * @param {!PluggableMap} map The OpenLayers map.
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
     * @type {ImageSource}
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
     * @type {ImageBase|undefined}
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

    /**
     * Event keys that correspond to modifiable styles
     * @type {Array<string>}
     * @protected
     */
    this.styleChangeKeys = ['opacity', 'brightness', 'contrast', 'saturation', 'sharpness'];

    this.onPrimitiveReady_ = this.onPrimitiveReadyInternal.bind(this);
    this.scene.primitives.add(this.collection_);

    this.imageListenKey;

    this.layerListenKey = listen(this.layer, googEventsEventType.PROPERTYCHANGE, this.onLayerPropertyChange, this);
    if (this.source_) {
      this.sourceListenKey = listen(this.source_, EventType.CHANGE, this.syncInternal, this);
    }
    mapContainer.getInstance().listen(MapEvent.VIEW_CHANGE, this.onSyncChange, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    unlistenByKey(this.layerListenKey);
    unlistenByKey(this.sourceListenKey);
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

      var map = /** @type {OSMap} */ (mapContainer.getInstance().getMap());
      var viewExtent = map.getExtent();
      var mapZoom = map.getView().getZoom();

      if (!viewExtent || mapZoom == null) {
        // If required map properties aren't available, remove the image.
        this.removeImmediate_();
        return;
      }

      if (containsExtent(viewExtent, PROJECTION.getWorldExtent())) {
        // never allow an extent larger than the world to be requested
        return;
      }

      // We always want to use EPSG:4326 in Cesium so the image will be rendered properly on the map. Other projections
      // may shift the image so it appears in the wrong location. Transform the extent to degrees and normalize across
      // the antimeridian
      viewExtent = transformExtent(viewExtent, PROJECTION, osProj.EPSG4326);
      viewExtent = osExtent.normalize(viewExtent, -360, 0);

      var epsg4326 = get(osProj.EPSG4326);
      var resolution = zoomToResolution(mapZoom, epsg4326);

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

        // Request the image through the OL source, reprojecting to EPSG:4326 if necessary.
        img = this.source_.getImage(viewExtent, resolution, window.devicePixelRatio, epsg4326);

        if (img) {
          var imageState = img.getState();
          if (img !== this.image_) {
            if (this.image_) {
              unlistenByKey(this.imageListenKey);
            }

            if (imageState != ImageState.LOADED && imageState != ImageState.ERROR) {
              this.imageListenKey = listen(img, EventType.CHANGE, this.onSyncChange, this);
            }

            if (imageState == ImageState.IDLE) {
              img.load();
            }

            this.image_ = img;
          }

          // Don't continue unless the image is loaded.
          if (imageState !== ImageState.LOADED) {
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

      if (this.lastExtent_) {
        for (var i = 0, n = viewExtent.length; i < n; i++) {
          if (Math.abs(viewExtent[i] - this.lastExtent_[i]) > geo.EPSILON) {
            this.lastExtent_[i] = viewExtent[i];
            changed = true;
          }
        }
      } else {
        this.lastExtent_ = viewExtent.slice();
        changed = true;
      }

      if (url && viewExtent) {
        if (changed) {
          //
          // Compute min/max x/y values to create a Cesium Rectangle. This corrects for a few things:
          //  - East/west values are expected to be between -180 and +180, and a rectangle spanning the antimeridian
          //    will have values where west > east. Normalize the longitudes to account for this.
          //  - Cesium will not create the geometry if north/south or east/west values are within a given threshold of
          //    each other. Use Cesium's epsilon value to ensure this doesn't happen.
          //
          var minX = normalizeLongitude(viewExtent[0], undefined, undefined, osProj.EPSG4326);
          var minY = viewExtent[1];
          var maxX = normalizeLongitude(viewExtent[2] - Cesium.Math.EPSILON8, undefined, undefined, osProj.EPSG4326);
          var maxY = viewExtent[3] - Cesium.Math.EPSILON8;

          var primitive = new Cesium.GroundPrimitive({
            geometryInstances: new Cesium.GeometryInstance({
              geometry: new Cesium.RectangleGeometry({
                rectangle: Cesium.Rectangle.fromDegrees(minX, minY, maxX, maxY)
              }),
              id: this.layer.getId() + '.' + (this.nextId_++)
            }),
            appearance: new Cesium.MaterialAppearance({
              material: this.createImageMaterial(el)
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
   * Create a Cesium material from an image
   *
   * @param {HTMLCanvasElement|HTMLVideoElement|Image} image
   * @return {Cesium.Material}
   */
  createImageMaterial(image) {
    return Cesium.Material.fromType('Image', {
      image: image,
      color: new Cesium.Color(1, 1, 1, this.layer.getOpacity())
    });
  }

  /**
   * Handle visibility
   *
   * @param {PropertyChangeEvent} event
   * @protected
   */
  onLayerPropertyChange(event) {
    if (event instanceof Event) {
      if (event.key == PropertyChange.VISIBLE) {
        this.syncInternal(true);
      } else if (this.styleChangeKeys.includes(event.key) && this.activePrimitive_) {
        this.activePrimitive_.appearance.material = this.createImageMaterial(this.image_.getImage());
        dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
      }
    }
  }
}
