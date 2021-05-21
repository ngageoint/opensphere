goog.module('plugin.arc.layer.ArcImageLayerConfig');

const ImageArcGISRest = goog.require('ol.source.ImageArcGISRest');
const Image = goog.require('os.layer.Image');
const AbstractLayerConfig = goog.require('os.layer.config.AbstractLayerConfig');
const net = goog.require('os.net');
const CrossOrigin = goog.require('os.net.CrossOrigin');
const proj = goog.require('os.proj');

const Projection = goog.requireType('ol.proj.Projection');


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


exports = ArcImageLayerConfig;
