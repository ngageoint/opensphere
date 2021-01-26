goog.provide('plugin.arc.layer.ArcImageLayerConfig');

goog.require('ol.proj.Projection');
goog.require('ol.source.ImageArcGISRest');
goog.require('os.layer.Image');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('os.net');
goog.require('os.net.CrossOrigin');
goog.require('os.proj');
goog.require('plugin.arc.layer.AnimatedArcTile');
goog.require('plugin.arc.source.ArcTileSource');



/**
 * Layer config for Arc image layers.
 *
 * @extends {os.layer.config.AbstractLayerConfig}
 * @constructor
 */
plugin.arc.layer.ArcImageLayerConfig = function() {
  plugin.arc.layer.ArcImageLayerConfig.base(this, 'constructor');

  /**
   * @type {ol.proj.Projection}
   * @protected
   */
  this.projection = null;

  /**
   * @type {?os.net.CrossOrigin}
   * @protected
   */
  this.crossOrigin = null;
};
goog.inherits(plugin.arc.layer.ArcImageLayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * Arc image layer config ID.
 * @type {string}
 */
plugin.arc.layer.ArcImageLayerConfig.ID = 'arcimage';


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcImageLayerConfig.prototype.initializeConfig = function(options) {
  plugin.arc.layer.ArcImageLayerConfig.base(this, 'initializeConfig', options);

  var projection = os.proj.getBestSupportedProjection(options);
  if (!projection) {
    throw new Error('No projections supported by the layer are defined!');
  }
  this.projection = projection;

  // cross origin
  if (!os.net.isValidCrossOrigin(options['crossOrigin'])) {
    this.crossOrigin = /** @type {os.net.CrossOrigin} */ (os.net.getCrossOrigin(this.url));
  } else {
    this.crossOrigin = /** @type {os.net.CrossOrigin} */ (options['crossOrigin']);

    // register the cross origin value by URL pattern so that our Cesium.loadImage mixin can find it
    os.net.registerCrossOrigin(new RegExp('^' + this.url), this.crossOrigin);
  }

  // the correct none equivalent for crossOrigin in OL3 is null
  if (this.crossOrigin === os.net.CrossOrigin.NONE) {
    this.crossOrigin = null;
    options['crossOrigin'] = null;
  }
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcImageLayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  var source = this.getSource(options);
  var imageOptions = /** @type {olx.layer.ImageOptions} */ ({
    source: source
  });
  var imageLayer = new os.layer.Image(imageOptions);

  // image layers are hidden by default, we want this one to show
  imageLayer.setHidden(false);
  imageLayer.restore(options);
  return imageLayer;
};


/**
 * Creates a configured Arc Image source.
 * @param {Object<string, *>} options
 * @return {ol.source.ImageArcGISRest}
 * @protected
 */
plugin.arc.layer.ArcImageLayerConfig.prototype.getSource = function(options) {
  var arcOptions = /** @type {olx.source.ImageArcGISRestOptions} */ ({
    url: this.url,
    ratio: 1, // this ratio value defaults to 1.5 for some reason, which blows up Cesium, set it to 1
    projection: this.projection,
    crossOrigin: this.crossOrigin
  });

  return new ol.source.ImageArcGISRest(arcOptions);
};
