goog.declareModuleId('plugin.cesium.sync.ImageStaticSynchronizer');

import OLEventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import ImageState from 'ol/src/ImageState.js';
import {ObjectEvent} from 'ol/src/Object.js';
import {transformExtent} from 'ol/src/proj.js';
import olSourceImageStatic from 'ol/src/source/ImageStatic.js';

import * as dispatcher from '../../../os/dispatcher.js';
import LayerPropertyChange from '../../../os/layer/propertychange.js';
import {PROJECTION} from '../../../os/map/map.js';
import MapEvent from '../../../os/map/mapevent.js';
import * as osProj from '../../../os/proj/proj.js';
import ImageStatic from '../../../os/source/imagestatic.js';
import CesiumSynchronizer from './cesiumsynchronizer.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: ImageLayer} = goog.requireType('os.layer.Image');


/**
 * Synchronizes a single OpenLayers ImageStatic source to Cesium
 *
 * @extends {CesiumSynchronizer<ImageLayer>}
 */
export default class ImageStaticSynchronizer extends CesiumSynchronizer {
  /**
   * Constructor.
   * @param {!OLImageLayer} layer The OpenLayers image layer
   * @param {!PluggableMap} map The map
   * @param {!Cesium.Scene} scene
   */
  constructor(layer, map, scene) {
    super(layer, map, scene);

    /**
     * @type {ImageSource}
     * @protected
     */
    this.source = this.layer.getSource();


    /**
     * @type {ImageBase}
     * @protected
     */
    this.image;

    /**
     * @type {Cesium.Primitive}
     * @protected
     */
    this.primitive;

    /**
     * Event keys that correspond to modifiable styles
     * @type {Array<string>}
     * @protected
     */
    this.styleChangeKeys = ['opacity', 'brightness', 'contrast', 'saturation', 'sharpness'];

    this.layerListenKey = listen(this.layer, GoogEventType.PROPERTYCHANGE, this.onLayerPropertyChange, this);

    this.imageListenKey;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.resetInternal();
    this.source = null;
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  synchronize() {
    if (!this.image) {
      if (!(this.source instanceof olSourceImageStatic)) {
        return;
      }

      this.image = this.source.image_;
      this.imageListenKey = listen(this.image, OLEventType.CHANGE, this.synchronize, this);
    }

    if (this.source instanceof ImageStatic) {
      // This source supports rotation and must be loaded first. Other source types such as olSourceImageStatic
      // can pass the img.src parameter through to the Cesium material.
      if (this.image.getState() === ImageState.IDLE) {
        this.image.load();
      }

      if (this.image.getState() !== ImageState.LOADED) {
        return;
      }

      if (this.image !== this.source.rotatedImage) {
        unlistenByKey(this.imageListenKey);
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

    var extent = transformExtent(this.image.getExtent(), PROJECTION, osProj.EPSG4326);

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
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.resetInternal();
    this.synchronize();
  }

  /**
   * @protected
   */
  resetInternal() {
    if (this.image) {
      unlistenByKey(this.imageListenKey);
      this.image = null;
    }

    if (this.primitive) {
      this.scene.primitives.remove(this.primitive);
      this.primitive = null;
    }
  }

  /**
   * Handle visibility
   *
   * @param {PropertyChangeEvent} event
   * @protected
   */
  onLayerPropertyChange(event) {
    if (this.primitive && event instanceof ObjectEvent) {
      if (event.key == LayerPropertyChange.VISIBLE) {
        this.primitive.show = this.layer.getVisible();
      } else if (this.styleChangeKeys.includes(event.key)) {
        if (event.key == 'opacity') {
          this.primitive.appearance.material.uniforms.color.alpha = this.layer.getOpacity();
        } else {
          this.primitive.appearance.material.uniforms.image = this.image.getImage();
        }
      }
      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }
}
