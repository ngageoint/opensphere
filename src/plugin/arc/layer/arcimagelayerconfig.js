goog.declareModuleId('plugin.arc.layer.ArcImageLayerConfig');

import {transformExtent} from 'ol/src/proj.js';
import ImageArcGISRest from 'ol/src/source/ImageArcGISRest.js';
import AbstractLayerConfig from '../../../os/layer/config/abstractlayerconfig.js';
import Image from '../../../os/layer/image.js';
import {PROJECTION} from '../../../os/map/map.js';
import CrossOrigin from '../../../os/net/crossorigin.js';
import * as net from '../../../os/net/net.js';
import * as proj from '../../../os/proj/proj.js';


/**
 * Layer config for Arc image layers.
 */
class ArcImageLayerConfig extends AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Projection}
     * @protected
     */
    this.projection = null;

    /**
     * @type {?CrossOrigin}
     * @protected
     */
    this.crossOrigin = null;
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);

    var projection = proj.getBestSupportedProjection(options);
    if (!projection) {
      throw new Error('No projections supported by the layer are defined!');
    }
    this.projection = projection;

    // cross origin
    if (!net.isValidCrossOrigin(options['crossOrigin'])) {
      this.crossOrigin = /** @type {CrossOrigin} */ (net.getCrossOrigin(this.url));
    } else {
      this.crossOrigin = /** @type {CrossOrigin} */ (options['crossOrigin']);

      // register the cross origin value by URL pattern so that our Cesium.loadImage mixin can find it
      net.registerCrossOrigin(new RegExp('^' + this.url), this.crossOrigin);
    }

    // the correct none equivalent for crossOrigin in OL3 is null
    if (this.crossOrigin === CrossOrigin.NONE) {
      this.crossOrigin = null;
      options['crossOrigin'] = null;
    }
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    this.initializeConfig(options);

    var source = this.getSource(options);
    var imageOptions = /** @type {olx.layer.ImageOptions} */ ({
      source: source
    });
    var imageLayer = new Image(imageOptions);

    // image layers are hidden by default, we want this one to show
    imageLayer.setHidden(false);
    imageLayer.restore(options);

    let extent = /** @type {ol.Extent} */ (options['extent']);
    if (extent) {
      const extentProjection = /** @type {ol.ProjectionLike} */ (options['extentProjection']);
      if (extentProjection) {
        extent = transformExtent(extent, extentProjection, PROJECTION);
      }

      imageLayer.setExtent(extent);
    }

    return imageLayer;
  }

  /**
   * Creates a configured Arc Image source.
   * @param {Object<string, *>} options
   * @return {ImageArcGISRest}
   * @protected
   */
  getSource(options) {
    var arcOptions = /** @type {olx.source.ImageArcGISRestOptions} */ ({
      url: this.url,
      ratio: 1, // this ratio value defaults to 1.5 for some reason, which blows up Cesium, set it to 1
      projection: this.projection,
      crossOrigin: this.crossOrigin
    });

    return new ImageArcGISRest(arcOptions);
  }
}


/**
 * Arc image layer config ID.
 * @type {string}
 */
ArcImageLayerConfig.ID = 'arcimage';


export default ArcImageLayerConfig;
